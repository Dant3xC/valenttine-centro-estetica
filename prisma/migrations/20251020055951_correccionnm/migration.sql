/*
  Warnings:

  - You are about to drop the column `histotiaClinicaId` on the `PlanTratamiento` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[historiaClinicaId]` on the table `PlanTratamiento` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."PlanTratamiento" DROP CONSTRAINT "PlanTratamiento_histotiaClinicaId_fkey";

-- DropIndex
DROP INDEX "public"."PlanTratamiento_histotiaClinicaId_key";

-- AlterTable
ALTER TABLE "public"."PlanTratamiento" DROP COLUMN "histotiaClinicaId",
ADD COLUMN     "historiaClinicaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "PlanTratamiento_historiaClinicaId_key" ON "public"."PlanTratamiento"("historiaClinicaId");

-- AddForeignKey
ALTER TABLE "public"."PlanTratamiento" ADD CONSTRAINT "PlanTratamiento_historiaClinicaId_fkey" FOREIGN KEY ("historiaClinicaId") REFERENCES "public"."HistoriaClinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
