'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Scale, 
  BookOpen, 
  Search, 
  FileText, 
  Download, 
  ExternalLink, 
  Sparkles, 
  Filter, 
  Bookmark, 
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

interface LeyDocumento {
  id: string;
  titulo: string;
  categoria: 'Constitucional' | 'Leyes Estatales' | 'Códigos' | 'Reglamentos Parlamentarios' | 'Federales';
  ultimaReforma: string;
  articulos: number;
  descripcion: string;
  pdfUrl: string;
  palabrasClave: string[];
}

const LEYES_TABASCO: LeyDocumento[] = [
  {
    id: 'ley-1',
    titulo: 'Constitución Política del Estado Libre y Soberano de Tabasco',
    categoria: 'Constitucional',
    ultimaReforma: '15 Jul 2026',
    articulos: 85,
    descripcion: 'Norma fundamental del Estado de Tabasco que establece la organización de los poderes públicos y los derechos ciudadanos.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['derechos humanos', 'poder legislativo', 'gobernador', 'ayuntamientos', 'soberanía'],
  },
  {
    id: 'ley-2',
    titulo: 'Ley Orgánica del Poder Legislativo del Estado de Tabasco',
    categoria: 'Reglamentos Parlamentarios',
    ultimaReforma: '20 May 2026',
    articulos: 142,
    descripcion: 'Regula la estructura, funcionamiento, comisiones ordinarias y proceso legislativo del H. Congreso del Estado.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['comisiones', 'sesiones', 'diputados', 'mesa directiva', 'iniciativas', 'dictámenes'],
  },
  {
    id: 'ley-3',
    titulo: 'Código Civil para el Estado de Tabasco',
    categoria: 'Códigos',
    ultimaReforma: '10 Ene 2026',
    articulos: 3240,
    descripcion: 'Disposiciones en materia de personas, familia, bienes, sucesiones, obligaciones y contratos.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['familia', 'propiedad', 'contratos', 'sucesiones', 'patrimonio'],
  },
  {
    id: 'ley-4',
    titulo: 'Código Penal para el Estado de Tabasco',
    categoria: 'Códigos',
    ultimaReforma: '05 Mar 2026',
    articulos: 412,
    descripcion: 'Tipificación de delitos, sanciones y medidas de seguridad en el fuero común del estado de Tabasco.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['delitos', 'penas', 'violencia de género', 'patrimonio', 'seguridad'],
  },
  {
    id: 'ley-5',
    titulo: 'Ley de Salud del Estado de Tabasco',
    categoria: 'Leyes Estatales',
    ultimaReforma: '12 Feb 2026',
    articulos: 280,
    descripcion: 'Bases y modalidades para el acceso a los servicios de salud y concurrencia con la federación e IMSS-Bienestar.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['salud mental', 'hospitales', 'medicamentos', 'prevención', 'hemodiálisis'],
  },
  {
    id: 'ley-6',
    titulo: 'Ley de Ordenamiento Territorial y Desarrollo Urbano del Estado',
    categoria: 'Leyes Estatales',
    ultimaReforma: '18 Nov 2025',
    articulos: 195,
    descripcion: 'Normas para la planeación, zonificación y obras públicas en los 17 municipios de Tabasco.',
    pdfUrl: 'https://congresotabasco.gob.mx/marco-juridico/',
    palabrasClave: ['obras públicas', 'drenaje', 'vivienda', 'asentamientos', 'municipios'],
  },
];

const CATEGORIAS_LIST = ['Todas', 'Constitucional', 'Reglamentos Parlamentarios', 'Leyes Estatales', 'Códigos', 'Federales'];

export default function MarcoJuridicoPage() {
  const [leyes, setLeyes] = useState<LeyDocumento[]>(LEYES_TABASCO);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [leySeleccionada, setLeySeleccionada] = useState<LeyDocumento | null>(LEYES_TABASCO[1]);

  const leyesFiltradas = leyes.filter((l) => {
    const matchesSearch = 
      l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.palabrasClave.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = filtroCategoria === 'Todas' || l.categoria === filtroCategoria;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          🏛️ LXVI Legislatura Tabasco
        </span>
      </div>

      {/* Search & Categories */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ley, artículo, palabra clave o tema..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
          {CATEGORIAS_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-semibold transition-all ${
                filtroCategoria === cat
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Law List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Laws List */}
        <div className="lg:col-span-7 space-y-3">
          {leyesFiltradas.map((ley) => (
            <div
              key={ley.id}
              onClick={() => setLeySeleccionada(ley)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 group ${
                leySeleccionada?.id === ley.id
                  ? 'bg-blue-50/80 border-blue-400 shadow-xs'
                  : 'bg-white border-gray-200/80 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {ley.categoria}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  Última reforma: {ley.ultimaReforma}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                {ley.titulo}
              </h3>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {ley.descripcion}
              </p>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {ley.palabrasClave.map((kw, i) => (
                  <span key={i} className="text-[9px] font-medium bg-gray-100 text-gray-600 px-2 py-0.2 rounded-md">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Law Inspector */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4 sticky top-24">
          {leySeleccionada ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{leySeleccionada.categoria}</span>
                  <h2 className="text-sm font-bold text-gray-900 leading-tight">{leySeleccionada.titulo}</h2>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Artículos vigentes:</span>
                  <span className="font-bold text-gray-800">{leySeleccionada.articulos} Artículos</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Última actualización:</span>
                  <span className="font-bold text-gray-800">{leySeleccionada.ultimaReforma}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-800 block mb-1">Resumen Normativo:</span>
                <p className="text-xs text-gray-600 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  {leySeleccionada.descripcion}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <a
                  href={leySeleccionada.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Consultar Texto Oficial en Congreso</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <Link
                  href="/iniciativas"
                  className="w-full inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Usar en Redacción de Iniciativa con IA</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs italic">
              Selecciona un documento para ver sus detalles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
