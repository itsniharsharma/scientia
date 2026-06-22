-- DropForeignKey
ALTER TABLE "responses" DROP CONSTRAINT "responses_testQuestionId_fkey";

-- CreateIndex
CREATE INDEX "attempts_studentId_status_idx" ON "attempts"("studentId", "status");

-- CreateIndex
CREATE INDEX "attempts_testId_idx" ON "attempts"("testId");

-- CreateIndex
CREATE INDEX "batch_students_studentId_idx" ON "batch_students"("studentId");

-- CreateIndex
CREATE INDEX "batches_teacherId_idx" ON "batches"("teacherId");

-- CreateIndex
CREATE INDEX "questions_topicId_status_idx" ON "questions"("topicId", "status");

-- CreateIndex
CREATE INDEX "questions_status_appearanceCount_idx" ON "questions"("status", "appearanceCount");

-- CreateIndex
CREATE INDEX "responses_attemptId_idx" ON "responses"("attemptId");

-- CreateIndex
CREATE INDEX "responses_testQuestionId_idx" ON "responses"("testQuestionId");

-- CreateIndex
CREATE INDEX "test_questions_testId_idx" ON "test_questions"("testId");

-- CreateIndex
CREATE INDEX "test_questions_originalQuestionId_idx" ON "test_questions"("originalQuestionId");

-- CreateIndex
CREATE INDEX "tests_teacherId_idx" ON "tests"("teacherId");

-- CreateIndex
CREATE INDEX "tests_batchId_idx" ON "tests"("batchId");

-- CreateIndex
CREATE INDEX "tests_status_scheduledAt_idx" ON "tests"("status", "scheduledAt");

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_testQuestionId_fkey" FOREIGN KEY ("testQuestionId") REFERENCES "test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
