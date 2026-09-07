'use client';

import { useState } from 'react';
import { 
  Radio, 
  Tv, 
  Globe, 
  ExternalLink, 
  Plus, 
  Search, 
  TrendingUp, 
  Share2, 
  Users, 
  CheckCircle,
  Eye
} from 'lucide-react';

interface NotaMedio {
  id: number;
  medio: string;
  tipo: 'Prensa Escrita' | 'Televisión' | 'Radio' | 'Portal Digital';
  titular: string;
  periodista: string;
  fecha: string;
  sentimiento: 'Positiva' | 'Neutral' | 'Informativa';
  enlace?: string;
  alcance: string;
}

const initialNotas: NotaMedio[] = [
  {
    id: 1,
    medio: 'El Heraldo de México',
    tipo: 'Prensa Escrita',
    titular: 'Impulsa Diputado Ruben Roque plan emergente de infraestructura hídrica para el Distrito 04',
    periodista: 'Carlos Morales',
    fecha: '30 Ago 2026',
    sentimiento: 'Positiva',
    enlace: '#',
    alcance: '45,000 lectores',
  },
  {
    id: 2,
    medio: 'W Radio 96.9 FM',
    tipo: 'Radio',
    titular: 'Entrevista en vivo: Los retos legislativos de la salud mental en la juventud',
    periodista: 'Gabriela Warkentin',
    fecha: '28 Ago 2026',
    sentimiento: 'Positiva',
    enlace: '#',
    alcance: '120,000 radioescuchas',
  },
  {
    id: 3,
    medio: 'Milenio Digital',
    tipo: 'Portal Digital',
    titular: 'Cámara de Diputados recibe propuesta para reformar ley de teleasistencia médica',
    periodista: 'Redacción Política',
    fecha: '26 Ago 2026',
    sentimiento: 'Informativa',
    enlace: '#',
    alcance: '85,000 visitas',
  },
  {
    id: 4,
    medio: 'Noticias Canal 11',
    tipo: 'Televisión',
    titular: 'Cobertura especial: Diputados sesionan sobre presupuesto municipal 2027',
    periodista: 'Ana Lucía Ordoñez',
    fecha: '24 Ago 2026',
    sentimiento: 'Neutral',
    enlace: '#',
    alcance: '210,000 televidentes',
  },
];

export default function MediosPage() {
  const [notas, setNotas] = useState<NotaMedio[]>(initialNotas);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  const filtered = notas.filter((n) => {
    const matchesSearch = n.titular.toLowerCase().includes(search.toLowerCase()) || n.medio.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = filtroTipo === 'Todos' || n.tipo === filtroTipo;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => alert('Formulario para registrar nueva nota o entrevista')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Registrar Nota / Cobertura</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notas Monitoreadas este Mes</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">24 menciones</p>
          <p className="text-xs text-emerald-600 font-medium">+18% vs mes anterior</p>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sentimiento Favorable</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">91.6%</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Cobertura propositiva de iniciativas</p>
        </div>
        <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impacto de Audiencia Estimado</span>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">460K+</p>
          <p className="text-xs text-blue-600 font-medium">Distrito 04 y Nacional</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por titular o medio..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {['Todos', 'Prensa Escrita', 'Radio', 'Televisión', 'Portal Digital'].map((t) => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filtroTipo === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((nota) => (
            <div key={nota.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50/70 transition-colors space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded">
                    {nota.medio}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">• {nota.tipo}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {nota.sentimiento}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{nota.fecha}</span>
                </div>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 cursor-pointer">
                {nota.titular}
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 pt-1">
                <div className="flex items-center gap-4">
                  <span>Reportero(a): <strong className="text-gray-700 dark:text-gray-200">{nota.periodista}</strong></span>
                  <span>Alcance: <strong className="text-gray-700 dark:text-gray-200">{nota.alcance}</strong></span>
                </div>
                <button
                  onClick={() => alert(`Abriendo nota en ${nota.medio}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <span>Ver Cobertura</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}