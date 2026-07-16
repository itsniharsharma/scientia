import app from './app';
import { logger } from './shared/logger';
import { getBot } from './teleService/telegram/telegram.bot';

const REQUIRED_ENV = [
  'JWT_SECRET',
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_ALLOWED_USER_IDS',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.error('Missing required environment variables — refusing to start', { missing });
  process.exit(1);
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
    logger.info('HTTP server closed — all connections drained, exiting');
    process.exit(0);
  });
  // Force exit after 30 s if connections are still open
  setTimeout(() => {
    logger.error('Graceful shutdown timeout (30 s) — forcing exit');
    process.exit(1);
  }, 30_000).unref();
});
