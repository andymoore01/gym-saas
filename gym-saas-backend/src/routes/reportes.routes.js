import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/ingresos', async (req, res) => {
  try {
    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
    
    // Obtenemos un gimnasio válido
    let gimnasioId = rawGimnasioId;
    if (!gimnasioId) {
      const primerGym = await prisma.gimnasio.findFirst();
      if (primerGym) gimnasioId = primerGym.id;
    }

    if (!gimnasioId) {
      return res.status(400).json({ error: 'No se encontró un gimnasio asociado' });
    }

    // Calcular inicio y fin del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    // Obtener todos los pagos del mes
    const pagosMes = await prisma.pago.findMany({
      where: {
        gimnasioId: String(gimnasioId),
        fechaPago: {
          gte: inicioMes,
          lte: finMes
        }
      },
      include: {
        socio: { select: { nombre: true, dni: true } }
      },
      orderBy: { fechaPago: 'desc' }
    });

    // Totales calculados
    const totalEfectivo = pagosMes
      .filter(p => p.metodoPago === 'EFECTIVO')
      .reduce((acc, p) => acc + Number(p.monto), 0);

    const totalTransferencia = pagosMes
      .filter(p => p.metodoPago === 'TRANSFERENCIA')
      .reduce((acc, p) => acc + Number(p.monto), 0);

    const recaudacionTotal = totalEfectivo + totalTransferencia;

    return res.json({
      mesActual: ahora.toLocaleString('es-AR', { month: 'long', year: 'numeric' }),
      recaudacionTotal,
      totalEfectivo,
      totalTransferencia,
      cantidadCobros: pagosMes.length,
      historialPagos: pagosMes
    });

  } catch (error) {
    console.error('Error al obtener reporte de ingresos:', error);
    return res.status(500).json({ error: 'Error al generar el reporte de ingresos' });
  }
});

export default router;