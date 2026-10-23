-- AlterTable: Add avatarKey to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;
