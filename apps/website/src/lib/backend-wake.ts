// Wakes the hibernating Render backend straight from the user's browser.
//
// Render's free tier hibernates the backend when idle. Waking it through the
// Vercel `/api` proxy is unreliable: every user's request leaves Vercel from a
// small pool of shared egress IPs, and Render's edge rate-limits wake-ups of a
// hibernated service per source IP — the proxy gets an instant
// `429 Too Many Requests` (`x-render-routing: hibernate-rate-limited`) and the
// app never even sees the login. A request from the user's own IP is not
// affected and wakes the service normally (~55s), after which the proxy works.
//
// Must stay in sync with the rewrite destination in vercel.json.
const BACKEND_ORIGIN = 'https://scientia-bx5h.onrender.com';

const WAKE_TIMEOUT_MS = 90_000;

let inFlight: Promise<void> | null = null;

// Resolves once the backend has answered (or the wait timed out). Never
// rejects — callers retry their real request afterwards and report its error.
// Concurrent callers share one wake-up request.
export function wakeBackend(): Promise<void> {
  // Locally the Vite dev server proxies to a backend that never hibernates.
  if (!import.meta.env.PROD) return Promise.resolve();

  if (!inFlight) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WAKE_TIMEOUT_MS);
    // `no-cors`: the response is opaque, but it only arrives once the backend
    // is up — which is all we need — and no CORS setup is required for it.
    inFlight = fetch(`${BACKEND_ORIGIN}/health`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(() => undefined, () => undefined)
      .finally(() => {
        clearTimeout(timer);
        inFlight = null;
      });
  }
  return inFlight;
}
