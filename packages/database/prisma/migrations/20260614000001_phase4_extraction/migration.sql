-- Phase 4: Gemini extraction pipeline
--
-- 1. Extend ExtractionStatus with 'processing' and 'invalid_response'
-- 2. Extend PageStatus with 'extracted'
-- 3. Add Phase 4 tracking columns to raw_page_extractions
-- 4. Add FK + new indexes
--
-- Note: raw_page_extractions must be empty when this runs (no extractions yet).

-- ── Step 1: Extend ExtractionStatus enum ─────────────────────────────────────
ALTER TYPE "ExtractionStatus" ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE "ExtractionStatus" ADD VALUE IF NOT EXISTS 'invalid_response';

-- ── Step 2: Extend PageStatus enum ───────────────────────────────────────────
ALTER TYPE "PageStatus" ADD VALUE IF NOT EXISTS 'extracted';

-- ── Step 3: Add Phase 4 columns to raw_page_extractions ──────────────────────
ALTER TABLE "raw_page_extractions"
  ADD COLUMN "organization_id"        UUID             NOT NULL,
  ADD COLUMN "page_image_r2_key"      TEXT             NOT NULL,
  ADD COLUMN "normalized_extraction"  JSONB,
  ADD COLUMN "model_version"          TEXT,
  ADD COLUMN "input_tokens"           INTEGER,
  ADD COLUMN "output_tokens"          INTEGER,
  ADD COLUMN "estimated_cost_usd"     DECIMAL(10, 8),
  ADD COLUMN "processing_duration_ms" INTEGER,
  ADD COLUMN "extraction_confidence"  DOUBLE PRECISION,
  ADD COLUMN "error_message"          TEXT;

-- ── Step 4: Foreign key ───────────────────────────────────────────────────────
ALTER TABLE "raw_page_extractions"
  ADD CONSTRAINT "raw_page_extractions_organization_id_fkey"
  FOREIGN KEY ("organization_id")
  REFERENCES "organizations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Step 5: New indexes ───────────────────────────────────────────────────────
CREATE INDEX "raw_page_extractions_organization_id_idx"
  ON "raw_page_extractions"("organization_id");

CREATE INDEX "raw_page_extractions_prompt_version_idx"
  ON "raw_page_extractions"("prompt_version");
