const { z } = require("zod");
const prisma = require("../lib/prisma");

const registrarPagoSchema = z.object({
  socioId: z.string(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]).default("EFECTIVO"),
  monto: z.number().positive().optional(),
  meses: z.number().int().positive().default(1),
});

async function registrarPago(req, res) {
  const parsed = registrarPagoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos de pago inválidos", detalle: parsed.error.flatten() });
  }

  const { socioId, metodoPago, monto, meses } = parsed.data;

  // Extracción segura del gimnasioId
  const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

  if (!gimnasioId) {
    return res.status(401).json({ error: "No se identificó el gimnasio autenticado" });
  }

  try {
    const socio = await prisma.socio.findFirst({
      where: { id: socioId, gimnasioId },
      include: { plan: true },
    });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado en este gimnasio" });
    }

    const montoFinal = monto ?? (socio.plan ? socio.plan.precio : 0);

    const hoy = new Date();
    let baseFecha = socio.vencimiento && new Date(socio.vencimiento) > hoy
      ? new Date(socio.vencimiento)
      : hoy;

    const nuevaFechaVencimiento = new Date(baseFecha);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + meses);

    const [pago, socioActualizado] = await prisma.$transaction([
      prisma.pago.create({
        data: {
          socioId,
          gimnasioId,
          metodoPago,
          monto: montoFinal,
        },
      }),
      prisma.socio.update({
        where: { id: socioId },
        data: {
          vencimiento: nuevaFechaVencimiento,
          estado: "ACTIVO",
        },
      }),
    ]);

    return res.status(201).json({
      mensaje: "Pago registrado y cuota renovada con éxito",
      pago,
      socio: socioActualizado,
    });
  } catch (error) {
    console.error("Error al registrar pago en backend:", error);
    return res.status(500).json({ error: "Error interno al registrar el pago", detalle: error.message });
  }
}

async function getPagos(req, res) {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
    const pagos = await prisma.pago.findMany({
      where: { gimnasioId },
      include: {
        socio: { select: { nombre: true, dni: true } },
      },
      orderBy: { fechaPago: "desc" },
    });

    return res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return res.status(500).json({ error: "Error al obtener historial de pagos" });
  }
}

async function comparativoMensual(req, res) {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
    const desde = new Date();
    desde.setMonth(desde.getMonth() - 5);
    desde.setDate(1);

    const [socios, pagos] = await Promise.all([
      prisma.socio.findMany({ 
        where: { gimnasioId }, 
        select: { joinedDate: true } 
      }),
      prisma.pago.findMany({ 
        where: { gimnasioId, fechaPago: { gte: desde } }, 
        select: { fechaPago: true, monto: true } 
      }),
    ]);

    return res.json({ socios, pagos });
  } catch (error) {
    console.error("Error en comparativo mensual:", error);
    return res.status(500).json({ error: "Error al obtener estadísticas comparativas" });
  }
}

module.exports = { registrarPago, getPagos, comparativoMensual };