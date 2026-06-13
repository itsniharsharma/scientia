import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import type { ReadinessCheck, ServiceHealthCheck } from '@scientia/shared';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  live(): ServiceHealthCheck {
    return {
      status: 'ok',
      service: 'bot',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env['npm_package_version'] ?? '0.0.1',
    };
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<ReadinessCheck> {
    const [dbUp, redisUp] = await Promise.all([
      this.prisma.healthCheck(),
      this.redis.healthCheck(),
    ]);

    return {
      status: dbUp && redisUp ? 'ok' : 'degraded',
      checks: {
        database: dbUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    };
  }
}
