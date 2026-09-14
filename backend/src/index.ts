import app from './app';
import { logger } from './shared/logger';
import { prisma } from './lib/prisma';
import { getBot } from './teleService/telegram/telegram.bot';
import { validateJwtSecret, WeakJwtSecretError } from './shared/validate-jwt-secret';
import { checkRequiredEnv } from './shared/validate-required-env';

const missingEnv = checkRequiredEnv();
if (missingEnv.length > 0) {
  logger.error('Missing required environment variables — refusing to start', {
    // Distinguishes "never set" from "set to an empty string" — a variable
    // configured in the deploy platform's dashboard with a blank value
    // looks "configured" to a human but still fails this check for the
    // same reason a truly-unset one does. Never logs the actual value.
    missing: missingEnv.map((m) => `${m.key} (${m.reason})`),
  });
  process.exit(1);
}

// Production-only: refuse to start on a missing/placeholder/too-short
// JWT_SECRET rather than silently issuing forgeable tokens. No-op in
// development/test — never logs the secret itself, only the reason.
try {
  validateJwtSecret(process.env.JWT_SECRET, process.env.NODE_ENV);
} catch (err) {
  if (err instanceof WeakJwtSecretError) {
    logger.error('JWT_SECRET failed production validation — refusing to start', { reason: err.message });
    process.exit(1);
  }
  throw err;
}

// Redis is optional — falls back to in-memory session store.
// Warn once at startup so the operator knows they're running without persistence.
if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  logger.warn('Redis not configured — session dedup and rate-limiting are disabled', {
    hint: 'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production use',
  });
}

if (!['development', 'production', 'test'].includes(process.env.NODE_ENV ?? '')) {
  logger.error('NODE_ENV must be development, production, or test');
  process.exit(1);
}

const PORT = process.env.PORT ?? 3001;

const server = app.listen(PORT, () => {
  logger.info('Backend started', { port: PORT, env: process.env.NODE_ENV ?? 'development' });

  // In polling mode (local dev), start the bot via long-polling.
  // This auto-deletes any existing webhook so Telegram stops pushing to Render.
  if (process.env.TELEGRAM_MODE === 'polling') {
    const bot = getBot();
    bot.launch({ dropPendingUpdates: true }).catch((err: unknown) => {
      logger.error('TELEGRAM_POLLING_ERROR', { error: err instanceof Error ? err.message : String(err) });
    });
    logger.info('TELEGRAM_POLLING_STARTED');
  }
});

// Graceful shutdown: let in-flight requests (including uploads) complete before exit.
// Render (and most platforms) send SIGTERM before killing the process on deploy.
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — initiating graceful shutdown');
  if (process.env.TELEGRAM_MODE === 'polling') {
    try { getBot().stop('SIGTERM'); } catch { /* already stopped */ }
  }
  server.close(() => {
    // Release this instance's Postgres connections back to the Supabase
    // pooler before exiting. Without this, every deploy/restart/crash
    // leaks its connection pool — the pooler has no way to know this
    // process is gone until its own (much longer) idle timeout kicks in.
    // Enough leaked connections across repeated restarts can exhaust the
    // pooler's connection cap and make the *next* instance hang trying to
    // open a new connection (see incident 2026-09-14: crash-loop left
    // orphaned connections, next healthy boot's logins hung for 30s).
    prisma.$disconnect().finally(() => {
      logger.info('HTTP server closed and DB pool disconnected — exiting');
      process.exit(0);
    });
  });
  // Force exit after 30 s if connections are still open
  setTimeout(() => {
    logger.error('Graceful shutdown timeout (30 s) — forcing exit');
    process.exit(1);
  }, 30_000).unref();
});
