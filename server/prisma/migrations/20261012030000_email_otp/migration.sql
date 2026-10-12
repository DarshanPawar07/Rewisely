-- OTP-specific attempt tracking and independent passwordless-login code storage.
-- Kept in a new migration so databases that already applied email verification
-- can upgrade without editing or replaying an existing migration.
ALTER TABLE "User"
  ADD COLUMN "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailLoginCodeHash" TEXT,
  ADD COLUMN "emailLoginCodeExpiresAt" TIMESTAMP(3),
  ADD COLUMN "emailLoginCodeSentAt" TIMESTAMP(3),
  ADD COLUMN "emailLoginCodeAttempts" INTEGER NOT NULL DEFAULT 0;
