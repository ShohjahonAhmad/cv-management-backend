-- CreateTable
CREATE TABLE "ProjectTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionProjectTag" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "projectTagId" INTEGER NOT NULL,

    CONSTRAINT "PositionProjectTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTag_name_key" ON "ProjectTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PositionProjectTag_positionId_projectTagId_key" ON "PositionProjectTag"("positionId", "projectTagId");

-- AddForeignKey
ALTER TABLE "PositionProjectTag" ADD CONSTRAINT "PositionProjectTag_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PositionProjectTag" ADD CONSTRAINT "PositionProjectTag_projectTagId_fkey" FOREIGN KEY ("projectTagId") REFERENCES "ProjectTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
