import { Router } from 'express';
import { 
  getSocios, 
  getSocioById, 
  crearSocio, 
  actualizarSocio, 
  eliminarSocio 
} from '../controllers/socios.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, getSocios);
router.get('/:id', requireAuth, getSocioById);
router.post('/', requireAuth, crearSocio); // 👈 Usar crearSocio
router.put('/:id', requireAuth, actualizarSocio);
router.delete('/:id', requireAuth, eliminarSocio);

export default router;