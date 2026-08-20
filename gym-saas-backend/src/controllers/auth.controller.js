import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST /api/auth/registro
export const registrarGimnasio = async (req, res) => {
  try {
    const { nombreGimnasio, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoGimnasio = await prisma.gimnasio.create({
      data: {
        nombre: nombreGimnasio || 'Mi Gimnasio',
        email,
        password: passwordHash,
      },
    });

    return res.status(201).json({
      message: 'Gimnasio registrado con éxito',
      gimnasioId: nuevoGimnasio.id,
    });
  } catch (error) {
    console.error('Error al registrar gimnasio:', error);
    return res.status(500).json({ error: 'Error al registrar el gimnasio' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

    return res.json({ token, gimnasio: { id: gimnasio.id, nombre: gimnasio.nombre } });
  } catch (error) {
    console.error('Error en el login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};