-- Track Study is additive: existing revision subjects/topics remain intact.
CREATE TABLE "StudyStep" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "colour" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyChapter" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "legacyTopicId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyChapter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudyChapterProgress" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudyChapterProgress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudyStep_subjectId_active_position_idx" ON "StudyStep"("subjectId", "active", "position");
CREATE INDEX "StudyChapter_subjectId_title_idx" ON "StudyChapter"("subjectId", "title");
CREATE UNIQUE INDEX "StudyChapter_legacyTopicId_key" ON "StudyChapter"("legacyTopicId");
CREATE UNIQUE INDEX "StudyChapterProgress_chapterId_stepId_key" ON "StudyChapterProgress"("chapterId", "stepId");
CREATE INDEX "StudyChapterProgress_stepId_idx" ON "StudyChapterProgress"("stepId");

ALTER TABLE "StudyStep" ADD CONSTRAINT "StudyStep_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyChapter" ADD CONSTRAINT "StudyChapter_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyChapterProgress" ADD CONSTRAINT "StudyChapterProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "StudyChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyChapterProgress" ADD CONSTRAINT "StudyChapterProgress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "StudyStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed each existing subject with the standard ordered workflow. IDs are deterministic
-- within this migration so progress rows can safely refer to the matching steps.
INSERT INTO "StudyStep" ("id", "subjectId", "name", "position", "colour", "updatedAt")
SELECT 'study-step-' || md5(s."id" || ':' || defaults.position::text), s."id", defaults.name,
       defaults.position, defaults.colour, CURRENT_TIMESTAMP
FROM "Subject" s
CROSS JOIN (VALUES
  (0, 'Learn', '#4f8ef7'),
  (1, 'Short notes', '#f59e0b'),
  (2, 'Revise', '#8b5cf6'),
  (3, 'Mock test', '#14b8a6')
) AS defaults(position, name, colour);

-- Existing revision topics become chapters so users see their subjects and topic notes
-- immediately in Track Study. Revision data and the original Topic rows are untouched.
INSERT INTO "StudyChapter" ("id", "subjectId", "legacyTopicId", "title", "notes", "description", "createdAt", "updatedAt")
SELECT 'study-chapter-' || md5(t."id"), t."subjectId", t."id", t."title", t."notes", t."description", t."createdAt", CURRENT_TIMESTAMP
FROM "Topic" t;

-- Start with all new per-step markers unchecked. No existing stage-tick data existed;
-- the legacy checklist JSON remains untouched on Topic.
INSERT INTO "StudyChapterProgress" ("id", "chapterId", "stepId", "done", "createdAt", "updatedAt")
SELECT 'study-progress-' || md5(ch."id" || ':' || st."id"), ch."id", st."id", false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "StudyChapter" ch
JOIN "StudyStep" st ON st."subjectId" = ch."subjectId" AND st."active" = true;
