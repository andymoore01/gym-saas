import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

// Función para leer el rol dentro del JWT
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [rolUsuario, setRolUsuario] = useState<string | null>(null);
  const [vistaLogin, setVistaLogin] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      const decoded = parseJwt(savedToken);
      if (decoded && decoded.rol) {
        setRolUsuario(decoded.rol);
      }
    }

    // Detectar si la URL pide el Login (?login=true o #login o /login)
    const url = window.location.href.toLowerCase();
    if (url.includes('login')) {
      setVistaLogin(true);
    }
  }, []);

  const esSuperAdmin = rolUsuario === 'SUPERADMIN';

  // 1. SI ES SUPERADMIN: SE LE MUESTRA EXCLUSIVAMENTE SU PANEL APARTE Y NADA MÁS
  if (token && esSuperAdmin) {
    return (
      <SuperAdmin 
        onVolver={() => {
          localStorage.clear();
          window.location.href = '/';
        }} 
      />
    );
  }

  // 2. SI ES UN GIMNASIO COMÚN (ADMIN): ENTRA DIRECTO A SU PANEL DE SOCIOS
  if (token && !esSuperAdmin) {
    return <PantallaRecepcion />;
  }

  // 3. PÁGINA DE LOGIN
  if (vistaLogin) {
    return (
      <Login
        onLoginSuccess={(newToken) => {
          setToken(newToken);
          setVistaLogin(false);
          const decoded = parseJwt(newToken);
          
          // Redirección inmediata según el rol al loguearse con éxito
          if (decoded && decoded.rol === 'SUPERADMIN') {
            window.location.href = '/'; // Al recargar, caerá directo en el SuperAdmin
          } else {
            window.location.href = '/'; // Al recargar, caerá directo en PantallaRecepcion
          }
        }}
      />
    );
  }

  // 4. LANDING PAGE
  return (
    <LandingPage
      onGoToLogin={() => setVistaLogin(true)}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);