-- CreateIndex for counterparty filtering
CREATE INDEX IF NOT EXISTS "Loan_counterpartyUserId_idx" ON "Loan"("counterpartyUserId");

-- CreateIndex for counterparty repayment status
CREATE INDEX IF NOT EXISTS "Loan_counterpartyUserId_isRepaid_idx" ON "Loan"("counterpartyUserId", "isRepaid");

-- CreateIndex for OTP rate limiting and cooldown
CREATE INDEX IF NOT EXISTS "OtpChallenge_phone_createdAt_idx" ON "OtpChallenge"("phone", "createdAt");
