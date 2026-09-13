'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FolderKanban, 
  ChevronLeft, 
  Camera, 
  MessageCircle, 
  FolderOpen, 
  ExternalLink, 
  FileText, 
  Trash2, 
  CheckCheck, 
  Send, 
  Sparkles, 
  Landmark, 
  Check, 
  Copy, 
  Download, 
  FileUp,
  Upload
} from 'lucide-react';
import { 
  getGestiones, 
  updateGestionStatus, 
  addNotaGestion, 
  addDocumentoGestion,
  addOficioGestion
} from '@/app/actions/gestiones';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';
import { StatusBadge } from '@/components/ui/status-badge';

const PLANTILLAS_PREDETERMINADAS = [
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
];

const ESTADOS_KANBAN = ['Recibida', 'En Revisión', 'En Trámite con Dependencia', 'Resuelta'];

export default function GestionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [gestion, setGestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // WhatsApp notes
  const [nuevaNotaTexto, setNuevaNotaTexto] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Oficio generator
  const [isGenerandoOficio, setIsGenerandoOficio] = useState(false);
  const [plantillaSeleccionadaId, setPlantillaSeleccionadaId] = useState('plan-1');
  const [oficioDestinatario, setOficioDestinatario] = useState('Dra. Patricia Oramas Palma');
  const [oficioCargo, setOficioCargo] = useState('Secretaria de Salud');
  const [oficioDependencia, setOficioDependencia] = useState('Secretaría de Salud del Estado');
  const [oficioTextoGenerado, setOficioTextoGenerado] = useState('');
  const [copiadoOficio, setCopiadoOficio] = useState(false);

  const usuarioActivo = {
    nombre: 'Dip. Ruben Roque',
    cargo: 'Diputado Local (Titular)',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  useEffect(() => {
    async function load() {
      try {
        const res = await getGestiones();
        if (res.success && res.data) {
          const found = res.data.find((g: any) => g.id === resolvedParams.id);
          if (found) {
            let docs: any[] = [];
            if (found.documentos) {
              try { docs = typeof found.documentos === 'string' ? JSON.parse(found.documentos) : found.documentos; } catch {}
            }
            let nts: any[] = [];
            if (found.notas) {
              try { nts = typeof found.notas === 'string' ? JSON.parse(found.notas) : found.notas; } catch {}
            }
            setGestion({
              ...found,
              documentos: Array.isArray(docs) ? docs : [],
              notas: Array.isArray(nts) ? nts : []
            });
          }
        }
      } catch (err) {
        console.warn(err);
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
    setGestion({ ...gestion, estatus: nuevoEstado });
    await updateGestionStatus(gestion.id, nuevoEstado);
  };

  const handleAgregarNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestion || !nuevaNotaTexto.trim()) return;

    const nuevaNota = {
      id: `nota-${Date.now()}`,
      fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      autor: usuarioActivo.nombre,
      texto: nuevaNotaTexto.trim(),
      esDiputado: true,
    };

    const updatedNotas = [...gestion.notas, nuevaNota];
    setGestion({ ...gestion, notas: updatedNotas });
    setNuevaNotaTexto('');
    await addNotaGestion(gestion.id, nuevaNota);
  };

  const handleGenerarTextoOficio = () => {
    if (!gestion) return;
    const plan = PLANTILLAS_PREDETERMINADAS.find(p => p.id === plantillaSeleccionadaId);
    const folioOficio = `OFC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaLarga = new Date().toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const texto = `H. CONGRESO DEL ESTADO DE TABASCO
LXVI LEGISLATURA | DIPUTADO RUBEN ROQUE
DESPACHO DE ENLACE PARLAMENTARIO Y ATENCIÓN CIUDADANA

OFICIO NO.: ${folioOficio}
ASUNTO: Canalización Urgente de Gestión Ciudadana (${plan?.titulo || gestion.categoria})
FECHA: Villahermosa, Tabasco; a ${fechaLarga}.

${oficioDestinatario.toUpperCase()}
${oficioCargo.toUpperCase()}
${oficioDependencia.toUpperCase()}
PRESENTE.

Por medio de la presente, reciba un cordial y respetuoso saludo. Me dirijo a usted en mi calidad de Diputado de la LXVI Legislatura, con el propósito de canalizar formalmente la petición presentada ante esta representación popular por el ciudadano(a):

  • NOMBRE DEL SOLICITANTE: ${gestion.solicitante.toUpperCase()}
  • CURP: ${gestion.curp || 'NO ESPECIFICADO'}
  • SECCIÓN ELECTORAL: ${gestion.seccionElectoral || 'NO ESPECIFICADA'}
  • DOMICILIO: ${gestion.direccion || 'Conocido'}, ${gestion.colonia || ''}, ${gestion.municipio || 'Centro'}
  • TELÉFONO DE CONTACTO: ${gestion.telefono || 'Sin teléfono'}

MOTIVO DE LA GESTIÓN:
${gestion.asunto || 'Apoyo institucional solicitado para atención prioritaria.'}

Por lo anteriormente expuesto y conocedor de su permanente compromiso y vocación de servicio público, solicito a usted de la manera más atenta tenga a bien instruir a quien corresponda la valoración, trámite y resolución conducente de la presente solicitud ciudadana.

Agradeciendo de antemano la gentileza de su atención institucional, quedo a sus distinguidas órdenes.

ATENTAMENTE,
"Sufragio Efectivo. No Reelección"

___________________________________________________
DIP. RUBEN ROQUE
DIPUTADO LOCAL | LXVI LEGISLATURA
CONGRESO DEL ESTADO DE TABASCO`;

    setOficioTextoGenerado(texto);
    setIsGenerandoOficio(true);
  };

  const handleDescargarDocx = async () => {
    if (!oficioTextoGenerado) return;
    const blob = await generateDocxBlob(oficioTextoGenerado, 'Oficio de Canalización');
    downloadBlob(blob, `Oficio_${gestion.solicitante.replace(/\s+/g, '_')}.docx`);
  };

  const handleCopiarTexto = () => {
    navigator.clipboard.writeText(oficioTextoGenerado);
    setCopiadoOficio(true);
    setTimeout(() => setCopiadoOficio(false), 2500);
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
      {/* Navigation Header */}
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {gestion.folio}
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{gestion.solicitante}</h1>
            </div>
            <p className="text-xs text-slate-500">Expediente digital, bitácora de seguimiento y oficios de canalización.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Estado:</span>
          <select
            value={gestion.estatus}
            onChange={(e) => handleCambiarEstado(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            {ESTADOS_KANBAN.map((est) => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Citizen Card Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-200 shrink-0 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gestion.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={gestion.solicitante}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{gestion.solicitante}</h2>
            <StatusBadge status={gestion.prioridad} size="sm" />
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {gestion.categoria || 'General'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
            <span>CURP: <strong className="font-mono text-slate-900">{gestion.curp || 'No registrada'}</strong></span>
            <span>Sección Electoral: <strong className="text-blue-700">{gestion.seccionElectoral || 'S/D'}</strong></span>
            <span>📍 {gestion.colonia || 'Centro'}, {gestion.municipio || 'Centro'}</span>
            <span>📞 {gestion.telefono || 'Sin teléfono'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {gestion.telefono && (
            <a
              href={`https://api.whatsapp.com/send?phone=52${gestion.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${gestion.solicitante}, le escribimos del Despacho del Diputado Ruben Roque sobre su gestión folio ${gestion.folio}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#0b8043] hover:bg-[#096e38] text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </a>
          )}

          {gestion.driveFolderUrl && (
            <a
              href={gestion.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 shadow-2xs transition-colors"
            >
              <FolderOpen className="h-4 w-4 text-blue-600" />
              <span>Drive</span>
              <ExternalLink className="h-3 w-3" />
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

      {/* Two Column Layout: Bitácora de Observaciones & Oficio Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Observaciones (WhatsApp Style) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#00a884]" />
              <span>Bitácora de Observaciones ({gestion.notas?.length || 0})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Chat Interno</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 max-h-80 overflow-y-auto min-h-[200px]">
            {gestion.notas && gestion.notas.length > 0 ? (
              gestion.notas.map((nota: any) => (
                <div key={nota.id} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-900">{nota.autor}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{nota.fecha} • {nota.hora}</span>
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
              className="px-4 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>

        {/* Oficio Generator */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Generador de Oficios Oficiales</span>
            </h3>
            <button
              type="button"
              onClick={handleGenerarTextoOficio}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generar con IA</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Plantilla de Canalización</label>
              <select
                value={plantillaSeleccionadaId}
                onChange={(e) => {
                  setPlantillaSeleccionadaId(e.target.value);
                  const p = PLANTILLAS_PREDETERMINADAS.find(pl => pl.id === e.target.value);
                  if (p) {
                    setOficioDestinatario(p.destinatarioSugerido);
                    setOficioCargo(p.cargoSugerido);
                    setOficioDependencia(p.dependenciaPredeterminada);
                  }
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
              >
                {PLANTILLAS_PREDETERMINADAS.map((p) => (
                  <option key={p.id} value={p.id}>📄 {p.titulo}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destinatario</label>
                <input
                  type="text"
                  value={oficioDestinatario}
                  onChange={(e) => setOficioDestinatario(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dependencia</label>
                <input
                  type="text"
                  value={oficioDependencia}
                  onChange={(e) => setOficioDependencia(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>
            </div>

            {isGenerandoOficio ? (
              <div className="space-y-3 pt-2">
                <textarea
                  rows={8}
                  value={oficioTextoGenerado}
                  onChange={(e) => setOficioTextoGenerado(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarTexto}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    {copiadoOficio ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiadoOficio ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDescargarDocx}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar .docx</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerarTextoOficio}
                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Redactar Oficio Oficial para este Ciudadano</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
