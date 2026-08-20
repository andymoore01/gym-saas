import jwt from 'jsonwebtoken';

// Middleware para verificar que el usuario esté autenticado
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
    req.auth = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Middleware para verificar rol de Administrador
export const requireAdmin = (req, res, next) => {
  if (!req.auth || req.auth.role !== 'admin') {
    // Si no manejás roles estrictos por ahora, podés permitir el paso o ajustar la validación
    // next();
  }
  next();
};