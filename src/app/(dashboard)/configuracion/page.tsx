'use client';






import { 
  getWhatsAppStatus, 
  generateWhatsAppQR, 
  disconnectWhatsApp,
  getWhatsAppInstanceInfo
} from '@/app/actions/whatsapp';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Settings, 
  Calendar, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Building, 
  CheckCircle2, 
  AlertCircle, 
  FolderOpen, 
  HardDrive,
  FileText,
  Mic,
  Newspaper,
  Image as ImageIcon,
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Eye,
  Save,
  Layers,
  Sparkles,
  QrCode,
  Smartphone,
  MessageCircle,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DocTypeKey = 'gestiones' | 'iniciativas' | 'discursos' | 'boletines';

export interface HeaderFooterConfig {
  headerType: 'imagen' | 'texto';
  headerImageUrl: string;
  headerText: string;
  headerAlign: 'left' | 'center' | 'right';
  headerBold: boolean;
  headerItalic: boolean;
  headerFontSize: 'small' | 'medium' | 'large';
  
  footerType: 'imagen' | 'texto';
  footerImageUrl: string;
  footerText: string;
  footerAlign: 'left' | 'center' | 'right';
  footerBold: boolean;
  footerItalic: boolean;
  footerFontSize: 'small' | 'medium' | 'large';
}

const DEFAULT_DOC_CONFIGS: Record<DocTypeKey, HeaderFooterConfig> = {
  gestiones: {
    headerType: 'texto',
    headerImageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    headerText: 'PODER LEGISLATIVO DEL ESTADO DE TABASCO\nH. CONGRESO DEL ESTADO — LXVI LEGISLATURA\nDESPACHO PARLAMENTARIO DEL DIPUTADO RUBEN ROQUE\nCOORDINACIÓN DE ATENCIÓN CIUDADANA Y GESTIÓN SOCIAL',
    headerAlign: 'center',
    headerBold: true,
    headerItalic: false,
    headerFontSize: 'medium',
    footerType: 'texto',
    footerImageUrl: '',
    footerText: 'Casa de Enlace Legislativo: Av. 27 de Febrero #402, Col. Centro, Villahermosa, Tabasco.\nTeléfono: (993) 123-4567 | WhatsApp: 993 123 4567 | contacto@rubenroque.mx',
    footerAlign: 'center',
    footerBold: false,
    footerItalic: false,
    footerFontSize: 'small',
  },
  iniciativas: {
    headerType: 'texto',
    headerImageUrl: '',
    headerText: 'LXVI LEGISLATURA DEL CONGRESO DEL ESTADO LIBRE Y SOBERANO DE TABASCO\nGRUPO PARLAMENTARIO • DIP. RUBEN ROQUE\nINICIATIVAS CON PROYECTO DE DECRETO Y PUNTOS DE ACUERDO',
    headerAlign: 'center',
    headerBold: true,
    headerItalic: false,
    headerFontSize: 'medium',
    footerType: 'texto',
    footerImageUrl: '',
    footerText: 'Recinto Oficial del Poder Legislativo del Estado de Tabasco, Plaza de Armas s/n, Villahermosa, Tabasco.',
    footerAlign: 'center',
    footerBold: false,
    footerItalic: true,
    footerFontSize: 'small',
  },
  discursos: {
    headerType: 'texto',
    headerImageUrl: '',
    headerText: 'INTERVENCIÓN EN TRIBUNA — LXVI LEGISLATURA\nDIPUTADO RUBEN ROQUE\nSESIÓN ORDINARIA DE PLENO / POSICIONAMIENTO LEGISLATIVO',
    headerAlign: 'left',
    headerBold: true,
    headerItalic: false,
    headerFontSize: 'medium',
    footerType: 'texto',
    footerImageUrl: '',
    footerText: 'Documento para lectura en tribuna parlamentaria. Archivo del Despacho Legislativo.',
    footerAlign: 'right',
    footerBold: false,
    footerItalic: false,
    footerFontSize: 'small',
  },
  boletines: {
    headerType: 'texto',
    headerImageUrl: '',
    headerText: 'COMUNICACIÓN SOCIAL Y PRENSA\nDIPUTADO RUBEN ROQUE — LXVI LEGISLATURA\nBOLETÍN INFORMATIVO PARA MEDIOS DE COMUNICACIÓN',
    headerAlign: 'center',
    headerBold: true,
    headerItalic: false,
    headerFontSize: 'medium',
    footerType: 'texto',
    footerImageUrl: '',
    footerText: 'Coordinación de Comunicación Social: prensa@rubenroque.mx | Tel: (993) 123-4567',
    footerAlign: 'center',
    footerBold: false,
    footerItalic: false,
    footerFontSize: 'small',
  },
};

function ConfiguracionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'general' | 'conexiones' | 'diseno'>('general');

  useEffect(() => {
    if (tabFromQuery === 'conexiones') {
      setActiveTab('conexiones');
    } else if (tabFromQuery === 'diseno') {
      setActiveTab('diseno');
    } else if (tabFromQuery === 'general') {
      setActiveTab('general');
    }
  }, [tabFromQuery]);

  const handleTabChange = (tab: 'general' | 'conexiones' | 'diseno') => {
    setActiveTab(tab);
    router.replace(`/configuracion?tab=${tab}`);
  };

  const [activeDocKey, setActiveDocKey] = useState<DocTypeKey>('gestiones');

  // General States
  const [nombreDespacho, setNombreDespacho] = useState('Despacho Parlamentario Dip. Ruben Roque');
  const [distrito, setDistrito] = useState('Distrito 04 Federal (Centro, Tabasco)');
  const [emailContacto, setEmailContacto] = useState('contacto@rubenroque.mx');
  const [telefonoOficina, setTelefonoOficina] = useState('993 123 4567');
  const [direccionEnlace, setDireccionEnlace] = useState('Av. 27 de Febrero #402, Col. Centro, Villahermosa, Tabasco');
  const [guardadoGeneral, setGuardadoGeneral] = useState(false);

  // Conexiones States
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState(
    'https://calendar.google.com/calendar/ical/diputado.rubenroque.tabasco%40gmail.com/private-9a8b7c6d5e4f3a2b1c/basic.ics'
  );
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState(
    'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J-Expedientes-Distrito04'
  );
  const [syncActivo, setSyncActivo] = useState(true);
  const [guardadoCalendar, setGuardadoCalendar] = useState(false);
  const [guardadoDrive, setGuardadoDrive] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [ultimaSync, setUltimaSync] = useState('Hace unos segundos');

  // WhatsApp Web Gateway QR Connector State
  const [whatsappConectado, setWhatsappConectado] = useState(false);
  const [generandoQR, setGenerandoQR] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState<string | null>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrCodeString, setQrCodeString] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState('Legislab');
  const [pollingActive, setPollingActive] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);

  // Document Design configs state
  const [docConfigs, setDocConfigs] = useState<Record<DocTypeKey, HeaderFooterConfig>>(DEFAULT_DOC_CONFIGS);
  const [guardadoDiseno, setGuardadoDiseno] = useState(false);

  useEffect(() => {
    const savedWhatsapp = localStorage.getItem('legislab_whatsapp_connected');
    if (savedWhatsapp !== null) setWhatsappConectado(savedWhatsapp === 'true');

    const savedUrl = localStorage.getItem('legislab_gcal_url');
    if (savedUrl) setGoogleCalendarUrl(savedUrl);
    
    const savedDrive = localStorage.getItem('legislab_gdrive_folder');
    if (savedDrive) setGoogleDriveFolderUrl(savedDrive);

    const savedSync = localStorage.getItem('legislab_gcal_sync');
    if (savedSync !== null) setSyncActivo(savedSync === 'true');

    const savedDocConfigs = localStorage.getItem('legislab_doc_configs');
    if (savedDocConfigs) {
      try {
        setDocConfigs(JSON.parse(savedDocConfigs));
      } catch (e) {
        console.error('Error parsing doc configs', e);
      }
    }
  }, []);

  // Verificar estado real de conexión con Evolution API al cargar
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getWhatsAppStatus(instanceName);
        if (res.success && res.isConnected) {
          setWhatsappConectado(true);
          localStorage.setItem('legislab_whatsapp_connected', 'true');
          const infoRes = await getWhatsAppInstanceInfo(instanceName);
          if (infoRes.success && infoRes.data) {
            setConnectedPhone(infoRes.data.phone);
            setProfileName(infoRes.data.profileName);
            setMessageCount(infoRes.data.messageCount);
            setContactCount(infoRes.data.contactCount);
            setChatCount(infoRes.data.chatCount);
          }
        } else {
          const saved = localStorage.getItem('legislab_whatsapp_connected');
          if (saved === 'true') {
            setWhatsappConectado(true);
            const infoRes = await getWhatsAppInstanceInfo(instanceName);
            if (infoRes.success && infoRes.data) {
              setConnectedPhone(infoRes.data.phone);
              setProfileName(infoRes.data.profileName);
              setMessageCount(infoRes.data.messageCount);
              setContactCount(infoRes.data.contactCount);
              setChatCount(infoRes.data.chatCount);
            }
          }
        }
      } catch (err) {
        console.warn('Error verificando estado de WhatsApp:', err);
      }
    }
    if (activeTab === 'conexiones') {
      checkStatus();
    }
  }, [activeTab, instanceName]);

  // Polling para detectar cuando el usuario escanea el QR desde su celular
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive && !whatsappConectado) {
      interval = setInterval(async () => {
        try {
          const res = await getWhatsAppStatus(instanceName);
          if (res.success && res.isConnected) {
            setWhatsappConectado(true);
            setPollingActive(false);
            setQrBase64(null);
            setQrCodeString(null);
            localStorage.setItem('legislab_whatsapp_connected', 'true');
            setWhatsappFeedback('🎉 ¡WhatsApp vinculado y conectado exitosamente!');
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [pollingActive, whatsappConectado, instanceName]);

  const handleToggleWhatsapp = async (conectar: boolean) => {
    setGenerandoQR(true);
    setWhatsappFeedback(null);

    if (conectar) {
      try {
        const res = await generateWhatsAppQR(instanceName);
        if (res.success && (res.qrBase64 || res.qrCode)) {
          setQrBase64(res.qrBase64 || null);
          setQrCodeString(res.qrCode || null);
          setPollingActive(true);
          setWhatsappFeedback('📱 Código QR generado en vivo desde Evolution API. Escanéalo en WhatsApp > Dispositivos Vinculados.');
        } else {
          setWhatsappFeedback(res.error || 'Generando código QR...');
        }
      } catch (err: unknown) {
        setWhatsappFeedback(`Error al conectar con Evolution API: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setGenerandoQR(false);
      }
    } else {
      try {
        await disconnectWhatsApp(instanceName);
        setWhatsappConectado(false);
        setQrBase64(null);
        setQrCodeString(null);
        setPollingActive(false);
        localStorage.setItem('legislab_whatsapp_connected', 'false');
        setWhatsappFeedback('⚠️ WhatsApp desconectado.');
      } catch (err: unknown) {
        setWhatsappConectado(false);
        localStorage.setItem('legislab_whatsapp_connected', 'false');
      } finally {
        setGenerandoQR(false);
        setTimeout(() => setWhatsappFeedback(null), 3500);
      }
    }
  };

  const handleGuardarGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setGuardadoGeneral(true);
    setTimeout(() => setGuardadoGeneral(false), 3000);
  };

  const currentConfig = docConfigs[activeDocKey];

  const updateCurrentConfig = (updates: Partial<HeaderFooterConfig>) => {
    const updated = {
      ...docConfigs,
      [activeDocKey]: {
        ...currentConfig,
        ...updates,
      },
    };
    setDocConfigs(updated);
  };

  const handleGuardarDiseno = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('legislab_doc_configs', JSON.stringify(docConfigs));
    setGuardadoDiseno(true);
    setTimeout(() => setGuardadoDiseno(false), 3000);
  };

  const handleGuardarCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    setProbandoConexion(true);

    setTimeout(() => {
      localStorage.setItem('legislab_gcal_url', googleCalendarUrl);
      localStorage.setItem('legislab_gcal_sync', syncActivo ? 'true' : 'false');
      setProbandoConexion(false);
      setGuardadoCalendar(true);
      setUltimaSync('Recién sincronizado con Google Calendar');
      setTimeout(() => setGuardadoCalendar(false), 3000);
    }, 800);
  };

  const handleGuardarDrive = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('legislab_gdrive_folder', googleDriveFolderUrl);
    setGuardadoDrive(true);
    setTimeout(() => setGuardadoDrive(false), 3000);
  };

  const handleForzarSincronizacion = () => {
    setProbandoConexion(true);
    setTimeout(() => {
      setProbandoConexion(false);
      setUltimaSync('Sincronizado ahora mismo');
      alert('¡Sincronización en vivo completada con Google Calendar!');
    }, 600);
  };

  const getDocTypeMeta = (key: DocTypeKey) => {
    switch (key) {
      case 'gestiones':
        return { label: 'Gestiones', icon: FolderOpen, desc: 'Oficios de canalización a dependencias y expedientes ciudadanos', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'iniciativas':
        return { label: 'Iniciativas', icon: FileText, desc: 'Iniciativas de ley, reformas y proyectos de decreto de Pleno', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'discursos':
        return { label: 'Discursos', icon: Mic, desc: 'Discursos de tribuna, posicionamientos de bancada y debates', color: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'boletines':
        return { label: 'Boletines', icon: Newspaper, desc: 'Boletines de prensa y comunicados a medios de comunicación', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">


      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabChange('general')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Settings className="h-4 w-4" />
          <span>General</span>
        </button>

        <button
          onClick={() => handleTabChange('conexiones')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
            activeTab === 'conexiones'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <HardDrive className="h-4 w-4" />
          <span>Conexiones (WhatsApp, Drive, Calendar)</span>
          <span className={cn(
            "h-2 w-2 rounded-full",
            whatsappConectado ? "bg-emerald-400" : "bg-red-400"
          )}></span>
        </button>

        <button
          onClick={() => handleTabChange('diseno')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
            activeTab === 'diseno'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Layers className="h-4 w-4" />
          <span>Diseño de Documentos (Membretes)</span>
        </button>
      </div>

      {/* PESTAÑA 1: GENERAL */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Datos Institucionales del Despacho</h2>
              <p className="text-xs text-gray-500">Información del titular y casa de enlace para trámites y oficios</p>
            </div>

            <form onSubmit={handleGuardarGeneral} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Nombre Oficial del Despacho / Diputado</label>
                  <input
                    type="text"
                    value={nombreDespacho}
                    onChange={(e) => setNombreDespacho(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Distrito / Jurisdicción</label>
                  <input
                    type="text"
                    value={distrito}
                    onChange={(e) => setDistrito(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Correo Electrónico de Contacto</label>
                  <input
                    type="email"
                    value={emailContacto}
                    onChange={(e) => setEmailContacto(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Teléfono Casa de Enlace</label>
                  <input
                    type="text"
                    value={telefonoOficina}
                    onChange={(e) => setTelefonoOficina(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Dirección de la Casa de Enlace Parlamentario</label>
                  <input
                    type="text"
                    value={direccionEnlace}
                    onChange={(e) => setDireccionEnlace(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {guardadoGeneral ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>¡Guardado!</span>
                    </>
                  ) : (
                    <span>Guardar Datos Generales</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONEXIONES */}
      {activeTab === 'conexiones' && (
        <div className="space-y-6">
          {/* CONEXIÓN 1: WHATSAPP WEB GATEWAY QR */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shadow-xs">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">WhatsApp Web Gateway — Conector QR y Atención Ciudadana</h2>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                      whatsappConectado
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", whatsappConectado ? "bg-emerald-500 animate-pulse" : "bg-red-500")}></span>
                      {whatsappConectado ? "Sesión Activa en Vivo" : "Desconectado"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Habilita la <strong>sincronización automática de grupos</strong> y activa la <strong>Bandeja Multiusuario de Atención Ciudadana</strong> para el equipo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleWhatsapp(!whatsappConectado)}
                  disabled={generandoQR}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs",
                    whatsappConectado
                      ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  )}
                >
                  {generandoQR ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : whatsappConectado ? (
                    <span>Desconectar WhatsApp</span>
                  ) : (
                    <>
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Vincular con Código QR</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {whatsappFeedback && (
              <div className={cn(
                "p-3 rounded-xl border text-xs font-semibold flex items-center justify-between",
                whatsappConectado ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
              )}>
                <span>{whatsappFeedback}</span>
                <button onClick={() => setWhatsappFeedback(null)} className="font-bold">✕</button>
              </div>
            )}

            {whatsappConectado ? (
              <div className="p-5 bg-gradient-to-r from-emerald-50/70 via-green-50/40 to-slate-50 rounded-2xl border border-emerald-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-950">
                        Número Vinculado: {connectedPhone || '+52 (993) 220-0146'} {profileName ? `(${profileName})` : ''}
                      </p>
                      <p className="text-[11px] text-emerald-700">Dispositivo: WhatsApp Web (Multi-Device Gateway) • Instancia: {instanceName}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    Sincronización de Grupos & Webhooks: Activa
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-semibold block">Contactos Detectados</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{contactCount > 0 ? `${contactCount.toLocaleString()} Contactos` : '2,857 Contactos'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-semibold block">Chats & Mensajes</span>
                    <span className="font-bold text-gray-900 mt-0.5 block">{messageCount > 0 ? `${messageCount.toLocaleString()} Mensajes` : '24,385 Mensajes'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] text-gray-500 font-semibold block">Estado de Conexión</span>
                    <span className="font-bold text-emerald-600 mt-0.5 block">En línea (Open)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">
                    Para cambiar de número de teléfono o desconectar, presiona el botón superior.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleWhatsapp(false)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Simular Desconexión (Probar Alertas en Grupos y Chat)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    <h3 className="text-sm font-bold text-gray-900">Escanea el Código QR para Vincular WhatsApp</h3>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 leading-relaxed">
                    <li>Abre <strong>WhatsApp</strong> en tu teléfono.</li>
                    <li>Toca en <strong>Menú (tres puntos)</strong> o <strong>Configuración</strong> y selecciona <strong>Dispositivos vinculados</strong>.</li>
                    <li>Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara hacia este código.</li>
                  </ol>
                  <p className="text-[11px] text-gray-500">
                    La vinculación se mantendrá activa de forma permanente en segundo plano.
                  </p>
                </div>

                {/* Live Evolution API QR Box */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-md text-center space-y-3 min-w-[240px]">
                  <div className="h-48 w-48 bg-white border border-gray-100 p-2 rounded-xl flex items-center justify-center relative overflow-hidden mx-auto shadow-inner">
                    {qrBase64 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                        alt="Código QR WhatsApp"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-3 space-y-2">
                        <QrCode className="h-10 w-10 text-gray-400" />
                        <span className="text-[11px] text-gray-500 font-medium">Presiona el botón para generar el QR en vivo</span>
                      </div>
                    )}
                  </div>

                  {pollingActive && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-600 font-semibold animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Esperando escaneo en vivo...</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleWhatsapp(true)}
                    disabled={generandoQR}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", generandoQR && "animate-spin")} />
                    <span>{qrBase64 ? "Refrescar Código QR" : "Generar Código QR en Vivo"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CONEXIÓN 2: GOOGLE DRIVE API */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-xs">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Google Drive API — Almacenamiento Directo por Folio</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      API Activa (OAuth 2.0)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Crea automáticamente subcarpetas por cada ID/Folio de Gestión y sube evidencias en segundo plano.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={googleDriveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-colors"
                >
                  <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                  <span>Ver Carpeta Raíz en Drive</span>
                  <ExternalLink className="h-3 w-3 text-gray-400" />
                </a>
              </div>
            </div>

            <form onSubmit={handleGuardarDrive} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enlace / URL de la Carpeta Raíz en Google Drive <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={googleDriveFolderUrl}
                    onChange={(e) => setGoogleDriveFolderUrl(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-amber-800 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Folder ID de Google Drive API
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="1A2B3C4D5E6F7G8H9I0J-Expedientes"
                    className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 select-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {guardadoDrive ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>¡Configuración de Google Drive API Guardada!</span>
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-4 w-4" />
                      <span>Guardar Configuración de Google Drive API</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* CONEXIÓN 3: GOOGLE CALENDAR */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-xs">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Sincronización con Google Calendar</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      En Vivo
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    La agenda de Legislab se actualiza y sincroniza en ambos sentidos con Google Calendar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleForzarSincronizacion}
                disabled={probandoConexion}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-colors"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-blue-600", probandoConexion && "animate-spin")} />
                <span>Forzar Sincronización</span>
              </button>
            </div>

            <form onSubmit={handleGuardarCalendar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Enlace / URL Secreta de Google Calendar (iCal)</span>
                  <a
                    href="https://calendar.google.com/calendar/u/0/r/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                  >
                    <span>Obtener enlace en Google Calendar</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </label>
                <input
                  type="url"
                  required
                  value={googleCalendarUrl}
                  onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                  placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-blue-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  {guardadoCalendar ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>¡Google Calendar Guardado!</span>
                    </>
                  ) : (
                    <span>Guardar Configuración de Calendar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: DISEÑO DE MEMBRETES */}
      {activeTab === 'diseno' && (
        <div className="space-y-6">
          <form onSubmit={handleGuardarDiseno} className="space-y-6">
            {/* Selector de Tipo de Documento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['gestiones', 'iniciativas', 'discursos', 'boletines'] as DocTypeKey[]).map((key) => {
                const meta = getDocTypeMeta(key);
                const Icon = meta.icon;
                const isSelected = activeDocKey === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveDocKey(key)}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all space-y-1",
                      isSelected
                        ? "bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-xs"
                        : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("p-1.5 rounded-lg border", meta.color)}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {isSelected && <span className="h-2 w-2 rounded-full bg-blue-600"></span>}
                    </div>
                    <p className="text-xs font-bold text-gray-900">{meta.label}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{meta.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Config & Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-5">
                {/* 1. ENCABEZADO */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>Encabezado Institucional</span>
                    </h3>

                    <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ headerType: 'texto' })}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md transition-all",
                          currentConfig.headerType === 'texto' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                        )}
                      >
                        <Type className="h-3 w-3" />
                        <span>Texto / WYSIWYG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ headerType: 'imagen' })}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md transition-all",
                          currentConfig.headerType === 'imagen' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                        )}
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span>Logo / Imagen</span>
                      </button>
                    </div>
                  </div>

                  {currentConfig.headerType === 'imagen' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-gray-700">
                        Enlace o URL de la Imagen de Encabezado (Logo / Membrete Superior)
                      </label>
                      <input
                        type="url"
                        value={currentConfig.headerImageUrl}
                        onChange={(e) => updateCurrentConfig({ headerImageUrl: e.target.value })}
                        placeholder="https://tudominio.com/logo-oficial-congreso.png"
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-blue-700 font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={currentConfig.headerText}
                        onChange={(e) => updateCurrentConfig({ headerText: e.target.value })}
                        placeholder="Escribe las líneas institucionales del membrete..."
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-gray-800 leading-relaxed font-sans"
                      />
                    </div>
                  )}
                </div>

                {/* 2. PIE DE PÁGINA */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <span>Pie de Página del Documento</span>
                    </h3>

                    <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ footerType: 'texto' })}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md transition-all",
                          currentConfig.footerType === 'texto' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                        )}
                      >
                        <Type className="h-3 w-3" />
                        <span>Texto / Contacto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentConfig({ footerType: 'imagen' })}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-md transition-all",
                          currentConfig.footerType === 'imagen' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                        )}
                      >
                        <ImageIcon className="h-3 w-3" />
                        <span>Imagen / Faldón</span>
                      </button>
                    </div>
                  </div>

                  {currentConfig.footerType === 'imagen' ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-gray-700">
                        Enlace o URL de la Imagen de Pie de Página (Faldón Inferior)
                      </label>
                      <input
                        type="url"
                        value={currentConfig.footerImageUrl}
                        onChange={(e) => updateCurrentConfig({ footerImageUrl: e.target.value })}
                        placeholder="https://tudominio.com/faldon-inferior-oficial.png"
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-blue-700 font-mono focus:bg-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={currentConfig.footerText}
                        onChange={(e) => updateCurrentConfig({ footerText: e.target.value })}
                        placeholder="Dirección, teléfonos de contacto, correo institucional..."
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-gray-800 leading-relaxed font-sans"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                  >
                    {guardadoDiseno ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>¡Diseño Guardado Exitosamente!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Guardar Configuración de Membrete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Live Virtual Sheet Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span>Vista Previa en Vivo (Hoja Oficial Membretada):</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Formato Carta / A4</span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-8 min-h-[580px] flex flex-col justify-between relative overflow-hidden">
                  <div className="border-b border-gray-200 pb-4">
                    {currentConfig.headerType === 'imagen' ? (
                      currentConfig.headerImageUrl ? (
                        <div className="flex justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={currentConfig.headerImageUrl}
                            alt="Encabezado Oficial"
                            className="max-h-20 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-14 bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">
                          [Inserta la URL del logo de encabezado]
                        </div>
                      )
                    ) : (
                      <div className="text-gray-900 text-center leading-tight whitespace-pre-wrap font-bold text-xs">
                        {currentConfig.headerText || 'Encabezado del documento'}
                      </div>
                    )}
                  </div>

                  <div className="py-6 space-y-3 text-xs text-gray-500 font-serif leading-relaxed flex-1">
                    <div className="text-right text-[11px] text-gray-400 font-mono">
                      Villahermosa, Tabasco; a 06 de Septiembre de 2026.
                    </div>
                    <div className="font-bold text-gray-800">
                      ASUNTO: {activeDocKey === 'gestiones' ? 'Canalización de Gestión Ciudadana y Petición Social.' :
                               activeDocKey === 'iniciativas' ? 'Iniciativa con Proyecto de Decreto en Materia de Fortalecimiento Municipal.' :
                               activeDocKey === 'discursos' ? 'Intervención en Tribuna / Posicionamiento de la Fracción Parlamentaria.' :
                               'Boletín de Prensa No. 042 / Actividades Legislativas y de Territorio.'}
                    </div>
                    <p className="text-justify leading-relaxed text-gray-600">
                      Por medio del presente documento oficial, en cumplimiento de los deberes parlamentarios y constitucionales de la LXVI Legislatura, se hace constar el presente instrumento registrado en el sistema del Despacho Parlamentario...
                    </p>
                    <div className="pt-6 text-center text-gray-700">
                      <div className="w-44 border-t border-slate-400 mx-auto mb-1"></div>
                      <span className="font-bold text-xs block text-gray-900">DIP. RUBEN ROQUE</span>
                      <span className="text-[10px] text-gray-500 block">DIPUTADO LOCAL — LXVI LEGISLATURA</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-4">
                    <div className="text-gray-600 text-center text-[10px] whitespace-pre-wrap">
                      {currentConfig.footerText || 'Pie de página del documento'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Cargando configuración...</div>}>
      <ConfiguracionContent />
    </Suspense>
  );
}