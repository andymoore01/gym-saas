import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import Login from './login'
import GymMembershipSystem from './sistema-socios-gimnasio' // O el nombre exacto de tu archivo principal
import './style.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Al cargar, verifica si ya hay un token guardado en el navegador
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  // Si no está autenticado, muestra el Login
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  // Si está autenticado, muestra el sistema principal
  return <GymMembershipSystem />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)