import React, { useState } from 'react';

const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api';

export function ModalCobro({ socio, onClose, onSuccess }) {
  const [monto, setMonto] = useState(socio.monto || socio.plan?.precio || 18000);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [loading, setLoading] = useState(false);

  const handleCobrar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/pagos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          socioId: socio.id,
          monto: Number(monto),
          metodoPago: metodoPago.toUpperCase(),
          meses: 1
        }),
      });

      if (res.ok) {
        alert('¡Pago registrado con éxito!');
        onSuccess();
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Error al registrar el pago: ${err.error || 'Intente nuevamente'}`);
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
      <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl">
        <h3 className="text-xl font-bold mb-1">Registrar Pago</h3>
        <p className="text-sm text-zinc-400 mb-6">
          Socio: <span className="text-white font-medium">{socio.nombre}</span>
        </p>

        <form onSubmit={handleCobrar} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 uppercase font-semibold mb-2">
              Monto a cobrar ($)
            </label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-[#111315] border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#C6FF3D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 uppercase font-semibold mb-2">
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  metodoPago === 'EFECTIVO'
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-[#C6FF3D]'
                    : 'bg-[#111315] border-zinc-800 text-zinc-400'
                }`}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                  metodoPago === 'TRANSFERENCIA'
                    ? 'bg-[#C6FF3D]/10 border-[#C6FF3D] text-[#C6FF3D]'
                    : 'bg-[#111315] border-zinc-800 text-zinc-400'
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
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}