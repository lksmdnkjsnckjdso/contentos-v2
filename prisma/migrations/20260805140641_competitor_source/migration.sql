-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompetitorSnapshot" (
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
    "source" TEXT NOT NULL DEFAULT 'SCRAPED',
    CONSTRAINT "CompetitorSnapshot_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CompetitorSnapshot" ("avgComments", "avgLikes", "competitorId", "date", "engagementRate", "followers", "following", "id", "postingFrequency", "posts", "report", "reportJson", "themes", "topHashtags") SELECT "avgComments", "avgLikes", "competitorId", "date", "engagementRate", "followers", "following", "id", "postingFrequency", "posts", "report", "reportJson", "themes", "topHashtags" FROM "CompetitorSnapshot";
DROP TABLE "CompetitorSnapshot";
ALTER TABLE "new_CompetitorSnapshot" RENAME TO "CompetitorSnapshot";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
