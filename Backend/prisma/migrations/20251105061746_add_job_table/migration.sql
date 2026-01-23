-- CreateEnum
CREATE TYPE "Location" AS ENUM ('REMOTE', 'MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'PUNE');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCING');

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "client" TEXT,
    "skills" TEXT[],
    "salary" DOUBLE PRECISION NOT NULL,
    "internalSalary" DOUBLE PRECISION,
    "location" "Location" NOT NULL,
    "type" "JobType" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
