import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  // Leemos si la URL o Hash contienen "superadmin" o "admin"
  const [esAdminView, setEsAdminView] = useState<boolean>(() => {
    const urlCompleta = (window.location.href + window.location.hash + window.location.search).toLowerCase();
    return urlCompleta.includes('superadmin') || urlCompleta.includes('admin');
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }

    // Escuchar cambios en la URL/Hash en tiempo real
    const revisarRuta = () => {
      const url = (window.location.href + window.location.hash + window.location.search).toLowerCase();
      setEsAdminView(url.includes('superadmin') || url.includes('admin'));
    };

    window.addEventListener('hashchange', revisarRuta);
    window.addEventListener('popstate', revisarRuta);
    return () => {
      window.removeEventListener('hashchange', revisarRuta);
      window.removeEventListener('popstate', revisarRuta);
    };
  }, []);

  // 1. SI PIDE VISTA DE SUPERADMIN -> RENDERIZAR PANEL DE CONTROL GLOBAL
  if (esAdminView) {
    return (
      <SuperAdmin 
        onVolver={() => {
          window.location.hash = '';
          window.location.search = '';
          window.location.pathname = '/';
        }} 
      />
    );
  }

  // 2. SI NO ES ADMIN Y TIENE TOKEN -> VISTA RECEPCIÓN/SISTEMA
  if (token) {
    return <PantallaRecepcion />;
  }

  // 3. LOGIN
  const urlLower = window.location.href.toLowerCase();
  if (urlLower.includes('login')) {
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