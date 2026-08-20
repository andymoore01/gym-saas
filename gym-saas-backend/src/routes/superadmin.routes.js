import express from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Middleware interno para verificar rol SUPERADMIN
const verificarSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Acceso no autorizado" });

    // Si estás usando JWT estándar en req.auth o req.usuario
    const usuarioId = req.auth?.id || req.usuario?.id;
    if (!usuarioId) return res.status(401).json({ error: "Sesión inválida" });

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario || usuario.rol !== 'SUPERADMIN') {
      return res.status(403).json({ error: "Acceso denegado: Requiere rol SUPERADMIN" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Error de autenticación", detalle: error.message });
  }
};

// GET /api/superadmin/gimnasios - Listar todos los clientes
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

// POST /api/superadmin/gimnasios - Crear gimnasio y su usuario administrador
router.post('/gimnasios', async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();

    // Validar si el email ya existe en la tabla Usuario
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailLimpio }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya se encuentra registrado" });
    }

    // 1. Crear el Gimnasio
    const nuevoGym = await prisma.gimnasio.create({
      data: {
        nombre: nombre.trim(),
        email: emailLimpio,
        telefono: telefono ? telefono.trim() : null,
        estado: 'ACTIVO'
      }
    });

    // 2. Hash de contraseña y creación del Usuario asignado al Gimnasio
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.create({
      data: {
        nombre: `Admin ${nombre.trim()}`,
        email: emailLimpio,
        password: hashedPassword,
        rol: 'ADMIN',
        gimnasioId: nuevoGym.id
      }
    });

    return res.status(201).json(nuevoGym);
  } catch (error) {
    console.error("Error detallado al crear gimnasio:", error);
    return res.status(500).json({ error: "Error al crear el gimnasio", detalle: error.message });
  }
});

// PUT /api/superadmin/gimnasios/:id/estado - Cambiar estado
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