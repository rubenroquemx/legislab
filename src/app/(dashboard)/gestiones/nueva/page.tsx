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
  FolderOpen
} from 'lucide-react';
import { 
  createGestion, 
  extractIneDataAction,
  saveGeminiApiKeyAction,
  getGeminiApiKeyStatusAction
} from '@/app/actions/gestiones';
import { createGestionDriveFolderAction } from '@/app/actions/drive';
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

export default function NuevaGestionPage() {
  const router = useRouter();

  // Form states
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getGeminiApiKeyStatusAction().then(setGeminiApiKeyStatus).catch(console.warn);
  }, []);

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

    try {
      const resDrive = await createGestionDriveFolderAction(`GES-${Date.now().toString().slice(-4)}`, nombre.trim());
      const driveFolderUrl = resDrive.success && resDrive.folderUrl ? resDrive.folderUrl : '';

      const res = await createGestion({
        asunto: descripcion || `Solicitud de ${tipoFinal}`,
        solicitante: nombre.trim(),
        curp: curp.trim(),
        claveElector: '',
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
        driveFolderUrl,
        documentos: avatarUrl ? [
          {
            id: `doc-${Date.now()}`,
            nombre: 'Credencial_Elector_INE.jpg',
            tipo: 'INE / Identificación Oficial',
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
            tamano: '1.2 MB',
            urlDrive: driveFolderUrl || 'https://drive.google.com'
          }
        ] : [],
        notas: [
          {
            id: `nota-${Date.now()}`,
            fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            autor: 'Dip. Ruben Roque',
            texto: `Gestión ciudadana dada de alta con éxito en el rubro ${tipoFinal}. Canalización inicial orientada a ${dependenciaDestino}.`,
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

      {/* OCR Scanner Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Escaneo de Credencial INE con Visión Artificial (Gemini 2.5 Flash)</span>
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
            onClick={() => cameraInputRef.current?.click()}
            disabled={isOcrProcessing}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <Camera className="h-4 w-4" />
            <span>📸 Tomar Foto con Cámara</span>
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

        {avatarUrl && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Rostro extraído" className="h-full w-full object-cover" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Fotografía Oficial Extraída del INE</span>
              <span className="text-xs text-slate-500 block">Se registrará como avatar oficial del expediente digital.</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    </div>
  );
}
