-- CreateEnum
CREATE TYPE "IntegrityEventType" AS ENUM ('FOCUS_LOST', 'TAB_HIDDEN', 'PAGE_EXIT', 'SCREENSHOT_KEY', 'RETURNED');

-- CreateTable
CREATE TABLE "integrity_events" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "clientEventId" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "type" "IntegrityEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrity_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integrity_events_attemptId_occurredAt_idx" ON "integrity_events"("attemptId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "integrity_events_attemptId_clientEventId_key" ON "integrity_events"("attemptId", "clientEventId");

-- AddForeignKey
ALTER TABLE "integrity_events" ADD CONSTRAINT "integrity_events_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

