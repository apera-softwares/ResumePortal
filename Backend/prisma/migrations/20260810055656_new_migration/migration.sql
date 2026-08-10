-- DropForeignKey
ALTER TABLE "public"."Job" DROP CONSTRAINT "Job_createdById_fkey";

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
