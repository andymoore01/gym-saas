import React, { useState } from 'react';

export function PantallaRecepcion({ socios = [] }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultadoIngreso, setResultadoIngreso] = useState(null);

  // Filtrar socios por nombre o teléfono
  const sociosFiltrados = busqueda.trim() === '' ? [] : socios.filter((s) =>
    (s.name || s.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (s.phone || s.telefono || '').includes(busqueda)
  );

  const registrarIngreso = async (socio) => {
    const hoy = new Date().toISOString().split('T')[0];
    const estaAlDia = socio.dueDate >= hoy || socio.fecha_vencimiento >= hoy;

    // Simulación / Petición
    setResultadoIngreso({
      permitido: estaAlDia,
      nombre: socio.name || socio.nombre,
      vencimiento: socio.dueDate || socio.fecha_vencimiento,
      plan: socio.plan || 'Libre'
    });

    // Opcional: limpiar la alerta en 4 segundos
    setTimeout(() => {
      setResultadoIngreso(null);
      setBusqueda('');
    }, 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#181B1E] border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Pantalla de Recepción</h2>
        <p className="text-sm text-gray-400 mb-6">Buscá al socio por nombre o teléfono para marcar el ingreso.</p>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Escribí un nombre..."
          className="w-full bg-[#111315] border border-gray-700 rounded-xl px-5 py-4 text-white text-lg focus:outline-none focus:border-[#C6FF3D]"
          autoFocus
        />

        {/* Lista de coincidencias rápidas */}
        {sociosFiltrados.length > 0 && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
            {sociosFiltrados.map((socio) => (
              <div
                key={socio.id}
                onClick={() => registrarIngreso(socio)}
                className="bg-[#111315] hover:bg-gray-800 p-4 rounded-xl border border-gray-800 flex justify-between items-center cursor-pointer transition-all"
              >
                <div>
                  <p className="font-bold text-white">{socio.name || socio.nombre}</p>
                  <p className="text-xs text-gray-400">Plan: {socio.plan || 'Libre'}</p>
                </div>
                <button className="px-4 py-2 bg-[#C6FF3D] text-black font-bold text-sm rounded-lg">
                  Marcar Ingreso
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cartel Gigante de Estado */}
      {resultadoIngreso && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
            resultadoIngreso.permitido ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <div className="text-8xl mb-4">
            {resultadoIngreso.permitido ? '✅' : '⛔'}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white uppercase tracking-wider">
            {resultadoIngreso.permitido ? 'Acceso Permitido' : 'Cuota Vencida'}
          </h1>
          <p className="text-2xl text-white/90 font-medium mt-4">
            {resultadoIngreso.nombre}
          </p>
          <p className="text-lg text-white/80 mt-2">
            Vencimiento: {resultadoIngreso.vencimiento}
          </p>
          <button
            onClick={() => setResultadoIngreso(null)}
            className="mt-8 px-8 py-3 bg-white text-black font-extrabold rounded-xl shadow-lg hover:bg-gray-100 transition-all"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}