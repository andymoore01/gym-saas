import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);

  // Leemos la ruta normal o los parametros ?vista=admin / ?admin=true
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  const esSuperAdmin = path === '/superadmin' || path === '/admin' || searchParams.get('vista') === 'admin';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // 1. VISTA SUPERADMIN (si entra por /superadmin o por /?vista=admin)
  if (esSuperAdmin) {
    return <SuperAdmin onVolver={() => (window.location.href = '/')} />;
  }

  // 2. APP GIMNASIO (con sesión iniciada)
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. LOGIN
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