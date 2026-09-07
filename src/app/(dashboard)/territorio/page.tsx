'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Layers, 
  Calendar, 
  FolderKanban, 
  CheckCircle2, 
  Navigation, 
  Compass, 
  Users, 
  Flame, 
  ExternalLink, 
  Filter, 
  Search, 
  Plus, 
  Sparkles,
  Phone,
  MessageCircle,
  Clock,
  Building
} from 'lucide-react';

interface EventoTerritorial {
  id: string;
  titulo: string;
  tipo: 'Atención Ciudadana' | 'Comisión' | 'Sesión Solemne' | 'Recorrido en Territorio' | 'Reunión Vecinal';
  colonia: string;
  municipio: string;
  seccionElectoral: string;
  coordenadas: { lat: number; lng: number };
  fecha: string;
  hora: string;
  estatus: 'Realizado' | 'Programado';
  asistentesEstimados: number;
  acuerdos: string;
  mapsUrl: string;
}

const EVENTOS_TERRITORIALES: EventoTerritorial[] = [
  {
    id: 'terr-1',
    titulo: 'Audiencia Ciudadana y Entrega de Sillas de Ruedas (DIF / Territorio)',
    tipo: 'Atención Ciudadana',
    colonia: 'Col. Atasta de Serra',
    municipio: 'Centro (Villahermosa)',
    seccionElectoral: '0284',
    coordenadas: { lat: 17.9892, lng: -92.9341 },
    fecha: '03 Sep 2026',
    hora: '04:00 PM',
    estatus: 'Realizado',
    asistentesEstimados: 45,
    acuerdos: 'Recepción de 15 solicitudes de gestión vecinal y entrega de 8 aparatos ortopédicos.',
    mapsUrl: 'https://maps.google.com/?q=Atasta+Villahermosa',
  },
  {
    id: 'terr-2',
    titulo: 'Recorrido de Supervisión de 14 Luminarias y Dren Pluvial',
    tipo: 'Recorrido en Territorio',
    colonia: 'Col. San Pedro, Sección 2',
    municipio: 'Centro (Villahermosa)',
    seccionElectoral: '0312',
    coordenadas: { lat: 17.9754, lng: -92.9482 },
    fecha: '02 Sep 2026',
    hora: '05:30 PM',
    estatus: 'Realizado',
    asistentesEstimados: 30,
    acuerdos: 'Visita con comité vecinal presidido por Laura Mendoza. Se integró oficio a SOTOP y Ayuntamiento.',
    mapsUrl: 'https://maps.google.com/?q=San+Pedro+Villahermosa',
  },
  {
    id: 'terr-3',
    titulo: '61. Comisión Ordinaria de Gobernación y Puntos Constitucionales',
    tipo: 'Comisión',
    colonia: 'Plaza de Armas',
    municipio: 'Centro (Villahermosa)',
    seccionElectoral: '0340',
    coordenadas: { lat: 17.9908, lng: -92.9174 },
    fecha: '03 Sep 2026',
    hora: '09:00 AM',
    estatus: 'Realizado',
    asistentesEstimados: 18,
    acuerdos: 'Dictamen de proyecto de reforma a la Ley Orgánica del Poder Legislativo.',
    mapsUrl: 'https://share.google/RSlrkI2maowYbwLnH',
  },
  {
    id: 'terr-4',
    titulo: 'Reunión de Trabajo y Brigada Comunitaria en Ejido Guadalupe',
    tipo: 'Reunión Vecinal',
    colonia: 'Ejido Guadalupe',
    municipio: 'Comalcalco',
    seccionElectoral: '0450',
    coordenadas: { lat: 18.2612, lng: -93.2845 },
    fecha: '07 Sep 2026',
    hora: '10:00 AM',
    estatus: 'Programado',
    asistentesEstimados: 80,
    acuerdos: 'Entrega de mobiliario escolar y proyector para aula comunitaria de la Esc. Primaria Benito Juárez.',
    mapsUrl: 'https://maps.google.com/?q=Comalcalco+Tabasco',
  },
  {
    id: 'terr-5',
    titulo: 'Asamblea de Enlace Vecinal en Plan de Chontalpa Poblado C-29',
    tipo: 'Atención Ciudadana',
    colonia: 'Poblado C-29',
    municipio: 'Cárdenas',
    seccionElectoral: '0189',
    coordenadas: { lat: 18.0014, lng: -93.3762 },
    fecha: '09 Sep 2026',
    hora: '11:30 AM',
    estatus: 'Programado',
    asistentesEstimados: 120,
    acuerdos: 'Recepción de expedientes de apoyo para adultos mayores y techumbres comunitarias.',
    mapsUrl: 'https://maps.google.com/?q=Cardenas+Tabasco',
  },
];

