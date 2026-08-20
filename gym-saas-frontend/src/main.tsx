import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import Login from './login'
import GymMembershipSystem from './sistema-socios-gimnasio'
import './style.css'

function App() {
  return <Login onLoginSuccess={() => alert('Login exitoso!')} />
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />)
}