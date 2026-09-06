'use client';

import { useState, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  Copy, 
  Download, 
  Check, 
  BookOpen, 
  FileSignature, 
  RefreshCw,
  Printer,
  BookmarkCheck,
  StopCircle
} from 'lucide-react';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';
import { createIniciativa } from '@/app/actions/gestiones';

const DEFAULT_INITIAL_TEXT = `INICIATIVA CON PROYECTO DE DECRETO POR EL QUE SE REFORMAN Y ADICIONAN DIVERSAS DISPOSICIONES DE LA LEY GENERAL DE SALUD EN MATERIA DE SALUD MENTAL DIGITAL.

HONORABLE CÁMARA DE DIPUTADOS
LXVI LEGISLATURA
PRESENTE.

El suscrito, Diputado Federal integrante de la LXVI Legislatura del H. Congreso de la Unión, con fundamento en lo dispuesto en el artículo 71, fracción II, de la Constitución Política de los Estados Unidos Mexicanos, somete a consideración de esta Soberanía la siguiente:

EXPOSICIÓN DE MOTIVOS

I. PLANTEAMIENTO DEL PROBLEMA
En la última década, la digitalización y el acceso a tecnologías de la información han transformado la interacción social y laboral en México. No obstante, este fenómeno ha generado nuevos desafíos en el bienestar psicológico de la población...

II. FUNDAMENTACIÓN JURÍDICA
El Estado mexicano tiene la obligación ineludible de tutelar el derecho a la protección de la salud consagrado en el artículo 4o. constitucional.

III. PROYECTO DE DECRETO

ARTÍCULO ÚNICO.- Se adiciona el Artículo 73 Bis a la Ley General de Salud, para quedar como sigue:

Artículo 73 Bis.- La Secretaría de Salud implementará programas de atención y prevención en salud mental digital y teleasistencia psicológica permanente.

TRANSITORIOS
PRIMERO.- El presente Decreto entrará en vigor al día siguiente de su publicación en el Diario Oficial de la Federación.`;

export default function RedactorPage() {
  const [prompt, setPrompt] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('Iniciativa de Ley');
  const [ambito, setAmbito] = useState('Federal (Cámara de Diputados)');
  const [comision, setComision] = useState('Comisión de Puntos Constitucionales');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [documentContent, setDocumentContent] = useState(DEFAULT_INITIAL_TEXT);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Contador de palabras y tiempo estimado en tribuna
  const wordCount = documentContent.trim().split(/\s+/).filter(Boolean).length;
  const minutesInTribuna = Math.max(1, Math.round(wordCount / 130)); // 130 palabras por minuto en tribuna

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setDocumentContent('');
    setSaved(false);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          tipoDocumento,
          ambito,
          comision,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Error al conectar con el motor de IA');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setDocumentContent(accumulated);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Error generando documento:', err);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(documentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      const safeTitle = tipoDocumento.replace(/\s+/g, '_');
      const blob = await generateDocxBlob(documentContent, tipoDocumento);
      downloadBlob(blob, `Legislab_${safeTitle}_${Date.now()}.docx`);
    } catch (err) {
      console.error('Error exportando a Word:', err);
      alert('Hubo un error al generar el archivo Word.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleSaveToCatalog = async () => {
    try {
      const titleLine = documentContent.split('\n')[0] || prompt || 'Iniciativa sin título';
      const result = await createIniciativa({
        titulo: titleLine.slice(0, 150),
        tipoDocumento,
        ambito,
        comision,
        contenido: documentContent,
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('No se pudo guardar la iniciativa en el catálogo.');
      }
    } catch (err) {
      console.error('Error saving iniciativa:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Redactor Parlamentario con IA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Asistente en técnica legislativa, argumentación constitucional y redacción de decretos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button
            onClick={handleSaveToCatalog}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <BookmarkCheck className="h-4 w-4 text-slate-500" />}
            <span>{saved ? '¡Guardada en Catálogo!' : 'Guardar en Iniciativas'}</span>
          </button>
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>{isExportingDocx ? 'Generando...' : 'Descargar Word (.docx)'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-blue-600" />
              Parámetros de la Iniciativa
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Documento</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Iniciativa de Ley / Reforma Constitucional</option>
                  <option>Punto de Acuerdo (Exhorto Institucional)</option>
                  <option>Discurso de Tribuna / Posicionamiento</option>
                  <option>Dictamen en Comisión</option>
                  <option>Oficio de Gestión Distrital</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ámbito Parlamentario</label>
                <select
                  value={ambito}
                  onChange={(e) => setAmbito(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option>Federal (Cámara de Diputados)</option>
                  <option>Senado de la República</option>
                  <option>Congreso Local / Estatal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Comisión Legislativa de Turno</label>
                <input
                  type="text"
                  value={comision}
                  onChange={(e) => setComision(e.target.value)}
                  placeholder="Ej: Comisión de Salud / Hacienda"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Idea Principal o Problemática a Resolver
                </label>
                <textarea
                  rows={4}
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ej: Crear un fondo de contingencia hídrica para apoyar a productores agrícolas afectados por sequías..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                      <span>Redactando en vivo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generar con IA (Streaming)</span>
                    </>
                  )}
                </button>
                {isGenerating && (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="inline-flex items-center justify-center gap-1.5 px-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
                  >
                    <StopCircle className="h-4 w-4" />
                    <span>Detener</span>
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-blue-50/80 rounded-xl border border-blue-200 p-4 space-y-2 text-xs text-blue-900">
            <p className="font-bold flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Técnica Legislativa Mexicana
            </p>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Formato riguroso con proemio (Art. 71 Fracc. II CPEUM), exposición de motivos estructurada, proyecto de decreto y artículos transitorios reglamentarios.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col min-h-[580px]">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-800">Borrador del Instrumento Legislativo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                {wordCount} palabras
              </span>
              <span className="text-[11px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                ~{minutesInTribuna} min en tribuna
              </span>
              <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono">
                {documentContent.length} chars
              </span>
            </div>
          </div>

          <div className="flex-1 p-5">
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full h-full min-h-[500px] p-4 text-xs sm:text-sm font-mono leading-relaxed bg-slate-50/30 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}