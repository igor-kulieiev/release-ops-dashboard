import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
	type ApiFetchOptions,
	apiFetch,
	parseApiError,
} from '@/lib/api/client';
import type {
	ReleaseTaskPatchRequest,
	ReleaseTaskResponse,
	ReleaseTasksPage,
	ReleaseTasksParams,
} from './release-types';

// Base params for every GET /apps call -- useTasks.ts adds the current from/to on top. The
// service paginates in memory over the date-range-scoped set, so `size` here is just the page
// size used to walk every page under the hood (see fetchReleaseTasks), not a cap on what's shown.
export const TASKS_PARAMS: ReleaseTasksParams = { page: 0, size: 200 };

function releaseTasksQueryString(params: ReleaseTasksParams): string {
	const query = new URLSearchParams();
	if (params.from) query.set('from', params.from);
	if (params.to) query.set('to', params.to);
	if (params.search) query.set('search', params.search);
	query.set('page', String(params.page));
	query.set('size', String(params.size));
	return `?${query}`;
}

async function fetchReleaseTasksPage(
	params: ReleaseTasksParams,
	options?: ApiFetchOptions,
): Promise<ReleaseTasksPage> {
	const path = `/api/release/events/apps${releaseTasksQueryString(params)}`;
	const response = await apiFetch(path, {}, options);
	if (!response.ok) {
		throw await parseApiError(response, 'GET /api/release/events/apps');
	}
	return (await response.json()) as ReleaseTasksPage;
}

/**
 * Fetches every page of the result, not just the first — owner/search/sort filter client-side
 * over the full date-range-scoped set, so stopping at one page would silently drop rows once the
 * dataset outgrows it. The first page's `total`/`size` say exactly how many more pages exist, so
 * the rest fetch in parallel (not a sequential waterfall) rather than paging one at a time.
 */
export async function fetchReleaseTasks(
	params: ReleaseTasksParams,
	options?: ApiFetchOptions,
): Promise<ReleaseTasksPage> {
	const first = await fetchReleaseTasksPage(params, options);
	if (first.size <= 0 || first.items.length >= first.total) return first;
	const pageCount = Math.ceil(first.total / first.size);
	const rest = await Promise.all(
		Array.from({ length: pageCount - 1 }, (_, i) =>
			fetchReleaseTasksPage({ ...params, page: i + 1 }, options),
		),
	);
	return { ...first, items: [first, ...rest].flatMap((p) => p.items) };
}

/**
 * Backed by the upstream events datastore and filtered in memory server-side — responses can be slow, so cache pages
 * for 30s and keep the previous page visible while the next one loads (no table blanking).
 *
 * `refetchOnWindowFocus` is on (TanStack Query's default) rather than disabled: build/task
 * status changes server-side via CircleCI's webhook, with nothing client-side polling for it, so
 * a tab left open across a build finishing would otherwise show stale status indefinitely.
 * Refetching on focus is the cheap fix — catches up the moment someone tabs back — without the
 * cost of actual polling; `staleTime` above still avoids a redundant refetch on a focus that
 * happens within 30s of the last one.
 */
export function releaseTasksQueryOptions(params: ReleaseTasksParams) {
	return queryOptions({
		queryKey: ['release', 'tasks', params] as const,
		queryFn: (): Promise<ReleaseTasksPage> => fetchReleaseTasks(params),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});
}

/**
 * Upserts a `release_tasks` row keyed by (accountId, groupId). True PATCH semantics: only the fields
 * present in `body` are written — see `ReleaseTaskPatchRequest` for the per-field "omit to leave
 * untouched" contract (and the fields that, once set, can never be cleared back to `null`).
 */
export async function patchReleaseTask(
	body: ReleaseTaskPatchRequest,
	options?: ApiFetchOptions,
): Promise<ReleaseTaskResponse> {
	const response = await apiFetch(
		'/api/release/events/apps',
		{
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		},
		options,
	);
	if (!response.ok) {
		throw await parseApiError(response, 'PATCH /api/release/events/apps');
	}
	return (await response.json()) as ReleaseTaskResponse;
}
