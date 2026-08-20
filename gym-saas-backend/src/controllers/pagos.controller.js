const { z } = require("zod");
const prisma = require("../lib/prisma");

const registrarPagoSchema = z.object({
  socioId: z.string(),
  metodo: z.enum(["EFECTIVO", "TRANSFERENCIA", "TARJETA"]).default("EFECTIVO"),
  monto: z.number().int().positive().optional(), // si no viene, se usa el precio del plan
});

async function registrarPago(req, res) {
  const parsed = registrarPagoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { socioId, metodo, monto } = parsed.data;

  const socio = await prisma.socio.findFirst({
    where: { id: socioId, gimnasioId: req.auth.gimnasioId },
    include: { plan: true },
  });
  if (!socio) return res.status(404).json({ error: "Socio no encontrado en este gimnasio" });

  const pago = await prisma.pago.create({
    data: {
      socioId,
      gimnasioId: req.auth.gimnasioId,
      metodo,
      monto: monto ?? socio.plan.precio,
    },
  });

  res.status(201).json(pago);
}

// Comparativo mensual: altas, bajas e ingresos de los últimos 6 meses del gimnasio logueado.
async function comparativoMensual(req, res) {
  const gimnasioId = req.auth.gimnasioId;
  const desde = new Date();
  desde.setMonth(desde.getMonth() - 5);
  desde.setDate(1);

  const [socios, pagos] = await Promise.all([
    prisma.socio.findMany({ where: { gimnasioId }, select: { joinedDate: true, bajaDate: true } }),
    prisma.pago.findMany({ where: { gimnasioId, fecha: { gte: desde } }, select: { fecha: true, monto: true } }),
  ]);

  res.json({ socios, pagos }); // el front arma los buckets por mes (misma lógica que ya tenés en el artifact)
}

module.exports = { registrarPago, comparativoMensual };
