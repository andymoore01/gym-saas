import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);

  // Leer la URL completa y los parametros de búsqueda en cada render
  const urlCompleta = window.location.href.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  
  // Detección estricta de solicitud SuperAdmin
  const esAdmin = 
    urlCompleta.includes('superadmin') || 
    urlCompleta.includes('admin') || 
    searchParams.get('admin') === 'true' ||
    searchParams.get('vista') === 'admin';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 1. SI PIDE ADMIN, MOSTRAR EXCLUSIVAMENTE SUPERADMIN (PRIORIDAD 1)
  if (esAdmin) {
    return (
      <SuperAdmin 
        onVolver={() => {
          window.location.href = window.location.origin;
        }} 
      />
    );
  }

  // 2. SI NO ES ADMIN Y HAY TOKEN -> APP DE RECEPCIÓN
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. PÁGINA DE LOGIN
  if (urlCompleta.includes('login')) {
    return (
      <Login
        onLoginSuccess={(newToken) => {
          setToken(newToken);
          window.location.href = '/';
        }}
      />
    );
  }

  // 4. LANDING PAGE
  return <LandingPage onGoToLogin={() => (window.location.href = '/?login=true')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);