-- Polish pass: TeacherOrganisation/StudentOrganisation had both a surrogate
-- uuid `id` PRIMARY KEY and a separate UNIQUE(teacherId, organisationId) /
-- UNIQUE(studentId, organisationId) constraint doing the same uniqueness
-- job. The `id` column was never referenced anywhere in application code or
-- by any other table's foreign key. This switches both tables to a
-- composite primary key, matching this codebase's existing pure-join-table
-- convention (see batch_students, which has always used
-- @@id([batchId, studentId]) with no surrogate id). Existing rows already
-- satisfy uniqueness on these column pairs (enforced by the constraint
-- being dropped), so this is a safe, non-destructive structural change.

-- DropIndex
DROP INDEX "student_organisations_studentId_organisationId_key";

-- DropIndex
DROP INDEX "teacher_organisations_teacherId_organisationId_key";

-- DropIndex
DROP INDEX "usernames_ownerType_ownerId_idx";

-- AlterTable
ALTER TABLE "student_organisations" DROP CONSTRAINT "student_organisations_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "student_organisations_pkey" PRIMARY KEY ("studentId", "organisationId");

-- AlterTable
ALTER TABLE "teacher_organisations" DROP CONSTRAINT "teacher_organisations_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "teacher_organisations_pkey" PRIMARY KEY ("teacherId", "organisationId");

-- CreateIndex
-- Supports the ON DELETE RESTRICT check on assignedByTeacherId (Postgres
-- must scan for referencing rows before allowing a Teacher delete).
CREATE INDEX "student_organisations_assignedByTeacherId_idx" ON "student_organisations"("assignedByTeacherId");
