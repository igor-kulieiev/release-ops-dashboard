import { describe, expect, it } from 'vitest';
import { apiFetch, parseApiError } from './client';

function fetcherReturning(status: number, body: unknown = null): typeof fetch {
	return async () =>
		new Response(body != null ? JSON.stringify(body) : null, { status });
}

describe('apiFetch', () => {
	it('passes the request through to the injected fetcher', async () => {
		const response = await apiFetch(
			'/api/release/events/apps',
			{},
			{ fetcher: fetcherReturning(200) },
		);
		expect(response.status).toBe(200);
	});
});

describe('parseApiError', () => {
	it('uses the { error } body message when present', async () => {
		const response = new Response(
			JSON.stringify({
				error: 'ownerId must reference an existing owner',
			}),
			{ status: 400 },
		);
		const err = await parseApiError(
			response,
			'PATCH /api/release/events/apps',
		);
		expect(err.message).toBe('ownerId must reference an existing owner');
	});

	it('falls back to a status-based message on a non-JSON body', async () => {
		const response = new Response('not json', { status: 500 });
		const err = await parseApiError(
			response,
			'GET /api/release/events/apps',
		);
		expect(err.message).toBe('GET /api/release/events/apps failed: 500');
	});

	it('falls back to a status-based message when error is missing or empty', async () => {
		const response = new Response(JSON.stringify({ error: '' }), {
			status: 502,
		});
		const err = await parseApiError(
			response,
			'POST /api/release/events/apps/build',
		);
		expect(err.message).toBe(
			'POST /api/release/events/apps/build failed: 502',
		);
	});
});
