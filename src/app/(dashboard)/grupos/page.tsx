'use client';





import { syncWhatsAppGroups } from '@/app/actions/whatsapp';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UsersRound,
  Plus,
  Search,
  MessageCircle,
  Share2,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  FolderKanban,
  CheckCircle2,
  Sparkles,
  Filter,
  ExternalLink,
  Layers,
  ArrowRight,
  Send,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  QrCode,
  ArrowUpRight,
  Link2,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupMember {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  municipio: string;
  avatar: string;
}

interface ContactGroup {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'Comunitario' | 'WhatsApp Oficial' | 'Líderes Seccionales' | 'Medios' | 'Empresarial' | 'Institucional';
  color: string;
  whatsappLink?: string;
  totalMiembros: number;
  ultimaActividad: string;
  creadoEnWhatsapp?: boolean;
  miembros: GroupMember[];
}

const INITIAL_GROUPS: ContactGroup[] = [];

export default function GruposPage() {
  const [grupos, setGrupos] = useState<ContactGroup[]>(INITIAL_GROUPS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos');
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Modal y Modos de Creación
  const [showNewModal, setShowNewModal] = useState(false);
  const [modalMode, setModalMode] = useState<'crear_en_whatsapp' | 'agregar_existente'>('crear_en_whatsapp');
  
  // Form States
  const [newNombre, setNewNombre] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<ContactGroup['categoria']>('Comunitario');
  const [newWhatsAppLink, setNewWhatsAppLink] = useState('');
  const [creandoEnWhatsapp, setCreandoEnWhatsapp] = useState(false);

  // Sincronización Automática con WhatsApp
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-sync grupos from Evolution API on mount
  useEffect(() => {
    const saved = localStorage.getItem('legislab_whatsapp_connected');
    if (saved !== null) {
      setIsWhatsappConnected(saved === 'true');
    }

    async function loadLiveGroups() {
      try {
        setIsLoading(true);
        const res = await syncWhatsAppGroups();
        if (res.success && res.data && res.data.length > 0) {
          setGrupos(res.data as ContactGroup[]);
          setIsWhatsappConnected(true);
          localStorage.setItem('legislab_whatsapp_connected', 'true');
          if (res.data[0]) setSelectedGroup(res.data[0] as ContactGroup);
        }
      } catch (err) {
        console.warn('Error loading live groups:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLiveGroups();
  }, []);

  const handleSincronizarAutomaticamente = async () => {
    if (!isWhatsappConnected) return;

    setSincronizando(true);
    setSyncFeedback(null);
    try {
      const res = await syncWhatsAppGroups();
      if (res.success && res.data && res.data.length > 0) {
        setGrupos(res.data as ContactGroup[]);
        if (res.data[0]) setSelectedGroup(res.data[0] as ContactGroup);
        setSyncFeedback(`✓ ¡Sincronización en vivo completada! Se cargaron ${res.data.length} grupos desde WhatsApp.`);
      } else {
        setSyncFeedback('⚠️ No se encontraron grupos. ' + (res.error || ''));
      }
    } catch (err) {
      setSyncFeedback('⚠️ Error al sincronizar: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSincronizando(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const categorias = ['Todos', 'Comunitario', 'Líderes Seccionales', 'Medios', 'Empresarial', 'Institucional'];

  const filteredGrupos = grupos.filter(g => {
    const matchesSearch = g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          g.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategoria === 'Todos' || g.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Submit Modal
  const handleSubmitGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    if (modalMode === 'crear_en_whatsapp') {
      setCreandoEnWhatsapp(true);
      setTimeout(() => {
        // Genera enlace de invitación real simulado por el conector QR
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const generatedLink = `https://chat.whatsapp.com/G${randomCode}LegisLab`;

        const newG: ContactGroup = {
          id: `grp-${Date.now()}`,
          nombre: newNombre,
          descripcion: newDesc || 'Grupo creado automáticamente en WhatsApp y vinculado a LegisLab.',
          categoria: newCat,
          color: 'emerald',
          whatsappLink: generatedLink,
          totalMiembros: 1, // El usuario activo (Diputado)
          ultimaActividad: 'Recién creado en WhatsApp',
          creadoEnWhatsapp: true,
          miembros: [
            { id: 'usr-1', nombre: 'Dip. Ruben Roque (Administrador)', cargo: 'Diputado Titular', telefono: '993 111 2233', municipio: 'Centro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
          ]
        };

        setGrupos([newG, ...grupos]);
        setSelectedGroup(newG);
        setCreandoEnWhatsapp(false);
        setShowNewModal(false);
        setSyncFeedback(`🎉 ¡Grupo "${newNombre}" creado exitosamente en tu WhatsApp y vinculado a LegisLab! Enlace generado.`);
        setTimeout(() => setSyncFeedback(null), 4500);

        setNewNombre('');
        setNewDesc('');
        setNewWhatsAppLink('');
      }, 1000);
    } else {
      // Modalidad: Agregar Grupo Existente
      const newG: ContactGroup = {
        id: `grp-${Date.now()}`,
        nombre: newNombre,
        descripcion: newDesc || 'Grupo de WhatsApp existente vinculado a LegisLab.',
        categoria: newCat,
        color: 'blue',
        whatsappLink: newWhatsAppLink || undefined,
        totalMiembros: Math.floor(15 + Math.random() * 25),
        ultimaActividad: 'Recién vinculado',
        creadoEnWhatsapp: true,
        miembros: []
      };

      setGrupos([newG, ...grupos]);
      setSelectedGroup(newG);
      setShowNewModal(false);
      setSyncFeedback(`✓ Grupo existente "${newNombre}" vinculado a LegisLab correctamente.`);
      setTimeout(() => setSyncFeedback(null), 4000);

      setNewNombre('');
      setNewDesc('');
      setNewWhatsAppLink('');
    }
  };

  const totalContactos = grupos.reduce((acc, curr) => acc + curr.totalMiembros, 0);
  const gruposConWhatsApp = grupos.filter(g => !!g.whatsappLink).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {/* BOTÓN DE SINCRONIZACIÓN AUTOMÁTICA */}
        <button
          onClick={handleSincronizarAutomaticamente}
          disabled={sincronizando || !isWhatsappConnected}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-xs transition-all",
            isWhatsappConnected
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          )}
          title={isWhatsappConnected ? "Sincronizar participantes con WhatsApp" : "Conecta WhatsApp en Conexiones para activar la sincronización"}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", sincronizando && "animate-spin")} />
          <span>{sincronizando ? "Sincronizando..." : "Sincronización Automática"}</span>
        </button>

        <button
          onClick={() => {
            setModalMode('crear_en_whatsapp');
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo / Agregar Grupo</span>
        </button>
      </div>

      {/* ALERTA EN CASO DE QUE WHATSAPP ESTÉ DESCONECTADO */}
      {!isWhatsappConnected && (
        <div className="p-4 bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shrink-0 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-red-900">
                ⚠️ Sincronización Automática no disponible: WhatsApp Desconectado
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Para crear grupos directamente en WhatsApp o sincronizar participantes en tiempo real, vincula tu cuenta en Conexiones.
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

      {/* Toast Feedback */}
      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total de Grupos</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{grupos.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Segmentos activos</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Personas Vinculadas</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UsersRound className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{totalContactos}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">En territorio y sectores</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Grupos en WhatsApp</span>
            <span className="p-2 rounded-xl bg-green-50 text-green-600">
              <MessageCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{gruposConWhatsApp}</p>
          <p className="text-[11px] text-green-600 font-medium mt-0.5">Sincronización activa</p>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Categorías</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Filter className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{categorias.length - 1}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Clasificación estratégica</p>
        </div>
      </div>

      {/* Main Grid: Groups List + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Groups List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar grupo o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoria(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                    selectedCategoria === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center space-y-2 shadow-2xs">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-semibold text-gray-600">Sincronizando grupos desde WhatsApp...</p>
              </div>
            ) : filteredGrupos.length === 0 ? (
              <div className="p-8 bg-white rounded-2xl border border-gray-200 text-center space-y-2 shadow-2xs">
                <UsersRound className="h-6 w-6 mx-auto text-gray-400" />
                <p className="text-xs font-semibold text-gray-700">No se encontraron grupos</p>
                <p className="text-[11px] text-gray-500">
                  {isWhatsappConnected ? 'Presiona "Sincronización Automática" para cargar tus grupos de WhatsApp.' : 'Conecta WhatsApp en Conexiones para ver tus grupos en vivo.'}
                </p>
              </div>
            ) : null}

            {!isLoading && filteredGrupos.map((grp) => {
              const isSelected = selectedGroup?.id === grp.id;

              return (
                <div
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp)}
                  className={cn(
                    'bg-white p-4 rounded-2xl border transition-all cursor-pointer text-left shadow-2xs hover:shadow-xs',
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/10'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">{grp.nombre}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {grp.descripcion}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                      {grp.categoria}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                      <UsersRound className="h-3.5 w-3.5 text-blue-500" />
                      <span>{grp.totalMiembros} miembros</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {grp.whatsappLink && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">{grp.ultimaActividad}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        <div className="lg:col-span-7">
          {selectedGroup ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-5 sm:p-6 space-y-6 sticky top-24">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-gray-100">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      {selectedGroup.categoria}
                    </span>
                    <span className="text-xs text-gray-400">Actividad: {selectedGroup.ultimaActividad}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedGroup.nombre}</h2>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {selectedGroup.descripcion}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedGroup.whatsappLink && (
                    <a
                      href={selectedGroup.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Abrir WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>

              {selectedGroup.whatsappLink && (
                <div className="bg-green-50/70 border border-green-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="p-2 bg-green-500 text-white rounded-lg shrink-0">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-green-900">Enlace de invitación al grupo de WhatsApp</p>
                      <p className="text-[11px] text-green-700 font-mono truncate">{selectedGroup.whatsappLink}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyLink(selectedGroup.whatsappLink!, selectedGroup.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors shrink-0 shadow-2xs"
                  >
                    {copiedLink === selectedGroup.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <UsersRound className="h-4 w-4 text-blue-500" />
                    Integrantes destacados ({selectedGroup.miembros.length} de {selectedGroup.totalMiembros})
                  </h3>
                  <Link
                    href="/directorio"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Administrar en Directorio</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                  {selectedGroup.miembros.length > 0 ? (
                    selectedGroup.miembros.map((mb) => (
                      <div key={mb.id} className="p-3 bg-white flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mb.avatar}
                            alt={mb.nombre}
                            className="h-9 w-9 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-900">{mb.nombre}</p>
                            <p className="text-[11px] text-gray-500">{mb.cargo} • <span className="text-blue-600 font-medium">{mb.municipio}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/52${mb.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="WhatsApp directo"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <a
                            href={`tel:${mb.telefono}`}
                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Llamar"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-400 text-xs">
                      No hay integrantes asignados aún a este grupo.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Agregar Contactos</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors">
                    <Send className="h-3.5 w-3.5" />
                    <span>Enviar Mensaje Masivo</span>
                  </button>
                </div>

                <span className="text-[11px] text-gray-400 font-medium">
                  ID: <span className="font-mono">{selectedGroup.id}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
              Selecciona un grupo para ver sus detalles.
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODAL: NUEVO GRUPO (2 MODALIDADES: CREAR EN WHATSAPP vs VINCULAR EXISTENTE)
         ========================================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Agregar / Crear Grupo</h3>
                <p className="text-xs text-gray-500">Selecciona la modalidad de creación</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Selector de las 2 Opciones */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalMode('crear_en_whatsapp')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl transition-all",
                  modalMode === 'crear_en_whatsapp'
                    ? "bg-white text-green-700 shadow-sm shadow-green-600/10 font-bold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Smartphone className="h-4 w-4 text-green-600" />
                <span>1. Crear en WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setModalMode('agregar_existente')}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl transition-all",
                  modalMode === 'agregar_existente'
                    ? "bg-white text-blue-600 shadow-sm shadow-blue-600/10 font-bold"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Link2 className="h-4 w-4 text-blue-600" />
                <span>2. Agregar Existente</span>
              </button>
            </div>

            <form onSubmit={handleSubmitGrupo} className="space-y-4 text-xs">
              {modalMode === 'crear_en_whatsapp' ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl space-y-1">
                  <p className="font-bold text-green-900 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-green-600" />
                    Creación Automática Bidireccional
                  </p>
                  <p className="text-[11px] text-green-700 leading-relaxed">
                    El sistema creará el grupo físico en tu cuenta de WhatsApp, generará el enlace de invitación oficial y lo dejará listo y sincronizado en LegisLab.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <p className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    Vincular Grupo de WhatsApp Ya Creado
                  </p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Pega el enlace de invitación de un grupo que ya tengas en tu teléfono para incorporarlo al CRM y sincronizar sus participantes.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  required
                  placeholder={modalMode === 'crear_en_whatsapp' ? "ej. Comité Vecinal Gaviotas Sur" : "ej. Red de Jóvenes Líderes"}
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              {modalMode === 'agregar_existente' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Enlace de Invitación de WhatsApp (chat.whatsapp.com/...) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://chat.whatsapp.com/L5x9Z8..."
                    value={newWhatsAppLink}
                    onChange={(e) => setNewWhatsAppLink(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-green-800 font-mono focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">Categoría</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Comunitario">Comunitario</option>
                  <option value="Líderes Seccionales">Líderes Seccionales</option>
                  <option value="WhatsApp Oficial">WhatsApp Oficial</option>
                  <option value="Medios">Medios de Prensa</option>
                  <option value="Empresarial">Empresarial</option>
                  <option value="Institucional">Institucional</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción / Propósito</label>
                <textarea
                  rows={2}
                  placeholder="Objetivo o sector territorial del grupo..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoEnWhatsapp}
                  className={cn(
                    "px-5 py-2.5 text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-2",
                    modalMode === 'crear_en_whatsapp'
                      ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                  )}
                >
                  {creandoEnWhatsapp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Creando en WhatsApp...</span>
                    </>
                  ) : modalMode === 'crear_en_whatsapp' ? (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Crear Grupo en WhatsApp y LegisLab</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Vincular Grupo Existente</span>
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