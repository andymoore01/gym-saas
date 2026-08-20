import React, { useState, useEffect, useRef } from 'react';
import { ModalCobro } from './ModalCobro';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export default function GymMembershipSystem() {
  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState('');
  const [toast, setToast] = useState(null);
  const [menuAbiertoId, setMenuAbiertoId] = useState(null);

  const searchInputRef = useRef(null);

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [socioCobrar, setSocioCobrar] = useState(null);

  // Formularios
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', dni: '', telefono: '', planId: '' });
  const [socioEditar, setSocioEditar] = useState(null);

  // Atajo de teclado Ctrl+K / Cmd+K para buscar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarDatos = async () => {
    setCargando(true);
    setMensajeError('');
    const token = localStorage.getItem('token');

    if (!token) {
      setMensajeError('No se encontró sesión activa.');
      setCargando(false);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    try {
      const [resSocios, resPlanes] = await Promise.all([
        fetch(`${API_URL}/socios`, { headers }),
        fetch(`${API_URL}/planes`, { headers })
      ]);

      if (resSocios.ok) {
        const dataSocios = await resSocios.json();
        setSocios(Array.isArray(dataSocios) ? dataSocios : []);
      } else {
        const errJson = await resSocios.json().catch(() => ({}));
        setMensajeError(`Error ${resSocios.status}: ${errJson.error || 'Error al obtener socios'}`);
      }

      if (resPlanes.ok) {
        const dataPlanes = await resPlanes.json();
        let lista = Array.isArray(dataPlanes) ? dataPlanes : (dataPlanes?.planes || dataPlanes?.data || []);
        setPlanes(lista);
      }
    } catch (error) {
      setMensajeError(`Error de conexión: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const enviarWhatsApp = (socio) => {
    if (!socio.telefono) {
      mostrarToast('Este socio no tiene un teléfono registrado.', 'error');
      return;
    }

    let numLimpio = socio.telefono.replace(/\D/g, '');
    if (!numLimpio.startsWith('549') && numLimpio.length === 10) {
      numLimpio = `549${numLimpio}`;
    }

    const nombrePlan = socio.plan?.nombre || 'su plan';
    const mensaje = `Hola ${socio.nombre}! 👋 Te escribimos del gimnasio para recordarte que tu cuota del plan *${nombrePlan}* está próxima a vencer. ¡Te esperamos para entrenar! 💪`;

    window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleCrearSocio = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!nuevoSocio.nombre.trim()) return;

    try {
      const response = await fetch(`${API_URL}/socios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevoSocio)
      });

      if (response.ok) {
        setModalAbierto(false);
        setNuevoSocio({ nombre: '', dni: '', telefono: '', planId: '' });
        mostrarToast('¡Socio registrado con éxito!');
        cargarDatos();
      } else {
        const data = await response.json().catch(() => ({}));
        mostrarToast(data.error || 'No se pudo registrar el socio.', 'error');
      }
    } catch (error) {
      mostrarToast('Error de conexión al guardar.', 'error');
    }
  };

  const abrirEditar = (socio) => {
    setSocioEditar({
      id: socio.id,
      nombre: socio.nombre || '',
      dni: socio.dni || socio.documento || '',
      telefono: socio.telefono || '',
      planId: socio.planId || socio.plan?.id || ''
    });
    setModalEditarAbierto(true);
    setMenuAbiertoId(null);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/socios/${socioEditar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(socioEditar)
      });

      if (response.ok) {
        setModalEditarAbierto(false);
        setSocioEditar(null);
        mostrarToast('Socio actualizado correctamente.');
        cargarDatos();
      } else {
        mostrarToast('Error al actualizar datos.', 'error');
      }
    } catch (error) {
      mostrarToast('Error de conexión.', 'error');
    }
  };

  const handleEliminarSocio = async (socio) => {
    if (!window.confirm(`¿Seguro que querés eliminar a ${socio.nombre}?`)) return;
    const token = localStorage.getItem('token');
    setMenuAbiertoId(null);

    try {
      const response = await fetch(`${API_URL}/socios/${socio.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        mostrarToast('Socio eliminado.');
        cargarDatos();
      } else {
        mostrarToast('Error al eliminar socio.', 'error');
      }
    } catch (error) {
      mostrarToast('Error de red.', 'error');
    }
  };

  const obtenerIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0].slice(0, 2).toUpperCase();
  };

  const formatearMoneda = (monto) => {
    if (!monto) return '$ 0';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(monto);
  };

  const sociosFiltrados = socios.filter((socio) => {
    const dniSocio = socio.dni || socio.documento || '';
    const coincideTexto =
      socio.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      socio.telefono?.includes(busqueda) ||
      dniSocio.includes(busqueda);

    if (filtroEstado === 'Todos') return coincideTexto;
    if (filtroEstado === 'Al día' || filtroEstado === 'ACTIVO') return coincideTexto && socio.estado === 'ACTIVO';
    if (filtroEstado === 'Vencidos' || filtroEstado === 'BAJA') return coincideTexto && socio.estado === 'BAJA';
    return coincideTexto;
  });

  const totalActivos = socios.filter((s) => s.estado === 'ACTIVO').length;
  const totalVencidos = socios.filter((s) => s.estado === 'BAJA').length;

  return (
    <div className="min-h-screen bg-[#090A0C] text-zinc-100 p-4 md:p-8 font-sans selection:bg-[#C6FF3D] selection:text-black">
      
      {/* TOAST FLOTANTE DE NOTIFICACIÓN */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 ${
          toast.tipo === 'exito' 
            ? 'bg-[#182210]/90 border-[#C6FF3D]/40 text-[#C6FF3D]' 
            : 'bg-[#2A1215]/90 border-red-500/40 text-red-400'
        }`}>
          <span>{toast.tipo === 'exito' ? '✨' : '⚠️'}</span>
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="bg-[#C6FF3D] p-3 rounded-2xl text-black font-black shadow-[0_0_25px_rgba(198,255,61,0.25)] flex items-center justify-center">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              SISTEMA DE SOCIOS
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Gestión inteligente de gimnasios y cobranzas</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex-1 md:flex-initial bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(198,255,61,0.2)] active:scale-95 text-sm"
          >
            + Nuevo socio
          </button>
          <button
            onClick={handleLogout}
            className="bg-[#14171A] hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium px-4 py-2.5 rounded-xl border border-zinc-800/80 transition-all active:scale-95 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* BANNER DE ERROR */}
      {mensajeError && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-950/20 border border-red-800/40 text-red-300 text-xs p-4 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
          <span>⚠️ {mensajeError}</span>
          <button onClick={cargarDatos} className="underline font-bold hover:text-white shrink-0">Reintentar</button>
        </div>
      )}

      {/* TARJETAS DE KPIS Y MÉTRICAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#121417] border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden hover:border-zinc-700 transition-all">
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-1">Total Registrados</span>
          <p className="text-3xl font-black text-white">{socios.length}</p>
        </div>
        <div className="bg-[#121417] border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden hover:border-[#C6FF3D]/40 transition-all">
          <span className="text-[10px] text-[#C6FF3D] font-black uppercase tracking-widest block mb-1">Socios Al Día</span>
          <p className="text-3xl font-black text-[#C6FF3D]">{totalActivos}</p>
        </div>
        <div className="bg-[#121417] border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden hover:border-amber-500/40 transition-all">
          <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest block mb-1">Por Vencer (5 días)</span>
          <p className="text-3xl font-black text-amber-400">0</p>
        </div>
        <div className="bg-[#121417] border border-zinc-800/60 p-5 rounded-2xl relative overflow-hidden hover:border-red-500/40 transition-all">
          <span className="text-[10px] text-red-400 font-black uppercase tracking-widest block mb-1">Socios Vencidos</span>
          <p className="text-3xl font-black text-red-500">{totalVencidos}</p>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA CON ATANJO CMD+K */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#121417] border border-zinc-800/80 rounded-2xl pl-4 pr-16 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C6FF3D] transition-all"
          />
          <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 bg-zinc-800/80 text-zinc-400 text-[10px] font-mono px-2 py-0.5 rounded-lg border border-zinc-700/50 pointer-events-none">
            ⌘K
          </kbd>
        </div>

        <div className="flex bg-[#121417] border border-zinc-800/80 p-1 rounded-2xl text-xs font-semibold gap-1">
          {['Todos', 'Al día', 'Vencidos'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 rounded-xl transition-all ${
                filtroEstado === estado
                  ? 'bg-zinc-800 text-[#C6FF3D] font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA DE SOCIOS LÍMPIA Y ESTILIZADA */}
      <div className="max-w-7xl mx-auto bg-[#121417] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
        {cargando ? (
          <div className="space-y-2 p-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 bg-zinc-800/20 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-sm gap-2">
            <span className="text-4xl">🔍</span>
            <p className="font-semibold">No se encontraron socios registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] text-zinc-500 uppercase tracking-wider border-b border-zinc-800/80 bg-[#0E1012]">
                <tr>
                  <th className="py-3.5 px-4">Socio</th>
                  <th className="py-3.5 px-4">DNI</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Plan / Valor</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {sociosFiltrados.map((socio) => (
                  <tr key={socio.id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-black text-[#C6FF3D] shrink-0">
                        {obtenerIniciales(socio.nombre)}
                      </div>
                      <span>{socio.nombre}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">{socio.dni || socio.documento || '-'}</td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">{socio.telefono || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          socio.estado === 'ACTIVO'
                            ? 'bg-[#182813] text-[#C6FF3D] border border-[#C6FF3D]/30'
                            : 'bg-[#2A1316] text-red-400 border border-red-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${socio.estado === 'ACTIVO' ? 'bg-[#C6FF3D] animate-pulse' : 'bg-red-400'}`} />
                        {socio.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      <span className="text-zinc-200 block">{socio.plan?.nombre || 'Sin plan'}</span>
                      {socio.plan?.precio && (
                        <span className="text-zinc-500 font-mono">{formatearMoneda(socio.plan.precio)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right relative">
                      <div className="inline-flex items-center gap-2">
                        {/* BOTÓN PRINCIPAL COBRAR */}
                        <button
                          onClick={() => setSocioCobrar(socio)}
                          className="px-3 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b0f024] text-black text-xs font-black transition-all flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          💳 Cobrar
                        </button>

                        {/* MENÚ FLOTANTE DE MÁS OPCIONES */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuAbiertoId(menuAbiertoId === socio.id ? null : socio.id)}
                            className="p-1.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all text-xs border border-zinc-700/40"
                          >
                            ⋮
                          </button>

                          {menuAbiertoId === socio.id && (
                            <div className="absolute right-0 mt-2 w-36 bg-[#181B1E] border border-zinc-800 rounded-2xl shadow-2xl z-20 py-1.5 text-left text-xs">
                              <button
                                onClick={() => enviarWhatsApp(socio)}
                                className="w-full px-3 py-2 text-emerald-400 hover:bg-zinc-800 flex items-center gap-2 transition-all"
                              >
                                💬 Recordar
                              </button>
                              <button
                                onClick={() => abrirEditar(socio)}
                                className="w-full px-3 py-2 text-blue-400 hover:bg-zinc-800 flex items-center gap-2 transition-all"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleEliminarSocio(socio)}
                                className="w-full px-3 py-2 text-red-400 hover:bg-zinc-800 flex items-center gap-2 transition-all border-t border-zinc-800"
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL COBRAR */}
      {socioCobrar && (
        <ModalCobro
          socio={socioCobrar}
          onClose={() => setSocioCobrar(null)}
          onSuccess={() => {
            mostrarToast('¡Pago registrado con éxito!');
            cargarDatos();
          }}
        />
      )}

      {/* MODAL CREAR SOCIO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121417] border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Registrar Nuevo Socio</h3>
            <form onSubmit={handleCrearSocio} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoSocio.nombre}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">DNI</label>
                <input
                  type="text"
                  value={nuevoSocio.dni}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, dni: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 40123456"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoSocio.telefono}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 2914796038"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Plan</label>
                <select
                  value={nuevoSocio.planId}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, planId: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-[#C6FF3D] font-bold focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white">
                      {plan.nombre} {plan.precio ? `- $${plan.precio}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C6FF3D] text-black font-bold py-2.5 rounded-xl text-sm hover:bg-[#b0f024] transition-all"
                >
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR SOCIO */}
      {modalEditarAbierto && socioEditar && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121417] border border-zinc-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Editar Socio</h3>
            <form onSubmit={handleGuardarEdicion} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={socioEditar.nombre}
                  onChange={(e) => setSocioEditar({ ...socioEditar, nombre: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">DNI</label>
                <input
                  type="text"
                  value={socioEditar.dni}
                  onChange={(e) => setSocioEditar({ ...socioEditar, dni: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={socioEditar.telefono}
                  onChange={(e) => setSocioEditar({ ...socioEditar, telefono: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-semibold block mb-1">Plan</label>
                <select
                  value={socioEditar.planId}
                  onChange={(e) => setSocioEditar({ ...socioEditar, planId: e.target.value })}
                  className="w-full bg-[#090A0C] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-[#C6FF3D] font-bold focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white">
                      {plan.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-sm hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C6FF3D] text-black font-bold py-2.5 rounded-xl text-sm hover:bg-[#b0f024] transition-all"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}