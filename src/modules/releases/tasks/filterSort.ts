import type { ReleaseTaskListResponse } from '../api/release-types';
import { compareString, matchesSearch } from '../domain';
import { appDisplayName } from '../format';
import type { SortState } from '../types';

// Pulled out of useTasks.ts's useMemo blocks into plain functions so they're unit-testable
// without React (see filterSort.test.ts) — useTasks.ts just wires these to hook state. Date
// range isn't filtered here: the backend now scopes GET /apps to the current date range itself
// (see useTasks.ts), so every row reaching this function is already in range.

export interface TaskFilters {
	ownerFilter: number | null;
	search: string;
}

export function filterTasks(
	data: ReleaseTaskListResponse[],
	{ ownerFilter, search }: TaskFilters,
): ReleaseTaskListResponse[] {
	return data.filter((d) => {
		if (ownerFilter != null && d.ownerId !== ownerFilter) return false;
		if (search && !matchesSearch(d, search)) return false;
		return true;
	});
}

export function sortTasks(
	filtered: ReleaseTaskListResponse[],
	sortBy: SortState,
	ownerName: (ownerId: number | null) => string | null,
): ReleaseTaskListResponse[] {
	const arr = [...filtered];
	const dir = sortBy.direction === 'asc' ? 1 : -1;
	const dateKey = (d: ReleaseTaskListResponse) =>
		d.eventStartDate ?? '9999-12-31';

	if (!sortBy.column) {
		arr.sort((a, b) => dateKey(a).localeCompare(dateKey(b)) * dir);
		return arr;
	}

	arr.sort((a, b) => {
		let cmp = 0;
		switch (sortBy.column) {
			case 'releaseApp':
				cmp = appDisplayName(a).localeCompare(appDisplayName(b));
				break;
			case 'owner':
				cmp = compareString(ownerName(a.ownerId), ownerName(b.ownerId));
				break;
		}
		if (cmp === 0) cmp = dateKey(a).localeCompare(dateKey(b));
		return cmp * dir;
	});
	return arr;
}
