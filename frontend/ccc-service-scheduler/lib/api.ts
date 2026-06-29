/** Thrown for any non-2xx response, carrying the HTTP status so callers can
 *  branch on it if they need to. `message` is already human-readable. */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const DEFAULT_TIMEOUT_MS = 30_000;

function friendlyStatus(status: number): string {
    if (status === 404) return 'Not found.';
    if (status === 409) return 'That conflicts with existing data.';
    if (status === 422) return 'Some of the submitted data was invalid.';
    if (status >= 500) return 'The server ran into a problem. Please try again.';
    return `Request failed (${status}).`;
}

type ApiOptions = RequestInit & { timeoutMs?: number };

// Returns `any` to preserve the original loose contract callers depend on.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api(url: string, options?: ApiOptions): Promise<any> {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = options ?? {};

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
        res = await fetch(base + url, { ...init, signal: controller.signal });
    } catch (err) {
        clearTimeout(timer);
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new ApiError('The request timed out. Please check your connection and try again.', 0);
        }
        throw new ApiError('Could not reach the server. Is it running?', 0);
    } finally {
        clearTimeout(timer);
    }

    // 204 No Content (e.g. DELETE) — nothing to parse.
    if (res.status === 204) return null;

    const text = await res.text();
    let body: unknown = null;
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            if (!res.ok) throw new ApiError(friendlyStatus(res.status), res.status);
            throw new ApiError(`Server returned an unexpected response (${res.status}).`, res.status);
        }
    }

    if (!res.ok) {
        const detail =
            body && typeof body === 'object'
                ? (body as Record<string, unknown>).detail ?? (body as Record<string, unknown>).error
                : null;
        const message = typeof detail === 'string' && detail ? detail : friendlyStatus(res.status);
        throw new ApiError(message, res.status);
    }

    return body;
}
