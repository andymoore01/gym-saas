import './style.css';
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Dumbbell,
  AlertTriangle,
  Trash2,
  X,
  CreditCard,
  CheckCircle,
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');`;
// La URL base del backend en Render
const API_URL = 'https://gym-saas-backend-vwm9.onrender.com';

const PLAN_INFO = {
  "3dias": { label: "3 días", defaultFee: 12000 },
  libre: { label: "Libre", defaultFee: 18000 },
};

function daysAhead(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function GymMembershipSystem() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Estados para el Modal de Cobro
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingMember, setPayingMember] = useState(null);
  const [paymentData, setPaymentData] = useState({
    metodoPago: "EFECTIVO",
    monto: 18000,
    meses: 1,
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    plan: "libre",
    customFee: 18000,
    notes: "",
  });

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.warn("No hay sesión activa");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/socios`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Error en la conexión con la API");
      const data = await response.json();

      const formattedData = data.map(m => ({
        id: m.id,
        name: m.nombre || m.name || "",
        dni: m.dni || "-",
        phone: m.telefono || m.phone || "",
        plan: m.plan || "libre",
        customFee: m.monto || m.customFee || m.plan?.precio || 18000,
        lastPaymentDate: m.updatedAt ? new Date(m.updatedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dueDate: m.vencimiento ? new Date(m.vencimiento).toISOString().split("T")[0] : daysAhead(30),
        notes: m.notas || m.notes || ""
      }));

      setMembers(formattedData);
      setSaveError(false);
    } catch (e) {
      console.error("Error al conectar con la API:", e);
      setSaveError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const getStatus = (dueDate) => {
    if (!dueDate) return "expired";
    const today = new Date().toISOString().split("T")[0];
    if (dueDate < today) return "expired";
    const limit = daysAhead(5);
    if (dueDate <= limit) return "due_soon";
    return "active";
  };

  const handleSendWhatsApp = (member) => {
    if (!member.phone) {
      alert("Este socio no tiene un número de teléfono registrado.");
      return;
    }

    let cleanPhone = member.phone.replace(/\D/g, "");

    if (!cleanPhone.startsWith("54")) {
      cleanPhone = `549${cleanPhone}`;
    }

    const message = `Hola ${member.name}! Te escribimos del gimnasio para recordarte que tu cuota vence el ${member.dueDate}. ¡Te esperamos para entrenar! 💪`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  // Abrir Modal de Cobro
  const handleOpenPaymentModal = (member) => {
    setPayingMember(member);
    setPaymentData({
      metodoPago: "EFECTIVO",
      monto: member.customFee || 18000,
      meses: 1,
    });
    setIsPaymentModalOpen(true);
  };

  // Procesar Registro de Pago
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!payingMember) return;

    setProcessingPayment(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          socioId: payingMember.id,
          metodoPago: paymentData.metodoPago,
          monto: Number(paymentData.monto),
          meses: Number(paymentData.meses),
        }),
      });

      if (!res.ok) throw new Error("Error al registrar el pago");

      await fetchMembers();
      setIsPaymentModalOpen(false);
      setPayingMember(null);
      alert("¡Pago registrado y cuota renovada con éxito!");
    } catch (error) {
      console.error("Error al registrar el pago:", error);
      alert("No se pudo registrar el pago. Verificá la conexión con la API.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || "").includes(search) ||
        (m.dni || "").includes(search);
      const status = getStatus(m.dueDate);

      if (filter === "active") return matchesSearch && status === "active";
      if (filter === "due_soon") return matchesSearch && status === "due_soon";
      if (filter === "expired") return matchesSearch && status === "expired";
      return matchesSearch;
    });
  }, [members, search, filter]);

  const stats = useMemo(() => {
    const total = members.length;
    let active = 0;
    let dueSoon = 0;
    let expired = 0;

    members.forEach((m) => {
      const st = getStatus(m.dueDate);
      if (st === "active") active++;
      if (st === "due_soon") dueSoon++;
      if (st === "expired") expired++;
    });

    return { total, active, dueSoon, expired };
  }, [members]);

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: "",
      phone: "",
      plan: "libre",
      customFee: 18000,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const dueDate = daysAhead(30);

    const newMemberPayload = {
      nombre: formData.name,
      telefono: formData.phone,
      plan: formData.plan,
      monto: Number(formData.customFee),
      notas: formData.notes,
      fecha_vencimiento: dueDate,
    };

    try {
      let res;
      if (editingMember) {
        res = await fetch(`${API_URL}/socios/${editingMember.id}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(newMemberPayload),
        });
      } else {
        res = await fetch(`${API_URL}/socios`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(newMemberPayload),
        });
      }

      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      await fetchMembers();
      setIsModalOpen(false);
      setSaveError(false);
    } catch (error) {
      console.error("Error al guardar en la base de datos:", error);
      alert("No se pudo guardar en la base de datos.");
      setSaveError(true);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este socio de la base de datos?")) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/socios/${id}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Error al eliminar");
      
      await fetchMembers();
      setSaveError(false);
    } catch (e) {
      console.error("Error al eliminar socio:", e);
      alert("Error al intentar eliminar el socio.");
      setSaveError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#111315] text-white font-['Inter'] p-4 md:p-8">
      <style>{FONT_IMPORT}</style>

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#C6FF3D] p-2.5 rounded-xl text-black">
            <Dumbbell className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-[800] tracking-tight font-['Archivo_Black'] uppercase">
              SISTEMA DE SOCIOS
            </h1>
            <p className="text-xs text-zinc-400">
              Pagos, planes y vencimientos · guardado automático
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Nuevo socio
        </button>
      </header>

      {saveError && (
        <div className="max-w-6xl mx-auto mb-6 bg-red-950/40 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Servidor desconectado o error en la API. Los cambios no se guardarán permanentemente.</span>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            SOCIOS ACTIVOS
          </span>
          <span className="text-2xl md:text-3xl font-[800] text-white font-['Archivo_Black']">
            {stats.total}
          </span>
        </div>

        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            AL DÍA
          </span>
          <span className="text-2xl md:text-3xl font-[800] text-[#C6FF3D] font-['Archivo_Black']">
            {stats.active}
          </span>
        </div>

        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            POR VENCER
          </span>
          <span className="text-2xl md:text-3xl font-[800] text-amber-400 font-['Archivo_Black']">
            {stats.dueSoon}
          </span>
        </div>

        <div className="bg-[#181B1E] border border-zinc-800 p-4 rounded-2xl">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            VENCIDOS
          </span>
          <span className="text-2xl md:text-3xl font-[800] text-red-500 font-['Archivo_Black']">
            {stats.expired}
          </span>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181B1E] border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#C6FF3D]"
          />
        </div>

        <div className="flex gap-1.5 bg-[#181B1E] p-1 border border-zinc-800 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: "all", label: "Todos" },
            { id: "active", label: "Al día" },
            { id: "due_soon", label: "Por vencer" },
            { id: "expired", label: "Vencidos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? "bg-[#22262B] text-[#C6FF3D]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Socios */}
      <div className="max-w-6xl mx-auto bg-[#181B1E] border border-zinc-800 rounded-2xl overflow-hidden p-4">
        {/* Encabezado de la Tabla */}
        <div className="grid grid-cols-12 text-xs font-bold text-zinc-400 uppercase tracking-wider pb-3 border-b border-zinc-800/80 px-2">
          <div className="col-span-3">NOMBRE</div>
          <div className="col-span-2">DNI</div>
          <div className="col-span-2">TELÉFONO</div>
          <div className="col-span-2">ESTADO</div>
          <div className="col-span-1">PLAN</div>
          <div className="col-span-2 text-right">ACCIONES</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-zinc-800/50">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No se encontraron socios registrados.
            </div>
          ) : (
            filteredMembers.map((m) => {
              const planName = typeof m.plan === 'object' ? m.plan?.nombre : m.plan;
              const displayPlan = PLAN_INFO[planName]?.label || planName || 'Plan Libre';

              const status = getStatus(m.dueDate);
              const nombreSocio = m.name || 'Socio sin nombre';
              const dniSocio = m.dni || '-';
              const telefono = m.phone || '-';

              return (
                <div
                  key={m.id}
                  className="grid grid-cols-12 items-center py-3.5 px-2 text-sm hover:bg-zinc-800/30 transition-all"
                >
                  <div className="col-span-3 font-semibold text-white">{nombreSocio}</div>
                  <div className="col-span-2 text-zinc-400">{dniSocio}</div>
                  <div className="col-span-2 text-zinc-400">{telefono}</div>
                  
                  <div className="col-span-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        status === "active"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                          : status === "due_soon"
                          ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                          : "bg-red-950 text-red-400 border border-red-800/50"
                      }`}
                    >
                      {status === "active" ? "ACTIVO" : status === "due_soon" ? "POR VENCER" : "VENCIDO"}
                    </span>
                  </div>

                  <div className="col-span-1 text-zinc-400 text-xs">{displayPlan}</div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {/* BOTÓN COBRAR */}
                    <button
                      onClick={() => handleOpenPaymentModal(m)}
                      className="bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                      title="Registrar pago"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Cobrar
                    </button>

                    {/* BOTÓN WHATSAPP */}
                    <button
                      onClick={() => handleSendWhatsApp(m)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all"
                      title="Enviar recordatorio"
                    >
                      💬 Avisar
                    </button>

                    {/* BOTÓN ELIMINAR */}
                    <button
                      onClick={() => handleDeleteMember(m.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all"
                      title="Eliminar socio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Nuevo Socio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-[Archivo_Black] text-white mb-4">
              NUEVO SOCIO
            </h2>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nombre completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan: e.target.value,
                        customFee: PLAN_INFO[e.target.value]?.defaultFee || 18000,
                      })
                    }
                    className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  >
                    <option value="libre">Libre</option>
                    <option value="3dias">3 Días</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={formData.customFee}
                    onChange={(e) => setFormData({ ...formData, customFee: e.target.value })}
                    className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Notas</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold py-2.5 rounded-xl transition-all text-sm mt-2"
              >
                Guardar Socio en Base de Datos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cobro Rápido */}
      {isPaymentModalOpen && payingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold font-[Archivo_Black] text-white mb-1">
              REGISTRAR PAGO
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Socio: <span className="text-white font-semibold">{payingMember.name}</span>
            </p>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Método de Pago</label>
                <select
                  value={paymentData.metodoPago}
                  onChange={(e) => setPaymentData({ ...paymentData, metodoPago: e.target.value })}
                  className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="TARJETA">Tarjeta</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={paymentData.monto}
                    onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                    className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Meses a Renovar</label>
                  <input
                    type="number"
                    min="1"
                    value={paymentData.meses}
                    onChange={(e) => setPaymentData({ ...paymentData, meses: e.target.value })}
                    className="w-full bg-[#111315] border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C6FF3D]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processingPayment}
                className="w-full bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-bold py-2.5 rounded-xl transition-all text-sm mt-2 flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  "Procesando..."
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirmar y Renovar Cuota
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}