export default function TerritorioPage() {
  const [eventos, setEventos] = useState<EventoTerritorial[]>(EVENTOS_TERRITORIALES);
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('Todos');
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoTerritorial | null>(EVENTOS_TERRITORIALES[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const eventosFiltrados = eventos.filter((ev) => {
    const matchSearch = 
      ev.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.colonia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.municipio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.seccionElectoral.includes(searchTerm);

    const matchTipo = filtroTipo === 'Todos' || ev.tipo === filtroTipo;
    const matchEstatus = filtroEstatus === 'Todos' || ev.estatus === filtroEstatus;

    return matchSearch && matchTipo && matchEstatus;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Atención Ciudadana': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Recorrido en Territorio': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Comisión': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition-colors"
        >
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>Alimentado desde Agenda</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Actividades</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{eventos.length}</p>
          <span className="text-[10px] text-gray-400 block mt-0.5">En el territorio</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Realizadas</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{eventos.filter(e => e.estatus === 'Realizado').length}</p>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Giras concluidas</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Programadas</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{eventos.filter(e => e.estatus === 'Programado').length}</p>
          <span className="text-[10px] text-blue-600 block mt-0.5">Próximos días</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Ciudadanos Atendidos</span>
          <p className="text-2xl font-black text-purple-700 mt-1">
            {eventos.reduce((acc, curr) => acc + curr.asistentesEstimados, 0)}
          </p>
          <span className="text-[10px] text-purple-600 block mt-0.5">En asambleas y giras</span>
        </div>
      </div>

      {/* Main Map & Event Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: INTERACTIVE MAP SIMULATOR */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span>Mapa de Calor & Puntos Georreferenciados</span>
            </h2>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Tabasco — Distrito 04
            </span>
          </div>

          {/* Map Canvas with simulated interactive pins */}
          <div className="relative w-full h-[480px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-inner flex items-center justify-center group">
            {/* Background Map Graphic / Satellite Simulation */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&auto=format&fit=crop&q=80" 
              alt="Mapa Territorial" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity filter contrast-125"
            />
            
            {/* Overlay grid & pins */}
            <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-slate-950/80"></div>

            {/* Simulated Interactive Pins */}
            {eventosFiltrados.map((ev, index) => {
              const positions = [
                { top: '35%', left: '42%' },
                { top: '55%', left: '38%' },
                { top: '40%', left: '50%' },
                { top: '25%', left: '65%' },
                { top: '68%', left: '28%' },
              ];
              const pos = positions[index % positions.length];
              const isSelected = eventoSeleccionado?.id === ev.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => setEventoSeleccionado(ev)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-all transform hover:scale-125 group ${
                    isSelected ? 'scale-125 z-20' : ''
                  }`}
                >
                  <div className="relative">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      ev.estatus === 'Realizado' ? 'bg-emerald-500' : 'bg-blue-500'
                    } ring-4 ring-white/30 animate-pulse`}></span>
                    
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-xl">
                      {ev.colonia}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-xs p-1.5 rounded-xl shadow-lg space-y-1 text-gray-700 flex flex-col">
              <button className="h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-xs flex items-center justify-center">+</button>
              <button className="h-7 w-7 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-xs flex items-center justify-center">-</button>
            </div>

            <div className="absolute bottom-4 left-4 z-10 bg-gray-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[10px] flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Realizado</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span> Programado</span>
            </div>
          </div>
        </div>

        {/* RIGHT: LIST & DETAIL OF TERRITORIAL ACTIVITIES */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Bitácora de Cobertura</h2>
            <div className="flex items-center gap-1.5">
              <select
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
                className="text-[11px] font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Realizado">Realizados</option>
                <option value="Programado">Programados</option>
              </select>
            </div>
          </div>

          {/* Selected Event Highlight */}
          {eventoSeleccionado && (
            <div className="p-4 bg-gradient-to-br from-blue-50/70 to-slate-50 rounded-2xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTipoColor(eventoSeleccionado.tipo)}`}>
                  {eventoSeleccionado.tipo}
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  📅 {eventoSeleccionado.fecha} • {eventoSeleccionado.hora}
                </span>
              </div>

              <h3 className="text-xs font-bold text-gray-900 leading-snug">
                {eventoSeleccionado.titulo}
              </h3>

              <div className="text-[11px] text-gray-600 space-y-1 bg-white p-2.5 rounded-xl border border-blue-100">
                <p>📍 <strong>Ubicación:</strong> {eventoSeleccionado.colonia}, {eventoSeleccionado.municipio}</p>
                <p>🗳️ <strong>Sección Electoral:</strong> {eventoSeleccionado.seccionElectoral}</p>
                <p>👥 <strong>Asistencia:</strong> ~{eventoSeleccionado.asistentesEstimados} personas</p>
                <p className="pt-1 text-gray-700 italic border-t border-gray-100">
                  📝 {eventoSeleccionado.acuerdos}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <a
                  href={eventoSeleccionado.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  <span>Cómo llegar (Google Maps / Waze)</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>

                <Link
                  href="/gestiones"
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  Ver Gestiones de esta zona ➔
                </Link>
              </div>
            </div>
          )}

          {/* List of all events */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-gray-100">
            {eventosFiltrados.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setEventoSeleccionado(ev)}
                className={`pt-2.5 pb-2.5 px-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 ${
                  eventoSeleccionado?.id === ev.id ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{ev.colonia}</p>
                  <p className="text-[10px] text-gray-500 truncate">{ev.titulo}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                  ev.estatus === 'Realizado' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {ev.estatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
