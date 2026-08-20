const { z } = require("zod");
const prisma = require("../lib/prisma");

const registrarPagoSchema = z.object({
  socioId: z.string(),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]).default("EFECTIVO"),
  monto: z.number().positive().optional(), // Si no se pasa monto, usa el del plan
  meses: z.number().int().positive().default(1), // Cantidad de meses a renovar (por defecto 1)
});

async function registrarPago(req, res) {
  const parsed = registrarPagoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { socioId, metodoPago, monto, meses } = parsed.data;

  try {
    const socio = await prisma.socio.findFirst({
      where: { id: socioId, gimnasioId: req.auth.gimnasioId },
      include: { plan: true },
    });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado en este gimnasio" });
    }

    // Calcular el monto a cobrar
    const montoFinal = monto ?? (socio.plan ? socio.plan.precio : 0);

    // Calcular la nueva fecha de vencimiento
    const hoy = new Date();
    let baseFecha = socio.vencimiento && new Date(socio.vencimiento) > hoy
      ? new Date(socio.vencimiento)
      : hoy;

    const nuevaFechaVencimiento = new Date(baseFecha);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + meses);

    // Transacción: crea el registro de pago y renueva al socio en una sola operación
    const [pago, socioActualizado] = await prisma.$transaction([
      prisma.pago.create({
        data: {
          socioId,
          gimnasioId: req.auth.gimnasioId,
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
    console.error("Error al registrar pago:", error);
    return res.status(500).json({ error: "Error interno al registrar el pago" });
  }
}

// Comparativo mensual: altas, bajas e ingresos
async function comparativoMensual(req, res) {
  try {
    const gimnasioId = req.auth.gimnasioId;
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

module.exports = { registrarPago, comparativoMensual };