import type { QuestionType } from '@scientia/types';

// ─── Upload Source & Status ───────────────────────────────────────────────────

export type UploadSource = 'TELEGRAM' | 'WEB_ADMIN' | 'ANDROID' | 'IOS' | 'BULK_IMPORT';

export type UploadJobStatus =
  | 'RECEIVED'
  | 'VALIDATING'
  | 'DOWNLOADING'
  | 'COMPRESSING'
  | 'UPLOADING'
  | 'CREATING_QUESTION'
  | 'COMPLETED'
  | 'FAILED'
  | 'ORPHANED';

// ─── Question type (platform-agnostic internal representation) ────────────────

export type UploadQuestionType = 'SINGLE' | 'MULTI' | 'INTEGER' | 'TRUE_FALSE';

export function toDbQuestionType(t: UploadQuestionType): QuestionType {
  const map: Record<UploadQuestionType, QuestionType> = {
    SINGLE:     'SINGLE_CHOICE',
    MULTI:      'MULTI_CHOICE',
    INTEGER:    'INTEGER',
    TRUE_FALSE: 'SINGLE_CHOICE',  // stored as SINGLE_CHOICE with 2 labelled options
  };
  return map[t];
}

// ─── Upload Context ───────────────────────────────────────────────────────────

export interface UploadContext {
  uploadId:     string;
  teacherId:    string;
  topicId:      string;
  uploadSource: UploadSource;
  timestamp:    Date;
}

// ─── Upload Request (platform-agnostic) ──────────────────────────────────────

export interface UploadRequest {
  context:       UploadContext;
  imageStream:   NodeJS.ReadableStream;
  questionType:  UploadQuestionType;
  correctAnswer: string;
}

// ─── Step Timings ────────────────────────────────────────────────────────────

export interface StepTimings {
  validationMs?: number;
  streamingMs?:  number;   // download + compress + upload — concurrent in one pipeline
  dbMs?:         number;
  totalMs?:      number;
}

// ─── Upload Result ────────────────────────────────────────────────────────────

export interface UploadResult {
  questionId:         string;
  cloudinaryPublicId: string;
  uploadJobId:        string;
  timings:            StepTimings;
}

// ─── Cloudinary ───────────────────────────────────────────────────────────────

export interface CloudinaryUploadResult {
  publicId:  string;
  secureUrl: string;
  bytes:     number;
  width:     number;
  height:    number;
  format:    string;
}

// Telegram-specific session types live in telegram/telegram.types.ts to keep this
// file platform-agnostic. Import from there in Telegram layer code.
