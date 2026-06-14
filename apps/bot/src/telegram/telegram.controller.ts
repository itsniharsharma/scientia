import {
  Controller,
  Post,
  Body,
  HttpCode,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { TelegramWebhookGuard } from './telegram-webhook.guard';
import { TelegramWebhookService } from './telegram-webhook.service';
import type { TelegramUpdate } from './types';

@Controller('webhook')
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(private readonly webhookService: TelegramWebhookService) {}

  // Telegram requires a 200 response within its timeout window.
  // We process synchronously so the 200 is sent only after ingestion completes
  // (or safely fails). TelegramWebhookService never throws — it catches all
  // errors internally and replies to the chat, so Telegram always gets 200.
  @Post()
  @HttpCode(200)
  @UseGuards(TelegramWebhookGuard)
  async handleWebhook(@Body() update: TelegramUpdate): Promise<void> {
    await this.webhookService.handle(update);
  }
}
