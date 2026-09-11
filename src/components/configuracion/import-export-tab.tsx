'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  getAgendaExportDataAction, 
  getGestionesExportDataAction,
  importAgendaEventsAction, 
  importGestionesAction 
} from '@/app/actions/import-export';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Calendar, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  FileText, 
  Table, 
  HelpCircle,
  Sparkles,
  ArrowUpDown,
  FileCheck,
  X,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ImportExportTabProps {
  officeId?: string;
  officeName?: string;
}

type ModuleType = 'agenda' | 'gestiones';
type ExportFormat = 'excel' | 'csv' | 'json' | 'ics';

interface ColumnMapping {
  fieldKey: string;
  fieldLabel: string;
  required: boolean;
  fileColumn: string;
  description: string;
}

const AGENDA_FIELDS: Omit<ColumnMapping, 'fileColumn'>[] = [
  { fieldKey: 'titulo', fieldLabel: 'Título / Asunto del Evento', required: true, description: 'Nombre de la sesión, reunión o audiencia' },
  { fieldKey: 'fecha', fieldLabel: 'Fecha del Evento', required: true, description: 'Formato YYYY-MM-DD o DD/MM/YYYY' },
  { fieldKey: 'horaInicio', fieldLabel: 'Hora de Inicio', required: false, description: 'Ej: 09:00 o 9:00 AM (por defecto 09:00)' },
  { fieldKey: 'horaFin', fieldLabel: 'Hora de Término', required: false, description: 'Ej: 10:30 o 10:30 AM (por defecto +1 hora)' },
  { fieldKey: 'tipo', fieldLabel: 'Tipo de Evento', required: false, description: 'Comisión, Pleno, Distrito, Solemne, etc.' },
  { fieldKey: 'lugarNombre', fieldLabel: 'Lugar / Sede', required: false, description: 'Nombre del recinto o ubicación' },
  { fieldKey: 'lugarUrl', fieldLabel: 'Enlace de Google Maps', required: false, description: 'URL de ubicación o mapa' },
  { fieldKey: 'notas', fieldLabel: 'Notas / Descripción', required: false, description: 'Detalles u orden del día del evento' },
];

const GESTIONES_FIELDS: Omit<ColumnMapping, 'fileColumn'>[] = [
  { fieldKey: 'asunto', fieldLabel: 'Asunto de la Gestión', required: true, description: 'Descripción o solicitud ciudadana' },
  { fieldKey: 'solicitante', fieldLabel: 'Nombre del Solicitante', required: true, description: 'Ciudadano o representante' },
  { fieldKey: 'colonia', fieldLabel: 'Colonia / Comunidad', required: false, description: 'Lugar de residencia' },
  { fieldKey: 'municipio', fieldLabel: 'Municipio', required: false, description: 'Ej: Centro, Cárdenas, etc.' },
  { fieldKey: 'telefono', fieldLabel: 'Teléfono / WhatsApp', required: false, description: 'Contacto directo a 10 dígitos' },
  { fieldKey: 'email', fieldLabel: 'Correo Electrónico', required: false, description: 'Correo del solicitante' },
  { fieldKey: 'categoria', fieldLabel: 'Categoría', required: false, description: 'Salud, Educación, Pavimentación, etc.' },
  { fieldKey: 'prioridad', fieldLabel: 'Prioridad', required: false, description: 'Alta, Media, Baja' },
  { fieldKey: 'estatus', fieldLabel: 'Estatus', required: false, description: 'Recibido, En Trámite, Concluido, etc.' },
  { fieldKey: 'dependenciaCanalizada', fieldLabel: 'Dependencia Canalizada', required: false, description: 'Secretaría u organismo gestor' },
  { fieldKey: 'notasInternas', fieldLabel: 'Notas Internas', required: false, description: 'Observaciones del equipo de enlace' },
];

