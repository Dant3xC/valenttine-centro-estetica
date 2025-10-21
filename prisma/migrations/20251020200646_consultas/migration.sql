/*
  Warnings:

  - You are about to drop the column `comparacion` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `evolucion` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `medicacionPrescrita` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `motivoConsulta` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `productosUtilizados` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `resultadosEsperados` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `toleranciaPaciente` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `tratamientosRealizados` on the `PlanTratamiento` table. All the data in the column will be lost.
  - You are about to drop the column `usoAnestesia` on the `PlanTratamiento` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Consulta" ADD COLUMN     "comparacion" TEXT,
ADD COLUMN     "evolucion" TEXT,
ADD COLUMN     "medicacionPrescrita" TEXT,
ADD COLUMN     "motivoConsulta" TEXT,
ADD COLUMN     "productosUtilizados" JSONB,
ADD COLUMN     "resultadosEsperados" TEXT,
ADD COLUMN     "toleranciaPaciente" TEXT,
ADD COLUMN     "tratamientosRealizados" JSONB,
ADD COLUMN     "usoAnestesia" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."PlanTratamiento" DROP COLUMN "comparacion",
DROP COLUMN "evolucion",
DROP COLUMN "medicacionPrescrita",
DROP COLUMN "motivoConsulta",
DROP COLUMN "productosUtilizados",
DROP COLUMN "resultadosEsperados",
DROP COLUMN "toleranciaPaciente",
DROP COLUMN "tratamientosRealizados",
DROP COLUMN "usoAnestesia";
