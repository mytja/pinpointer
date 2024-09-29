-- AlterTable
ALTER TABLE "CompetitionRound" ADD COLUMN     "numberOfRounds" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "state" INTEGER NOT NULL DEFAULT -1;
