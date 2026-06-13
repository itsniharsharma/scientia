import { NextResponse } from 'next/server';
import type { ServiceHealthCheck } from '@scientia/shared';

export const dynamic = 'force-dynamic';

export function GET(): NextResponse<ServiceHealthCheck> {
  return NextResponse.json({
    status: 'ok',
    service: 'web',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '0.0.1',
  });
}
