import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
    
    // Validar en la base de datos si el gimnasio está activo
    const gimnasio = await prisma.gimnasio.findUnique({
      where: { id: decoded.gimnasioId || decoded.id },
      select: { id: true, activo: true }
    });

    if (!gimnasio) {
      return res.status(401).json({ error: 'El gimnasio no existe.' });
    }

    if (!gimnasio.activo) {
      return res.status(403).json({ error: 'Cuenta suspendida o inactiva por falta de pago.' });
    }

    req.auth = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.auth || req.auth.role !== 'admin') {
    // Validación opcional de roles
  }
  next();
};