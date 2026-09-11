'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ArrowLeft,
  Smartphone,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Edit,
  Save,
  ShieldCheck,
  ExternalLink,
  Zap,
  Mail,
  MapPin,
  Calendar,
  Gift,
  Tag,
  CreditCard,
  HardDrive,
  CheckSquare,
  Square,
  Clock,
  UserCheck
} from 'lucide-react';
import {
  getSaasOfficesAction,
  updateSaasOfficeAction,
  toggleOfficeStatusAction,
  getSaasUsersAction,
  addFreeMonthsAction,
  setTrialPeriodAction,
  setDiscountAction,
  updateOfficeModulesAction,
  updateOfficeDriveConfigAction,
} from '@/app/actions/saas-admin';
import {
  ALL_AVAILABLE_MODULES,
  PLAN_CONFIGS,
} from '@/lib/saas-config';
import { generateWhatsAppQR, getWhatsAppStatus } from '@/app/actions/whatsapp';
import { setActiveOfficeAction } from '@/lib/session-office';
import { cn } from '@/lib/utils';

export default function SaasDespachoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const officeId = resolvedParams.id;

  const [office, setOffice] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Edit states
  const [plan, setPlan] = useState('starter');
  const [status, setStatus] = useState('active');
  const [maxUsers, setMaxUsers] = useState(3);
  const [titularEmail, setTitularEmail] = useState('');
  const [titularPhone, setTitularPhone] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoNotes, setPromoNotes] = useState('');

  // Modules State
  const [enabledModules, setEnabledModules] = useState<string[]>([]);

  // Google Drive State
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveFolderId, setDriveFolderId] = useState('');
  const [driveClientId, setDriveClientId] = useState('');
  const [driveClientSecret, setDriveClientSecret] = useState('');

  // WhatsApp QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [wpStatus, setWpStatus] = useState<'open' | 'close' | 'connecting'>('close');

  async function loadDetail() {
    try {
      setLoading(true);
      const [officesRes, usersRes] = await Promise.all([
        getSaasOfficesAction(),
        getSaasUsersAction({ officeId }),
      ]);

      if (officesRes.success && officesRes.data) {
        const found = officesRes.data.find((o: any) => o.id === officeId) || officesRes.data[0];
        if (found) {
          setOffice(found);
          setPlan(found.plan || 'starter');
          setStatus(found.status || 'active');
          setMaxUsers(found.maxUsers || 3);
          setTitularEmail(found.titularEmail || found.billingEmail || '');
          setTitularPhone(found.titularPhone || '');
          setInstanceName(found.whatsappInstanceName || 'Legislab');
          setDiscountPercent(found.discountPercent || 0);
          setPromoNotes(found.promoNotes || '');

          // Parse Modules
          try {
            const mods = typeof found.enabledModules === 'string' ? JSON.parse(found.enabledModules) : found.enabledModules;
            if (Array.isArray(mods)) {
              setEnabledModules(mods);
            } else {
              setEnabledModules(ALL_AVAILABLE_MODULES.map(m => m.id));
            }
          } catch {
            setEnabledModules(ALL_AVAILABLE_MODULES.map(m => m.id));
          }

          // Drive
          setDriveFolderUrl(found.googleDriveFolderUrl || '');
          setDriveFolderId(found.googleDriveFolderId || '');
          setDriveClientId(found.googleDriveClientId || '');
          setDriveClientSecret(found.googleDriveClientSecret || '');

          // Check WhatsApp status for this instance
          if (found.whatsappInstanceName) {
            const st = await getWhatsAppStatus(found.whatsappInstanceName);
            if (st.success && st.isConnected) {
              setWpStatus('open');
            } else {
              setWpStatus('close');
            }
          }
        }
      }

      if (usersRes.success && usersRes.data) {
        setUsersList(usersRes.data);
      }
    } catch (e) {
      console.warn('Error loading office detail:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [officeId]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSaasOfficeAction(officeId, {
        plan: plan as any,
        status: status as any,
        maxUsers: Number(maxUsers),
        titularEmail,
        titularPhone,
        billingEmail: titularEmail,
        whatsappInstanceName: instanceName,
        discountPercent: Number(discountPercent),
        promoNotes,
      });

      if (res.success) {
        setFeedback('Ajustes del despacho guardados con éxito.');
        loadDetail();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFreeMonths = async (months: number) => {
    try {
      const res = await addFreeMonthsAction(officeId, months);
      if (res.success) {
        setFeedback(res.message || `+${months} meses gratis agregados.`);
        loadDetail();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetTrialDays = async (days: number) => {
    try {
      const res = await setTrialPeriodAction(officeId, days);
      if (res.success) {
        setFeedback(res.message || `Free Trial configurado a ${days} días.`);
        loadDetail();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleModule = async (moduleId: string) => {
    const updated = enabledModules.includes(moduleId)
      ? enabledModules.filter(m => m !== moduleId)
      : [...enabledModules, moduleId];
    
    setEnabledModules(updated);
    try {
      await updateOfficeModulesAction(officeId, updated);
      setFeedback('Módulos actualizados para este despacho.');
      setTimeout(() => setFeedback(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveDriveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateOfficeDriveConfigAction(officeId, {
        googleDriveFolderUrl: driveFolderUrl,
        googleDriveFolderId: driveFolderId,
        googleDriveClientId: driveClientId,
        googleDriveClientSecret: driveClientSecret,
      });
      if (res.success) {
        setFeedback('Configuración de Google Drive guardada.');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEnterOffice = async () => {
    try {
      await setActiveOfficeAction(officeId);
      router.push('/dashboard');
    } catch (e) {
      console.error('Error entering office:', e);
    }
  };

  const handleGenerateQR = async () => {
    if (!instanceName) return;
    setGeneratingQr(true);
    setShowQrModal(true);
    try {
      const res = await generateWhatsAppQR(instanceName);
      if (res.success && res.qrBase64) {
        setQrBase64(res.qrBase64);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingQr(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Cargando expediente del cliente...</span>
      </div>
    );
  }

  const currentPlan = PLAN_CONFIGS[plan] || PLAN_CONFIGS.starter;
  const basePrice = currentPlan.price;
  const finalPrice = Math.round(basePrice * (1 - (discountPercent || 0) / 100));

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-200/80">
        <Link
          href="/admin/despachos"
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Directorio de Clientes</span>
        </Link>

        <span
          className={cn(
            'text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border',
            status === 'active'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : status === 'trial'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-red-50 text-red-700 border-red-200'
          )}
        >
          Estado: {status === 'active' ? 'Activo' : status === 'trial' ? 'En Prueba' : 'Suspendido'}
        </span>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black text-xl shadow-xs shrink-0">
            {office?.name?.[0] || 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-zinc-900">{office?.name}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 capitalize border border-zinc-200">
                Plan {currentPlan.name}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-semibold text-zinc-800">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Titular: {office?.titularName}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-zinc-700">{titularEmail}</span>
              <span>•</span>
              <span>{office?.district}, {office?.state}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnterOffice}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <span>⚡ Entrar a Operar este Despacho</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Promociones y Cortesías de Superadmin */}
      <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-zinc-900">Herramientas Promocionales del Superadmin</h2>
          </div>
          <span className="text-[11px] text-zinc-500">Beneficios y cortesías directas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Meses Gratis */}
          <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-2">
            <span className="font-semibold text-zinc-800 flex items-center gap-1">
              <span>🎁 Agregar Meses Gratis</span>
            </span>
            <p className="text-[11px] text-zinc-500">Suma meses de cortesía a la fecha de corte actual:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[1, 2, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => handleAddFreeMonths(m)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-indigo-600 hover:text-white rounded-lg text-zinc-700 font-semibold text-[11px] border border-zinc-200 transition-colors"
                >
                  +{m} {m === 1 ? 'mes' : 'meses'}
                </button>
              ))}
            </div>
          </div>

          {/* Free Trial Configurator */}
          <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-2">
            <span className="font-semibold text-zinc-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Configurar Free Trial</span>
            </span>
            <p className="text-[11px] text-zinc-500">Asignar periodo de prueba gratuita:</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[7, 14, 30, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => handleSetTrialDays(d)}
                  className="px-2.5 py-1 bg-zinc-100 hover:bg-amber-600 hover:text-white rounded-lg text-zinc-700 font-semibold text-[11px] border border-zinc-200 transition-colors"
                >
                  {d} días
                </button>
              ))}
            </div>
          </div>

          {/* Descuento Aplicado */}
          <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-xs space-y-2">
            <span className="font-semibold text-zinc-800 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descuento de Suscripción</span>
            </span>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Tarifa Base:</span>
              <span className="line-through text-zinc-400">${basePrice.toLocaleString('es-MX')}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Tarifa con {discountPercent}% OFF:</span>
              <span>${finalPrice.toLocaleString('es-MX')} MXN/mes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Plan & Limits + Matriz de Módulos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Plan & Details */}
          <form onSubmit={handleSaveChanges} className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Edit className="w-4 h-4 text-zinc-700" />
              <span>Suscripción, Usuarios y Datos de Facturación</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Paquete Contratado</label>
                <select
                  value={plan}
                  onChange={(e) => {
                    const p = e.target.value;
                    setPlan(p);
                    const cfg = PLAN_CONFIGS[p];
                    if (cfg) setMaxUsers(cfg.maxUsers);
                  }}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                >
                  <option value="starter">Starter (1 Principal + 2 Extras = 3 Usuarios) • $1,999</option>
                  <option value="professional">Professional (1 Principal + 7 Extras = 8 Usuarios) • $4,999</option>
                  <option value="parliamentary">Parlamentario (1 Principal + 19 Extras = 20 Usuarios) • $12,999</option>
                  <option value="enterprise">Enterprise (Ilimitado) • $24,999</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Estado del Despacho</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                >
                  <option value="active">Activo</option>
                  <option value="trial">En Prueba (Free Trial)</option>
                  <option value="suspended">Suspendido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Límite Total de Usuarios (Principal + Extras)</label>
                <input
                  type="number"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Correo del Titular / Facturación</label>
                <input
                  type="email"
                  value={titularEmail}
                  onChange={(e) => setTitularEmail(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={titularPhone}
                  onChange={(e) => setTitularPhone(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium text-zinc-700">Notas de Convenio / Promoción</label>
                <input
                  type="text"
                  value={promoNotes}
                  onChange={(e) => setPromoNotes(e.target.value)}
                  placeholder="Ej. Convenio Especial Grupo Parlamentario"
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>

          {/* Matriz de Módulos Habilitados */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>Matriz de Módulos Activos para este Despacho</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Los módulos desmarcados se ocultan automáticamente en el menú del despacho cliente.
                </p>
              </div>
              <span className="text-xs font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
                {enabledModules.length} de {ALL_AVAILABLE_MODULES.length} activos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_AVAILABLE_MODULES.map((mod) => {
                const isEnabled = enabledModules.includes(mod.id);

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => handleToggleModule(mod.id)}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center justify-between transition-all',
                      isEnabled
                        ? 'bg-emerald-50/60 border-emerald-300/80 text-emerald-950 shadow-xs'
                        : 'bg-zinc-50/60 border-zinc-200/80 text-zinc-400 opacity-60 hover:opacity-100'
                    )}
                  >
                    <div>
                      <div className="text-xs font-bold leading-tight flex items-center gap-2">
                        {isEnabled ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                        <span>{mod.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">{mod.category}</span>
                    </div>

                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase px-2 py-0.5 rounded',
                        isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      )}
                    >
                      {isEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integración Google Drive Propio */}
          <form onSubmit={handleSaveDriveConfig} className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Google Drive Propio del Despacho</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Permite respaldar automáticamente oficios, expedientes y anexos en la cuenta de Google Drive del legislador.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Enlace o URL de la Carpeta de Drive</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveFolderUrl}
                  onChange={(e) => setDriveFolderUrl(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Google Client ID (Opcional)</label>
                  <input
                    type="text"
                    placeholder="xxxxxxxx.apps.googleusercontent.com"
                    value={driveClientId}
                    onChange={(e) => setDriveClientId(e.target.value)}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Google Client Secret (Opcional)</label>
                  <input
                    type="password"
                    placeholder="GOCSPX-xxxxxxxxx"
                    value={driveClientSecret}
                    onChange={(e) => setDriveClientSecret(e.target.value)}
                    className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-400"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Claves de Google Drive</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: WhatsApp + Stripe + Team */}
        <div className="space-y-6">
          {/* Pasarela Stripe */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Suscripción Stripe & Pagos</span>
            </h2>

            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Plan:</span>
                <span className="font-bold text-zinc-900 capitalize">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cuota Mensual:</span>
                <span className="font-bold text-emerald-700">${finalPrice.toLocaleString('es-MX')} MXN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Responsable de Pago:</span>
                <span className="font-mono text-[11px] text-zinc-800">{titularEmail}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setFeedback(`Enlace de cobro Stripe generado para ${titularEmail}: $${finalPrice} MXN`);
                setTimeout(() => setFeedback(null), 4000);
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition-colors shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Generar Checkout Link de Stripe</span>
            </button>
          </div>

          {/* WhatsApp Dedicated Instance */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Instancia WhatsApp Dedicada</span>
            </h2>

            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Instancia:</span>
                <span className="font-mono text-xs font-semibold text-emerald-700">{instanceName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Estado de Enlace:</span>
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded border',
                    wpStatus === 'open'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  )}
                >
                  {wpStatus === 'open' ? 'En Vivo' : 'Desconectado'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleGenerateQR}
                className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 py-2 rounded-lg transition-colors shadow-xs"
              >
                <QrCode className="w-4 h-4" />
                <span>Generar Código QR</span>
              </button>

              <Link
                href="/admin/whatsapp"
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 py-2 rounded-lg transition-colors"
              >
                <span>Ver en Orquestador</span>
              </Link>
            </div>
          </div>

          {/* Team Members */}
          <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-700" />
                <span>Usuarios ({usersList.length} de {maxUsers})</span>
              </h2>
              <span className="text-[11px] text-zinc-500">
                1 Principal + {maxUsers - 1} Extras
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-zinc-100">
              {usersList.map((usr, uIdx) => (
                <div key={usr.id} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <span>{usr.name}</span>
                      {uIdx === 0 && (
                        <span className="text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 px-1 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">{usr.email}</div>
                  </div>
                  <span className="text-[10px] text-zinc-500 capitalize">{usr.cargo || usr.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-xl relative">
            <h3 className="font-bold text-sm text-zinc-900">Vincular WhatsApp de {office?.name}</h3>
            <p className="text-xs text-zinc-500">
              Escanea este código desde la app de WhatsApp del legislador.
            </p>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl inline-block mx-auto">
              {generatingQr ? (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin text-zinc-700" />
                </div>
              ) : qrBase64 ? (
                <img
                  src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                  alt="QR WhatsApp"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-zinc-600 text-xs font-mono">
                  Generando QR...
                </div>
              )}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}