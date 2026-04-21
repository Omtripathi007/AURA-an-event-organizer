-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "descriptionDoc" TEXT,
ADD COLUMN     "externalLink" TEXT,
ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regType" TEXT NOT NULL DEFAULT 'INTERNAL';
