import React, { useState, useEffect } from 'react';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export default function PantallaRecepcion() {
  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Estado para el formulario de nuevo socio
  const [nuevoSocio, setNuevoSocio] = useState({
    nombre: '',
    telefono: '',
    planId: '',
    notas: ''
  });

  // Cargar lista de socios y planes desde el backend
  const cargarDatos = async () => {
    setCargando(true);
    setErrorApi(false);
    const token = localStorage.getItem('token');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Peticiones en paralelo para socios y planes
      const [resSocios, resPlanes] = await Promise.all([
        fetch(`${API_URL}/socios`, { headers }),
        fetch(`${API_URL}/planes`, { headers })
      ]);

      if (!resSocios.ok) throw new Error('Error al obtener socios');
      
      const dataSocios = await resSocios.json();
      setSocios(Array.isArray(dataSocios) ? dataSocios : []);

      if (resPlanes.ok) {
        const dataPlanes = await resPlanes.json();
        setPlanes(Array.isArray(dataPlanes) ? dataPlanes : []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      setErrorApi(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Guardar nuevo socio
  const handleCrearSocio = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoSocio)
      });

      if (res.ok) {
        setModalAbierto(false);
        setNuevoSocio({ nombre: '', telefono: '', planId: '', notas: '' });
        cargarDatos();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Error al guardar el socio');
      }
    } catch (error) {
      console.error('Error al crear socio:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  // Cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('gimnasioId');
    window.location.reload();
  };

  // Filtrado de socios por búsqueda y por estado
  const sociosFiltrados = socios.filter((socio) => {
    const coincideTexto =
      socio.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      socio.telefono?.includes(busqueda);

    if (filtroEstado === 'Todos') return coincideTexto;
    if (filtroEstado === 'Al día' || filtroEstado === 'ACTIVO') return coincideTexto && socio.estado === 'ACTIVO';
    if (filtroEstado === 'Vencidos' || filtroEstado === 'BAJA') return coincideTexto && socio.estado === 'BAJA';
    return coincideTexto;
  });

  // Métricas
  const totalActivos = socios.filter((s) => s.estado === 'ACTIVO').length;
  const totalVencidos = socios.filter((s) => s.estado === 'BAJA').length;

  return (
    <div className="min-h-screen bg-[#111315] text-white p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-[#C6FF3D] p-2.5 rounded-xl text-black font-bold">
            🏋️
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">SISTEMA DE SOCIOS</h1>
            <p className="text-xs text-zinc-400">Pagos, planes y vencimientos · guardado automático</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex-1 md:flex-initial bg-[#C6FF3D] text-black font-bold px-4 py-2.5 rounded-xl hover:bg-[#b0f024] transition-all text-sm"
          >
            + Nuevo socio
          </button>
          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            Salir
          </button>
        </div>
      </div>

      {/* ALERTA DE ERROR */}
      {errorApi && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-950/40 border border-red-800 text-red-300 text-xs p-3.5 rounded-xl flex items-center justify-between">
          <span>⚠️ Servidor desconectado o error en la API. Los cambios no se guardarán permanentemente.</span>
          <button 
            onClick={cargarDatos}
            className="underline font-bold hover:text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* METRICAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-400 font-medium uppercase">Socios Activos</p>
          <p className="text-2xl font-bold text-white mt-1">{totalActivos}</p>
        </div>
        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-400 font-medium uppercase">Al Día</p>
          <p className="text-2xl font-bold text-[#C6FF3D] mt-1">{totalActivos}</p>
        </div>
        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-400 font-medium uppercase">Por Vencer</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">0</p>
        </div>
        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-400 font-medium uppercase">Vencidos</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{totalVencidos}</p>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#181B1E] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
          />
        </div>

        <div className="flex bg-[#181B1E] border border-zinc-800 p-1 rounded-xl text-xs font-semibold">
          {['Todos', 'Al día', 'Vencidos'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filtroEstado === estado
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA O LISTADO DE SOCIOS */}
      <div className="max-w-7xl mx-auto bg-[#181B1E] border border-zinc-800 rounded-2xl p-4 min-h-[300px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Cargando socios...
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            No se encontraron socios en la base de datos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="pb-3 px-2">Nombre</th>
                  <th className="pb-3 px-2">Teléfono</th>
                  <th className="pb-3 px-2">Estado</th>
                  <th className="pb-3 px-2">Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sociosFiltrados.map((socio) => (
                  <tr key={socio.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-white">{socio.nombre}</td>
                    <td className="py-3 px-2 text-zinc-400">{socio.telefono || '-'}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          socio.estado === 'ACTIVO'
                            ? 'bg-lime-500/10 text-[#C6FF3D] border border-lime-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {socio.estado}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-zinc-400">{socio.plan?.nombre || 'Sin plan'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NUEVO SOCIO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white uppercase">Registrar Nuevo Socio</h3>
            
            <form onSubmit={handleCrearSocio} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoSocio.nombre}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoSocio.telefono}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                <select
                  value={nuevoSocio.planId}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, planId: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="">Seleccionar plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2 rounded-xl text-sm hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C6FF3D] text-black font-bold py-2 rounded-xl text-sm hover:bg-[#b0f024] transition-all"
                >
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}