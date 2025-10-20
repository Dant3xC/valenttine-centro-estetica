/*
  Warnings:

  - You are about to drop the column `resultadosEsperados` on the `Consulta` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Consulta" DROP COLUMN "resultadosEsperados";

-- AlterTable
ALTER TABLE "public"."PlanTratamiento" ADD COLUMN     "resultadosEsperados" TEXT;
