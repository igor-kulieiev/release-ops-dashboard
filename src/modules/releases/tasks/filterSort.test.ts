import { describe, expect, it } from 'vitest';
import type { ReleaseTaskListResponse } from '../api/release-types';
import { filterTasks, sortTasks } from './filterSort';

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

describe('filterTasks', () => {
	const data = [
		row({
			eventId: 1,
			ownerId: 10,
			appName: 'Acme',
			eventStartDate: '2026-03-01',
		}),
		row({
			eventId: 2,
			ownerId: 20,
			appName: 'Zephyr',
			eventStartDate: '2026-03-15',
		}),
		row({
			eventId: 3,
			ownerId: null,
			appName: 'Bravo',
			eventStartDate: null,
		}),
	];

	it('filters by exact owner match', () => {
		const result = filterTasks(data, { ownerFilter: 10, search: '' });
		expect(result.map((r) => r.eventId)).toEqual([1]);
	});

	it('filters by case-insensitive search', () => {
		const result = filterTasks(data, { ownerFilter: null, search: 'zeph' });
		expect(result.map((r) => r.eventId)).toEqual([2]);
	});
});

describe('sortTasks', () => {
	const ownerName = (id: number | null) =>
		id === 1 ? 'Bravo Owner' : id === 2 ? 'Alpha Owner' : null;

	it('defaults to sorting by event date (undated rows sort last)', () => {
		const data = [
			row({ eventId: 1, eventStartDate: '2026-03-15' }),
			row({ eventId: 2, eventStartDate: null }),
			row({ eventId: 3, eventStartDate: '2026-01-01' }),
		];
		const result = sortTasks(
			data,
			{ column: null, direction: 'asc' },
			ownerName,
		);
		expect(result.map((r) => r.eventId)).toEqual([3, 1, 2]);
	});

	it('sorts by app display name for the releaseApp column', () => {
		const data = [
			row({ eventId: 1, appName: 'Zephyr' }),
			row({ eventId: 2, appName: 'Acme' }),
		];
		const result = sortTasks(
			data,
			{ column: 'releaseApp', direction: 'asc' },
			ownerName,
		);
		expect(result.map((r) => r.eventId)).toEqual([2, 1]);
	});

	it('sorts by resolved owner name for the owner column', () => {
		const data = [
			row({ eventId: 1, ownerId: 1 }), // "Bravo Owner"
			row({ eventId: 2, ownerId: 2 }), // "Alpha Owner"
		];
		const result = sortTasks(
			data,
			{ column: 'owner', direction: 'asc' },
			ownerName,
		);
		expect(result.map((r) => r.eventId)).toEqual([2, 1]);
	});

	it('reverses order for direction desc', () => {
		const data = [
			row({ eventId: 1, appName: 'Acme' }),
			row({ eventId: 2, appName: 'Zephyr' }),
		];
		const result = sortTasks(
			data,
			{ column: 'releaseApp', direction: 'desc' },
			ownerName,
		);
		expect(result.map((r) => r.eventId)).toEqual([2, 1]);
	});

	it('breaks ties on event date', () => {
		const data = [
			row({ eventId: 1, ownerId: null, eventStartDate: '2026-03-15' }),
			row({ eventId: 2, ownerId: null, eventStartDate: '2026-01-01' }),
		];
		const result = sortTasks(
			data,
			{ column: 'owner', direction: 'asc' },
			ownerName,
		);
		expect(result.map((r) => r.eventId)).toEqual([2, 1]);
	});
});
