import Link from 'next/link';
import { 
  Sparkles, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  Scale
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-95; text-white">
      <header className="border-b border-slate-800/80 backdrop-blur sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-between shadow-lg shadow-blue-500/25">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-lg text-white">
                Legis<span className="text-blue-500">lab</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                SaaS Parlamentario
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/planes"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Planes y Paquetes
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-600/30 transition-all"
            >
              Acceso al Panel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Potenciado con Inteligencia Artificial Especializada en Derecho Parlamentario</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            La plataforma inteligente para el trabajo <span className="text-blue-400">Legislativo y de Gestión</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Centraliza las gestiones ciudadanas de tu distrito, coordina a tu equipo de asesores y redacta iniciativas de ley con asistencia de IA en un entorno multi-tenant de m�xima seguridad.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 text-base transition-all"
            >
              Comenzar con Google
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Ver Demo Interactiva
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 border-t border-slate-800/80 text-left max-w-4xl mx-auto">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">100% Multi-tenant</div>
              <div className="text-xs text-slate-400">Aislamiento total por Despacho</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">IA Jurídica</div>
              <div className="text-xs text-slate-400">Estructura formal y técnica</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">Control Ciudadano</div>
              <div className="text-x{ text-slate-400">Trazabilidad de posturas y gestiones</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">Seguridad Bancaria</div>
              <div className="text-xs text-slate-400">Cifrado de punta a punta</div>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="py-20 px-6 border-t border-slate-800/60 bg-slate-950/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Diseñado exclusivamente para la labor parlamentaria
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Módulos conectados para optimizar el tiempo de diputados y sus equipos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Redactor Legislativo con IA</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Genera borradores de iniciativas, puntos de acuerdo y discursos con técnica legislativa.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> Exposición de motivos automática</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> Cuadro comparativo de reformas</li>
              </ul>
            </div>


            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Gestión Ciudadana & Distrito</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Seguimiento en tiempo real a peticiones ciudadanas, solicitudes de apoyo y audiencias.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Asignación a coordinadores</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400" /> Notificaciones por estatus</li>
              </ul>
            </div>


            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all space-y-4">
              <div className="h-12 w-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-white">Despacho y Equipo Técnico</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Organización de asesores, roles de acceso y repositorio privado de documentos.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400" /> Permisos granulares</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400" /> Exportación oficial PDF / Word</li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      <footer className="mt-auto border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-slate-300">Legislab &copy; 2026</span>
            <span>- Software de Gestión Parlamentaria</span>
          </div>
          <div className="text-slate-400">
            Desarrollado para máxima escalabilidad y seguridad institucional.
          </div>
        </div>
      </footer>
    </div>
  );
}
