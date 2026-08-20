import { Router } from 'express';
import { registrarGimnasio, login } from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', registrarGimnasio); // alta de un gimnasio nuevo (tenant)
router.post('/login', login);

export default router;