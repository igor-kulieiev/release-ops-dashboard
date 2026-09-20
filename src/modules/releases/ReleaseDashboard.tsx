import { ErrorPage } from '@/components/ui/ErrorPage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DashboardHeader } from './DashboardHeader';
import { FiltersBar } from './filters/FiltersBar';
import { TaskDetailsModal } from './task-details/TaskDetailsModal';
import { TaskGrid } from './tasks/TaskGrid';
import { useTasks } from './tasks/useTasks';

/**
 * Composition root for the RELEASE dashboard — lays out its sections. Rendered by the router's
 * index route. Everything below fetches/mutates its own data rather than being prop-drilled it
 * from here (see each domain folder's own hook) — toasts, too, now that useToast is app-wide
 * (main.tsx).
 *
 * `builds/`, `filters/`, `owners/`, `task-details/`, and `tasks/` are domain groupings within
 * this one `release` feature module (see AGENTS.md), not independent slices — imports across them
 * (e.g. `filters/FiltersBar` → `tasks/useTasks`, `tasks/TaskCard` → `owners/OwnerSelect`) are
 * expected, not something to flatten away later.
 */
export function ReleaseDashboard() {
	const { tasksQuery } = useTasks();

	if (tasksQuery.isPending) return <LoadingSpinner />;

	if (tasksQuery.isError)
		return (
			<ErrorPage
				title="Can't load the dashboard"
				description={
					tasksQuery.error instanceof Error
						? tasksQuery.error.message
						: 'Failed to load dashboard data.'
				}
				onRetry={() => void tasksQuery.refetch()}
			/>
		);

	return (
		<div
			data-el="dashboard"
			data-role="region"
			className="min-h-screen bg-(--surface-page)"
		>
			<DashboardHeader />
			<FiltersBar />
			<main
				data-el="dashboard.grid"
				data-role="container"
				className="px-10 py-6"
			>
				<TaskGrid />
			</main>
			<TaskDetailsModal />
		</div>
	);
}
