import { Request, Response, NextFunction } from 'express';
import * as TeacherService from './teacher.service';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await TeacherService.getTeacherProfile(req.user!.userId);
    res.json(profile);
  } catch (err) { next(err); }
}

/**
 * POST /teacher/telegram-link-token
 *
 * Generates a one-time Telegram deep-link token for the authenticated teacher.
 * The teacher taps the returned deepLink (or sends /start <token> to the bot)
 * to link their Telegram account. The token expires after 15 minutes.
 *
 * Response: { token, expiresAt, deepLink }
 * deepLink is null if TELEGRAM_BOT_USERNAME is not configured.
 */
export async function generateTelegramLinkToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await TeacherService.generateTelegramLinkToken(req.user!.userId);
    res.status(201).json(result);
  } catch (err) { next(err); }
}
