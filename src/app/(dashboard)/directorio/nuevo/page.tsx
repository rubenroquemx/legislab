'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Contact, ChevronLeft, Phone, Mail, MapPin, Cake, Building, Upload } from 'lucide-react';
import { createContacto } from '@/app/actions/directorio';

const TIPOS_CONTACTO_LIST = [
  'Ciudadano / Gestión',
  'Funcionario Estatal',
  'Alcalde / Municipal',
  'Legislador / Diputado',
  'Líder Comunitario',
  'Medio de Comunicación',
  'Empresarial',
];

export default function NuevoContactoDirectorioPage() {
  const router = useRouter();

  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formTelefonoAlterno, setFormTelefonoAlterno] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formOrganizacion, setFormOrganizacion] = useState('');
  const [formCorreoPrincipal, setFormCorreoPrincipal] = useState('');
  const [formCorreoAlterno, setFormCorreoAlterno] = useState('');
  const [formDomicilio, setFormDomicilio] = useState('');
  const [formColonia, setFormColonia] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('Centro');
  const [formFechaCumpleanos, setFormFechaCumpleanos] = useState('');
  const [formTipoContacto, setFormTipoContacto] = useState<any>('Ciudadano / Gestión');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formTelefono.trim()) return;
    setIsSubmitting(true);

    try {
      const fullAddress = [formDomicilio.trim(), formColonia.trim(), formMunicipio.trim()].filter(Boolean).join(', ');

      const res = await createContacto({
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        cargo: formCargo.trim() || 'Ciudadano',
        organizacion: formOrganizacion.trim() || 'Sociedad Civil',
        categoria: formTipoContacto,
        email: formCorreoPrincipal.trim() || undefined,
        foto: formAvatarUrl || undefined,
        fechaNacimiento: formFechaCumpleanos || undefined,
        direccion: fullAddress || undefined,
      });

      if (res.success) {
        router.push('/directorio');
      } else {
        alert(res.error || 'No se pudo guardar el contacto');
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
          href="/directorio"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver al Directorio</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Contact className="h-5 w-5 text-blue-600" />
            <span>Nuevo Contacto Institucional</span>
          </h1>
          <p className="text-xs text-slate-500">
            Registra una persona clave, enlace gubernamental, líder o ciudadano en la agenda.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-slate-200 flex items-center justify-center">
            {formAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={formAvatarUrl} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-slate-500">{formNombre ? formNombre[0].toUpperCase() : 'C'}</span>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-900 block">Fotografía del Contacto</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-blue-600" />
              <span>Subir Foto</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={formNombre}
            onChange={(e) => setFormNombre(e.target.value)}
            placeholder="Ej: Lic. Carlos Alberto Merino Campos"
            className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Contacto</label>
            <select
              value={formTipoContacto}
              onChange={(e) => setFormTipoContacto(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
            >
              {TIPOS_CONTACTO_LIST.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Cake className="h-3.5 w-3.5 text-amber-500" />
              <span>Fecha de Cumpleaños</span>
            </label>
            <input
              type="date"
              value={formFechaCumpleanos}
              onChange={(e) => setFormFechaCumpleanos(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium text-xs focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Puesto</label>
            <input
              type="text"
              value={formCargo}
              onChange={(e) => setFormCargo(e.target.value)}
              placeholder="Ej: Director General, Coordinador..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-blue-600" />
              <span>Organización / Dependencia</span>
            </label>
            <input
              type="text"
              value={formOrganizacion}
              onChange={(e) => setFormOrganizacion(e.target.value)}
              placeholder="Ej: Secretaría de Gobierno, Ayuntamiento..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Teléfono Principal (WhatsApp) <span className="text-red-500">*</span></span>
            </label>
            <input
              required
              type="text"
              value={formTelefono}
              onChange={(e) => setFormTelefono(e.target.value)}
              placeholder="Ej: 993 123 4567"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>Teléfono Alterno / Oficina</span>
            </label>
            <input
              type="text"
              value={formTelefonoAlterno}
              onChange={(e) => setFormTelefonoAlterno(e.target.value)}
              placeholder="Ej: 993 765 4321 ext 102"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-blue-600" />
              <span>Correo Electrónico Principal</span>
            </label>
            <input
              type="email"
              value={formCorreoPrincipal}
              onChange={(e) => setFormCorreoPrincipal(e.target.value)}
              placeholder="contacto@tabasco.gob.mx"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>Correo Alterno</span>
            </label>
            <input
              type="email"
              value={formCorreoAlterno}
              onChange={(e) => setFormCorreoAlterno(e.target.value)}
              placeholder="personal@gmail.com"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-blue-600" />
              <span>Calle y Número</span>
            </label>
            <input
              type="text"
              value={formDomicilio}
              onChange={(e) => setFormDomicilio(e.target.value)}
              placeholder="Ej: Av. Paseo Tabasco #1504"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Colonia</label>
            <input
              type="text"
              value={formColonia}
              onChange={(e) => setFormColonia(e.target.value)}
              placeholder="Ej: Col. Tabasco 2000"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Municipio</label>
            <input
              type="text"
              value={formMunicipio}
              onChange={(e) => setFormMunicipio(e.target.value)}
              placeholder="Ej: Centro"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/directorio"
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl text-center"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all active:scale-95"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Contacto'}
          </button>
        </div>
      </form>
    </div>
  );
}
