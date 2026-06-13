import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { getEnv } from '@scientia/config';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: getEnv().LOG_LEVEL,
        transport:
          getEnv().NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        customProps: () => ({ service: 'bot' }),
      },
    }),
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    HealthModule,
  ],
})
export class BotModule {}
