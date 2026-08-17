-- CreateEnum
CREATE TYPE "SubmissionChannel" AS ENUM ('FORM', 'WHATSAPP', 'EMAIL');

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "channel" "SubmissionChannel" NOT NULL DEFAULT 'FORM';
