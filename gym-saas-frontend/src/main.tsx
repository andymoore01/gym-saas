import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const path = window.location.pathname; // Leemos la URL del navegador

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 1. SI LA URL ES "/superadmin" O "/admin", MOSTRAR LA PÁGINA INDEPENDIENTE DE SUPERADMIN
  if (path === '/superadmin' || path === '/admin') {
    return <SuperAdmin onVolver={() => (window.location.href = '/')} />;
  }

  // 2. SI HAY SESIÓN Y ESTÁ EN LA RAÍZ "/", MOSTRAR LA APP DE GIMNASIO
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. SI VIENE DE LOGIN O QUIERE INICIAR SESIÓN
  if (path === '/login') {
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
  return <LandingPage onGoToLogin={() => (window.location.href = '/login')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);