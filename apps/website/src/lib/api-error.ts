// Turns a failed API call into a message that tells the user what actually
// went wrong. The backend always answers with `{ error: string }`, so a
// missing string means the request never got a real answer from it — a
// timeout, a dropped connection, or a proxy/edge error page while the Render
// backend is hibernating or cold-starting. Those must never be reported as the
// server's verdict: login pages used to fall back to "Invalid username or
// password." here, telling teachers with correct credentials that they were wrong.

export const SERVER_UNREACHABLE_MESSAGE =
  "Couldn't reach the server — it may be waking up after being idle. Please try again in a moment.";

export const SERVER_UNAVAILABLE_MESSAGE =
  'The server is temporarily unavailable. Please try again in a moment.';

interface ApiErrorLike {
  response?: { status?: number; data?: unknown };
}

function serverMessage(response: { data?: unknown }): string | null {
  const raw = (response.data as { error?: unknown } | null | undefined)?.error;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

// True when the request was answered by infrastructure in front of the app —
// or not at all — rather than by the backend itself: no response (timeout,
// network failure), or a 429/5xx without our JSON error body. The notable
// case is Render's `429 hibernate-rate-limited`, sent while the backend sleeps.
export function isBackendUnavailable(err: unknown): boolean {
  const response = (err as ApiErrorLike | null | undefined)?.response;
  if (!response) return true;
  if (serverMessage(response)) return false;
  const status = response.status ?? 0;
  return status === 429 || status >= 500;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const response = (err as ApiErrorLike | null | undefined)?.response;

  // No response at all: timeout, network failure, or the request was aborted.
  if (!response) return SERVER_UNREACHABLE_MESSAGE;

  const message = serverMessage(response);
  if (message) return message;

  if (isBackendUnavailable(err)) return SERVER_UNAVAILABLE_MESSAGE;

  return fallback;
}

// How many times a refused request is retried after waking the backend.
const MAX_WAKE_RETRIES = 2;

// Runs `request`; if it was refused because the backend is hibernating or still
// booting, calls `wake` and tries again. Errors from the backend itself (wrong
// password, validation, its own rate limit) are thrown at once.
//
// `retryOnNoResponse: false` is for requests that are not safe to repeat: with
// no response at all we cannot know whether the server already handled them.
// A 429/5xx from the edge in front of the app is always safe — the app never
// saw the request.
export async function withBackendWake<T>(
  request: () => Promise<T>,
  wake: () => Promise<void>,
  { retryOnNoResponse }: { retryOnNoResponse: boolean },
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request();
    } catch (err) {
      const hadResponse = !!(err as { response?: unknown } | null | undefined)?.response;
      const retryable = isBackendUnavailable(err) && (hadResponse || retryOnNoResponse);
      if (!retryable || attempt >= MAX_WAKE_RETRIES) throw err;
      await wake();
    }
  }
}
