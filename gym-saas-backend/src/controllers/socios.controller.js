import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener todos los socios del gimnasio autenticado
export const getSocios = async (req, res) => {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

    if (!gimnasioId) {
      return res.status(401).json({ error: 'No se identificó el gimnasio autenticado' });
    }

    const socios = await prisma.socio.findMany({
      where: {
        gimnasioId: gimnasioId,
      },
      orderBy: {
        joinedDate: "desc"
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
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

    const socio = await prisma.socio.findFirst({
      where: {
        id: id,
        gimnasioId: gimnasioId,
      },
      include: {
        plan: true
      }
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
    const { nombre, apellido, dni, telefono, notas, planId } = req.body;

    if (!gimnasioId) {
      return res.status(400).json({ error: 'El gimnasioId es requerido' });
    }

    let nombreCompleto = nombre ? nombre.trim() : '';
    if (apellido && apellido !== '-') {
      nombreCompleto = `${nombreCompleto} ${apellido.trim()}`.trim();
    }

    if (!nombreCompleto) {
      return res.status(400).json({ error: 'El nombre del socio es obligatorio' });
    }

    let targetPlanId = planId;

    if (!targetPlanId) {
      const primerPlan = await prisma.plan.findFirst({
        where: { gimnasioId }
      });

      if (!primerPlan) {
        return res.status(400).json({ 
          error: 'No se puede crear el socio porque el gimnasio no tiene ningún plan de cuota registrado.' 
        });
      }
      targetPlanId = primerPlan.id;
    }

    const nuevoSocio = await prisma.socio.create({
      data: {
        nombre: nombreCompleto,
        dni: dni ? String(dni).trim() : null,
        telefono: telefono ? String(telefono).trim() : null,
        notas: notas || null,
        gimnasioId: gimnasioId,
        planId: targetPlanId,
      },
      include: {
        plan: true
      }
    });

    return res.status(201).json({
      mensaje: 'Socio creado exitosamente',
      socio: nuevoSocio,
    });
  } catch (error) {
    console.error('Error detallado al crear socio:', error);
    return res.status(500).json({
      error: 'Error interno al registrar el socio',
      detalle: error.message
    });
  }
};

// Actualizar un socio (CORREGIDO: Incluye DNI)
export const actualizarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;
    const { nombre, dni, telefono, notas, estado, planId } = req.body; // 👈 Agregado 'dni'

    const socioExistente = await prisma.socio.findFirst({
      where: { id, gimnasioId },
    });

    if (!socioExistente) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const socioActualizado = await prisma.socio.update({
      where: { id },
      data: {
        ...(nombre ? { nombre: nombre.trim() } : {}),
        ...(dni !== undefined ? { dni: dni ? String(dni).trim() : null } : {}), // 👈 Guarda el DNI
        ...(telefono !== undefined ? { telefono: telefono ? String(telefono).trim() : null } : {}),
        ...(notas !== undefined ? { notas } : {}),
        ...(estado ? { estado } : {}),
        ...(planId ? { planId } : {}),
      },
      include: {
        plan: true
      }
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

// Eliminar socio
export const eliminarSocio = async (req, res) => {
  try {
    const { id } = req.params;
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id || req.usuario?.gimnasioId;

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