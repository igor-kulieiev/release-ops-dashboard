interface ErrorPageProps {
	title: string;
	description: string;
	/** Omit to render without a retry affordance (nothing the user can do). */
	onRetry?: () => void;
	retryLabel?: string;
}

/** Full-page error state, used when the app cannot be rendered meaningfully. */
export function ErrorPage({
	title,
	description,
	onRetry,
	retryLabel = 'Try again',
}: ErrorPageProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-(--surface-page) p-6">
			<div className="w-full max-w-md rounded-lg border border-(--border-default) bg-(--surface-card) p-6 text-center">
				<h1 className="text-base font-semibold text-(--content-primary)">
					{title}
				</h1>
				<p className="mt-2 text-sm text-(--content-secondary)">
					{description}
				</p>
				{onRetry && (
					<button
						type="button"
						onClick={onRetry}
						className="mt-5 rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
					>
						{retryLabel}
					</button>
				)}
			</div>
		</div>
	);
}
