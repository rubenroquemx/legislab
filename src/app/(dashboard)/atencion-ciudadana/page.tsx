'use client';


import { getWhatsAppConversacionesAction, sendWhatsAppMessageAction } from '@/app/actions/whatsapp';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquareText,
  Search,
  Phone,
  MessageCircle,
  FolderKanban,
  UserCheck,
  UserPlus,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  MapPin,
  Tag,
  Paperclip,
  CheckCheck,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  QrCode,
  User,
  MoreVertical,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MensajeChat {
  id: string;
  autor: 'ciudadano' | 'agente' | 'nota_interna';
  nombreAutor: string;
  texto: string;
  hora: string;
  fecha: string;
  leido?: boolean;
}

interface ConversacionAtencion {
  id: string;
  ciudadanoNombre: string;
  ciudadanoTelefono: string;
  ciudadanoAvatar: string;
  municipio: string;
  colonia: string;
  ultimoMensaje: string;
  ultimaHora: string;
  noLeidos: number;
  categoria: 'Gestión Médica' | 'Petición de Obra' | 'Audiencia con Diputado' | 'Asesoría Jurídica' | 'Comisión';
  estado: 'sin_asignar' | 'en_atencion' | 'convertido_gestion' | 'cerrado';
  asignadoA: {
    id: string;
    nombre: string;
    cargo: string;
    foto: string;
  } | null;
  folioGestion?: string;
  mensajes: MensajeChat[];
}

