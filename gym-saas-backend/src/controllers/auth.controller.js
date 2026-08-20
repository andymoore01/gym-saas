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

    // 1. Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailLimpio }
    });

    if (!usuario) {
      return res.status(401).json({ error: "Usuario o credenciales inválidas" });
    }

    // 2. CAMBIO CLAVE: Buscamos tanto passwordHash (como está en tu DB) como password por si acaso
    const hashGuardado = usuario.passwordHash || usuario.password;
    if (!hashGuardado) {
      return res.status(401).json({ error: "El usuario no tiene una contraseña configurada" });
    }

    // 3. Comparar la contraseña escrita con el hash de la base de datos
    const passwordValido = await bcrypt.compare(password, hashGuardado);
    if (!passwordValido) {
      return res.status(401).json({ error: "Usuario o credenciales inválidas" });
    }

    // 4. Definir rol (Si es tu mail, le asigna SUPERADMIN de forma automática)
    const esAdminDev = emailLimpio === 'andysoydelchivo@gmail.com';
    const rolFinal = esAdminDev ? 'SUPERADMIN' : (usuario.rol || 'ADMIN');

    // 5. Generar Token JWT
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
    console.error("Error crítico en login:", error);
    return res.status(500).json({ error: "Error interno al iniciar sesión", detalle: error.message });
  }
};