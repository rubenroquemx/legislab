'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckSquare, ChevronLeft, Calendar, Clock } from 'lucide-react';
import { createTarea } from '@/app/actions/tareas';
import { getTodayMexicoCity } from '@/lib/date-utils';

const MODULOS_SISTEMA_LIST = [
  'Gestiones', 
  'Iniciativas', 
  'Agenda', 
  'Boletines', 
  'Discursos', 
  'Medios', 
  'Directorio', 
  'General'
];

const USUARIOS_EQUIPO = [
  { id: 'usr-1', nombre: 'Dip. Ruben Roque', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', cargo: 'Diputado Local (Titular)', whatsapp: '993 111 2233' },
  { id: 'usr-2', nombre: 'Lic. Mariana Soto Gómez', foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', cargo: 'Asesora Jurídica', whatsapp: '993 456 7890' },
  { id: 'usr-3', nombre: 'Lic. Roberto Garza Priego', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', cargo: 'Secretario Técnico', whatsapp: '993 321 6549' },
  { id: 'usr-4', nombre: 'Ing. Carlos Alberto Morales', foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', cargo: 'Enlace Territorio', whatsapp: '993 789 1234' },
  { id: 'usr-5', nombre: 'Lic. Paulina Rovirosa Vega', foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', cargo: 'Comunicación Social', whatsapp: '993 888 7766' },
  { id: 'usr-6', nombre: 'L.A.E. Sofía Méndez Narváez', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', cargo: 'Gestión Social', whatsapp: '993 999 4455' },
];

export default function NuevaTareaPage() {
  const router = useRouter();

  const [formTitulo, setFormTitulo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUsuarioId, setFormUsuarioId] = useState('usr-1');
  const [formPrioridad, setFormPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Alta');
  const [formModulo, setFormModulo] = useState('Gestiones');
  const [formFechaLimite, setFormFechaLimite] = useState(getTodayMexicoCity());
  const [formHoraLimite, setFormHoraLimite] = useState('14:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) return;
    setIsSubmitting(true);

    const userObj = USUARIOS_EQUIPO.find(u => u.id === formUsuarioId) || USUARIOS_EQUIPO[0];

    try {
      const res = await createTarea({
        titulo: formTitulo.trim(),
        descripcion: formDesc.trim(),
        usuarioId: userObj.id,
        usuarioNombre: userObj.nombre,
        usuarioFoto: userObj.foto,
        usuarioCargo: userObj.cargo,
        usuarioWhatsapp: userObj.whatsapp,
        prioridad: formPrioridad,
        estatus: 'Pendiente',
        fechaLimite: formFechaLimite,
        horaLimite: formHoraLimite,
        moduloRelacionado: formModulo
      });

      if (res.success) {
        router.push('/tareas');
      } else {
        alert(res.error || 'No se pudo crear la tarea');
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
          href="/tareas"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver a Tareas</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span>Asignar Nueva Tarea al Equipo</span>
          </h1>
          <p className="text-xs text-slate-500">
            Define objetivos, responsable, fecha límite y módulo vinculado.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título de la Tarea <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={formTitulo}
            onChange={(e) => setFormTitulo(e.target.value)}
            placeholder="Ej: Elaborar dictamen de comisiones unidas..."
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Integrante Responsable <span className="text-red-500">*</span>
          </label>
          <select
            value={formUsuarioId}
            onChange={(e) => setFormUsuarioId(e.target.value)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
          >
            {USUARIOS_EQUIPO.map((u) => (
              <option key={u.id} value={u.id}>
                👤 {u.nombre} — ({u.cargo})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
            <select
              value={formPrioridad}
              onChange={(e) => setFormPrioridad(e.target.value as any)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
            >
              <option value="Alta">🔴 Alta (Urgente)</option>
              <option value="Media">🟡 Media</option>
              <option value="Baja">🟢 Baja</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Módulo Vinculado</label>
            <select
              value={formModulo}
              onChange={(e) => setFormModulo(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
            >
              {MODULOS_SISTEMA_LIST.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span>Fecha Límite <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              type="date"
              value={formFechaLimite}
              onChange={(e) => setFormFechaLimite(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>Hora Límite <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              type="time"
              value={formHoraLimite}
              onChange={(e) => setFormHoraLimite(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Instrucciones y Requisitos de Entrega
          </label>
          <textarea
            rows={4}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Detalla los antecedentes, requerimientos, contactos clave y entregables..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/tareas"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Guardando...' : 'Asignar Tarea'}
          </button>
        </div>
      </form>
    </div>
  );
}
