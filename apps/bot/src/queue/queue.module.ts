import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../config/app-config.service';
import { QueueName } from '@scientia/shared';
import { PdfIngestProducerService } from './pdf-ingest-producer.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      // AppConfigModule is @Global — no explicit import needed
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD') || undefined,
          tls: config.get('REDIS_TLS') ? {} : undefined,
          // Required for BullMQ blocking commands
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        prefix: config.get('QUEUE_PREFIX'),
      }),
    }),
    BullModule.registerQueue({ name: QueueName.PdfIngest }),
  ],
  providers: [PdfIngestProducerService],
  exports: [PdfIngestProducerService],
})
export class QueueModule {}
