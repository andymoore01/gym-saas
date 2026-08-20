import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Helper para obtener un gimnasioId válido real existente en la base de datos
async function obtenerGimnasioValido(req) {
  // 1. Intentamos leerlo del token JWT
  const rawId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
  
  if (rawId) {
    const gymExiste = await prisma.gimnasio.findUnique({ where: { id: String(rawId) } });
    if (gymExiste) return gymExiste.id;
  }

  // 2. Si no viene en el token o no existe, buscamos el primer gimnasio registrado en la DB
  const primerGym = await prisma.gimnasio.findFirst();
  if (primerGym) return primerGym.id;

  // 3. Si la tabla Gimnasio está totalmente vacía, creamos el gimnasio por defecto
  const gymNuevo = await prisma.gimnasio.create({
    data: {
      nombre: "Mi Gimnasio",
      email: "contacto@gimnasio.com"
    }
  });

  return gymNuevo.id;
}

// GET /api/planes
router.get('/', async (req, res) => {
  try {
    const gimnasioId = await obtenerGimnasioValido(req);

    const planes = await prisma.plan.findMany({
      where: { gimnasioId },
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

    const gimnasioId = await obtenerGimnasioValido(req);

    const nuevoPlan = await prisma.plan.create({
      data: {
        nombre: String(nombre).trim(),
        precio: Number(precio),
        gimnasioId
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
    return res.json({ mensaje: 'Plan eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;