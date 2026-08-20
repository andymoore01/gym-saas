import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://gym-saas-backend-vwm9.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        alert(data.error || 'Credenciales inválidas');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111315] text-white flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-[#181B1E] border border-zinc-800 p-6 rounded-2xl max-w-sm w-full space-y-4">
        <h2 className="text-xl font-bold text-center uppercase tracking-tight">INICIAR SESIÓN</h2>
        
        <div>
          <label className="text-xs text-zinc-400 block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 block mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C6FF3D] text-black font-bold py-2.5 rounded-xl hover:bg-[#b0f024] transition-all text-sm mt-2"
        >
          {loading ? 'Ingresando...' : 'Ingresar al Gimnasio'}
        </button>
      </form>
    </div>
  );
}