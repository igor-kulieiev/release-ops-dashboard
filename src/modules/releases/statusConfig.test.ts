import { describe, expect, it } from 'vitest';
import { buildStatusDisplay } from './statusConfig';

describe('buildStatusDisplay', () => {
	it('shows N/A when there is no build yet', () => {
		expect(buildStatusDisplay(null).label).toBe('N/A');
	});

	it('shows Success for a success-ish status', () => {
		expect(buildStatusDisplay('success').label).toBe('Success');
		expect(buildStatusDisplay('fixed').label).toBe('Success');
	});

	it('shows Failed for a failure-ish status', () => {
		expect(buildStatusDisplay('failed').label).toBe('Failed');
		expect(buildStatusDisplay('infrastructure_fail').label).toBe('Failed');
	});

	it('shows In progress for anything unrecognized, never Success or Failed', () => {
		expect(buildStatusDisplay('running').label).toBe('In progress');
	});

	it('never disagrees with isTerminalBuildStatus about what counts as terminal', async () => {
		const { isTerminalBuildStatus } = await import('./domain');
		for (const status of [
			'success',
			'fixed',
			'failed',
			'infrastructure_fail',
		]) {
			expect(isTerminalBuildStatus(status)).toBe(true);
			expect(buildStatusDisplay(status).label).not.toBe('In progress');
		}
	});
});
