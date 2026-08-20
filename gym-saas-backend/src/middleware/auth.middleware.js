import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

export const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Adjunta { id, gimnasioId } a la request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};