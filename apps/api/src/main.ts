import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { validateEnv } from '@scientia/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1', { exclude: ['/health', '/health/ready', '/health/live'] });

  app.enableCors({
    origin: env.WEB_URL,
    credentials: true,
  });

  await app.listen(env.APP_PORT, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`API running on http://0.0.0.0:${env.APP_PORT}`, 'Bootstrap');
}

bootstrap();
