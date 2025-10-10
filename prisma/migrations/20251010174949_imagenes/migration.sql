-- DropIndex
DROP INDEX "public"."Paciente_dni_key";

-- DropIndex
DROP INDEX "public"."Profesional_dni_key";

-- AlterTable
ALTER TABLE "public"."Profesional" ADD COLUMN     "fotoPath" TEXT;
