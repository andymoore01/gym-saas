import express from 'express';
import bcrypt from 'bcryptjs';
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
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();
    const nombreLimpio = nombre.trim();

    // Generar el slug automáticamente
    const slugGenerado = nombreLimpio
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Validar si el email ya existe en la tabla Usuario usando findFirst
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email: emailLimpio }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya se encuentra registrado" });
    }

    // 1. Crear el Gimnasio con los campos exactos del esquema (activo en lugar de estado)
    const nuevoGym = await prisma.gimnasio.create({
      data: {
        nombre: nombreLimpio,
        slug: slugGenerado,
        email: emailLimpio,
        activo: true
      }
    });

    // 2. Hash de contraseña y creación del Usuario asignado al Gimnasio
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.create({
      data: {
        nombre: `Admin ${nombreLimpio}`,
        email: emailLimpio,
        passwordHash: hashedPassword,
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

export default router;