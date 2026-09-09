import Link from 'next/link';
import { Scale, FileText, ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones del Servicio | LegisLab',
  description: 'Términos y condiciones de uso de la plataforma de gestión parlamentaria LegisLab.',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
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
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al Inicio</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Title Header */}
          <div className="space-y-3 border-b border-slate-800 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium">
              <FileText className="h-3.5 w-3.5" />
              <span>Condiciones Legales de Uso</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Términos y Condiciones del Servicio
            </h1>
            <p className="text-sm text-slate-400">
              Última actualización: <strong>9 de Septiembre de 2026</strong> • Vigente para <span className="text-blue-400 font-mono">https://legislab.app</span>
            </p>
          </div>

          {/* Legal Content */}
          <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
            {/* 1. Aceptación */}
            <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">1</span>
                <span>Aceptación de los Términos</span>
              </h2>
              <p>
                Al acceder y utilizar la plataforma <strong>LegisLab</strong> (<a href="https://legislab.app" className="text-blue-400 hover:underline">https://legislab.app</a>), el usuario (legisladores, asesores, secretarios técnicos y personal autorizado) acepta quedar vinculado por los presentes Términos y Condiciones, así como por nuestro Aviso de Privacidad.
              </p>
            </section>

            {/* 2. Descripción del Servicio */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">2</span>
                <span>Descripción del Servicio</span>
              </h2>
              <p>
                LegisLab es una plataforma de software como servicio (SaaS) especializada en la gestión integral de despachos parlamentarios, casas de enlace y coordinación legislativa, que incluye módulos de:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Gestión y seguimiento de peticiones ciudadanas y canalizaciones distritales.</li>
                <li>Redacción asistida de iniciativas, puntos de acuerdo y discursos mediante IA.</li>
                <li>Agenda legislativa y sincronización con Google Calendar.</li>
                <li>Resguardo y sincronización en la nube de expedientes vía Google Drive.</li>
                <li>Atención multicanal ciudadana y sincronización de grupos territoriales vía WhatsApp.</li>
              </ul>
            </section>

            {/* 3. Confidencialidad y Propiedad */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <span>Confidencialidad y Propiedad de los Documentos</span>
              </h2>
              <p>
                Toda la información, iniciativas, borradores de ley, expedientes de ciudadanos y documentos generados dentro de cada despacho son propiedad exclusiva del titular del despacho y su equipo. LegisLab no reclama derechos de autor sobre las iniciativas o discursos producidos y mantiene un deber estricto de confidencialidad parlamentaria.
              </p>
            </section>

            {/* 4. Uso de Integraciones */}
            <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">4</span>
                <span>Integración con Servicios de Terceros (Google y WhatsApp)</span>
              </h2>
              <p>
                El usuario autoriza la conexión mediante protocolos OAuth 2.0 con su cuenta de Google Workspace para sincronizar Google Drive y Google Calendar. El usuario puede desvincular o revocar estos permisos en cualquier momento desde el panel de Configuración de la plataforma o directamente desde la consola de seguridad de Google.
              </p>
            </section>

            {/* 5. Disponibilidad y Responsabilidad */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">5</span>
                <span>Disponibilidad del Servicio y Soporte</span>
              </h2>
              <p>
                LegisLab realiza sus mejores esfuerzos para garantizar una disponibilidad continua (uptime superior al 99.5%) y respaldos diarios de bases de datos. No nos hacemos responsables por fallas atribuibles a la interrupción de APIs de terceros (Google, WhatsApp o Meta).
              </p>
            </section>

            {/* 6. Contacto */}
            <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white">Contacto Legal y Notificaciones</h2>
              <p>
                Para cualquier aclaración sobre estos términos, favor de escribir a: <a href="mailto:contacto@rubenroque.mx" className="text-blue-400 underline font-mono">contacto@rubenroque.mx</a> o <a href="mailto:soporte@legislab.app" className="text-blue-400 underline font-mono">soporte@legislab.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 LegisLab • SaaS Parlamentario. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
            <span>•</span>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos del Servicio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
