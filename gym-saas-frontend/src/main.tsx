import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import GymMembershipSystem from './sistema-socios-gimnasio';
import LandingPage from './LandingPage';
import './style.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [vista, setVista] = useState<'landing' | 'login' | 'app'>('landing');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setVista('app');
    }
  }, []);

  if (token && vista === 'app') {
    return <GymMembershipSystem />;
  }

  if (vista === 'login') {
    return (
      <Login
        onLoginSuccess={(newToken) => {
          setToken(newToken);
          setVista('app');
        }}
      />
    );
  }

  return <LandingPage onGoToLogin={() => setVista('login')} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);