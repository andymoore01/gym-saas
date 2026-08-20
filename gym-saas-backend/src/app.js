import express from 'express';
import cors from 'cors';

import sociosRoutes from './routes/socios.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import authRoutes from './routes/auth.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import suscripcionRoutes from './routes/suscripcion.routes.js';
import planesRoutes from './routes/planes.routes.js';
const app = express();

// Configuración de CORS limpia y permisiva para producción
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Montar rutas de la API
app.use('/api/socios', sociosRoutes);
app.use('/api/planes', planesRoutes); 
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/suscripcion', suscripcionRoutes);

export default app;