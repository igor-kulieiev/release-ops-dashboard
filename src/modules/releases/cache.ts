import type { QueryClient } from '@tanstack/react-query';
import type {
	ReleaseTaskListResponse,
	ReleaseTasksPage,
} from './api/release-types';

/** Prefix shared by every `release/tasks` list query (see `releaseTasksQueryOptions`) regardless
 * of its `from`/`to`/`search` params — matching on this rather than one frozen full key is what
 * lets `mergeRowInCache`/`findTaskRowInCache` reach the *actual* cache entry the dashboard is
 * currently reading, whatever date range is active, instead of only the no-filter one. */
const TASKS_QUERY_KEY_PREFIX = ['release', 'tasks'] as const;

/** Reads a row straight out of whichever cached tasks-list query currently has it — used to take
 * an optimistic-update snapshot for rollback. */
export function findTaskRowInCache(
	queryClient: QueryClient,
	eventId: number,
): ReleaseTaskListResponse | undefined {
	const entries = queryClient.getQueriesData<ReleaseTasksPage>({
		queryKey: TASKS_QUERY_KEY_PREFIX,
	});
	for (const [, page] of entries) {
		const row = page?.items.find((item) => item.eventId === eventId);
		if (row) return row;
	}
	return undefined;
}

/** Merges `overrides` into the matching cached row, across every cached tasks-list query (one per
 * distinct date-range/search filter the user has visited) — the one place that knows how the
 * tasks page is shaped, used for optimistic updates and for reconciling server-confirmed values
 * (build trigger response, task-status sync) alike. */
export function mergeRowInCache(
	queryClient: QueryClient,
	eventId: number,
	overrides: Partial<ReleaseTaskListResponse>,
): void {
	queryClient.setQueriesData<ReleaseTasksPage>(
		{ queryKey: TASKS_QUERY_KEY_PREFIX },
		(page) => {
			if (!page) return page;
			return {
				...page,
				items: page.items.map((item) =>
					item.eventId === eventId ? { ...item, ...overrides } : item,
				),
			};
		},
	);
}
