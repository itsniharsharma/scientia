import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../config/app-config.service';

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
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
        prefix: config.get('QUEUE_PREFIX'),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
