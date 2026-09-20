import { useQuery } from '@tanstack/react-query';
import { releaseOwnersQueryOptions } from '../api/owner';

const OWNER_PALETTE: string[] = [
	'bg-(--owner-pill-yellow-fill) text-(--owner-pill-yellow-content) border-(--owner-pill-yellow-border)',
	'bg-(--owner-pill-teal-fill) text-(--owner-pill-teal-content) border-(--owner-pill-teal-border)',
	'bg-(--owner-pill-pink-fill) text-(--owner-pill-pink-content) border-(--owner-pill-pink-border)',
	'bg-(--owner-pill-violet-fill) text-(--owner-pill-violet-content) border-(--owner-pill-violet-border)',
];

/** The owner directory, cached for the whole session (see releaseOwnersQueryOptions' staleTime), plus
 * the two derived lookups every consumer needs — kept here instead of taking `owners` as a prop
 * everywhere, since the directory rarely changes and is already globally cached. */
export function useOwners() {
	const ownersQuery = useQuery(releaseOwnersQueryOptions);
	const owners = ownersQuery.data ?? [];

	const ownerName = (ownerId: number | null): string | null =>
		ownerId != null
			? (owners.find((o) => o.id === ownerId)?.name ?? 'Unknown owner')
			: null;

	const ownerColor = (ownerId: number | null): string => {
		if (ownerId == null)
			return 'bg-(--status-badge-no-status-fill) text-(--content-secondary) border-(--border-default)';
		const idx = owners.findIndex((o) => o.id === ownerId);
		return OWNER_PALETTE[(idx >= 0 ? idx : 0) % OWNER_PALETTE.length];
	};

	return { owners, ownersQuery, ownerName, ownerColor };
}
