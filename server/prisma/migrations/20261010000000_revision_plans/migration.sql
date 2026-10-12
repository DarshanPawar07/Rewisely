ALTER TABLE "Subject" ADD CONSTRAINT "Subject_userId_name_key" UNIQUE ("userId", "name");

ALTER TABLE "Topic"
  ADD COLUMN "completedStudyAt" TIMESTAMP(3),
  ADD COLUMN "plannedRevisionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "revisionGapDays" INTEGER,
  ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT true;
