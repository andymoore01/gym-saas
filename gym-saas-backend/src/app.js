import express from 'express';
import cors from 'cors';

import sociosRoutes from './routes/socios.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import authRoutes from './routes/auth.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import suscripcionRoutes from './routes/suscripcion.routes.js';

const app = express();

// Permitir peticiones desde el frontend en Vite
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Montar rutas de la API
app.use('/api/socios', sociosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/suscripcion', suscripcionRoutes);

export default app;