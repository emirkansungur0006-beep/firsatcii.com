-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "publishDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "winnerId" TEXT,
ADD COLUMN     "workStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "jobId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyName" TEXT,
ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "profileType" "ProfileType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "taxNumber" TEXT;

-- CreateTable
CREATE TABLE "worker_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profilePicture" TEXT,
    "aboutMe" TEXT,
    "education" TEXT,
    "jobHistory" JSONB,
    "references" JSONB,
    "experiences" JSONB,
    "sectorIds" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "worker_profiles_userId_key" ON "worker_profiles"("userId");

-- AddForeignKey
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
