import React, { useState, useEffect } from 'react';
import { ModalCobro } from './ModalCobro';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export default function PantallaRecepcion() {
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
  const [modalReportesAbierto, setModalReportesAbierto] = useState(false);
  const [socioCobrar, setSocioCobrar] = useState(null);

  // Formularios
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', dni: '', telefono: '', planId: '' });
  const [socioEditar, setSocioEditar] = useState(null);
  const [nuevoPlan, setNuevoPlan] = useState({ nombre: '', precio: '' });

  // Reportes
  const [datosReporte, setDatosReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  // Cargar lista de socios y planes desde el backend
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
        let lista = [];
        if (Array.isArray(dataPlanes)) {
          lista = dataPlanes;
        } else if (dataPlanes && Array.isArray(dataPlanes.planes)) {
          lista = dataPlanes.planes;
        } else if (dataPlanes && Array.isArray(dataPlanes.data)) {
          lista = dataPlanes.data;
        }
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Función para cargar métricas de caja
  const cargarReporteIngresos = async () => {
    setCargandoReporte(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/reportes/ingresos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDatosReporte(data);
      }
    } catch (err) {
      console.error("Error al obtener reportes:", err);
    } finally {
      setCargandoReporte(false);
    }
  };

  const abrirReportes = () => {
    setModalReportesAbierto(true);
    cargarReporteIngresos();
  };

  // Crear plan
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
      alert(`Error de conexión al crear plan: ${error.message}`);
    }
  };

  // Eliminar plan
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

    const url = `https://wa.me/${numLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Crear un nuevo socio
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
      console.error('Error al enviar el formulario:', error);
      alert('Error de conexión al intentar guardar.');
    }
  };

  // Abrir modal de edicion
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

  // Guardar edición de socio
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!socioEditar || !socioEditar.id) {
      alert('Error: No se encontró el ID del socio a editar');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/socios/${socioEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: socioEditar.nombre,
          dni: socioEditar.dni,
          telefono: socioEditar.telefono,
          planId: socioEditar.planId
        })
      });

      if (response.ok) {
        setSocios((prevSocios) =>
          prevSocios.map((s) =>
            s.id === socioEditar.id
              ? {
                  ...s,
                  nombre: socioEditar.nombre,
                  dni: socioEditar.dni,
                  telefono: socioEditar.telefono,
                  planId: socioEditar.planId
                }
              : s
          )
        );
        setModalEditarAbierto(false);
        setSocioEditar(null);
        await cargarDatos();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Error al actualizar socio (${response.status}): ${err.error || err.detalle || 'No se pudo guardar'}`);
      }
    } catch (error) {
      console.error('Error al editar:', error);
      alert(`Error de conexión al actualizar: ${error.message}`);
    }
  };

  // Eliminar socio
  const handleEliminarSocio = async (socio) => {
    const confirmar = window.confirm(`¿Estás seguro de que querés eliminar a ${socio.nombre}?`);
    if (!confirmar) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/socios/${socio.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        cargarDatos();
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Error al eliminar: ${err.error || 'No se pudo eliminar el socio'}`);
      }
    } catch (error) {
      console.error('Error al borrar:', error);
      alert('Error de red al intentar eliminar.');
    }
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

  const listaSeguraPlanes = Array.isArray(planes) ? planes : [];

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

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setModalAbierto(true)}
            className="flex-1 md:flex-initial bg-[#C6FF3D] text-black font-bold px-4 py-2.5 rounded-xl hover:bg-[#b0f024] transition-all text-sm"
          >
            + Nuevo socio
          </button>
          
          <button
            onClick={() => setModalPlanesAbierto(true)}
            className="bg-[#181B1E] hover:bg-zinc-800 text-zinc-200 font-semibold px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-all text-sm flex items-center gap-1.5"
          >
            ⚙️ Planes
          </button>

          <button
            onClick={abrirReportes}
            className="bg-[#181B1E] hover:bg-zinc-800 text-zinc-200 font-semibold px-3.5 py-2.5 rounded-xl border border-zinc-800 transition-all text-sm flex items-center gap-1.5"
          >
            📊 Reportes
          </button>

          <button
            onClick={handleLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* BANNER DE ERROR */}
      {mensajeError && (
        <div className="max-w-7xl mx-auto mb-6 bg-red-950/40 border border-red-800 text-red-300 text-xs p-3.5 rounded-xl flex items-center justify-between gap-4">
          <span>⚠️ <strong>Detalle del error:</strong> {mensajeError}</span>
          <button 
            onClick={cargarDatos}
            className="underline font-bold hover:text-white shrink-0"
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
            placeholder="Buscar por nombre, DNI o teléfono..."
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

      {/* TABLA DE SOCIOS */}
      <div className="max-w-7xl mx-auto bg-[#181B1E] border border-zinc-800 rounded-2xl p-4 min-h-[300px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            Cargando socios...
          </div>
        ) : sociosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-500 text-sm">
            No se encontraron socios registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="pb-3 px-2">Nombre</th>
                  <th className="pb-3 px-2">DNI</th>
                  <th className="pb-3 px-2">Teléfono</th>
                  <th className="pb-3 px-2">Estado</th>
                  <th className="pb-3 px-2">Plan</th>
                  <th className="pb-3 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sociosFiltrados.map((socio) => (
                  <tr key={socio.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-2 font-medium text-white">{socio.nombre}</td>
                    <td className="py-3 px-2 text-zinc-400">{socio.dni || socio.documento || '-'}</td>
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
                    <td className="py-3 px-2 text-zinc-400">
                      {socio.plan?.nombre || 'Sin plan'}
                      {socio.plan?.precio && <span className="text-zinc-500 text-xs block font-mono">${socio.plan.precio}</span>}
                    </td>
                    <td className="py-3 px-2 text-center flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSocioCobrar(socio)}
                        className="px-2.5 py-1 rounded-lg bg-[#C6FF3D] hover:bg-[#b0f024] text-black text-xs font-bold transition-all flex items-center gap-1"
                        title="Registrar Cobro"
                      >
                        💳 Cobrar
                      </button>

                      <button
                        onClick={() => enviarWhatsApp(socio)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all"
                        title="Avisar por WhatsApp"
                      >
                        💬 Avisar
                      </button>
                      <button
                        onClick={() => abrirEditar(socio)}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all"
                        title="Editar Socio"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleEliminarSocio(socio)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all"
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

      {/* MODAL COBRAR */}
      {socioCobrar && (
        <ModalCobro
          socio={socioCobrar}
          onClose={() => setSocioCobrar(null)}
          onSuccess={cargarDatos}
        />
      )}

      {/* MODAL PLANES */}
      {modalPlanesAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                ⚙️ Planes Configurados
              </h3>
              <button onClick={() => setModalPlanesAbierto(false)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCrearPlan} className="bg-[#111315] p-4 rounded-xl border border-zinc-800/80 space-y-3">
              <p className="text-xs font-bold text-zinc-300 uppercase">Crear Nuevo Plan</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre (ej. Pase Libre)"
                  value={nuevoPlan.nombre}
                  onChange={(e) => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })}
                  className="bg-[#181B1E] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF3D]"
                  required
                />
                <input
                  type="number"
                  placeholder="Precio ($)"
                  value={nuevoPlan.precio}
                  onChange={(e) => setNuevoPlan({ ...nuevoPlan, precio: e.target.value })}
                  className="bg-[#181B1E] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF3D]"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold py-2 rounded-xl text-xs transition-all">
                + Agregar Plan
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-zinc-400 uppercase">Mis Planes Actuales</p>
              {listaSeguraPlanes.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No tenés planes creados todavía.</p>
              ) : (
                listaSeguraPlanes.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-[#111315] px-3.5 py-2.5 rounded-xl border border-zinc-800/60 text-xs">
                    <div>
                      <span className="font-bold text-white block">{p.nombre}</span>
                      <span className="text-[#C6FF3D] font-mono">${p.precio}</span>
                    </div>
                    <button onClick={() => handleEliminarPlan(p.id)} className="text-zinc-500 hover:text-red-400 p-1" title="Eliminar Plan">
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORTES */}
      {modalReportesAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-6 max-w-2xl w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white uppercase flex items-center gap-2">
                  📊 Balance e Ingresos del Mes
                </h3>
                <p className="text-xs text-zinc-400 font-medium capitalize">
                  {datosReporte?.mesActual || 'Mes en curso'}
                </p>
              </div>
              <button onClick={() => setModalReportesAbierto(false)} className="text-zinc-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {cargandoReporte ? (
              <div className="py-12 text-center text-zinc-500 text-sm">Calculando caja y totales...</div>
            ) : datosReporte ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#111315] border border-zinc-800 p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">Recaudado Total</span>
                    <p className="text-xl font-black text-[#C6FF3D] mt-1">${datosReporte.recaudacionTotal?.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="bg-[#111315] border border-zinc-800 p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">💵 Efectivo</span>
                    <p className="text-xl font-black text-white mt-1">${datosReporte.totalEfectivo?.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="bg-[#111315] border border-zinc-800 p-4 rounded-xl">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase block">📱 Transferencias</span>
                    <p className="text-xl font-black text-blue-400 mt-1">${datosReporte.totalTransferencia?.toLocaleString('es-AR')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Cobros del Mes ({datosReporte.cantidadCobros})</p>
                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-800/60 bg-[#111315] rounded-xl border border-zinc-800/80 px-3">
                    {!datosReporte.historialPagos || datosReporte.historialPagos.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-6 text-center">No hay cobros registrados este mes.</p>
                    ) : (
                      datosReporte.historialPagos.map((pago) => (
                        <div key={pago.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block">{pago.socio?.nombre || 'Socio'}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(pago.fechaPago).toLocaleDateString('es-AR')} · {pago.metodoPago}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-[#C6FF3D]">+${Number(pago.monto).toLocaleString('es-AR')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-400">No se pudieron obtener las métricas.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL CREAR SOCIO */}
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
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">DNI</label>
                <input
                  type="text"
                  value={nuevoSocio.dni}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, dni: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 40123456"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={nuevoSocio.telefono}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, telefono: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  placeholder="Ej. 2914796038"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                <select
                  value={nuevoSocio.planId}
                  onChange={(e) => setNuevoSocio({ ...nuevoSocio, planId: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#C6FF3D] font-medium focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {listaSeguraPlanes.map((plan) => {
                    const precio = plan.precio || plan.monto || plan.valor;
                    return (
                      <option key={plan.id} value={plan.id} className="text-white">
                        {plan.nombre} {precio ? `- $${precio}` : ''}
                      </option>
                    );
                  })}
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
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white uppercase">Editar Socio</h3>
            
            <form onSubmit={handleGuardarEdicion} className="space-y-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={socioEditar.nombre}
                  onChange={(e) => setSocioEditar({ ...socioEditar, nombre: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">DNI</label>
                <input
                  type="text"
                  value={socioEditar.dni}
                  onChange={(e) => setSocioEditar({ ...socioEditar, dni: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={socioEditar.telefono}
                  onChange={(e) => setSocioEditar({ ...socioEditar, telefono: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                <select
                  value={socioEditar.planId}
                  onChange={(e) => setSocioEditar({ ...socioEditar, planId: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-[#C6FF3D] font-medium focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="" className="text-white">Seleccionar plan...</option>
                  {listaSeguraPlanes.map((plan) => (
                    <option key={plan.id} value={plan.id} className="text-white">
                      {plan.nombre}
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