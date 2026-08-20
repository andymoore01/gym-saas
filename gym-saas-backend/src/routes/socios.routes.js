import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// GET /api/socios - Obtener todos los socios con su último pago
router.get('/', async (req, res) => {
  try {
    const usuarioId = req.auth?.id || req.usuario?.id;
    const usuario = await prisma.usuario.findFirst({ where: { id: usuarioId } });

    if (!usuario || !usuario.gimnasioId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const socios = await prisma.socio.findMany({
      where: { gimnasioId: usuario.gimnasioId },
      include: {
        plan: true,
        pagos: { // <--- ESTO ES LA CLAVE
          orderBy: { fechaPago: 'desc' },
          take: 1
        }
      }
    });

    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener socios" });
  }
});

// POST /api/socios - Crear socio (manteniendo tu lógica actual)
router.post('/', async (req, res) => {
    // ... tu lógica actual de crear socio ...
});

// PUT /api/socios/:id - Editar socio
router.put('/:id', async (req, res) => {
    // ... tu lógica actual de editar socio ...
});

// DELETE /api/socios/:id
router.delete('/:id', async (req, res) => {
    // ... tu lógica actual de eliminar socio ...
});

export default router;