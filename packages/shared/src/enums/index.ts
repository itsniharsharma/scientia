export enum UserRole {
  Admin = 'admin',
  Teacher = 'teacher',
  Student = 'student',
}

export enum PdfStatus {
  Uploaded = 'uploaded',
  Queued = 'queued',
  Processing = 'processing',
  ReadyForExtraction = 'ready_for_extraction',
  ExtractionInProgress = 'extraction_in_progress',
  Completed = 'completed',
  Failed = 'failed',
}

export enum PageStatus {
  Pending = 'pending',
  Extracting = 'extracting',
  Extracted = 'extracted',
  Completed = 'completed',
  Failed = 'failed',
}

export enum PdfSource {
  Telegram = 'telegram',
  DirectUpload = 'direct_upload',
}

export enum ExtractionStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  InvalidResponse = 'invalid_response',
  Failed = 'failed',
}

export enum QuestionType {
  SingleCorrect = 'single_correct',
  MultiCorrect = 'multi_correct',
  IntegerType = 'integer_type',
  AssertionReason = 'assertion_reason',
  MatchFollowing = 'match_following',
  Subjective = 'subjective',
  FillBlank = 'fill_blank',
}

export enum ReviewStatus {
  PendingReview = 'pending_review',
  Approved = 'approved',
  Rejected = 'rejected',
  NeedsEdit = 'needs_edit',
}

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum StitchingMethod {
  SinglePage = 'single_page',
  MultiPageStitched = 'multi_page_stitched',
  Manual = 'manual',
}

export enum AssetContext {
  Question = 'question',
  Option = 'option',
  Answer = 'answer',
  Explanation = 'explanation',
  FullPage = 'full_page',
}

export enum AssetType {
  Image = 'image',
  Diagram = 'diagram',
  Graph = 'graph',
  Circuit = 'circuit',
  Chemical = 'chemical',
  Table = 'table',
  Other = 'other',
}

export enum TestStatus {
  Draft = 'draft',
  Published = 'published',
  Active = 'active',
  Completed = 'completed',
  Archived = 'archived',
}

export enum AttemptStatus {
  InProgress = 'in_progress',
  Submitted = 'submitted',
  Abandoned = 'abandoned',
}

export enum SelectionStrategy {
  Random = 'random',
  LeastUsed = 'least_used',
  DifficultyBalanced = 'difficulty_balanced',
}

export enum NotificationType {
  TestPublished = 'test_published',
  TestStarting = 'test_starting',
  TestResult = 'test_result',
  PdfProcessed = 'pdf_processed',
  QuestionReview = 'question_review',
}

export enum QueueName {
  PdfIngest = 'pdf:ingest',
  PdfPageConvert = 'pdf:page-convert',
  PageExtract = 'page:extract',
  PdfStitch = 'pdf:stitch',
  NotificationSend = 'notification:send',
  DlqFailed = 'dlq:failed',
}

export enum SubjectCode {
  Physics = 'PHY',
  Chemistry = 'CHE',
  Mathematics = 'MAT',
  Botany = 'BOT',
  Zoology = 'ZOO',
}

export enum SyllabusTag {
  Jee = 'JEE',
  Neet = 'NEET',
  Cbse = 'CBSE',
  All = 'ALL',
}
