import { TaskCard } from './TaskCard';
import { useTasks } from './useTasks';

/** The dashboard's card grid, or an empty-state message when the current filters leave nothing
 * to show. Fetches+filters the task list itself (see useTasks) and takes no props — each
 * TaskCard fetches/mutates its own data too. Assumes the task list has already loaded
 * successfully; ReleaseDashboard gates on that before rendering this at all. */
export function TaskGrid() {
	const { data, sorted, tasksQuery } = useTasks();

	// `keepPreviousData` (see releaseTasksQueryOptions) shows the *previous* date range's rows while
	// the new range loads, rather than blanking the grid -- `isPlaceholderData` is true exactly
	// during that window, so dim the stale rows to signal a refresh is in flight instead of
	// looking like the switch silently did nothing.
	const isRefreshing = tasksQuery.isPlaceholderData;

	if (sorted.length === 0) {
		// The date range is a server-side filter (see useTasks) -- if it alone already left nothing
		// to show, "adjust search/filters" would send someone hunting through the search box and
		// owner dropdown for a problem that's actually the date range. Naming it directly instead.
		const message =
			data.length === 0
				? 'No events in this date range. Try widening it.'
				: 'No matches. Adjust your search or filters.';
		return (
			<div
				data-el="dashboard.grid.empty"
				data-role="text"
				className="flex h-48 items-center justify-center text-label text-(--content-secondary)"
			>
				{message}
			</div>
		);
	}

	return (
		<div
			data-el="dashboard.grid.list"
			data-role="container"
			className={`grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[10px] transition-opacity ${isRefreshing ? 'pointer-events-none opacity-50' : ''}`}
		>
			{sorted.map((row) => (
				<TaskCard key={row.eventId} row={row} />
			))}
		</div>
	);
}
