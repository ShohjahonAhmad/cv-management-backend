-- CreateEnum
CREATE TYPE "AttributeCategory" AS ENUM ('PERSONAL_INFORMATION', 'CERTIFICATION', 'DOMAIN_KNOWLEDGE', 'SOFT_SKILLS');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('STRING', 'TEXT', 'IMAGE', 'NUMBER', 'DATE', 'PERIOD', 'BOOLEAN', 'SELECT');

-- CreateTable
CREATE TABLE "Attribute" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "AttributeCategory" NOT NULL,
    "type" "AttributeType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeOption" (
    "id" SERIAL NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "AttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" SERIAL NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "stringValue" TEXT,
    "textValue" TEXT,
    "numericValue" DOUBLE PRECISION,
    "booleanValue" BOOLEAN,
    "dateValue" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "imageUrl" TEXT,
    "optionId" INTEGER,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attribute_name_key" ON "Attribute"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeOption_attributeId_value_key" ON "AttributeOption"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_candidateId_attributeId_key" ON "AttributeValue"("candidateId", "attributeId");

-- AddForeignKey
ALTER TABLE "AttributeOption" ADD CONSTRAINT "AttributeOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AttributeOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
