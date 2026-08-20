import prisma from '../lib/prisma.js';

export const createSocio = async (req, res) => {
  try {
    const { nombre, name, telefono, phone, notas, notes, gimnasioId, planId, planName } = req.body;

    const nombreSocio = nombre || name;
    if (!nombreSocio) {
      return res.status(400).json({ error: 'El nombre del socio es obligatorio' });
    }

    // 1. Resolver el gimnasio (usa el que viene del request o toma el primero disponible)
    let targetGimnasioId = gimnasioId || (req.auth && req.auth.gimnasioId);

    if (!targetGimnasioId) {
      let gym = await prisma.gimnasio.findFirst();
      if (!gym) {
        gym = await prisma.gimnasio.create({
          data: {
            nombre: 'Mi Gimnasio Principal',
            slug: 'gym-principal',
            email: 'admin@gimnasio.com',
          },
        });
      }
      targetGimnasioId = gym.id;
    }

    // 2. Resolver el Plan (busca un plan existente para ese gym o crea uno por defecto)
    let targetPlanId = planId;

    if (!targetPlanId) {
      let planExistente = await prisma.plan.findFirst({
        where: { gimnasioId: targetGimnasioId },
      });

      if (!planExistente) {
        planExistente = await prisma.plan.create({
          data: {
            nombre: planName || 'Libre',
            precio: 55000,
            gimnasioId: targetGimnasioId,
          },
        });
      }
      targetPlanId = planExistente.id;
    }

    // Obtener solo los socios DEL gimnasio autenticado
export const getSocios = async (req, res) => {
  try {
    const { gimnasioId } = req.user;

    const socios = await prisma.socio.findMany({
      where: { gimnasioId },
      include: { plan: true }
    });

    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los socios" });
  }
};

// Crear socio asociándolo al gimnasio del token
export const createSocio = async (req, res) => {
  try {
    const { gimnasioId } = req.user;
    const { nombre, telefono, planId, monto, notas } = req.body;

    const nuevoSocio = await prisma.socio.create({
      data: {
        nombre,
        telefono,
        planId,
        monto,
        notas,
        gimnasioId // Asignación automática al tenant
      }
    });

    res.status(201).json(nuevoSocio);
  } catch (error) {
    res.status(500).json({ error: "Error al crear socio" });
  }
};

    // 3. Crear el socio con el esquema exacto de Prisma
    const nuevoSocio = await prisma.socio.create({
      data: {
        nombre: nombreSocio,
        telefono: String(telefono || phone || ''),
        notas: notas || notes || '',
        gimnasioId: targetGimnasioId,
        planId: targetPlanId,
      },
      include: {
        plan: true,
      },
    });

    return res.status(201).json(nuevoSocio);
  } catch (error) {
    console.error('Error al crear socio en Prisma:', error);
    return res.status(500).json({ error: error.message || 'Error al guardar el socio' });
  }
};

export const getSocios = async (req, res) => {
  try {
    const socios = await prisma.socio.findMany({
      include: { plan: true, pagos: true },
    });
    return res.json(socios);
  } catch (error) {
    console.error('Error al obtener socios:', error);
    return res.status(500).json({ error: 'Error al obtener los socios' });
  }
};

export const deleteSocio = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.socio.delete({ where: { id } });
    return res.json({ ok: true, message: 'Socio eliminado' });
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    return res.status(500).json({ error: 'Error al eliminar socio' });
  }
};