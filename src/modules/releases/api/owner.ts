import { queryOptions } from '@tanstack/react-query';
import {
	type ApiFetchOptions,
	apiFetch,
	parseApiError,
} from '@/lib/api/client';
import type { ReleaseTaskOwner } from './release-types';

export async function fetchReleaseOwners(
	options?: ApiFetchOptions,
): Promise<ReleaseTaskOwner[]> {
	const response = await apiFetch('/api/release/events/owners', {}, options);
	if (!response.ok) {
		throw await parseApiError(response, 'GET /api/release/events/owners');
	}
	return (await response.json()) as ReleaseTaskOwner[];
}

/** The owner directory changes rarely — cache it for the session instead of refetching per navigation. */
export const releaseOwnersQueryOptions = queryOptions({
	queryKey: ['release', 'owners'],
	queryFn: () => fetchReleaseOwners(),
	staleTime: 5 * 60_000,
});
