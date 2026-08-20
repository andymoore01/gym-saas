import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/planes
router.get('/', async (req, res) => {
  try {
    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || "1";
    const gimnasioIdString = String(rawGimnasioId);

    const planes = await prisma.plan.findMany({
      where: { gimnasioId: gimnasioIdString },
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

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'El nombre y precio son obligatorios' });
    }

    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || "1";
    const gimnasioIdString = String(rawGimnasioId);

    // Inserción directa enviando gimnasioId como String
    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre: String(nombre).trim(),
        precio: Number(precio),
        gimnasioId: gimnasioIdString
      }
    });

    return res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error al crear plan:', error);
    return res.status(500).json({ error: error.message || 'Error al crear el plan' });
  }
});

// DELETE /api/planes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const parsedId = !isNaN(Number(id)) ? Number(id) : String(id);

    await prisma.plan.delete({ where: { id: parsedId } });
    return res.json({ mensaje: 'Plan eliminado' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;