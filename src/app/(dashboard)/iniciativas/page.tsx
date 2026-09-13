'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Landmark, 
  BookOpen,
  Download
} from 'lucide-react';
import { generateDocxBlob, downloadBlob } from '@/lib/export/docx-exporter';
import { StatusBadge } from '@/components/ui/status-badge';

interface IniciativaItem {
  id: number;
  titulo: string;
  tipo: string;
  ambito: string;
  comision: string;
  estado: 'Borrador' | 'En Comisión' | 'Presentada en Pleno' | 'Aprobada';
  fecha: string;
  articulado: string;
}

const initialIniciativas: IniciativaItem[] = [
  {
    id: 1,
    titulo: 'Iniciativa con Proyecto de Decreto por el que se reforma la Ley General de Salud en materia de Salud Mental Digital',
    tipo: 'Iniciativa de Ley',
    ambito: 'Federal (Cámara de Diputados)',
    comision: 'Comisión de Salud',
    estado: 'En Comisión',
    fecha: '25 Ago 2026',
    articulado: 'Adición del Artículo 73 Bis a la Ley General de Salud para incorporar programas de teleasistencia psicológica permanente.',
  },
  {
    id: 2,
    titulo: 'Iniciativa que reforma el Artículo 115 Constitucional para fortalecer el Fondo de Infraestructura Hídrica Municipal',
    tipo: 'Reforma Constitucional',
    ambito: 'Federal (Cámara de Diputados)',
    comision: 'Comisión de Puntos Constitucionales',
    estado: 'Presentada en Pleno',
    fecha: '18 Ago 2026',
    articulado: 'Establece la obligatoriedad de destinar al menos el 15% de los fondos de aportación a rehabilitación de redes de agua potable.',
  },
  {
    id: 3,
    titulo: 'Punto de Acuerdo para exhortar a la Secretaría de Infraestructura a reparar tramos carreteros del Distrito 04',
    tipo: 'Punto de Acuerdo',
    ambito: 'Federal (Cámara de Diputados)',
    comision: 'Junta de Coordinación Política',
    estado: 'Aprobada',
    fecha: '10 Ago 2026',
    articulado: 'Exhorto institucional de urgente y obvia resolución.',
  },
  {
    id: 4,
    titulo: 'Proyecto de Ley de Incentivos Fiscales para Microempresas y Jóvenes Emprendedores en Zonas Prioritarias',
    tipo: 'Iniciativa de Ley',
    ambito: 'Federal (Cámara de Diputados)',
    comision: 'Comisión de Hacienda y Crédito Público',
    estado: 'Borrador',
    fecha: '29 Ago 2026',
    articulado: 'Deducción acelerada y exención de cuotas de registro patronal durante los primeros 24 meses.',
  },
];

export default function IniciativasPage() {
  const [iniciativas, setIniciativas] = useState<IniciativaItem[]>(initialIniciativas);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const filtered = iniciativas.filter((item) => {
    const matchesSearch = item.titulo.toLowerCase().includes(search.toLowerCase()) || item.comision.toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filtroEstado === 'Todos' || item.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Presentada en Pleno':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'En Comisión':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-800';
    }
  };

  const handleExport = async (item: IniciativaItem) => {
    const text = `${item.titulo.toUpperCase()}\n\nÁMBITO: ${item.ambito}\nCOMISIÓN: ${item.comision}\nESTADO: ${item.estado}\n\nRESUMEN NORMATIVO:\n${item.articulado}\n\nDado en la H. Cámara de Diputados, LXVI Legislatura.`;
    const blob = await generateDocxBlob(text, item.tipo);
    downloadBlob(blob, `Iniciativa_${item.id}_${Date.now()}.docx`);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/redactor"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Redactar Nueva Iniciativa con IA</span>
        </Link>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o comisión..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['Todos', 'En Comisión', 'Presentada en Pleno', 'Aprobada', 'Borrador'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filtroEstado === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Initiatives List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs p-5 hover:border-gray-300 dark:border-gray-700 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-2.5 py-0.5 rounded">
                    {item.tipo}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.comision}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug">{item.titulo}</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(item.estado)}`}>
                {item.estado}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-mono">
              {item.articulado}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>Fecha: <strong className="text-gray-700 dark:text-gray-200">{item.fecha}</strong></span>
                <span>Ámbito: <strong>{item.ambito}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(item)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar Word</span>
                </button>
                <Link
                  href="/redactor"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1.5"
                >
                  <span>Abrir en Redactor IA</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}