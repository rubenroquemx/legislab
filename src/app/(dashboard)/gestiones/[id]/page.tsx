'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ChevronLeft, 
  MessageCircle, 
  FolderOpen, 
  ExternalLink, 
  FileText, 
  Send, 
  AlertTriangle,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  File,
  Image,
  Loader2,
  Trash2,
  Pencil,
  History,
  UserCheck,
  X,
  AlertOctagon
} from 'lucide-react';
import { 
  getGestiones, 
  updateGestionStatus, 
  addNotaGestion,
  deleteGestion,
  updateGestionResponsableAction,
  updateGestionDataAction
} from '@/app/actions/gestiones';
import { getOfficeUsersAction } from '@/app/actions/usuarios';
import { 
  getGestionDriveExpedienteAction,
  uploadDocumentToGestionDriveAction,
  deleteDocumentFromGestionDriveAction 
} from '@/app/actions/drive';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  normalizeEstadoGestion, 
  ESTADOS_KANBAN,
  TIPOS_GESTION_BASE,
  formatFechaHistorial,
  formatHoraHistorial,
  type EventoHistorial
} from '@/lib/gestiones-utils';

export default function GestionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [gestion, setGestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [usuariosDespacho, setUsuariosDespacho] = useState<any[]>([]);
  const [historial, setHistorial] = useState<EventoHistorial[]>([]);

  // Modales
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [archivoAEliminar, setArchivoAEliminar] = useState<any | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Formulario de edición
  const [formEdicion, setFormEdicion] = useState<{
    asunto: string;
    solicitante: string;
    curp: string;
    claveElector: string;
    seccionElectoral: string;
    direccion: string;
    colonia: string;
    municipio: string;
    telefono: string;
    email: string;
    prioridad: string;
    categoria: string;
    dependenciaCanalizada: string;
    responsableId: string;
  }>({
    asunto: '',
    solicitante: '',
    curp: '',
    claveElector: '',
    seccionElectoral: '',
    direccion: '',
    colonia: 'Centro',
    municipio: 'Centro',
    telefono: '',
    email: '',
    prioridad: 'Media',
    categoria: 'General',
    dependenciaCanalizada: '',
    responsableId: '',
  });

  // Drive state
  const [driveStatus, setDriveStatus] = useState<{
    connected: boolean;
    email?: string;
    folderUrl?: string | null;
    folderName?: string | null;
    files: any[];
    error?: string;
  }>({
    connected: false,
    email: '',
    folderUrl: null,
    folderName: null,
    files: [],
  });
  const [loadingDrive, setLoadingDrive] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bitácora notes
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Permisos: activo solo para quienes puedan editar, crear o eliminar gestiones
  const userRole = session?.user?.role;
  const isSuperAdmin = session?.user?.isSuperAdmin;
  let canDelete = false;
  let canEdit = false;

  if (isSuperAdmin || userRole === 'diputado' || userRole === 'admin') {
    canDelete = true;
    canEdit = true;
  } else if (session?.user?.permissions) {
    try {
      const perms = typeof session.user.permissions === 'string'
        ? JSON.parse(session.user.permissions)
        : session.user.permissions;
      const gPerms = perms?.Gestiones || perms?.gestiones;
      if (gPerms) {
        canDelete = Boolean(gPerms.eliminar || gPerms.editar || gPerms.crear);
        canEdit = Boolean(gPerms.editar || gPerms.crear);
      }
    } catch {
      canDelete = false;
      canEdit = false;
    }
  } else {
    // Si no hay sesión cargada aún en local dev, permitir por conveniencia
    canDelete = true;
    canEdit = true;
  }

  const currentUserName = session?.user?.name || 'Dip. Manuel Gurría';

  const loadDriveExpediente = async (gestionId: string) => {
    try {
      setLoadingDrive(true);
      const res = await getGestionDriveExpedienteAction(gestionId);
      if (res && res.success) {
        setDriveStatus({
          connected: Boolean(res.connected),
          email: res.email || '',
          folderUrl: res.folderUrl || null,
          folderName: res.folderName || null,
          files: res.files || [],
        });
        if (res.folderUrl) {
          setGestion((prev: any) => prev ? { ...prev, driveFolderUrl: res.folderUrl } : prev);
        }
      } else {
        setDriveStatus(prev => ({
          ...prev,
          connected: Boolean(res?.connected),
          error: res?.error,
        }));
      }
    } catch (err) {
      console.warn('Error loading Drive expediente:', err);
    } finally {
      setLoadingDrive(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [gestionesRes, usersRes] = await Promise.all([
          getGestiones(),
          getOfficeUsersAction(),
        ]);

        if (usersRes.success && usersRes.users) {
          setUsuariosDespacho(usersRes.users);
        }

        if (gestionesRes.success && gestionesRes.data) {
          const found = gestionesRes.data.find((g: any) => g.id === resolvedParams.id);
          if (found) {
            let docs: any[] = [];
            if (found.documentos) {
              try { docs = typeof found.documentos === 'string' ? JSON.parse(found.documentos) : found.documentos; } catch {}
            }
            let nts: any[] = [];
            if (found.notas) {
              try { nts = typeof found.notas === 'string' ? JSON.parse(found.notas) : found.notas; } catch {}
            }

            let meta: any = {};
            if (found.notasInternas) {
              try { meta = JSON.parse(found.notasInternas); } catch {}
            }

            // Historial de actualización
            let histList: EventoHistorial[] = [];
            if (Array.isArray(meta.historial) && meta.historial.length > 0) {
              histList = meta.historial;
            } else {
              const createdDate = found.createdAt ? new Date(found.createdAt) : new Date();
              histList = [
                {
                  id: `creacion-${found.id}`,
                  fechaDisplay: formatFechaHistorial(createdDate),
                  horaDisplay: formatHoraHistorial(createdDate),
                  usuario: meta.creadorNombre || 'Dip. Manuel Gurría',
                  accion: 'agregó esta gestión.',
                  tipo: 'creacion',
                  createdAt: createdDate.toISOString(),
                }
              ];
            }

            setHistorial(histList);
            setGestion({
              ...found,
              estatus: normalizeEstadoGestion(found.estatus),
              documentos: Array.isArray(docs) ? docs : [],
              notas: Array.isArray(nts) ? nts : [],
              responsableId: found.responsableId || meta.responsableId || null,
              responsableNombre: meta.responsableNombre || null,
              creadorNombre: meta.creadorNombre || null,
            });

            // Cargar expediente de Google Drive
            await loadDriveExpediente(found.id);
          }
        }
      } catch (err) {
        console.warn('Error fetching gestion details:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gestion?.notas]);

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!gestion) return;
    setGestion((prev: any) => ({ ...prev, estatus: nuevoEstado }));

    const now = new Date();
    const nuevoEvento: EventoHistorial = {
      id: `hist-${Date.now()}`,
      fechaDisplay: formatFechaHistorial(now),
      horaDisplay: formatHoraHistorial(now),
      usuario: currentUserName,
      accion: `cambió el estatus a "${nuevoEstado}".`,
      tipo: 'estatus',
      createdAt: now.toISOString(),
    };
    setHistorial((prev) => [nuevoEvento, ...prev]);

    await updateGestionStatus(gestion.id, nuevoEstado, currentUserName);
  };

  const handleCambiarResponsable = async (nuevoResponsableId: string) => {
    if (!gestion) return;
    const targetId = nuevoResponsableId ? nuevoResponsableId : null;
    const userObj = usuariosDespacho.find((u: any) => u.id === targetId);
    const responsableNombre = userObj ? userObj.name : undefined;

    setGestion((prev: any) => ({
      ...prev,
      responsableId: targetId,
      responsableNombre: responsableNombre || null,
    }));

    const now = new Date();
    const accionTexto = responsableNombre
      ? `asignó esta gestión a ${responsableNombre}.`
      : 'desasignó el responsable de esta gestión.';

    const nuevoEvento: EventoHistorial = {
      id: `hist-${Date.now()}`,
      fechaDisplay: formatFechaHistorial(now),
      horaDisplay: formatHoraHistorial(now),
      usuario: currentUserName,
      accion: accionTexto,
      tipo: 'asignacion',
      createdAt: now.toISOString(),
    };
    setHistorial((prev) => [nuevoEvento, ...prev]);

    await updateGestionResponsableAction(
      gestion.id,
      targetId,
      responsableNombre,
      currentUserName
    );
  };

  const handleAbrirModalEditar = () => {
    if (!gestion) return;
    setFormEdicion({
      asunto: gestion.asunto || '',
      solicitante: gestion.solicitante || '',
      curp: gestion.curp || '',
      claveElector: gestion.claveElector || '',
      seccionElectoral: gestion.seccionElectoral || '',
      direccion: gestion.direccion || '',
      colonia: gestion.colonia || 'Centro',
      municipio: gestion.municipio || 'Centro',
      telefono: gestion.telefono || '',
      email: gestion.email || '',
      prioridad: gestion.prioridad || 'Media',
      categoria: gestion.categoria || 'General',
      dependenciaCanalizada: gestion.dependenciaCanalizada || '',
      responsableId: gestion.responsableId || '',
    });
    setModalEditarOpen(true);
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestion) return;

    setIsSavingEdit(true);
    try {
      const respUser = usuariosDespacho.find((u: any) => u.id === formEdicion.responsableId);
      const responsableNombre = respUser ? respUser.name : undefined;

      const res = await updateGestionDataAction(
        gestion.id,
        {
          ...formEdicion,
          responsableId: formEdicion.responsableId || null,
          responsableNombre,
        },
        currentUserName
      );

      if (res.success) {
        setGestion((prev: any) => ({
          ...prev,
          ...formEdicion,
          responsableId: formEdicion.responsableId || null,
          responsableNombre: responsableNombre || null,
        }));

        const now = new Date();
        const nuevoEvento: EventoHistorial = {
          id: `hist-${Date.now()}`,
          fechaDisplay: formatFechaHistorial(now),
          horaDisplay: formatHoraHistorial(now),
          usuario: currentUserName,
          accion: 'actualizó los datos de la gestión.',
          tipo: 'edicion',
          createdAt: now.toISOString(),
        };
        setHistorial((prev) => [nuevoEvento, ...prev]);
        setModalEditarOpen(false);
      }
    } catch (err) {
      console.error('Error saving edition:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

    const handleConfirmarEliminarArchivo = async () => {
    if (!archivoAEliminar || !gestion) return;
    setIsDeletingFile(true);
    try {
      const res = await deleteDocumentFromGestionDriveAction(
        gestion.id,
        archivoAEliminar.id,
        archivoAEliminar.nombre,
        currentUserName
      );

      if (res.success) {
        setDriveStatus(prev => ({
          ...prev,
          files: prev.files.filter((f: any) => f.id !== archivoAEliminar.id && f.nombre !== archivoAEliminar.nombre),
        }));

        setGestion((prev: any) => ({
          ...prev,
          documentos: (prev.documentos || []).filter((d: any) => d.id !== archivoAEliminar.id && d.nombre !== archivoAEliminar.nombre),
        }));

        const now = new Date();
        const nuevoEvento: EventoHistorial = {
          id: `hist-${Date.now()}`,
          fechaDisplay: formatFechaHistorial(now),
          horaDisplay: formatHoraHistorial(now),
          usuario: currentUserName,
          accion: `eliminó el archivo "${archivoAEliminar.nombre}" del expediente.`,
          tipo: 'documento',
          createdAt: now.toISOString(),
        };
        setHistorial((prev) => [nuevoEvento, ...prev]);

        setArchivoAEliminar(null);
      } else {
        alert(res.error || 'No se pudo eliminar el archivo.');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Error de red al eliminar el archivo.');
    } finally {
      setIsDeletingFile(false);
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!gestion || !canDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteGestion(gestion.id);
      if (res.success) {
        router.push('/gestiones');
      } else {
        alert('No se pudo eliminar la gestión. Por favor inténtalo de nuevo.');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting gestion:', err);
      setIsDeleting(false);
    }
  };

  const formatNotaTimestamp = (nota: any): string => {
    if (nota.createdAt) {
      try {
        const d = new Date(nota.createdAt);
        const f = d.toLocaleDateString('es-MX', {
          timeZone: 'America/Mexico_City',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const h = d.toLocaleTimeString('es-MX', {
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${f} • ${h}`;
      } catch {}
    }

    let f = nota.fecha;
    if (!f || f === 'Hoy') {
      f = new Date().toLocaleDateString('es-MX', {
        timeZone: 'America/Mexico_City',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    const h = nota.hora || '';
    return h ? `${f} • ${h}` : f;
  };

  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestion || !nuevaNotaTexto.trim()) return;

    const now = new Date();
    const userTz = typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().timeZone 
      ? Intl.DateTimeFormat().resolvedOptions().timeZone 
      : 'America/Mexico_City';

    const fechaReal = now.toLocaleDateString('es-MX', {
      timeZone: userTz,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const horaReal = now.toLocaleTimeString('es-MX', {
      timeZone: userTz,
      hour: '2-digit',
      minute: '2-digit',
    });

    const nuevaNota = {
      id: `nota-${Date.now()}`,
      fecha: fechaReal,
      hora: horaReal,
      createdAt: now.toISOString(),
      autor: currentUserName,
      texto: nuevaNotaTexto.trim(),
      esDiputado: true,
    };

    const updatedNotas = [...gestion.notas, nuevaNota];
    setGestion({ ...gestion, notas: updatedNotas });
    setNuevaNotaTexto('');

    // Actualizar historial localmente
    const nuevoEvento: EventoHistorial = {
      id: `hist-${Date.now()}`,
      fechaDisplay: formatFechaHistorial(now),
      horaDisplay: formatHoraHistorial(now),
      usuario: currentUserName,
      accion: 'agregó una observación.',
      tipo: 'observacion',
      createdAt: now.toISOString(),
    };
    setHistorial((prev) => [nuevoEvento, ...prev]);

    await addNotaGestion(gestion.id, nuevaNota);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gestion) return;

    setUploadingFile(true);
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadDocumentToGestionDriveAction(gestion.id, formData);
      if (res.success && res.file) {
        setUploadSuccessMsg(`"${file.name}" guardado exitosamente en Google Drive.`);
        await loadDriveExpediente(gestion.id);
        setTimeout(() => setUploadSuccessMsg(null), 4000);
      } else {
        setUploadErrorMsg(res.error || 'No se pudo subir el archivo.');
        setTimeout(() => setUploadErrorMsg(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setUploadErrorMsg('Error de red al subir archivo.');
      setTimeout(() => setUploadErrorMsg(null), 5000);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (mimeType?: string, fileName?: string) => {
    const name = (fileName || '').toLowerCase();
    const type = (mimeType || '').toLowerCase();

    if (type.includes('image') || name.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
      return <Image className="h-5 w-5 text-emerald-600 shrink-0" />;
    }
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="h-5 w-5 text-red-600 shrink-0" />;
    }
    if (type.includes('word') || type.includes('document') || name.match(/\.(docx?|odt|txt)$/)) {
      return <FileText className="h-5 w-5 text-blue-600 shrink-0" />;
    }
    return <File className="h-5 w-5 text-slate-500 shrink-0" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!gestion) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500 font-medium">Gestión no encontrada o eliminada.</p>
        <Link href="/gestiones" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600">
          <ChevronLeft className="h-4 w-4" />
          <span>Volver al listado de gestiones</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header Simplificado: Sin título de solicitante, con acciones de Editar y Eliminar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/gestiones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver a Gestiones</span>
          </Link>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            {gestion.folio}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Botón Editar Gestión */}
          <button
            type="button"
            onClick={handleAbrirModalEditar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5 text-blue-600" />
            <span>Editar Gestión</span>
          </button>

          {/* Botón Eliminar Gestión (Permisos controlados) */}
          <button
            type="button"
            onClick={() => canDelete && setModalEliminarOpen(true)}
            disabled={!canDelete}
            title={!canDelete ? 'Solo los usuarios con permisos para crear, editar o eliminar gestiones pueden realizar esta acción' : 'Eliminar gestión'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              canDelete
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 active:scale-95 cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Eliminar Gestión</span>
          </button>
        </div>
      </div>

      {/* Alerta si Google Drive no está conectado */}
      {driveStatus.connected === false && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-950">Google Drive no está conectado al despacho</h4>
              <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                Para que la carpeta con el folio <strong className="font-mono">{gestion.folio}</strong> se cree automáticamente y permita respaldar los documentos en la nube, es necesario vincular Google Drive.
              </p>
            </div>
          </div>
          <Link
            href="/configuracion?tab=conexiones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0"
          >
            <span>Conectar Google Drive</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Citizen Card Summary (Bloque inferior con Estatus y Asignado a) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 shrink-0 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gestion.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={gestion.solicitante}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-2.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{gestion.solicitante}</h2>
            <StatusBadge status={gestion.prioridad} size="sm" />
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {gestion.categoria || 'General'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
            <span>CURP: <strong className="font-mono text-slate-900">{gestion.curp || 'No registrada'}</strong></span>
            <span>Sección Electoral: <strong className="text-blue-700">{gestion.seccionElectoral || 'S/D'}</strong></span>
            <span>📍 {gestion.colonia || 'Centro'}, {gestion.municipio || 'Centro'}</span>
            <span>📞 {gestion.telefono || 'Sin teléfono'}</span>
          </div>

          {/* Bloque de Estado y Asignado a: */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Estado:</span>
              <select
                value={gestion.estatus}
                onChange={(e) => handleCambiarEstado(e.target.value)}
                className="text-xs font-semibold bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
              >
                {ESTADOS_KANBAN.map((est) => (
                  <option key={est} value={est}>{est}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Asignado a:</span>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <select
                  value={gestion.responsableId || ''}
                  onChange={(e) => handleCambiarResponsable(e.target.value)}
                  className="text-xs font-medium bg-slate-50 hover:bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all max-w-[240px]"
                >
                  <option value="">Sin Asignar</option>
                  {usuariosDespacho.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.cargo ? `(${u.cargo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          {gestion.telefono && (
            <a
              href={`https://api.whatsapp.com/send?phone=52${gestion.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${gestion.solicitante}, le escribimos del Despacho Parlamentario sobre su gestión folio ${gestion.folio}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Asunto y Petición</h3>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          {gestion.asunto || 'Sin descripción.'}
        </p>
        <p className="text-xs text-slate-500 pt-1">
          Canalización institucional orientada a: <strong>{gestion.dependenciaCanalizada || 'Dependencia General'}</strong>
        </p>
      </div>

      {/* Two Column Layout: Observaciones & Historial | Expediente Digital */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna Izquierda: Observaciones & Historial de Actualización */}
        <div className="space-y-6">
          {/* Observaciones */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#00a884]" />
                <span>Observaciones</span>
              </h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 max-h-80 overflow-y-auto min-h-[200px]">
              {gestion.notas && gestion.notas.length > 0 ? (
                gestion.notas.map((nota: any) => (
                  <div key={nota.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-900">{nota.autor}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatNotaTimestamp(nota)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{nota.texto}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center italic py-8">No hay notas registradas.</p>
              )}
              <div ref={chatBottomRef} />
            </div>

            <form onSubmit={handleAgregarNota} className="flex gap-2">
              <input
                type="text"
                required
                value={nuevaNotaTexto}
                onChange={(e) => setNuevaNotaTexto(e.target.value)}
                placeholder="Escribir nota de seguimiento..."
                className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Enviar</span>
              </button>
            </form>
          </div>

          {/* Historial de Actualización (Abajo de Observaciones) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Historial de Actualización</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Registro cronológico de actividades y seguimiento</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {historial.length} registros
              </span>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-1 pt-1">
              {historial.map((item, idx) => (
                <div key={item.id || idx} className="relative pl-7 group">
                  <div className="absolute left-[7px] -translate-x-1/2 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all" />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.fechaDisplay}</span>
                      {item.horaDisplay && (
                        <span className="text-[10px] text-slate-400 font-mono">• {item.horaDisplay}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="font-semibold text-slate-900">{item.usuario}</span>{' '}
                      <span className="text-slate-600">{item.accion}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Expediente Digital */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Expediente digital</h3>
              </div>
            </div>

            {driveStatus.connected ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sincronizado</span>
                </span>
                <button
                  type="button"
                  onClick={() => loadDriveExpediente(gestion.id)}
                  disabled={loadingDrive}
                  title="Actualizar archivos de Drive"
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingDrive ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>Sin Conectar</span>
              </span>
            )}
          </div>

          {!driveStatus.connected ? (
            /* ALERTA: GOOGLE DRIVE NO CONECTADO */
            <div className="space-y-4 pt-1">
              <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Google Drive no está conectado al despacho</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Para que el expediente digital con folio <strong className="font-mono text-amber-950">{gestion.folio}</strong> cree su carpeta oficial en la nube y permita almacenar los documentos del ciudadano (<strong className="text-amber-950">{gestion.solicitante}</strong>), es indispensable vincular la cuenta de Google Drive.
                </p>
                <div className="pt-1">
                  <Link
                    href="/configuracion?tab=conexiones"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <span>Conectar Google Drive Ahora</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Al conectar Google Drive obtendrás:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>Creación automática de la carpeta del expediente digital.</li>
                  <li>Subida y respaldo directo de INE, comprobantes de domicilio y cartas de petición.</li>
                  <li>Acceso seguro y sincronizado para todo el equipo de trabajo del despacho.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* EXPEDIENTE CONECTADO: Solo el botón de Abrir en Drive (sin folio ni cuenta vinculada) */
            <div className="space-y-4">
              {(driveStatus.folderUrl || gestion.driveFolderUrl) && (
                <div className="flex items-center justify-end">
                  <a
                    href={driveStatus.folderUrl || gestion.driveFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Abrir en Drive</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* Zona de Carga de Archivos */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUploadFile}
                  disabled={uploadingFile}
                />
                <div 
                  onClick={() => !uploadingFile && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    uploadingFile 
                      ? 'border-blue-300 bg-blue-50/50 cursor-not-allowed' 
                      : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                >
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Subiendo archivo y sincronizando con Google Drive...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                        <Upload className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        Haz clic para subir un documento al expediente
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PDF, JPG, PNG, DOCX (Se almacena directamente en la carpeta de Drive)
                      </p>
                    </div>
                  )}
                </div>

                {uploadSuccessMsg && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                )}
                {uploadErrorMsg && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{uploadErrorMsg}</span>
                  </div>
                )}
              </div>

              {/* Lista de Documentos del Expediente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                  <span>Documentos en el Expediente ({driveStatus.files.length})</span>
                  {loadingDrive && <span className="text-[10px] text-blue-600 font-normal">Sincronizando...</span>}
                </div>

                {driveStatus.files && driveStatus.files.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {driveStatus.files.map((file: any) => (
                      <div
                        key={file.id || file.nombre}
                        className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(file.tipo, file.nombre)}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate" title={file.nombre}>
                              {file.nombre}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {file.tamano || 'Archivo'} • {file.fecha || 'Hoy'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.urlDrive && (
                            <a
                              href={file.urlDrive}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-200/70 text-slate-700 rounded-lg border border-slate-200 text-[11px] font-semibold transition-colors"
                              title="Ver en Google Drive"
                            >
                              <span>Ver</span>
                              <ExternalLink className="h-3 w-3 text-slate-500" />
                            </a>
                          )}
                          {file.webContentLink && (
                            <a
                              href={file.webContentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition-colors"
                              title="Descargar"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setArchivoAEliminar(file)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar archivo del expediente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">No hay documentos en la carpeta de este expediente.</p>
                    <p className="text-[11px] text-slate-400">Sube la credencial INE, comprobantes o cartas para respaldarlos en Drive.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Editar Gestión */}
      {modalEditarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Editar Gestión</h3>
                <p className="text-xs text-slate-500 font-medium">Actualiza los datos del solicitante y la canalización institucional</p>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleGuardarEdicion} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nombre del Solicitante *</label>
                  <input
                    type="text"
                    required
                    value={formEdicion.solicitante}
                    onChange={(e) => setFormEdicion({ ...formEdicion, solicitante: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">CURP</label>
                  <input
                    type="text"
                    value={formEdicion.curp}
                    onChange={(e) => setFormEdicion({ ...formEdicion, curp: e.target.value.toUpperCase() })}
                    maxLength={18}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Clave de Elector</label>
                  <input
                    type="text"
                    value={formEdicion.claveElector}
                    onChange={(e) => setFormEdicion({ ...formEdicion, claveElector: e.target.value.toUpperCase() })}
                    maxLength={18}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sección Electoral</label>
                  <input
                    type="text"
                    value={formEdicion.seccionElectoral}
                    onChange={(e) => setFormEdicion({ ...formEdicion, seccionElectoral: e.target.value })}
                    placeholder="Ej: 0451"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={formEdicion.telefono}
                    onChange={(e) => setFormEdicion({ ...formEdicion, telefono: e.target.value })}
                    placeholder="9931234567"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formEdicion.email}
                    onChange={(e) => setFormEdicion({ ...formEdicion, email: e.target.value })}
                    placeholder="ciudadano@correo.com"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Dirección / Calle</label>
                  <input
                    type="text"
                    value={formEdicion.direccion}
                    onChange={(e) => setFormEdicion({ ...formEdicion, direccion: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Colonia</label>
                  <input
                    type="text"
                    value={formEdicion.colonia}
                    onChange={(e) => setFormEdicion({ ...formEdicion, colonia: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Municipio</label>
                  <input
                    type="text"
                    value={formEdicion.municipio}
                    onChange={(e) => setFormEdicion({ ...formEdicion, municipio: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Prioridad</label>
                  <select
                    value={formEdicion.prioridad}
                    onChange={(e) => setFormEdicion({ ...formEdicion, prioridad: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Categoría</label>
                  <select
                    value={formEdicion.categoria}
                    onChange={(e) => setFormEdicion({ ...formEdicion, categoria: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {TIPOS_GESTION_BASE.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Asignado a:</label>
                  <select
                    value={formEdicion.responsableId}
                    onChange={(e) => setFormEdicion({ ...formEdicion, responsableId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">Sin Asignar</option>
                    {usuariosDespacho.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.cargo ? `(${u.cargo})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Dependencia Canalizada</label>
                <input
                  type="text"
                  value={formEdicion.dependenciaCanalizada}
                  onChange={(e) => setFormEdicion({ ...formEdicion, dependenciaCanalizada: e.target.value })}
                  placeholder="Ej: Secretaría de Salud del Estado"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Asunto y Petición *</label>
                <textarea
                  required
                  rows={3}
                  value={formEdicion.asunto}
                  onChange={(e) => setFormEdicion({ ...formEdicion, asunto: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarOpen(false)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Cambios</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Modal: Advertencia / Confirmar Eliminar Archivo del Expediente */}
      {archivoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar archivo del expediente?</h3>
                <p className="text-xs text-slate-500 font-medium">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900 truncate">
                📄 {archivoAEliminar.nombre}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {archivoAEliminar.tamano || 'Archivo'} • {archivoAEliminar.fecha || 'Reciente'}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El archivo será eliminado permanentemente del expediente digital y de la carpeta oficial de Google Drive del despacho.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArchivoAEliminar(null)}
                disabled={isDeletingFile}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminarArchivo}
                disabled={isDeletingFile}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingFile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sí, eliminar archivo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminar Gestión */}
      {modalEliminarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">¿Eliminar esta gestión?</h3>
                <p className="text-xs text-slate-500 font-medium">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Se eliminará permanentemente la gestión con folio <strong className="font-mono text-slate-900">{gestion.folio}</strong> del solicitante <strong className="text-slate-900">{gestion.solicitante}</strong>. Los documentos ya sincronizados en Google Drive permanecerán seguros en la nube de tu despacho.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminarOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarEliminar}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Sí, eliminar gestión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
