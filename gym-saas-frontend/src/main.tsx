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

    // Detección por URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true' || window.location.hash.includes('admin')) {
      setModoAdmin(true);
    }
  }, []);

  // 1. Si está activo el modo admin, muestra SuperAdmin
  if (modoAdmin) {
    return <SuperAdmin onVolver={() => setModoAdmin(false)} />;
  }

  // 2. Si está logueado, muestra la app normal
  if (token) {
    return (
      <div>
        {/* Acceso directo discreto en pantalla */}
        <button
          onClick={() => setModoAdmin(true)}
          className="fixed bottom-2 left-2 bg-purple-900/90 text-purple-200 border border-purple-500/30 text-[10px] font-mono px-2 py-1 rounded-md z-50 hover:bg-purple-800 transition-all cursor-pointer"
        >
          👑 Ir a SuperAdmin
        </button>
        <PantallaRecepcion />
      </div>
    );
  }

  // 3. Landing page
  return <LandingPage onGoToLogin={() => (window.location.href = '/?login=true')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);