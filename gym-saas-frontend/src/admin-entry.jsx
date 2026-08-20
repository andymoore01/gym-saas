import React from 'react';
import ReactDOM from 'react-dom/client';
import SuperAdmin from './SuperAdmin';
import './style.css';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <SuperAdmin onVolver={() => (window.location.href = '/')} />
  </React.StrictMode>
);