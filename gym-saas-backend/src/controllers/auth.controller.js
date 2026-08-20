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

    // 1. Generar el slug a partir del nombre
    const slugGenerated = nombreFinal
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\-]+/g, '');

    // 2. Validar si existe el email
    const existe = await prisma.gimnasio.findUnique({
      where: { email }
    });

    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear el gimnasio pasándole el 'slug' (Línea 18 corregida)
    const nuevoGimnasio = await prisma.gimnasio.create({
      data: {
        nombre: nombreFinal,
        slug: slugGenerated, // 👈 OBLIGATORIO: solución al error de Prisma
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