import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const registrarGimnasio = async (req, res) => {
  try {
    const { nombre, nombreGimnasio, email, password } = req.body;
    const nombreFinal = nombre || nombreGimnasio;

    if (!nombreFinal || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Generamos el slug reemplazando espacios y caracteres especiales
    const slugGenerated = nombreFinal
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '');

    const existe = await prisma.gimnasio.findUnique({
      where: { email }
    });

    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoGimnasio = await prisma.gimnasio.create({
      data: {
        nombre: nombreFinal,
        slug: slugGenerated, // 👈 Pasamos el slug obligatorio
        email,
        password: hashedPassword,
        activo: true
      }
    });

    return res.status(201).json({
      mensaje: 'Gimnasio creado con éxito',
      gimnasio: {
        id: nuevoGimnasio.id,
        nombre: nuevoGimnasio.nombre,
        email: nuevoGimnasio.email,
        slug: nuevoGimnasio.slug
      }
    });

  } catch (error) {
    console.error('Error detallado en registro:', error);
    return res.status(500).json({ 
      error: 'Error interno al registrar el gimnasio',
      detalle: error.message 
    });
  }
};

export const login = async (req, res) => {
  // Tu lógica de login actual
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const gimnasio = await prisma.gimnasio.findUnique({
      where: { email },
    });

    if (!gimnasio) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const passwordValida = await bcrypt.compare(password, gimnasio.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { gimnasioId: gimnasio.id, email: gimnasio.email },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      gimnasio: {
        id: gimnasio.id,
        nombre: gimnasio.nombre,
        email: gimnasio.email,
      },
    });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};