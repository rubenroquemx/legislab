'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, 
  ChevronLeft, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  FolderOpen,
  Users,
  Check,
  UserCheck,
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Sliders,
  X
} from 'lucide-react';
import { 
  createGestion, 
  extractIneDataAction,
  saveGeminiApiKeyAction,
  getGeminiApiKeyStatusAction
} from '@/app/actions/gestiones';
import { createGestionDriveFolderAction, getGoogleDriveStatusAction } from '@/app/actions/drive';
import { getOfficeUsersAction } from '@/app/actions/usuarios';
import { StatusBadge } from '@/components/ui/status-badge';

const TIPOS_GESTION_BASE = [
  'Salud', 
  'Educación', 
  'Obras Públicas', 
  'Apoyo Económico', 
  'Vivienda', 
  'Asesoría Legal', 
  'Deporte', 
  'Medio Ambiente'
];


/**
 * Recorta con HTML Canvas el rostro del ciudadano detectado por IA en la credencial
 * Garantiza un encuadre cuadrado 1:1 perfectamente centrado en el rostro, sin deformaciones.
 */
const cropFromCoordinates = async (
  base64: string,
  cxNorm: number,
  cyNorm: number,
  zoomFactor: number = 1.0
): Promise<string> => {
  return new Promise(async (resolve) => {
    try {
      let naturalW = 0;
      let naturalH = 0;
      let source: any = null;

      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        try {
          const res = await fetch(base64);
          const blob = await res.blob();
          source = await createImageBitmap(blob, { imageOrientation: 'from-image' });
          naturalW = source.width;
          naturalH = source.height;
        } catch {}
      }

      if (!source) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = base64;
        });
        source = img;
        naturalW = img.naturalWidth || img.width;
        naturalH = img.naturalHeight || img.height;
      }

      const cxPx = cxNorm * naturalW;
      const cyPx = cyNorm * naturalH;

      // Base: ~34% of the shortest dimension. Higher zoomFactor = tighter crop (closer face)
      const baseSize = Math.min(naturalW, naturalH) * 0.34;
      const sizePx = Math.max(baseSize / Math.max(zoomFactor, 0.4), 50);

      const halfSize = sizePx / 2;
      let sx = cxPx - halfSize;
      let sy = cyPx - halfSize;

      if (sx < 0) sx = 0;
      if (sy < 0) sy = 0;
      if (sx + sizePx > naturalW) sx = Math.max(0, naturalW - sizePx);
      if (sy + sizePx > naturalH) sy = Math.max(0, naturalH - sizePx);

      const cropW = Math.min(sizePx, naturalW - sx);
      const cropH = Math.min(sizePx, naturalH - sy);
      const finalSquare = Math.min(cropW, cropH);

      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(source, sx, sy, finalSquare, finalSquare, 0, 0, 320, 320);
        return resolve(canvas.toDataURL('image/jpeg', 0.92));
      }
    } catch (err) {
      console.warn('Error in manual crop:', err);
    }
    resolve(base64);
  });
};

