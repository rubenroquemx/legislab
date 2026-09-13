'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, ChevronLeft, Mail, Shield, User } from 'lucide-react';
import { inviteOfficeUserAction } from '@/app/actions/usuarios';

export default function NuevoUsuarioPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('Asesor Parlamentario');
  const [rol, setRol] = useState<'admin' | 'colaborador' | 'observador'>('colaborador');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await inviteOfficeUserAction({
        name: nombre.trim(),
        email: email.trim(),
        phone: telefono.trim() || undefined,
        cargo: cargo.trim(),
        role: rol === 'admin' ? 'admin' : 'asesor_a',
      });

      if (res.success) {
        router.push('/usuarios');
      } else {
        alert(res.error || 'No se pudo registrar el usuario');
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
          href="/usuarios"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver al Equipo</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Invitar Integrante al Despacho</span>
          </h1>
          <p className="text-xs text-slate-500">Asigna permisos y rol de acceso para colaboradores y asesores.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Lic. Mariana Soto Gómez"
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Mail className="h-4 w-4 text-blue-600" />
            <span>Correo Electrónico Oficial <span className="text-red-500">*</span></span>
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colaborador@legislab.com"
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo Oficial</label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ej: Asesora Jurídica, Secretario Técnico..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 993 456 7890"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>Nivel de Acceso y Permisos</span>
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as any)}
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
          >
            <option value="colaborador">Colaborador (Captura, expediente y gestión)</option>
            <option value="admin">Administrador (Control total del despacho y usuarios)</option>
            <option value="observador">Observador (Solo lectura de indicadores y agenda)</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/usuarios"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Registrando...' : 'Enviar Invitación'}
          </button>
        </div>
      </form>
    </div>
  );
}
