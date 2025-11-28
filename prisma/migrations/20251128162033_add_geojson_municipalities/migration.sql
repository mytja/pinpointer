-- AlterTable
ALTER TABLE "CompetitionRound" ADD COLUMN     "showGeojson" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMunicipalityLetters" BOOLEAN NOT NULL DEFAULT false;
