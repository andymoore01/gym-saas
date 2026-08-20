import React, { useState, useEffect } from 'react';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export default function SuperAdmin({ onVolver }) {
  const [gimnasios, setGimnasios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoGym, setNuevoGym] = useState({ nombre: '', email: '', telefono: '' });

  const cargarGimnasios = async () => {
    setCargando(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/superadmin/gimnasios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGimnasios(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarGimnasios();
  }, []);

  const handleCrearGimnasio = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/superadmin/gimnasios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoGym)
      });

      if (res.ok) {
        setModalNuevo(false);
        setNuevoGym({ nombre: '', email: '', telefono: '' });
        cargarGimnasios();
      } else {
        alert("Error al registrar cliente.");
      }
    } catch (err) {
      alert("Error de conexión.");
    }
  };

  const toggleEstado = async (gym) => {
    const nuevoEstado = gym.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/superadmin/gimnasios/${gym.id}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (res.ok) {
        cargarGimnasios();
      }
    } catch (err) {
      alert("Error al cambiar estado.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0C] text-white p-6 font-sans">
      {/* HEADER SUPERADMIN */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2.5 rounded-xl text-white font-black">
            👑
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight">PANEL SUPERADMIN</h1>
            <p className="text-xs text-zinc-400">Control global de gimnasios y suscripciones SaaS</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setModalNuevo(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg"
          >
            + Nuevo Gimnasio
          </button>
          <button
            onClick={onVolver}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2 rounded-xl text-xs transition-all"
          >
            Ir a App
          </button>
        </div>
      </div>

      {/* METRICAS SAAS */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#121417] border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs text-zinc-500 font-bold uppercase">Gimnasios Totales</span>
          <p className="text-3xl font-black text-white mt-1">{gimnasios.length}</p>
        </div>
        <div className="bg-[#121417] border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs text-zinc-500 font-bold uppercase">Clientes Activos</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">
            {gimnasios.filter(g => g.estado !== 'SUSPENDIDO').length}
          </p>
        </div>
        <div className="bg-[#121417] border border-zinc-800 p-5 rounded-2xl">
          <span className="text-xs text-zinc-500 font-bold uppercase">Suspendidos</span>
          <p className="text-3xl font-black text-red-500 mt-1">
            {gimnasios.filter(g => g.estado === 'SUSPENDIDO').length}
          </p>
        </div>
      </div>

      {/* TABLA DE GIMNASIOS */}
      <div className="max-w-6xl mx-auto bg-[#121417] border border-zinc-800 rounded-2xl p-5 shadow-2xl">
        <h2 className="text-sm font-bold text-zinc-300 uppercase mb-4">Gimnasios Registrados</h2>
        {cargando ? (
          <p className="text-center py-8 text-zinc-500 text-xs">Cargando clientes...</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-500 uppercase border-b border-zinc-800">
              <tr>
                <th className="pb-3 px-2">Gimnasio</th>
                <th className="pb-3 px-2">Email</th>
                <th className="pb-3 px-2">Socios</th>
                <th className="pb-3 px-2">Estado</th>
                <th className="pb-3 px-2 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {gimnasios.map((gym) => (
                <tr key={gym.id} className="hover:bg-zinc-800/20">
                  <td className="py-3 px-2 font-bold text-white">{gym.nombre}</td>
                  <td className="py-3 px-2 text-zinc-400">{gym.email}</td>
                  <td className="py-3 px-2 font-mono text-purple-400 font-bold">
                    {gym._count?.socios || 0}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      gym.estado === 'SUSPENDIDO' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {gym.estado || 'ACTIVO'}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleEstado(gym)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all ${
                        gym.estado === 'SUSPENDIDO'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-red-600/80 hover:bg-red-600 text-white'
                      }`}
                    >
                      {gym.estado === 'SUSPENDIDO' ? 'Reactivar' : 'Suspender'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CREAR CLIENTE */}
      {modalNuevo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121417] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-black text-white uppercase">Registrar Nuevo Gimnasio</h3>
            <form onSubmit={handleCrearGimnasio} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre del Gimnasio</label>
                <input
                  type="text"
                  required
                  value={nuevoGym.nombre}
                  onChange={(e) => setNuevoGym({ ...nuevoGym, nombre: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="Ej. Titanium Gym"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Email de Contacto</label>
                <input
                  type="email"
                  required
                  value={nuevoGym.email}
                  onChange={(e) => setNuevoGym({ ...nuevoGym, email: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="admin@titanium.com"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoGym.telefono}
                  onChange={(e) => setNuevoGym({ ...nuevoGym, telefono: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  placeholder="2914123456"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2 rounded-xl text-xs hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white font-bold py-2 rounded-xl text-xs hover:bg-purple-500"
                >
                  Crear Gimnasio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}