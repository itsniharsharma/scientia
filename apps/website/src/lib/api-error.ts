// Turns a failed API call into a message that tells the user what actually
// went wrong. The backend always answers with `{ error: string }`, so a
// missing string means the request never got a real answer from it — a
// timeout, a dropped connection, or a proxy error page while the Render
// backend is cold-starting. Those must never be reported as the server's
// verdict: login pages used to fall back to "Invalid username or password."
// here, telling teachers with correct credentials that they were wrong.

export const SERVER_UNREACHABLE_MESSAGE =
  "Couldn't reach the server — it may be waking up after being idle. Please try again in a moment.";

export const SERVER_UNAVAILABLE_MESSAGE =
  'The server is temporarily unavailable. Please try again in a moment.';

interface ApiErrorLike {
  response?: { status?: number; data?: unknown };
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const response = (err as ApiErrorLike | null | undefined)?.response;

  // No response at all: timeout, network failure, or the request was aborted.
  if (!response) return SERVER_UNREACHABLE_MESSAGE;

  const raw = (response.data as { error?: unknown } | null | undefined)?.error;
  if (typeof raw === 'string' && raw.length > 0) return raw;

  // A gateway error without our JSON body came from the proxy, not the app.
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  return fallback;
}
