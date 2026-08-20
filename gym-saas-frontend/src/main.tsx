import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [verAdmin, setVerAdmin] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
  }, []);

  // 1. Si presionaste el botón de SuperAdmin, renderiza el panel violeta
  if (verAdmin) {
    return <SuperAdmin onVolver={() => setVerAdmin(false)} />;
  }

  // 2. Si estás logueado en la app del gimnasio
  if (token) {
    return (
      <div>
        {/* Botón superior directo en la app */}
        <div className="bg-[#090A0C] border-b border-zinc-800 px-4 py-1.5 flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">Modo: Gimnasio Cliente</span>
          <button
            onClick={() => setVerAdmin(true)}
            className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 px-3 py-1 rounded-lg font-bold text-[11px] transition-all"
          >
            👑 Abrir Panel SuperAdmin
          </button>
        </div>

        <PantallaRecepcion />
      </div>
    );
  }

  // 3. Landing page por defecto
  return <LandingPage onGoToLogin={() => (window.location.href = '/?login=true')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);