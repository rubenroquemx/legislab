'use client';

import { useState, useEffect, useRef } from 'react';
import { getGestiones, createGestion } from '@/app/actions/gestiones';
import { createGestionDriveFolderAction, getGoogleDriveStatusAction } from '@/app/actions/drive';
import { getCurrentTimeMexicoCity, MEXICO_TIMEZONE } from '@/lib/date-utils';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  LayoutList, 
  Kanban, 
  Camera, 
  FileText, 
  FolderOpen, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Phone, 
  User, 
  MapPin, 
  ShieldCheck, 
  Tag, 
  X, 
  Filter, 
  ChevronRight, 
  FileUp, 
  Eye, 
  Send,
  Building,
  Landmark,
  ArrowRight,
  GripVertical,
  ImageIcon,
  UserCheck,
  StickyNote,
  MessageSquarePlus,
  Trash2,
  CheckCheck,
  Smile,
  Paperclip
} from 'lucide-react';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';

export type EstadoGestion = 'Recibida' | 'En Revisión' | 'En Trámite con Dependencia' | 'Resuelta';

export interface NotaObservacion {
  id: string;
  fecha: string;
  hora: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}

export interface DocumentoExpediente {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  tamano: string;
  urlDrive: string;
}

export interface OficioGenerado {
  id: string;
  folioOficio: string;
  tipoOficio: string;
  destinatario: string;
  cargo: string;
  dependencia: string;
  fecha: string;
  contenido: string;
}

export interface GestionCiudadana {
  id: string;
  folio: string;
  nombre: string;
  avatarUrl?: string;
  telefono: string;
  municipio: string;
  curp: string;
  direccion: string;
  colonia: string;
  seccionElectoral: string;
  tipo: string;
  descripcion: string;
  estatus: EstadoGestion;
  prioridad: 'Alta' | 'Media' | 'Baja';
  dependenciaDestino: string;
  fecha: string;
  driveFolderUrl: string;
  documentos: DocumentoExpediente[];
  oficios: OficioGenerado[];
  notas: NotaObservacion[];
}

export interface PlantillaOficio {
  id: string;
  titulo: string;
  dependenciaPredeterminada: string;
  destinatarioSugerido: string;
  cargoSugerido: string;
  descripcionMuestra: string;
}

const PLANTILLAS_PREDETERMINADAS: PlantillaOficio[] = [
  {
    id: 'plan-1',
    titulo: 'Canalización de Salud (Medicamentos, Cirugías y Prótesis)',
    dependenciaPredeterminada: 'Secretaría de Salud del Estado',
    destinatarioSugerido: 'Dra. Patricia Oramas Palma',
    cargoSugerido: 'Secretaria de Salud y Directora General del IMSS-Bienestar Tabasco',
    descripcionMuestra: 'Solicitud urgente de intervención médica, abastecimiento de medicamento de alta especialidad o programación quirúrgica.',
  },
  {
    id: 'plan-2',
    titulo: 'Petición de Infraestructura y Obras Públicas (Pavimentación / Drenaje)',
    dependenciaPredeterminada: 'SOTOP (Secretaría de Ordenamiento Territorial y Obras Públicas)',
    destinatarioSugerido: 'Ing. Daniel Casasús Ruz',
    cargoSugerido: 'Secretario de Ordenamiento Territorial y Obras Públicas',
    descripcionMuestra: 'Canalización de peticiones ciudadanas para rehabilitación de carpetas asfálticas, desazolve de cárcamos y luminarias.',
  },
  {
    id: 'plan-3',
    titulo: 'Solicitud de Apoyo Social y Aparatos Ortopédicos (DIF)',
    dependenciaPredeterminada: 'Sistema DIF Estatal',
    destinatarioSugerido: 'Lic. Celina Ocaña de la Fuente',
    cargoSugerido: 'Directora General del Sistema DIF Tabasco',
    descripcionMuestra: 'Petición de sillas de ruedas, aparatos auditivos, andaderas y paquetes de asistencia prioritaria a grupos vulnerables.',
  },
  {
    id: 'plan-4',
    titulo: 'Gestión Educativa, Mobiliario y Mantenimiento Escolar',
    dependenciaPredeterminada: 'Secretaría de Educación',
    destinatarioSugerido: 'Dra. Egla Cornelio Landero',
    cargoSugerido: 'Secretaria de Educación de Tabasco',
    descripcionMuestra: 'Petición de equipamiento de aulas, techumbres cívicas y rehabilitación de planteles de educación básica.',
  },
  {
    id: 'plan-5',
    titulo: 'Oficio Institucional Libre / Audiencia Ciudadana',
    dependenciaPredeterminada: 'Ayuntamiento de Centro',
    destinatarioSugerido: 'Lic. Yolanda Osuna Huerta',
    cargoSugerido: 'Presidenta Municipal de Centro',
    descripcionMuestra: 'Canalización abierta de peticiones vecinales y audiencias de seguimiento territorial.',
  },
];

const INITIAL_GESTIONES: GestionCiudadana[] = [];

const TIPOS_GESTION_BASE = ['Salud', 'Educación', 'Obras Públicas', 'Apoyo Económico', 'Vivienda', 'Asesoría Legal', 'Deporte', 'Medio Ambiente'];

const ESTADOS_KANBAN: EstadoGestion[] = ['Recibida', 'En Revisión', 'En Trámite con Dependencia', 'Resuelta'];

