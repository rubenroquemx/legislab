'use client';

import { useState, useEffect } from 'react';
import {
  Smartphone,
  QrCode,
  RefreshCw,
  Power,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Server,
  MessageSquare,
  Users,
  Activity,
  X,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  getSaasWhatsAppInstancesAction,
  getSaasOfficesAction,
} from '@/app/actions/saas-admin';
import {
  generateWhatsAppQR,
  disconnectWhatsApp,
  getWhatsAppStatus,
} from '@/app/actions/whatsapp';
import { createInstance } from '@/lib/evolution-api';
import { cn } from '@/lib/utils';

export default function SaasWhatsappOrchestratorPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeInstance, setActiveInstance] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);

  // New Instance Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadData() {
    try {
      setRefreshing(true);
      const [instRes, offRes] = await Promise.all([
        getSaasWhatsAppInstancesAction(),
        getSaasOfficesAction(),
      ]);

      if (instRes.success && instRes.data) {
        setInstances(instRes.data);
      }
      if (offRes.success && offRes.data) {
        setOffices(offRes.data);
        if (offRes.data[0]) setSelectedOfficeId(offRes.data[0].id);
      }
    } catch (e) {
      console.warn('Error loading whatsapp orchestrator:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenQr = async (instName: string) => {
    setActiveInstance(instName);
    setShowQrModal(true);
    setGeneratingQr(true);
    setQrBase64(null);

    try {
      const res = await generateWhatsAppQR(instName);
      if (res.success && res.qrBase64) {
        setQrBase64(res.qrBase64);
      } else {
        setFeedback(res.error || 'Generando código QR...');
      }
    } catch (err: unknown) {
      setFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDisconnect = async (instName: string) => {
    try {
      await disconnectWhatsApp(instName);
      setFeedback(`Instancia "${instName}" desconectada con éxito.`);
      loadData();
      setTimeout(() => setFeedback(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstanceName.trim()) return;

    setCreating(true);
    try {
      const cleanName = newInstanceName.trim().replace(/[^a-zA-Z0-9_-]/g, '');
      const res = await createInstance(cleanName);
      if (res.success) {
        setFeedback(`Instancia "${cleanName}" aprovisionada en Evolution API.`);
        setShowNewModal(false);
        setNewInstanceName('');
        loadData();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback(res.error || 'Error al crear la instancia');
      }
    } catch (err: unknown) {
      setFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  const totalConnected = instances.filter((i) => i.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-zinc-200/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <span>Orquestador Multi-Instancia de WhatsApp</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supervisa el estado, genera códigos QR y gestiona las instancias dedicadas en Evolution API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-zinc-500', refreshing && 'animate-spin')} />
            <span>Refrescar Estado</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Instancia</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500">Total de Instancias</span>
            <div className="text-2xl font-bold text-zinc-900 mt-1">{instances.length}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500">Instancias Conectadas (Open)</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{totalConnected}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200/80 bg-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500">Instancias Cerradas (Close)</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{instances.length - totalConnected}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Instances Cards */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <span>Instancias en Evolution API Server</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">https://evoapi.rubenroque.com.mx</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instances.map((inst, idx) => {
            const isOpen = inst.status === 'open';

            return (
              <div
                key={idx}
                className={cn(
                  'rounded-xl border bg-white p-5 space-y-4 flex flex-col justify-between shadow-xs transition-all',
                  isOpen ? 'border-emerald-200' : 'border-zinc-200/80'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 font-mono">{inst.instanceName}</span>
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
                          )}
                        ></span>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        Perfil: <span className="text-zinc-800 font-medium">{inst.profileName || 'Sin Nombre'}</span>
                      </div>
                    </div>

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
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Teléfono:</span>
                      <span className="font-mono text-zinc-800 font-medium">{inst.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mensajes Procesados:</span>
                      <span className="text-zinc-900 font-semibold">{inst.messageCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Chats / Contactos:</span>
                      <span className="text-zinc-800">{inst.chatCount || 0} chats / {inst.contactCount || 0} contactos</span>
                    </div>
                  </div>
                </div>

                {/* Instance Control Buttons */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenQr(inst.instanceName)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 py-1.5 rounded-lg transition-colors shadow-xs"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear QR</span>
                  </button>

                  {isOpen && (
                    <button
                      onClick={() => handleDisconnect(inst.instanceName)}
                      className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                      title="Desconectar instancia"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm p-6 text-center space-y-4 shadow-xl relative">
            <h3 className="font-bold text-sm text-zinc-900">Vincular Instancia "{activeInstance}"</h3>
            <p className="text-xs text-zinc-500">
              Abre WhatsApp en el celular del cliente &gt; Dispositivos Vinculados y escanea este código.
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
              onClick={() => {
                setShowQrModal(false);
                loadData();
              }}
              className="w-full py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      )}

      {/* New Instance Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Crear Nueva Instancia en Evolution API</span>
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-zinc-400 hover:text-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInstance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700">Nombre de Instancia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Legislab_DipRoque"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
                />
                <p className="text-[11px] text-zinc-400">
                  Usa letras, números y guiones bajos (sin espacios).
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg hover:bg-zinc-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg shadow-xs flex items-center gap-2"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creating ? 'Creando...' : 'Crear Instancia'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}