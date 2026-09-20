import {
	createRootRoute,
	createRoute,
	createRouter,
} from '@tanstack/react-router';
import { ReleaseDashboard } from '@/modules/releases/ReleaseDashboard';

/** The dashboard's whole filter/sort/modal state, round-tripped through the URL — a refresh or a
 * shared link reproduces the exact same view. Every field is optional and omitted at its
 * default, so an unfiltered dashboard keeps a clean URL. */
export interface ReleaseDashboardSearch {
	q?: string;
	owner?: number;
	sort?: string;
	dir?: 'desc';
	from?: string;
	to?: string;
	task?: number;
}

function toOptionalNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value !== '') {
		const n = Number(value);
		if (Number.isFinite(n)) return n;
	}
	return undefined;
}

function toOptionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value !== '' ? value : undefined;
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	validateSearch: (
		search: Record<string, unknown>,
	): ReleaseDashboardSearch => ({
		q: toOptionalString(search.q),
		owner: toOptionalNumber(search.owner),
		sort: toOptionalString(search.sort),
		dir: search.dir === 'desc' ? 'desc' : undefined,
		from: toOptionalString(search.from),
		to: toOptionalString(search.to),
		task: toOptionalNumber(search.task),
	}),
	component: ReleaseDashboard,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