export function ImportExportTab({ officeId, officeName }: ImportExportTabProps) {
  const [selectedModule, setSelectedModule] = useState<ModuleType>('agenda');
  
  // Export states
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportTipo, setExportTipo] = useState('Todos');
  const [exportEstatus, setExportEstatus] = useState('Todos');
  const [isExporting, setIsExporting] = useState(false);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [rawFileColumns, setRawFileColumns] = useState<string[]>([]);
  const [rawFileRows, setRawFileRows] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'success'>('upload');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number; skipped: number; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto match file columns with target fields
  const autoMapColumns = (headers: string[], moduleType: ModuleType) => {
    const fields = moduleType === 'agenda' ? AGENDA_FIELDS : GESTIONES_FIELDS;
    const mappings: Record<string, string> = {};

    fields.forEach((field) => {
      const match = headers.find((h) => {
        const cleanHeader = h.toLowerCase().trim();
        const cleanKey = field.fieldKey.toLowerCase();
        const cleanLabel = field.fieldLabel.toLowerCase();

        if (cleanHeader === cleanKey || cleanHeader === cleanLabel) return true;
        if (cleanKey === 'titulo' && (cleanHeader.includes('titul') || cleanHeader.includes('evento') || cleanHeader.includes('asunto') || cleanHeader.includes('nombre'))) return true;
        if (cleanKey === 'fecha' && (cleanHeader.includes('fech') || cleanHeader.includes('dia') || cleanHeader.includes('date'))) return true;
        if (cleanKey === 'horainicio' && (cleanHeader.includes('inicio') || cleanHeader.includes('hora_ini') || cleanHeader === 'hora')) return true;
        if (cleanKey === 'horafin' && (cleanHeader.includes('fin') || cleanHeader.includes('termin') || cleanHeader.includes('hora_fin'))) return true;
        if (cleanKey === 'lugarnombre' && (cleanHeader.includes('lugar') || cleanHeader.includes('sede') || cleanHeader.includes('ubicacion'))) return true;
        if (cleanKey === 'lugarurl' && (cleanHeader.includes('map') || cleanHeader.includes('link') || cleanHeader.includes('url'))) return true;
        if (cleanKey === 'notas' && (cleanHeader.includes('nota') || cleanHeader.includes('descri') || cleanHeader.includes('detalle'))) return true;
        if (cleanKey === 'asunto' && (cleanHeader.includes('asunto') || cleanHeader.includes('peticion') || cleanHeader.includes('solicitud'))) return true;
        if (cleanKey === 'solicitante' && (cleanHeader.includes('solicitante') || cleanHeader.includes('ciudadano') || cleanHeader.includes('nombre'))) return true;
        if (cleanKey === 'colonia' && cleanHeader.includes('colon')) return true;
        if (cleanKey === 'municipio' && cleanHeader.includes('municip')) return true;
        if (cleanKey === 'telefono' && (cleanHeader.includes('tel') || cleanHeader.includes('cel') || cleanHeader.includes('whats'))) return true;
        if (cleanKey === 'email' && (cleanHeader.includes('mail') || cleanHeader.includes('correo'))) return true;
        if (cleanKey === 'categoria' && (cleanHeader.includes('cat') || cleanHeader.includes('rubro'))) return true;
        if (cleanKey === 'prioridad' && cleanHeader.includes('priorid')) return true;
        if (cleanKey === 'estatus' && (cleanHeader.includes('estat') || cleanHeader.includes('estad'))) return true;

        return false;
      });

      mappings[field.fieldKey] = match || '';
    });

    return mappings;
  };

  // Process File Upload
  const handleFileUpload = (file: File) => {
    setIsProcessingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as any[][];
        
        if (jsonData.length < 2) {
          alert('El archivo no contiene suficientes datos o está vacío.');
          setIsProcessingFile(false);
          return;
        }

        const headers = jsonData[0].map((h: any) => String(h || '').trim()).filter((h: string) => h !== '');
        const rows = jsonData.slice(1).filter((r: any[]) => r.some((c: any) => String(c || '').trim() !== ''));

        setRawFileColumns(headers);
        setRawFileRows(rows);
        setImportFile(file);

        const initialMappings = autoMapColumns(headers, selectedModule);
        setColumnMappings(initialMappings);
        setImportStep('mapping');
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('No se pudo leer el archivo. Asegúrate de que sea un archivo Excel (.xlsx, .xls) o CSV válido.');
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Format parsed date into YYYY-MM-DD
  const sanitizeDate = (val: any): string => {
    if (!val) return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const d = ddmmyyyy[1].padStart(2, '0');
      const m = ddmmyyyy[2].padStart(2, '0');
      const y = ddmmyyyy[3];
      return `${y}-${m}-${d}`;
    }

    // Try standard Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return str;
  };

  // Format parsed time into HH:MM
  const sanitizeTime = (val: any): string => {
    if (!val) return '09:00';
    const str = String(val).trim().toUpperCase();
    if (/^\d{2}:\d{2}$/.test(str)) return str;
    if (/^\d{1}:\d{2}$/.test(str)) return `0${str}`;

    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    const clean = str.replace(/[^\d:]/g, '');
    const parts = clean.split(':');
    let hours = parseInt(parts[0] || '9', 10);
    const mins = parseInt(parts[1] || '0', 10);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Convert mapped rows to target structure
  const getMappedPreviewData = () => {
    return rawFileRows.slice(0, 5).map((row) => {
      const rowObj: Record<string, string> = {};
      const fields = selectedModule === 'agenda' ? AGENDA_FIELDS : GESTIONES_FIELDS;

      fields.forEach((f) => {
        const colHeader = columnMappings[f.fieldKey];
        if (colHeader) {
          const colIdx = rawFileColumns.indexOf(colHeader);
          if (colIdx !== -1) {
            let val = row[colIdx];
            if (f.fieldKey === 'fecha') val = sanitizeDate(val);
            if (f.fieldKey === 'horaInicio' || f.fieldKey === 'horaFin') val = sanitizeTime(val);
            rowObj[f.fieldKey] = String(val ?? '');
          } else {
            rowObj[f.fieldKey] = '';
          }
        } else {
          rowObj[f.fieldKey] = '';
        }
      });

      return rowObj;
    });
  };

  // Execute Import
  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const fields = selectedModule === 'agenda' ? AGENDA_FIELDS : GESTIONES_FIELDS;

      const parsedRows = rawFileRows.map((row) => {
        const item: Record<string, string> = {};
        fields.forEach((f) => {
          const colHeader = columnMappings[f.fieldKey];
          if (colHeader) {
            const colIdx = rawFileColumns.indexOf(colHeader);
            if (colIdx !== -1) {
              let val = row[colIdx];
              if (f.fieldKey === 'fecha') val = sanitizeDate(val);
              if (f.fieldKey === 'horaInicio' || f.fieldKey === 'horaFin') val = sanitizeTime(val);
              item[f.fieldKey] = String(val ?? '');
            }
          }
        });
        return item;
      });

      if (selectedModule === 'agenda') {
        const agendaItems = parsedRows.map((r) => ({
          titulo: r.titulo || '',
          fecha: r.fecha || '',
          horaInicio: r.horaInicio || '09:00',
          horaFin: r.horaFin || '10:00',
          tipo: r.tipo || 'Comisión',
          lugarNombre: r.lugarNombre || 'Congreso del Estado',
          lugarUrl: r.lugarUrl || 'https://maps.google.com',
          notas: r.notas || '',
        }));

        const res = await importAgendaEventsAction(agendaItems, officeId);
        if (res.success) {
          setImportResult({
            count: res.insertedCount || 0,
            skipped: res.skippedCount || 0,
            message: res.message || 'Importación completada',
          });
          setImportStep('success');
        } else {
          alert(res.error || 'Error al importar eventos');
        }
      } else {
        const gestionesItems = parsedRows.map((r) => ({
          asunto: r.asunto || '',
          solicitante: r.solicitante || '',
          colonia: r.colonia || 'Centro',
          municipio: r.municipio || 'Centro',
          telefono: r.telefono || '',
          email: r.email || '',
          categoria: r.categoria || 'General',
          prioridad: r.prioridad || 'Media',
          estatus: r.estatus || 'En Trámite',
          dependenciaCanalizada: r.dependenciaCanalizada || '',
          notasInternas: r.notasInternas || '',
        }));

        const res = await importGestionesAction(gestionesItems, officeId);
        if (res.success) {
          setImportResult({
            count: res.insertedCount || 0,
            skipped: res.skippedCount || 0,
            message: res.message || 'Importación completada',
          });
          setImportStep('success');
        } else {
          alert(res.error || 'Error al importar gestiones');
        }
      }
    } catch (err: any) {
      console.error('Error during import execution:', err);
      alert('Ocurrió un error al procesar la importación: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample Template
  const handleDownloadSampleTemplate = () => {
    const isAgenda = selectedModule === 'agenda';
    const sampleData = isAgenda
      ? [
          {
            'Título del Evento': 'Sesión Ordinaria de Pleno',
            'Fecha': '2026-09-15',
            'Hora Inicio': '09:00',
            'Hora Fin': '13:00',
            'Tipo': 'Pleno',
            'Lugar / Sede': 'Recinto Oficial de Sesiones (Congreso del Estado)',
            'Enlace Google Maps': 'https://maps.app.goo.gl/shareTabasco',
            'Notas / Orden del Día': 'Presentación de iniciativa de reforma al Código Civil.',
          },
          {
            'Título del Evento': 'Comisión de Gobernación y Puntos Constitucionales',
            'Fecha': '2026-09-16',
            'Hora Inicio': '11:00',
            'Hora Fin': '12:30',
            'Tipo': 'Comisión',
            'Lugar / Sede': 'Sala de Usos Múltiples',
            'Enlace Google Maps': 'https://maps.app.goo.gl/shareTabasco',
            'Notas / Orden del Día': 'Dictamen de proyectos de ley.',
          },
          {
            'Título del Evento': 'Audiencia con Líderes Comunitarios del Distrito',
            'Fecha': '2026-09-18',
            'Hora Inicio': '16:00',
            'Hora Fin': '18:00',
            'Tipo': 'Distrito',
            'Lugar / Sede': 'Casa de Enlace Legislativo',
            'Enlace Google Maps': 'https://maps.app.goo.gl/shareTabascoDistrito',
            'Notas / Orden del Día': 'Revisión de solicitudes de pavimentación y agua potable.',
          },
        ]
      : [
          {
            'Asunto / Solicitud': 'Apoyo para medicamento especializado oncológico',
            'Nombre del Solicitante': 'María del Carmen Ramos Morales',
            'Colonia': 'Col. Atasta de Serra',
            'Municipio': 'Centro',
            'Teléfono': '9931234567',
            'Correo': 'carmen.ramos@gmail.com',
            'Categoría': 'Gestión Médica',
            'Prioridad': 'Alta',
            'Estatus': 'En Trámite',
            'Dependencia': 'Secretaría de Salud del Estado',
            'Notas': 'Se entregó receta médica original y constancia de no derechohabiencia.',
          },
          {
            'Asunto / Solicitud': 'Rehabilitación de luminarias y alumbrado público',
            'Nombre del Solicitante': 'Lic. Fernando Gutiérrez Peña',
            'Colonia': 'Fracc. Carrizal',
            'Municipio': 'Centro',
            'Teléfono': '9937654321',
            'Correo': 'fgutierrez@comunidad.mx',
            'Categoría': 'Obras Públicas',
            'Prioridad': 'Media',
            'Estatus': 'Recibido',
            'Dependencia': 'Ayuntamiento de Centro (Obras Públicas)',
            'Notas': 'Comité vecinal solicita atención prioritaria en 4 calles principales.',
          },
        ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isAgenda ? 'Plantilla_Agenda' : 'Plantilla_Gestiones');
    XLSX.writeFile(workbook, `Plantilla_Importacion_${isAgenda ? 'Agenda' : 'Gestiones'}_LegisLab.xlsx`);
  };

  // Execute Export
  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      if (selectedModule === 'agenda') {
        const res = await getAgendaExportDataAction({
          startDate: exportStartDate || undefined,
          endDate: exportEndDate || undefined,
          tipo: exportTipo,
          officeId,
        });

        if (!res.success || !res.data || res.data.length === 0) {
          alert('No se encontraron registros de agenda para exportar con los filtros seleccionados.');
          setIsExporting(false);
          return;
        }

        const formatted = res.data.map((item) => ({
          'Título': item.titulo,
          'Tipo de Evento': item.tipo,
          'Fecha': item.fecha,
          'Hora Inicio': item.horaInicio,
          'Hora Fin': item.horaFin,
          'Lugar / Sede': item.lugarNombre,
          'Enlace Maps': item.lugarUrl,
          'Notas / Descripción': item.notas,
        }));

        if (exportFormat === 'excel' || exportFormat === 'csv') {
          const ws = XLSX.utils.json_to_sheet(formatted);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Agenda');
          const ext = exportFormat === 'excel' ? 'xlsx' : 'csv';
          XLSX.writeFile(wb, `Agenda_Legislativa_${officeName ? officeName.replace(/\s+/g, '_') : 'Despacho'}_${new Date().toISOString().split('T')[0]}.${ext}`);
        } else if (exportFormat === 'json') {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Agenda_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
        } else if (exportFormat === 'ics') {
          let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LegisLab//Agenda Parlamentaria//ES\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n';
          res.data.forEach((ev) => {
            const dateClean = ev.fecha.replace(/-/g, '');
            const startH = (ev.horaInicio || '09:00').replace(':', '') + '00';
            const endH = (ev.horaFin || '10:00').replace(':', '') + '00';
            icsContent += 'BEGIN:VEVENT\n';
            icsContent += `SUMMARY:${ev.titulo}\n`;
            icsContent += `DTSTART:${dateClean}T${startH}\n`;
            icsContent += `DTEND:${dateClean}T${endH}\n`;
            icsContent += `LOCATION:${ev.lugarNombre}\n`;
            icsContent += `DESCRIPTION:${ev.notas || ev.tipo}\n`;
            icsContent += 'STATUS:CONFIRMED\n';
            icsContent += 'END:VEVENT\n';
          });
          icsContent += 'END:VCALENDAR';
          const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Agenda_${new Date().toISOString().split('T')[0]}.ics`;
          a.click();
        }
      } else {
        const res = await getGestionesExportDataAction({
          estatus: exportEstatus,
          officeId,
        });

        if (!res.success || !res.data || res.data.length === 0) {
          alert('No se encontraron gestiones para exportar.');
          setIsExporting(false);
          return;
        }

        const formatted = res.data.map((g) => ({
          'Folio': g.folio,
          'Asunto': g.asunto,
          'Solicitante': g.solicitante,
          'Colonia': g.colonia,
          'Municipio': g.municipio,
          'Teléfono': g.telefono,
          'Correo': g.email,
          'Categoría': g.categoria,
          'Prioridad': g.prioridad,
          'Estatus': g.estatus,
          'Dependencia': g.dependenciaCanalizada,
          'Notas': g.notasInternas,
          'Fecha Registro': g.fechaCreacion,
        }));

        if (exportFormat === 'excel' || exportFormat === 'csv') {
          const ws = XLSX.utils.json_to_sheet(formatted);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Gestiones');
          const ext = exportFormat === 'excel' ? 'xlsx' : 'csv';
          XLSX.writeFile(wb, `Gestiones_${officeName ? officeName.replace(/\s+/g, '_') : 'Despacho'}_${new Date().toISOString().split('T')[0]}.${ext}`);
        } else if (exportFormat === 'json') {
          const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Gestiones_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
        }
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Error durante la exportación.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentFields = selectedModule === 'agenda' ? AGENDA_FIELDS : GESTIONES_FIELDS;
  const previewRows = getMappedPreviewData();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Centro de Migración y Datos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Importar y Exportar Datos
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Descarga copias de seguridad de tus eventos y expedientes, o importa masivamente registros desde hojas de cálculo de Excel (.xlsx) y CSV con mapeo visual de columnas.
            </p>
          </div>

          {/* Module Selector */}
          <div className="bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 flex items-center gap-1 shrink-0 self-start md:self-auto">
            <button
              onClick={() => {
                setSelectedModule('agenda');
                setImportStep('upload');
                setImportFile(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
                selectedModule === 'agenda'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>Agenda Parlamentaria</span>
            </button>

            <button
              onClick={() => {
                setSelectedModule('gestiones');
                setImportStep('upload');
                setImportFile(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all",
                selectedModule === 'gestiones'
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Gestiones & Distrito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Export Card & Import Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Export Section (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Exportar {selectedModule === 'agenda' ? 'Agenda' : 'Gestiones'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Genera reportes y copias en formatos estándar
                </p>
              </div>
            </div>

            {/* Format Selection Cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Formato de Descarga
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-semibold",
                    exportFormat === 'excel'
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500"
                      : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div>Excel (.xlsx)</div>
                    <div className="text-[10px] text-gray-500 font-normal">Recomendado</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-semibold",
                    exportFormat === 'csv'
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div>CSV (.csv)</div>
                    <div className="text-[10px] text-gray-500 font-normal">Texto plano</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('json')}
                  className={cn(
                    "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-semibold",
                    exportFormat === 'json'
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500"
                      : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  <Table className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <div>JSON (.json)</div>
                    <div className="text-[10px] text-gray-500 font-normal">Respaldo crudo</div>
                  </div>
                </button>

                {selectedModule === 'agenda' && (
                  <button
                    type="button"
                    onClick={() => setExportFormat('ics')}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all text-xs font-semibold",
                      exportFormat === 'ics'
                        ? "border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 ring-1 ring-purple-500"
                        : "border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <div>
                      <div>iCal (.ics)</div>
                      <div className="text-[10px] text-gray-500 font-normal">Apple / Google</div>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            {selectedModule === 'agenda' ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Fecha Desde</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Fecha Hasta</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Filtrar por Estatus</label>
                  <select
                    value={exportEstatus}
                    onChange={(e) => setExportEstatus(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="Todos">Todos los Estatus</option>
                    <option value="Recibido">Recibido</option>
                    <option value="En Trámite">En Trámite</option>
                    <option value="Concluido">Concluido</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>
            )}

            {/* Export Action Button */}
            <button
              onClick={handleExecuteExport}
              disabled={isExporting}
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generando archivo de exportación...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo ({exportFormat.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Import Wizard (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Importador Masivo de {selectedModule === 'agenda' ? 'Agenda' : 'Gestiones'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sube un archivo Excel o CSV y vincula las columnas
                  </p>
                </div>
              </div>

              {importStep !== 'upload' && importStep !== 'success' && (
                <button
                  onClick={() => {
                    setImportStep('upload');
                    setImportFile(null);
                  }}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 font-semibold"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              )}
            </div>

            {/* STEP 1: Upload File */}
            {importStep === 'upload' && (
              <div className="space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-950/40 space-y-3 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />

                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Haz clic para seleccionar o arrastra tu archivo Excel / CSV aquí
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      Formatos compatibles: Microsoft Excel (.xlsx, .xls) o Valores por Comas (.csv)
                    </p>
                  </div>

                  <span className="inline-block px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 shadow-sm">
                    Explorar archivos del equipo
                  </span>
                </div>

                {/* Sample Template Helper */}
                <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                        ¿No tienes una plantilla con el formato listo?
                      </h4>
                      <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                        Descarga nuestro archivo de ejemplo con los encabezados exactos y filas de muestra.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadSampleTemplate}
                    type="button"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Plantilla</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Column Mapping */}
            {importStep === 'mapping' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>{importFile?.name}</span>
                    <span className="text-gray-400">({rawFileRows.length} filas detectadas)</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Paso 2: Mapeo de Columnas</span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Hemos asociado automáticamente las columnas de tu archivo con los campos de LegisLab. Revisa que correspondan y ajusta si es necesario:
                  </p>

                  <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                    {currentFields.map((field) => {
                      const currentSelected = columnMappings[field.fieldKey] || '';
                      return (
                        <div key={field.fieldKey} className="p-3 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 dark:text-white">{field.fieldLabel}</span>
                              {field.required ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                                  Obligatorio
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Opcional</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{field.description}</p>
                          </div>

                          <div className="w-full sm:w-60 shrink-0">
                            <select
                              value={currentSelected}
                              onChange={(e) => {
                                setColumnMappings({
                                  ...columnMappings,
                                  [field.fieldKey]: e.target.value,
                                });
                              }}
                              className={cn(
                                "w-full bg-gray-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none",
                                field.required && !currentSelected
                                  ? "border-red-400 dark:border-red-600 text-red-600 font-semibold"
                                  : "border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
                              )}
                            >
                              <option value="">-- No mapear / Omitir --</option>
                              {rawFileColumns.map((header) => (
                                <option key={header} value={header}>
                                  Columna: {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep('upload')}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                  >
                    &larr; Cambiar Archivo
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportStep('preview')}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
                  >
                    <span>Previsualizar ({rawFileRows.length} Filas)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview */}
            {importStep === 'preview' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>Vista previa de los primeros registros a insertar</span>
                  </div>
                  <span className="font-bold">Total: {rawFileRows.length} registros</span>
                </div>

                {/* Table Preview */}
                <div className="border border-gray-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-slate-700">
                        {currentFields.slice(0, 5).map((f) => (
                          <th key={f.fieldKey} className="px-3 py-2.5 font-bold">
                            {f.fieldLabel}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                          {currentFields.slice(0, 5).map((f) => (
                            <td key={f.fieldKey} className="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap max-w-xs truncate">
                              {row[f.fieldKey] || <span className="text-gray-300 dark:text-slate-600 italic">vacío</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep('mapping')}
                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                  >
                    &larr; Modificar Mapeo
                  </button>

                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleExecuteImport}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Importando en base de datos...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar e Importar {rawFileRows.length} Registros</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Success */}
            {importStep === 'success' && importResult && (
              <div className="p-8 text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    ¡Importación Completada con Éxito!
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                    {importResult.message}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Link
                    href={selectedModule === 'agenda' ? '/agenda' : '/gestiones'}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/20"
                  >
                    <span>Ir a {selectedModule === 'agenda' ? 'la Agenda' : 'las Gestiones'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      setImportStep('upload');
                      setImportFile(null);
                      setImportResult(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                  >
                    Importar Otro Archivo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
