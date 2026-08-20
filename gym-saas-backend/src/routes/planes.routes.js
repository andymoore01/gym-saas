import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/planes
router.get('/', async (req, res) => {
  try {
    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1;
    const parsedGimnasioId = !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : String(rawGimnasioId);

    const planes = await prisma.plan.findMany({
      where: {
        OR: [
          { gimnasioId: parsedGimnasioId },
          { gimnasioId: String(rawGimnasioId) },
          { gimnasioId: Number(rawGimnasioId) || 1 }
        ]
      },
      orderBy: { precio: 'asc' }
    });

    return res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de planes' });
  }
});

// POST /api/planes
router.post('/', async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    if (!nombre || precio === undefined || isNaN(Number(precio))) {
      return res.status(400).json({ error: 'El nombre y un precio numérico son obligatorios' });
    }

    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1;
    const parsedGimnasioId = !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : String(rawGimnasioId);

    let nuevoPlan;

    // Intento 1: Inserción directa por ID
    try {
      nuevoPlan = await prisma.plan.create({
        data: {
          nombre: String(nombre).trim(),
          precio: Number(precio),
          gimnasioId: parsedGimnasioId
        }
      });
    } catch (errPrimario) {
      // Intento 2: Inserción mediante relación "connect" de Prisma
      nuevoPlan = await prisma.plan.create({
        data: {
          nombre: String(nombre).trim(),
          precio: Number(precio),
          gimnasio: {
            connect: { id: parsedGimnasioId }
          }
        }
      });
    }

    return res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error crítico al crear plan:', error);
    return res.status(500).json({ 
      error: 'Error interno al crear el plan', 
      detalle: error.message 
    });
  }
});

// DELETE /api/planes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = !isNaN(Number(id)) ? Number(id) : String(id);

    await prisma.plan.delete({
      where: { id: parsedId }
    });

    return res.json({ mensaje: 'Plan eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar plan:', error);
    return res.status(500).json({ error: 'Error al eliminar el plan' });
  }
});

export default router;