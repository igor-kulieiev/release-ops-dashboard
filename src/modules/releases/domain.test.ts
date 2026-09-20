import { describe, expect, it } from 'vitest';
import type { ReleaseTaskListResponse } from './api/release-types';
import { compareString, isTerminalBuildStatus, matchesSearch } from './domain';

function row(
	overrides: Partial<ReleaseTaskListResponse> = {},
): ReleaseTaskListResponse {
	return {
		eventId: 1,
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

describe('isTerminalBuildStatus', () => {
	it('is terminal for every known success status', () => {
		expect(isTerminalBuildStatus('success')).toBe(true);
		expect(isTerminalBuildStatus('fixed')).toBe(true);
	});

	it('is terminal for every known failure status', () => {
		expect(isTerminalBuildStatus('failed')).toBe(true);
		expect(isTerminalBuildStatus('timedout')).toBe(true);
		expect(isTerminalBuildStatus('canceled')).toBe(true);
		expect(isTerminalBuildStatus('infrastructure_fail')).toBe(true);
		expect(isTerminalBuildStatus('no_tests')).toBe(true);
	});

	it('is not terminal for an unrecognized/in-progress status', () => {
		expect(isTerminalBuildStatus('running')).toBe(false);
		expect(isTerminalBuildStatus('queued')).toBe(false);
	});
});

describe('matchesSearch', () => {
	it('matches against appName case-insensitively', () => {
		expect(matchesSearch(row({ appName: 'Acme Conference' }), 'acme')).toBe(
			true,
		);
	});

	it('falls back to eventName when appName is null', () => {
		expect(
			matchesSearch(
				row({ appName: null, eventName: 'Summer Summit' }),
				'summit',
			),
		).toBe(true);
	});

	it('matches against apple/google dev accounts', () => {
		expect(
			matchesSearch(
				row({ appleDevAccount: 'dev@apple.com' }),
				'apple.com',
			),
		).toBe(true);
		expect(
			matchesSearch(
				row({ googleDevAccount: 'dev@google.com' }),
				'google.com',
			),
		).toBe(true);
	});

	it('matches against the account ID', () => {
		expect(matchesSearch(row({ accountId: 12345 }), '1234')).toBe(true);
	});

	it('does not match an unrelated query', () => {
		expect(matchesSearch(row({ appName: 'Acme Conference' }), 'zzz')).toBe(
			false,
		);
	});
});

describe('compareString', () => {
	it('compares case-insensitively', () => {
		expect(compareString('apple', 'Banana')).toBeLessThan(0);
	});

	it('sorts null last, regardless of side', () => {
		expect(compareString(null, 'apple')).toBeGreaterThan(0);
		expect(compareString('apple', null)).toBeLessThan(0);
	});

	it('treats two nulls as equal', () => {
		expect(compareString(null, null)).toBe(0);
	});
});
