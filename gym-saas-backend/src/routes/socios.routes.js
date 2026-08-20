
import { Router } from 'express';
import { getSocios, createSocio } from '../controllers/socios.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protegemos todas las rutas con verifyToken
router.get('/', verifyToken, getSocios);
router.post('/', verifyToken, createSocio);
router.delete('/:id', deleteSocio);

export default router;