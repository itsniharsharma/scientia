# Operational Runbook

## Deployment

### Prerequisites
All required environment variables must be set (see [Architecture.md](Architecture.md)):

```bash
# Verify nothing is missing before deploying
node -e "
const required = [
  'DATABASE_URL','JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET',
  'TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET','TELEGRAM_ALLOWED_USER_IDS'
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) { console.error('MISSING:', missing); process.exit(1); }
console.log('All required env vars present');
"
```

### Register Telegram Webhook
Run once after deployment or when the backend URL changes:

```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_BACKEND_URL/telegram/webhook",
    "secret_token": "'"${TELEGRAM_WEBHOOK_SECRET}"'",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Verify:
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

---

## Health Checks

### Basic health (CI / load-balancer probe)
```
GET /health
```
Returns 200 when database is reachable; 503 when degraded.

```json
{
  "status": "healthy",
  "timestamp": "2026-07-09T09:00:00.000Z",
  "services": {
    "database":  { "status": "ok", "latencyMs": 5 },
    "redis":     { "status": "ok", "latencyMs": 2 },
    "cloudinary":{ "status": "configured" },
    "telegram":  { "status": "ok", "botUsername": "ScientiaBotName" }
  }
}
```

### Upload status dashboard
```
GET /internal/upload-status
```
Returns in-process counters (since last restart) plus live DB orphan/today counts.

---

## Monitoring Alerts

Set up alerts on these log patterns (Render log drain → your monitoring service):

| Log Message                    | Severity | Action                                     |
|-------------------------------|----------|--------------------------------------------|
| `UPLOAD_FAILED`               | Warning  | Track failure rate; investigate if >5%     |
| `ROLLBACK_FAILED_ORPHANED`    | Error    | Run `/cleanup` in Telegram immediately     |
| `TELEGRAM_CLOUDINARY_RETRY`   | Info     | Cloudinary transient error; watch frequency|
| `SESSION_WRITE_ERROR`         | Warning  | Redis degraded; session not persisted       |
| `Slow query detected`         | Warning  | DB query >1 s; check indexes               |

---

## Incident Response

### Database unreachable
1. Check `/health` — database status will be `error`
2. Check Supabase status page
3. If connection pool exhausted: restart backend on Render (drains connections)
4. In-flight uploads will fail with `UploadDatabaseError`; teachers will see "Question save failed"

### Cloudinary errors
1. Check Cloudinary dashboard for quota / API errors
2. ORPHANED jobs accumulate — run `/cleanup` in Telegram once Cloudinary recovers
3. Teachers can retry uploads immediately (rollback ensures no duplicate assets)

### Redis unavailable
1. Session dedup, rate limiting, and dedup are disabled — uploads continue working
2. Each user gets a fresh in-memory session (no cross-restart persistence)
3. Restore Upstash token — sessions resume from Redis on next request

### Telegram webhook failing
1. Check `/health` — telegram status will be `error`
2. Verify `TELEGRAM_BOT_TOKEN` is correct: `curl https://api.telegram.org/bot{TOKEN}/getMe`
3. Re-register webhook with correct URL (see Deployment section)
4. Check `X-Telegram-Bot-Api-Secret-Token` header matches `TELEGRAM_WEBHOOK_SECRET`

---

## Orphan Cleanup

Orphaned jobs have a Cloudinary asset that was not rolled back. Clean them up:

**Via Telegram** (immediate):
Send `/cleanup` to the bot. Output shows found / resolved / failed counts.

**Via API** (if Telegram is down):
```bash
# Run from server — requires DB + Cloudinary access
node -e "
const { runCleanup } = require('./dist/teleService/jobs/cleanup');
runCleanup().then(r => console.log(r)).catch(console.error);
"
```

---

## Adding a New Teacher

1. Create a Teacher record in the DB with their `telegramUserId`:
```sql
INSERT INTO teachers (id, username, password, "telegramUserId")
VALUES (gen_random_uuid(), 'teacher_username', '<bcrypt_hash>', '<telegram_user_id>');
```

2. Add their Telegram user ID to `TELEGRAM_ALLOWED_USER_IDS` (comma-separated):
```
TELEGRAM_ALLOWED_USER_IDS=6388410726,NEW_USER_ID
```

3. Redeploy / restart the backend for the env var to take effect.

---

## Rate Limit Tuning

Current limit: 20 uploads / 60 seconds per teacher.

To change, update `telegram.rate-limit.ts`:
```typescript
const WINDOW_SECONDS = 60;   // window duration
const MAX_UPLOADS    = 20;   // max per window
```

Rate limit keys are `rl:tg:upload:{teacherId}` in Redis.

---

## Troubleshooting

### Teacher receives "Upload data incomplete"
- Session may have expired (30-min inactivity TTL)
- Teacher should send `/start` to reset and re-select topic

### Teacher receives "Duplicate Image Detected" unexpectedly
- The 24-hour dedup TTL may be causing false positives if the teacher legitimately re-photographs the same page
- Teacher should press "Upload Anyway"
- TTL can be adjusted in `telegram.session.ts: DEDUP_TTL_SECONDS`

### Upload stuck at "Compressing · Uploading · Saving..."
- Likely a Cloudinary or DB timeout
- The pipeline will error after the provider's own timeout
- Teacher will receive an appropriate error message and can retry

### Questions not appearing in student tests
- Check `QuestionStatus` — new questions default to `DRAFT`
- Run: `UPDATE questions SET status = 'PUBLISHED' WHERE status = 'DRAFT';`
- Or add a publish step to the upload pipeline (future enhancement)
