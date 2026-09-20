import type {
	ReleaseTaskListResponse,
	ReleaseTaskOwner,
} from '@/modules/releases/api/release-types';

export const OWNERS: ReleaseTaskOwner[] = [
	{ id: 1, name: 'Alex Rivera', email: 'alex.rivera@example.com' },
	{ id: 2, name: 'Jordan Kim', email: 'jordan.kim@example.com' },
	{ id: 3, name: 'Priya Nair', email: 'priya.nair@example.com' },
	{ id: 4, name: 'Sam Osei', email: 'sam.osei@example.com' },
	{ id: 5, name: 'Morgan Blake', email: 'morgan.blake@example.com' },
];

function ownerName(ownerId: number | null): string | null {
	return ownerId != null
		? (OWNERS.find((o) => o.id === ownerId)?.name ?? null)
		: null;
}

function toISODate(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysFromToday(offset: number): string {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + offset);
	return toISODate(d);
}

const EVENT_NAMES = [
	'Northwind Summit',
	'Vertex Product Days',
	'Lumen Health Expo',
	'Orbit Developer Conference',
	'Cascade Partner Forum',
	'Beacon Retail Week',
	'Fathom Analytics Meetup',
	'Meridian Leadership Forum',
	'Solace Wellness Retreat',
	'Ember Startup Showcase',
	'Granite Manufacturing Expo',
	'Tidewater Finance Summit',
	'Aurora Design Conference',
	'Pinecrest Education Forum',
	'Sable Logistics Congress',
	'Wren Marketing Live',
	'Halcyon HR Symposium',
	'Ridgeline Sales Kickoff',
];

const APPLE_ACCOUNTS = [
	'events-ios@northwind.example.com',
	'mobile@vertex.example.com',
	null,
	'apps@orbitdev.example.com',
	'ios-team@cascade.example.com',
	null,
];

const GOOGLE_ACCOUNTS = [
	'events-android@northwind.example.com',
	'mobile@vertex.example.com',
	'play-console@lumen.example.com',
	null,
	'android-team@cascade.example.com',
	null,
];

const TASK_STATUSES = ['', 'In progress', 'Success', 'Failed'] as const;
const IOS_BUILD_STATUSES = [
	null,
	'success',
	'running',
	'failed',
	'queued',
] as const;
const ANDROID_BUILD_STATUSES = [
	null,
	'success',
	'fixed',
	'running',
	'failed',
	'timedout',
] as const;
const IOS_BUILD_TYPES = [
	null,
	'Regular Build',
	'Local Build',
	'Screenshot Upload Build',
] as const;
const ANDROID_BUILD_TYPES = [null, 'AAB Build', 'APK Build'] as const;

function pick<T>(arr: readonly T[], seed: number): T {
	return arr[seed % arr.length] as T;
}

function buildRow(index: number): ReleaseTaskListResponse {
	const eventId = 1000 + index;
	const accountId = 500 + index;
	// A handful of events have no group id yet ("not fully set up") and one has no app name yet —
	// exercises the untrackable/fallback-name states the UI handles.
	const groupId = index % 7 === 6 ? null : 9000 + index;
	const hasApp = index % 9 !== 8;
	const eventName = EVENT_NAMES[index % EVENT_NAMES.length];
	const ownerId = index % 6 === 5 ? null : OWNERS[index % OWNERS.length].id;

	// Spread events across ~4 weeks before and ~5 weeks after today so the default "this week"
	// filter, plus a little forward/backward browsing, both show a realistic mix.
	const startOffset = ((index * 5) % 63) - 21;
	const durationDays = 1 + (index % 3);
	const eventStartDate = daysFromToday(startOffset);
	const eventEndDate = daysFromToday(startOffset + durationDays);

	const iosBuildStatus = pick(IOS_BUILD_STATUSES, index);
	const androidBuildStatus = pick(ANDROID_BUILD_STATUSES, index + 3);
	const iosBuildType = iosBuildStatus
		? pick(IOS_BUILD_TYPES.slice(1), index)
		: null;
	const androidBuildType = androidBuildStatus
		? pick(ANDROID_BUILD_TYPES.slice(1), index)
		: null;

	return {
		eventId,
		eventName,
		accountId,
		groupId,
		appName: hasApp ? `${eventName} App` : null,
		eventStartDate,
		eventEndDate,
		storeSettingsUrl: `https://console.example.com/accounts/${accountId}/store-settings`,
		appleDevAccount: pick(APPLE_ACCOUNTS, index),
		googleDevAccount: pick(GOOGLE_ACCOUNTS, index + 2),
		ownerId,
		releaseTaskOwnerName: ownerName(ownerId),
		iosTaskStatus: pick(TASK_STATUSES, index) || null,
		iosBuildStatus,
		iosBuildType,
		iosBuildLink: iosBuildStatus
			? `https://circleci.example.com/pipelines/demo/ios/${2000 + index}`
			: null,
		iosBuildNum: iosBuildStatus ? 2000 + index : null,
		androidTaskStatus: pick(TASK_STATUSES, index + 2) || null,
		androidBuildStatus,
		androidBuildType,
		androidBuildLink: androidBuildStatus
			? `https://circleci.example.com/pipelines/demo/android/${3000 + index}`
			: null,
		androidBuildNum: androidBuildStatus ? 3000 + index : null,
		zendeskTicketsList:
			index % 4 === 0
				? [`https://support.example.com/tickets/${41000 + index}`]
				: [],
	};
}

/** In-memory "database" for the demo — seeded once per page load, mutated in place by the mock
 * PATCH/build handlers so edits made during the session stick around until a refresh. */
export const releaseTasks: ReleaseTaskListResponse[] = Array.from(
	{ length: EVENT_NAMES.length },
	(_, i) => buildRow(i),
);
