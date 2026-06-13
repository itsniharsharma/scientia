import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { validateEnv } from '@scientia/config';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create<NestFastifyApplication>(
    WorkerModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  await app.listen(env.WORKER_PORT, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`Worker running on http://0.0.0.0:${env.WORKER_PORT}`, 'Bootstrap');
}

bootstrap();
