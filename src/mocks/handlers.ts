import { delay, HttpResponse, http } from 'msw';
import type {
	ReleaseBuildStatusRequest,
	ReleaseBuildStatusResponse,
	ReleaseBuildTriggerRequest,
	ReleaseBuildTriggerResponse,
	ReleaseTaskListResponse,
	ReleaseTaskPatchRequest,
	ReleaseTaskResponse,
	ReleaseTasksPage,
} from '@/modules/releases/api/release-types';
import { OWNERS, releaseTasks } from './data';

/** Random-ish but bounded — enough to make loading states/optimistic updates visible without
 * making the demo feel slow. */
function networkDelay(): Promise<void> {
	return delay(200 + Math.random() * 300);
}

function toISODate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Mirrors the frontend's own Monday-start week helper (see modules/releases/format.ts) — the
 * server needs the same definition of "this week" for the omitted-from/to default. */
function thisWeekRange(): { from: string; to: string } {
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const day = now.getDay();
	const monday = new Date(now);
	monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	return { from: toISODate(monday), to: toISODate(sunday) };
}

function findRow(
	accountId: number,
	groupId: number | null,
): ReleaseTaskListResponse | undefined {
	return releaseTasks.find(
		(r) => r.accountId === accountId && r.groupId === groupId,
	);
}

function toTaskResponse(row: ReleaseTaskListResponse): ReleaseTaskResponse {
	const {
		eventId: _eventId,
		eventName: _eventName,
		eventStartDate: _eventStartDate,
		eventEndDate: _eventEndDate,
		storeSettingsUrl: _storeSettingsUrl,
		appleDevAccount: _appleDevAccount,
		googleDevAccount: _googleDevAccount,
		appName: _appName,
		...task
	} = row;
	return task;
}

export const handlers = [
	http.get('/api/release/events/apps', async ({ request }) => {
		await networkDelay();
		const url = new URL(request.url);
		const params = url.searchParams;
		const fromParam = params.get('from');
		const toParam = params.get('to');
		const { from, to } =
			fromParam || toParam
				? {
						from: fromParam ?? '0000-00-00',
						to: toParam ?? '9999-99-99',
					}
				: thisWeekRange();
		const page = Number(params.get('page') ?? '0');
		const size = Math.min(Number(params.get('size') ?? '200'), 200);

		const filtered = releaseTasks.filter((row) => {
			const date = row.eventStartDate;
			if (!date) return false;
			return date >= from && date <= to;
		});

		const start = page * size;
		const items = filtered.slice(start, start + size);
		const body: ReleaseTasksPage = {
			total: filtered.length,
			page,
			size,
			items,
		};
		return HttpResponse.json(body);
	}),

	http.get('/api/release/events/owners', async () => {
		await networkDelay();
		return HttpResponse.json(OWNERS);
	}),

	http.patch('/api/release/events/apps', async ({ request }) => {
		await networkDelay();
		const body = (await request.json()) as ReleaseTaskPatchRequest;
		const row = findRow(body.accountId, body.groupId);
		if (!row) {
			return HttpResponse.json(
				{ error: 'No release task found for that account/group.' },
				{ status: 404 },
			);
		}
		if ('ownerId' in body) {
			if (
				body.ownerId != null &&
				!OWNERS.some((o) => o.id === body.ownerId)
			) {
				return HttpResponse.json(
					{ error: 'ownerId must reference an existing owner' },
					{ status: 400 },
				);
			}
			row.ownerId = body.ownerId ?? null;
			row.releaseTaskOwnerName =
				OWNERS.find((o) => o.id === row.ownerId)?.name ?? null;
		}
		for (const key of [
			'iosTaskStatus',
			'iosBuildStatus',
			'iosBuildType',
			'iosBuildLink',
			'iosBuildNum',
			'androidTaskStatus',
			'androidBuildStatus',
			'androidBuildType',
			'androidBuildLink',
			'androidBuildNum',
		] as const) {
			if (key in body) {
				// @ts-expect-error -- tri-state PATCH: assigning the request's own value for this field.
				row[key] = body[key] ?? null;
			}
		}
		if ('zendeskTicketsList' in body) {
			row.zendeskTicketsList = body.zendeskTicketsList ?? [];
		}
		return HttpResponse.json(toTaskResponse(row));
	}),

	http.post('/api/release/events/apps/build', async ({ request }) => {
		await networkDelay();
		const body = (await request.json()) as ReleaseBuildTriggerRequest;
		const row = findRow(body.accountId, body.groupId);
		if (!row) {
			return HttpResponse.json(
				{ error: 'No release task found for that account/group.' },
				{ status: 404 },
			);
		}
		const buildNum = Math.floor(Math.random() * 90000) + 10000;
		const platform = 'iosBuildType' in body ? 'ios' : 'android';
		const buildType =
			platform === 'ios' ? body.iosBuildType : body.androidBuildType;
		const buildLink = `https://circleci.example.com/pipelines/demo/${platform}/${buildNum}`;

		row.iosTaskStatus =
			platform === 'ios' ? 'In progress' : row.iosTaskStatus;
		row.androidTaskStatus =
			platform === 'android' ? 'In progress' : row.androidTaskStatus;
		if (platform === 'ios') {
			row.iosBuildType = buildType ?? null;
			row.iosBuildStatus = 'running';
			row.iosBuildLink = buildLink;
			row.iosBuildNum = buildNum;
		} else {
			row.androidBuildType = buildType ?? null;
			row.androidBuildStatus = 'running';
			row.androidBuildLink = buildLink;
			row.androidBuildNum = buildNum;
		}

		// Simulates the real system's CircleCI webhook: the build "finishes" a few seconds later so
		// a refetch (e.g. TanStack Query's refetchOnWindowFocus) picks up a terminal status, the
		// same way the real backend's webhook-driven state would.
		setTimeout(
			() => {
				const outcome = Math.random() < 0.85 ? 'success' : 'failed';
				if (platform === 'ios' && row.iosBuildNum === buildNum) {
					row.iosBuildStatus = outcome;
					row.iosTaskStatus =
						outcome === 'success' ? 'Success' : 'Failed';
				} else if (
					platform === 'android' &&
					row.androidBuildNum === buildNum
				) {
					row.androidBuildStatus = outcome;
					row.androidTaskStatus =
						outcome === 'success' ? 'Success' : 'Failed';
				}
			},
			4000 + Math.random() * 3000,
		);

		const response: ReleaseBuildTriggerResponse = {
			buildLink,
			buildStatus: 'running',
			buildNum,
			taskStatus: 'In progress',
		};
		return HttpResponse.json(response);
	}),

	http.put('/api/release/events/apps/status', async ({ request }) => {
		await networkDelay();
		const body = (await request.json()) as ReleaseBuildStatusRequest;
		const row = releaseTasks.find(
			(r) =>
				r.iosBuildNum === body.buildNum ||
				r.androidBuildNum === body.buildNum,
		);
		const buildStatus =
			row?.iosBuildNum === body.buildNum
				? row.iosBuildStatus
				: (row?.androidBuildStatus ?? null);
		const response: ReleaseBuildStatusResponse = {
			buildStatus: buildStatus ?? 'not_run',
		};
		return HttpResponse.json(response);
	}),
];
