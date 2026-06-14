import { Module } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramWebhookService } from './telegram-webhook.service';
import { TelegramClientService } from './telegram-client.service';
import { TelegramWebhookGuard } from './telegram-webhook.guard';
import { StorageModule } from '../storage/storage.module';
import { QueueModule } from '../queue/queue.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [StorageModule, QueueModule, AuditModule],
  controllers: [TelegramController],
  providers: [TelegramWebhookService, TelegramClientService, TelegramWebhookGuard],
})
export class TelegramModule {}
