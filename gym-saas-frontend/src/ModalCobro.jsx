import React, { useState } from 'react';

export function ModalCobro({ socio, onClose, onSuccess }) {
  const [monto, setMonto] = useState(socio.monto || 18000);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loading, setLoading] = useState(false);

  const handleCobrar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/pagos/cobrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socio_id: socio.id,
          gimnasio_id: socio.gimnasio_id,
          monto: Number(monto),
          metodo_pago: metodoPago,
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Ocurrió un error al registrar el pago');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#181B1E] border border-gray-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
        <h3 className="text-xl font-bold mb-1">Registrar Pago</h3>
        <p className="text-sm text-gray-400 mb-6">Socio: <span className="text-white font-medium">{socio.name || socio.nombre}</span></p>

        <form onSubmit={handleCobrar} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">Monto a cobrar ($)</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-[#111315] border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#C6FF3D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase font-semibold mb-2">Método de pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('efectivo')}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  metodoPago === 'efectivo'
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-[#C6FF3D]'
                    : 'bg-[#111315] border-gray-800 text-gray-400'
                }`}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  metodoPago === 'transferencia'
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-[#C6FF3D]'
                    : 'bg-[#111315] border-gray-800 text-gray-400'
                }`}
              >
                📱 Transferencia
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#C6FF3D] hover:bg-[#b0e633] text-black font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}