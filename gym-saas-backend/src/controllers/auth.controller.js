import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registrar Gimnasio + Crear Usuario ADMIN inicial
export const registrarGimnasio = async (req, res) => {
  try {
    const { nombre, nombreGimnasio, email, password } = req.body;
    const nombreFinal = nombre || nombreGimnasio;

    if (!nombreFinal || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Generar el slug a partir del nombre
    const slugGenerated = nombreFinal
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // Verificar si el email del gimnasio ya existe
    const existeGimnasio = await prisma.gimnasio.findUnique({
      where: { email }
    });

    if (existeGimnasio) {
      return res.status(400).json({ error: 'El email ya está registrado para un gimnasio' });
    }

    // Hashear la contraseña para el usuario administrador
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el Gimnasio y su Usuario ADMIN en la misma transacción
    const nuevoGimnasio = await prisma.gimnasio.create({
      data: {
        nombre: nombreFinal,
        slug: slugGenerated,
        email: email,
        activo: true,
        usuarios: {
          create: {
            nombre: `Admin ${nombreFinal}`,
            email: email,
            passwordHash: hashedPassword,
            rol: 'ADMIN'
          }
        }
      },
      include: {
        usuarios: true
      }
    });

    return res.status(201).json({
      mensaje: 'Gimnasio y usuario administrador creados con éxito',
      gimnasio: {
        id: nuevoGimnasio.id,
        nombre: nuevoGimnasio.nombre,
        slug: nuevoGimnasio.slug,
        email: nuevoGimnasio.email,
        activo: nuevoGimnasio.activo
      }
    });

  } catch (error) {
    console.error('Error al registrar gimnasio:', error);
    return res.status(500).json({ 
      error: 'Error interno en el servidor',
      mensajeError: error.message 
    });
  }
};

// Login del Usuario del Gimnasio
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar al usuario por email
    const usuario = await prisma.usuario.findFirst({
      where: { email },
      include: { gimnasio: true }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario o credenciales inválidas' });
    }

    // Verificar si el gimnasio asociado está activo
    if (!usuario.gimnasio.activo) {
      return res.status(403).json({ error: 'El gimnasio se encuentra suspendido/inactivo' });
    }

    // Validar contraseña contra passwordHash
    const validPassword = await bcrypt.compare(password, usuario.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar Token JWT con la información del Tenant
    const token = jwt.sign(
      { 
        usuarioId: usuario.id,
        gimnasioId: usuario.gimnasioId,
        rol: usuario.rol,
        email: usuario.email 
      },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        gimnasioId: usuario.gimnasioId
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      error: 'Error interno al iniciar sesión',
      mensajeError: error.message
    });
  }
};