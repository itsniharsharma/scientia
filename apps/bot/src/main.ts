import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { validateEnv } from '@scientia/config';
import { BotModule } from './bot.module';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    BotModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  await app.listen(env.BOT_PORT, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`Bot running on http://0.0.0.0:${env.BOT_PORT}`, 'Bootstrap');
}

bootstrap();