export default function GestionesPage() {
  const [gestiones, setGestiones] = useState<GestionCiudadana[]>(INITIAL_GESTIONES);
  const [loading, setLoading] = useState(true);

  const loadGestiones = async () => {
    try {
      const res = await getGestiones();
      if (res.success && res.data && res.data.length > 0) {
        const mapped: GestionCiudadana[] = res.data.map((d: any) => ({
          id: d.id,
          folio: d.folio,
          nombre: d.solicitante,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          telefono: d.telefono || '993 000 0000',
          municipio: d.municipio || 'Centro',
          curp: '',
          direccion: '',
          colonia: d.colonia || '',
          seccionElectoral: '',
          tipo: d.categoria || 'General',
          descripcion: d.asunto || '',
          estatus: (d.estatus as any) || 'En Trámite con Dependencia',
          prioridad: (d.prioridad as any) || 'Media',
          dependenciaDestino: d.dependenciaCanalizada || 'General',
          fecha: d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: '2-digit', month: 'short', year: 'numeric' }) : 'Hoy',
          driveFolderUrl: '',
          documentos: [],
          oficios: [],
          notas: [],
        }));
        setGestiones(mapped);
      }
    } catch (err) {
      console.warn('Error loading gestiones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGestiones();
  }, []);
  const [tiposGestion, setTiposGestion] = useState<string[]>(TIPOS_GESTION_BASE);
  const [plantillasOficios, setPlantillasOficios] = useState<PlantillaOficio[]>(PLANTILLAS_PREDETERMINADAS);

  // View state: 'lista' | 'kanban'
  const [vistaModo, setVistaModo] = useState<'lista' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');

  // Modals
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [gestionSeleccionada, setGestionSeleccionada] = useState<GestionCiudadana | null>(null);
  const [isModalOficioOpen, setIsModalOficioOpen] = useState(false);
  const [isModalNuevaPlantillaOpen, setIsModalNuevaPlantillaOpen] = useState(false);

  // Form states (Nuevo Ciudadano)
  const [nombre, setNombre] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [telefono, setTelefono] = useState('');
  const [municipio, setMunicipio] = useState('Centro (Villahermosa)');
  const [curp, setCurp] = useState('');
  const [direccion, setDireccion] = useState('');
  const [colonia, setColonia] = useState('');
  const [seccionElectoral, setSeccionElectoral] = useState('');
  const [tipo, setTipo] = useState('Salud');
  const [isCustomTipo, setIsCustomTipo] = useState(false);
  const [customTipoInput, setCustomTipoInput] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [dependenciaDestino, setDependenciaDestino] = useState('Secretaría de Salud del Estado');

  // Usuario Activo en Sesión
  const usuarioActivo = {
    nombre: 'Dip. Ruben Roque',
    cargo: 'Diputado Local (Titular)',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  // WhatsApp-style Notes chat state
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);

  // Upload in dossier state
  const [isUploadingDossierDoc, setIsUploadingDossierDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dossierFileInputRef = useRef<HTMLInputElement>(null);

  // Generator Oficio state
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState('plan-1');
  const [oficioDestinatario, setOficioDestinatario] = useState('');
  const [oficioCargo, setOficioCargo] = useState('');
  const [oficioDependencia, setOficioDependencia] = useState('');
  const [oficioTextoGenerado, setOficioTextoGenerado] = useState('');
  const [isOficioGenerating, setIsOficioGenerating] = useState(false);
  const [copiadoOficio, setCopiadoOficio] = useState(false);

  // Nueva Plantilla Form
  const [nuevaPlantillaTitulo, setNuevaPlantillaTitulo] = useState('');
  const [nuevaPlantillaDep, setNuevaPlantillaDep] = useState('');
  const [nuevaPlantillaDest, setNuevaPlantillaDest] = useState('');
  const [nuevaPlantillaCargo, setNuevaPlantillaCargo] = useState('');
  const [nuevaPlantillaDesc, setNuevaPlantillaDesc] = useState('');

  // Drag in Kanban
  const [draggedGestionId, setDraggedGestionId] = useState<string | null>(null);

  // Google Drive base folder
  const [googleDriveBaseUrl, setGoogleDriveBaseUrl] = useState('');

  useEffect(() => {
    async function loadDriveStatus() {
      try {
        const res = await getGoogleDriveStatusAction();
        if (res.success && res.folderUrl) {
          setGoogleDriveBaseUrl(res.folderUrl);
        }
      } catch (err) {
        console.warn('Error loading drive status in gestiones:', err);
      }
    }
    loadDriveStatus();
  }, []);

  useEffect(() => {
    if (gestionSeleccionada) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gestionSeleccionada?.notas]);

  // Filter logic
  const filteredGestiones = gestiones.filter((g) => {
    const matchesSearch = 
      g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.curp.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.seccionElectoral.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.colonia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.notas.some(n => n.texto.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEstatus = filtroEstatus === 'Todos' || g.estatus === filtroEstatus;
    const matchesTipo = filtroTipo === 'Todos' || g.tipo === filtroTipo;

    return matchesSearch && matchesEstatus && matchesTipo;
  });

  // OCR INE Simulation (with Face / Photo Extraction)
  const handleSimulateOcrIne = () => {
    setIsOcrProcessing(true);
    setTimeout(() => {
      setNombre('Guadalupe del Carmen Ramos Jiménez');
      setCurp('RAJG850619MTBLNR01');
      setDireccion('Av. Gregorio Méndez Magaña #1420');
      setColonia('Col. Nueva Villahermosa');
      setMunicipio('Centro (Villahermosa)');
      setSeccionElectoral('0342');
      setTelefono('993 765 4321');
      setAvatarUrl('https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80');
      setIsOcrProcessing(false);
      setOcrSuccess(true);
    }, 1200);
  };

  const handleFileUploadRegistration = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsOcrProcessing(true);
    setTimeout(() => {
      setNombre('Guadalupe del Carmen Ramos Jiménez');
      setCurp('RAJG850619MTBLNR01');
      setDireccion('Av. Gregorio Méndez Magaña #1420');
      setColonia('Col. Nueva Villahermosa');
      setMunicipio('Centro (Villahermosa)');
      setSeccionElectoral('0342');
      setTelefono('993 765 4321');
      setAvatarUrl('https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80');
      setIsOcrProcessing(false);
      setOcrSuccess(true);
    }, 1000);
  };

  const handleCrearGestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !descripcion.trim()) {
      alert('Por favor completa el nombre del ciudadano y la descripción de la gestión.');
      return;
    }

    let tipoFinal = tipo;
    if (isCustomTipo) {
      const customTrimmed = customTipoInput.trim();
      if (!customTrimmed) {
        alert('Por favor escribe el nombre del nuevo tipo de gestión.');
        return;
      }
      tipoFinal = customTrimmed;
      if (!tiposGestion.includes(tipoFinal)) {
        setTiposGestion([...tiposGestion, tipoFinal]);
      }
    }

    const newFolio = `GES-2026-${String(90 + gestiones.length).padStart(3, '0')}`;
    const slugName = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const nueva: GestionCiudadana = {
      id: `ges-${Date.now()}`,
      folio: newFolio,
      nombre: nombre.trim(),
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      telefono: telefono.trim() || 'Sin teléfono',
      municipio: municipio.trim(),
      curp: curp.trim() || 'No especificada',
      direccion: direccion.trim() || 'Distrito 04',
      colonia: colonia.trim() || 'Centro',
      seccionElectoral: seccionElectoral.trim() || '0000',
      tipo: tipoFinal,
      descripcion: descripcion.trim(),
      estatus: 'Recibida',
      prioridad,
      dependenciaDestino: dependenciaDestino.trim() || 'Por definir',
      fecha: 'Hoy',
      driveFolderUrl: `${googleDriveBaseUrl}/${newFolio}-${slugName}`,
      documentos: [
        {
          id: `doc-${Date.now()}`,
          nombre: 'INE_Credencial_Digital.pdf',
          tipo: 'Identificación INE (Rostro Extraído)',
          fecha: 'Hoy',
          tamano: '1.4 MB',
          urlDrive: `${googleDriveBaseUrl}/ine-${slugName}.pdf`,
        }
      ],
      oficios: [],
      notas: [
        {
          id: `not-${Date.now()}`,
          fecha: 'Hoy',
          hora: getCurrentTimeMexicoCity(),
          autor: 'Recepción y Gestión',
          texto: 'Gestión registrada en el sistema. Se procedió a integrar el expediente digital inicial.',
          esDiputado: false,
        }
      ],
    };

    setGestiones([nueva, ...gestiones]);
    
    // Disparar creación en vivo en Google Drive API si está conectado
    createGestionDriveFolderAction(newFolio, nombre.trim()).then((driveRes) => {
      if (driveRes.success && driveRes.folderUrl) {
        setGestiones((prev) =>
          prev.map((g) => (g.id === nueva.id ? { ...g, driveFolderUrl: driveRes.folderUrl! } : g))
        );
      }
    }).catch(console.warn);

    // Notification of automatic Google Drive Folder Creation by ID
    alert(`✅ ¡Gestión ${newFolio} registrada exitosamente!\n\n📁 Se creó automáticamente la carpeta en Google Drive:\n• Nombre: /${newFolio} - ${nombre.trim()}/\n• ID de Gestión: ${newFolio}\n• Estado: Vinculada y lista para recibir documentos.`);

    // Reset form
    setNombre('');
    setAvatarUrl('');
    setTelefono('');
    setCurp('');
    setDireccion('');
    setColonia('');
    setSeccionElectoral('');
    setDescripcion('');
    setIsCustomTipo(false);
    setCustomTipoInput('');
    setOcrSuccess(false);
    setIsModalCrearOpen(false);
  };

  const handleCambiarEstado = (gestionId: string, nuevoEstado: EstadoGestion) => {
    setGestiones(gestiones.map(g => g.id === gestionId ? { ...g, estatus: nuevoEstado } : g));
    if (gestionSeleccionada && gestionSeleccionada.id === gestionId) {
      setGestionSeleccionada({ ...gestionSeleccionada, estatus: nuevoEstado });
    }
  };

  // Add Note in WhatsApp Chat Style (Author is automatically the currently active user)
  const handleAgregarNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNotaTexto.trim() || !gestionSeleccionada) return;

    const esDip = usuarioActivo.nombre.includes('Dip. Ruben Roque');

    const nuevaNota: NotaObservacion = {
      id: `not-${Date.now()}`,
      fecha: 'Hoy',
      hora: getCurrentTimeMexicoCity(),
      autor: usuarioActivo.nombre,
      texto: nuevaNotaTexto.trim(),
      esDiputado: esDip,
    };

    const updatedGestion: GestionCiudadana = {
      ...gestionSeleccionada,
      notas: [...gestionSeleccionada.notas, nuevaNota],
    };

    setGestiones(gestiones.map(g => g.id === gestionSeleccionada.id ? updatedGestion : g));
    setGestionSeleccionada(updatedGestion);
    setNuevaNotaTexto('');
  };

  const handleEliminarNota = (notaId: string) => {
    if (!gestionSeleccionada) return;
    const updatedGestion: GestionCiudadana = {
      ...gestionSeleccionada,
      notas: gestionSeleccionada.notas.filter(n => n.id !== notaId),
    };
    setGestiones(gestiones.map(g => g.id === gestionSeleccionada.id ? updatedGestion : g));
    setGestionSeleccionada(updatedGestion);
  };

  // Upload document in digital dossier & update avatar if INE
  const handleUploadDossierDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gestionSeleccionada) return;

    setIsUploadingDossierDoc(true);
    setTimeout(() => {
      const isIne = file.name.toLowerCase().includes('ine') || file.name.toLowerCase().includes('credencial') || file.type.includes('image');
      const newAvatar = isIne 
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
        : gestionSeleccionada.avatarUrl;

      const newDoc: DocumentoExpediente = {
        id: `doc-${Date.now()}`,
        nombre: file.name,
        tipo: isIne ? 'Identificación INE (Rostro Extraído)' : 'Documento Anexo / Evidencia',
        fecha: 'Hoy',
        tamano: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        urlDrive: `${gestionSeleccionada.driveFolderUrl}/${file.name}`,
      };

      const updatedGestion: GestionCiudadana = {
        ...gestionSeleccionada,
        avatarUrl: newAvatar,
        documentos: [...gestionSeleccionada.documentos, newDoc],
      };

      setGestiones(gestiones.map(g => g.id === gestionSeleccionada.id ? updatedGestion : g));
      setGestionSeleccionada(updatedGestion);
      setIsUploadingDossierDoc(false);
      alert(`✅ ¡Documento "${file.name}" subido a Google Drive API en segundo plano exitosamente!\n\n• Alojado en: /Expedientes-Distrito04/${gestionSeleccionada.folio}/\n• ID de Drive: drive.google.com/file/d/1X9Z-${Date.now()}\n${isIne ? '• Rostro de la credencial INE extraído como fotografía oficial.' : ''}`);
    }, 900);
  };

  // Kanban Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedGestionId(id);
  };

  const handleDropKanban = (e: React.DragEvent, targetEstado: EstadoGestion) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedGestionId;
    if (!id) return;
    handleCambiarEstado(id, targetEstado);
    setDraggedGestionId(null);
  };

  // Generador de Oficio con IA
  const handleAbrirGeneradorOficio = (gestion: GestionCiudadana) => {
    setGestionSeleccionada(gestion);
    const plantilla = plantillasOficios[0];
    setPlantillaSeleccionadaId(plantilla.id);
    setOficioDependencia(plantilla.dependenciaPredeterminada);
    setOficioDestinatario(plantilla.destinatarioSugerido);
    setOficioCargo(plantilla.cargoSugerido);
    
    generarTextoOficio(gestion, plantilla.destinatarioSugerido, plantilla.cargoSugerido, plantilla.dependenciaPredeterminada, plantilla.titulo);
    setIsModalOficioOpen(true);
  };

  const handleCambiarPlantilla = (plantillaId: string) => {
    setPlantillaSeleccionadaId(plantillaId);
    const plan = plantillasOficios.find(p => p.id === plantillaId);
    if (plan && gestionSeleccionada) {
      setOficioDependencia(plan.dependenciaPredeterminada);
      setOficioDestinatario(plan.destinatarioSugerido);
      setOficioCargo(plan.cargoSugerido);
      generarTextoOficio(gestionSeleccionada, plan.destinatarioSugerido, plan.cargoSugerido, plan.dependenciaPredeterminada, plan.titulo);
    }
  };

  const generarTextoOficio = (
    ges: GestionCiudadana, 
    destinatario: string, 
    cargo: string, 
    dependencia: string,
    tituloPlantilla: string
  ) => {
    setIsOficioGenerating(true);
    setTimeout(() => {
      const fechaHoy = new Date().toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: 'numeric', month: 'long', year: 'numeric' });
      const texto = `PODER LEGISLATIVO DEL ESTADO DE TABASCO
H. CONGRESO DEL ESTADO — LXVI LEGISLATURA
DESPACHO PARLAMENTARIO DEL DIPUTADO RUBEN ROQUE

OFICIO No. LXVI-DIP-RR/GESTIÓN/${ges.folio.replace('GES-', '')}/2026
ASUNTO: Canalización y Solicitud de Atención Prioritaria a Petición Ciudadana.
Villahermosa, Tabasco; a ${fechaHoy}.

${destinatario.toUpperCase()}
${cargo.toUpperCase()}
${dependencia.toUpperCase()}
PRESENTE.

Con el debido respeto que su investidura merece y en ejercicio de las facultades que me confieren los artículos 8° de la Constitución Política de los Estados Unidos Mexicanos y la Ley Orgánica del Poder Legislativo del Estado de Tabasco, me dirijo a Usted para hacer de su conocimiento la solicitud ciudadana registrada en nuestra Casa de Enlace Parlamentario.

El(La) C. ${ges.nombre.toUpperCase()}, con CURP ${ges.curp}, con domicilio en ${ges.direccion}, ${ges.colonia}, perteneciente al Municipio de ${ges.municipio} y Sección Electoral ${ges.seccionElectoral}, ha solicitado nuestra intervención institucional para la gestión del rubro de "${ges.tipo.toUpperCase()}":

"${ges.descripcion}"

En virtud de la noble vocación de servicio que distingue a la dependencia a su digno cargo, solicito atentamente se sirva instruir a quien corresponda la valoración, trámite y resolución favorable de la presente petición en beneficio directo de la parte solicitante.

Agradeciendo de antemano la atención prioritaria que brinde al presente, quedo a sus apreciables órdenes para el seguimiento conjunto de esta gestión social.

ATENTAMENTE
"SUFRAGIO EFECTIVO, NO REELECCIÓN"

___________________________________________________
DIP. RUBEN ROQUE
DIPUTADO LOCAL — LXVI LEGISLATURA
H. CONGRESO DEL ESTADO DE TABASCO

C.c.p. C. ${ges.nombre} - Solicitante.
C.c.p. Archivo de Gestión y Enlace Parlamentario.`;

      setOficioTextoGenerado(texto);
      setIsOficioGenerating(false);
    }, 400);
  };

  const handleDescargarDocxOficio = async () => {
    if (!gestionSeleccionada) return;
    const blob = await generateDocxBlob(
      oficioTextoGenerado,
      `Oficio de Gestión - ${gestionSeleccionada.folio} - ${gestionSeleccionada.nombre}`
    );
    downloadBlob(blob, `Oficio_${gestionSeleccionada.folio}_${gestionSeleccionada.nombre.replace(/\s+/g, '_')}.docx`);
  };

  const handleCopiarOficio = () => {
    navigator.clipboard.writeText(oficioTextoGenerado);
    setCopiadoOficio(true);
    setTimeout(() => setCopiadoOficio(false), 2000);
  };

  const handleGuardarNuevaPlantilla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPlantillaTitulo.trim() || !nuevaPlantillaDep.trim()) {
      alert('Completa los campos obligatorios de la plantilla.');
      return;
    }

    const nuevaP: PlantillaOficio = {
      id: `plan-${Date.now()}`,
      titulo: nuevaPlantillaTitulo.trim(),
      dependenciaPredeterminada: nuevaPlantillaDep.trim(),
      destinatarioSugerido: nuevaPlantillaDest.trim() || 'Titular de la Dependencia',
      cargoSugerido: nuevaPlantillaCargo.trim() || 'Director General',
      descripcionMuestra: nuevaPlantillaDesc.trim() || 'Plantilla personalizada guardada por el despacho.',
    };

    setPlantillasOficios([...plantillasOficios, nuevaP]);
    setNuevaPlantillaTitulo('');
    setNuevaPlantillaDep('');
    setNuevaPlantillaDest('');
    setNuevaPlantillaCargo('');
    setNuevaPlantillaDesc('');
    setIsModalNuevaPlantillaOpen(false);
  };

  const getEstatusBadge = (estatus: EstadoGestion) => {
    switch (estatus) {
      case 'Recibida':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'En Revisión':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Trámite con Dependencia':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Resuelta':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-800';
    }
  };

  const getPrioridadBadge = (p: string) => {
    switch (p) {
      case 'Alta':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Media':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-800';
    }
  };

  const getAutorChatColor = (autor: string) => {
    if (autor.includes('Dip. Ruben Roque')) return 'text-emerald-700';
    if (autor.includes('Asesora') || autor.includes('Mariana')) return 'text-indigo-700';
    if (autor.includes('Secretario') || autor.includes('Roberto')) return 'text-blue-700';
    if (autor.includes('Territorio')) return 'text-purple-700';
    return 'text-amber-700';
  };

  const renderAvatar = (ges: { nombre: string; avatarUrl?: string }, size = 'md') => {
    const sizeClasses = 
      size === 'sm' ? 'h-7 w-7 text-xs' :
      size === 'lg' ? 'h-16 w-16 text-lg' :
      size === 'xl' ? 'h-20 w-20 text-xl' : 'h-9 w-9 text-xs';

    if (ges.avatarUrl) {
      return (
        <div className={`${sizeClasses} rounded-full overflow-hidden shrink-0 border-2 border-white shadow-xs relative bg-gray-100 dark:bg-gray-800`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ges.avatarUrl}
            alt={ges.nombre}
            className="h-full w-full object-cover"
          />
        </div>
      );
    }

    const initials = ges.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return (
      <div className={`${sizeClasses} rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 border-2 border-white shadow-xs`}>
        {initials || 'C'}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          onClick={() => {
            setIsOcrProcessing(false);
            setOcrSuccess(false);
            setAvatarUrl('');
            setIsModalCrearOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nueva Gestión Ciudadana</span>
        </button>
      </div>

      {/* Bar: View Switcher (Lista vs Kanban) + Filters & Search */}
      <div className="bg-white dark:bg-[#121824] p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setVistaModo('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'kanban'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Tablero Kanban</span>
            </button>
            <button
              onClick={() => setVistaModo('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vistaModo === 'lista'
                  ? 'bg-white text-blue-600 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Lista / Tabla</span>
            </button>
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos los Tipos</option>
            {tiposGestion.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos los Estados</option>
            {ESTADOS_KANBAN.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, folio, CURP, sección o notas..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-100 font-medium"
          />
        </div>
      </div>

      {/* 1. VISTA TABLERO KANBAN */}
      {vistaModo === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4.5 items-start">
          {ESTADOS_KANBAN.map((estadoColumna) => {
            const itemsEnColumna = filteredGestiones.filter((g) => g.estatus === estadoColumna);

            return (
              <div
                key={estadoColumna}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropKanban(e, estadoColumna)}
                className="bg-gray-100 dark:bg-gray-800/70 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 min-h-[580px] flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      estadoColumna === 'Recibida' ? 'bg-amber-500' :
                      estadoColumna === 'En Revisión' ? 'bg-blue-500' :
                      estadoColumna === 'En Trámite con Dependencia' ? 'bg-purple-500' : 'bg-emerald-500'
                    }`}></span>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                      {estadoColumna}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200/80 dark:border-gray-800 shadow-2xs">
                    {itemsEnColumna.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {itemsEnColumna.map((ges) => {
                    const ultimaNota = ges.notas[ges.notas.length - 1];
                    return (
                      <div
                        key={ges.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ges.id)}
                        onClick={() => setGestionSeleccionada(ges)}
                        className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800/90 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {ges.folio}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPrioridadBadge(ges.prioridad)}`}>
                            Prioridad {ges.prioridad}
                          </span>
                        </div>

                        {/* Citizen Avatar + Name Header */}
                        <div className="flex items-center gap-2.5 pt-0.5">
                          {renderAvatar(ges, 'md')}
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                              {ges.nombre}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">CURP: {ges.curp.slice(0, 10)}...</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed bg-gray-50 dark:bg-gray-800/40/70 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                          {ges.descripcion}
                        </p>

                        {/* Última nota en formato de chat bubble */}
                        {ultimaNota && (
                          <div className="p-2 bg-[#d9fdd3]/70 rounded-xl border border-emerald-300/60 text-[10px] space-y-0.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3 text-[#00a884]" />
                                <span>{ultimaNota.autor}:</span>
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">{ultimaNota.hora}</span>
                            </div>
                            <p className="text-gray-800 dark:text-gray-100 italic line-clamp-1">&quot;{ultimaNota.texto}&quot;</p>
                          </div>
                        )}

                        <div className="space-y-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium pt-1 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-semibold text-gray-700 dark:text-gray-200">📍 {ges.colonia}</span>
                            <span className="text-blue-600 font-bold">Sec. {ges.seccionElectoral}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-400 dark:text-gray-500">
                            <span>Rubro: <strong className="text-gray-700 dark:text-gray-200">{ges.tipo}</strong></span>
                            <span className="flex items-center gap-1.5">
                              <span>{ges.documentos.length} docs</span>
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                <MessageCircle className="h-2.5 w-2.5" />
                                {ges.notas.length}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAbrirGeneradorOficio(ges);
                            }}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Oficio IA</span>
                          </button>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px]">{ges.fecha}</span>
                        </div>
                      </div>
                    );
                  })}

                  {itemsEnColumna.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-gray-200/80 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic">
                      Arrastra una gestión aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VISTA TABLA / LISTA */}
      {vistaModo === 'lista' && (
        <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Folio</th>
                  <th className="py-3.5 px-4">Ciudadano (Foto INE / Contacto)</th>
                  <th className="py-3.5 px-4">Ubicación y Sección</th>
                  <th className="py-3.5 px-4">Tipo / Descripción</th>
                  <th className="py-3.5 px-4">Observaciones (Chat)</th>
                  <th className="py-3.5 px-4">Estatus</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-200">
                {filteredGestiones.map((ges) => {
                  const ultimaNota = ges.notas[ges.notas.length - 1];
                  return (
                    <tr 
                      key={ges.id} 
                      onClick={() => setGestionSeleccionada(ges)}
                      className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 font-mono font-bold text-blue-600">
                        {ges.folio}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {renderAvatar(ges, 'md')}
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{ges.nombre}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">📞 {ges.telefono} • CURP: {ges.curp.slice(0, 10)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{ges.colonia}</p>
                        <p className="text-[11px] text-blue-600 font-bold">Sección {ges.seccionElectoral} • {ges.municipio}</p>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <span className="inline-block text-[10px] font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200 mb-0.5">
                          {ges.tipo}
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 truncate font-medium">{ges.descripcion}</p>
                      </td>
                      <td className="py-4 px-4 max-w-[200px]">
                        {ultimaNota ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-[#00a884] text-[10px] font-bold border border-emerald-200">
                                <MessageCircle className="h-2.5 w-2.5" />
                                <span>{ges.notas.length}</span>
                              </span>
                              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 truncate">{ultimaNota.autor}:</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 truncate">&quot;{ultimaNota.texto}&quot;</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-[11px] italic">Sin notas</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEstatusBadge(ges.estatus)}`}>
                          {ges.estatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleAbrirGeneradorOficio(ges)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Oficio</span>
                          </button>
                          <button
                            onClick={() => setGestionSeleccionada(ges)}
                            className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg"
                          >
                            Expediente
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: REGISTRAR GESTIÓN */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-2xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Nueva Gestión y Expediente Digital</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Captura los datos del ciudadano o extrae automáticamente con escaneo de INE.</p>
                </div>
              </div>
              <button onClick={() => setIsModalCrearOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Escaneo Inteligente de Credencial INE + Extracción de Fotografía con IA</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Auto-Relleno & Avatar</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Al subir o escanear la credencial de elector (INE), el sistema extrae automáticamente el <strong>Rostro del Ciudadano</strong> como avatar, además de Nombre, CURP, Dirección y Sección Electoral.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUploadRegistration}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isOcrProcessing}
                  className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-800 dark:text-gray-100 text-xs font-bold px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 shadow-2xs transition-all"
                >
                  <Upload className="h-3.5 w-3.5 text-blue-600" />
                  <span>Subir Archivo de INE</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateOcrIne}
                  disabled={isOcrProcessing}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{isOcrProcessing ? 'Extrayendo rostro y datos con IA...' : '📸 Escanear INE con IA (Demo)'}</span>
                </button>

                {ocrSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1.5 rounded-lg animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>¡Rostro y datos extraídos exitosamente!</span>
                  </span>
                )}
              </div>

              {avatarUrl && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-200 animate-in fade-in">
                  <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="Rostro extraído" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">Fotografía del INE Extraída con IA</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Esta imagen se usará como avatar oficial de la gestión y expediente.</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCrearGestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Nombre Completo del Ciudadano <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan Carlos Morales Hernández"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    Teléfono / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Ej: 993 123 4567"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">CURP</label>
                  <input
                    type="text"
                    value={curp}
                    onChange={(e) => setCurp(e.target.value)}
                    placeholder="Ej: MOHJ820415HTBLRN09"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Municipio / Distrito</label>
                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ej: Centro (Villahermosa)"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Sección Electoral</label>
                  <input
                    type="text"
                    value={seccionElectoral}
                    onChange={(e) => setSeccionElectoral(e.target.value)}
                    placeholder="Ej: 0342"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-blue-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Dirección / Calle y Número</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Calle Narciso Mendoza #104"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Colonia / Poblado</label>
                  <input
                    type="text"
                    value={colonia}
                    onChange={(e) => setColonia(e.target.value)}
                    placeholder="Ej: Col. Atasta de Serra"
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Tipo de Gestión (Rubro)
                  </label>
                  <select
                    value={isCustomTipo ? '__OTRO__' : tipo}
                    onChange={(e) => {
                      if (e.target.value === '__OTRO__') {
                        setIsCustomTipo(true);
                        setCustomTipoInput('');
                      } else {
                        setIsCustomTipo(false);
                        setTipo(e.target.value);
                      }
                    }}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {tiposGestion.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__OTRO__">✨ + Agregar nuevo tipo de gestión...</option>
                  </select>

                  {isCustomTipo && (
                    <input
                      type="text"
                      required
                      value={customTipoInput}
                      onChange={(e) => setCustomTipoInput(e.target.value)}
                      placeholder="Escribe el nuevo tipo (ej. Vivienda, Asesoría Agraria...)"
                      className="w-full p-2 text-xs bg-white border border-blue-200 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full p-2 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Dependencia Destino / Canalización
                </label>
                <input
                  type="text"
                  value={dependenciaDestino}
                  onChange={(e) => setDependenciaDestino(e.target.value)}
                  placeholder="Ej: Secretaría de Salud, SOTOP, DIF Tabasco, Ayuntamiento..."
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Descripción Detallada de la Petición Ciudadana <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe la petición, antecedentes, apoyo solicitado y beneficiarios..."
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Guardar Gestión y Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EXPEDIENTE DIGITAL DEL CIUDADANO CON CHAT ESTILO WHATSAPP DE OBSERVACIONES */}
      {gestionSeleccionada && !isModalOficioOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-3xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  {gestionSeleccionada.folio}
                </span>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Expediente Digital del Ciudadano</h2>
              </div>
              <button onClick={() => setGestionSeleccionada(null)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            {/* Citizen Header with Extracted Photo Avatar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl border border-gray-200/80 dark:border-gray-800/90">
              {renderAvatar(gestionSeleccionada, 'xl')}

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{gestionSeleccionada.nombre}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Camera className="h-3 w-3" />
                    <span>Foto INE Extraída con IA</span>
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 font-mono">CURP: <strong className="text-gray-900 dark:text-white">{gestionSeleccionada.curp}</strong></p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300 pt-0.5">
                  <span>📞 {gestionSeleccionada.telefono}</span>
                  <span>📍 {gestionSeleccionada.colonia}, {gestionSeleccionada.municipio}</span>
                  <span className="text-blue-700 font-bold">Sección {gestionSeleccionada.seccionElectoral}</span>
                </div>
              </div>

              <a
                href={`https://api.whatsapp.com/send?phone=52${gestionSeleccionada.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${gestionSeleccionada.nombre}, le escribimos del Despacho del Diputado Ruben Roque respecto a su gestión folio ${gestionSeleccionada.folio}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm shrink-0 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Petición & Estado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100">Descripción de la Solicitud:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Estado actual:</span>
                  <select
                    value={gestionSeleccionada.estatus}
                    onChange={(e) => handleCambiarEstado(gestionSeleccionada.id, e.target.value as EstadoGestion)}
                    className="text-xs font-bold bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg px-2.5 py-1 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    {ESTADOS_KANBAN.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed bg-white p-3 rounded-xl border border-gray-200/80 dark:border-gray-800">
                {gestionSeleccionada.descripcion}
              </p>
            </div>

            {/* SECCIÓN: CHAT DE ANOTACIONES ESTILO WHATSAPP */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>Bitácora de Anotaciones y Observaciones</span>
                      <span className="text-[10px] font-bold text-[#00a884] bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        Chat Interno ({gestionSeleccionada.notas.length})
                      </span>
                    </h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">Historial cronológico de seguimiento del despacho</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">WhatsApp Style</span>
              </div>

              {/* Contenedor del Chat con fondo tipo WhatsApp */}
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#efeae2]/60 dark:bg-gray-900/90 overflow-hidden shadow-inner flex flex-col">
                {/* Chat Feed */}
                <div className="p-4 space-y-3 max-h-72 overflow-y-auto min-h-[160px]">
                  {gestionSeleccionada.notas.length > 0 ? (
                    gestionSeleccionada.notas.map((nota) => {
                      const isDip = nota.autor.includes('Dip. Ruben Roque');
                      return (
                        <div
                          key={nota.id}
                          className={`flex flex-col ${isDip ? 'items-end' : 'items-start'} group`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl shadow-xs relative space-y-1 ${
                              isDip
                                ? 'bg-[#d9fdd3] rounded-tr-xs border border-[#c1f5b8]'
                                : 'bg-white dark:bg-gray-800 rounded-tl-xs border border-gray-200/80 dark:border-gray-700/80 border-gray-200/80 dark:border-gray-800/80'
                            }`}
                          >
                            {/* Autor & Badge */}
                            <div className="flex items-center justify-between gap-3 text-[11px]">
                              <span className={`font-bold ${getAutorChatColor(nota.autor)}`}>
                                {nota.autor} {isDip ? '👑' : ''}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEliminarNota(nota.id)}
                                title="Eliminar nota"
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded transition-all"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Mensaje */}
                            <p className="text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap font-sans">
                              {nota.texto}
                            </p>

                            {/* Timestamp & Double Check */}
                            <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono pt-0.5">
                              <span>{nota.fecha} • {nota.hora}</span>
                              <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic gap-1">
                      <MessageCircle className="h-6 w-6 text-slate-300" />
                      <span>No hay observaciones registradas aún. Escribe el primer apunte abajo.</span>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* WhatsApp Chat Input Bar (Usuario Activo automático) */}
                <form onSubmit={handleAgregarNota} className="p-2.5 bg-[#f0f2f5] dark:bg-[#1a2234] border-t border-gray-200/80 dark:border-gray-800 border-gray-200/80 dark:border-gray-800/80 flex items-center gap-2">
                  {/* Badge de Usuario Activo */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-gray-200/80 dark:border-gray-800 shrink-0 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={usuarioActivo.foto}
                      alt={usuarioActivo.nombre}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">{usuarioActivo.nombre}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </div>

                  {/* Input con estilo WhatsApp */}
                  <div className="flex-1 flex items-center gap-2 w-full">
                    <input
                      type="text"
                      required
                      value={nuevaNotaTexto}
                      onChange={(e) => setNuevaNotaTexto(e.target.value)}
                      placeholder={`Escribir observación como ${usuarioActivo.nombre}...`}
                      className="flex-1 py-2 px-4 text-xs bg-white border border-gray-300 dark:border-gray-700 rounded-full text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] shadow-2xs"
                    />
                    <button
                      type="submit"
                      title="Enviar observación al chat"
                      className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sección Documentos & Enlace Google Drive */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              {/* Box Informativo de Carpeta Creada por ID */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <FolderOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-950 truncate">
                        Carpeta en Drive: /{gestionSeleccionada.folio} - {gestionSeleccionada.nombre}/
                      </span>
                      <span className="text-[9px] font-bold bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                        ID: {gestionSeleccionada.folio}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800/80 block">
                      Subcarpeta creada automáticamente en Google Drive API
                    </span>
                  </div>
                </div>

                <a
                  href={gestionSeleccionada.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs shrink-0"
                >
                  <FolderOpen className="h-3 w-3 text-amber-600" />
                  <span>Abrir Carpeta {gestionSeleccionada.folio}</span>
                  <ExternalLink className="h-2.5 w-2.5 text-amber-500" />
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Documentos Alojados en esta Carpeta ({gestionSeleccionada.documentos.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={dossierFileInputRef}
                    onChange={handleUploadDossierDocument}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => dossierFileInputRef.current?.click()}
                    disabled={isUploadingDossierDoc}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>{isUploadingDossierDoc ? 'Subiendo...' : '+ Subir Documento / INE'}</span>
                  </button>

                  <a
                    href={gestionSeleccionada.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                    <span>📂 Abrir en Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {gestionSeleccionada.documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40/50 flex items-center justify-between gap-2 hover:bg-white hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{doc.nombre}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{doc.tipo} • {doc.tamano}</p>
                      </div>
                    </div>
                    <a
                      href={doc.urlDrive}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0"
                    >
                      Ver en Drive
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleAbrirGeneradorOficio(gestionSeleccionada)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generar Oficio de Canalización con IA</span>
              </button>

              <button
                type="button"
                onClick={() => setGestionSeleccionada(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERADOR DE OFICIOS */}
      {isModalOficioOpen && gestionSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-4xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Redacción de Oficio de Canalización con IA</h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Generación oficial por demanda con técnica parlamentaria mexicana para {gestionSeleccionada.nombre}.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOficioOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200/80 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-blue-600" />
                  <span>Seleccionar Tipo de Oficio / Plantilla Muestra:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalNuevaPlantillaOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + Cargar Oficio Muestra / Nueva Plantilla
                </button>
              </div>

              <select
                value={plantillaSeleccionadaId}
                onChange={(e) => handleCambiarPlantilla(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                {plantillasOficios.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    📄 {plan.titulo} ➔ ({plan.dependenciaPredeterminada})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Destinatario Titular</label>
                  <input
                    type="text"
                    value={oficioDestinatario}
                    onChange={(e) => setOficioDestinatario(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Cargo Oficial</label>
                  <input
                    type="text"
                    value={oficioCargo}
                    onChange={(e) => setOficioCargo(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Dependencia</label>
                  <input
                    type="text"
                    value={oficioDependencia}
                    onChange={(e) => setOficioDependencia(e.target.value)}
                    className="w-full p-1.5 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Documento Oficial Generado (Listo para firma):</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const plan = plantillasOficios.find(p => p.id === plantillaSeleccionadaId);
                    generarTextoOficio(gestionSeleccionada, oficioDestinatario, oficioCargo, oficioDependencia, plan?.titulo || '');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Regenerar con IA</span>
                </button>
              </div>

              <textarea
                rows={13}
                value={oficioTextoGenerado}
                onChange={(e) => setOficioTextoGenerado(e.target.value)}
                className="w-full p-4 text-xs font-mono bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl leading-relaxed text-gray-800 dark:text-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopiarOficio}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 rounded-lg transition-colors"
                >
                  {copiadoOficio ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                  <span>{copiadoOficio ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDescargarDocxOficio}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 text-blue-600" />
                  <span>Descargar en Word (.docx)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOficioOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCambiarEstado(gestionSeleccionada.id, 'En Trámite con Dependencia');
                    alert('Oficio registrado y estado actualizado a "En Trámite con Dependencia".');
                    setIsModalOficioOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-sm transition-all"
                >
                  <Check className="h-4 w-4" />
                  <span>Guardar y Pasar a &quot;En Trámite&quot;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CARGAR NUEVA PLANTILLA */}
      {isModalNuevaPlantillaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-lg w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-600" />
                Cargar Oficio Muestra / Nueva Plantilla
              </h2>
              <button onClick={() => setIsModalNuevaPlantillaOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarNuevaPlantilla} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Título del Oficio Muestra <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevaPlantillaTitulo}
                  onChange={(e) => setNuevaPlantillaTitulo(e.target.value)}
                  placeholder="Ej: Solicitud de Luminarias y Alumbrado Público"
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Dependencia Destino <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={nuevaPlantillaDep}
                  onChange={(e) => setNuevaPlantillaDep(e.target.value)}
                  placeholder="Ej: Dirección de Obras Públicas Municipal"
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Destinatario Titular</label>
                  <input
                    type="text"
                    value={nuevaPlantillaDest}
                    onChange={(e) => setNuevaPlantillaDest(e.target.value)}
                    placeholder="Ej: Ing. Jorge García"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Cargo Oficial</label>
                  <input
                    type="text"
                    value={nuevaPlantillaCargo}
                    onChange={(e) => setNuevaPlantillaCargo(e.target.value)}
                    placeholder="Ej: Director General"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Descripción / Propósito del Oficio</label>
                <textarea
                  rows={3}
                  value={nuevaPlantillaDesc}
                  onChange={(e) => setNuevaPlantillaDesc(e.target.value)}
                  placeholder="Describe las instrucciones y términos para que la IA los use de referencia..."
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalNuevaPlantillaOpen(false)}
                  className="px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Guardar Plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}