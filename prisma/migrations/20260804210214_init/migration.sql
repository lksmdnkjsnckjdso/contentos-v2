-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BrandConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "pillars" TEXT NOT NULL DEFAULT '[]',
    "hashtagBank" TEXT NOT NULL DEFAULT '[]',
    "postingDays" TEXT NOT NULL DEFAULT '[]',
    "postingTime" TEXT NOT NULL DEFAULT '18:00',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BrandConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstagramAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "igId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "mediaCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstagramAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "mediaCount" INTEGER NOT NULL,
    "engagementRate" REAL NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProfileSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "igId" TEXT,
    "caption" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'SINGLE',
    "mediaUrl" TEXT,
    "postedAt" DATETIME NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Post_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InstagramAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "lastAnalyzedAt" DATETIME,
    CONSTRAINT "Competitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompetitorSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followers" INTEGER NOT NULL,
    "following" INTEGER NOT NULL,
    "posts" INTEGER NOT NULL,
    "engagementRate" REAL NOT NULL,
    "avgLikes" REAL NOT NULL,
    "avgComments" REAL NOT NULL,
    "postingFrequency" REAL NOT NULL,
    "topHashtags" TEXT NOT NULL DEFAULT '[]',
    "themes" TEXT NOT NULL DEFAULT '[]',
    "report" TEXT,
    "reportJson" TEXT,
    CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL DEFAULT '18:00',
    "mediaType" TEXT NOT NULL DEFAULT 'REEL',
    "pillar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    CONSTRAINT "ContentSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "hookVariants" TEXT NOT NULL DEFAULT '[]',
    "script" TEXT,
    "caption" TEXT,
    "hashtags" TEXT NOT NULL DEFAULT '[]',
    "cta" TEXT,
    "thumbnailIdea" TEXT,
    "aiParams" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContentDraft_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ContentSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BrandConfig_userId_key" ON "BrandConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramAccount_igId_key" ON "InstagramAccount"("igId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSnapshot_accountId_date_key" ON "ProfileSnapshot"("accountId", "date");

-- CreateIndex
CREATE INDEX "Post_accountId_postedAt_idx" ON "Post"("accountId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_userId_username_key" ON "Competitor"("userId", "username");

-- CreateIndex
CREATE INDEX "ContentSlot_userId_date_idx" ON "ContentSlot"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ContentDraft_slotId_key" ON "ContentDraft"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
