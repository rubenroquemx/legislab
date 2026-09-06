'use client';

import { useState, useRef } from 'react';
import { 
  Newspaper, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  Send, 
  RefreshCw, 
  StopCircle,
  Printer,
  Megaphone
} from 'lucide-react';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';

const INITIAL_BOLETIN = `BOLETÍN DE PRENSA No. 048/2026

PRESENTA DIP. RUBEN ROQUE INICIATIVA HISTÓRICA PARA GARANTIZAR SALUD MENTAL DIGITAL EN JÓVENES

• La propuesta reforma la Ley General de Salud para crear programas de teleasistencia permanente en todo el país.
• "Nuestra juventud no puede esperar; la atención psicológica debe ser un derecho accesible y universal", afirmó el legislador federal.

CIUDAD DE MÉXICO, a 31 de agosto de 2026.- Con el firme compromiso de atender una de las demandas más sentidas de las familias mexicanas, el Diputado Federal Ruben Roque, integrante de la LXVI Legislatura, presentó ante el Pleno de la Cámara de Diputados una iniciativa con proyecto de decreto para reformar la Ley General de Salud.

Durante su intervención, el legislador destacó que tras la pandemia y con el auge de las redes digitales, los índices de ansiedad y depresión en jóvenes se incrementaron de manera alarmante sin que existan suficientes especialistas en los centros de salud distritales.

"Hoy damos un paso contundente para que el Estado mexicano utilice la tecnología en favor de la salud emocional de nuestra gente", puntualizó Roque.

La iniciativa fue turnada a la Comisión de Salud para su análisis y dictaminación en las próximas semanas.

---
CONTACTO DE PRENSA:
Coordinación de Comunicación Social - Despacho Dip. Ruben Roque
Tel: 55 5036 0000 Ext. 1234 | Correo: prensa.roque@diputados.gob.mx`;

export default function BoletinesPage() {
  const [noticia, setNoticia] = useState('');
  const [enfoque, setEnfoque] = useState('Iniciativa / Logro Legislativo');
  const [lugarFecha, setLugarFecha] = useState('Ciudad de México');

  const [boletin, setBoletin] = useState(INITIAL_BOLETIN);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticia.trim() || isGenerating) return;

    setIsGenerating(true);
    setBoletin('');

    abortRef.current = new AbortController();

    try {
      const promptDescription = `BOLETÍN DE PRENSA OFICIAL. Enfoque: ${enfoque}. Lugar: ${lugarFecha}. Hecho noticioso / Declaraciones: "${noticia}". Redacta con formato periodístico profesional (Titular en mayúsculas, 2 balazos con viñetas, entrada con Ciudad y Fecha, cuerpo con citas textuales del Diputado Ruben Roque y ficha de contacto al final).`;

      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptDescription,
          tipoDocumento: 'Boletín de Prensa',
          ambito: 'Federal (Cámara de Diputados)',
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error('Error al conectar');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setBoletin(accumulated);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error generando boletín:', err);
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(boletin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generateDocxBlob(boletin, 'Boletin de Prensa');
      downloadBlob(blob, `Boletin_Prensa_${Date.now()}.docx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-blue-600" />
            Boletines y Comunicación Social
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Redacción de comunicados de prensa institucionales listos para enviar a medios y periodistas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-200 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Word</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-600" />
              Datos del Comunicado
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Enfoque Informativo</label>
                <select
                  value={enfoque}
                  onChange={(e) => setEnfoque(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Iniciativa / Logro Legislativo</option>
                  <option>Entrega de Apoyos y Gestión en Distrito</option>
                  <option>Posicionamiento Político / Denuncia</option>
                  <option>Convocatoria a Rueda de Prensa</option>
                  <option>Aprobación de Dictamen en Comisión</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Lugar de Emisión</label>
                <input
                  type="text"
                  value={lugarFecha}
                  onChange={(e) => setLugarFecha(e.target.value)}
                  placeholder="Ej: Ciudad de México / Distrito 04"
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Hecho Noticioso / Citas Clave del Diputado
                </label>
                <textarea
                  rows={4}
                  required
                  value={noticia}
                  onChange={(e) => setNoticia(e.target.value)}
                  placeholder="Ej: Presentación de propuesta para crear 5 nuevos centros de salud en el distrito con inversión federal..."
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold py-3 rounded-lg shadow-sm shadow-blue-600/20 transition-all"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Redactando Boletín...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generar Boletín con IA</span>
                    </>
                  )}
                </button>
                {isGenerating && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center justify-center gap-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>Parar</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col min-h-[580px]">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/40/50">
            <div className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100">Vista del Boletín</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-white border border-gray-200/80 dark:border-gray-800 px-2 py-0.5 rounded">
              Formato Sala de Prensa
            </span>
          </div>

          <div className="flex-1 p-5">
            <textarea
              value={boletin}
              onChange={(e) => setBoletin(e.target.value)}
              className="w-full h-full min-h-[500px] p-5 text-xs sm:text-sm font-sans leading-relaxed bg-gray-50 dark:bg-gray-800/40/30 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}