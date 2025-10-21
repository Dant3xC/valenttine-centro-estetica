-- DropForeignKey
ALTER TABLE "public"."PlanTratamiento" DROP CONSTRAINT "PlanTratamiento_consultaId_fkey";

-- AlterTable
ALTER TABLE "public"."PlanTratamiento" ALTER COLUMN "consultaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."PlanTratamiento" ADD CONSTRAINT "PlanTratamiento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "public"."Consulta"("id") ON DELETE SET NULL ON UPDATE CASCADE;
