'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Scale,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  HelpCircle,
  PhoneCall,
  Lock,
  ChevronDown,
  AlertTriangle,
  LogOut,
  UserX
} from 'lucide-react';
import { PLAN_CONFIGS } from '@/lib/saas-config';

function PlanesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isUnassigned = searchParams.get('unassigned') === 'true' || searchParams.get('error') === 'AccessDenied';
  
  const [annualBilling, setAnnualBilling] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter (Inicial)',
      tagline: 'Ideal para 1 Diputado(a) y su Asesor principal',
      monthlyPrice: PLAN_CONFIGS.starter.price,
      annualPrice: Math.round(PLAN_CONFIGS.starter.price * 0.85),
      usersText: '1 Titular + 1 Asesor adicional (2 usuarios)',
      popular: false,
      badge: null,
      features: [
        'Módulo de Gestiones Ciudadanas y Folios ilimitados',
        'Agenda Legislativa y Compromisos de Pleno',
        'Directorio Telefónico Institucional y Cumpleaños',
        'Tablero Kanban de Tareas y Asignación de Equipo',
        'Aislamiento Multi-tenant de Máxima Seguridad',
        'Soporte Técnico por Correo y Chat',
      ],
      whatsappMsg: 'Hola, deseo contratar el Plan Starter de LegisLab para mi despacho.',
    },
    {
      id: 'professional',
      name: 'Professional (Recomendado)',
      tagline: 'Para despachos con equipo de asesores y trabajo territorial',
      monthlyPrice: PLAN_CONFIGS.professional.price,
      annualPrice: Math.round(PLAN_CONFIGS.professional.price * 0.85),
      usersText: '1 Titular + 4 Asesores adicionales (5 usuarios)',
      popular: true,
      badge: 'MÁS ELEGIDO',
      features: [
        'Todo lo incluido en el Plan Starter',
        'Redactor con IA (Iniciativas, Puntos de Acuerdo, Discursos, Boletines)',
        'Módulo de Territorio y Mapeo de Seccionales Distritales',
        'Atención Ciudadana y Vinculación WhatsApp',
        'Generador de Oficios Formales y Turnos PDF',
        'Soporte Prioritario por WhatsApp y Videollamada',
      ],
      whatsappMsg: 'Hola, deseo contratar el Plan Professional de LegisLab para mi despacho.',
    },
    {
      id: 'parliamentary',
      name: 'Parlamentario (Bancada)',
      tagline: 'Potencia total para coordinaciones de bancada y comisiones',
      monthlyPrice: PLAN_CONFIGS.parliamentary.price,
      annualPrice: Math.round(PLAN_CONFIGS.parliamentary.price * 0.85),
      usersText: '1 Titular + 7 Asesores adicionales (8 usuarios)',
      popular: false,
      badge: 'ALTO RENDIMIENTO',
      features: [
        'Todo lo incluido en el Plan Professional',
        'Grupos de WhatsApp Masivos y Envío Segmentado',
        'Integración con Google Drive Propio del Despacho',
        'Sincronización Bidireccional con Google Calendar',
        'Monitoreo de Medios, Prensa y Redes Sociales',
        'Marco Jurídico con Búsqueda Inteligente de Leyes',
        'Capacitación Virtual Personalizada para el Equipo',
      ],
      whatsappMsg: 'Hola, deseo contratar el Plan Parlamentario de LegisLab para mi despacho.',
    },
    {
      id: 'enterprise',
      name: 'Institucional / Congreso',
      tagline: 'Para fracciones parlamentarias completas, bancadas y congresos',
      monthlyPrice: PLAN_CONFIGS.enterprise.price,
      annualPrice: Math.round(PLAN_CONFIGS.enterprise.price * 0.85),
      usersText: 'Usuarios Ilimitados (Hasta 50+ integrantes)',
      popular: false,
      badge: 'CORPORATIVO',
      features: [
        'Despachos independientes ilimitados para cada Diputado',
        'Panel Maestro de Superadministrador SaaS',
        'Servidor dedicado con SLA 99.9% y cifrado institucional',
        'Capacitación presencial in-situ para asesores y personal',
        'Importación y migración de bases de datos previas',
        'Ejecutivo de cuenta dedicado 24/7',
      ],
      whatsappMsg: 'Hola, requiero una cotización institucional para el Plan Enterprise de LegisLab.',
    },
  ];

  const faqs = [
    {
      q: '¿Por qué no pude ingresar directamente al sistema?',
      a: 'LegisLab opera bajo un estricto modelo de aislamiento multi-tenant por despacho legislativo. Solo los Diputados Titulares dados de alta y los asesores formalmente invitados a un despacho tienen acceso a los datos de trabajo parlamentario.',
    },
    {
      q: 'Si ya pertenezco a un equipo, ¿cómo obtengo acceso?',
      a: 'Pide al Diputado titular o al administrador de tu despacho que registre tu correo desde la sección "Usuarios y Equipo" de LegisLab. Recibirás un enlace de invitación para activar tu cuenta de inmediato.',
    },
    {
      q: '¿Cómo se realiza la contratación y facturación?',
      a: 'Emitimos factura fiscal digital (CFDI) conforme a la legislación mexicana. El pago puede realizarse mediante transferencia bancaria institucional o tarjeta bancaria con suscripción mensual o anual.',
    },
    {
      q: '¿Los datos de mi despacho están seguros y aislados de otros diputados?',
      a: 'Absolutamente. Cada despacho cuenta con partición de base de datos aislada con UUID único, encriptación en reposo y en tránsito, y control de accesos por roles y permisos granulares.',
    },
    {
      q: '¿Puedo solicitar una demostración antes de contratar?',
      a: '¡Por supuesto! Puedes contactarnos directamente vía WhatsApp o llamada para agendar una demostración guiada de 15 minutos con un especialista.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
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

          <div className="flex items-center gap-3">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-slate-400" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-600/30 transition-all"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-12">
        
        {/* Unassigned Warning Banner (Shown when redirected) */}
        {isUnassigned && (
          <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <UserX className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-300">
                  Acceso restringido: Cuenta sin Despacho asignado
                </h3>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  El correo <strong className="text-white font-semibold underline">{session?.user?.email || 'ingresado'}</strong> no pertenece a ningún diputado titular registrado ni ha sido invitado como asesor en un despacho parlamentario activo.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-amber-300/80">
                ¿Deseas dar de alta un despacho para tu diputación o bancada? Consulta los paquetes a continuación:
              </span>
              <a
                href="https://wa.me/529932200146?text=Hola,%20acabo%20de%20ingresar%20a%20Legislab%20y%20deseo%20dar%20de%20alta%20mi%20despacho%20parlamentario."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-sm"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Hablar con un Asesor por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* Hero Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Software Especializado para el Trabajo Legislativo y Distrital</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Planes y Paquetes de <span className="text-blue-400">Gestión Parlamentaria</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte al tamaño de tu equipo, volumen de gestiones distritales y necesidades de técnica legislativa.
          </p>

          {/* Billing Switcher */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span className={'text-xs font-semibold ' + (!annualBilling ? 'text-white' : 'text-slate-400')}>
              Pago Mensual
            </span>
            <button
              onClick={() => setAnnualBilling(!annualBilling)}
              className="w-12 h-6 bg-slate-800 rounded-full p-1 transition-colors relative border border-slate-700 cursor-pointer"
            >
              <div
                className={'w-4 h-4 bg-blue-500 rounded-full transition-transform ' + (annualBilling ? 'translate-x-6' : 'translate-x-0')}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={'text-xs font-semibold ' + (annualBilling ? 'text-white' : 'text-slate-400')}>
                Pago Anual
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                15% OFF
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((p) => {
            const price = annualBilling ? p.annualPrice : p.monthlyPrice;
            return (
              <div
                key={p.id}
                className={'relative rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 ' + (
                  p.popular
                    ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border-blue-500/60 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                )}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                      {p.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.tagline}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        {'$' + price.toLocaleString('es-MX')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        MXN / mes
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{p.usersText}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <a
                    href={'https://wa.me/529932200146?text=' + encodeURIComponent(p.whatsappMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className={'w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ' + (
                      p.popular
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    )}
                  >
                    <span>Contratar Despacho</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Multi-tenant Assurance */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Aislamiento Total de Datos</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Cada despacho cuenta con partición multi-tenant única. Ningún otro legislador o usuario puede acceder a tu información.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Facturación Institucional CFDI</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Facturación fiscal inmediata para comprobación de gastos legislativos y prerrogativas de bancada.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Activación Inmediata</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tu despacho queda configurado en minutos con acceso para tu titular y envío de invitaciones a tu equipo de asesores.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 max-w-3xl mx-auto pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Preguntas Frecuentes</h2>
            <p className="text-xs text-slate-400">Todo lo que necesitas saber sobre el licenciamiento de LegisLab</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-slate-200 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={'h-4 w-4 text-slate-400 transition-transform ' + (isOpen ? 'rotate-180 text-blue-400' : '')} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Banner */}
        <div className="text-center py-8 border-t border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white">¿Tienes dudas o requieres una propuesta personalizada?</h3>
          <p className="text-xs text-slate-400">Nuestro equipo está listo para atenderte vía WhatsApp o llamada directa.</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <a
              href="https://wa.me/529932200146?text=Hola,%20requiero%20asesoria%20sobre%20los%20planes%20de%20Legislab."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Contactar por WhatsApp (+52 993 220 0146)</span>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all"
            >
              <span>Volver a Iniciar Sesión</span>
            </Link>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 sm:px-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-slate-300">LegisLab &copy; 2026</span>
            <span>- Plataforma de Gestión y Técnica Parlamentaria</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Privacidad &bull; Términos de Servicio &bull; Soporte 24/7
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PlanesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs">Cargando planes...</div>}>
      <PlanesContent />
    </Suspense>
  );
}
