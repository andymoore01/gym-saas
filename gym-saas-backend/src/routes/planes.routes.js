import { Router } from 'express';
import { getPlanes } from '../controllers/planes.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js'; // Ajustá el nombre si en tu proyecto se llama auth.js

const router = Router();

router.get('/', verificarToken, getPlanes);

export default router;