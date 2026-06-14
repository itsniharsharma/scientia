import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import type { TelegramFile, TelegramApiResponse } from './types';

// Telegram Bot API enforces a 20 MB cap on files downloaded via getFile
export const TELEGRAM_MAX_FILE_BYTES = 20 * 1024 * 1024;

@Injectable()
export class TelegramClientService implements OnModuleInit {
  private readonly logger = new Logger(TelegramClientService.name);
  private readonly apiBase: string;
  private readonly fileBase: string;

  constructor(private readonly config: AppConfigService) {
    const token = this.config.get('TELEGRAM_BOT_TOKEN');
    this.apiBase = `https://api.telegram.org/bot${token}`;
    this.fileBase = `https://api.telegram.org/file/bot${token}`;
  }

  async onModuleInit(): Promise<void> {
    await this.registerWebhook();
  }

  // ── Webhook registration ──────────────────────────────────────────────────

  private async registerWebhook(): Promise<void> {
    const webhookUrl = this.config.get('TELEGRAM_WEBHOOK_URL');
    const secretToken = this.config.get('TELEGRAM_WEBHOOK_SECRET');

    try {
      const response = await fetch(`${this.apiBase}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: `${webhookUrl}/webhook`,
          secret_token: secretToken,
          allowed_updates: ['message'],
          drop_pending_updates: false,
        }),
      });

      const body = await response.json() as TelegramApiResponse<boolean>;

      if (body.ok) {
        this.logger.log(`Webhook registered: ${webhookUrl}/webhook`);
      } else {
        // Telegram returns ok:false when the URL is unreachable (e.g. localhost in dev).
        // Log as warning — the bot still processes updates if you use getUpdates or ngrok.
        this.logger.warn(
          `Webhook registration returned ok:false — ${body.description ?? 'no description'}. ` +
            `In development, use ngrok or set TELEGRAM_WEBHOOK_URL to a public URL.`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Webhook registration failed (network error): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // ── File download ─────────────────────────────────────────────────────────

  async getFile(fileId: string): Promise<TelegramFile> {
    const url = `${this.apiBase}/getFile?file_id=${encodeURIComponent(fileId)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Telegram getFile HTTP ${response.status}`);
    }

    const body = await response.json() as TelegramApiResponse<TelegramFile>;

    if (!body.ok) {
      throw new Error(`Telegram getFile error ${body.error_code ?? ''}: ${body.description}`);
    }

    return body.result;
  }

  async downloadFile(filePath: string): Promise<Buffer> {
    const url = `${this.fileBase}/${filePath}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Telegram file download HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  async sendMessage(
    chatId: number | string,
    text: string,
    replyToMessageId?: number,
  ): Promise<void> {
    const payload: Record<string, unknown> = { chat_id: chatId, text };

    if (replyToMessageId !== undefined) {
      payload['reply_parameters'] = { message_id: replyToMessageId };
    }

    const response = await fetch(`${this.apiBase}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      this.logger.warn(`sendMessage HTTP ${response.status} to chat ${chatId}`);
    }
  }
}
