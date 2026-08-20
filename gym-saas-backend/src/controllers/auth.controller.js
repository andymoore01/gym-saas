import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Función para registrar un gimnasio nuevo (tenant)
export const registrarGimnasio = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();

    // Verificar si ya existe un usuario con ese email
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email: emailLimpio }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya se encuentra registrado" });
    }

    // 1. Crear el gimnasio
    const nuevoGym = await prisma.gimnasio.create({
      data: {
        nombre: nombre.trim(),
        email: emailLimpio,
        telefono: telefono ? telefono.trim() : null,
        estado: 'ACTIVO'
      }
    });

    // 2. Encriptar contraseña y crear el usuario administrador vinculado
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuario.create({
      data: {
        nombre: `Admin ${nombre.trim()}`,
        email: emailLimpio,
        passwordHash: hashedPassword,
        rol: 'ADMIN',
        gimnasioId: nuevoGym.id
      }
    });

    return res.status(201).json({ mensaje: "Gimnasio registrado con éxito", gimnasio: nuevoGym });
  } catch (error) {
    console.error("Error detallado al registrar gimnasio:", error);
    return res.status(500).json({ error: "Error al crear el gimnasio", detalle: error.message });
  }
};

// Función de inicio de sesión
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();

    // Buscamos con findFirst para prevenir el error de llave compuesta en Prisma
    const usuario = await prisma.usuario.findFirst({
      where: { email: emailLimpio }
    });

    if (!usuario) {
      return res.status(401).json({ error: "Usuario o credenciales inválidas" });
    }

    const hashGuardado = usuario.passwordHash || usuario.password;
    if (!hashGuardado) {
      return res.status(401).json({ error: "El usuario no tiene contraseña registrada" });
    }

    const passwordValido = await bcrypt.compare(password, hashGuardado);
    if (!passwordValido) {
      return res.status(401).json({ error: "Usuario o credenciales inválidas" });
    }

    // Forzar SUPERADMIN si es tu correo de desarrollador
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
    console.error("Error crítico en login:", error);
    return res.status(500).json({ error: "Error interno al iniciar sesión", detalle: error.message });
  }
};