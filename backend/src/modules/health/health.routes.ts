import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { uploadMetrics } from '../../teleService/metrics';

const router = Router();

// ── Dependency probes ─────────────────────────────────────────────────────────

async function probeDatabase(): Promise<{ status: 'ok' | 'error'; latencyMs?: number; error?: string }> {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}

async function probeRedis(): Promise<{ status: 'ok' | 'error' | 'disabled'; latencyMs?: number }> {
  if (!redis) return { status: 'disabled' };
  const t = Date.now();
  try {
    await redis.ping();
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch {
    return { status: 'error' };
  }
}

function probeCloudinary(): { status: 'configured' | 'not_configured' } {
  const ok = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  return { status: ok ? 'configured' : 'not_configured' };
}

async function probeTelegram(): Promise<{ status: 'ok' | 'error' | 'not_configured'; botUsername?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { status: 'not_configured' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    if (!res.ok) return { status: 'error' };
    const data = await res.json() as { ok: boolean; result?: { username: string } };
    if (!data.ok) return { status: 'error' };
    return { status: 'ok', botUsername: data.result?.username };
  } catch {
    return { status: 'error' };
  }
}

// ── GET /health ───────────────────────────────────────────────────────────────
// Probes only local infrastructure (DB + Redis + config).
// Safe for load-balancer and liveness probes — no external API calls.

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const [db, redisResult] = await Promise.all([
    probeDatabase(),
    probeRedis(),
  ]);
  const cloudinary = probeCloudinary();

  const healthy = db.status === 'ok';

  res.status(healthy ? 200 : 503).json({
    status:    healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database:  db,
      redis:     redisResult,
      cloudinary,
    },
  });
});

// ── GET /health/deep ──────────────────────────────────────────────────────────
// Full dependency check including external API calls (Telegram).
// Do NOT use this as a load-balancer probe — Telegram latency can cause false
// degraded signals.  Use for manual SRE checks and alerting dashboards only.

router.get('/health/deep', async (_req: Request, res: Response): Promise<void> => {
  const [db, redisResult, telegram] = await Promise.all([
    probeDatabase(),
    probeRedis(),
    probeTelegram(),
  ]);
  const cloudinary = probeCloudinary();

  const healthy = db.status === 'ok';

  res.status(healthy ? 200 : 503).json({
    status:    healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database:  db,
      redis:     redisResult,
      cloudinary,
      telegram,
    },
  });
});

// ── Internal API key middleware ───────────────────────────────────────────────
// Protects /internal/* endpoints from public access.
// Pass the key as: Authorization: Bearer <INTERNAL_API_KEY>
// or:             x-internal-api-key: <INTERNAL_API_KEY>

function requireInternalKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected) {
    // Not configured — deny all access rather than leaving open
    res.status(401).json({ error: 'Internal API key is not configured on this server' });
    return;
  }
  const provided =
    (req.headers['x-internal-api-key'] as string | undefined) ??
    req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ── GET /internal/upload-status ───────────────────────────────────────────────
// Returns in-process counters (since last restart) plus live DB orphan/today counts.
// Requires: Authorization: Bearer <INTERNAL_API_KEY>
// or:       x-internal-api-key: <INTERNAL_API_KEY>

router.get('/internal/upload-status', requireInternalKey, async (_req: Request, res: Response): Promise<void> => {
  const metrics = uploadMetrics.snapshot();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [todayUploads, liveOrphans] = await Promise.all([
    prisma.uploadJob
      .count({ where: { status: 'COMPLETED', createdAt: { gte: startOfDay } } })
      .catch(() => null),
    prisma.uploadJob
      .count({ where: { status: 'ORPHANED' } })
      .catch(() => null),
  ]);

  const uptimeSeconds = Math.floor(
    (Date.now() - new Date(metrics.startedAt).getTime()) / 1000,
  );

  res.json({
    uploads: {
      total:             metrics.totalUploads,
      failures:          metrics.totalFailures,
      rollbacks:         metrics.totalRollbacks,
      orphans:           metrics.totalOrphans,
      retries:           metrics.totalRetries,
      duplicateWarnings: metrics.totalDuplicateWarnings,
      rateLimited:       metrics.totalRateLimited,
      todayUploads,
      liveOrphans,
    },
    performance: {
      avgDurationMs:  metrics.avgDurationMs,
      avgStreamingMs: metrics.avgStreamingMs,
      avgDbMs:        metrics.avgDbMs,
      avgImageBytes:  metrics.avgImageBytes,
    },
    uptime: {
      startedAt:      metrics.startedAt,
      uptimeSeconds,
    },
  });
});

export default router;
