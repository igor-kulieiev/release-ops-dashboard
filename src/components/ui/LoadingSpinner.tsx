import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
	/** Hold off this long before appearing, so a fast load shows nothing rather than a flash. */
	delayMs?: number;
}

/**
 * Full-page loading state. Deliberately invisible for the first `delayMs`: /api/me is prefetched
 * before React mounts, so the common path resolves in well under that and the user sees a clean
 * background instead of a spinner blink.
 */
export function LoadingSpinner({ delayMs = 300 }: LoadingSpinnerProps) {
	const [visible, setVisible] = useState(delayMs === 0);

	useEffect(() => {
		if (delayMs === 0) return;
		const timer = setTimeout(() => setVisible(true), delayMs);
		return () => clearTimeout(timer);
	}, [delayMs]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-(--surface-page)">
			{visible && (
				<div
					role="status"
					aria-label="Loading"
					className="size-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--content-primary)"
				/>
			)}
		</div>
	);
}
