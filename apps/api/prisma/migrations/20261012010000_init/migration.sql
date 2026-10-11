CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT','PUBLISHED');
CREATE TABLE "User" ("id" UUID NOT NULL,"email" TEXT NOT NULL,"passwordHash" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Invitation" ("id" UUID NOT NULL,"ownerId" UUID NOT NULL,"slug" TEXT NOT NULL,"status" "InvitationStatus" NOT NULL DEFAULT 'DRAFT',"title" TEXT NOT NULL,"theme" TEXT NOT NULL DEFAULT 'rose',"content" JSONB NOT NULL,"publishedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");
CREATE INDEX "Invitation_ownerId_createdAt_idx" ON "Invitation"("ownerId","createdAt");
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
