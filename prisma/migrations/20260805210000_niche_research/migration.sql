-- AlterTable
ALTER TABLE "Competitor" ADD COLUMN "audienceType" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "category" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "displayName" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "engagementQuality" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "followerRange" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "reasonSelected" TEXT;
ALTER TABLE "Competitor" ADD COLUMN "researchPriority" INTEGER;

-- CreateTable
CREATE TABLE "NicheResearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nicheSummary" TEXT NOT NULL DEFAULT '',
    "competitors" TEXT NOT NULL DEFAULT '[]',
    "emergingCreators" TEXT NOT NULL DEFAULT '[]',
    "authorityCreators" TEXT NOT NULL DEFAULT '[]',
    "contentOpportunities" TEXT NOT NULL DEFAULT '[]',
    "researchRecommendations" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NicheResearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NicheResearch_userId_createdAt_idx" ON "NicheResearch"("userId", "createdAt");
