import './style.css';
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Dumbbell,
  AlertTriangle,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap');`;
const API_URL = 'https://gym-saas-backend-vwm9.onrender.com/api/socios';
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
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    plan: "libre",
    customFee: 18000,
    notes: "",
  });

const fetchMembers = async () => {
  try {
    // 1. Obtenemos el token guardado en la sesión
    const token = localStorage.getItem('token');

    // 2. Si no hay token, podemos redirigir al login (opcional)
    if (!token) {
      console.warn("No hay sesión activa");
      setLoading(false);
      return;
    }

    // 3. Hacemos el fetch mandando el token en los headers
    const response = await fetch(`${API_URL}/api/socios`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // <--- AQUÍ VA
      }
    });

    if (!response.ok) throw new Error("Error en la conexión con la API");
    const data = await response.json();

    const formattedData = data.map(m => ({
      id: m.id,
      name: m.nombre || m.name || "",
      phone: m.telefono || m.phone || "",
      plan: m.plan || "libre",
      customFee: m.monto || m.customFee || 18000,
      lastPaymentDate: m.fechaUltimoPago ? new Date(m.fechaUltimoPago).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      dueDate: m.fechaVencimiento ? new Date(m.fechaVencimiento).toISOString().split("T")[0] : daysAhead(30),
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

  // Dejar solo números
  let cleanPhone = member.phone.replace(/\D/g, "");

  // Si no tiene código de país, agregar el +54 9 de Argentina
  if (!cleanPhone.startsWith("54")) {
    cleanPhone = `549${cleanPhone}`;
  }

  const message = `Hola ${member.name}! Te escribimos del gimnasio para recordarte que tu cuota vence el ${member.dueDate}. ¡Te esperamos para entrenar! `;

  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
};

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.phone || "").includes(search);
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
  const token = localStorage.getItem('token'); // 1. Obtenemos el token
  const today = new Date().toISOString().split("T")[0];
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
      res = await fetch(`${API_URL}/${editingMember.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // 2. Enviamos el token
        },
        body: JSON.stringify(newMemberPayload),
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // 2. Enviamos el token
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
    alert("No se pudo guardar en la base de datos. Revisá la terminal de Node para ver el log exacto.");
    setSaveError(true);
  }
};

const handleDeleteMember = async (id) => {
  if (!window.confirm("¿Seguro que deseas eliminar este socio de la base de datos?")) return;

  const token = localStorage.getItem('token'); // 1. Obtenemos el token

  try {
    const res = await fetch(`${API_URL}/${id}`, { 
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}` // 2. Enviamos el token
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
            placeholder="Buscar por nombre o teléfono..."
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

 <div className="max-w-6xl mx-auto space-y-3">
  {filteredMembers.length === 0 ? (
    <div className="bg-[#181B1E] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500 text-sm">
      No se encontraron socios en la base de datos.
    </div>
  ) : (
    filteredMembers.map((m) => {
      // Extraemos el nombre del plan sea un Objeto (Prisma) o un String
      const planName = typeof m.plan === 'object' ? m.plan?.nombre : m.plan;
      const displayPlan = PLAN_INFO[planName]?.label || planName || 'Sin Plan';

      const status = getStatus(m.dueDate || m.fechaVencimiento);
      const nombreSocio = m.nombre || m.name || 'Socio sin nombre';
      const ultimoPago = m.lastPaymentDate || m.fechaUltimoPago || 'No registrado';
      const fechaVenc = m.dueDate || m.fechaVencimiento || '-';
      const cuota = m.customFee || m.monto || m.plan?.precio || 0;
      const telefono = m.phone || m.telefono;
      const notas = m.notes || m.notas;

      return (
        <div
          key={m.id}
          className="bg-[#181B1E] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base text-white">{nombreSocio}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  status === "active"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                    : status === "due_soon"
                    ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                    : "bg-red-950 text-red-400 border border-red-800/50"
                }`}
              >
                {status === "active" ? "Al día" : status === "due_soon" ? "Por vencer" : "Vencido"}
              </span>

              {/* AHORA ES UN RENDER SEGURO DE STRING */}
              <span className="text-xs text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-md">
                {displayPlan}
              </span>
            </div>

            <div className="text-xs text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>Último pago: {ultimoPago}</span>
              <span className={status === "expired" ? "text-red-400 font-semibold" : ""}>
                Vence: {fechaVenc}
              </span>
              <span>${Number(cuota).toLocaleString()}</span>
              {telefono && <span className="text-zinc-500">📞 {telefono}</span>}
            </div>
            {notas && <p className="text-xs text-zinc-500 italic pt-0.5">{notas}</p>}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => handleDeleteMember(m.id)}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 self-end sm:self-center">
  {/* NUEVO BOTÓN DE WHATSAPP */}
  <button
    onClick={() => handleSendWhatsApp(m)}
    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all"
    title="Enviar recordatorio"
  >
    💬 Avisar
  </button>

  {/* BOTÓN DE ELIMINAR QUE YA TENÍAS */}
  <button
    onClick={() => handleDeleteMember(m.id)}
    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-all"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</div>
          </div>
        </div>
      );
    })
  )}
</div>

      {/* Modal */}
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
    </div>
  );
}

export default GymMembershipSystem;