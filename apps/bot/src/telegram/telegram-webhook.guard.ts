import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class TelegramWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TelegramWebhookGuard.name);

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();

    const received = request.headers['x-telegram-bot-api-secret-token'];
    const expected = this.config.get('TELEGRAM_WEBHOOK_SECRET');

    if (!received || received !== expected) {
      this.logger.warn('Rejected webhook request: invalid or missing secret token');
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
