import { useNavigate, useSearch } from '@tanstack/react-router';
import type { DateRangeState, SortState } from '../types';

// Radix Select item values can't be an empty string, so the "no explicit sort column"/"no
// owner filter" defaults need a non-empty sentinel, translated back to null/undefined at the
// call site.
export const EVENT_DATE_SORT = '__event_date__';
export const ALL_OWNERS = '__all__';

export const SORT_OPTIONS = [
	{ value: EVENT_DATE_SORT, label: 'Sort by Event Date' },
	{ value: 'releaseApp', label: 'Sort by App Name' },
	{ value: 'owner', label: 'Sort by Owner' },
];

/**
 * The dashboard's filter/sort state — read from and written to the URL's typed search params
 * (see app/router.tsx) instead of component state, so a refresh or a shared link reproduces the
 * exact same filtered view. Every setter replaces (never pushes) history, so filtering doesn't
 * spam the back button, and omits its own param when set back to the default.
 */
export function useFilters() {
	const search = useSearch({ from: '/' });
	const navigate = useNavigate({ from: '/' });

	const setSearch = (value: string) =>
		navigate({
			search: (prev) => ({ ...prev, q: value || undefined }),
			replace: true,
		});

	const setOwnerFilter = (ownerId: number | null) =>
		navigate({
			search: (prev) => ({ ...prev, owner: ownerId ?? undefined }),
			replace: true,
		});

	const setSortBy = (sort: SortState) =>
		navigate({
			search: (prev) => ({
				...prev,
				sort: sort.column ?? undefined,
				dir: sort.direction === 'desc' ? 'desc' : undefined,
			}),
			replace: true,
		});

	const setDateRange = (range: DateRangeState) =>
		navigate({
			search: (prev) => ({
				...prev,
				from: range.from || undefined,
				to: range.to || undefined,
			}),
			replace: true,
		});

	return {
		search: search.q ?? '',
		ownerFilter: search.owner ?? null,
		sortBy: {
			column: search.sort ?? null,
			direction:
				search.dir === 'desc' ? ('desc' as const) : ('asc' as const),
		} satisfies SortState,
		dateRange: {
			from: search.from ?? '',
			to: search.to ?? '',
		} satisfies DateRangeState,
		setSearch,
		setOwnerFilter,
		setSortBy,
		setDateRange,
	};
}
