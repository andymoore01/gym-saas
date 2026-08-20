import React from 'react';

export function ResumenCaja({ datosCaja }) {
  const { totalRecaudado = 0, totalEfectivo = 0, totalTransferencia = 0, cantidadCobros = 0 } = datosCaja || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-[#181B1E] border border-gray-800 rounded-2xl p-5">
        <span className="text-xs text-gray-400 uppercase font-semibold">Total Recaudado</span>
        <div className="text-3xl font-extrabold text-[#C6FF3D] mt-1">
          ${totalRecaudado.toLocaleString('es-AR')}
        </div>
        <span className="text-xs text-gray-500 mt-2 block">{cantidadCobros} cobros realizados</span>
      </div>

      <div className="bg-[#181B1E] border border-gray-800 rounded-2xl p-5">
        <span className="text-xs text-gray-400 uppercase font-semibold">Ingresos en Efectivo</span>
        <div className="text-3xl font-extrabold text-white mt-1">
          ${totalEfectivo.toLocaleString('es-AR')}
        </div>
        <span className="text-xs text-emerald-400 mt-2 block">💵 Caja física</span>
      </div>

      <div className="bg-[#181B1E] border border-gray-800 rounded-2xl p-5">
        <span className="text-xs text-gray-400 uppercase font-semibold">Transferencias</span>
        <div className="text-3xl font-extrabold text-white mt-1">
          ${totalTransferencia.toLocaleString('es-AR')}
        </div>
        <span className="text-[#C6FF3D] text-xs mt-2 block">📱 Bancos / MP</span>
      </div>
    </div>
  );
}