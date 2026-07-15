import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from './telegram.types';
import { getTeacherByTelegramUserId } from './telegram.catalog';
import { logger } from '../../shared/logger';

// Parsed once at startup — a restart is required to pick up allowlist changes.
const ALLOWED_IDS = new Set(
  (process.env.TELEGRAM_ALLOWED_USER_IDS ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean),
);

/**
 * First-line middleware: silently drops every update from users not in
 * TELEGRAM_ALLOWED_USER_IDS. Never reveals the bot's existence.
 */
export const allowlistGuard: MiddlewareFn<BotContext> = async (ctx, next) => {
  const userId = ctx.from?.id.toString();
  if (!userId || !ALLOWED_IDS.has(userId)) {
    logger.warn('TELEGRAM_UNAUTHORIZED', {
      userId:     userId ?? 'unknown',
      updateType: ctx.updateType,
    });
    return; // silent drop
  }
  await next();
};

/**
 * Ensures ctx.session.teacherId is populated before any handler runs.
 *
 * If the teacher is not linked, passes /start commands through so that
 * handleStart can process a deep-link token. All other updates receive a
 * message directing the teacher to the web admin for secure token-based linking.
 */
export const teacherGuard: MiddlewareFn<BotContext> = async (ctx, next) => {
  // Fast path — already linked in this session
  if (ctx.session.teacherId) {
    await next();
    return;
  }

  const userId = ctx.from!.id.toString();

  // Fast path — linked in a previous session (e.g. after session expiry)
  const existing = await getTeacherByTelegramUserId(userId);
  if (existing) {
    ctx.session.teacherId = existing.id;
    logger.info('TELEGRAM_TEACHER_RESTORED', { userId, teacherId: existing.id });
    await next();
    return;
  }

  // Allow /start to pass through — handleStart processes the ?start=TOKEN payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messageText = (ctx.message as any)?.text as string | undefined;
  if (messageText?.startsWith('/start')) {
    await next();
    return;
  }

  // Not linked — direct to web admin for secure token-based linking
  await ctx.reply(
    '👋 <b>Welcome to Question Warehouse!</b>\n\n' +
    '🔗 Your Telegram account isn\'t linked yet.\n\n' +
    '1️⃣ Log in to the <b>web admin panel</b>\n' +
    '2️⃣ Go to <b>Profile → Link Telegram</b>\n' +
    '3️⃣ Tap the generated link to complete setup\n\n' +
    'Once linked, send /start to begin uploading questions.',
    { parse_mode: 'HTML' },
  );
};
