'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  getContactos, 
  createContacto, 
  updateContacto, 
  deleteContacto, 
  addObservacionAction, 
  deleteObservacionAction 
} from '@/app/actions/directorio';
import { getCurrentTimeMexicoCity } from '@/lib/date-utils';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  Mail, 
  MapPin, 
  Cake, 
  FolderKanban, 
  Edit, 
  Trash2, 
  Send, 
  CheckCheck, 
  ExternalLink, 
  X, 
  Check, 
  Sparkles, 
  User, 
  Briefcase, 
  Building, 
  PartyPopper,
  Calendar,
  Share2,
  PhoneCall,
  ChevronLeft
} from 'lucide-react';

export interface ObservacionContacto {
  id: string;
  fecha: string;
  hora: string;
  autor: string;
  texto: string;
  esDiputado?: boolean;
}

export interface ContactoDirectorio {
  id: string;
  nombre: string;
  telefono: string;
  telefonoAlterno?: string;
  cargo: string;
  organizacion: string;
  correos: string[]; // principal y alterno
  domicilio: string;
  colonia: string;
  municipio: string;
  fechaCumpleanos: string; // YYYY-MM-DD
  esCumpleanosHoy?: boolean;
  tipoContacto: 'Ciudadano / Gestión' | 'Funcionario Estatal' | 'Alcalde / Municipal' | 'Legislador / Diputado' | 'Líder Comunitario' | 'Medio de Comunicación' | 'Empresarial';
  folioGestion?: string; // Enlace a gestión si aplica
  avatarUrl: string;
  observaciones: ObservacionContacto[];
}

const TIPOS_CONTACTO_LIST = [
  'Todos',
  'Ciudadano / Gestión',
  'Funcionario Estatal',
  'Alcalde / Municipal',
  'Legislador / Diputado',
  'Líder Comunitario',
  'Medio de Comunicación',
  'Empresarial',
];

const INITIAL_CONTACTOS: ContactoDirectorio[] = [];

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function getContactInitials(nombre?: string | null): string {
  if (!nombre || !nombre.trim()) return 'C';
  const clean = nombre.trim().replace(/^(Dip\.|Lic\.|Dr\.|Dra\.|Ing\.|Mtro\.|Mtra\.|Prof\.|Profa\.|Sra\.|Sr\.|Don|Doña)\s+/i, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function hasCustomPhoto(avatarUrl?: string | null): boolean {
  if (!avatarUrl || !avatarUrl.trim()) return false;
  if (avatarUrl.includes('photo-1534528741775-53994a69daeb')) return false;
  return true;
}

function formatFechaCumpleanos(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return 'No registrada';
  const str = dateStr.trim();

  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  // Case 1: YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${d} de ${meses[m - 1]} de ${y}`;
    }
  }

  // Case 2: M/D/YY or M/D/YYYY or MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) {
    const parts = str.split('/').map(Number);
    let m = parts[0];
    let d = parts[1];
    let y = parts[2];
    if (y < 100) {
      y = y > 30 ? 1900 + y : 2000 + y;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${d} de ${meses[m - 1]} de ${y}`;
    }
  }

  // Case 3: DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const [d, m, y] = str.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${d} de ${meses[m - 1]} de ${y}`;
    }
  }

  return str;
}

