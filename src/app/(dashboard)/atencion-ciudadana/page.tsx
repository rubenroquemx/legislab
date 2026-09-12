'use client';

import { 
  getWhatsAppConversacionesAction, 
  sendWhatsAppMessageAction,
  getWhatsAppStatus,
  getWhatsAppInstanceInfo
} from '@/app/actions/whatsapp';
import { createGestion } from '@/app/actions/gestiones';
import { getCurrentTimeMexicoCity, MEXICO_TIMEZONE } from '@/lib/date-utils';
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
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotaInternaItem {
  id: string;
  convId: string;
  autor: string;
  texto: string;
  fecha: string;
  hora: string;
}

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
  remoteJid?: string;
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
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [alertaAccion, setAlertaAccion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Notas Rápidas Internas
  const [notasRapidas, setNotasRapidas] = useState<NotaInternaItem[]>([]);
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');

  // Modal Nueva Gestión
  const [showModalGestion, setShowModalGestion] = useState(false);
  const [formAsunto, setFormAsunto] = useState('');
  const [formSolicitante, setFormSolicitante] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formColonia, setFormColonia] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('Centro');
  const [formCategoria, setFormCategoria] = useState('Gestión Médica');
  const [formPrioridad, setFormPrioridad] = useState('Media');
  const [guardandoGestion, setGuardandoGestion] = useState(false);

  // Cargar conversaciones reales y estado de WhatsApp al iniciar
  useEffect(() => {
    async function checkAndLoad() {
      try {
        setIsLoading(true);
        const statusRes = await getWhatsAppStatus();
        if (statusRes.success && statusRes.isConnected) {
          setIsWhatsappConnected(true);
          const infoRes = await getWhatsAppInstanceInfo();
          if (infoRes.success && infoRes.data?.phone) {
            setConnectedPhone(infoRes.data.phone);
          }
          const res = await getWhatsAppConversacionesAction();
          if (res.success && res.isConnected !== false && res.data && res.data.length > 0) {
            setConversaciones(res.data as any);
            if (res.data[0]) setSelectedConvId(res.data[0].id);
          } else {
            setConversaciones([]);
            setSelectedConvId('');
          }
        } else {
          setIsWhatsappConnected(false);
          setConnectedPhone(null);
          setConversaciones([]);
          setSelectedConvId('');
        }
      } catch (err) {
        console.warn('Error loading live conversations:', err);
        setIsWhatsappConnected(false);
        setConversaciones([]);
        setSelectedConvId('');
      } finally {
        setIsLoading(false);
      }
    }
    checkAndLoad();
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
    const destinatario = activeConv.remoteJid || activeConv.ciudadanoTelefono;

    const msg: MensajeChat = {
      id: `msg-${Date.now()}`,
      autor: esNotaInterna ? 'nota_interna' : 'agente',
      nombreAutor: esNotaInterna ? 'Dip. Ruben Roque (Nota Interna)' : 'Dip. Ruben Roque',
      texto: texto,
      hora: getCurrentTimeMexicoCity(),
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
        const res = await sendWhatsAppMessageAction({
          to: destinatario,
          text: texto
        });
        if (res.success) {
          setAlertaAccion('✓ Mensaje enviado a WhatsApp');
          setTimeout(() => setAlertaAccion(null), 3000);
        } else {
          setAlertaAccion('⚠️ WhatsApp: ' + (res.error || 'No se pudo enviar'));
          setTimeout(() => setAlertaAccion(null), 5000);
        }
      } catch (err) {
        console.warn('Error enviando mensaje WhatsApp:', err);
        setAlertaAccion('⚠️ Error enviando a WhatsApp');
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

  const handleAgregarNotaRapida = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNotaTexto.trim() || !activeConv) return;

    const newNote: NotaInternaItem = {
      id: `nota-${Date.now()}`,
      convId: activeConv.id,
      autor: 'Dip. Ruben Roque',
      texto: nuevaNotaTexto.trim(),
      fecha: new Date().toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: 'numeric', month: 'short' }),
      hora: getCurrentTimeMexicoCity(),
    };

    const updated = [newNote, ...notasRapidas];
    setNotasRapidas(updated);
    try {
      localStorage.setItem('legislab_notas_internas', JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving notas to localStorage:', e);
    }
    setNuevaNotaTexto('');
    setAlertaAccion('✓ Nota rápida registrada y guardada');
    setTimeout(() => setAlertaAccion(null), 3000);
  };

  const handleCrearGestionDesdeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv) return;
    setGuardandoGestion(true);
    try {
      const res = await createGestion({
        asunto: formAsunto || 'Gestión canalizada desde Atención Ciudadana',
        solicitante: formSolicitante || activeConv.ciudadanoNombre,
        colonia: formColonia || 'Centro',
        telefono: formTelefono || activeConv.ciudadanoTelefono,
        categoria: formCategoria,
        prioridad: formPrioridad,
      });

      const nuevoFolio = res.success && res.data && res.data.folio 
        ? res.data.folio 
        : `GES-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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

      // Guardar también en respaldo local
      try {
        const savedGestiones = localStorage.getItem('legislab_gestiones_offline') || '[]';
        const list = JSON.parse(savedGestiones);
        list.unshift({
          id: `ges-${Date.now()}`,
          folio: nuevoFolio,
          asunto: formAsunto,
          solicitante: formSolicitante || activeConv.ciudadanoNombre,
          telefono: formTelefono || activeConv.ciudadanoTelefono,
          colonia: formColonia,
          categoria: formCategoria,
          prioridad: formPrioridad,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('legislab_gestiones_offline', JSON.stringify(list));
      } catch (e) {
        console.warn('Error saving gestion to localStorage:', e);
      }

      setShowModalGestion(false);
      setAlertaAccion(`🎉 ¡Gestión creada con éxito! Folio: ${nuevoFolio}`);
      setTimeout(() => setAlertaAccion(null), 4000);
    } catch (err) {
      setAlertaAccion('⚠️ Error creando gestión: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setGuardandoGestion(false);
    }
  };

  const currentNotas = activeConv ? notasRapidas.filter(n => n.convId === activeConv.id) : [];

  const plantillasRapidas = [
    'Hola, con gusto le atiende el equipo del Dip. Ruben Roque. ¿Nos podría compartir su nombre completo y colonia?',
    'Estimado(a) ciudadano(a), recibimos su petición. Para formalizar el oficio de gestión necesitamos copia de su INE y comprobante de domicilio.',
    'Le informamos que su solicitud ya fue canalizada formalmente con número de expediente oficial.'
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* iOS Large Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 pb-1">
        <div className="space-y-0.5">
          <h1 className="text-ios-large-title font-bold text-[#0B172D] tracking-tight">
            Atención Ciudadana
          </h1>
          <p className="text-ios-subhead text-[#8E8E93]">
            Bandeja omnicanal de WhatsApp oficial y canalización de peticiones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-[10px] border text-xs font-semibold",
            isWhatsappConnected
              ? "bg-[#EBF9EE] text-[#34C759] border-[#34C759]/30"
              : "bg-red-50 text-red-600 border-red-200"
          )}>
            <span className={cn(
              "h-2 w-2 rounded-full",
              isWhatsappConnected ? "bg-[#34C759] animate-pulse" : "bg-red-500"
            )}></span>
            <span>{isWhatsappConnected ? (connectedPhone ? `Conectado (${connectedPhone})` : "WhatsApp Conectado") : "Desconectado"}</span>
          </div>

          <Link
            href="/configuracion?tab=conexiones"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0B172D] border border-[#E5E5EA] rounded-[10px] text-xs font-semibold shadow-xs hover:bg-[#F3F5F9] ios-press"
          >
            <QrCode className="h-3.5 w-3.5 text-[#1B62E3]" />
            <span>Conector QR</span>
          </Link>
        </div>
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

        {/* COLUMNA 3: EXPEDIENTE CIUDADANO & NOTAS RÁPIDAS (3 Cols) */}
        {activeConv ? (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs p-3.5 space-y-3.5 flex flex-col overflow-y-auto">
            {/* Encabezado Expediente */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Expediente
              </h3>
              {activeConv.folioGestion && (
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {activeConv.folioGestion}
                </span>
              )}
            </div>

            {/* Perfil del Ciudadano */}
            <div className="text-center space-y-2 py-1">
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

            {/* Ficha Rápida */}
            <div className="space-y-1.5 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-600">
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

            {/* 3 BOTONES DE ACCIÓN */}
            <div className="space-y-2 pt-1">
              {/* Botón 1: Generar gestión */}
              <button
                type="button"
                onClick={() => {
                  setFormSolicitante(activeConv.ciudadanoNombre);
                  setFormTelefono(activeConv.ciudadanoTelefono);
                  setFormColonia(activeConv.colonia || 'Centro');
                  setFormMunicipio(activeConv.municipio || 'Centro');
                  setFormAsunto(activeConv.ultimoMensaje && activeConv.ultimoMensaje !== 'Conversación iniciada' ? activeConv.ultimoMensaje : '');
                  setFormCategoria(activeConv.categoria || 'Gestión Médica');
                  setFormPrioridad('Media');
                  setShowModalGestion(true);
                }}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generar gestión</span>
              </button>

              {/* Botón 2: Abrir en WhatsApp */}
              <a
                href={`https://wa.me/52${activeConv.ciudadanoTelefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-xl text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Abrir en WhatsApp</span>
              </a>

              {/* Botón 3: Llamar (Solo versión móvil) */}
              <a
                href={`tel:${activeConv.ciudadanoTelefono.replace(/\D/g, '')}`}
                className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 font-bold rounded-xl text-xs shadow-2xs flex sm:hidden items-center justify-center gap-2 transition-colors"
              >
                <Phone className="h-4 w-4 text-zinc-600" />
                <span>Llamar</span>
              </a>
            </div>

            {/* SECCIÓN NOTA RÁPIDA (COMUNICACIÓN INTERNA DEL EQUIPO) */}
            <div className="pt-3 border-t border-zinc-100 space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  <span>Nota rápida</span>
                </h4>
                <span className="text-[10px] text-zinc-400 font-medium">Uso interno</span>
              </div>

              {/* Stream de globos de notas */}
              <div className="flex-1 min-h-[120px] max-h-[220px] overflow-y-auto space-y-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-100 text-xs">
                {currentNotas.length === 0 ? (
                  <div className="text-center py-6 space-y-1">
                    <p className="text-[11px] text-zinc-400">Sin notas internas aún.</p>
                    <p className="text-[10px] text-zinc-400">Escribe abajo para registrar acuerdos del equipo.</p>
                  </div>
                ) : (
                  currentNotas.map((nota) => (
                    <div key={nota.id} className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                        <span className="text-blue-600">{nota.autor}</span>
                        <span>{nota.hora} • {nota.fecha}</span>
                      </div>
                      <p className="text-zinc-800 text-xs leading-relaxed">{nota.texto}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input para agregar nota */}
              <form onSubmit={handleAgregarNotaRapida} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Escribe una nota rápida..."
                  value={nuevaNotaTexto}
                  onChange={(e) => setNuevaNotaTexto(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-blue-500 text-zinc-800 placeholder-zinc-400"
                />
                <button
                  type="submit"
                  disabled={!nuevaNotaTexto.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl shadow-xs transition-colors"
                  title="Enviar nota"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs flex items-center justify-center p-8 text-center text-zinc-400 text-xs">
            Expediente del ciudadano.
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: GENERAR NUEVA GESTIÓN
         ========================================================================= */}
      {showModalGestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Generar Nueva Gestión</h3>
                  <p className="text-[11px] text-gray-500">Canalizar petición a la bandeja de Gestiones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModalGestion(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCrearGestionDesdeModal} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Nombre del Solicitante</label>
                <input
                  type="text"
                  required
                  value={formSolicitante}
                  onChange={(e) => setFormSolicitante(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Colonia / Localidad</label>
                  <input
                    type="text"
                    value={formColonia}
                    onChange={(e) => setFormColonia(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Categoría</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 font-semibold"
                  >
                    <option value="Gestión Médica">Gestión Médica / Salud</option>
                    <option value="Petición de Obra">Petición de Obra / Servicios</option>
                    <option value="Asesoría Jurídica">Asesoría Jurídica</option>
                    <option value="Apoyo Social">Apoyo Social / Bienestar</option>
                    <option value="Audiencia con Diputado">Audiencia con Diputado</option>
                    <option value="General">General / Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Prioridad</label>
                  <select
                    value={formPrioridad}
                    onChange={(e) => setFormPrioridad(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 font-semibold"
                  >
                    <option value="Alta">Alta (Urgente)</option>
                    <option value="Media">Media (Ordinaria)</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Asunto / Descripción de la Petición</label>
                <textarea
                  rows={3}
                  required
                  value={formAsunto}
                  onChange={(e) => setFormAsunto(e.target.value)}
                  placeholder="Describe la solicitud o requerimiento ciudadano..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModalGestion(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoGestion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {guardandoGestion ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Creando Folio...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Registrar y Crear Folio</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}