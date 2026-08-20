const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  // 1. Extraemos el encabezado 'Authorization'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no provisto o formato inválido.' });
  }

  // 2. Extraemos el token puro eliminando el prefijo "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verificamos la validez de la firma del JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Verificamos que el gimnasio exista y esté activo en la base de datos
    const gimnasio = await prisma.gimnasio.findUnique({
      where: { id: decoded.gimnasioId },
      select: { id: true, activo: true }
    });

    if (!gimnasio) {
      return res.status(401).json({ error: 'El gimnasio asociado a este token ya no existe.' });
    }

    if (!gimnasio.activo) {
      return res.status(403).json({ 
        error: 'Cuenta suspendida o inactiva por falta de pago. Ponete en contacto con el administrador.' 
      });
    }

    // 5. Inyectamos la información del gimnasio en el objeto req para usarla en los controllers
    req.gimnasioId = gimnasio.id;

    // 6. Continuamos a la siguiente función o endpoint
    next();
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'La sesión expiro. Por favor, volvé a iniciar sesión.' });
    }

    return res.status(401).json({ error: 'Token inválido o no autorizado.' });
  }
};

module.exports = authMiddleware;