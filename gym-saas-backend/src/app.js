import express from 'express';
import cors from 'cors';

import sociosRoutes from './routes/socios.routes.js';
import asistenciasRoutes from './routes/asistencias.routes.js';
import authRoutes from './routes/auth.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import suscripcionRoutes from './routes/suscripcion.routes.js';

const app = express();

// Permitir peticiones tanto locales como desde Vercel
const allowedOrigins = [
  'http://localhost:5173',
  'https://gym-saas-omega.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como Postman o curl) o si están en la lista permitida
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Montar rutas de la API
app.use('/api/socios', sociosRoutes);
app.use('/api/asistencias', asistenciasRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/suscripcion', suscripcionRoutes);

export default app;