import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [route, setRoute] = useState<string>(window.location.hash || window.location.pathname);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }

    const handleHashChange = () => {
      setRoute(window.location.hash || window.location.pathname);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Comprobar si la ruta o el hash solicitan el panel de SuperAdmin
  const esSuperAdmin = 
    route.includes('superadmin') || 
    route.includes('admin') || 
    window.location.search.includes('vista=admin');

  // 1. VISTA SUPERADMIN (Acceso por /#/superadmin, /superadmin o ?vista=admin)
  if (esSuperAdmin) {
    return <SuperAdmin onVolver={() => (window.location.href = '/')} />;
  }

  // 2. APP GIMNASIO (con sesión iniciada)
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. LOGIN
  if (route.includes('login')) {
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
  return <LandingPage onGoToLogin={() => (window.location.href = '/#/login')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);