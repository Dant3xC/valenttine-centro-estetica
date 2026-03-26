-- AlterTable
ALTER TABLE "public"."HistoriaClinica" ALTER COLUMN "estado" DROP NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'Abierto',
ALTER COLUMN "estado" SET DATA TYPE TEXT;
