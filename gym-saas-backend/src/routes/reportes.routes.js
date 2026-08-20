import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/ingresos', async (req, res) => {
  try {
    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

    // Rango de fechas del mes actual
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    // Condición de búsqueda flexible para gimnasioId
    let filtroGimnasio = {};
    if (rawGimnasioId) {
      filtroGimnasio = {
        OR: [
          { gimnasioId: String(rawGimnasioId) },
          { gimnasioId: !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : -1 }
        ]
      };
    }

    // Buscamos todos los pagos del mes que coincidan o todos los pagos si no hay filtro estricto
    const pagosMes = await prisma.pago.findMany({
      where: {
        ...filtroGimnasio,
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
      .filter(p => (p.metodoPago || '').toUpperCase() === 'EFECTIVO')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    const totalTransferencia = pagosMes
      .filter(p => (p.metodoPago || '').toUpperCase() === 'TRANSFERENCIA')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);

    const recaudacionTotal = pagosMes.reduce((acc, p) => acc + Number(p.monto || 0), 0);

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
    return res.status(500).json({ error: 'Error al generar el reporte de ingresos', detalle: error.message });
  }
});

export default router;