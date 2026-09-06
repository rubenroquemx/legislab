'use client';

import { useState, useRef } from 'react';
import { 
  Mic, 
  Sparkles, 
  Copy, 
  Download, 
  Check, 
  Clock, 
  FileAudio, 
  RefreshCw, 
  StopCircle,
  Printer
} from 'lucide-react';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';

const INITIAL_SPEECH = `DISCURSO DE POSICIONAMIENTO EN TRIBUNA
TEMA: DEFENSA DEL DERECHO AL AGUA POTABLE Y RECURSOS PARA EL DISTRITO 04

Con su venia, Diputada Presidenta.
Compañeras y compañeros legisladores:

Hoy subo a esta tribuna no solo como representante popular, sino como la voz de miles de familias del Distrito 04 que todos los días enfrentan la incertidumbre de abrir la llave y no tener una sola gota de agua limpia para sus hogares.

No podemos seguir postergando las decisiones de fondo. El acceso al agua potable no es una dádiva gubernamental; es un derecho humano consagrado en nuestra Constitución. 

Durante décadas, se invirtió en parches temporales mientras las redes de distribución colapsaban. Hoy exigimos un presupuesto justo, transparente y etiquetado para obras de rehabilitación integral.

A las y los ciudadanos de mi distrito les digo con toda firmeza: su causa es mi causa, y desde este Congreso no daremos ni un paso atrás hasta garantizar que el agua llegue a cada colonia y a cada comunidad.

¡Es cuanto, Presidenta!`;

export default function DiscursosPage() {
  const [tema, setTema] = useState('');
  const [tipoDiscurso, setTipoDiscurso] = useState('Tribuna - Presentación de Iniciativa');
  const [tono, setTono] = useState('Firme y Enérgico');
  const [duracionDeseada, setDuracionDeseada] = useState('3 minutos (Tribuna)');

  const [discurso, setDiscurso] = useState(INITIAL_SPEECH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const wordCount = discurso.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 130)); // 130 wpm

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tema.trim() || isGenerating) return;

    setIsGenerating(true);
    setDiscurso('');

    abortRef.current = new AbortController();

    try {
      const promptDescription = `DISCURSO PARA: ${tipoDiscurso}. Tono: ${tono}. Duración estimada: ${duracionDeseada}. Tema: "${tema}". Incluye vocativos iniciales solemnes (Con su venia Presidenta), argumento central con fuerza política, datos de impacto social y cierre contundente.`;

      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptDescription,
          tipoDocumento: 'Discurso de Tribuna',
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
        setDiscurso(accumulated);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error generando discurso:', err);
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
    navigator.clipboard.writeText(discurso);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await generateDocxBlob(discurso, 'Discurso Parlamentario');
      downloadBlob(blob, `Discurso_${Date.now()}.docx`);
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
            <Mic className="h-6 w-6 text-blue-600" />
            Redactor de Discursos e Intervenciones
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generador de discursos con estructura oratoria, cálculo de tiempo en tribuna y modulación de tono.
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
        {/* Parameters Form */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileAudio className="h-4 w-4 text-blue-600" />
              Parámetros de la Intervención
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Tipo de Evento / Escenario</label>
                <select
                  value={tipoDiscurso}
                  onChange={(e) => setTipoDiscurso(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Tribuna - Presentación de Iniciativa</option>
                  <option>Tribuna - Posicionamiento de Bancada</option>
                  <option>Informe de Actividades Legislativas</option>
                  <option>Mitin o Asamblea Ciudadana en Distrito</option>
                  <option>Rueda de Prensa / Declaración a Medios</option>
                  <option>Intervención en Reunión de Comisión</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Tono del Discurso</label>
                  <select
                    value={tono}
                    onChange={(e) => setTono(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Firme y Enérgico</option>
                    <option>Solemne e Institucional</option>
                    <option>Empático y Cercano</option>
                    <option>Técnico y Argumentativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Tiempo Objetivo</label>
                  <select
                    value={duracionDeseada}
                    onChange={(e) => setDuracionDeseada(e.target.value)}
                    className="w-full p-2.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  >
                    <option>3 minutos (Tribuna)</option>
                    <option>5 minutos (Posicionamiento)</option>
                    <option>10 minutos (Informe/Mitin)</option>
                    <option>1 minuto (Intervención flash)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                  Mensaje Central o Postura Política
                </label>
                <textarea
                  rows={4}
                  required
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ej: Rechazar el incremento a las tarifas de transporte y exigir que se garantice subsidio a estudiantes..."
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
                      <span>Generando Discurso...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Redactar Discurso con IA</span>
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

          <div className="bg-amber-50/80 rounded-xl border border-amber-200 p-4 space-y-2 text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-600" />
              Ritmo de Tribuna
            </p>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              El tiempo en tribuna está calibrado a <strong>130 palabras por minuto</strong> con pausas estratégicas de énfasis parlamentario.
            </p>
          </div>
        </div>

        {/* Speech Area */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col min-h-[580px]">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/40/50">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100">Texto del Discurso</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                ⏱️ ~{estimatedMinutes} min lectura
              </span>
              <span className="text-[11px] text-gray-600 dark:text-gray-300 bg-white border border-gray-200/80 dark:border-gray-800 px-2 py-0.5 rounded font-mono">
                {wordCount} palabras
              </span>
            </div>
          </div>

          <div className="flex-1 p-5">
            <textarea
              value={discurso}
              onChange={(e) => setDiscurso(e.target.value)}
              className="w-full h-full min-h-[500px] p-5 text-sm sm:text-base font-serif leading-relaxed bg-amber-50/20 border border-gray-200/80 dark:border-gray-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}