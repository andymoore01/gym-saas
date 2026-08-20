import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getPlanes = async (req, res) => {
  try {
    const gimnasioId = req.auth?.gimnasioId || req.auth?.id;

    const planes = await prisma.plan.findMany({
      where: gimnasioId ? { gimnasioId } : {}
    });

    res.json(planes);
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({ error: 'Error al obtener los planes' });
  }
};