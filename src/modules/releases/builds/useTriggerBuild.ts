import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/lib/useToast';
import { triggerReleaseBuild } from '../api/build';
import {
	type AndroidBuildTypeLabel,
	type IosBuildTypeLabel,
	PLATFORM_FIELDS,
	type ReleaseBuildTriggerRequest,
	type ReleasePlatform,
	type ReleaseTaskListResponse,
} from '../api/release-types';
import { mergeRowInCache } from '../cache';

function triggerKey(eventId: number, platform: ReleasePlatform): string {
	return `${eventId}:${platform}`;
}

/**
 * Triggers a CircleCI build and tracks which (eventId, platform) pairs currently have a trigger
 * in flight. The response is this build's own data — accountId/groupId/buildType are already
 * known from the request, and buildStatus/buildLink/buildNum/taskStatus come straight back from
 * it, so there's nothing to search for or derive client-side; merge it into the cache and the
 * backend's own CircleCI webhook keeps both buildStatus and taskStatus current from here on.
 */
export function useTriggerBuild() {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	// Which (eventId, platform) pairs currently have a trigger in flight — tracked explicitly
	// here rather than read off triggerBuildMutation.isPending/.variables. A single shared
	// mutation object's isPending/variables only ever reflect the *latest* .mutate() call: if
	// build A is triggered, then build B on a different row/platform is triggered before A
	// settles, `.variables` now points at B — so A's "still running" spinner would incorrectly
	// disappear (and its button re-enable) even though A is genuinely still in flight. This set
	// tracks every in-flight trigger independently, so each row/platform's own state is always
	// correct regardless of what else is running concurrently.
	const [triggeringKeys, setTriggeringKeys] = useState<Set<string>>(
		new Set(),
	);
	const isTriggering = (
		eventId: number,
		platform: ReleasePlatform,
	): boolean => triggeringKeys.has(triggerKey(eventId, platform));

	type TriggerVars = {
		row: ReleaseTaskListResponse;
		platform: ReleasePlatform;
		buildType: IosBuildTypeLabel | AndroidBuildTypeLabel;
		body: ReleaseBuildTriggerRequest;
	};

	const triggerBuildMutation = useMutation({
		mutationFn: (vars: TriggerVars) => triggerReleaseBuild(vars.body),
		onSuccess: (response, vars) => {
			const fields = PLATFORM_FIELDS[vars.platform];
			mergeRowInCache(queryClient, vars.row.eventId, {
				[fields.buildType]: vars.buildType,
				[fields.buildStatus]: response.buildStatus,
				[fields.buildLink]: response.buildLink,
				[fields.buildNum]: response.buildNum,
				[fields.taskStatus]: response.taskStatus,
			});
			showToast('Build triggered', `${vars.buildType} was started.`);
		},
		onError: (err) => {
			showToast(
				'Build failed to start',
				err instanceof Error ? err.message : 'Please try again.',
			);
		},
		onSettled: (_data, _err, vars) => {
			setTriggeringKeys((prev) => {
				const next = new Set(prev);
				next.delete(triggerKey(vars.row.eventId, vars.platform));
				return next;
			});
		},
	});

	const handleTriggerBuild = (
		row: ReleaseTaskListResponse,
		platform: ReleasePlatform,
		buildType: IosBuildTypeLabel | AndroidBuildTypeLabel,
	) => {
		if (row.groupId == null) return;
		// Not a PLATFORM_FIELDS lookup like onSuccess above: ReleaseBuildTriggerRequest's two branches
		// each have a *different* key name present at all (iosBuildType XOR androidBuildType, see
		// its own doc comment), not the same key holding a different value — nothing to look up.
		const body: ReleaseBuildTriggerRequest =
			platform === 'ios'
				? {
						accountId: row.accountId,
						groupId: row.groupId,
						iosBuildType: buildType as IosBuildTypeLabel,
					}
				: {
						accountId: row.accountId,
						groupId: row.groupId,
						androidBuildType: buildType as AndroidBuildTypeLabel,
					};
		setTriggeringKeys((prev) =>
			new Set(prev).add(triggerKey(row.eventId, platform)),
		);
		triggerBuildMutation.mutate({ row, platform, buildType, body });
	};

	return { handleTriggerBuild, isTriggering };
}
