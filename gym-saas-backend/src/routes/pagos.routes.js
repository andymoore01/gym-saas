import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { socioId, gimnasioId, monto, metodoPago } = req.body;

    // Normalizamos el socioId directamente como venga (String o Number)
    const rawSocioId = socioId || req.body.socio_id;

    if (!rawSocioId) {
      return res.status(400).json({ error: "El socioId es obligatorio." });
    }

    // Convertimos a Int si la base de datos usa Ints, o lo dejamos como String si usa UUIDs
    const parsedSocioId = !isNaN(Number(rawSocioId)) ? Number(rawSocioId) : String(rawSocioId);

    const montoFinal = Number(monto) || 0;
    const metodoFinal = (metodoPago || req.body.metodo_pago || 'EFECTIVO').toUpperCase();

    // 1. Buscamos al socio
    const socio = await prisma.socio.findUnique({
      where: { id: parsedSocioId }
    });

    if (!socio) {
      return res.status(404).json({ error: "Socio no encontrado" });
    }

    // 2. Calculamos la nueva fecha de vencimiento (+1 mes)
    const hoy = new Date();
    let baseFecha = socio.vencimiento && new Date(socio.vencimiento) > hoy
      ? new Date(socio.vencimiento)
      : hoy;

    const nuevaFechaVencimiento = new Date(baseFecha);
    nuevaFechaVencimiento.setMonth(nuevaFechaVencimiento.getMonth() + 1);

    // 3. Obtenemos el gimnasioId seguro
    const finalGimnasioId = socio.gimnasioId || (!isNaN(Number(gimnasioId)) ? Number(gimnasioId) : gimnasioId) || 1;

    // 4. Transacción: Creamos pago y actualizamos fecha/estado del socio
    const [pago, socioActualizado] = await prisma.$transaction([
      prisma.pago.create({
        data: {
          socioId: parsedSocioId,
          gimnasioId: finalGimnasioId,
          monto: montoFinal,
          metodoPago: metodoFinal
        }
      }),
      prisma.socio.update({
        where: { id: parsedSocioId },
        data: {
          vencimiento: nuevaFechaVencimiento,
          estado: 'ACTIVO'
        }
      })
    ]);

    return res.status(201).json({
      mensaje: "Pago registrado con éxito",
      pago,
      socio: socioActualizado
    });

  } catch (error) {
    console.error("Error al procesar el pago:", error);
    return res.status(500).json({ error: "Error interno al procesar el pago", detalle: error.message });
  }
});

export default router;