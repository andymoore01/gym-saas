import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js'; // Ajustá la ruta según donde tengas prisma

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos" });
    }

    const emailLimpio = email.trim().toLowerCase();

    // 1. Buscar el usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailLimpio },
      include: { gimnasio: true }
    });

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 2. Verificar la contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 3. Evaluar si es tu email de SuperAdmin
    const esSuperAdminEmail = usuario.email === 'andysoydelchivo@gmail.com';

    // 4. Firmar el Token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        gimnasioId: usuario.gimnasioId,
        email: usuario.email,
        rol: esSuperAdminEmail ? 'SUPERADMIN' : usuario.rol
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
        rol: esSuperAdminEmail ? 'SUPERADMIN' : usuario.rol,
        gimnasioId: usuario.gimnasioId
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ error: "Error interno al iniciar sesión", detalle: error.message });
  }
};