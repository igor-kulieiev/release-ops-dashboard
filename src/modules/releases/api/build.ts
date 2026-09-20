import {
	type ApiFetchOptions,
	apiFetch,
	parseApiError,
} from '@/lib/api/client';
import type {
	ReleaseBuildStatusRequest,
	ReleaseBuildStatusResponse,
	ReleaseBuildTriggerRequest,
	ReleaseBuildTriggerResponse,
} from './release-types';

/** Triggers a CircleCI build for the (accountId, groupId) app and persists the result server-side. */
export async function triggerReleaseBuild(
	body: ReleaseBuildTriggerRequest,
	options?: ApiFetchOptions,
): Promise<ReleaseBuildTriggerResponse> {
	const response = await apiFetch(
		'/api/release/events/apps/build',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		},
		options,
	);
	if (!response.ok) {
		throw await parseApiError(
			response,
			'POST /api/release/events/apps/build',
		);
	}
	return (await response.json()) as ReleaseBuildTriggerResponse;
}

/**
 * Re-queries CircleCI for `buildNum`'s current status. Not keyed by (accountId, groupId) — the
 * row and platform are resolved server-side purely from which of `ios_build_num`/
 * `android_build_num` matches.
 *
 * Currently unused by anything in the app on purpose — the backend now keeps `release_tasks`'
 * stored build status current via its own CircleCI webhook, so nothing here needs to call
 * CircleCI directly anymore. Kept for the planned "Sync status" button, which will call this on
 * demand; don't remove it as dead code.
 */
export async function refreshReleaseBuildStatus(
	body: ReleaseBuildStatusRequest,
	options?: ApiFetchOptions,
): Promise<ReleaseBuildStatusResponse> {
	const response = await apiFetch(
		'/api/release/events/apps/status',
		{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		},
		options,
	);
	if (!response.ok) {
		throw await parseApiError(
			response,
			'PUT /api/release/events/apps/status',
		);
	}
	return (await response.json()) as ReleaseBuildStatusResponse;
}
