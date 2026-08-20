import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import './style.css'; // Mantiene tus estilos globales / Tailwind

function App() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Al cargar la app, comprobar si ya existe un token guardado
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Si no hay token guardado, renderiza el Login
  if (!token) {
    return (
      <Login 
        onLoginSuccess={() => setToken(localStorage.getItem('token'))} 
      />
    );
  }

  // Si hay token, renderiza el panel de recepción/socios
  return <PantallaRecepcion />;
}

// Montar la app en el HTML principal
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);