const AGENTES_DISPONIBLES = [
  { id: 'usr-1', nombre: 'Dip. Ruben Roque', cargo: 'Diputado Titular', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr-2', nombre: 'Lic. Paulina Rovirosa', cargo: 'Coordinadora de Atención', foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr-3', nombre: 'Ing. Carlos Mendoza', cargo: 'Gestor Territorial', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'usr-4', nombre: 'Lic. Roberto Méndez', cargo: 'Asesor Jurídico', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
];

const INITIAL_CONVERSACIONES: ConversacionAtencion[] = [];

export default function AtencionCiudadanaPage() {
  const [conversaciones, setConversaciones] = useState<ConversacionAtencion[]>(INITIAL_CONVERSACIONES);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'sin_asignar' | 'mis_asignados' | 'gestiones'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [esNotaInterna, setEsNotaInterna] = useState(false);
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [alertaAccion, setAlertaAccion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar conversaciones reales al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('legislab_whatsapp_connected');
    if (saved !== null) {
      setIsWhatsappConnected(saved === 'true');
    }

    async function loadLiveConversations() {
      try {
        setIsLoading(true);
        const res = await getWhatsAppConversacionesAction();
        if (res.success && res.data && res.data.length > 0) {
          setConversaciones(res.data as any);
          setIsWhatsappConnected(true);
          localStorage.setItem('legislab_whatsapp_connected', 'true');
          if (res.data[0]) setSelectedConvId(res.data[0].id);
        }
      } catch (err) {
        console.warn('Error loading live conversations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveConversations();
  }, []);

  const activeConv = (selectedConvId ? conversaciones.find(c => c.id === selectedConvId) : null) || conversaciones[0] || null;

  const filteredConversaciones = conversaciones.filter(c => {
    const matchSearch = c.ciudadanoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.ciudadanoTelefono.includes(searchTerm) ||
                        c.ultimoMensaje.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filtroEstado === 'sin_asignar') return matchSearch && c.estado === 'sin_asignar';
    if (filtroEstado === 'mis_asignados') return matchSearch && c.asignadoA?.id === 'usr-1';
    if (filtroEstado === 'gestiones') return matchSearch && (c.estado === 'convertido_gestion' || !!c.folioGestion);
    return matchSearch;
  });

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !activeConv) return;

    const texto = nuevoMensaje;
    const destinatario = activeConv.ciudadanoTelefono;

    const msg: MensajeChat = {
      id: `msg-${Date.now()}`,
      autor: esNotaInterna ? 'nota_interna' : 'agente',
      nombreAutor: esNotaInterna ? 'Dip. Ruben Roque (Nota Interna)' : 'Dip. Ruben Roque',
      texto: texto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: 'Hoy',
      leido: true
    };

    setConversaciones(prev => prev.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          ultimoMensaje: esNotaInterna ? `[Nota]: ${texto}` : texto,
          ultimaHora: 'Ahora',
          mensajes: [...c.mensajes, msg]
        };
      }
      return c;
    }));

    setNuevoMensaje('');

    if (!esNotaInterna && destinatario) {
      try {
        await sendWhatsAppMessageAction({
          to: destinatario,
          text: texto
        });
      } catch (err) {
        console.warn('Error enviando mensaje WhatsApp:', err);
      }
    }

    setEsNotaInterna(false);
  };

  const handleAsignarAgente = (agenteId: string) => {
    const agente = AGENTES_DISPONIBLES.find(a => a.id === agenteId) || null;
    setConversaciones(prev => prev.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          asignadoA: agente,
          estado: agente ? 'en_atencion' : 'sin_asignar'
        };
      }
      return c;
    }));
    setAlertaAccion(`✓ Conversación asignada a ${agente ? agente.nombre : 'Sin Asignar'}`);
    setTimeout(() => setAlertaAccion(null), 3000);
  };

  const handleConvertirEnGestion = () => {
    if (!activeConv) return;
    const nuevoFolio = `GES-2026-${Math.floor(100 + Math.random() * 900)}`;
    setConversaciones(prev => prev.map(c => {
      if (c.id === activeConv.id) {
        return {
          ...c,
          folioGestion: nuevoFolio,
          estado: 'convertido_gestion'
        };
      }
      return c;
    }));
    setAlertaAccion(`🎉 ¡Gestión creada exitosamente con Folio ${nuevoFolio}! Carpeta de Google Drive generada.`);
    setTimeout(() => setAlertaAccion(null), 4000);
  };

  const plantillasRapidas = [
    'Hola, con gusto le atiende el equipo del Dip. Ruben Roque. ¿Nos podría compartir su nombre completo y colonia?',
    'Estimado(a) ciudadano(a), recibimos su petición. Para formalizar el oficio de gestión necesitamos copia de su INE y comprobante de domicilio.',
    'Le informamos que su solicitud ya fue canalizada formalmente con número de expediente oficial.'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2.5">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold",
          isWhatsappConnected
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/60"
        )}>
          <span className={cn(
            "h-2 w-2 rounded-full",
            isWhatsappConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )}></span>
          <span>{isWhatsappConnected ? "WhatsApp Conectado (+52 993 111 2233)" : "WhatsApp Desconectado"}</span>
        </div>

        <Link
          href="/configuracion?tab=conexiones"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <QrCode className="h-3.5 w-3.5 text-blue-600" />
          <span>Configurar Conector QR</span>
        </Link>
      </div>

      {/* ALERTA EN CASO DE DESCONEXIÓN */}
      {!isWhatsappConnected && (
        <div className="p-4 bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shrink-0 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-red-900">
                ⚠️ Conector de WhatsApp Gateway Desconectado
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                La bandeja de entrada no puede recibir mensajes de ciudadanos ni sincronizar respuestas en vivo. Escanea el código QR para reactivar la sesión.
              </p>
            </div>
          </div>

          <Link
            href="/configuracion?tab=conexiones"
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <QrCode className="h-4 w-4" />
            <span>Vincular WhatsApp en Conexiones</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Alerta de Acción (Toast) */}
      {alertaAccion && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{alertaAccion}</span>
          <button onClick={() => setAlertaAccion(null)} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* MAIN INBOX INTERFACE (3 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-auto lg:h-[calc(100vh-220px)] min-h-[500px]">
        {/* COLUMNA 1: LISTA DE CONVERSACIONES (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col overflow-hidden">
          {/* Top Search & Filter Tabs */}
          <div className="p-3.5 border-b border-zinc-100 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar ciudadano o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-xs">
              <button
                onClick={() => setFiltroEstado('todos')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors',
                  filtroEstado === 'todos' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Todos ({conversaciones.length})
              </button>
              <button
                onClick={() => setFiltroEstado('sin_asignar')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors',
                  filtroEstado === 'sin_asignar' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Sin Asignar ({conversaciones.filter(c => c.estado === 'sin_asignar').length})
              </button>
              <button
                onClick={() => setFiltroEstado('mis_asignados')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors',
                  filtroEstado === 'mis_asignados' ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Mis Chats
              </button>
              <button
                onClick={() => setFiltroEstado('gestiones')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors',
                  filtroEstado === 'gestiones' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Con Folio
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-semibold text-gray-600">Cargando conversaciones...</p>
              </div>
            ) : filteredConversaciones.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MessageCircle className="h-6 w-6 mx-auto text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">No hay conversaciones</p>
                <p className="text-[11px] text-gray-500">
                  {isWhatsappConnected ? 'No se detectaron mensajes en la bandeja de entrada.' : 'Conecta WhatsApp en Conexiones para activar la bandeja.'}
                </p>
              </div>
            ) : (
              filteredConversaciones.map((conv) => {
                const isSelected = activeConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={cn(
                      'p-3.5 flex items-start gap-3 cursor-pointer transition-all text-left',
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-zinc-50/80'
                    )}
                  >
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={conv.ciudadanoAvatar}
                        alt={conv.ciudadanoNombre}
                        className="h-10 w-10 rounded-full object-cover border border-zinc-200"
                      />
                      {conv.noLeidos > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {conv.noLeidos}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {conv.ciudadanoNombre}
                        </p>
                        <span className="text-[10px] text-zinc-400 shrink-0 font-medium">
                          {conv.ultimaHora}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-500 truncate leading-relaxed">
                        {conv.ultimoMensaje}
                      </p>

                      <div className="flex items-center justify-between gap-1 pt-1">
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-gray-600">
                          {conv.categoria}
                        </span>

                        {conv.folioGestion ? (
                          <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {conv.folioGestion}
                          </span>
                        ) : conv.asignadoA ? (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={conv.asignadoA.foto} alt="" className="h-3.5 w-3.5 rounded-full" />
                            <span className="truncate max-w-[80px]">{conv.asignadoA.nombre.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Sin Asignar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA 2: CHAT ACTIVO EN TIEMPO REAL (5 Cols) */}
        {activeConv ? (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
              <div className="flex items-center gap-3 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeConv.ciudadanoAvatar}
                  alt={activeConv.ciudadanoNombre}
                  className="h-10 w-10 rounded-full object-cover border border-zinc-200 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                    {activeConv.ciudadanoNombre}
                  </h3>
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <span className="text-green-600 font-mono font-medium">{activeConv.ciudadanoTelefono}</span>
                    <span>•</span>
                    <span>{activeConv.colonia}</span>
                  </p>
                </div>
              </div>

              {/* Selector de Asignación */}
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={activeConv.asignadoA?.id || ''}
                  onChange={(e) => handleAsignarAgente(e.target.value)}
                  className="text-xs bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 font-semibold text-zinc-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                >
                  <option value="">👤 Sin Asignar</option>
                  {AGENTES_DISPONIBLES.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      👤 {ag.nombre} ({ag.cargo.split(' ')[0]})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8f9fa]">
              {activeConv.mensajes.map((msg) => {
                if (msg.autor === 'nota_interna') {
                  return (
                    <div key={msg.id} className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 my-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-800">
                        <span>🔒 NOTA INTERNA DE EQUIPO</span>
                        <span>{msg.hora}</span>
                      </div>
                      <p className="leading-relaxed font-medium">{msg.texto}</p>
                    </div>
                  );
                }

                const isAgente = msg.autor === 'agente';

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col max-w-[80%]',
                      isAgente ? 'ml-auto items-end' : 'mr-auto items-start'
                    )}
                  >
                    <span className="text-[10px] text-zinc-400 font-medium px-1 mb-0.5">
                      {msg.nombreAutor}
                    </span>
                    <div
                      className={cn(
                        'p-3 rounded-2xl text-xs leading-relaxed shadow-2xs',
                        isAgente
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-xs'
                      )}
                    >
                      <p>{msg.texto}</p>
                      <div className={cn(
                        'flex items-center justify-end gap-1 text-[9px] mt-1',
                        isAgente ? 'text-blue-100' : 'text-zinc-400'
                      )}>
                        <span>{msg.hora}</span>
                        {isAgente && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Answers Dropdown */}
            <div className="px-3 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-bold text-zinc-400 shrink-0">Respuestas Rápidas:</span>
              {[
                'Hola, le atiende el equipo del Dip. Ruben Roque.',
                'Con gusto le damos seguimiento a su solicitud.',
                '¿Nos podría proporcionar su dirección y municipio?',
                'Su folio de gestión ha sido generado con éxito.'
              ].map((plantilla, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setNuevoMensaje(plantilla)}
                  className="text-[11px] bg-white hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-zinc-200 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors"
                >
                  {plantilla.slice(0, 32)}...
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleEnviarMensaje} className="p-3 border-t border-zinc-200 bg-white space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={esNotaInterna}
                    onChange={(e) => setEsNotaInterna(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                  <span>🔒 Escribir como Nota Interna (Privada para el equipo)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={esNotaInterna ? "Escribe un comentario privado para el equipo..." : "Escribe un mensaje de WhatsApp para el ciudadano..."}
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  className={cn(
                    "flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none transition-colors",
                    esNotaInterna
                      ? "bg-amber-50 border-amber-300 text-amber-900 placeholder-amber-500"
                      : "bg-zinc-50 border-zinc-200 text-zinc-800 placeholder-gray-400 focus:border-blue-500"
                  )}
                />

                <button
                  type="submit"
                  className={cn(
                    "p-2.5 rounded-xl text-white shadow-xs transition-all",
                    esNotaInterna ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-center p-8 text-center text-zinc-400 text-xs">
            Selecciona una conversación para abrir el chat en vivo.
          </div>
        )}

        {/* COLUMNA 3: EXPEDIENTE CIUDADANO Y GESTIÓN DIRECTA (3 Cols) */}
        {activeConv ? (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs p-4.5 space-y-4 flex flex-col overflow-y-auto">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Expediente Ciudadano
              </h3>
              <div className="mt-3 text-center space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeConv.ciudadanoAvatar}
                  alt={activeConv.ciudadanoNombre}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-sm mx-auto"
                />
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{activeConv.ciudadanoNombre}</h4>
                  <p className="text-xs text-zinc-500">{activeConv.colonia}, {activeConv.municipio}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Teléfono:</span>
                <span className="font-bold text-zinc-800">{activeConv.ciudadanoTelefono}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Municipio:</span>
                <span className="font-semibold text-blue-600">{activeConv.municipio}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tipo de Trámite:</span>
                <span className="font-bold text-zinc-800">{activeConv.categoria}</span>
              </div>
            </div>

            {/* Botón Convertir en Gestión */}
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <h4 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <FolderKanban className="h-4 w-4 text-blue-600" />
                Gestión Legislativa / Social
              </h4>

              {activeConv.folioGestion ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span>Folio Asignado:</span>
                    <span className="font-mono text-xs">{activeConv.folioGestion}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">Carpeta creada en Google Drive con ID de gestión.</p>
                  <Link
                    href={`/gestiones?folio=${activeConv.folioGestion}`}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 pt-1"
                  >
                    <span>Ver Expediente en Gestiones</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleConvertirEnGestion}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generar Gestión (Crear Folio)</span>
                </button>
              )}
            </div>

            {/* Enlaces Rápidos */}
            <div className="pt-2 border-t border-zinc-100 space-y-1.5 text-xs">
              <a
                href={`https://wa.me/52${activeConv.ciudadanoTelefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Abrir en WhatsApp Web</span>
                </div>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={`tel:${activeConv.ciudadanoTelefono}`}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 text-zinc-700 hover:bg-zinc-100 font-semibold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Llamar al Ciudadano</span>
                </div>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-center p-8 text-center text-zinc-400 text-xs">
            Expediente del ciudadano.
          </div>
        )}
      </div>
    </div>
  );
}