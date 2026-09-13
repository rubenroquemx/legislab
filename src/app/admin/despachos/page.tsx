'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Users,
  FolderKanban,
  MoreVertical,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Zap,
  Gift,
  Tag,
  Mail,
  Phone,
  UserCheck,
  UserPlus,
  LogIn
} from 'lucide-react';
import {
  getSaasOfficesAction,
  createSaasOfficeAction,
  toggleOfficeStatusAction,
} from '@/app/actions/saas-admin';
import { setActiveOfficeAction } from '@/lib/session-office';
import { PLAN_CONFIGS } from '@/lib/saas-config';
import { cn } from '@/lib/utils';

function SaasDespachosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [officesList, setOfficesList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [enteringOfficeId, setEnteringOfficeId] = useState<string | null>(null);

  // Modal New Office / Principal User
  const [showNewModal, setShowNewModal] = useState(false);
  const [formTitular, setFormTitular] = useState(''); // Usuario Principal
  const [formEmail, setFormEmail] = useState(''); // Email de pago y acceso
  const [formPhone, setFormPhone] = useState('');
  const [formOfficeName, setFormOfficeName] = useState('');
  const [formLegislature, setFormLegislature] = useState('LXVI Legislatura');
  const [formDistrict, setFormDistrict] = useState('');
  const [formState, setFormState] = useState('Tabasco');
  const [formParty, setFormParty] = useState('MORENA');
  const [formPlan, setFormPlan] = useState<'starter' | 'professional' | 'parliamentary' | 'enterprise'>('starter');
  const [formStatus, setFormStatus] = useState<'active' | 'trial'>('active');
  const [formTrialDays, setFormTrialDays] = useState(14);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formPromoNotes, setFormPromoNotes] = useState('');
  const [formInstanceName, setFormInstanceName] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadOffices() {
    try {
      setLoading(true);
      const res = await getSaasOfficesAction({
        search: searchTerm,
        status: filterStatus,
        plan: filterPlan,
      });
      if (res.success && res.data) {
        setOfficesList(res.data);
      }
    } catch (e) {
      console.warn('Error loading offices:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffices();
  }, [searchTerm, filterStatus, filterPlan]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setShowNewModal(true);
    }
  }, [searchParams]);

  const handleEnterOffice = async (officeId: string) => {
    setEnteringOfficeId(officeId);
    try {
      await setActiveOfficeAction(officeId);
      router.push('/dashboard');
    } catch (e) {
      console.error('Error entering office:', e);
      setEnteringOfficeId(null);
    }
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitular || !formEmail || !formDistrict) return;

    setCreating(true);
    try {
      const officeName = formOfficeName.trim() || `Despacho Dip. ${formTitular}`;
      const res = await createSaasOfficeAction({
        name: officeName,
        titularName: formTitular,
        titularEmail: formEmail,
        titularPhone: formPhone,
        legislature: formLegislature,
        district: formDistrict,
        state: formState,
        party: formParty,
        plan: formPlan,
        status: formStatus,
        trialDays: formStatus === 'trial' ? Number(formTrialDays) : 0,
        discountPercent: Number(formDiscount),
        promoNotes: formPromoNotes,
        whatsappInstanceName: formInstanceName || undefined,
      });

      if (res.success) {
        setFeedback(res.message || 'Despacho y Usuario Principal registrados con éxito.');
        setShowNewModal(false);
        // Reset form
        setFormTitular('');
        setFormEmail('');
        setFormPhone('');
        setFormOfficeName('');
        setFormDistrict('');
        setFormPromoNotes('');
        setFormDiscount(0);
        setFormInstanceName('');
        await loadOffices();
        if (res.officeId) {
          // Activar inmediatamente el nuevo despacho para el superadmin
          await setActiveOfficeAction(res.officeId);
        }
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback(res.error || 'Error al crear el despacho');
      }
    } catch (err: unknown) {
      setFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (officeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await toggleOfficeStatusAction(officeId, newStatus);
      if (res.success) {
        setOfficesList((prev) =>
          prev.map((o) => (o.id === officeId ? { ...o, status: newStatus } : o))
        );
        setFeedback(`Despacho actualizado a estado ${newStatus}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0B172D] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1B62E3]" />
            <span>Despachos Legislativos (Clientes SaaS)</span>
          </h1>
          <p className="text-xs text-[#68768A] mt-0.5">
            Gestión de usuarios principales que contratan y pagan la suscripción • Gestiones Ilimitadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadOffices}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0B172D] hover:text-[#1B62E3] bg-white hover:bg-[#F3F5F9] border border-[#E2E8F0] px-3.5 py-2 rounded-xl shadow-2xs transition-colors ios-press cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-[#68768A]', loading && 'animate-spin')} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1B62E3] hover:bg-[#1550BA] px-4 py-2 rounded-xl shadow-xs transition-colors ios-press cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrar Nuevo Cliente / Despacho</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-[#EBF9EE] border border-[#34C759]/30 text-[#1B5E20] rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#34C759] shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario titular, correo, despacho o distrito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-zinc-400"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activo</option>
            <option value="trial">En Periodo de Prueba (Trial)</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>

        <div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:bg-white focus:border-zinc-400"
          >
            <option value="all">Todos los Planes</option>
            <option value="starter">Starter (3 usuarios • $1,999/mes)</option>
            <option value="professional">Professional (8 usuarios • $4,999/mes)</option>
            <option value="parliamentary">Parlamentario (20 usuarios • $12,999/mes)</option>
            <option value="enterprise">Enterprise (Ilimitado • $24,999/mes)</option>
          </select>
        </div>
      </div>

      {/* Offices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {officesList.map((office) => {
          const isSuspended = office.status === 'suspended';
          const isTrial = office.status === 'trial';
          const planConfig = PLAN_CONFIGS[office.plan] || PLAN_CONFIGS.starter;

          return (
            <div
              key={office.id}
              className={cn(
                'rounded-xl border bg-white p-5 space-y-4 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between',
                isSuspended ? 'border-red-200 opacity-80' : 'border-zinc-200/80'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 leading-tight">
                      {office.name}
                    </h3>
                    <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-zinc-800">{office.titularName}</span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase px-2 py-0.5 rounded border whitespace-nowrap',
                      office.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isTrial
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    )}
                  >
                    {office.status === 'active' ? 'Activo' : isTrial ? 'Prueba' : 'Suspendido'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-500">
                  <div className="flex justify-between">
                    <span>Contacto de Pago:</span>
                    <span className="font-mono text-zinc-800 text-[11px] truncate max-w-[170px]">{office.titularEmail || office.billingEmail || 'Sin correo'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Contratado:</span>
                    <span className="text-zinc-900 font-semibold capitalize">{office.plan || 'Starter'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Instancia WhatsApp:</span>
                    <span className="font-mono text-[11px] text-zinc-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{office.whatsappInstanceName || 'Legislab'}</span>
                    </span>
                  </div>
                  {office.discountPercent > 0 && (
                    <div className="flex justify-between items-center text-indigo-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>Descuento Aplicado:</span>
                      </span>
                      <span>{office.discountPercent}% OFF</span>
                    </div>
                  )}
                </div>

                {/* Quota Indicators */}
                <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-zinc-400 block">Usuarios Habilitados:</span>
                    <span className="font-semibold text-zinc-800">{office.userCount || 1} / {office.maxUsers || 3}</span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-zinc-400 block">Gestiones:</span>
                    <span className="font-semibold text-emerald-700">Ilimitadas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleEnterOffice(office.id)}
                  disabled={enteringOfficeId === office.id}
                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{enteringOfficeId === office.id ? 'Accediendo...' : '⚡ Entrar al Despacho'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(office.id, office.status)}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
                      isSuspended
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    )}
                  >
                    {isSuspended ? 'Reactivar' : 'Suspender'}
                  </button>

                  <Link
                    href={`/admin/despachos/${office.id}`}
                    className="text-xs font-semibold text-zinc-800 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Config</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Registrar Nuevo Usuario Principal & Despacho */}
      {showNewModal && (
        <div className="w-full my-6 animate-in fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-xl relative overflow-visible">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-zinc-900" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">Registrar Nuevo Cliente / Usuario Principal</h3>
                  <p className="text-[11px] text-zinc-500">Alta del legislador contratante y responsable de la suscripción.</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-zinc-800 p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOffice} className="space-y-4">
              {/* Sección 1: Datos del Usuario Principal */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>1. Datos del Usuario Principal (Titular que contrata y paga)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Nombre del Titular *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Dip. Juan Pérez López"
                      value={formTitular}
                      onChange={(e) => {
                        setFormTitular(e.target.value);
                        if (!formOfficeName) {
                          setFormOfficeName(`Despacho Dip. ${e.target.value}`);
                        }
                        if (!formInstanceName) {
                          setFormInstanceName(`Legislab_${e.target.value.replace(/[^a-zA-Z0-9]/g, '')}`);
                        }
                      }}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Correo Electrónico (Acceso y Pago) *</label>
                    <input
                      type="email"
                      required
                      placeholder="juan.perez@congresotabasco.gob.mx"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="Ej. 993 123 4567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">Distrito / Jurisdicción *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Distrito 04 Federal (Centro)"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Paquete y Capacidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Paquete Contratado</label>
                  <select
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value as any)}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                  >
                    <option value="starter">Paquete Inicial (1 Principal + 2 Extras = 3 Usuarios) • $1,999 MXN</option>
                    <option value="professional">Paquete Profesional (1 Principal + 7 Extras = 8 Usuarios) • $4,999 MXN</option>
                    <option value="parliamentary">Paquete Parlamentario (1 Principal + 19 Extras = 20 Usuarios) • $12,999 MXN</option>
                    <option value="enterprise">Paquete Enterprise (Ilimitado) • $24,999 MXN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Modalidad Inicial</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                  >
                    <option value="active">Activo Inmediato (30 días de suscripción)</option>
                    <option value="trial">Periodo de Prueba (Free Trial)</option>
                  </select>
                </div>
              </div>

              {/* Sección 3: Promociones / Free Trial */}
              {formStatus === 'trial' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-700" />
                    <span>Días de Prueba Gratuita (Free Trial)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    {[7, 14, 30, 60].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormTrialDays(d)}
                        className={cn(
                          'px-3 py-1 text-xs rounded-lg border font-medium transition-colors',
                          formTrialDays === d
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                        )}
                      >
                        {d} días
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Descuento Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Descuento Especial (%)</label>
                  <select
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                  >
                    <option value={0}>Sin Descuento (0%)</option>
                    <option value={10}>10% de Descuento</option>
                    <option value={20}>20% de Descuento</option>
                    <option value={50}>50% de Descuento (Beca)</option>
                    <option value={100}>100% Gratuito (Cortesía Institucional)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Notas / Convenio</label>
                  <input
                    type="text"
                    placeholder="Ej. Convenio LXVI Legislatura"
                    value={formPromoNotes}
                    onChange={(e) => setFormPromoNotes(e.target.value)}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
                  />
                </div>
              </div>

              {/* Aprovisionamiento de WhatsApp */}
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Instancia Evolution API para este Despacho</span>
                </label>
                <input
                  type="text"
                  placeholder="Nombre de instancia (ej. Legislab_DipRoque)"
                  value={formInstanceName}
                  onChange={(e) => setFormInstanceName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-emerald-700 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-xs flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creating ? 'Registrando...' : 'Registrar Cliente y Despacho'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaasDespachosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-zinc-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span>Cargando directorio de clientes...</span>
        </div>
      }
    >
      <SaasDespachosContent />
    </Suspense>
  );
}