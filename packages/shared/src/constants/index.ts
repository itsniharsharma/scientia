import { QueueName } from '../enums';

// ─── Queue Configuration ──────────────────────────────────────────────────────

export const QUEUE_RETRY_CONFIG = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
} as const;

export const QUEUE_RATE_LIMITS = {
  [QueueName.PageExtract]: {
    max: 60,
    duration: 60_000,
  },
} as const;

export const QUEUE_CONCURRENCY = {
  [QueueName.PdfIngest]: 2,
  [QueueName.PdfPageConvert]: 2,
  [QueueName.PageExtract]: 5,
  [QueueName.PdfStitch]: 3,
  [QueueName.NotificationSend]: 5,
} as const;

// ─── Extraction ───────────────────────────────────────────────────────────────

export const EXTRACTION_CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 0.97,
  NORMAL_REVIEW: 0.7,
  NEEDS_EDIT: 0.5,
} as const;

export const CHAPTER_CLASSIFICATION_CONFIDENCE_MIN = 0.6;

export const GEMINI_PROMPT_VERSION = 'v1.0.0';

// ─── PDF Processing ───────────────────────────────────────────────────────────

export const PDF_MAX_PAGES = 300;

export const PDF_PAGE_IMAGE_WIDTH = 1200;
export const PDF_PAGE_IMAGE_QUALITY = 90;
export const PDF_PAGE_IMAGE_FORMAT = 'jpeg' as const;

// ─── Recovery ─────────────────────────────────────────────────────────────────

export const STUCK_PDF_THRESHOLD_MINUTES = 10;

// ─── Asset Storage ────────────────────────────────────────────────────────────

export const R2_FOLDERS = {
  PDFS: 'pdfs',
  PAGE_IMAGES: 'pages',
  CROPS: 'crops',
} as const;

export const CLOUDINARY_FOLDERS = {
  QUESTIONS: 'scientia/questions',
  OPTIONS: 'scientia/options',
  ANSWERS: 'scientia/answers',
} as const;

// ─── Auto-save ────────────────────────────────────────────────────────────────

export const ATTEMPT_AUTO_SAVE_INTERVAL_MS = 30_000;
