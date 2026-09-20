// Types for the mock "release ops" API (see src/mocks/handlers.ts for the server-side contract).
//
// ReleaseTaskPatchRequest's fields are tri-state (`field?: T | null`): omitting a key leaves the
// stored value untouched, sending it as `null` clears the field to null, and sending a value
// writes it. Omitted and `null` are NOT interchangeable — unlike a plain optional, don't drop a
// field from the request body just because its value is empty; only omit it when the intent is
// genuinely "leave this alone."

/** The read-only owner directory behind `GET /api/release/events/owners`. */
export type ReleaseTaskOwner = {
	id: number;
	name: string;
	email: string;
};

/** The `release_tasks` overlay fields shared by every shape below — previously repeated verbatim
 * across ReleaseTaskListResponse, ReleaseTaskResponse, and ReleaseTaskPatchRequest with nothing keeping them
 * in sync when a field was added. Nullability here already matches what a PATCH needs (every
 * field but `zendeskTicketsList` is already nullable, so `Partial<ReleaseTaskFields>` gives
 * ReleaseTaskPatchRequest the right omit/null/value tri-state for free); `zendeskTicketsList` is the
 * one exception (see ReleaseTaskPatchRequest). */
type ReleaseTaskFields = {
	ownerId: number | null;
	iosTaskStatus: string | null;
	iosBuildStatus: string | null;
	iosBuildType: string | null;
	iosBuildLink: string | null;
	iosBuildNum: number | null;
	androidTaskStatus: string | null;
	androidBuildStatus: string | null;
	androidBuildType: string | null;
	androidBuildLink: string | null;
	androidBuildNum: number | null;
	zendeskTicketsList: string[];
};

/** `releaseTaskOwnerName` is a snapshot from whenever this row's owner was last set — deliberately
 * unused in the UI. `ownerName()` in owners/useOwners.ts re-derives the display name live from
 * the owners directory by `ownerId` instead, so a rename shows up immediately rather than
 * showing this possibly-stale joined string. Shared by the two response shapes only — omitted
 * from ReleaseTaskPatchRequest, which never receives it back. */
type ReleaseTaskResponseFields = ReleaseTaskFields & {
	releaseTaskOwnerName: string | null;
};

/**
 * One event/app row from the upstream events datastore, left-joined with its `release_tasks`
 * overlay. Every overlay field (ownerId onward) is null — and `zendeskTicketsList` empty —
 * when no `release_tasks` row exists yet for this (accountId, groupId).
 */
export type ReleaseTaskListResponse = ReleaseTaskResponseFields & {
	eventId: number;
	eventName: string | null;
	accountId: number;
	groupId: number | null;
	appName: string | null;
	/** ISO `yyyy-MM-dd`; null when the event has no start date set yet. */
	eventStartDate: string | null;
	/** ISO `yyyy-MM-dd`; null when the event has no end date set yet. */
	eventEndDate: string | null;
	storeSettingsUrl: string;
	appleDevAccount: string | null;
	googleDevAccount: string | null;
};

/** `total` is the full filtered count; `size` is the effective (server-capped) page size. */
export type ReleaseTasksPage = {
	total: number;
	page: number;
	size: number;
	items: ReleaseTaskListResponse[];
};

/**
 * Body for `PATCH /api/release/events/apps`. Every field below is
 * tri-state: omit to leave untouched, send `null` to clear, send a value to set it. `ownerId`
 * must reference an existing owner id (`releaseOwnersQueryOptions`) when set — FK-enforced, else 400;
 * send `null` to unassign. `zendeskTicketsList`, when sent (even `[]` or `null`), replaces the
 * active ticket set; omit it to keep the stored links untouched -- unlike the other fields, its
 * base type has no `null` for `Partial<>` to inherit, so it's overridden explicitly below.
 */
export type ReleaseTaskPatchRequest = Omit<
	Partial<ReleaseTaskFields>,
	'zendeskTicketsList'
