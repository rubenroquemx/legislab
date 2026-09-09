'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  Smartphone,
  FolderKanban,
  DollarSign,
  TrendingUp,
  Activity,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  Server
} from 'lucide-react';
import {
  getSaasMetricsAction,
  getSaasOfficesAction,
  getSaasWhatsAppInstancesAction,
  getSaasAuditLogsAction,
  toggleOfficeStatusAction,
} from '@/app/actions/saas-admin';
import { cn } from '@/lib/utils';

export default function SaasAdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [officesList, setOfficesList] = useState<any[]>([]);
  const [whatsappInstances, setWhatsappInstances] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      setRefreshing(true);
      const [mRes, oRes, wRes, aRes] = await Promise.all([
        getSaasMetricsAction(),
        getSaasOfficesAction(),
        getSaasWhatsAppInstancesAction(),
        getSaasAuditLogsAction(),
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (oRes.success) setOfficesList(oRes.data);
      if (wRes.success) setWhatsappInstances(wRes.data);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (e) {
      console.warn('Error loading SaaS admin overview:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-zinc-200/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span>Consola de Administración SaaS</span>
            <span className="text-[10px] font-mono font-medium bg-zinc-100 text-zinc-700 border border-zinc-200 px-2 py-0.5 rounded">
              Superadmin
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supervisa despachos legislativos, orquestación de instancias de WhatsApp y métricas operativas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-zinc-500', refreshing && 'animate-spin')} />
            <span>Actualizar</span>
          </button>

          <Link
            href="/admin/despachos?action=new"
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Despacho</span>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Despachos Card */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Despachos Totales</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              {metrics?.totalOffices || 4}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {metrics?.activeOffices || 2} activos
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>{metrics?.trialOffices || 1} en prueba</span>
            <span>•</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span>{metrics?.suspendedOffices || 1} suspendido</span>
          </div>
        </div>

        {/* WhatsApp Instances Card */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Instancias Evolution</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              {metrics?.evoInstancesCount || 4}
            </span>
            <span className="text-xs text-emerald-700 font-medium">
              {metrics?.evoConnectedCount || 2} en vivo
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            {metrics?.evoDisconnectedCount || 2} instancias inactivas
          </div>
        </div>

        {/* MRR Card */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">MRR Mensual Estimado</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              ${(metrics?.totalMRR || 17998).toLocaleString('es-MX')}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono font-medium">MXN</span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Facturación mensual en planes activos
          </div>
        </div>

        {/* Gestiones Card */}
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Gestiones Globales</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              {(metrics?.totalGestiones || 767).toLocaleString('es-MX')}
            </span>
            <span className="text-xs text-zinc-500">
              en {metrics?.totalUsers || 24} usuarios
            </span>
          </div>
          <div className="mt-1.5 text-[11px] text-zinc-400">
            Trámites registrados en la red
          </div>
        </div>
      </div>

      {/* Main Grid: Despachos & WhatsApp Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Despachos Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-zinc-700" />
                <span>Despachos Legislativos</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cuentas activas y estado de servicio.
              </p>
            </div>
            <Link
              href="/admin/despachos"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="pb-2.5">Despacho</th>
                  <th className="pb-2.5">Plan</th>
                  <th className="pb-2.5">WhatsApp</th>
                  <th className="pb-2.5">Estado</th>
                  <th className="pb-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {officesList.slice(0, 5).map((office) => {
                  const isSuspended = office.status === 'suspended';
                  const isTrial = office.status === 'trial';

                  return (
                    <tr key={office.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="py-3">
                        <div className="font-semibold text-zinc-900">
                          {office.name}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {office.titularName} • {office.district}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-700">
                          {office.plan || 'Professional'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{office.whatsappInstanceName || 'Legislab'}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            'text-[10px] font-semibold uppercase px-2 py-0.5 rounded border',
                            office.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isTrial
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          )}
                        >
                          {office.status === 'active' ? 'Activo' : isTrial ? 'Prueba' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(office.id, office.status)}
                            className={cn(
                              'text-[11px] font-medium px-2 py-1 rounded transition-colors',
                              isSuspended
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            )}
                          >
                            {isSuspended ? 'Reactivar' : 'Suspender'}
                          </button>
                          <Link
                            href={`/admin/despachos/${office.id}`}
                            className="text-[11px] font-medium text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2 py-1 rounded transition-colors"
                          >
                            Detalle
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* WhatsApp Instances Live Monitor (1 Col) */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Instancias Evolution API</span>
            </h2>
            <Link
              href="/admin/whatsapp"
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900"
            >
              Administrar
            </Link>
          </div>

          <div className="space-y-2.5">
            {whatsappInstances.slice(0, 4).map((inst, idx) => {
              const isOpen = inst.status === 'open';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
                        )}
                      ></span>
                      <span>{inst.instanceName}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {inst.phone}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase px-2 py-0.5 rounded border',
                        isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      )}
                    >
                      {isOpen ? 'Conectado' : 'Cerrado'}
                    </span>
                    <div className="text-[10px] text-zinc-400 mt-1 font-medium">
                      {inst.messageCount || 0} msgs
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 text-center">
            <Link
              href="/admin/whatsapp"
              className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 font-medium"
            >
              <span>Abrir orquestador de WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Registro de Actividad y Auditoría Global</span>
          </h2>
          <span className="text-[11px] text-zinc-400">Últimos eventos del sistema</span>
        </div>

        <div className="divide-y divide-zinc-100">
          {auditLogs.slice(0, 4).map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="text-zinc-900 font-medium">{log.description}</div>
                <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                  <span>Acción: {log.action}</span>
                  {log.ipAddress && <span>• IP: {log.ipAddress}</span>}
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 whitespace-nowrap">
                {new Date(log.createdAt).toLocaleTimeString('es-MX', {
                  timeZone: 'America/Mexico_City',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}