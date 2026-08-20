import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registrar Gimnasio
export const registrarGimnasio = async (req, res) => {
  try {
    const { nombre, nombreGimnasio, email, password } = req.body;
    const nombreFinal = nombre || nombreGimnasio;

    if (!nombreFinal || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Generar el slug a partir del nombre recibido
    const slugGenerated = nombreFinal
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // Verificar si el correo ya existe
    const existe = await prisma.gimnasio.findUnique({
      where: { email }
    });

    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear gimnasio con el slug generado
    const nuevoGimnasio = await prisma.gimnasio.create({
      data: {
        nombre: nombreFinal,
        slug: slugGenerated,
        email,
        password: hashedPassword,
        activo: true
      }
    });

    return res.status(201).json({
      mensaje: 'Gimnasio creado con éxito',
      gimnasio: nuevoGimnasio
    });

  } catch (error) {
    console.error('Error al registrar gimnasio:', error);
    return res.status(500).json({ 
      error: 'Error interno en el servidor',
      mensajeError: error.message 
    });
  }
};

// Login de Gimnasio
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const gimnasio = await prisma.gimnasio.findUnique({
      where: { email }
    });

    if (!gimnasio) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, gimnasio.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: gimnasio.id, email: gimnasio.email, slug: gimnasio.slug },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      gimnasio: {
        id: gimnasio.id,
        nombre: gimnasio.nombre,
        email: gimnasio.email,
        slug: gimnasio.slug
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