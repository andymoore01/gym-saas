import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';

// Listar todos los gimnasios (para el panel global)
export const listarGimnasios = async (req, res) => {
  try {
    const gimnasios = await prisma.gimnasio.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(gimnasios);
  } catch (error) {
    console.error("Error al listar gimnasios:", error);
    return res.status(500).json({ error: "Error al obtener los gimnasios" });
  }
};

// Crear un nuevo gimnasio y su usuario administrador
export const crearGimnasio = async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const emailLimpio = email.trim().toLowerCase();

    // Usar findFirst en lugar de findUnique para evitar el error de llave compuesta en Prisma
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { email: emailLimpio }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: "El email ya se encuentra registrado en el sistema" });
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

    // 2. Hashear la contraseña y crear el usuario ADMIN asociado
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

    return res.status(201).json({ mensaje: "Gimnasio creado con éxito", gimnasio: nuevoGym });
  } catch (error) {
    console.error("Error detallado al crear gimnasio:", error);
    return res.status(500).json({ error: "Error al crear el gimnasio", detalle: error.message });
  }
};

// Eliminar un gimnasio
export const eliminarGimnasio = async (req, res) => {
  try {
    const { id } = req.params;

    // Primero eliminamos los usuarios asociados para respetar las restricciones de relaciones
    await prisma.usuario.deleteMany({
      where: { gimnasioId: id }
    });

    // Luego eliminamos el gimnasio
    await prisma.gimnasio.delete({
      where: { id }
    });

    return res.json({ mensaje: "Gimnasio eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar gimnasio:", error);
    return res.status(500).json({ error: "Error al eliminar el gimnasio", detalle: error.message });
  }
};