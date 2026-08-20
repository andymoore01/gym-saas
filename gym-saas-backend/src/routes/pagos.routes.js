import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/pagos - Listar los pagos del gimnasio del usuario autenticado
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.auth?.id || req.usuario?.id;
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

    if (!usuario || !usuario.gimnasioId) {
      return res.status(403).json({ error: "No autorizado o sin gimnasio asignado" });
    }

    const pagos = await prisma.pago.findMany({
      where: { gimnasioId: usuario.gimnasioId },
      include: { socio: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return res.status(500).json({ error: "Error al obtener los pagos" });
  }
});

// POST /api/pagos - Registrar un pago y renovar estado del socio
router.post('/', async (req, res) => {
  try {
    const { socioId, monto, metodoPago, meses } = req.body;
    const usuarioId = req.auth?.id || req.usuario?.id;

    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario || !usuario.gimnasioId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    if (!socioId || !monto) {
      return res.status(400).json({ error: "Socio y monto son obligatorios" });
    }

    // 1. Crear el registro del pago en la base de datos
    const nuevoPago = await prisma.pago.create({
      data: {
        monto: Number(monto),
        metodoPago: metodoPago || 'EFECTIVO',
        socioId: String(socioId),
        gimnasioId: usuario.gimnasioId
      }
    });

    // 2. Actualizar el estado del socio a ACTIVO (o renovar su vigencia)
    await prisma.socio.update({
      where: { id: String(socioId) },
      data: { estado: 'ACTIVO' }
    });

    return res.status(201).json({ mensaje: "Pago registrado con éxito", pago: nuevoPago });
  } catch (error) {
    console.error("Error detallado al registrar pago:", error);
    return res.status(500).json({ error: "Error al procesar el pago", detalle: error.message });
  }
});

export default router;