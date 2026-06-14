-- Phase 3: PDF status lifecycle + page status
--
-- 1. Replace PdfStatus enum (pending/partial removed; uploaded/queued/
--    ready_for_extraction/extraction_in_progress added)
-- 2. Add PageStatus enum for pdf_pages.status
-- 3. Add status column to pdf_pages
--
-- Run via: pnpm --filter @scientia/database exec prisma migrate dev

-- ── Step 1: Create the new PdfStatus type ────────────────────────────────────
CREATE TYPE "PdfStatus_new" AS ENUM (
  'uploaded',
  'queued',
  'processing',
  'ready_for_extraction',
  'extraction_in_progress',
  'completed',
  'failed'
);

-- ── Step 2: Migrate pdfs.status to new type ──────────────────────────────────
-- Drop default first (it references the old enum literal)
ALTER TABLE "pdfs" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "pdfs"
  ALTER COLUMN "status" TYPE "PdfStatus_new"
  USING (
    CASE "status"::text
      WHEN 'pending'    THEN 'uploaded'::"PdfStatus_new"
      WHEN 'partial'    THEN 'failed'::"PdfStatus_new"
      ELSE "status"::text::"PdfStatus_new"
    END
  );

-- ── Step 3: Swap enum names ───────────────────────────────────────────────────
DROP TYPE "PdfStatus";
ALTER TYPE "PdfStatus_new" RENAME TO "PdfStatus";

-- ── Step 4: Restore column default ───────────────────────────────────────────
ALTER TABLE "pdfs" ALTER COLUMN "status" SET DEFAULT 'uploaded'::"PdfStatus";

-- ── Step 5: Add PageStatus enum ───────────────────────────────────────────────
CREATE TYPE "PageStatus" AS ENUM ('pending', 'extracting', 'completed', 'failed');

-- ── Step 6: Add status column to pdf_pages ────────────────────────────────────
ALTER TABLE "pdf_pages"
  ADD COLUMN "status" "PageStatus" NOT NULL DEFAULT 'pending';
