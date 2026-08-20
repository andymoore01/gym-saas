import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import LandingPage from './LandingPage';
import SuperAdmin from './SuperAdmin';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [modoAdmin, setModoAdmin] = useState<boolean>(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);

    // Detección automática si la URL tiene ?admin=true
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setModoAdmin(true);
    }
  }, []);

  // 1. SI SE ACTIVA EL MODO ADMIN -> Renderiza directamente SuperAdmin
  if (modoAdmin) {
    return <SuperAdmin onVolver={() => setModoAdmin(false)} />;
  }

  // 2. SI HAY TOKEN DE GIMNASIO -> Renderiza la Recepción con la Barra Superior de acceso a SuperAdmin
  if (token) {
    return (
      <div>
        {/* Barra superior de control para vos */}
        <div className="bg-[#090A0C] border-b border-zinc-800 px-4 py-1.5 flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">Sistema Gimnasio Cliente</span>
          <button
            onClick={() => setModoAdmin(true)}
            className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
          >
            👑 Abrir Panel SuperAdmin
          </button>
        </div>

        <PantallaRecepcion />
      </div>
    );
  }

  // 3. LANDING PAGE
  return (
    <div>
      {/* Botón flotante en Landing Page por si querés entrar a SuperAdmin sin loguearte */}
      <button
        onClick={() => setModoAdmin(true)}
        className="fixed bottom-3 right-3 bg-purple-900/90 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-xl font-bold text-xs z-50 shadow-2xl hover:bg-purple-800 transition-all cursor-pointer"
      >
        👑 Acceso SuperAdmin
      </button>

      <LandingPage onGoToLogin={() => (window.location.href = '/?login=true')} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);