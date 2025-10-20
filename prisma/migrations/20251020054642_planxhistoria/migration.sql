/*
  Warnings:

  - You are about to drop the column `consultaId` on the `PlanTratamiento` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[histotiaClinicaId]` on the table `PlanTratamiento` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."PlanTratamiento" DROP CONSTRAINT "PlanTratamiento_consultaId_fkey";

-- DropIndex
DROP INDEX "public"."PlanTratamiento_consultaId_key";

-- AlterTable
ALTER TABLE "public"."PlanTratamiento" DROP COLUMN "consultaId",
ADD COLUMN     "histotiaClinicaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "PlanTratamiento_histotiaClinicaId_key" ON "public"."PlanTratamiento"("histotiaClinicaId");

-- AddForeignKey
ALTER TABLE "public"."PlanTratamiento" ADD CONSTRAINT "PlanTratamiento_histotiaClinicaId_fkey" FOREIGN KEY ("histotiaClinicaId") REFERENCES "public"."HistoriaClinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
