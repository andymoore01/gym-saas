import { Router } from 'express';
import { getPlanes } from '../controllers/planes.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, getPlanes);

export default router;