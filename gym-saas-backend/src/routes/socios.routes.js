import { Router } from 'express';
import { getSocios, createSocio, deleteSocio } from '../controllers/socios.controller.js';

const router = Router();

router.get('/', getSocios);
router.post('/', createSocio);
router.delete('/:id', deleteSocio);

export default router;