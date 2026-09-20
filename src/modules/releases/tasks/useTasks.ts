import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { releaseTasksQueryOptions, TASKS_PARAMS } from '../api/task';
import { useFilters } from '../filters/useFilters';
import { useOwners } from '../owners/useOwners';
import { filterTasks, sortTasks } from './filterSort';

/**
 * The task list query plus the derived filtered/sorted view. Owner/search/sort stay client-side
 * filters over whatever's cached (see useFilters, URL-backed); the date range is different -- it
 * drives the actual server query, since the backend now selects each account's one qualifying
 * event *within* that range (an account with nothing in range simply isn't returned at all), not
 * a view filter over an otherwise-fixed result set. Omitting both bounds (the default, unfiltered
 * URL state) asks the backend for its own default range -- currently the current calendar week.
 * Nothing here mutates — see useTaskMutations/useTriggerBuild for writes.
 */
export function useTasks() {
	const { search, ownerFilter, sortBy, dateRange } = useFilters();
	const tasksQuery = useQuery(
		releaseTasksQueryOptions({
			...TASKS_PARAMS,
			from: dateRange.from || undefined,
			to: dateRange.to || undefined,
		}),
	);
	const { ownerName } = useOwners();
	const data = tasksQuery.data?.items ?? [];

	const filtered = useMemo(
		() => filterTasks(data, { ownerFilter, search }),
		[data, search, ownerFilter],
	);

	const sorted = useMemo(
		() => sortTasks(filtered, sortBy, ownerName),
		[filtered, sortBy, ownerName],
	);

	return { tasksQuery, data, sorted };
}
