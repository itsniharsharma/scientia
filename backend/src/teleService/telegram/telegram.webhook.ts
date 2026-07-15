import { Router, type Request, type Response } from 'express';
import { getBot } from './telegram.bot';
import { logger } from '../../shared/logger';

const router = Router();

/**
 * POST /telegram/webhook
 *
 * Telegram calls this endpoint for every update.
 * Validates the shared secret token before passing the update to Telegraf.
 * Always responds 200 — Telegram retries on non-200 which can cause loops.
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const headerToken   = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedToken || headerToken !== expectedToken) {
    logger.warn('TELEGRAM_WEBHOOK_INVALID_TOKEN', {
      // Log only a prefix — never log the full token
      received: headerToken ? `${headerToken.slice(0, 8)}…` : '(missing)',
    });
    res.sendStatus(401);
    return;
  }

  try {
    await getBot().handleUpdate(req.body as Parameters<ReturnType<typeof getBot>['handleUpdate']>[0]);
  } catch (err) {
    // Log but swallow — a 500 here causes Telegram to retry the same update
    logger.error('TELEGRAM_WEBHOOK_PROCESS_ERROR', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  res.sendStatus(200);
});

export default router;
