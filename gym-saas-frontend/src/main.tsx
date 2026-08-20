import React from 'react'
import ReactDOM from 'react-dom/client'
// @ts-ignore
import GymMembershipSystem from './sistema-socios-gimnasio.jsx'
import './style.css'

const rootElement = document.getElementById('app') || document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GymMembershipSystem />
    </React.StrictMode>
  )
}