import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [route, setRoute] = useState<string>(
    window.location.hash || window.location.pathname || window.location.search
  );

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }

    const handleRouteChange = () => {
      setRoute(window.location.hash || window.location.pathname || window.location.search);
    };

    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Evaluar la URL completa
  const currentUrl = window.location.href.toLowerCase();
  const esSuperAdmin = currentUrl.includes('superadmin') || currentUrl.includes('admin');

  // 1. PRIMERA PRIORIDAD: VISTA SUPERADMIN (Carga si la URL contiene "superadmin" o "admin")
  if (esSuperAdmin) {
    return <SuperAdmin onVolver={() => (window.location.href = '/')} />;
  }

  // 2. SEGUNDA PRIORIDAD: APP GIMNASIO (si no es admin pero tiene token)
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. LOGIN
  if (currentUrl.includes('login')) {
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