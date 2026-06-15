-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "jobId" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Applied';

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
