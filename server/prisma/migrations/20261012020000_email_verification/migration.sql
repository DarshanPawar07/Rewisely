-- Existing accounts are grandfathered in as verified to avoid locking out current users.
ALTER TABLE "User"
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerificationTokenHash" TEXT,
  ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "emailVerificationSentAt" TIMESTAMP(3);
-- New accounts must opt in to a verified state through signup or Google OAuth.
ALTER TABLE "User" ALTER COLUMN "emailVerified" SET DEFAULT FALSE;

CREATE UNIQUE INDEX "User_emailVerificationTokenHash_key" ON "User"("emailVerificationTokenHash");
