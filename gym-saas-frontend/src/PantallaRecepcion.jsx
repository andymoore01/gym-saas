import React, { useState, useEffect } from 'react';
import { ModalCobro } from './ModalCobro';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export default function GymMembershipSystem() {
  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState('');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [modalPlanesAbierto, setModalPlanesAbierto] = useState(false);
  const [modalReporteAbierto, setModalReporteAbierto] = useState(false); // 👈 Nuevo Modal Reporte / Caja Diaria
  const [socioCobrar, setSocioCobrar] = useState(null);

  // Estados de reportes / caja
  const [pagosDelDia, setPagosDelDia] = useState([]);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  // Estados de formularios
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', dni: '', telefono: '', planId: '' });
  const [socioEditar, setSocioEditar] = useState(null);
  const [nuevoPlan, setNuevoPlan] = useState({ nombre: '', precio: '' });

  const cargarDatos = async () => {
    setCargando(true);
    setMensajeError('');
    const token = localStorage.getItem('token');

    if (!token) {
      setMensajeError('No se encontró un token de sesión. Por favor, reingresá.');
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
        setMensajeError(`Error ${resSocios.status}: ${errJson.error || errJson.message || 'Error al obtener socios'}`);
      }

      if (resPlanes.ok) {
        const dataPlanes = await resPlanes.json();
        let lista = Array.isArray(dataPlanes) ? dataPlanes : (dataPlanes?.planes || dataPlanes?.data || []);
        setPlanes(lista);
      }
    } catch (error) {
      console.error('Error de red:', error);
      setMensajeError(`Error de red o conexión: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 👈 Cargar reporte de pagos del día
  const abrirReporteCaja = async () => {
    setModalReporteAbierto(true);
    setCargandoReporte(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/pagos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const listaPagos = Array.isArray(data) ? data : (data.pagos || data.data || []);
        
        // Filtrar solo los pagos realizados el día de hoy (hora local o formato fecha YYYY-MM-DD)
        const hoyStr = new Date().toISOString().split('T')[0];
        const delDia = listaPagos.filter(p => {
          const fechaPago = (p.createdAt || p.fecha || '').split('T')[0];
          return fechaPago === hoyStr;
        });

        setPagosDelDia(delDia);
      } else {
        setPagosDelDia([]);
      }
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setPagosDelDia([]);
    } finally {
      setCargandoReporte(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  const enviarWhatsApp = (socio) => {
    if (!socio.telefono) {
      alert('Este socio no tiene un teléfono registrado.');
      return;
    }

    let numLimpio = socio.telefono.replace(/\D/g, '');
    if (!numLimpio.startsWith('549') && numLimpio.length === 10) {
      numLimpio = `549${numLimpio}`;
    }

    const nombrePlan = socio.plan?.nombre || 'su plan';
    const mensaje = `Hola ${socio.nombre}! 👋 Te escribimos desde el gimnasio para recordarte que tu cuota del plan *${nombrePlan}* está próxima a vencer. ¡Te esperamos para renovar! 💪`;

    window.open(`https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const handleCrearSocio = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!nuevoSocio.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoSocio)
      });

      const data = await response.json();

      if (response.ok) {
        setModalAbierto(false);
        setNuevoSocio({ nombre: '', dni: '', telefono: '', planId: '' });
        cargarDatos();
      } else {
        alert(`Error al registrar socio: ${data.error || data.detalle || 'Intente nuevamente'}`);
      }
    } catch (error) {
      alert('Error de conexión al intentar guardar.');
    }
  };

  const handleCrearPlan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!nuevoPlan.nombre.trim() || !nuevoPlan.precio) {
      alert('Completá el nombre y el precio del plan');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/planes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nuevoPlan.nombre.trim(),
          precio: Number(nuevoPlan.precio)
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setNuevoPlan({ nombre: '', precio: '' });
        await cargarDatos();
      } else {
        alert(`Error al crear plan (${response.status}): ${data.error || data.detalle || 'Error en el servidor'}`);
      }
    } catch (error) {
      console.error('Error de red al crear plan:', error);
      alert(`Error de conexión al crear plan: ${error.message}`);
    }
  };

  const handleEliminarPlan = async (planId) => {
    if (!window.confirm('¿Seguro que querés eliminar este plan?')) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/planes/${planId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        cargarDatos();
      } else {
        alert('No se pudo eliminar el plan.');
      }
    } catch (error) {
      alert('Error de red al eliminar el plan.');
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
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/socios/${socioEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(socioEditar)
      });

      if (response.ok) {
        setModalEditarAbierto(false);
        setSocioEditar(null);
        await cargarDatos();
      } else {
        alert('Error al actualizar socio');
      }
    } catch (error) {
      alert(`Error de conexión: ${error.message}`);
    }
  };

  const handleEliminarSocio = async (socio) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar a ${socio.nombre}?`)) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/socios/${socio.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        cargarDatos();
      } else {
        alert('No se pudo eliminar el socio.');
      }
    } catch (error) {
      alert('Error de red al eliminar.');
    }
  };

  const obtenerIniciales = (nombre) => {
    if (!nombre) return '??';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0].slice(0, 2).toUpperCase();
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

  // Totales calculados para el reporte diario
  const totalEfectivo = pagosDelDia
    .filter(p => (p.metodoPago || p.metodo || '').toLowerCase().includes('efectivo'))
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);

  const totalTransferencia = pagosDelDia
    .filter(p => (p.metodoPago || p.metodo || '').toLowerCase().includes('transferencia'))
    .reduce((acc, p) => acc + Number(p.monto || 0), 0);

  const recaudacionTotalDia = totalEfectivo + totalTransferencia;

  return (
    <div className="min-h-screen bg-[#0E1012] text-white p-4 md:p-8 font-sans selection:bg-[#C6FF3D] selection:text-black">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="bg-[#C6FF3D] p-3 rounded-2xl text-black font-black shadow-[0_0_20px_rgba(198,255,61,0.25)] flex items-center justify-center">
            🏋️
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              SISTEMA DE SOCIOS
            </h1>
            <p className="text-xs text-zinc-400 font-medium">Pagos, planes y vencimientos · guardado automático</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-end">
          {/* BOTÓN NUEVO SOCIO */}
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-black px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(198,255,61,0.2)] active:scale-95 text-sm"
          >
            + Nuevo socio
          </button>

          {/* BOTÓN REPORTE / CAJA */}
          <button
            onClick={abrirReporteCaja}
            className="bg-[#181B1E] hover:bg-zinc-800 text-[#C6FF3D] border border-[#C6FF3D]/30 font-bold px-3.5 py-2.5 rounded-xl transition-all active:scale-95 text-sm flex items-center gap-1.5"
          >
            📊 Caja / Reporte
          </button>

          {/* BOTÓN GESTIONAR PLANES */}
          <button
            onClick={() => setModalPlanesAbierto(true)}
            className="bg-[#181B1E] hover:bg-zinc-800 text-zinc-200 font-semibold px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-all active:scale-95 text-sm flex items-center gap-1.5"
          >
            ⚙️ Planes
          </button>

          <button
            onClick={handleLogout}
            className="bg-[#181B1E] hover:bg-zinc-800 text-zinc-300 font-medium px-4 py-2.5 rounded-xl border border-zinc-800 transition-all active:scale-95 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* BANNER DE ERROR */}
      {mensajeError && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-950/30 border border-red-800/50 text-red-300 text-xs p-3.5 rounded-2xl flex items-center justify-between gap-4 backdrop-blur-md">
          <span>⚠️ <strong>Detalle del error:</strong> {mensajeError}</span>
          <button onClick={cargarDatos} className="underline font-bold hover:text-white shrink-0">Reintentar</button>
        </div>
      )}

      {/* METRICAS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-[#16191C] border border-zinc-800/80 p-4 rounded-2xl hover:border-zinc-700 transition-all shadow-lg">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Socios Activos</p>
          <p className="text-2xl font-black text-white mt-1">{totalActivos}</p>
        </div>
        <div className="bg-[#16191C] border border-zinc-800/80 p-4 rounded-2xl hover:border-[#C6FF3D]/40 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(198,255,61,0.08)]">
          <p className="text-[10px] text-[#C6FF3D] font-bold uppercase tracking-wider">Al Día</p>
          <p className="text-2xl font-black text-[#C6FF3D] mt-1">{totalActivos}</p>
        </div>
        <div className="bg-[#16191C] border border-zinc-800/80 p-4 rounded-2xl hover:border-amber-400/40 transition-all shadow-lg">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Por Vencer</p>
          <p className="text-2xl font-black text-amber-400 mt-1">0</p>
        </div>
        <div className="bg-[#16191C] border border-zinc-800/80 p-4 rounded-2xl hover:border-red-500/40 transition-all shadow-lg">
          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Vencidos</p>
          <p className="text-2xl font-black text-red-500 mt-1">{totalVencidos}</p>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, DNI o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-[#16191C] border border-zinc-800/80 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C6FF3D] transition-all"
          />
        </div>

        <div className="flex bg-[#16191C] border border-zinc-800/80 p-1 rounded-2xl text-xs font-semibold">
          {['Todos', 'Al día', 'Vencidos'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
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

      {/* TABLA DE SOCIOS */}
      <div className="max-w-7xl mx-auto bg-[#16191C] border border-zinc-800/80 rounded-2xl p-4 min-h-[300px] shadow-2xl">
        {cargando ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Cargando socios...
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-sm gap-2">
            <span className="text-3xl">🔍</span>
            <p>No se encontraron socios registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80">
                <tr>
                  <th className="pb-3 px-3">Nombre</th>
                  <th className="pb-3 px-3">DNI</th>
                  <th className="pb-3 px-3">Teléfono</th>
                  <th className="pb-3 px-3">Estado</th>
                  <th className="pb-3 px-3">Plan</th>
                  <th className="pb-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {sociosFiltrados.map((socio) => (
                  <tr key={socio.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-xs font-black text-[#C6FF3D] shrink-0">
                        {obtenerIniciales(socio.nombre)}
                      </div>
                      <span>{socio.nombre}</span>
                    </td>
                    <td className="py-3.5 px-3 text-zinc-400 font-mono text-xs">{socio.dni || socio.documento || '-'}</td>
                    <td className="py-3.5 px-3 text-zinc-400 font-mono text-xs">{socio.telefono || '-'}</td>
                    <td className="py-3.5 px-3">
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
                    <td className="py-3.5 px-3 text-zinc-300 font-medium">
                      {socio.plan?.nombre || 'Sin plan'}
                      {socio.plan?.precio && <span className="text-zinc-500 text-xs block font-mono">${socio.plan.precio}</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSocioCobrar(socio)}
                        className="px-3 py-1.5 rounded-xl bg-[#C6FF3D] hover:bg-[#b0f024] text-black text-xs font-black transition-all shadow-[0_0_12px_rgba(198,255,61,0.25)] flex items-center gap-1 active:scale-95"
                        title="Registrar Cobro"
                      >
                        💳 Cobrar
                      </button>
                      <button
                        onClick={() => enviarWhatsApp(socio)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95"
                        title="Avisar por WhatsApp"
                      >
                        💬 Avisar
                      </button>
                      <button
                        onClick={() => abrirEditar(socio)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all active:scale-95"
                        title="Editar Socio"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminarSocio(socio)}
                        className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all active:scale-95"
                        title="Eliminar Socio"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL REPORTE / CAJA DIARIA */}
      {modalReporteAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191C] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                📊 Reporte y Caja del Día
              </h3>
              <button
                onClick={() => setModalReporteAbierto(false)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {cargandoReporte ? (
              <div className="text-center py-10 text-zinc-400 text-sm">Calculando caja diaria...</div>
            ) : (
              <div className="space-y-4">
                {/* Tarjetas resumen */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0E1012] p-3 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Efectivo</p>
                    <p className="text-lg font-black text-[#C6FF3D] mt-1">${totalEfectivo}</p>
                  </div>
                  <div className="bg-[#0E1012] p-3 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Transferencia</p>
                    <p className="text-lg font-black text-blue-400 mt-1">${totalTransferencia}</p>
                  </div>
                  <div className="bg-[#0E1012] p-3 rounded-xl border border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Total Recaudado</p>
                    <p className="text-lg font-black text-white mt-1">${recaudacionTotalDia}</p>
                  </div>
                </div>

                {/* Lista de cobros de hoy */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 uppercase">Cobros registrados hoy ({pagosDelDia.length})</p>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {pagosDelDia.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic text-center py-6">No hay cobros registrados en el día de hoy.</p>
                    ) : (
                      pagosDelDia.map((p, idx) => (
                        <div key={p.id || idx} className="flex justify-between items-center bg-[#0E1012] px-3.5 py-2.5 rounded-xl border border-zinc-800/60 text-xs">
                          <div>
                            <span className="font-bold text-white block">{p.socio?.nombre || p.nombreSocio || 'Socio'}</span>
                            <span className="text-zinc-400 text-[11px] uppercase">Método: {p.metodoPago || p.metodo || 'Efectivo'}</span>
                          </div>
                          <span className="text-[#C6FF3D] font-mono font-bold text-sm">+${p.monto}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL GESTIONAR PLANES */}
      {modalPlanesAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191C] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                ⚙️ Planes Configurados
              </h3>
              <button
                onClick={() => setModalPlanesAbierto(false)}
                className="text-zinc-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearPlan} className="bg-[#0E1012] p-4 rounded-xl border border-zinc-800/80 space-y-3">
              <p className="text-xs font-bold text-zinc-300 uppercase">Crear Nuevo Plan</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre (ej. Pase Libre)"
                  value={nuevoPlan.nombre}
                  onChange={(e) => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })}
                  className="bg-[#16191C] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF3D]"
                  required
                />
                <input
                  type="number"
                  placeholder="Precio ($)"
                  value={nuevoPlan.precio}
                  onChange={(e) => setNuevoPlan({ ...nuevoPlan, precio: e.target.value })}
                  className="bg-[#16191C] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF3D]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold py-2 rounded-xl text-xs transition-all"
              >
                + Agregar Plan
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-zinc-400 uppercase">Mis Planes Actuales</p>
              {planes.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No tenés planes creados todavía.</p>
              ) : (
                planes.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-[#0E1012] px-3.5 py-2.5 rounded-xl border border-zinc-800/60 text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.nombre}</span>
                      <span className="text-[#C6FF3D] font-mono">${p.precio}</span>
                    </div>
                    <button
                      onClick={() => handleEliminarPlan(p.id)}
                      className="text-zinc-500 hover:text-red-400 p-1"
                      title="Eliminar Plan"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRAR */}
      {socioCobrar && (
        <ModalCobro
          socio={socioCobrar}
          onClose={() => setSocioCobrar(null)}
          onSuccess={cargarDatos}
        />
      )}

      {/* MODAL CREAR SOCIO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191C] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white uppercase">Registrar Nuevo Socio</h3>
            
            <form onSubmit={handleCrearSocio} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nuevoSocio.nombre}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">DNI</label>
                <input
                  type="text"
                  value={nuevoSocio.dni}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, dni: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 40123456"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoSocio.telefono}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 2914796038"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                <select
                  value={nuevoSocio.planId}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, planId: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#C6FF3D] font-medium focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white">
                      {plan.nombre} {plan.precio ? `- $${plan.precio}` : ''}
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

      {/* MODAL EDITAR SOCIO */}
      {modalEditarAbierto && socioEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#16191C] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white uppercase">Editar Socio</h3>
            
            <form onSubmit={handleGuardarEdicion} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={socioEditar.nombre}
                  onChange={(e) => setSocioEditar({ ...socioEditar, nombre: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">DNI</label>
                <input
                  type="text"
                  value={socioEditar.dni}
                  onChange={(e) => setSocioEditar({ ...socioEditar, dni: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={socioEditar.telefono}
                  onChange={(e) => setSocioEditar({ ...socioEditar, telefono: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                <select
                  value={socioEditar.planId}
                  onChange={(e) => setSocioEditar({ ...socioEditar, planId: e.target.value })}
                  className="w-full bg-[#0E1012] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#C6FF3D] font-medium focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white">
                      {plan.nombre} {plan.precio ? `- $${plan.precio}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2 rounded-xl text-sm hover:bg-zinc-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#C6FF3D] text-black font-bold py-2 rounded-xl text-sm hover:bg-[#b0f024] transition-all"
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