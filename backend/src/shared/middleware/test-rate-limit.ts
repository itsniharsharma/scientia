import { RequestHandler } from 'express';

// express-rate-limit counters are shared for the lifetime of the Node
// process. Vitest's integration suite reuses one `app` instance across many
// test cases in the same file/run, so a real registration limiter (meant to
// stop signup spam in production) would otherwise trip well before the test
// suite finishes. `VITEST` is set by the test runner itself regardless of
// NODE_ENV (which local/CI test runs often inherit as 'development' from
// .env), so this is the reliable signal — it is never set outside of a
// vitest process, so this has no effect on production or local dev/prod
// server behavior.
export function withTestBypass(limiter: RequestHandler): RequestHandler {
  if (process.env.VITEST) {
    return (_req, _res, next) => next();
  }
  return limiter;
}
