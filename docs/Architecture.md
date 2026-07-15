# Scientia — System Architecture

## Overview

Scientia is a monorepo consisting of an Express backend, a Next.js frontend, and shared packages. The platform serves two distinct audiences: **teachers** who author questions via Telegram, and **students** who sit timed tests via the web application.

```
monorepo/
├── backend/          Express API + Prisma ORM
├── packages/
│   ├── database/     Prisma schema and generated client
│   ├── types/        Shared TypeScript types
│   └── validators/   Shared Zod validators
└── docs/             This directory
```

---

## Backend Layers

```
┌─────────────────────────────────────────────────────────────────┐
│  HTTP Routes (Express)                                          │
│  auth · tests · attempts · subjects · chapters · topics        │
│  questions · cloudinary · telegram/webhook · health            │
├──────────────────┬──────────────────────────────────────────────┤
│  Auth Layer      │  Telegram Bot Layer                          │
│  JWT httpOnly    │  Telegraf v4 (webhook mode)                  │
│  cookies         │  Session (Redis / in-memory fallback)        │
├──────────────────┼──────────────────────────────────────────────┤
│  Application     │  Upload Pipeline                             │
│  Services        │  ValidationService → ImageService →          │
│                  │  CloudinaryService → QuestionService         │
├──────────────────┴──────────────────────────────────────────────┤
│  Data Layer                                                     │
│  Prisma (PostgreSQL / Supabase) · Upstash Redis (Cloudflare)   │
│  Cloudinary CDN                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Services

### Auth
- JWT tokens stored in httpOnly cookies (no localStorage exposure)
- Separate Teacher and Student roles
- Rate-limited login endpoints via `express-rate-limit` + Redis store

### Tests
- Teachers create tests and assign them to batches
- Fair-distribution algorithm balances question selection across topics
- Attempts are time-boxed; score is computed server-side

### Upload Pipeline (Telegram)
See [UploadPipeline.md](UploadPipeline.md) for full details.

### Health & Observability
- `GET /health` — dependency probe (DB, Redis, Cloudinary, Telegram)
- `GET /internal/upload-status` — in-process metrics snapshot + live DB counts

---

## Infrastructure

| Service    | Provider       | Notes                                    |
|------------|----------------|------------------------------------------|
| Database   | Supabase (Postgres) | Connection pooling via PgBouncer    |
| Cache/Session | Upstash Redis | Cloudflare-edge; graceful no-op fallback |
| Image CDN  | Cloudinary     | Signed URLs, authenticated delivery      |
| Hosting    | Render.com     | Node 20, environment variables in dashboard |
| Telegram   | Bot API (Webhook) | Secret-header-validated webhook       |

---

## Environment Variables

### Required at startup
```
DATABASE_URL
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_ALLOWED_USER_IDS   # comma-separated Telegram user IDs
```

### Optional
```
UPSTASH_REDIS_REST_URL      # session persistence + rate limiting + dedup
UPSTASH_REDIS_REST_TOKEN
CLIENT_URL                  # CORS allowlist for production frontend
NODE_ENV                    # development | production | test
PORT                        # default 3001
```

---

## Request Flow (Student Exam)

```
Browser → POST /auth/student/login
       → GET  /tests/:id            (fetch test)
       → POST /attempts             (start attempt)
       → GET  /attempts/:id         (poll progress)
       → PUT  /attempts/:id/submit  (score server-side)
```

## Request Flow (Teacher Upload)

```
Telegram → POST /telegram/webhook
         → allowlistGuard → teacherGuard
         → session load (Redis)
         → handler (handlePhoto / handleCallback / handleText)
         → TelegramImageAdapter.download()
         → UploadService.upload()
         → ValidationService → ImageService → CloudinaryService → QuestionService
         → session save (Redis)
         → progress replies to teacher
```
