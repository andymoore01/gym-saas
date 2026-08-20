import express from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/superadmin/gimnasios - Listar todos los gimnasios/clientes
router.get('/gimnasios', async (req, res) => {
  try {
    const gimnasios = await prisma.gimnasio.findMany({
      include: {
        _count: {
          select: { socios: true, pagos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(gimnasios);
  } catch (error) {
    console.error("Error al obtener gimnasios:", error);
    return res.status(500).json({ error: "Error al cargar los gimnasios" });
  }
});

// POST /api/superadmin/gimnasios - Crear cliente nuevo con contraseña
router.post('/gimnasios', async (req, res) => {
  try {
    const { nombre, email, password, telefono, estado } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoGym = await prisma.gimnasio.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        telefono: telefono ? telefono.trim() : null,
        estado: estado || 'ACTIVO'
      }
    });

    return res.status(201).json(nuevoGym);
  } catch (error) {
    console.error("Error al crear gimnasio:", error);
    return res.status(500).json({ error: "Error al crear el gimnasio", detalle: error.message });
  }
});

// PUT /api/superadmin/gimnasios/:id/estado - Cambiar estado (ACTIVO / SUSPENDIDO)
router.put('/gimnasios/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const gymActualizado = await prisma.gimnasio.update({
      where: { id: String(id) },
      data: { estado }
    });

    return res.json(gymActualizado);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
});

export default router;