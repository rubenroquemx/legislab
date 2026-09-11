'use client';

import { 
  getWhatsAppStatus, 
  generateWhatsAppQR, 
  disconnectWhatsApp,
  getWhatsAppInstanceInfo
} from '@/app/actions/whatsapp';
import { 
  getGoogleDriveStatusAction, 
  disconnectGoogleDriveAction, 
  updateGoogleDriveFolderAction 
} from '@/app/actions/drive';
import { 
  getGoogleCalendarStatusAction, 
  disconnectGoogleCalendarAction,
  syncGoogleCalendarAction 
} from '@/app/actions/agenda';
import {
  getOfficeConfigAction,
  updateOfficeGeneralConfigAction
} from '@/app/actions/configuracion';
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

  // Multi-tenant Office State
  const [officeId, setOfficeId] = useState<string>('');
  const [loadingOffice, setLoadingOffice] = useState(true);

  // General States
  const [nombreDespacho, setNombreDespacho] = useState('');
  const [titularName, setTitularName] = useState('');
  const [distrito, setDistrito] = useState('');
  const [emailContacto, setEmailContacto] = useState('');
  const [telefonoOficina, setTelefonoOficina] = useState('');
  const [direccionEnlace, setDireccionEnlace] = useState('');
  const [guardadoGeneral, setGuardadoGeneral] = useState(false);

  // Conexiones States
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');
  const [guardadoDrive, setGuardadoDrive] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [ultimaSync, setUltimaSync] = useState('Hace unos momentos');

  // Google Drive & Google Calendar OAuth 2.0 Live States
  const [driveConectado, setDriveConectado] = useState(false);
  const [driveEmail, setDriveEmail] = useState('');
  const [driveFolderUrlReal, setDriveFolderUrlReal] = useState('');
  const [driveFolderIdReal, setDriveFolderIdReal] = useState('');
  const [calendarConectado, setCalendarConectado] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState('');

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

  // Carga inicial y reactiva de los datos del despacho activo
  async function loadOfficeData() {
    try {
      setLoadingOffice(true);
      const res = await getOfficeConfigAction();
      if (res.success && res.data) {
        const off = res.data;
        setOfficeId(off.id);
        setNombreDespacho(off.name);
        setTitularName(off.titularName);
        setDistrito(off.district);
        setEmailContacto(off.titularEmail);
        setTelefonoOficina(off.titularPhone);
        setInstanceName(off.whatsappInstanceName);
        
        // Drive status strictly from DB
        setDriveConectado(Boolean(off.googleDriveConnected));
        setDriveEmail(off.googleDriveEmail || '');
        setDriveFolderUrlReal(off.googleDriveFolderUrl || '');
        setDriveFolderIdReal(off.googleDriveFolderId || '');
        setGoogleDriveFolderUrl(off.googleDriveFolderUrl || '');

        // Calendar status strictly from DB
        setCalendarConectado(Boolean(off.googleCalendarConnected));
        setCalendarEmail(off.googleCalendarEmail || '');

        // Verificar estado de WhatsApp para esta instancia específica
        checkWhatsAppStatus(off.whatsappInstanceName);
      }
    } catch (e) {
      console.warn('Error loading office config:', e);
    } finally {
      setLoadingOffice(false);
    }
  }

  async function checkWhatsAppStatus(targetInstance: string) {
    try {
      const res = await getWhatsAppStatus(targetInstance);
      if (res && res.success && res.isConnected) {
        setWhatsappConectado(true);
        const infoRes = await getWhatsAppInstanceInfo(targetInstance);
        if (infoRes && infoRes.success && infoRes.data) {
          const info = infoRes.data;
          setConnectedPhone(info.phone);
          setProfileName(info.profileName);
          setMessageCount(info.messageCount || 0);
          setContactCount(info.contactCount || 0);
          setChatCount(info.chatCount || 0);
        }
      } else {
        setWhatsappConectado(false);
        setConnectedPhone(null);
        setProfileName(null);
        setMessageCount(0);
        setContactCount(0);
        setChatCount(0);
      }
    } catch (err) {
      console.warn('Error checking WhatsApp status:', err);
    }
  }

  useEffect(() => {
    loadOfficeData();

    const savedDocConfigs = localStorage.getItem('legislab_doc_configs');
    if (savedDocConfigs) {
      try {
        setDocConfigs(JSON.parse(savedDocConfigs));
      } catch (e) {
        console.error('Error parsing doc configs', e);
      }
    }
  }, [tabFromQuery, searchParams]);

  // Polling para detectar cuando el usuario escanea el QR desde su celular
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pollingActive && !whatsappConectado) {
      interval = setInterval(async () => {
        try {
          const res = await getWhatsAppStatus(instanceName);
          if (res && res.success && res.isConnected) {
            setWhatsappConectado(true);
            setPollingActive(false);
            setQrBase64(null);
            setQrCodeString(null);
            setWhatsappFeedback('🎉 ¡WhatsApp vinculado y conectado exitosamente para este despacho!');
            checkWhatsAppStatus(instanceName);
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

        if (res && res.success && (res.qrBase64 || res.qrCode)) {
          setQrBase64(res.qrBase64 || null);
          setQrCodeString(res.qrCode || null);
          setPollingActive(true);
          setWhatsappFeedback(`📱 Código QR generado para la instancia "${instanceName}". Escanéalo en WhatsApp > Dispositivos Vinculados.`);
        } else {
          setWhatsappFeedback(res?.error || 'No se pudo obtener el código QR de Evolution API.');
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
        setConnectedPhone(null);
        setProfileName(null);
        setMessageCount(0);
        setContactCount(0);
        setChatCount(0);
        setWhatsappFeedback('⚠️ WhatsApp desconectado.');
      } catch (err: unknown) {
        setWhatsappConectado(false);
      } finally {
        setGenerandoQR(false);
        setTimeout(() => setWhatsappFeedback(null), 3500);
      }
    }
  };

  const handleGuardarGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOfficeGeneralConfigAction({
        name: nombreDespacho,
        titularName: titularName || nombreDespacho,
        titularEmail: emailContacto,
        titularPhone: telefonoOficina,
        district: distrito,
        officeId,
      });
      setGuardadoGeneral(true);
      setTimeout(() => setGuardadoGeneral(false), 3000);
    } catch (err) {
      console.error('Error saving general config:', err);
    }
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

  const handleGuardarDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateGoogleDriveFolderAction(googleDriveFolderUrl, undefined, officeId);
      if (res.success && res.folderUrl) {
        setDriveFolderUrlReal(res.folderUrl);
        if (res.folderId) setDriveFolderIdReal(res.folderId);
      }
    } catch (err) {
      console.warn('Error updating drive folder:', err);
    }
    setGuardadoDrive(true);
    setTimeout(() => setGuardadoDrive(false), 3000);
  };

  const handleDisconnectDrive = async () => {
    if (!confirm('¿Deseas desconectar tu cuenta de Google Drive de este despacho?')) return;
    try {
      await disconnectGoogleDriveAction(officeId);
      setDriveConectado(false);
      setDriveEmail('');
      setDriveFolderUrlReal('');
      setDriveFolderIdReal('');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('gdrive_status');
        url.searchParams.delete('gdrive_error');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm('¿Deseas desconectar tu cuenta de Google Calendar de este despacho?')) return;
    try {
      await disconnectGoogleCalendarAction(officeId);
      setCalendarConectado(false);
      setCalendarEmail('');
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('gcal_status');
        url.searchParams.delete('gcal_error');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForzarSincronizacion = async () => {
    setProbandoConexion(true);
    try {
      const res = await syncGoogleCalendarAction(officeId);
      setProbandoConexion(false);
      if (res.success) {
        setUltimaSync('Recién sincronizado con Google Calendar');
        alert(res.message || '¡Sincronización completada exitosamente!');
      } else {
        alert(res.error || 'Error al sincronizar Google Calendar');
      }
    } catch (e) {
      setProbandoConexion(false);
    }
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

  if (loadingOffice) {
    return (
      <div className="flex items-center justify-center p-16 text-zinc-400 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        <span>Cargando configuración del despacho activo...</span>
      </div>
    );
  }

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
          <span>Conexiones</span>
          {(driveConectado || calendarConectado || whatsappConectado) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
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
          <Palette className="h-4 w-4" />
          <span>Diseño de Membretes</span>
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
                  <label className="block font-semibold text-gray-700 mb-1">Nombre Oficial del Despacho</label>
                  <input
                    type="text"
                    value={nombreDespacho}
                    onChange={(e) => setNombreDespacho(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Diputado Titular</label>
                  <input
                    type="text"
                    value={titularName}
                    onChange={(e) => setTitularName(e.target.value)}
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
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Instancia WhatsApp Asignada</label>
                  <input
                    type="text"
                    disabled
                    value={instanceName}
                    className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
                    <h2 className="text-base font-bold text-gray-900">WhatsApp</h2>
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
                    Instancia propia del despacho: <span className="font-mono text-zinc-700 font-bold">{instanceName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleWhatsapp(!whatsappConectado)}
                  disabled={generandoQR}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs cursor-pointer",
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
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      WA
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{profileName || nombreDespacho}</p>
                      <p className="text-[11px] font-mono text-emerald-800 font-semibold">{connectedPhone || "Número Conectado"}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2 py-1 bg-white border border-emerald-200 rounded-lg text-emerald-800">
                    Instancia: {instanceName}
                  </span>
                </div>
              </div>
            ) : (
              qrBase64 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
                  <p className="text-xs font-bold text-gray-800">Escanea este código QR con WhatsApp en tu celular:</p>
                  <div className="p-3 bg-white border border-gray-300 rounded-2xl shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-600" />
                    <span>Esperando escaneo desde la aplicación de WhatsApp...</span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* CONEXIÓN 2: GOOGLE DRIVE */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-xs">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900">Google Drive</h2>
                    {driveConectado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Conectado ({driveEmail || "Cuenta de Google"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        No conectado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Almacena automáticamente en la nube expedientes, iniciativas, oficios y evidencias por folio.
                  </p>
                </div>
              </div>

              {driveConectado ? (
                <div className="flex items-center gap-2">
                  {driveFolderUrlReal && (
                    <a
                      href={driveFolderUrlReal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition-colors"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                      <span>Abrir en Google Drive</span>
                      <ExternalLink className="h-3 w-3 text-amber-500" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleDisconnectDrive}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Desconectar Drive
                  </button>
                </div>
              ) : (
                <a
                  href={`/api/auth/google-drive${officeId ? `?officeId=${officeId}` : ''}`}
                  className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <HardDrive className="h-4 w-4" />
                  <span>Conectar con Google Drive (1 Clic)</span>
                </a>
              )}
            </div>

            {driveConectado ? (
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Carpeta Oficial Activa: LegisLab - {nombreDespacho}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Cada vez que registras una nueva gestión, LegisLab genera automáticamente una subcarpeta dentro de esta unidad.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
                Al conectar Google Drive con un solo clic, se autorizará de forma segura mediante OAuth 2.0 y se creará la carpeta oficial en tu cuenta para organizar y resguardar automáticamente los expedientes de este despacho.
              </div>
            )}
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
                    <h2 className="text-base font-bold text-gray-900">Google Calendar</h2>
                    {calendarConectado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Conectado ({calendarEmail || "Google Calendar"})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        No conectado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Sincronización en vivo con Google Calendar para sesiones ordinarias, comisiones y audiencias.
                  </p>
                </div>
              </div>

              {calendarConectado ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleForzarSincronizacion}
                    disabled={probandoConexion}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-blue-600", probandoConexion && "animate-spin")} />
                    <span>Sincronizar Ahora</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectCalendar}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Desconectar Calendar
                  </button>
                </div>
              ) : (
                <a
                  href={`/api/auth/google-calendar${officeId ? `?officeId=${officeId}` : ''}`}
                  className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Conectar con Google Calendar (1 Clic)</span>
                </a>
              )}
            </div>

            {calendarConectado ? (
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Sincronización bidireccional activa con la cuenta {calendarEmail || 'de Google'}</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Cualquier evento creado en el módulo de Agenda de LegisLab se sincroniza automáticamente con tu Google Calendar y viceversa.
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 leading-relaxed">
                Al conectar Google Calendar con un solo clic mediante OAuth 2.0, las sesiones ordinarias, reuniones de comisión y audiencias ciudadanas de LegisLab se sincronizarán en tiempo real con tu calendario para este despacho.
              </div>
            )}
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
                      "p-3.5 rounded-2xl border text-left transition-all space-y-1 cursor-pointer",
                      isSelected
                        ? "bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-xs"
                        : "bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", isSelected ? "text-blue-600" : "text-gray-500")} />
                      <span className={cn("text-xs font-bold", isSelected ? "text-blue-900" : "text-gray-700")}>{meta.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight">{meta.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Configuración de Encabezado */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Encabezado Oficial</h3>
              <div className="space-y-3 text-xs">
                <textarea
                  rows={4}
                  value={currentConfig.headerText}
                  onChange={(e) => updateCurrentConfig({ headerText: e.target.value })}
                  placeholder="Texto oficial del encabezado..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Configuración de Pie de Página */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Pie de Página Institucional</h3>
              <div className="space-y-3 text-xs">
                <textarea
                  rows={3}
                  value={currentConfig.footerText}
                  onChange={(e) => updateCurrentConfig({ footerText: e.target.value })}
                  placeholder="Datos de contacto, dirección de casa de enlace y teléfonos..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {guardadoDiseno ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>¡Membretes Guardados!</span>
                  </>
                ) : (
                  <span>Guardar Plantilla de Membretes</span>
                )}
              </button>
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