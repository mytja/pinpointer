-- DropForeignKey
ALTER TABLE "Competition" DROP CONSTRAINT "Competition_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitionEnrollment" DROP CONSTRAINT "CompetitionEnrollment_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitionEnrollment" DROP CONSTRAINT "CompetitionEnrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompetitionRound" DROP CONSTRAINT "CompetitionRound_competitionId_fkey";

-- DropForeignKey
ALTER TABLE "RoundPlayerResults" DROP CONSTRAINT "RoundPlayerResults_roundId_fkey";

-- DropForeignKey
ALTER TABLE "RoundPlayerResults" DROP CONSTRAINT "RoundPlayerResults_userId_fkey";

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEnrollment" ADD CONSTRAINT "CompetitionEnrollment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEnrollment" ADD CONSTRAINT "CompetitionEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRound" ADD CONSTRAINT "CompetitionRound_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerResults" ADD CONSTRAINT "RoundPlayerResults_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CompetitionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerResults" ADD CONSTRAINT "RoundPlayerResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
