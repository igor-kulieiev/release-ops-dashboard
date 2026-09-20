import { Smartphone } from 'lucide-react';

export function DashboardHeader() {
	return (
		<header
			data-el="dashboard.header"
			data-role="region"
			className="sticky top-0 z-50 border-b border-(--border-default) bg-(--surface-page)"
		>
			<div className="flex items-center gap-2 px-10 h-16">
				<Smartphone
					data-el="dashboard.header.app-icon"
					data-role="icon"
					className="h-5 w-5 text-(--content-secondary)"
				/>
				<span
					data-el="dashboard.header.title"
					data-role="text"
					className="text-heading-sm text-(--content-primary)"
				>
					Release Ops Dashboard
				</span>
				<span
					data-el="dashboard.header.demo-badge"
					data-role="text"
					className="ml-2 rounded-(--radius-full) border border-(--border-default) bg-(--surface-subtle) px-2 py-0.5 text-caption text-(--content-tertiary)"
					title="All data on this page is fictional and served by a mock API (MSW) — there is no backend."
				>
					Demo data
				</span>
			</div>
		</header>
	);
}
