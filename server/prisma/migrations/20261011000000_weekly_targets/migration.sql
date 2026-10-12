CREATE TABLE "WeeklyTarget" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "weekEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyTarget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyTargetTask" (
  "id" TEXT NOT NULL,
  "weeklyTargetId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyTargetTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WeeklyTarget_userId_weekStart_idx" ON "WeeklyTarget"("userId", "weekStart");
CREATE INDEX "WeeklyTargetTask_weeklyTargetId_idx" ON "WeeklyTargetTask"("weeklyTargetId");
ALTER TABLE "WeeklyTarget" ADD CONSTRAINT "WeeklyTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyTargetTask" ADD CONSTRAINT "WeeklyTargetTask_weeklyTargetId_fkey" FOREIGN KEY ("weeklyTargetId") REFERENCES "WeeklyTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
