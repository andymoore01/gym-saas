import React, { useEffect, useState } from 'react';

export default function SuperAdminPanel() {
  const [gimnasios, setGimnasios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');

  const token = localStorage.getItem('token');

  const cargarGimnasios = async () => {
    try {
      const res = await fetch('https://gym-saas-backend-vwm9.onrender.com/api/superadmin/gimnasios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setGimnasios(data);
    } catch (err) {
      console.error('Error al cargar gimnasios:', err);
    }
  };

  useEffect(() => {
    cargarGimnasios();
  }, []);

  const handleCrearGimnasio = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://gym-saas-backend-vwm9.onrender.com/api/superadmin/gimnasios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, email, password, telefono })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Gimnasio creado con éxito');
        setModalAbierto(false);
        setNombre(''); setEmail(''); setPassword(''); setTelefono('');
        cargarGimnasios();
      } else {
        alert(data.error || 'Error al crear');
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este gimnasio permanentemente?')) return;
    try {
      const res = await fetch(`https://gym-saas-backend-vwm9.onrender.com/api/superadmin/gimnasios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) cargarGimnasios();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#111315] text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider">PANEL SUPERADMIN</h1>
          <p className="text-xs text-zinc-400">Control global de gimnasios SaaS</p>
        </div>
        <div className="space-x-4">
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-[#C6FF3D] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#b0f024]"
          >
            + Nuevo Gimnasio
          </button>
          <button 
            onClick={handleCerrarSesion}
            className="bg-zinc-800 text-zinc-300 font-bold px-4 py-2 rounded-xl text-sm hover:bg-zinc-700"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Tabla de Gimnasios */}
      <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900 text-zinc-400 uppercase text-xs">
            <tr>
              <th className="p-4">Gimnasio</th>
              <th className="p-4">Email Admin</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {gimnasios.map((gym) => (
              <tr key={gym.id}>
                <td className="p-4 font-bold">{gym.nombre}</td>
                <td className="p-4 text-zinc-400">{gym.email}</td>
                <td className="p-4">
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">
                    ACTIVO
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => handleEliminar(gym.id)}
                    className="bg-red-500/10 text-red-400 px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-500/20"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {gimnasios.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-zinc-500">No hay gimnasios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para Crear Gimnasio */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleCrearGimnasio} className="bg-[#181B1E] border border-zinc-800 p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold">Registrar Nuevo Gimnasio</h3>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nombre del Gimnasio</label>
              <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Email de Contacto</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Contraseña Inicial</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
              <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white" />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setModalAbierto(false)} className="w-1/2 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm">Cancelar</button>
              <button type="submit" className="w-1/2 bg-[#C6FF3D] text-black font-bold py-2.5 rounded-xl text-sm">Crear</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}