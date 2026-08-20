import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// REGISTRAR INGRESO / ASISTENCIA
router.post('/ingreso', async (req, res) => {
  const { socio_id, gimnasio_id } = req.body;

  try {
    const socio = await prisma.socio.findUnique({
      where: { id: Number(socio_id) }
    });

    if (!socio) {
      return res.status(404).json({ error: 'Socio no encontrado' });
    }

    const hoy = new Date();
    const estaAlDia = socio.fechaVencimiento >= hoy;

    await prisma.asistencia.create({
      data: {
        socioId: Number(socio_id),
        gimnasioId: Number(gimnasio_id)
      }
    });

    res.json({
      permitido: estaAlDia,
      socio: {
        nombre: socio.nombre,
        plan: socio.plan,
        vencimiento: socio.fechaVencimiento,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el ingreso' });
  }
});

export default router;