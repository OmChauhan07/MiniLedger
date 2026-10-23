-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('LENT', 'BORROWED');

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN "type" "LoanType" NOT NULL DEFAULT 'LENT';

-- CreateIndex
CREATE INDEX "Loan_userId_type_isRepaid_idx" ON "Loan"("userId", "type", "isRepaid");
