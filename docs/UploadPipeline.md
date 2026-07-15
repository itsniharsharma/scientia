# Upload Pipeline

## Overview

The Upload Pipeline converts a Telegram photo into a stored, indexed question. It is composed of five sequential services orchestrated by `UploadService`.

```
Telegram photo
    │
    ▼
TelegramImageAdapter       download original from Telegram CDN (retries once)
    │ NodeJS.ReadableStream
    ▼
ValidationService          validate teacher, topic, question type, answer format
    │
    ▼
ImageService (Sharp)       ─┐
                             ├── streaming pipeline (backpressure-aware)
CloudinaryService           ─┘   compress → upload to Cloudinary CDN
    │ publicId
    ▼
QuestionService            create Question + Options in Postgres
    │ questionId
    ▼
UploadJob → COMPLETED
```

---

## UploadJob Lifecycle

Every upload creates an `UploadJob` record before any processing begins. Status transitions:

```
RECEIVED → VALIDATING → DOWNLOADING → COMPRESSING → UPLOADING
        → CREATING_QUESTION → COMPLETED
                          ↘ FAILED (on any non-DB failure)
                          ↘ ORPHANED (DB fail after Cloudinary succeed + rollback fail)
```

ORPHANED jobs are recoverable — see [cleanup](#orphan-cleanup) below.

---

## Error Classes

| Class                 | Trigger                          | Teacher message                         |
|-----------------------|----------------------------------|-----------------------------------------|
| `UploadValidationError` | Bad topic, invalid answer      | "Validation failed" + reason            |
| `UploadImageError`    | Sharp transform or download fail | "Image processing failed — resend"      |
| `UploadCloudinaryError` | Cloudinary API error           | "Cloud upload failed" — retried once    |
| `UploadDatabaseError` | Prisma write fail after upload   | "Question save failed — rolled back"    |

---

## Retry Policy

| Step               | Retry?            | Notes                                              |
|--------------------|-------------------|----------------------------------------------------|
| Telegram download  | Yes — once        | Adapter retries `doDownload()` after 1 s           |
| Cloudinary upload  | Yes — once        | Handler re-downloads from Telegram + new uploadId  |
| DB write           | No                | Transactional; failure triggers rollback instead   |

---

## Rollback

When a DB write fails after a successful Cloudinary upload:

1. `CloudinaryService.delete(publicId)` is called
2. If delete succeeds → UploadJob set to FAILED
3. If delete also fails → UploadJob set to ORPHANED (asset still exists in Cloudinary)

ORPHANED jobs are cleaned up by the `/cleanup` Telegram command or automated cron.

---

## Orphan Cleanup

`/cleanup` (Telegram command, all allowlisted users):
1. Queries all `ORPHANED` UploadJobs
2. For each: retries `CloudinaryService.delete(publicId)`
3. On success: marks job FAILED (resolved)
4. On failure: leaves as ORPHANED (will retry next time)

---

## Duplicate Detection

When a teacher sends a photo, its `file_unique_id` (Telegram's stable image fingerprint) is checked against a Redis key `tg:dedup:{fileUniqueId}` with a 24-hour TTL.

- Cache miss → normal upload flow
- Cache hit → teacher sees warning with **Upload Anyway** / **Cancel**
- After successful upload → `markUploaded(fileUniqueId, questionId)` writes the key

No image hashing is performed — dedup is Telegram-ID-based only.

---

## Rate Limiting

Redis sliding window: **20 uploads per 60 seconds per teacher**.

Key: `rl:tg:upload:{teacherId}` — INCR + EXPIRE.

Fails open (allows upload) when Redis is unavailable.

---

## Metrics

`GET /internal/upload-status` returns:

```json
{
  "uploads": {
    "total": 0,
    "failures": 0,
    "rollbacks": 0,
    "orphans": 0,
    "retries": 0,
    "duplicateWarnings": 0,
    "rateLimited": 0,
    "todayUploads": 0,
    "liveOrphans": 0
  },
  "performance": {
    "avgDurationMs": null,
    "avgStreamingMs": null,
    "avgDbMs": null,
    "avgImageBytes": null
  },
  "uptime": {
    "startedAt": "2026-07-09T08:00:00.000Z",
    "uptimeSeconds": 3600
  }
}
```

Counters reset on server restart (in-memory). `todayUploads` and `liveOrphans` are live DB queries.

---

## Structured Log Events

Every upload logs the following correlation fields:

| Field           | Source                  |
|-----------------|-------------------------|
| `uploadId`      | `crypto.randomUUID()`   |
| `teacherId`     | Cached in Redis session |
| `telegramUserId`| `ctx.from.id`           |
| `topicId`       | Session                 |
| `questionId`    | Returned by DB insert   |
| `durationMs`    | `Date.now() - startMs`  |

Key log messages:
- `UPLOAD_RECEIVED` — job created
- `VALIDATION_DONE` — answer + teacher + topic valid
- `CLOUDINARY_UPLOAD_DONE` — bytes, publicId, streamingMs
- `QUESTION_CREATED` — questionId, dbMs
- `UPLOAD_SUCCESS` — full timings
- `UPLOAD_FAILED` — failedStep, error, totalMs
- `ROLLBACK_SUCCESS` / `ROLLBACK_FAILED_ORPHANED`
- `TELEGRAM_UPLOAD_SUCCESS` — handler-level correlation
- `TELEGRAM_UPLOAD_FAILED` — handler-level with telegramUserId
- `TELEGRAM_CLOUDINARY_RETRY` — retry event
