import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Registrar un pago nuevo y renovar 30 días al socio
router.post('/', async (req, res) => {
  const { socio_id, gimnasio_id, monto, metodo_pago } = req.body;

  try {
    await prisma.pago.create({
      data: {
        socioId: Number(socio_id),
        gimnasioId: Number(gimnasio_id),
        monto: parseFloat(monto),
        metodoPago: metodo_pago
      }
    });

    const hoy = new Date();
    const nuevaFechaVencimiento = new Date();
    nuevaFechaVencimiento.setDate(hoy.getDate() + 30);

    const socioActualizado = await prisma.socio.update({
      where: { id: Number(socio_id) },
      data: {
        fechaUltimoPago: hoy,
        fechaVencimiento: nuevaFechaVencimiento
      }
    });

    res.json({ ok: true, socio: socioActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Obtener métricas rápidas de caja del mes
router.get('/resumen/:gimnasio_id', async (req, res) => {
  const { gimnasio_id } = req.params;
  
  try {
    const pagos = await prisma.pago.findMany({
      where: { gimnasioId: Number(gimnasio_id) }
    });

    const totalCobrado = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
    
    res.json({
      totalCobrado,
      cantidadTransacciones: pagos.length,
      historial: pagos
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen de caja' });
  }
});

export default router;