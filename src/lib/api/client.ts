export interface ApiFetchOptions {
	/** Injectable for tests; defaults to the global fetch. */
	fetcher?: typeof fetch;
}

/**
 * fetch wrapper for `/api` calls. In the real app this is where auth/XSRF headers and a
 * session-expiry redirect would live; this demo has no backend or login (every `/api` call is
 * intercepted by the Mock Service Worker handlers in `src/mocks/`), so it's a thin pass-through
 * kept mainly so call sites have one place to inject a fetcher in tests.
 */
export async function apiFetch(
	input: RequestInfo | URL,
	init: RequestInit = {},
	{ fetcher = fetch }: ApiFetchOptions = {},
): Promise<Response> {
	return fetcher(input, init);
}

/** Shared `{ error: string }` shape returned by every `/api/release/**` mock failure. */
export async function parseApiError(
	response: Response,
	requestLabel: string,
): Promise<Error> {
	try {
		const body = (await response.json()) as { error?: unknown };
		if (typeof body?.error === 'string' && body.error !== '') {
			return new Error(body.error);
		}
	} catch {
		// Non-JSON or empty body — fall through to the status-based message.
	}
	return new Error(`${requestLabel} failed: ${response.status}`);
}