const cropCitizenPhoto = (base64: string, box?: [number, number, number, number] | null): Promise<string> => {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined') return resolve(base64);
    try {
      let naturalW = 0;
      let naturalH = 0;
      let source: any = null;

      // Normalizar orientación EXIF del celular
      if ('createImageBitmap' in window) {
        try {
          const res = await fetch(base64);
          const blob = await res.blob();
          source = await createImageBitmap(blob, { imageOrientation: 'from-image' });
          naturalW = source.width;
          naturalH = source.height;
        } catch {}
      }

      if (!source) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = base64;
        });
        source = img;
        naturalW = img.naturalWidth || img.width;
        naturalH = img.naturalHeight || img.height;
      }

      let cxPx = naturalW / 2;
      let cyPx = naturalH / 2;
      let sizePx = Math.min(naturalW, naturalH) * 0.40;
      let foundFace = false;

      // 1. Coordenadas de Gemini Vision
      if (box && Array.isArray(box) && box.length === 4) {
        const [yminRaw, xminRaw, ymaxRaw, xmaxRaw] = box.map(Number);
        
        if (!isNaN(yminRaw) && !isNaN(xminRaw) && !isNaN(ymaxRaw) && !isNaN(xmaxRaw)) {
          const maxCoord = Math.max(yminRaw, xminRaw, ymaxRaw, xmaxRaw);
          const scale = maxCoord <= 1.05 ? 1 : maxCoord <= 105 ? 100 : 1000;

          const ymin = yminRaw / scale;
          const xmin = xminRaw / scale;
          const ymax = ymaxRaw / scale;
          const xmax = xmaxRaw / scale;

          if (ymax > ymin && xmax > xmin) {
            const bwNorm = xmax - xmin;
            const bhNorm = ymax - ymin;

            if (bwNorm >= 0.05 && bwNorm <= 0.80 && bhNorm >= 0.05 && bhNorm <= 0.80) {
              const cxNorm = (xmin + xmax) / 2;
              const cyNorm = (ymin + ymax) / 2;

              cxPx = cxNorm * naturalW;
              cyPx = cyNorm * naturalH;

              const faceW_px = bwNorm * naturalW;
              const faceH_px = bhNorm * naturalH;
              sizePx = Math.max(faceW_px, faceH_px) * 1.35;
              foundFace = true;
            }
          }
        }
      }

      // 2. FaceDetector nativo del navegador si está disponible
      if (!foundFace && 'FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
          const faces = await detector.detect(source);
          if (faces && faces.length > 0 && faces[0].boundingBox) {
            const bb = faces[0].boundingBox;
            cxPx = bb.x + bb.width / 2;
            cyPx = bb.y + bb.height / 2;
            sizePx = Math.max(bb.width, bb.height) * 1.35;
            foundFace = true;
          }
        } catch (fdErr) {
          console.warn('Native FaceDetector fallback error:', fdErr);
        }
      }

      // 3. Fallback inteligente según orientación general de la imagen
      if (!foundFace) {
        if (naturalH > naturalW) {
          // Imagen vertical: foto en la zona superior
          cxPx = naturalW * 0.45;
          cyPx = naturalH * 0.22;
          sizePx = naturalW * 0.45;
        } else {
          // Imagen horizontal: foto en el cuadrante izquierdo
          cxPx = naturalW * 0.22;
          cyPx = naturalH * 0.48;
          sizePx = naturalH * 0.52;
        }
      }

      // 4. Recorte 1:1
      const halfSize = sizePx / 2;
      let sx = cxPx - halfSize;
      let sy = cyPx - halfSize;

      if (sx < 0) sx = 0;
      if (sy < 0) sy = 0;
      if (sx + sizePx > naturalW) sx = Math.max(0, naturalW - sizePx);
      if (sy + sizePx > naturalH) sy = Math.max(0, naturalH - sizePx);

      const cropW = Math.min(sizePx, naturalW - sx);
      const cropH = Math.min(sizePx, naturalH - sy);
      const finalSquare = Math.min(cropW, cropH);

      if (finalSquare > 20) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(source, sx, sy, finalSquare, finalSquare, 0, 0, 320, 320);
          const cropped = canvas.toDataURL('image/jpeg', 0.90);
          resolve(cropped);
          return;
        }
      }
    } catch (err) {
      console.warn('Error cropping citizen photo:', err);
    }
    resolve(base64);
  });
};

