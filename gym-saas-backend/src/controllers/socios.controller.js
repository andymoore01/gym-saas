import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los socios del gimnasio autenticado
export const getSocios = async (req, res) => {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;

    const socios = await prisma.socio.findMany({
      where: {
        gimnasioId: gimnasioId,
      },
      orderBy: {
        joinedDate: "desc" // Ordenar por fecha de ingreso descendente  
        },
        include: {
          plan: true
      },
    });

    return res.status(200).json(socios);
  } catch (error) {
    console.error('Error al obtener socios:', error);
    return res.status(500).json({
      error: 'Error al obtener la lista de socios',
      detalle: error.message,
    });
  }
};

// Obtener un socio por ID
export const getSocioById = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;

    const socio = await prisma.socio.findFirst({
      where: {
        id: id,
        gimnasioId: gimnasioId,
      },
    });

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    return res.status(200).json(socio);
  } catch (error) {
    console.error('Error al obtener socio:', error);
    return res.status(500).json({
      error: 'Error al buscar el socio',
      detalle: error.message,
    });
  }
};

// Crear un nuevo socio
export const crearSocio = async (req, res) => {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;
    const { nombre, apellido, dni, email, telefono } = req.body;

    if (!nombre || !apellido) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }

    const nuevoSocio = await prisma.socio.create({
      data: {
        nombre,
        apellido,
        dni,
        email,
        telefono,
        gimnasioId: gimnasioId,
      },
    });

    return res.status(201).json({
      mensaje: 'Socio creado exitosamente',
      socio: nuevoSocio,
    });
  } catch (error) {
    console.error('Error al crear socio:', error);
    return res.status(500).json({
      error: 'Error interno al registrar el socio',
      detalle: error.message,
    });
  }
};

// Actualizar un socio
export const actualizarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;
    const { nombre, apellido, dni, email, telefono, activo } = req.body;

    const socioExistente = await prisma.socio.findFirst({
      where: { id, gimnasioId },
    });

    if (!socioExistente) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const socioActualizado = await prisma.socio.update({
      where: { id },
      data: {
        nombre,
        apellido,
        dni,
        email,
        telefono,
        activo,
      },
    });

    return res.status(200).json({
      mensaje: 'Socio actualizado correctamente',
      socio: socioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar socio:', error);
    return res.status(500).json({
      error: 'Error al actualizar el socio',
      detalle: error.message,
    });
  }
};

// Eliminar o desactivar un socio
export const eliminarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;

    const socioExistente = await prisma.socio.findFirst({
      where: { id, gimnasioId },
    });

    if (!socioExistente) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    await prisma.socio.delete({
      where: { id },
    });

    return res.status(200).json({ mensaje: 'Socio eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    return res.status(500).json({
      error: 'Error al eliminar el socio',
      detalle: error.message,
    });
  }
};