> & {
	accountId: number;
	groupId: number;
	zendeskTicketsList?: string[] | null;
};

/**
 * The task-only shape returned by PATCH (no event fields).
 * Merge it into the matching cached list row by (accountId, groupId); never replace the row.
 */
export type ReleaseTaskResponse = ReleaseTaskResponseFields & {
	accountId: number;
	groupId: number | null;
};

/** The `@JsonValue` labels of BuildType.Android — the only accepted `androidBuildType` values. */
export type AndroidBuildTypeLabel = 'AAB Build' | 'APK Build';

/** The `@JsonValue` labels of BuildType.Ios — the only accepted `iosBuildType` values. */
export type IosBuildTypeLabel =
	| 'Regular Build'
	| 'Local Build'
	| 'Screenshot Upload Build';

/**
 * Exactly one of `androidBuildType` / `iosBuildType` — never both, and never a `buildType` key.
 * The `never` halves make the both-set shape unconstructable in TS.
 */
export type ReleaseBuildTriggerRequest =
	| {
			accountId: number;
			groupId: number;
			androidBuildType: AndroidBuildTypeLabel;
			iosBuildType?: never;
	  }
	| {
			accountId: number;
			groupId: number;
			iosBuildType: IosBuildTypeLabel;
			androidBuildType?: never;
	  };

/**
 * `buildStatus` is an opaque CircleCI-style status string — never switch exhaustively. `buildNum`
 * is always present — the whole point of returning it is so the frontend can use this response's
 * own build data directly instead of searching for it via a follow-up query. `taskStatus` is the
 * server's computed manual-status mirror for this trigger (always "In progress" at trigger time)
 * — merge it in directly rather than deriving it client-side.
 */
export type ReleaseBuildTriggerResponse = {
	buildLink: string | null;
	buildStatus: string;
	buildNum: number;
	taskStatus: string;
};

/**
 * Body for `PUT /api/release/events/apps/status`. No accountId/groupId: the row and platform are
 * resolved by matching ios/android build numbers.
 */
export type ReleaseBuildStatusRequest = {
	buildNum: number;
};

/** `buildStatus` is an opaque CircleCI-style status string. */
export type ReleaseBuildStatusResponse = {
	buildStatus: string;
};

/** UI-side platform discriminator for the per-row iOS/Android actions. */
export type ReleasePlatform = 'ios' | 'android';

/** The single source of truth for which `ReleaseTaskListResponse`/`ReleaseTaskPatchRequest` field each
 * platform's task-status/build-status/build-type/build-link/build-num maps to — every call site
 * that used to branch on `platform === 'ios' ? 'iosX' : 'androidX'` looks it up here instead. */
export const PLATFORM_FIELDS = {
	ios: {
		taskStatus: 'iosTaskStatus',
		buildStatus: 'iosBuildStatus',
		buildType: 'iosBuildType',
		buildLink: 'iosBuildLink',
		buildNum: 'iosBuildNum',
	},
	android: {
		taskStatus: 'androidTaskStatus',
		buildStatus: 'androidBuildStatus',
		buildType: 'androidBuildType',
		buildLink: 'androidBuildLink',
		buildNum: 'androidBuildNum',
	},
} as const satisfies Record<
	ReleasePlatform,
	Record<string, keyof ReleaseTaskPatchRequest>
>;

/** Query params of `GET /api/release/events/apps` — shaped to match the /release route's search params. */
export type ReleaseTasksParams = {
	/** ISO `yyyy-MM-dd`, inclusive filter on eventStartDate. */
	from?: string;
	/** ISO `yyyy-MM-dd`, inclusive filter on eventStartDate. */
	to?: string;
	/** Case-insensitive substring over appName/appleDevAccount/googleDevAccount. */
	search?: string;
	/** 0-based. */
	page: number;
	/** Server-capped at 200 — the response's `size` is the effective one. */
	size: number;
};
