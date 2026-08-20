import React from 'react';

export default function LandingPage({ onGoToLogin }) {
  const numeroWhatsApp = "5492914796038"; // Reemplazá por tu número de contacto de ventas
  const mensajeWA = encodeURIComponent("¡Hola! Me interesa probar el Sistema de Gestión para mi gimnasio.");

  return (
    <div className="min-h-screen bg-[#0E1012] text-white font-sans selection:bg-[#C6FF3D] selection:text-black">
      
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-[#C6FF3D] p-2.5 rounded-2xl text-black font-black text-xl shadow-[0_0_20px_rgba(198,255,61,0.2)]">
            ⚡
          </div>
          <span className="font-black text-xl tracking-tight uppercase">GymControl</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onGoToLogin}
            className="text-sm font-semibold text-zinc-300 hover:text-white transition-all px-4 py-2 rounded-xl hover:bg-zinc-800/60"
          >
            Iniciar Sesión
          </button>
          <a
            href={`https://wa.me/${numeroWhatsApp}?text=${mensajeWA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-black text-sm px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(198,255,61,0.2)] active:scale-95"
          >
            Pedir Demo
          </a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#182813] border border-[#C6FF3D]/30 text-[#C6FF3D] text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#C6FF3D] animate-pulse" />
          Software de gestión simple para gimnasios
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
          Controlá las cuotas y cobros de tu gimnasio <br />
          <span className="text-[#C6FF3D]">sin planillas ni complicaciones.</span>
        </h1>

        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto font-medium">
          Automatizá los vencimientos, cobrá en segundos por efectivo o transferencia y enviá avisos por WhatsApp a tus socios con un solo clic.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={`https://wa.me/${numeroWhatsApp}?text=${mensajeWA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#C6FF3D] hover:bg-[#b0f024] text-black font-black text-base px-8 py-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(198,255,61,0.25)] active:scale-95"
          >
            🚀 Probar Gratis por 14 Días
          </a>
          <button
            onClick={onGoToLogin}
            className="w-full sm:w-auto bg-[#16191C] hover:bg-zinc-800 text-zinc-300 font-bold text-base px-8 py-4 rounded-2xl border border-zinc-800 transition-all active:scale-95"
          >
            Ingresar al Sistema
          </button>
        </div>
      </section>

      {/* CARACTERÍSTICAS PRINCIPALES */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        <div className="bg-[#16191C] border border-zinc-800/80 p-8 rounded-3xl space-y-3 hover:border-[#C6FF3D]/40 transition-all">
          <div className="text-3xl">💳</div>
          <h3 className="text-xl font-bold text-white">Cobranza Ultra Rápida</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Registrá pagos en efectivo o transferencia en 2 segundos y renová automáticamente la vigencia del plan del socio.
          </p>
        </div>

        <div className="bg-[#16191C] border border-zinc-800/80 p-8 rounded-3xl space-y-3 hover:border-[#C6FF3D]/40 transition-all">
          <div className="text-3xl">💬</div>
          <h3 className="text-xl font-bold text-white">Avisos por WhatsApp</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Recordale a tus alumnos el vencimiento de la cuota enviándoles un mensaje personalizado a su WhatsApp sin agendarlos.
          </p>
        </div>

        <div className="bg-[#16191C] border border-zinc-800/80 p-8 rounded-3xl space-y-3 hover:border-[#C6FF3D]/40 transition-all">
          <div className="text-3xl">⚙️</div>
          <h3 className="text-xl font-bold text-white">Planes a tu Medida</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Creá y editá tus propios planes (Pase Libre, 3 Días, Estudiantil) con los precios de tu gimnasio en cualquier momento.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800/60 py-8 text-center text-zinc-500 text-xs">
        <p>© 2026 GymControl SaaS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}