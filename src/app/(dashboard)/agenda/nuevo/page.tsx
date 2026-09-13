'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronLeft, Clock, MapPin, Landmark } from 'lucide-react';
import { createAgendaEvento } from '@/app/actions/agenda';
import { getTodayMexicoCity } from '@/lib/date-utils';

const TIPOS_EVENTO = [
  'Comisión', 
  'Sesión Solemne', 
  'Sesión Ordinaria', 
  'Atención Ciudadana', 
  'Reunión de Trabajo', 
  'Rueda de Prensa',
  'Evento Cívico',
  'Recorrido Territorial'
];

export default function NuevoEventoAgendaPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('Comisión');
  const [fecha, setFecha] = useState(getTodayMexicoCity());
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [horaFin, setHoraFin] = useState('11:30');
  const [lugar, setLugar] = useState('Congreso del Estado');
  const [lugarUrl, setLugarUrl] = useState('https://maps.google.com');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await createAgendaEvento({
        titulo: titulo.trim(),
        tipo,
        fecha,
        horaInicio,
        horaFin,
        lugarNombre: lugar.trim(),
        lugarUrl: lugarUrl.trim() || undefined,
        notas: notas.trim() || undefined
      });

      if (res.success) {
        router.push('/agenda');
      } else {
        alert(res.error || 'No se pudo guardar el evento');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver a la Agenda</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <span>Nuevo Evento en Agenda Parlamentaria</span>
          </h1>
          <p className="text-xs text-slate-500">
            Registra una actividad oficial, reunión de comisiones o audiencia ciudadana.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre del Evento <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: 61. Comisión Ordinaria de Puntos Constitucionales..."
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Evento</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              {TIPOS_EVENTO.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
            <input
              required
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Hora de Inicio <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Hora de Término <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Landmark className="h-4 w-4 text-blue-600" />
              <span>Sede / Lugar Oficial</span>
            </label>
            <input
              type="text"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Sala de Comisiones en Congreso del Estado"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>Ubicación en Google Maps (Enlace)</span>
            </label>
            <input
              type="url"
              value={lugarUrl}
              onChange={(e) => setLugarUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notas y Puntos a Tratar
          </label>
          <textarea
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Orden del día, acuerdos previos, participantes y documentación requerida..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/agenda"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Guardando en Agenda...' : 'Guardar Evento'}
          </button>
        </div>
      </form>
    </div>
  );
}
