import type { ReleaseTaskListResponse } from './api/release-types';
import { appDisplayName } from './format';

/** The canonical set of manually-set values for `iosTaskStatus`/`androidTaskStatus` — free text
 * on the wire, but the ops team only ever picks from this list in the UI. Every other place that
 * needs one of these labels (statusConfig.ts) references it from here instead of repeating the
 * string literal — previously duplicated independently in three places with nothing to keep
 * them in sync. */
export const TASK_STATUS = {
	NONE: '',
	IN_PROGRESS: 'In progress',
	BUILD_UPDATED: 'Success',
	BUILD_FAILED: 'Failed',
} as const;

/** The single definition of what the dashboard search box matches against. */
export const matchesSearch = (
	row: ReleaseTaskListResponse,
	query: string,
): boolean => {
	const hay =
		`${appDisplayName(row)} ${row.accountId} ${row.appleDevAccount ?? ''} ${row.googleDevAccount ?? ''}`.toLowerCase();
	return hay.includes(query.toLowerCase());
};

export const compareString = (a: string | null, b: string | null): number =>
	(a ?? 'zzz').toLowerCase().localeCompare((b ?? 'zzz').toLowerCase());

/**
 * CircleCI v1.1 build statuses that mean the build is genuinely done, one way or the other.
 * The backend passes CircleCI's raw status straight through with zero transformation (see
 * `ReleaseTaskServiceImpl.updateBuildStatus`), and CircleCI's real vocabulary is wider than either
 * short list we'd hardcode here — so classification requires an explicit match for *either*
 * outcome, rather than defaulting anything unrecognized to one side unconditionally. Defaulting
 * unrecognized-to-terminal previously showed "Failed" the instant a build was queued (the
 * trigger response's status can be blank/transitional before CircleCI assigns a real one), and
 * defaulting unrecognized-to-in-progress previously left a genuinely failed build (with a
 * status outside a too-short allowlist, e.g. `infrastructure_fail`) stuck forever. A silently
 * "still in progress" card for a truly novel status is the least disruptive of the two possible
 * wrong guesses.
 *
 * Exported (not module-private) because `statusConfig.ts`'s `buildStatusDisplay` needs the same
 * two sets — keeping one definition importable from here is what guarantees the two can never
 * drift apart on what counts as terminal.
 */
export const SUCCESS_BUILD_STATUSES = new Set(['success', 'fixed']);
export const FAILURE_BUILD_STATUSES = new Set([
	'failed',
	'timedout',
	'canceled',
	'infrastructure_fail',
	'no_tests',
]);

export const isTerminalBuildStatus = (buildStatus: string): boolean =>
	SUCCESS_BUILD_STATUSES.has(buildStatus) ||
	FAILURE_BUILD_STATUSES.has(buildStatus);
