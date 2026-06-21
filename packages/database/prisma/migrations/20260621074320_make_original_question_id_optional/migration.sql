-- DropForeignKey
ALTER TABLE "test_questions" DROP CONSTRAINT "test_questions_originalQuestionId_fkey";

-- AlterTable
ALTER TABLE "test_questions" ALTER COLUMN "originalQuestionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_originalQuestionId_fkey" FOREIGN KEY ("originalQuestionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
