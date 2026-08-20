import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { crearSuscripcion, manejarWebhook } from '../services/mercadopago.service.js';

const router = Router();

// El admin del gimnasio pide suscribirse (o cambiar de plan) a tu SaaS.
router.post('/checkout', requireAuth, requireAdmin, async (req, res) => {
  const gimnasio = await prisma.gimnasio.findUnique({ where: { id: req.auth.gimnasioId } });
  const { planSaas } = req.body;

  const { initPoint, preapprovalId } = await crearSuscripcion({
    email: gimnasio.email,
    planSaas,
    externalReference: gimnasio.id,
  });

  await prisma.suscripcion.update({
    where: { gimnasioId: gimnasio.id },
    data: { mercadopagoPreapprovalId: preapprovalId, planSaas },
  });

  res.json({ initPoint });
});

// Webhook público para Mercado Pago
router.post('/webhook', async (req, res) => {
  await manejarWebhook(req.body, prisma);
  res.sendStatus(200);
});

export default router;