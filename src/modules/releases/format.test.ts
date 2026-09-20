import { describe, expect, it } from 'vitest';
import type { ReleaseTaskListResponse } from './api/release-types';
import {
	addDays,
	appDisplayName,
	formatDateRange,
	parseLocalDate,
	startOfWeek,
	toISODate,
} from './format';

function row(
	overrides: Partial<ReleaseTaskListResponse> = {},
): ReleaseTaskListResponse {
	return {
		eventId: 42,
		eventName: null,
		accountId: 1,
		groupId: 1,
		appName: null,
		eventStartDate: null,
		eventEndDate: null,
		storeSettingsUrl: 'https://example.com',
		appleDevAccount: null,
		googleDevAccount: null,
		ownerId: null,
		releaseTaskOwnerName: null,
		iosTaskStatus: null,
		iosBuildStatus: null,
		iosBuildType: null,
		iosBuildLink: null,
		iosBuildNum: null,
		androidTaskStatus: null,
		androidBuildStatus: null,
		androidBuildType: null,
		androidBuildLink: null,
		androidBuildNum: null,
		zendeskTicketsList: [],
		...overrides,
	};
}

describe('appDisplayName', () => {
	it('prefers appName when present', () => {
		expect(
			appDisplayName(
				row({ appName: 'Acme App', eventName: 'Acme Event' }),
			),
		).toBe('Acme App');
	});

	it('falls back to eventName when appName is empty', () => {
		expect(
			appDisplayName(row({ appName: null, eventName: 'Acme Event' })),
		).toBe('Acme Event');
	});

	it('falls back to a generated label when both are empty', () => {
		expect(appDisplayName(row({ appName: null, eventName: null }))).toBe(
			'Event 42',
		);
	});
});

describe('parseLocalDate', () => {
	it('returns null for null/undefined/empty input', () => {
		expect(parseLocalDate(null)).toBeNull();
		expect(parseLocalDate(undefined)).toBeNull();
		expect(parseLocalDate('')).toBeNull();
	});

	it('parses yyyy-MM-dd as a local-midnight date, not shifted by timezone', () => {
		const d = parseLocalDate('2026-03-05');
		if (!d) throw new Error('expected a parsed date');
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(2); // 0-indexed
		expect(d.getDate()).toBe(5);
	});

	it('returns null for a malformed string instead of a truthy Invalid Date', () => {
		expect(parseLocalDate('garbage')).toBeNull();
		expect(parseLocalDate('abc-de-fg')).toBeNull();
	});
});

describe('addDays', () => {
	it('adds days within a month', () => {
		expect(toISODate(addDays(new Date(2026, 2, 4), 3))).toBe('2026-03-07');
	});

	it('rolls over a month boundary', () => {
		expect(toISODate(addDays(new Date(2026, 2, 30), 3))).toBe('2026-04-02');
	});

	it('rolls over a year boundary', () => {
		expect(toISODate(addDays(new Date(2026, 11, 30), 3))).toBe(
			'2027-01-02',
		);
	});

	it('subtracts with a negative count', () => {
		expect(toISODate(addDays(new Date(2026, 2, 2), -1))).toBe('2026-03-01');
	});
});

describe('startOfWeek', () => {
	// Known week: Mon 2026-03-02 .. Sun 2026-03-08.
	it('returns the same date when already given a Monday', () => {
		expect(toISODate(startOfWeek(new Date(2026, 2, 2)))).toBe('2026-03-02');
	});

	it("returns that week's Monday for a mid-week or Saturday date", () => {
		expect(toISODate(startOfWeek(new Date(2026, 2, 4)))).toBe('2026-03-02'); // Wed
		expect(toISODate(startOfWeek(new Date(2026, 2, 7)))).toBe('2026-03-02'); // Sat
	});

	it("returns the Monday that started the week for a Sunday, not the next week's", () => {
		expect(toISODate(startOfWeek(new Date(2026, 2, 8)))).toBe('2026-03-02');
	});
});

describe('formatDateRange', () => {
	it('shows "Date TBD" when neither side is set', () => {
		expect(formatDateRange(null, null)).toBe('Date TBD');
	});

	it('shows a single short date when only one side is set', () => {
		expect(formatDateRange('2026-03-05', null)).toBe('Mar 5');
		expect(formatDateRange(null, '2026-03-05')).toBe('Mar 5');
	});

	it('collapses to one date when start equals end', () => {
		expect(formatDateRange('2026-03-05', '2026-03-05')).toBe('Mar 5');
	});

	it('omits the repeated month when both dates fall in the same month', () => {
		expect(formatDateRange('2026-03-05', '2026-03-09')).toBe('Mar 5–9');
	});

	it('shows both months when the range crosses a month boundary', () => {
		expect(formatDateRange('2026-03-29', '2026-04-02')).toBe(
			'Mar 29 – Apr 2',
		);
	});
});
