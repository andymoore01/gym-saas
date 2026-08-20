-- CreateEnum
CREATE TYPE "EstadoSuscripcion" AS ENUM ('EN_PRUEBA', 'ACTIVA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "EstadoSocio" AS ENUM ('ACTIVO', 'BAJA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');

-- CreateTable
CREATE TABLE "Gimnasio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gimnasio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suscripcion" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'EN_PRUEBA',
    "mercadopagoPreapprovalId" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaProximoCobro" TIMESTAMP(3),
    "planSaas" TEXT NOT NULL DEFAULT 'basico',

    CONSTRAINT "Suscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "notas" TEXT,
    "estado" "EstadoSocio" NOT NULL DEFAULT 'ACTIVO',
    "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bajaDate" TIMESTAMP(3),
    "planId" TEXT NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "gimnasioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" INTEGER NOT NULL,
    "metodo" "MetodoPago" NOT NULL DEFAULT 'EFECTIVO',

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gimnasio_slug_key" ON "Gimnasio"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Gimnasio_email_key" ON "Gimnasio"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Suscripcion_gimnasioId_key" ON "Suscripcion"("gimnasioId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_gimnasioId_email_key" ON "Usuario"("gimnasioId", "email");

-- CreateIndex
CREATE INDEX "Socio_gimnasioId_idx" ON "Socio"("gimnasioId");

-- CreateIndex
CREATE INDEX "Pago_gimnasioId_fecha_idx" ON "Pago"("gimnasioId", "fecha");

-- AddForeignKey
ALTER TABLE "Suscripcion" ADD CONSTRAINT "Suscripcion_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "Gimnasio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "Gimnasio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "Gimnasio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Socio" ADD CONSTRAINT "Socio_gimnasioId_fkey" FOREIGN KEY ("gimnasioId") REFERENCES "Gimnasio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Socio" ADD CONSTRAINT "Socio_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
