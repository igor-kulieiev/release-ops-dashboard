import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/lib/useToast';
import {
	PLATFORM_FIELDS,
	type ReleasePlatform,
	type ReleaseTaskListResponse,
	type ReleaseTaskPatchRequest,
} from '../api/release-types';
import { patchReleaseTask } from '../api/task';
import { findTaskRowInCache, mergeRowInCache } from '../cache';

type PatchVars = {
	row: ReleaseTaskListResponse;
	body: ReleaseTaskPatchRequest;
	optimistic: Partial<ReleaseTaskListResponse>;
};

/**
 * Owns every write to a `release_tasks` row: owner/status/ticket edits. All three go through the
 * same PATCH endpoint, so they share one mutation — but each call's optimistic snapshot/rollback
 * is scoped to *only the fields that call is changing*, not the whole cached page. That's the
 * fix for a real race: the old whole-page snapshot meant that if mutation A (say, a status edit)
 * failed after mutation B (a user's owner-change on the same or a different row) had already
 * optimistically landed, A's rollback restored a page snapshot taken *before* B existed —
 * silently erasing B's change even though B's own write might have already succeeded
 * server-side. Field-scoped rollback can only ever touch the fields it itself set.
 */
export function useTaskMutations() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const patchMutation = useMutation({
		mutationFn: (vars: PatchVars) => patchReleaseTask(vars.body),
		onMutate: (vars) => {
			const previousFields: Partial<ReleaseTaskListResponse> = {};
			const row = findTaskRowInCache(queryClient, vars.row.eventId);
			if (row) {
				for (const key of Object.keys(vars.optimistic)) {
					(previousFields as Record<string, unknown>)[key] = (
						row as unknown as Record<string, unknown>
					)[key];
				}
			}
			mergeRowInCache(queryClient, vars.row.eventId, vars.optimistic);
			return { previousFields, eventId: vars.row.eventId };
		},
		onSuccess: (response, vars) => {
			// Scoped to just the fields this call optimistically set — same reasoning as
			// onMutate/onError above. Merging the whole response would let this call's server
			// state clobber a different, still-in-flight mutation's optimistic field on the same
			// row (e.g. this call's response predates a concurrent status edit reaching the
			// server, so it still carries the old status and would revert it here).
			const confirmed: Partial<ReleaseTaskListResponse> = {};
			for (const key of Object.keys(vars.optimistic)) {
				(confirmed as Record<string, unknown>)[key] = (
					response as unknown as Record<string, unknown>
				)[key];
			}
			mergeRowInCache(queryClient, vars.row.eventId, confirmed);
		},
		onError: (err, _vars, ctx) => {
			if (ctx)
				mergeRowInCache(queryClient, ctx.eventId, ctx.previousFields);
			showToast(
				'Update failed',
				err instanceof Error ? err.message : 'Please try again.',
			);
		},
	});

	const handleOwnerChange = (
		row: ReleaseTaskListResponse,
		ownerId: number | null,
	) => {
		if (row.groupId == null) return;
		// ownerId is tri-state on the wire — sending `null` here (not omitting the key) is what
		// actually clears it back to unassigned; omitting it would just leave the old value.
		patchMutation.mutate({
			row,
			body: { accountId: row.accountId, groupId: row.groupId, ownerId },
			optimistic: { ownerId },
		});
	};

	const handleStatusChange = (
		row: ReleaseTaskListResponse,
		platform: ReleasePlatform,
		status: string | null,
	) => {
		if (row.groupId == null) return;
		const field = PLATFORM_FIELDS[platform].taskStatus;
		patchMutation.mutate({
			row,
			body: {
				accountId: row.accountId,
				groupId: row.groupId,
				[field]: status ?? '',
			},
			optimistic: { [field]: status },
		});
	};

	const handleTicketsChange = (
		row: ReleaseTaskListResponse,
		tickets: string[],
	) => {
		if (row.groupId == null) return;
		patchMutation.mutate({
			row,
			body: {
				accountId: row.accountId,
				groupId: row.groupId,
				zendeskTicketsList: tickets,
			},
			optimistic: { zendeskTicketsList: tickets },
		});
	};

	return {
		handleOwnerChange,
		handleStatusChange,
		handleTicketsChange,
	};
}
