import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los socios del gimnasio autenticado
export const getSocios = async (req, res) => {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

    const socios = await prisma.socio.findMany({
      where: gimnasioId ? { gimnasioId } : {},
      orderBy: {
        createdAt: "desc" // Si no existe joinedDate, no rompe
      },
      include: {
        plan: true
      },
    }).catch(async () => {
      // Fallback si no existe la relación 'plan' o el campo 'createdAt'
      return await prisma.socio.findMany({
        where: gimnasioId ? { gimnasioId } : {}
      });
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
        ...(gimnasioId ? { gimnasioId } : {}),
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
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
    let { nombre, apellido, dni, email, telefono, planId } = req.body;

    // Separar nombre y apellido si vienen en una sola variable
    if (nombre && !apellido) {
      const partes = nombre.trim().split(' ');
      if (partes.length > 1) {
        nombre = partes[0];
        apellido = partes.slice(1).join(' ');
      } else {
        apellido = '-';
      }
    }

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    // Estructura limpia y compatible con Prisma Supabase
    const dataPrisma = {
      nombre: nombre.trim(),
      apellido: (apellido || '-').trim(),
      telefono: telefono ? String(telefono).trim() : null,
      dni: dni ? String(dni).trim() : null,
      email: email ? String(email).trim() : null,
    };

    if (gimnasioId) {
      dataPrisma.gimnasioId = gimnasioId;
    }

    if (planId && planId !== '') {
      dataPrisma.planId = planId;
    }

    // Intentamos crear el socio directamente asignando los IDs escalares
    let nuevoSocio;
    try {
      nuevoSocio = await prisma.socio.create({
        data: dataPrisma
      });
    } catch (dbError) {
      console.warn("Intento 1 falló, intentando sin planId opcional:", dbError.message);
      // Si falló por Foreign Key en planId, creamos el socio sin asociar el plan
      delete dataPrisma.planId;
      nuevoSocio = await prisma.socio.create({
        data: dataPrisma
      });
    }

    return res.status(201).json({
      mensaje: 'Socio creado exitosamente',
      socio: nuevoSocio,
    });
  } catch (error) {
    console.error('Error fatal al crear socio:', error);
    return res.status(500).json({
      error: 'Error interno al registrar el socio',
      detalle: error.message || String(error)
    });
  }
};

// Actualizar un socio
export const actualizarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;
    const { nombre, apellido, dni, email, telefono, activo, planId } = req.body;

    const socioExistente = await prisma.socio.findFirst({
      where: { id, ...(gimnasioId ? { gimnasioId } : {}) },
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
        ...(planId ? { planId } : {})
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
      where: { id, ...(gimnasioId ? { gimnasioId } : {}) },
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