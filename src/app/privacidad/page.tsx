import Link from 'next/link';
import { Scale, ShieldCheck, Lock, HardDrive, Calendar, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Aviso de Privacidad | LegisLab',
  description: 'Aviso de Privacidad y Política de Tratamiento de Datos Personales de LegisLab.',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
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
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Transparencia y Seguridad Institucional</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Aviso de Privacidad y Tratamiento de Datos
            </h1>
            <p className="text-sm text-slate-400">
              Última actualización: <strong>9 de Septiembre de 2026</strong> • Vigente para <span className="text-blue-400 font-mono">https://legislab.app</span>
            </p>
          </div>

          {/* Legal Content */}
          <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
            {/* 1. Responsable */}
            <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">1</span>
                <span>Identidad y Domicilio del Responsable</span>
              </h2>
              <p>
                <strong>LegisLab</strong> (en adelante &quot;la Plataforma&quot;), con domicilio operativo en Villahermosa, Tabasco, México, y portal web oficial en <a href="https://legislab.app" className="text-blue-400 hover:underline">https://legislab.app</a>, es responsable del uso, resguardo y protección de sus datos personales conforme a la <em>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</em> y los más altos estándares internacionales de seguridad en la nube.
              </p>
            </section>

            {/* 2. Datos Recabados */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">2</span>
                <span>Datos Personales que Recabamos</span>
              </h2>
              <p>
                Para la prestación de los servicios del software de gestión y despacho parlamentario, recabamos las siguientes categorías de datos:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-slate-300">
                <li><strong>Datos de Cuenta de Usuarios y Asesores:</strong> Nombre completo, correo electrónico institucional o personal, fotografía de perfil, cargo o rol legislativo y número telefónico.</li>
                <li><strong>Datos de Atención y Gestión Ciudadana:</strong> Nombres de peticionarios, domicilio/colonia, teléfono de contacto, correo electrónico y documentos adjuntos remitidos para la canalización de trámites ante dependencias públicas.</li>
                <li><strong>Datos de Integraciones de Terceros:</strong> Identificadores de sesión OAuth y tokens de acceso necesarios para vincular servicios autorizados por el usuario (Google Workspace y WhatsApp).</li>
              </ul>
            </section>

            {/* 3. Integraciones de Google (OAuth User Data Policy) */}
            <section className="space-y-4 bg-slate-900/90 p-6 rounded-2xl border border-blue-900/40">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                <span>Uso de Datos de Servicios de Google (Google API Disclosure)</span>
              </h2>
              <p>
                LegisLab cumple estrictamente con la <strong>Política de Datos de Usuario de los Servicios de la API de Google</strong>, incluidos los requisitos de <em>Uso Limitado (Limited Use Requirements)</em>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <HardDrive className="h-4 w-4" />
                    <span>Google Drive API (drive.file)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Solo solicitamos acceso para crear, organizar y consultar archivos y subcarpetas que <strong>LegisLab</strong> crea expresamente dentro de la unidad de Drive del despacho (ej. subcarpetas <code className="text-amber-300 font-mono">/GES-XXXX</code> para expedientes ciudadanos). <strong>No leemos, modificamos ni accedemos a archivos personales preexistentes en su Google Drive.</strong>
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Google Calendar API (calendar.events)</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Utilizamos este permiso exclusivamente para sincronizar en tiempo real las sesiones de comisiones, pleno, audiencias y eventos institucionales creados en la agenda del despacho con el calendario de Google del usuario titular.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs text-blue-200">
                <strong>Garantía de No Transferencia para Publicidad:</strong> La información obtenida a través de las APIs de Google no se utiliza bajo ninguna circunstancia para el desarrollo, entrenamiento de modelos de IA generalistas ni para servir publicidad de ningún tipo.
              </div>
            </section>

            {/* 4. Finalidad del Tratamiento */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono">4</span>
                <span>Finalidades del Tratamiento</span>
              </h2>
              <p>Los datos recabados se emplean para los siguientes propósitos esenciales:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Permitir la operación del software de gestión parlamentaria y seguimiento de peticiones distritales.</li>
                <li>Redacción asistida por inteligencia artificial especializada en técnica legislativa, resguardando la estricta secrecía de borradores.</li>
                <li>Generación de oficios membretados en formato PDF y exportación de respaldos a la nube autorizada.</li>
                <li>Envío de notificaciones operativas al equipo legislativo vía WhatsApp o correo electrónico.</li>
              </ul>
            </section>

            {/* 5. Seguridad y Cifrado */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                <span>Medidas de Seguridad y Cifrado</span>
              </h2>
              <p>
                Implementamos cifrado en tránsito (TLS/HTTPS de 256 bits) y cifrado en reposo para credenciales, tokens de integración y datos sensibles. Cada despacho opera en una arquitectura con estricto aislamiento de base de datos multi-tenant por identificador de despacho (Office ID).
              </p>
            </section>

            {/* 6. Derechos ARCO */}
            <section className="space-y-3 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-lg font-bold text-white">Derechos ARCO y Contacto</h2>
              <p>
                Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información (Rectificación), que la eliminemos de nuestros registros (Cancelación) oponerse al uso de sus datos para fines específicos (Oposición), o revocar en cualquier momento las autorizaciones otorgadas a servicios conectados (Google o WhatsApp).
              </p>
              <p className="text-xs text-slate-400 pt-1">
                Para ejercer sus derechos ARCO o dudas sobre privacidad, contáctenos en: <a href="mailto:contacto@rubenroque.mx" className="text-blue-400 underline font-mono">contacto@rubenroque.mx</a> o <a href="mailto:privacidad@legislab.app" className="text-blue-400 underline font-mono">privacidad@legislab.app</a>.
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
