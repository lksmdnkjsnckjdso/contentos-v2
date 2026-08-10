-- AlterTable
-- Map Clerk identities: keep a stable reference to the Clerk user id.
ALTER TABLE "User" ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");
-- Password auth replaced by Clerk — drop the bcrypt hash column.
ALTER TABLE "User" DROP COLUMN "passwordHash";
