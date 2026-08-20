import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();

    const usuario = await prisma.usuario.findUnique({
      where: { email: emailLimpio }
    });

    if (!usuario) {
      return res.status(401).json({ error: `Usuario no encontrado en la BD para: ${emailLimpio}` });
    }

    const hashGuardado = usuario.passwordHash || usuario.password;
    if (!hashGuardado) {
      return res.status(401).json({ error: "El usuario no tiene contraseña registrada" });
    }

    const passwordValido = await bcrypt.compare(password, hashGuardado);
    if (!passwordValido) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const esAdminDev = emailLimpio === 'andysoydelchivo@gmail.com';
    const rolFinal = esAdminDev ? 'SUPERADMIN' : (usuario.rol || 'ADMIN');

    const token = jwt.sign(
      {
        id: usuario.id,
        gimnasioId: usuario.gimnasioId,
        email: usuario.email,
        rol: rolFinal
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: rolFinal,
        gimnasioId: usuario.gimnasioId
      }
    });
  } catch (error) {
    // ESTO VA A MOSTRAR EL ERROR REAL EN LA PANTALLA EN VEZ DE "Error interno"
    console.error("ERROR DETALLADO LOGIN:", error);
    return res.status(500).json({ 
      error: "FALLÓ EL LOGIN", 
      detalle: error.message,
      stack: error.stack 
    });
  }
};