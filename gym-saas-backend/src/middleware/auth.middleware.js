import jwt from 'jsonwebtoken';

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

// Middleware exclusivo para verificar que sea SuperAdmin
export const requireSuperAdmin = (req, res, next) => {
  // Primero ejecutamos la validación del token llamando a requireAuth o leyéndolo directamente
  requireAuth(req, res, () => {
    if (req.auth && req.auth.rol === 'SUPERADMIN') {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de SuperAdmin.' });
    }
  });
};

// Exportación por defecto
export default requireAuth;