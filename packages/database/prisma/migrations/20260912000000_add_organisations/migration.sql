-- CreateEnum
CREATE TYPE "UsernameOwnerType" AS ENUM ('STUDENT', 'TEACHER');

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "organisationId" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "usernames" (
    "username" TEXT NOT NULL,
    "ownerType" "UsernameOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usernames_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "organisations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_organisations" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_organisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_organisations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "assignedByTeacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_organisations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usernames_ownerType_ownerId_idx" ON "usernames"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "organisations_normalizedName_key" ON "organisations"("normalizedName");

-- CreateIndex
CREATE INDEX "teacher_organisations_organisationId_idx" ON "teacher_organisations"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_organisations_teacherId_organisationId_key" ON "teacher_organisations"("teacherId", "organisationId");

-- CreateIndex
CREATE INDEX "student_organisations_organisationId_idx" ON "student_organisations"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "student_organisations_studentId_organisationId_key" ON "student_organisations"("studentId", "organisationId");

-- CreateIndex
CREATE INDEX "batches_organisationId_idx" ON "batches"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_phone_key" ON "teachers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- AddForeignKey
ALTER TABLE "teacher_organisations" ADD CONSTRAINT "teacher_organisations_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_organisations" ADD CONSTRAINT "teacher_organisations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_organisations" ADD CONSTRAINT "student_organisations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_organisations" ADD CONSTRAINT "student_organisations_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_organisations" ADD CONSTRAINT "student_organisations_assignedByTeacherId_fkey" FOREIGN KEY ("assignedByTeacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: backfill the global username registry from existing rows.
-- Safe by construction: a prior read-only check confirmed zero username
-- collisions exist between the students and teachers tables today, so this
-- INSERT cannot violate the new "usernames" primary key.
INSERT INTO "usernames" ("username", "ownerType", "ownerId")
SELECT "username", 'STUDENT'::"UsernameOwnerType", "id" FROM "students"
UNION ALL
SELECT "username", 'TEACHER'::"UsernameOwnerType", "id" FROM "teachers";
