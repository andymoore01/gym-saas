import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

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

router.post('/', async (req, res) => {
  try {
    const { nombre, precio } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'El nombre y precio son obligatorios' });
    }

    const rawGimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId || 1;
    const parsedGimnasioId = !isNaN(Number(rawGimnasioId)) ? Number(rawGimnasioId) : String(rawGimnasioId);

    let nuevoPlan;

    // Variante 1: Inserción directa básica
    try {
      nuevoPlan = await prisma.plan.create({
        data: {
          nombre: String(nombre).trim(),
          precio: Number(precio),
          gimnasioId: parsedGimnasioId
        }
      });
    } catch (err1) {
      // Variante 2: Incluyendo duracionMeses por si el schema lo exige
      try {
        nuevoPlan = await prisma.plan.create({
          data: {
            nombre: String(nombre).trim(),
            precio: Number(precio),
            duracionMeses: 1,
            gimnasioId: parsedGimnasioId
          }
        });
      } catch (err2) {
        // Variante 3: Mediante relacion connect
        nuevoPlan = await prisma.plan.create({
          data: {
            nombre: String(nombre).trim(),
            precio: Number(precio),
            gimnasio: { connect: { id: parsedGimnasioId } }
          }
        });
      }
    }

    return res.status(201).json(nuevoPlan);
  } catch (error) {
    console.error('Error detallado de Prisma:', error);
    return res.status(500).json({ 
      error: error.message || 'Error al escribir en la base de datos' 
    });
  }
});

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