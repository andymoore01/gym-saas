import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import PantallaRecepcion from './PantallaRecepcion';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  return <PantallaRecepcion />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);