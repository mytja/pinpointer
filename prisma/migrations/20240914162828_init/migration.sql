-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "private" BOOLEAN NOT NULL DEFAULT true,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionEnrollment" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "CompetitionEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionRound" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "CompetitionRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundPlayerResults" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "RoundPlayerResults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_id_key" ON "Competition"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionEnrollment_id_key" ON "CompetitionEnrollment"("id");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRound_id_key" ON "CompetitionRound"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoundPlayerResults_id_key" ON "RoundPlayerResults"("id");

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEnrollment" ADD CONSTRAINT "CompetitionEnrollment_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionEnrollment" ADD CONSTRAINT "CompetitionEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRound" ADD CONSTRAINT "CompetitionRound_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerResults" ADD CONSTRAINT "RoundPlayerResults_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "CompetitionRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundPlayerResults" ADD CONSTRAINT "RoundPlayerResults_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
