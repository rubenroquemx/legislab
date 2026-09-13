'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UsersRound, ChevronLeft, MessageCircle } from 'lucide-react';
import { createGrupo } from '@/app/actions/grupos';

export default function NuevoGrupoPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Comité Territorial');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await createGrupo({
        nombre: nombre.trim(),
        categoria,
        color,
        whatsappLink: whatsappLink.trim() || undefined
      });

      if (res.success) {
        router.push('/grupos');
      } else {
        alert(res.error || 'No se pudo crear el grupo');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/grupos"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver a Grupos</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-blue-600" />
            <span>Crear Nuevo Grupo o Comité</span>
          </h1>
          <p className="text-xs text-slate-500">Agrupa contactos, líderes territoriales o enlaces parlamentarios.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre del Grupo <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Red de Jóvenes Líderes - Distrito 04"
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              <option value="Comité Territorial">Comité Territorial</option>
              <option value="Equipo de Despacho">Equipo de Despacho</option>
              <option value="Líderes de Colonia">Líderes de Colonia</option>
              <option value="Asociaciones y Cámaras">Asociaciones y Cámaras</option>
              <option value="Medios de Comunicación">Medios de Comunicación</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Color Distintivo</label>
            <div className="flex items-center gap-2 pt-1">
              {['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0F172A'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            <span>Enlace al Grupo de WhatsApp (Opcional)</span>
          </label>
          <input
            type="url"
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción y Objetivos</label>
          <textarea
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Propósito del grupo, responsabilidades y dinámicas de convocatoria..."
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/grupos"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Guardando...' : 'Crear Grupo'}
          </button>
        </div>
      </form>
    </div>
  );
}
