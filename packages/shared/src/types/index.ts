import {
  QuestionType,
  Difficulty,
  AssetContext,
  AssetType,
  StitchingMethod,
} from '../enums';

// ─── Gemini Contract ──────────────────────────────────────────────────────────

export interface GeminiBoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GeminiVisualElement {
  type: AssetType;
  context: AssetContext;
  bounding_box: GeminiBoundingBox;
  description: string;
}

export interface GeminiOption {
  label: string;
  text: string | null;
  has_image: boolean;
}

export interface GeminiMatchColumns {
  column_a: string[];
  column_b: string[];
}

export interface GeminiRawQuestion {
  question_text: string | null;
  question_type: QuestionType;
  is_continuation_from_previous_page: boolean;
  is_continued_on_next_page: boolean;
  question_sequence_number: string | null;
  partial_content_type: 'complete' | 'missing_options' | 'missing_stem' | 'missing_diagram';
  has_visual_element: boolean;
  visual_elements: GeminiVisualElement[];
  options: GeminiOption[];
  correct_answer: string | null;
  answer_explanation: string | null;
  subject_hint: string | null;
  chapter_hint: string | null;
  assertion: string | null;
  reason: string | null;
  match_columns: GeminiMatchColumns | null;
  integer_answer: number | null;
  extraction_confidence: number;
  confidence_flags: string[];
}

export interface GeminiPageResponse {
  page_questions: GeminiRawQuestion[];
}

// ─── Queue Job Payloads ───────────────────────────────────────────────────────

export interface PdfIngestJobData {
  pdfId: string;
  r2Key: string;
  sha256: string;
  organizationId: string;
}

export interface PdfPageConvertJobData {
  pdfId: string;
  organizationId: string;
}

export interface PageExtractJobData {
  pdfId: string;
  pdfPageId: string;
  pageNumber: number;
  r2Key: string;
  imageDimensions: { width: number; height: number };
  organizationId: string;
  promptVersion: string;
}

export interface PdfStitchJobData {
  pdfId: string;
  organizationId: string;
  totalPages: number;
}

export interface NotificationJobData {
  recipientId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

// ─── Question Metadata (JSONB shapes) ────────────────────────────────────────

export interface MatchFollowingMetadata {
  type: 'match_following';
  column_a: Array<{ key: string; text: string }>;
  column_b: Array<{ key: string; text: string }>;
  correct_pairs: Array<{ a: string; b: string }>;
}

export interface AssertionReasonMetadata {
  type: 'assertion_reason';
  assertion: string;
  reason: string;
}

export interface IntegerTypeMetadata {
  type: 'integer_type';
  min_value: number;
  max_value: number;
}

export type QuestionMetadata =
  | MatchFollowingMetadata
  | AssertionReasonMetadata
  | IntegerTypeMetadata
  | Record<string, unknown>;

// ─── Health Check ─────────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ServiceHealthCheck {
  status: HealthStatus;
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
}

export interface ReadinessCheck {
  status: HealthStatus;
  checks: {
    database: 'up' | 'down' | 'unchecked';
    redis: 'up' | 'down' | 'unchecked';
  };
}

// ─── Difficulty Distribution ───────────────────────────────────────────────────

export interface DifficultyDistribution {
  [Difficulty.Easy]: number;
  [Difficulty.Medium]: number;
  [Difficulty.Hard]: number;
}

// ─── Stitching ────────────────────────────────────────────────────────────────

export interface PageFragment {
  pdfId: string;
  pageNumber: number;
  questionSequenceNumber: string | null;
  rawQuestion: GeminiRawQuestion;
  stitchingMethod: StitchingMethod;
}
