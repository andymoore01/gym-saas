import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import Login from './login'
import GymMembershipSystem from './sistema-socios-gimnasio'
import './style.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsAuthenticated(true)
    }
    setCheckingAuth(false)
  }, [])

  if (checkingAuth) {
    return <div className="min-h-screen bg-[#111315] text-white flex items-center justify-center">Cargando...</div>
  }

  return (
    <>
      {!isAuthenticated ? (
        <Login onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <GymMembershipSystem />
      )}
    </>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}