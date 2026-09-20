import { ArrowDown, ArrowUp, Loader2, Search, User } from 'lucide-react';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { useOwners } from '../owners/useOwners';
import { useTasks } from '../tasks/useTasks';
import type { SortState } from '../types';
import { DateRangeFilter } from './DateRangeFilter';
import {
	ALL_OWNERS,
	EVENT_DATE_SORT,
	SORT_OPTIONS,
	useFilters,
} from './useFilters';

interface SearchInputProps {
	value: string;
	onChange: (value: string) => void;
}

/** A single-purpose search box — its own named piece purely so FiltersBar reads as a list of
 * controls rather than a wall of JSX, even though nothing else uses it. */
function SearchInput({ value, onChange }: SearchInputProps) {
	return (
		<div
			data-el="dashboard.filters.search"
			data-role="control"
			className="relative flex items-center gap-2 rounded-(--radius-md) border border-(--border-default) bg-(--surface-card) px-2.5 h-10 min-w-[220px] flex-1 max-w-xs"
		>
			<Search
				data-role="icon"
				className="h-6 w-6 shrink-0 text-(--content-tertiary)"
			/>
			<input
				type="text"
				data-role="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Search by app name, account ID, or dev account..."
				className="flex-1 bg-transparent text-label text-(--content-primary) placeholder:text-(--content-disabled) outline-none"
			/>
		</div>
	);
}

interface SortDirectionButtonProps {
	direction: SortState['direction'];
	onToggle: () => void;
}

/** Flips sortBy.direction between ascending/descending — named and split out so the toggle's
 * intent ("flip the arrow, flip the order") is obvious without reading its click handler. */
function SortDirectionButton({
	direction,
	onToggle,
}: SortDirectionButtonProps) {
	const isAscending = direction === 'asc';
	return (
		<button
			type="button"
			data-el="dashboard.filters.sort-direction"
			data-role="control"
			onClick={onToggle}
			className="flex h-10 w-10 items-center justify-center rounded-(--radius-md) border border-(--border-strong) bg-(--surface-subtle) text-(--content-secondary) transition hover:text-(--content-primary)"
			title={isAscending ? 'Ascending' : 'Descending'}
			aria-label={isAscending ? 'Ascending order' : 'Descending order'}
		>
			{isAscending ? (
				<ArrowUp className="h-4 w-4" />
			) : (
				<ArrowDown className="h-4 w-4" />
			)}
		</button>
	);
}

/** The dashboard's sticky filter bar: date range, owner, search, and sort — plus a live count of
 * how many cards the current filters leave visible out of the total. Reads/writes its own
 * filter state (useFilters, URL-backed) and fetches its own owners/task-count data, so it
 * takes no props at all. */
export function FiltersBar() {
	const {
		search,
		setSearch,
		ownerFilter,
		setOwnerFilter,
		sortBy,
		setSortBy,
		dateRange,
		setDateRange,
	} = useFilters();
	const { owners } = useOwners();
	const { data, sorted, tasksQuery } = useTasks();

	return (
		<div
			data-el="dashboard.filters"
			data-role="region"
			className="sticky top-16 z-20 border-b border-(--border-default) bg-(--surface-page)"
		>
			<div className="flex flex-wrap items-center gap-4 px-10 py-3">
				<DateRangeFilter
					from={dateRange.from}
					to={dateRange.to}
					onChange={setDateRange}
				/>
				<FilterSelect
					data-el="dashboard.filters.owner"
					icon={User}
					value={
						ownerFilter != null ? String(ownerFilter) : ALL_OWNERS
					}
					onChange={(v) =>
						setOwnerFilter(v === ALL_OWNERS ? null : Number(v))
					}
					options={[
						{ value: ALL_OWNERS, label: 'All owners' },
						...owners.map((o) => ({
							value: String(o.id),
							label: o.name,
						})),
					]}
				/>
				<SearchInput value={search} onChange={setSearch} />
				<FilterSelect
					data-el="dashboard.filters.sort"
					value={sortBy.column ?? EVENT_DATE_SORT}
					onChange={(v) =>
						setSortBy({
							column: v === EVENT_DATE_SORT ? null : v,
							direction: 'asc',
						})
					}
					options={SORT_OPTIONS}
				/>
				<SortDirectionButton
					direction={sortBy.direction}
					onToggle={() =>
						setSortBy({
							...sortBy,
							direction:
								sortBy.direction === 'asc' ? 'desc' : 'asc',
						})
					}
				/>
				<div
					data-el="dashboard.filters.counter"
					data-role="text"
					className="ml-auto flex items-center gap-1.5 text-label-regular text-(--content-secondary) tabular-nums"
				>
					{tasksQuery.isPlaceholderData && (
						<Loader2
							data-role="icon"
							className="h-3.5 w-3.5 animate-spin text-(--content-tertiary)"
						/>
					)}
					<span className="text-(--content-primary)">
						{sorted.length}
					</span>
					/{data.length}
				</div>
			</div>
		</div>
	);
}
