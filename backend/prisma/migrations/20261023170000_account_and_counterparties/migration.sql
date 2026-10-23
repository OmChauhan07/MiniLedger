-- AlterTable: Add profile fields to User
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "name" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for User lookups
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "User_name_idx" ON "User"("name");

-- AlterTable: Add counterparty fields to Loan
ALTER TABLE "Loan" 
  ADD COLUMN IF NOT EXISTS "counterpartyUserId" TEXT,
  ADD COLUMN IF NOT EXISTS "counterpartyPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex for Loan counterparty queries
CREATE INDEX IF NOT EXISTS "Loan_userId_counterpartyUserId_idx" ON "Loan"("userId", "counterpartyUserId");

-- AddForeignKey
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Loan_counterpartyUserId_fkey'
  ) THEN
    ALTER TABLE "Loan" 
      ADD CONSTRAINT "Loan_counterpartyUserId_fkey" 
      FOREIGN KEY ("counterpartyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
