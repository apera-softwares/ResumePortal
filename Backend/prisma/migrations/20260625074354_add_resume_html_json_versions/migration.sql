-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "editedHtml" TEXT,
ADD COLUMN     "parsedHtml" TEXT,
ADD COLUMN     "resumeJson" TEXT;

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "jsonContent" TEXT,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResumeVersion" ADD CONSTRAINT "ResumeVersion_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
