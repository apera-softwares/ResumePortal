/*
  Warnings:

  - You are about to drop the `_CandidateSkills` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_JobSkills` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_CandidateSkills" DROP CONSTRAINT "_CandidateSkills_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_CandidateSkills" DROP CONSTRAINT "_CandidateSkills_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobSkills" DROP CONSTRAINT "_JobSkills_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobSkills" DROP CONSTRAINT "_JobSkills_B_fkey";

-- DropIndex
DROP INDEX "public"."AppliedJob_candidateId_jobId_key";

-- DropTable
DROP TABLE "public"."_CandidateSkills";

-- DropTable
DROP TABLE "public"."_JobSkills";
