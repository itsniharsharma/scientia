import { Telegraf } from 'telegraf';
import type { BotContext } from './telegram.types';
import { getSession, setSession } from './telegram.session';
import { allowlistGuard, teacherGuard } from './telegram.guards';
import { logger } from '../../shared/logger';
import * as handlers from './telegram.handlers';

// ── Lazy singleton ────────────────────────────────────────────────────────────
// The bot is NOT created at module load — only when first requested.
// This allows the module to be safely imported in test environments where
// TELEGRAM_BOT_TOKEN is not set, without throwing on import.

let _bot: Telegraf<BotContext> | undefined;

function buildBot(token: string): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(token);

  // ── 1. Global error catcher ───────────────────────────────────────────────
  // Never sends internal error details to the user.
  bot.catch(async (err: unknown, ctx: BotContext) => {
    logger.error('TELEGRAM_UNHANDLED_ERROR', {
      updateType: ctx.updateType,
      userId:     ctx.from?.id,
      error:      err instanceof Error ? err.message : String(err),
    });
    try { await ctx.reply('⚠️ Something went wrong. Please try again.'); } catch { /* swallow */ }
  });

  // ── 2. Allowlist guard ────────────────────────────────────────────────────
  bot.use(allowlistGuard);

  // ── 3. Session middleware (load → handle → save) ──────────────────────────
  bot.use(async (ctx: BotContext, next) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    ctx.session = (await getSession(userId)) ?? {};
    try {
      await next();
    } finally {
      await setSession(userId, ctx.session);
    }
  });

  // ── 4. Teacher guard ──────────────────────────────────────────────────────
  bot.use(teacherGuard);

  // ── 5. Commands ───────────────────────────────────────────────────────────
  bot.start(handlers.handleStart as never);
  bot.help(handlers.handleHelp   as never);
  bot.command('current',  handlers.handleCurrent  as never);
  bot.command('change',   handlers.handleChange   as never);
  bot.command('cancel',   handlers.handleCancel   as never);
  bot.command('cleanup',  handlers.handleCleanup  as never);

  // ── 6. Callback queries (inline keyboard buttons) ─────────────────────────
  bot.on('callback_query', handlers.handleCallback as never);

  // ── 7. Photo messages ─────────────────────────────────────────────────────
  bot.on('photo', handlers.handlePhoto as never);

  // ── 8. Text messages (answer input + unknown-input fallback) ─────────────
  bot.on('text', handlers.handleText as never);

  return bot;
}

/**
 * Returns the Telegraf bot instance, creating it lazily on first call.
 * Throws if TELEGRAM_BOT_TOKEN is not set.
 */
export function getBot(): Telegraf<BotContext> {
  if (!_bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set — cannot start bot');
    _bot = buildBot(token);
    logger.info('TELEGRAM_BOT_INITIALIZED');
  }
  return _bot;
}

// Resets the singleton — useful in tests
export function _resetBotForTesting(): void {
  _bot = undefined;
}
