'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle2,
  Bell,
  Sliders,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SaasConfiguracionPage() {
  const [evolutionUrl, setEvolutionUrl] = useState('https://evoapi.rubenroque.com.mx');
  const [evolutionKey, setEvolutionKey] = useState('429683C4C977415CAAFCCE10F7D57E11');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'alert'>('info');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('saas_evolution_url');
    if (savedUrl) setEvolutionUrl(savedUrl);
    const savedKey = localStorage.getItem('saas_evolution_key');
    if (savedKey) setEvolutionKey(savedKey);
    const savedAnn = localStorage.getItem('saas_global_announcement');
    if (savedAnn) setAnnouncement(savedAnn);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem('saas_evolution_url', evolutionUrl);
      localStorage.setItem('saas_evolution_key', evolutionKey);
      localStorage.setItem('saas_global_announcement', announcement);
      setFeedback('Ajustes globales de la plataforma guardados correctamente.');
      setTimeout(() => setFeedback(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-1 border-b border-zinc-200/80">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-800" />
          <span>Ajustes Globales del SaaS</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configuración central de servidores de API, mensajería de soporte y parámetros de la plataforma.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Evolution API Cluster Config */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Servidor Central Evolution API (WhatsApp Gateway)</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Base URL del Servidor</label>
              <input
                type="text"
                value={evolutionUrl}
                onChange={(e) => setEvolutionUrl(e.target.value)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Master API Key (Global)</label>
              <input
                type="password"
                value={evolutionKey}
                onChange={(e) => setEvolutionKey(e.target.value)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono focus:outline-none focus:bg-white focus:border-zinc-400"
              />
            </div>
          </div>
        </div>

        {/* Global Announcement Banner */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Aviso Global para Todos los Despachos</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700">Mensaje de Aviso / Mantenimiento</label>
              <textarea
                rows={3}
                placeholder="Ej. Mantenimiento programado hoy a las 23:00 hrs. El servicio de WhatsApp no se verá afectado."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg p-3 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs text-zinc-500 font-medium">Tipo de Alerta:</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="ann_type"
                    checked={announcementType === 'info'}
                    onChange={() => setAnnouncementType('info')}
                  />
                  <span>Informativo</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="ann_type"
                    checked={announcementType === 'warning'}
                    onChange={() => setAnnouncementType('warning')}
                  />
                  <span>Advertencia</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="ann_type"
                    checked={announcementType === 'alert'}
                    onChange={() => setAnnouncementType('alert')}
                  />
                  <span>Urgente</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing reference */}
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>Planes Comerciales y Tarifas de Suscripción</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="font-bold text-zinc-900">Starter</div>
              <div className="text-indigo-700 font-semibold font-mono mt-0.5">$1,999 MXN</div>
              <div className="text-[11px] text-zinc-500 mt-1">3 Usuarios • 300 Gestiones</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="font-bold text-zinc-900">Professional</div>
              <div className="text-indigo-700 font-semibold font-mono mt-0.5">$4,999 MXN</div>
              <div className="text-[11px] text-zinc-500 mt-1">8 Usuarios • 1,000 Gestiones</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="font-bold text-zinc-900">Parlamentario</div>
              <div className="text-indigo-700 font-semibold font-mono mt-0.5">$12,999 MXN</div>
              <div className="text-[11px] text-zinc-500 mt-1">20 Usuarios • 3,000 Gestiones</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <div className="font-bold text-zinc-900">Enterprise</div>
              <div className="text-indigo-700 font-semibold font-mono mt-0.5">$24,999 MXN</div>
              <div className="text-[11px] text-zinc-500 mt-1">Ilimitado • Soporte 24/7</div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-5 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Ajustes Globales'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}