export default function DirectorioPage() {
  const [contactos, setContactos] = useState<ContactoDirectorio[]>(INITIAL_CONTACTOS);
  const [loading, setLoading] = useState(true);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const loadContactos = async () => {
    try {
      const res = await getContactos();
      if (res.success && res.data && res.data.length > 0) {
        const mapped: ContactoDirectorio[] = res.data.map((d: any) => {
          let obs: ObservacionContacto[] = [];
          if (d.observaciones) {
            try {
              obs = typeof d.observaciones === 'string' ? JSON.parse(d.observaciones) : d.observaciones;
              if (!Array.isArray(obs)) obs = [];
            } catch {
              obs = [];
            }
          }
          return {
            id: d.id,
            nombre: d.nombre,
            telefono: d.telefono,
            cargo: d.cargo,
            organizacion: d.organizacion,
            correos: d.email ? [d.email] : [],
            domicilio: d.direccion || '',
            colonia: '',
            municipio: 'Centro',
            fechaCumpleanos: d.fechaNacimiento || '',
            tipoContacto: (d.categoria as any) || 'Funcionario Estatal',
            avatarUrl: d.foto || '',
            observaciones: obs,
          };
        });
        setContactos(mapped);
        setContactoSeleccionado((prev) => {
          if (!prev) return mapped[0] || null;
          const found = mapped.find(m => m.id === prev.id);
          return found || mapped[0] || null;
        });
      }
    } catch (err) {
      console.warn('Error loading contactos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactos();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [filtroSoloCumpleanos, setFiltroSoloCumpleanos] = useState(false);
  const [letraSeleccionada, setLetraSeleccionada] = useState<string | null>(null);

  // Selected contact for detail drawer / modal (iPhone style)
  const [contactoSeleccionado, setContactoSeleccionado] = useState<ContactoDirectorio | null>(INITIAL_CONTACTOS[0]);
  
  // Modals
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [contactoEnEdicion, setContactoEnEdicion] = useState<ContactoDirectorio | null>(null);
  const [modalDeleteId, setModalDeleteId] = useState<string | null>(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formTelefonoAlt, setFormTelefonoAlt] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formOrganizacion, setFormOrganizacion] = useState('');
  const [formCorreoPrincipal, setFormCorreoPrincipal] = useState('');
  const [formCorreoAlt, setFormCorreoAlt] = useState('');
  const [formDomicilio, setFormDomicilio] = useState('');
  const [formColonia, setFormColonia] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('Centro (Villahermosa)');
  const [formCumpleanos, setFormCumpleanos] = useState('1985-09-03');
  const [formTipoContacto, setFormTipoContacto] = useState<ContactoDirectorio['tipoContacto']>('Ciudadano / Gestión');
  const [formFolioGestion, setFormFolioGestion] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');

  // WhatsApp-style Notes chat state inside Contact Detail
  const [nuevaObsTexto, setNuevaObsTexto] = useState('');
  const usuarioActivo = {
    nombre: 'Dip. Ruben Roque',
    cargo: 'Diputado Local (Titular)',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (contactoSeleccionado) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [contactoSeleccionado?.observaciones]);

  // Sort contacts alphabetically by full name A-Z
  const contactosOrdenados = [...contactos].sort((a, b) => 
    a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
  );

  // Filter contacts
  const contactosFiltrados = contactosOrdenados.filter((c) => {
    const matchesSearch = 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm) ||
      c.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.correos.some(e => e.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.colonia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.folioGestion && c.folioGestion.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filtroTipo === 'Todos' || c.tipoContacto === filtroTipo;
    const matchesCumpleanos = filtroSoloCumpleanos ? c.esCumpleanosHoy : true;
    const matchesLetra = letraSeleccionada ? c.nombre.toUpperCase().startsWith(letraSeleccionada) : true;

    return matchesSearch && matchesTipo && matchesCumpleanos && matchesLetra;
  });

  // Group contacts by first letter
  const contactosAgrupados: Record<string, ContactoDirectorio[]> = {};
  contactosFiltrados.forEach((c) => {
    const letra = c.nombre.charAt(0).toUpperCase();
    if (!contactosAgrupados[letra]) contactosAgrupados[letra] = [];
    contactosAgrupados[letra].push(c);
  });

  const letrasDisponibles = Object.keys(contactosAgrupados).sort();

  const handleOpenCrearModal = () => {
    setContactoEnEdicion(null);
    setFormNombre('');
    setFormTelefono('');
    setFormTelefonoAlt('');
    setFormCargo('');
    setFormOrganizacion('');
    setFormCorreoPrincipal('');
    setFormCorreoAlt('');
    setFormDomicilio('');
    setFormColonia('');
    setFormMunicipio('Centro (Villahermosa)');
    setFormCumpleanos('1990-09-03');
    setFormTipoContacto('Ciudadano / Gestión');
    setFormFolioGestion('');
    setFormAvatarUrl('');
    setIsModalCrearOpen(true);
  };

  const handleOpenEditarModal = (c: ContactoDirectorio) => {
    setContactoEnEdicion(c);
    setFormNombre(c.nombre);
    setFormTelefono(c.telefono);
    setFormTelefonoAlt(c.telefonoAlterno || '');
    setFormCargo(c.cargo);
    setFormOrganizacion(c.organizacion);
    setFormCorreoPrincipal(c.correos[0] || '');
    setFormCorreoAlt(c.correos[1] || '');
    setFormDomicilio(c.domicilio);
    setFormColonia(c.colonia);
    setFormMunicipio(c.municipio);
    setFormCumpleanos(c.fechaCumpleanos);
    setFormTipoContacto(c.tipoContacto);
    setFormFolioGestion(c.folioGestion || '');
    setFormAvatarUrl(c.avatarUrl);
    setIsModalCrearOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim() || !formTelefono.trim()) {
      alert('Por favor completa los campos obligatorios (Nombre y Teléfono).');
      return;
    }

    const correosArray = [formCorreoPrincipal.trim(), formCorreoAlt.trim()].filter(Boolean);
    const avatar = formAvatarUrl.trim() || '';
    
    // Check if birthday matches today (03 Sep)
    const isBirthdayToday = formCumpleanos.endsWith('09-03');

    if (contactoEnEdicion) {
      const updated: ContactoDirectorio = {
        ...contactoEnEdicion,
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        telefonoAlterno: formTelefonoAlt.trim() || undefined,
        cargo: formCargo.trim() || 'Contacto General',
        organizacion: formOrganizacion.trim() || 'Particular',
        correos: correosArray,
        domicilio: formDomicilio.trim(),
        colonia: formColonia.trim(),
        municipio: formMunicipio.trim(),
        fechaCumpleanos: formCumpleanos,
        esCumpleanosHoy: isBirthdayToday,
        tipoContacto: formTipoContacto,
        folioGestion: formFolioGestion.trim() || undefined,
        avatarUrl: avatar,
      };

      const actualizados = contactos.map((c) => (c.id === contactoEnEdicion.id ? updated : c));
      setContactos(actualizados);
      if (contactoSeleccionado?.id === contactoEnEdicion.id) {
        setContactoSeleccionado(updated);
      }
      setIsModalCrearOpen(false);

      try {
        await updateContacto(contactoEnEdicion.id, {
          nombre: formNombre.trim(),
          cargo: formCargo.trim() || 'Contacto General',
          organizacion: formOrganizacion.trim() || 'Particular',
          categoria: formTipoContacto,
          telefono: formTelefono.trim(),
          email: formCorreoPrincipal.trim() || undefined,
          foto: avatar || null,
          fechaNacimiento: formCumpleanos,
          direccion: `${formDomicilio.trim()}${formColonia.trim() ? ', ' + formColonia.trim() : ''}${formMunicipio.trim() ? ', ' + formMunicipio.trim() : ''}`,
        });
      } catch (err) {
        console.error('Error updating contacto:', err);
      }
    } else {
      const initialObs: ObservacionContacto = {
        id: `obs-${Date.now()}`,
        fecha: 'Hoy',
        hora: getCurrentTimeMexicoCity(),
        autor: usuarioActivo.nombre,
        texto: 'Contacto registrado en el Directorio Oficial.',
        esDiputado: true,
      };

      const tempId = `con-${Date.now()}`;
      const nuevo: ContactoDirectorio = {
        id: tempId,
        nombre: formNombre.trim(),
        telefono: formTelefono.trim(),
        telefonoAlterno: formTelefonoAlt.trim() || undefined,
        cargo: formCargo.trim() || 'Contacto General',
        organizacion: formOrganizacion.trim() || 'Particular',
        correos: correosArray,
        domicilio: formDomicilio.trim(),
        colonia: formColonia.trim(),
        municipio: formMunicipio.trim(),
        fechaCumpleanos: formCumpleanos,
        esCumpleanosHoy: isBirthdayToday,
        tipoContacto: formTipoContacto,
        folioGestion: formFolioGestion.trim() || undefined,
        avatarUrl: avatar,
        observaciones: [initialObs],
      };

      setContactos([nuevo, ...contactos]);
      setContactoSeleccionado(nuevo);
      setMobileShowDetail(true);
      setIsModalCrearOpen(false);

      try {
        const res = await createContacto({
          nombre: formNombre.trim(),
          cargo: formCargo.trim() || 'Contacto General',
          organizacion: formOrganizacion.trim() || 'Particular',
          categoria: formTipoContacto,
          telefono: formTelefono.trim(),
          email: formCorreoPrincipal.trim() || undefined,
          foto: avatar || undefined,
          fechaNacimiento: formCumpleanos,
          direccion: `${formDomicilio.trim()}${formColonia.trim() ? ', ' + formColonia.trim() : ''}${formMunicipio.trim() ? ', ' + formMunicipio.trim() : ''}`,
          observaciones: [initialObs],
        });
        if (res.success && res.data) {
          setContactos(prev => prev.map(c => c.id === tempId ? { ...c, id: res.data.id } : c));
          if (contactoSeleccionado?.id === tempId) {
            setContactoSeleccionado(prev => prev ? { ...prev, id: res.data.id } : null);
          }
        }
      } catch (err) {
        console.error('Error creating contacto in DB:', err);
      }
    }
  };

  const handleEliminarContacto = async (id: string) => {
    const restantes = contactos.filter(c => c.id !== id);
    setContactos(restantes);
    setModalDeleteId(null);
    if (contactoSeleccionado?.id === id) {
      setContactoSeleccionado(restantes[0] || null);
      setMobileShowDetail(false);
    }

    try {
      await deleteContacto(id);
    } catch (err) {
      console.error('Error deleting contacto:', err);
    }
  };

  // Add Observation in WhatsApp Chat Style
  const handleAgregarObservacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObsTexto.trim() || !contactoSeleccionado) return;

    const texto = nuevaObsTexto.trim();
    setNuevaObsTexto('');

    const nuevaObs: ObservacionContacto = {
      id: `obs-${Date.now()}`,
      fecha: 'Hoy',
      hora: getCurrentTimeMexicoCity(),
      autor: usuarioActivo.nombre,
      texto,
      esDiputado: true,
    };

    const updatedContacto: ContactoDirectorio = {
      ...contactoSeleccionado,
      observaciones: [...contactoSeleccionado.observaciones, nuevaObs],
    };

    setContactos(contactos.map(c => c.id === contactoSeleccionado.id ? updatedContacto : c));
    setContactoSeleccionado(updatedContacto);

    try {
      const res = await addObservacionAction(contactoSeleccionado.id, texto, usuarioActivo.nombre, true);
      if (res.success && res.allObservaciones) {
        const synced: ContactoDirectorio = {
          ...contactoSeleccionado,
          observaciones: res.allObservaciones,
        };
        setContactos(prev => prev.map(c => c.id === contactoSeleccionado.id ? synced : c));
        setContactoSeleccionado(synced);
      }
    } catch (err) {
      console.error('Error saving observacion:', err);
    }
  };

  const handleEliminarObservacion = async (obsId: string) => {
    if (!contactoSeleccionado) return;
    const updatedContacto: ContactoDirectorio = {
      ...contactoSeleccionado,
      observaciones: contactoSeleccionado.observaciones.filter(o => o.id !== obsId),
    };
    setContactos(contactos.map(c => c.id === contactoSeleccionado.id ? updatedContacto : c));
    setContactoSeleccionado(updatedContacto);

    try {
      const res = await deleteObservacionAction(contactoSeleccionado.id, obsId);
      if (res.success && res.allObservaciones) {
        const synced: ContactoDirectorio = {
          ...contactoSeleccionado,
          observaciones: res.allObservaciones,
        };
        setContactos(prev => prev.map(c => c.id === contactoSeleccionado.id ? synced : c));
        setContactoSeleccionado(synced);
      }
    } catch (err) {
      console.error('Error deleting observacion:', err);
    }
  };

  const cumpleanerosCount = contactos.filter(c => c.esCumpleanosHoy).length;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2">
        {cumpleanerosCount > 0 && (
          <button
            onClick={() => setFiltroSoloCumpleanos(!filtroSoloCumpleanos)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtroSoloCumpleanos
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
            }`}
          >
            <PartyPopper className="h-3.5 w-3.5 text-amber-500" />
            <span>🎂 {cumpleanerosCount} Cumpleaños Hoy</span>
          </button>
        )}

        <button
          onClick={handleOpenCrearModal}
          className="hidden sm:inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nuevo Contacto</span>
        </button>
      </div>

      {/* Main iPhone Style Master-Detail Layout with Mobile Slide Animation */}
      <div className="-mx-4 sm:mx-0 relative w-auto sm:w-full lg:grid lg:grid-cols-12 lg:gap-5 items-start overflow-hidden min-h-[750px] lg:overflow-visible">
        
        {/* =========================================================================
            LEFT COLUMN (5 COLS): iPHONE CONTACTS ALPHABETICAL LIST
           ========================================================================= */}
        <div className={`w-full lg:col-span-5 bg-white dark:bg-[#121824] rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden flex flex-col h-[750px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          mobileShowDetail
            ? '-translate-x-full absolute inset-0 opacity-0 pointer-events-none lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto'
            : 'translate-x-0 relative opacity-100'
        }`}>
          {/* Top iOS Search Bar & Type Filter */}
          <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 space-y-2.5 bg-gray-50/80 dark:bg-gray-800/40">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar contactos..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200/80 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-800 dark:text-gray-100 shadow-2xs font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {TIPOS_CONTACTO_LIST.map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroTipo(tipo)}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap font-semibold transition-all ${
                    filtroTipo === tipo
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700/70 border border-gray-200/80 dark:border-gray-800/80'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Contact List with A-Z Alphabetical Index Bar */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Scrollable Contacts Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {letrasDisponibles.length > 0 ? (
                letrasDisponibles.map((letra) => (
                  <div key={letra} id={`letra-${letra}`}>
                    {/* iOS Letter Section Header */}
                    <div className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800/90 backdrop-blur-xs px-4 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 border-y border-gray-200/80 dark:border-gray-800/60">
                      {letra}
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {contactosAgrupados[letra].map((contacto) => {
                        const isSelected = contactoSeleccionado?.id === contacto.id;
                        return (
                          <div
                            key={contacto.id}
                            onClick={() => {
                              setContactoSeleccionado(contacto);
                              setMobileShowDetail(true);
                            }}
                            className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/80 border-l-4 border-blue-600 pl-3'
                                : 'hover:bg-gray-50 dark:bg-gray-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-11 w-11 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-200/80 dark:border-gray-800/80 shrink-0 relative flex items-center justify-center">
                                {hasCustomPhoto(contacto.avatarUrl) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={contacto.avatarUrl}
                                    alt={contacto.nombre}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full bg-gradient-to-b from-[#8E8E93] to-[#636366] dark:from-[#636366] dark:to-[#48484A] text-white font-bold text-xs flex items-center justify-center select-none shadow-2xs">
                                    {getContactInitials(contacto.nombre)}
                                  </div>
                                )}
                                {contacto.esCumpleanosHoy && (
                                  <span className="absolute -top-1 -right-1 text-xs">🎂</span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                    {contacto.nombre}
                                  </h3>
                                  {contacto.esCumpleanosHoy && (
                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full shrink-0">
                                      Cumpleaños
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{contacto.cargo}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{contacto.organizacion}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {contacto.folioGestion && (
                                <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                                  {contacto.folioGestion}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-xs italic">
                  No se encontraron contactos con este criterio.
                </div>
              )}
            </div>

            {/* Quick A-Z Alphabetical Sidebar Strip */}
            <div className="w-5 py-2 flex flex-col items-center justify-between text-[9px] font-bold text-blue-600 select-none bg-gray-50/50 dark:bg-gray-800/30 border-l border-gray-100 dark:border-gray-800">
              <button onClick={() => setLetraSeleccionada(null)} className="text-gray-400 dark:text-gray-500 hover:text-blue-600">#</button>
              {ALFABETO.map((l) => (
                <button
                  key={l}
                  onClick={() => setLetraSeleccionada(l === letraSeleccionada ? null : l)}
                  className={`hover:scale-125 transition-transform ${letraSeleccionada === l ? 'text-red-500 font-extrabold' : ''}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Count */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200/80 dark:border-gray-800 text-center text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            {contactosFiltrados.length} Contactos Registrados
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (7 COLS): iPHONE CONTACT CARD DETAIL & CHAT
           ========================================================================= */}
        <div className={`w-full lg:col-span-7 bg-white dark:bg-[#121824] rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 dark:border-gray-800 shadow-xs overflow-hidden flex flex-col h-[750px] transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          mobileShowDetail
            ? 'translate-x-0 relative opacity-100'
            : 'translate-x-full absolute inset-0 opacity-0 pointer-events-none lg:relative lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto'
        }`}>
          {/* iOS Mobile Navigation Bar (< lg) */}
          <div className="lg:hidden flex items-center justify-between px-3.5 py-2.5 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 shrink-0 sticky top-0 z-20">
            <button
              onClick={() => setMobileShowDetail(false)}
              className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:opacity-80 active:scale-95 transition-all cursor-pointer -ml-1 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
              <span>Contactos</span>
            </button>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[160px]">
              {contactoSeleccionado?.nombre || 'Detalle'}
            </span>
            {contactoSeleccionado ? (
              <button
                onClick={() => handleOpenEditarModal(contactoSeleccionado)}
                className="text-blue-600 dark:text-blue-400 font-semibold text-xs hover:opacity-80 active:scale-95 transition-all cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                Editar
              </button>
            ) : <div className="w-10" />}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {contactoSeleccionado ? (
              <div className="space-y-6 animate-in fade-in">
              {/* iPhone Contact Header: Big Avatar & Name */}
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg relative group bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {hasCustomPhoto(contactoSeleccionado.avatarUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contactoSeleccionado.avatarUrl}
                      alt={contactoSeleccionado.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#8E8E93] to-[#636366] dark:from-[#636366] dark:to-[#48484A] text-white font-bold text-2xl flex items-center justify-center select-none">
                      {getContactInitials(contactoSeleccionado.nombre)}
                    </div>
                  )}
                  {contactoSeleccionado.esCumpleanosHoy && (
                    <span className="absolute bottom-0 right-0 text-xl animate-bounce">🎂</span>
                  )}
                </div>

                <div className="space-y-0.5 max-w-md">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                      {contactoSeleccionado.nombre}
                    </h2>
                    {contactoSeleccionado.esCumpleanosHoy && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PartyPopper className="h-3.5 w-3.5" />
                        <span>¡Cumpleaños Hoy!</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-blue-700">{contactoSeleccionado.cargo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{contactoSeleccionado.organizacion}</p>
                </div>

                {/* iPhone Quick Action Buttons (Call, WhatsApp, Email, Wish Birthday) */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* Llamar (tel:) */}
                  <a
                    href={`tel:${contactoSeleccionado.telefono.replace(/\D/g, '')}`}
                    className="flex flex-col items-center justify-center w-16 h-14 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 rounded-2xl text-blue-600 dark:text-blue-400 transition-all shadow-2xs hover:scale-105"
                  >
                    <Phone className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-1">Llamar</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=52${contactoSeleccionado.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Hola ${contactoSeleccionado.nombre}, le escribe el Diputado Ruben Roque.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-16 h-14 bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 rounded-2xl text-[#00a884] dark:text-emerald-400 transition-all shadow-2xs hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-[10px] font-bold mt-1">WhatsApp</span>
                  </a>

                  {/* Correo (mailto:) */}
                  {contactoSeleccionado.correos[0] && (
                    <a
                      href={`mailto:${contactoSeleccionado.correos[0]}`}
                      className="flex flex-col items-center justify-center w-16 h-14 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 rounded-2xl text-indigo-600 dark:text-indigo-400 transition-all shadow-2xs hover:scale-105"
                    >
                      <Mail className="h-5 w-5" />
                      <span className="text-[10px] font-bold mt-1">Correo</span>
                    </a>
                  )}

                  {/* Felicitar si es su cumpleaños */}
                  {contactoSeleccionado.esCumpleanosHoy && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=52${contactoSeleccionado.telefono.replace(/\D/g, '')}&text=${encodeURIComponent(`Estimado(a) ${contactoSeleccionado.nombre}, con motivo de su cumpleaños le envío un afectuoso abrazo y mis mejores deseos de salud, éxito y bienestar. ¡Muchas felicidades! Atte: Dip. Ruben Roque.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center px-4 h-14 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white transition-all shadow-md shadow-amber-500/30 hover:scale-105 font-bold"
                    >
                      <Cake className="h-5 w-5" />
                      <span className="text-[10px] mt-1">Felicitar 🎂</span>
                    </a>
                  )}

                  {/* Enlace a Gestión si aplica */}
                  {contactoSeleccionado.folioGestion && (
                    <Link
                      href="/gestiones"
                      className="flex flex-col items-center justify-center px-4 h-14 bg-purple-50 dark:bg-purple-500/15 hover:bg-purple-100 dark:hover:bg-purple-500/25 rounded-2xl text-purple-700 dark:text-purple-300 transition-all shadow-2xs hover:scale-105 font-bold"
                    >
                      <FolderKanban className="h-5 w-5" />
                      <span className="text-[10px] mt-1">Gestión ({contactoSeleccionado.folioGestion})</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* iOS Style Grouped Information Cards */}
              <div className="space-y-3">
                {/* 1. Teléfonos y Correos */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-800/80 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-gray-800/60">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Contacto Directo</span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {contactoSeleccionado.tipoContacto}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">Teléfono Celular:</span>
                      <a href={`tel:${contactoSeleccionado.telefono.replace(/\D/g, '')}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 text-sm">
                        📞 {contactoSeleccionado.telefono}
                      </a>
                    </div>
                    {contactoSeleccionado.telefonoAlterno && (
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">Teléfono Oficina / Alterno:</span>
                        <a href={`tel:${contactoSeleccionado.telefonoAlterno.replace(/\D/g, '')}`} className="font-bold text-gray-900 dark:text-white hover:text-blue-600 text-sm">
                          📞 {contactoSeleccionado.telefonoAlterno}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200/80 dark:border-gray-800/60 space-y-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">Correos Electrónicos:</span>
                    {contactoSeleccionado.correos.map((correo, idx) => (
                      <a key={idx} href={`mailto:${correo}`} className="block text-blue-600 hover:underline font-mono text-xs">
                        ✉️ {correo}
                      </a>
                    ))}
                  </div>
                </div>

                {/* 2. Domicilio y Cumpleaños */}
                <div className="bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-4 border border-gray-200/80 dark:border-gray-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-gray-800/60">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ubicación y Fecha</span>
                    <div className="flex items-center gap-1 text-amber-700 font-bold">
                      <Cake className="h-3.5 w-3.5" />
                      <span>Cumpleaños: {formatFechaCumpleanos(contactoSeleccionado.fechaCumpleanos)}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-medium">Domicilio Oficial:</span>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      📍 {contactoSeleccionado.domicilio}, {contactoSeleccionado.colonia}, {contactoSeleccionado.municipio}
                    </p>
                  </div>
                </div>

                {/* 3. OBSERVACIONES */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>Observaciones</span>
                          <span className="text-[10px] font-bold text-[#00a884] bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                            {contactoSeleccionado.observaciones.length} notas
                          </span>
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Bitácora interna de seguimiento con este contacto</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Container */}
                  <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-[#efeae2]/60 overflow-hidden shadow-inner flex flex-col">
                    <div className="p-4 space-y-3 max-h-56 overflow-y-auto min-h-[140px]">
                      {contactoSeleccionado.observaciones.length > 0 ? (
                        contactoSeleccionado.observaciones.map((obs) => {
                          const isDip = obs.autor.includes('Dip. Ruben Roque');
                          return (
                            <div
                              key={obs.id}
                              className={`flex flex-col ${isDip ? 'items-end' : 'items-start'} group`}
                            >
                              <div
                                className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl shadow-xs relative space-y-1 ${
                                  isDip
                                    ? 'bg-[#d9fdd3] rounded-tr-xs border border-[#c1f5b8]'
                                    : 'bg-white rounded-tl-xs border border-gray-200/80 dark:border-gray-800/80'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3 text-[11px]">
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                    {obs.autor} {isDip ? '👑' : ''}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarObservacion(obs.id)}
                                    title="Eliminar observación"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>

                                <p className="text-xs text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap font-sans">
                                  {obs.texto}
                                </p>

                                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-mono pt-0.5">
                                  <span>{obs.fecha} • {obs.hora}</span>
                                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-28 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic gap-1">
                          <MessageCircle className="h-5 w-5 text-slate-300" />
                          <span>No hay observaciones registradas con este contacto.</span>
                        </div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input Bar (Automatic active user) */}
                    <form onSubmit={handleAgregarObservacion} className="p-2.5 bg-[#f0f2f5] border-t border-gray-200/80 dark:border-gray-800/80 flex items-center gap-2">
                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-gray-200/80 dark:border-gray-800 shrink-0 shadow-2xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={usuarioActivo.foto}
                          alt={usuarioActivo.nombre}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-100">{usuarioActivo.nombre}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      </div>

                      <div className="flex-1 flex items-center gap-2 w-full">
                        <input
                          type="text"
                          required
                          value={nuevaObsTexto}
                          onChange={(e) => setNuevaObsTexto(e.target.value)}
                          placeholder={`Escribir observación como ${usuarioActivo.nombre}...`}
                          className="flex-1 py-2 px-4 text-xs bg-white border border-gray-300 dark:border-gray-700 rounded-full text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884] shadow-2xs"
                        />
                        <button
                          type="submit"
                          title="Enviar observación"
                          className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                          <Send className="h-4 w-4 ml-0.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleOpenEditarModal(contactoSeleccionado)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Editar Registro</span>
                  </button>

                  <button
                    onClick={() => setModalDeleteId(contactoSeleccionado.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Eliminar Contacto</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs italic gap-2 py-20">
              <Phone className="h-8 w-8 text-slate-300" />
              <span>Selecciona un contacto de la lista para ver su ficha completa.</span>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* MODAL: NUEVO / EDITAR CONTACTO */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-xl w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-blue-600" />
                {contactoEnEdicion ? 'Editar Contacto del Directorio' : 'Nuevo Contacto en Directorio'}
              </h3>
              <button onClick={() => setIsModalCrearOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-300 font-bold">✕</button>
            </div>

            <form onSubmit={handleGuardarContacto} className="space-y-3.5 text-xs">
              {/* Avatar Upload */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-800">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200 dark:bg-gray-700">
                  {formAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formAvatarUrl} alt="Vista previa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-lg">
                      {formNombre ? formNombre[0].toUpperCase() : 'C'}
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-100 block">Fotografía del Contacto</span>
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
                    className="px-3 py-1 bg-white border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 text-[11px] font-semibold hover:bg-gray-50 dark:bg-gray-800/40"
                  >
                    Subir Imagen
                  </button>
                </div>
              </div>

              {/* Nombre Completo & Cargo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Dra. Patricia Oramas Palma"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Ej: Secretaria de Salud"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Organización & Tipo de Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Organización / Dependencia / Colonia</label>
                  <input
                    type="text"
                    value={formOrganizacion}
                    onChange={(e) => setFormOrganizacion(e.target.value)}
                    placeholder="Ej: Secretaría de Salud / Col. Atasta"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Tipo de Contacto</label>
                  <select
                    value={formTipoContacto}
                    onChange={(e) => setFormTipoContacto(e.target.value as any)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 font-semibold"
                  >
                    {TIPOS_CONTACTO_LIST.filter(t => t !== 'Todos').map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Teléfonos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Teléfono / WhatsApp <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="993 123 4567"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Teléfono Alterno / Oficina</label>
                  <input
                    type="text"
                    value={formTelefonoAlt}
                    onChange={(e) => setFormTelefonoAlt(e.target.value)}
                    placeholder="993 987 6543"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Correos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Correo Electrónico Principal</label>
                  <input
                    type="email"
                    value={formCorreoPrincipal}
                    onChange={(e) => setFormCorreoPrincipal(e.target.value)}
                    placeholder="contacto@ejemplo.com"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Correo Alterno</label>
                  <input
                    type="email"
                    value={formCorreoAlt}
                    onChange={(e) => setFormCorreoAlt(e.target.value)}
                    placeholder="contacto2@ejemplo.com"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100 font-mono"
                  />
                </div>
              </div>

              {/* Domicilio, Colonia y Municipio */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Calle y Número</label>
                  <input
                    type="text"
                    value={formDomicilio}
                    onChange={(e) => setFormDomicilio(e.target.value)}
                    placeholder="Av. Paseo Tabasco #1504"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Colonia</label>
                  <input
                    type="text"
                    value={formColonia}
                    onChange={(e) => setFormColonia(e.target.value)}
                    placeholder="Col. Tabasco 2000"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-200 mb-1">Municipio</label>
                  <input
                    type="text"
                    value={formMunicipio}
                    onChange={(e) => setFormMunicipio(e.target.value)}
                    placeholder="Centro (Villahermosa)"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-800 rounded-xl text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* Fecha de Cumpleaños & Enlace a Gestión */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80">
                <div>
                  <label className="block font-semibold text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1">
                    <Cake className="h-3.5 w-3.5 text-amber-600" />
                    <span>Fecha de Cumpleaños</span>
                  </label>
                  <input
                    type="date"
                    value={formCumpleanos}
                    onChange={(e) => setFormCumpleanos(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl text-gray-800 dark:text-gray-100 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5 text-blue-600" />
                    <span>Folio de Gestión Asociada (Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formFolioGestion}
                    onChange={(e) => setFormFolioGestion(e.target.value)}
                    placeholder="Ej: GES-2026-089"
                    className="w-full p-2 bg-white border border-blue-300 rounded-xl text-gray-800 dark:text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
                >
                  {contactoEnEdicion ? 'Guardar Cambios' : 'Registrar Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/80 dark:border-gray-800 max-w-sm w-full p-6 shadow-2xl border border-gray-200/80 dark:border-gray-800 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">¿Eliminar Contacto?</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Esta acción removerá el contacto y su historial del directorio oficial.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setModalDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarContacto(modalDeleteId)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB): Bottom Right corner above bottom menu */}
      <div className="fixed bottom-20 right-4 z-40 sm:hidden">
        <button
          onClick={handleOpenCrearModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs py-3 px-4.5 rounded-full shadow-xl shadow-blue-600/40 border border-blue-500/30 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nuevo Contacto</span>
        </button>
      </div>
    </div>
  );
}