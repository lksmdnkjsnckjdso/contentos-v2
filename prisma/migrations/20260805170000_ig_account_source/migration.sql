-- AlterTable
ALTER TABLE "InstagramAccount" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'oauth';

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccount_userId_username_key" ON "InstagramAccount"("userId", "username");
