-- CreateEnum
CREATE TYPE "OfferProposedBy" AS ENUM ('BUYER', 'SELLER');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "proposedBy" "OfferProposedBy" NOT NULL DEFAULT 'BUYER';
