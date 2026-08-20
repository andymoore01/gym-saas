import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/planes - Obtener todos los planes del gimnasio
router.get('/', async (req, res) => {
  try {
    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1;
    const parsedGimnasioId = !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : String(rawGimnasioId);

    const planes = await prisma.plan.findMany({
      where: { gimnasioId: parsedGimnasioId },
      orderBy: { precio: 'asc' }
    });

    return res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de planes' });
  }
});

// POST /api/planes - Crear un nuevo plan
router.post('/', async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'El nombre y el precio del plan son obligatorios' });
    }

    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1;
    const parsedGimnasioId = !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : String(rawGimnasioId);

    // Intentamos crear solo con los campos core obligatorios para evitar fallos por campos extra
    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre: String(nombre).trim(),
        precio: Number(precio),
        gimnasioId: parsedGimnasioId
      }
    });

    return res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error interno al crear el plan:', error);
    return res.status(500).json({ 
      error: 'Error interno al crear el plan', 
      detalle: error.message 
    });
  }
});

// DELETE /api/planes/:id - Eliminar un plan
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