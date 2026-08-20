import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { socioId, gimnasioId, monto, metodoPago } = req.body;

    // Convertimos a Int asegurando que no devuelva NaN
    const parsedSocioId = parseInt(socioId || req.body.socio_id, 10);
    const parsedGimnasioId = parseInt(
      gimnasioId || req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1, 
      10
    );

    if (isNaN(parsedSocioId)) {
      return res.status(400).json({ error: "El socioId debe ser un número entero válido." });
    }

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

    // 3. Transacción: Creamos pago y actualizamos fecha/estado del socio
    const [pago, socioActualizado] = await prisma.$transaction([
      prisma.pago.create({
        data: {
          socioId: parsedSocioId,
          gimnasioId: isNaN(parsedGimnasioId) ? socio.gimnasioId : parsedGimnasioId,
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