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
  const [modoAdmin, setModoAdmin] = useState<boolean>(false);
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

    // Detectar si la URL pide el Login (?login=true o #login)
    const url = window.location.href.toLowerCase();
    if (url.includes('login')) {
      setVistaLogin(true);
    }
  }, []);

  const esSuperAdmin = rolUsuario === 'SUPERADMIN';

  // 1. PÁGINA SUPERADMIN
  if (modoAdmin && esSuperAdmin) {
    return <SuperAdmin onVolver={() => setModoAdmin(false)} />;
  }

  // 2. SISTEMA RECEPCIÓN (GIMNASIO)
  if (token) {
    return (
      <div>
        {esSuperAdmin && (
          <div className="bg-[#090A0C] border-b border-zinc-800 px-4 py-1.5 flex justify-between items-center text-xs">
            <span className="text-purple-400 font-mono text-[11px] font-bold">
              👑 Modo SuperAdmin Detectado
            </span>
            <button
              onClick={() => setModoAdmin(true)}
              className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
            >
              Abrir Panel SuperAdmin
            </button>
          </div>
        )}

        <PantallaRecepcion />
      </div>
    );
  }

  // 3. PÁGINA DE LOGIN
  if (vistaLogin) {
    return (
      <Login
        onLoginSuccess={(newToken) => {
          setToken(newToken);
          setVistaLogin(false);
          window.location.href = '/';
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