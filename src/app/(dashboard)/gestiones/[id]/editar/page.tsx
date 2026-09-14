'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  FolderKanban, 
  ChevronLeft, 
  Users, 
  Check, 
  Loader2, 
  Save, 
  Image as ImageIcon 
} from 'lucide-react';
import { 
  getGestiones, 
  updateGestionDataAction 
} from '@/app/actions/gestiones';
import { getOfficeUsersAction } from '@/app/actions/usuarios';
import { TIPOS_GESTION_BASE, ESTADOS_KANBAN, normalizeEstadoGestion } from '@/lib/gestiones-utils';

export default function EditarGestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folio, setFolio] = useState('');

  // Form states
  const [solicitante, setSolicitante] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [municipio, setMunicipio] = useState('Centro');
  const [curp, setCurp] = useState('');
  const [claveElector, setClaveElector] = useState('');
  const [seccionElectoral, setSeccionElectoral] = useState('');
  const [direccion, setDireccion] = useState('');
  const [colonia, setColonia] = useState('');
  const [tipo, setTipo] = useState('Salud');
  const [isCustomTipo, setIsCustomTipo] = useState(false);
  const [customTipoInput, setCustomTipoInput] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [estatus, setEstatus] = useState<string>('Recibida');
  const [dependenciaDestino, setDependenciaDestino] = useState('');

  // Asignados multi-usuario
  const [usuariosDespacho, setUsuariosDespacho] = useState<any[]>([]);
  const [asignados, setAsignados] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
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
            setFolio(found.folio || 'GES-2026');
            setSolicitante(found.solicitante || '');
            setAvatarUrl(found.avatarUrl || '');
            setTelefono(found.telefono || '');
            setEmail(found.email || '');
            setCurp(found.curp || '');
            setClaveElector(found.claveElector || '');
            setSeccionElectoral(found.seccionElectoral || '');
            setDireccion(found.direccion || '');
            setColonia(found.colonia || 'Centro');
            setMunicipio(found.municipio || 'Centro');
            setDescripcion(found.asunto || '');
            setPrioridad((found.prioridad as any) || 'Media');
            setEstatus(normalizeEstadoGestion(found.estatus));
            setDependenciaDestino(found.dependenciaCanalizada || '');

            if (found.categoria) {
              if (TIPOS_GESTION_BASE.includes(found.categoria)) {
                setTipo(found.categoria);
                setIsCustomTipo(false);
              } else {
                setTipo('__OTRO__');
                setIsCustomTipo(true);
                setCustomTipoInput(found.categoria);
              }
            }

            let asigs: any[] = [];
            if (found.asignados) {
              try { asigs = typeof found.asignados === 'string' ? JSON.parse(found.asignados) : found.asignados; } catch {}
            } else if (found.notasInternas) {
              try {
                const meta = JSON.parse(found.notasInternas);
                if (meta.asignados) asigs = meta.asignados;
              } catch {}
            } else if (found.responsableId && usersRes.users) {
              const m = usersRes.users.find((u: any) => u.id === found.responsableId);
              if (m) asigs = [{ id: m.id, name: m.name, cargo: m.cargo, image: m.image }];
            }
            setAsignados(Array.isArray(asigs) ? asigs : []);
          } else {
            alert('No se encontró la gestión especificada.');
            router.push('/gestiones');
          }
        }
      } catch (err) {
        console.error('Error loading data for edit:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resolvedParams.id, router]);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleGuardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitante.trim()) return;

    setIsSubmitting(true);
    const tipoFinal = isCustomTipo ? customTipoInput.trim() || 'General' : tipo;
    const currentUserName = session?.user?.name || 'Dip. Ruben Roque';

    try {
      const res = await updateGestionDataAction(
        resolvedParams.id,
        {
          asunto: descripcion || `Solicitud de ${tipoFinal}`,
          solicitante: solicitante.trim(),
          curp: curp.trim(),
          claveElector: claveElector.trim(),
          seccionElectoral: seccionElectoral.trim(),
          direccion: direccion.trim(),
          colonia: colonia.trim(),
          municipio: municipio.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          prioridad,
          categoria: tipoFinal,
          estatus,
          dependenciaCanalizada: dependenciaDestino.trim(),
          asignados,
          avatarUrl: avatarUrl || null,
        },
        currentUserName
      );

      if (res.success) {
        router.push(`/gestiones/${resolvedParams.id}`);
      } else {
        alert(res.error || 'No se pudieron guardar los cambios');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error saving edits:', err);
      alert('Error al guardar los cambios.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Cargando datos del expediente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header con botón de volver */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/gestiones/${resolvedParams.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver al Expediente</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-blue-600" />
                <span>Editar Gestión Ciudadana</span>
              </h1>
              {folio && (
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-md">
                  {folio}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Modifica los datos del solicitante, asignaciones y clasificación del expediente oficial.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleGuardarCambios} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        
        {/* Fotografía del Solicitante */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Foto del ciudadano"
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md bg-slate-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xl border-2 border-white shadow-md">
                {solicitante?.slice(0, 2).toUpperCase() || 'CI'}
              </div>
            )}
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h3 className="text-xs font-bold text-slate-800">Fotografía del Solicitante</h3>
            <p className="text-[11px] text-slate-500">
              Esta fotografía identifica al ciudadano en el expediente digital y en el directorio.
            </p>
            <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Cambiar Foto</span>
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Quitar Foto</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Datos del Solicitante y Ubicación */}
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
          Datos del Solicitante y Ubicación
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo del Ciudadano *</label>
            <input
              type="text"
              required
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
              placeholder="Ej: MARÍA DEL CARMEN PÉREZ LÓPEZ"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="9931234567"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">CURP</label>
            <input
              type="text"
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              placeholder="PELM850912HTBRLP01"
              maxLength={18}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-medium uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clave de Elector</label>
            <input
              type="text"
              value={claveElector}
              onChange={(e) => setClaveElector(e.target.value.toUpperCase())}
              placeholder="PRLPMR85091227H900"
              maxLength={18}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-medium uppercase"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio</label>
            <input
              type="text"
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              placeholder="Centro, Comalcalco, Cárdenas..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sección Electoral</label>
            <input
              type="text"
              value={seccionElectoral}
              onChange={(e) => setSeccionElectoral(e.target.value)}
              placeholder="Ej: 0284"
              maxLength={4}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-blue-700 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ciudadano@correo.com"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
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

        {/* Clasificación y Estado */}
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 pt-2">
          Clasificación, Estado y Canalización
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
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
                placeholder="Escribe el nuevo tipo..."
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Estatus del Expediente</label>
            <select
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
            >
              {ESTADOS_KANBAN.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
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
                Los integrantes asignados tienen seguimiento directo de este expediente.
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
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

        {/* Acciones del formulario */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href={`/gestiones/${resolvedParams.id}`}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