export default function NuevaGestionPage() {
  const router = useRouter();

  // Form states
  const [nombre, setNombre] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [telefono, setTelefono] = useState('');
  const [municipio, setMunicipio] = useState('Centro (Villahermosa)');
  const [curp, setCurp] = useState('');
  const [claveElector, setClaveElector] = useState('');
  const [fullIneBase64, setFullIneBase64] = useState<string | null>(null);
  const [direccion, setDireccion] = useState('');
  const [colonia, setColonia] = useState('');
  const [seccionElectoral, setSeccionElectoral] = useState('');
  const [tipo, setTipo] = useState('Salud');
  const [isCustomTipo, setIsCustomTipo] = useState(false);
  const [customTipoInput, setCustomTipoInput] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [dependenciaDestino, setDependenciaDestino] = useState('Secretaría de Salud del Estado');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OCR state
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [geminiApiKeyStatus, setGeminiApiKeyStatus] = useState<{ configured: boolean; source?: string }>({ configured: false });
  const [lastExtractedCitizen, setLastExtractedCitizen] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showKeyCard, setShowKeyCard] = useState(false);
  const [inputGeminiKey, setInputGeminiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [pendingIneFile, setPendingIneFile] = useState<{ base64: string; type: string } | null>(null);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);
  const [usuariosDespacho, setUsuariosDespacho] = useState<any[]>([]);
  const [asignados, setAsignados] = useState<any[]>([]);
  const [modalEncuadreOpen, setModalEncuadreOpen] = useState(false);
  const [manualZoom, setManualZoom] = useState<number>(1.0);
  const [manualCoords, setManualCoords] = useState<{ x: number; y: number }>({ x: 0.45, y: 0.22 });

  // Live Camera Scanner State
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startLiveCamera = async (facing: 'environment' | 'user' = 'environment') => {
    setIsLiveCameraOpen(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara en vivo no está soportada directamente en este navegador. Puedes usar la cámara nativa del celular.');
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }

      let stream: MediaStream;
      const constraints = {
        video: {
          facingMode: facing ? { ideal: facing } : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback para dispositivos móviles con restricciones estrictas de resolución
        stream = await navigator.mediaDevices.getUserMedia({
          video: facing ? { facingMode: facing } : true,
          audio: false
        });
      }

      setCameraStream(stream);
      setCameraFacing(facing);
      setCameraError(null);
    } catch (err: any) {
      console.warn('Live camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso denegado para la cámara. Por favor autoriza el uso de la cámara en los permisos de Safari / iOS.');
      } else {
        setCameraError(err.message || 'No se pudo inicializar la cámara en este dispositivo.');
      }
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  const switchCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    startLiveCamera(next);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth > 0 ? video.videoWidth : 1280;
    canvas.height = video.videoHeight > 0 ? video.videoHeight : 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.95);
      stopLiveCamera();
      setFullIneBase64(base64);
      setAvatarUrl(base64);
      processIneImage(base64, 'image/jpeg');
    }
  };

  // Attach video stream whenever live camera opens (iOS Safari WebKit compliant)
  useEffect(() => {
    let isCancelled = false;

    if (isLiveCameraOpen && cameraStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;

      const attemptPlay = () => {
        if (isCancelled) return;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Ignorar AbortError provocado por la inicialización concurrente en WebKit
            if (err.name !== 'AbortError') {
              console.warn('Live video play warning:', err);
            }
          });
        }
      };

      if (video.readyState >= 1) {
        attemptPlay();
      } else {
        video.onloadedmetadata = () => {
          attemptPlay();
        };
      }
    }

    return () => {
      isCancelled = true;
    };
  }, [isLiveCameraOpen, cameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  const handleInteractiveCropClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!fullIneBase64) return;
    const img = e.currentTarget;
    const rect = img.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    setManualCoords({ x: clickX, y: clickY });
    const cropped = await cropFromCoordinates(fullIneBase64, clickX, clickY, manualZoom);
    setAvatarUrl(cropped);
  };

  const handleZoomChange = async (newZoom: number) => {
    const clamped = Math.max(0.5, Math.min(2.5, newZoom));
    setManualZoom(clamped);
    if (fullIneBase64) {
      const cropped = await cropFromCoordinates(fullIneBase64, manualCoords.x, manualCoords.y, clamped);
      setAvatarUrl(cropped);
    }
  };


  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    getGeminiApiKeyStatusAction().then(setGeminiApiKeyStatus).catch(console.warn);
    getGoogleDriveStatusAction()
      .then(res => setDriveConnected(Boolean(res?.connected)))
      .catch(() => setDriveConnected(false));
    getOfficeUsersAction()
      .then(res => {
        if (res.success && res.users) {
          setUsuariosDespacho(res.users);
        }
      })
      .catch(console.warn);
  }, []);

  const toggleAsignado = (user: any) => {
    setAsignados(prev => {
      const exists = prev.some(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, { id: user.id, name: user.name, email: user.email, cargo: user.cargo, image: user.image }];
      }
    });
  };

  const processIneImage = async (base64: string, fileType: string) => {
    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrSuccess(false);
    setLastExtractedCitizen(null);

    try {
      const res = await extractIneDataAction(base64, fileType || 'image/jpeg');
      if (res.success && res.data) {
        const d = res.data;
        const nombreFinal = d.nombreCompleto || `${d.nombre || ''} ${d.primerApellido || ''} ${d.segundoApellido || ''}`.trim();
        setNombre(nombreFinal);
        if (d.curp) setCurp(d.curp);
        if (d.seccionElectoral) setSeccionElectoral(d.seccionElectoral);
        if (d.calle || d.direccionCompleta) setDireccion(d.calle || d.direccionCompleta);
        if (d.colonia) setColonia(d.colonia);
        if (d.municipio) setMunicipio(d.municipio);
        if (d.claveElector) setClaveElector(d.claveElector);
        
        // Mapear con IA el rostro/foto del ciudadano de la credencial
        try {
          const croppedFace = await cropCitizenPhoto(base64, d.fotoBoundingBox);
          setAvatarUrl(croppedFace);
        } catch (cropErr) {
          console.warn('Could not crop citizen face:', cropErr);
          setAvatarUrl(base64);
        }

        setLastExtractedCitizen(nombreFinal || 'Ciudadano');
        setOcrSuccess(true);
        setGeminiApiKeyStatus({ configured: true });
        setShowKeyCard(false);
      } else if (res.error === 'NO_API_KEY') {
        setPendingIneFile({ base64, type: fileType });
        setShowKeyCard(true);
      } else {
        setOcrError(res.message || 'La imagen no corresponde a una credencial INE válida o no es legible.');
      }
    } catch (err: any) {
      console.warn('Error processing INE file:', err);
      setOcrError('Ocurrió un error al conectar con el motor de visión artificial.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleFileUploadRegistration = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        setFullIneBase64(base64);
        setAvatarUrl(base64);
        await processIneImage(base64, file.type || 'image/jpeg');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Error reading file:', err);
    }
  };

  const handleSaveGeminiKeyAndRetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGeminiKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await saveGeminiApiKeyAction(inputGeminiKey.trim());
      if (res.success) {
        setShowKeyCard(false);
        setGeminiApiKeyStatus({ configured: true });
        if (pendingIneFile) {
          await processIneImage(pendingIneFile.base64, pendingIneFile.type);
          setPendingIneFile(null);
        }
      } else {
        alert(res.error || 'No se pudo guardar la clave');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(false);
    }
  };

  const handleCrearGestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);

    const tipoFinal = isCustomTipo ? customTipoInput.trim() || 'General' : tipo;
    const year = new Date().getFullYear();
    const randomFolioSuffix = Math.floor(1000 + Math.random() * 9000);
    const folio = `GES-${year}-${randomFolioSuffix}`;

    try {
      const ineFileName = `Credencial_INE_${nombre.trim().replace(/\s+/g, '_')}.jpg`;
      const res = await createGestion({
        folio,
        asunto: descripcion || `Solicitud de ${tipoFinal}`,
        solicitante: nombre.trim(),
        curp: curp.trim(),
        claveElector: claveElector.trim(),
        seccionElectoral: seccionElectoral.trim(),
        direccion: direccion.trim(),
        colonia: colonia.trim(),
        municipio: municipio.trim(),
        telefono: telefono.trim(),
        avatarUrl: avatarUrl || undefined,
        prioridad,
        categoria: tipoFinal,
        estatus: 'Recibida',
        dependenciaCanalizada: dependenciaDestino.trim(),
        asignados,
        ineBase64: fullIneBase64 || undefined,
        ineFileName,
        documentos: fullIneBase64 ? [
          {
            id: `doc-${Date.now()}`,
            nombre: ineFileName,
            tipo: 'image/jpeg',
            fecha: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short', year: 'numeric' }),
            tamano: '1.2 MB',
            urlDrive: ''
          }
        ] : [],
        notas: [
          {
            id: `nota-${Date.now()}`,
            fecha: new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', day: '2-digit', month: 'short', year: 'numeric' }),
            hora: new Date().toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date().toISOString(),
            autor: 'Dip. Ruben Roque',
            texto: `Gestión ciudadana dada de alta con éxito en el rubro ${tipoFinal}. Canalización inicial orientada a ${dependenciaDestino}.${asignados.length > 0 ? ` Asignada a: ${asignados.map(a => a.name).join(', ')}.` : ''}`,
            esDiputado: true
          }
        ]
      });

      if (res.success) {
        router.push('/gestiones');
      } else {
        alert(res.error || 'No se pudo registrar la gestión.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar la gestión.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/gestiones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver a Gestiones</span>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-blue-600" />
              <span>Nueva Gestión Ciudadana</span>
            </h1>
            <p className="text-xs text-slate-500">
              Captura los datos del ciudadano o extrae automáticamente escaneando su credencial INE.
            </p>
          </div>
        </div>
      </div>

      {/* Google Drive Status Banner */}
      {driveConnected === false && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-amber-900 font-medium leading-relaxed">
              <strong>Google Drive no conectado:</strong> Esta gestión se guardará en el sistema, pero su expediente digital y carpeta oficial en la nube no se podrán crear automáticamente hasta vincular Drive.
            </p>
          </div>
          <Link
            href="/configuracion?tab=conexiones"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0"
          >
            Conectar Drive
          </Link>
        </div>
      )}

      {/* OCR Scanner Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Capturar INE</span>
          </span>

          {geminiApiKeyStatus.configured ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Gemini Vision Activo (Modo Real)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowKeyCard(!showKeyCard)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-colors"
            >
              ⚠️ Configurar GEMINI_API_KEY
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Toma una foto o sube la credencial de elector. La inteligencia artificial extraerá y validará automáticamente el <strong>Rostro</strong>, <strong>Nombre</strong>, <strong>CURP</strong>, <strong>Dirección</strong> y <strong>Sección Electoral</strong>.
        </p>

        {showKeyCard && (
          <form onSubmit={handleSaveGeminiKeyAndRetry} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <p className="text-xs text-slate-700 font-medium">Ingresa tu clave de Google Gemini para activar el OCR en tiempo real:</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                required
                value={inputGeminiKey}
                onChange={(e) => setInputGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 p-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-900"
              />
              <button
                type="submit"
                disabled={savingKey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                {savingKey ? 'Guardando...' : 'Guardar Clave'}
              </button>
            </div>
          </form>
        )}

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
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs transition-all active:scale-95"
          >
            <Upload className="h-4 w-4 text-blue-600" />
            <span>Subir Foto de INE</span>
          </button>

          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUploadRegistration}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => startLiveCamera('environment')}
            disabled={isOcrProcessing}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Abrir cámara con marco guía inteligente para credencial INE"
          >
            <Camera className="h-4 w-4" />
            <span>📸 Tomar Foto con Guía INE</span>
          </button>
        </div>

        {/* Status feedback */}
        {isOcrProcessing && (
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 p-3 rounded-xl animate-pulse">
            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Analizando y verificando credencial INE con Google Gemini Vision...</span>
          </div>
        )}

        {ocrSuccess && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>¡Credencial de {lastExtractedCitizen || 'ciudadano'} validada y extraída con éxito!</span>
          </div>
        )}

        {ocrError && (
          <div className="flex items-start gap-2 text-xs font-medium text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo completar la lectura:</p>
              <p className="text-xs opacity-90">{ocrError}</p>
            </div>
          </div>
        )}

        {avatarUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 rounded-2xl border border-blue-200 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div 
                onClick={() => fullIneBase64 && setModalEncuadreOpen(true)}
                className="h-16 w-16 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 shadow-sm ring-4 ring-blue-100/80 bg-slate-100 relative group cursor-pointer"
                title="Toca para ajustar o reubicar el encuadre"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Foto del ciudadano extraída" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Crop className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span>Fotografía del Expediente</span>
                </span>
                <span className="text-[11px] text-slate-600 block leading-relaxed mt-0.5">
                  Rostro asignado al expediente. Puedes tocar el círculo o usar "Ajustar Encuadre" para centrarlo al 100%.
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              <input
                type="file"
                ref={profilePhotoInputRef}
                onChange={handleProfilePhotoChange}
                accept="image/*"
                className="hidden"
              />
              {fullIneBase64 && (
                <button
                  type="button"
                  onClick={() => setModalEncuadreOpen(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Crop className="h-3.5 w-3.5" />
                  <span>Ajustar Encuadre</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Subir Foto Personal
              </button>
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                title="Quitar foto y usar iniciales del ciudadano"
              >
                Quitar Foto
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm shrink-0">
                {nombre.trim() ? nombre.trim().slice(0, 2).toUpperCase() : 'CI'}
              </div>
              <div>
                <p className="font-semibold text-slate-800">Avatar del Ciudadano</p>
                <p className="text-[11px] text-slate-500">Se usarán las iniciales oficiales o puedes subir una foto directa.</p>
              </div>
            </div>
            <input
              type="file"
              ref={profilePhotoInputRef}
              onChange={handleProfilePhotoChange}
              accept="image/*"
              className="hidden"
            />
            <div className="flex items-center gap-2">
              {fullIneBase64 && (
                <button
                  type="button"
                  onClick={() => setModalEncuadreOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer"
                >
                  <Crop className="h-3.5 w-3.5" />
                  <span>Encuadrar de INE</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => profilePhotoInputRef.current?.click()}
                className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer"
              >
                + Subir Foto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleCrearGestion} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          Datos del Solicitante y Ubicación
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre Completo del Ciudadano <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Carlos Morales Hernández"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 993 123 4567"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">CURP</label>
            <input
              type="text"
              value={curp}
              onChange={(e) => setCurp(e.target.value)}
              placeholder="Ej: MOHJ820415HTBLRN09"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clave de Elector</label>
            <input
              type="text"
              value={claveElector}
              onChange={(e) => setClaveElector(e.target.value.toUpperCase())}
              placeholder="Ej: MRHNJN82041527H900"
              maxLength={18}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio</label>
            <input
              type="text"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Ej: Centro (Villahermosa)"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sección Electoral</label>
            <input
              type="text"
              value={seccionElectoral}
              onChange={(e) => setSeccionElectoral(e.target.value)}
              placeholder="Ej: 0342"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-blue-700 font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección / Calle y Número</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Calle Narciso Mendoza #104"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Colonia / Poblado</label>
            <input
              type="text"
              value={colonia}
              onChange={(e) => setColonia(e.target.value)}
              placeholder="Ej: Col. Atasta de Serra"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
        </div>

        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 pt-2">
          Clasificación y Canalización Institucional
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Tipo de Gestión (Rubro)</label>
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
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {TIPOS_GESTION_BASE.map((t) => (
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
                className="w-full p-2.5 text-xs bg-white border border-blue-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="Alta">🔴 Alta (Urgente)</option>
              <option value="Media">🟡 Media</option>
              <option value="Baja">🟢 Baja</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Dependencia Sugerida para Canalización</label>
          <input
            type="text"
            value={dependenciaDestino}
            onChange={(e) => setDependenciaDestino(e.target.value)}
            placeholder="Ej: Secretaría de Salud del Estado, SOTOP, DIF..."
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción de la Petición o Problema</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe los antecedentes del ciudadano, el apoyo solicitado o la intervención requerida..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
          />
        </div>

        {/* Asignado a: (Selección múltiple de integrantes del despacho) */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Asignado a:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  (Puedes seleccionar más de un usuario a la vez)
                </span>
              </label>
              <p className="text-[11px] text-slate-500">
                Los integrantes asignados recibirán notificaciones y seguimiento directo de este expediente.
              </p>
            </div>
            {asignados.length > 0 && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {asignados.length} {asignados.length === 1 ? 'asignado' : 'asignados'}
              </span>
            )}
          </div>

          {usuariosDespacho.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Cargando integrantes del despacho...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {usuariosDespacho.map((u) => {
                const isSelected = asignados.some((a) => a.id === u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAsignado(u)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 text-blue-950 shadow-2xs ring-1 ring-blue-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                          {u.name?.slice(0, 2).toUpperCase() || 'US'}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.cargo || 'Integrante del Despacho'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/gestiones"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Guardando y Creando Expediente...' : 'Guardar Gestión y Crear Expediente'}
          </button>
        </div>
      </form>
    
      {/* MODAL: AJUSTAR ENCUADRE CON CONTROL DE ZOOM Y TAP-TO-FOCUS */}
      {modalEncuadreOpen && fullIneBase64 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121824] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Crop className="h-4 w-4 text-blue-600" />
                  <span>Ajustar Encuadre y Zoom del Rostro</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  1. Toca sobre la cara en la credencial. 2. Usa el zoom para acercar o alejar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEncuadreOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 font-bold text-sm cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Credencial interactiva para tocar */}
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[46vh] p-1 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fullIneBase64}
                alt="Credencial completa"
                onClick={handleInteractiveCropClick}
                className="max-h-[44vh] w-auto object-contain cursor-crosshair select-none active:scale-[0.99] transition-transform rounded-xl"
              />
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-full pointer-events-none">
                📍 Toca cualquier punto de la credencial
              </div>
            </div>

            {/* Barra de Control de Zoom */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-600" />
                  <span>Tamaño y Zoom del Rostro:</span>
                </span>
                <span className="font-mono font-bold text-blue-600 text-[11px] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/60">
                  {Math.round(manualZoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleZoomChange(manualZoom - 0.15)}
                  className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
                  title="Alejar (zoom out)"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>

                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={manualZoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => handleZoomChange(manualZoom + 0.15)}
                  className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer active:scale-95"
                  title="Acercar (zoom in)"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleZoomChange(1.0)}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs cursor-pointer"
                  title="Restablecer zoom a 100%"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Barra de resultado y confirmación */}
            <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-blue-600 shadow-md ring-4 ring-blue-100 shrink-0 bg-slate-100">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="Vista previa del recorte" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">Sin foto</div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Avatar del Expediente</span>
                  <span className="text-[11px] text-slate-500 block">Recorte circular centrado de alta resolución</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalEncuadreOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Guardar Encuadre</span>
              </button>
            </div>
          </div>
        </div>
      )}

    
      {/* MODAL: CÁMARA EN VIVO CON MARCO GUÍA OVERLAY PARA CREDENCIAL INE */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between select-none animate-in fade-in duration-200 overflow-hidden">
          {/* Top Bar con Instrucciones */}
          <div className="w-full z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Alinear Credencial INE</span>
              </h2>
              <p className="text-[11px] text-emerald-200/80">Centra la tarjeta dentro del marco iluminado</p>
            </div>
            <button
              type="button"
              onClick={stopLiveCamera}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer"
            >
              ✕ Cerrar
            </button>
          </div>

          {/* Viewfinder con Video y Card Cutout Overlay */}
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
            {cameraError ? (
              <div className="p-6 max-w-sm mx-auto text-center space-y-4 bg-slate-900/90 rounded-2xl border border-slate-700 text-white m-4">
                <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                <div>
                  <h3 className="text-sm font-bold">Cámara no disponible directamente</h3>
                  <p className="text-xs text-slate-300 mt-1">{cameraError}</p>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startLiveCamera(cameraFacing)}
                    className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    Reintentar Cámara en Vivo
                  </button>
                  <button
                    type="button"
                    onClick={() => { stopLiveCamera(); cameraInputRef.current?.click(); }}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Usar Cámara Estándar del Celular
                  </button>
                  <button
                    type="button"
                    onClick={stopLiveCamera}
                    className="w-full py-2 px-4 bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    (e.target as HTMLVideoElement).play().catch(() => {});
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Card Frame Overlay (85.6mm x 53.98mm = aspect 1.586) */}
                <div className="relative z-10 w-[90vw] max-w-[440px] aspect-[1.586/1] rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col justify-between p-3 pointer-events-none">
                  {/* Glowing Corner Brackets */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-sm"></div>
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-sm"></div>
                  <div className="absolute -bottom-1.5 -left-1.5 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-sm"></div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-sm"></div>

                  {/* Header badge inside frame */}
                  <div className="self-center bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Frente de Credencial INE
                  </div>

                  {/* Visual guides inside cutout */}
                  <div className="grid grid-cols-3 gap-2 h-full items-center my-1 opacity-60">
                    {/* Left 1/3: Photo guide */}
                    <div className="h-full border border-dashed border-emerald-400/60 rounded-xl flex flex-col items-center justify-center text-emerald-300 space-y-1">
                      <div className="h-10 w-8 rounded-full border-2 border-emerald-400/80 flex items-center justify-center text-[10px]">
                        👤
                      </div>
                      <span className="text-[9px] font-bold tracking-wider">FOTO</span>
                    </div>

                    {/* Right 2/3: Text / Data lines guide */}
                    <div className="col-span-2 h-full border border-dashed border-emerald-400/40 rounded-xl p-2.5 flex flex-col justify-around text-emerald-300/80">
                      <div className="h-2 w-3/4 bg-emerald-400/30 rounded"></div>
                      <div className="h-2 w-full bg-emerald-400/20 rounded"></div>
                      <div className="h-2 w-5/6 bg-emerald-400/20 rounded"></div>
                      <div className="h-2 w-1/2 bg-emerald-400/30 rounded"></div>
                    </div>
                  </div>

                  <div className="self-center text-center text-white/90 text-[11px] font-semibold drop-shadow-md">
                    Mantén la credencial horizontal dentro del marco
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Bar con Shutter y Controles */}
          <div className="w-full z-20 flex items-center justify-around px-6 py-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            {/* Botón cambiar cámara (frontal/trasera) */}
            <button
              type="button"
              onClick={switchCameraFacing}
              className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
              title="Girar cámara"
            >
              <RefreshCw className="h-5 w-5" />
            </button>

            {/* Shutter Button estilo iPhone */}
            <button
              type="button"
              onClick={captureLivePhoto}
              disabled={Boolean(cameraError)}
              className="h-20 w-20 rounded-full border-4 border-emerald-400 bg-white hover:bg-emerald-50 active:scale-90 shadow-2xl flex items-center justify-center transition-all cursor-pointer group"
              title="Tomar fotografía"
            >
              <div className="h-14 w-14 rounded-full bg-emerald-500 group-hover:bg-emerald-600 transition-colors flex items-center justify-center text-white">
                <Camera className="h-6 w-6" />
              </div>
            </button>

            {/* Fallback a cámara nativa */}
            <button
              type="button"
              onClick={() => { stopLiveCamera(); cameraInputRef.current?.click(); }}
              className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white rounded-full backdrop-blur-md transition-all cursor-pointer text-xs font-semibold"
              title="Usar cámara del sistema"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
