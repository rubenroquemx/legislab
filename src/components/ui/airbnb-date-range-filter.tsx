'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, X, ChevronDown, Check, Sparkles } from 'lucide-react';
import { getTodayMexicoCity, MEXICO_TIMEZONE } from '@/lib/date-utils';

interface AirbnbDateRangeFilterProps {
  label: string;
  icon?: React.ReactNode;
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  onChange: (startDate: string, endDate: string) => void;
  accentColor?: 'blue' | 'emerald';
}

export function AirbnbDateRangeFilter({
  label,
  icon,
  startDate,
  endDate,
  onChange,
  accentColor = 'blue',
}: AirbnbDateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar estado local cuando cambian las props
  useEffect(() => {
    setTempStart(startDate);
    setTempEnd(endDate);
  }, [startDate, endDate]);

  // Click outside para cerrar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasFilter = Boolean(startDate || endDate);

  // Formato amigable de fechas para la etiqueta
  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [y, m, d] = dStr.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
      return date.toLocaleDateString('es-MX', { timeZone: MEXICO_TIMEZONE, day: 'numeric', month: 'short' });
    } catch {
      return dStr;
    }
  };

  const getPillLabel = () => {
    if (startDate && endDate) {
      if (startDate === endDate) {
        return `${formatDisplayDate(startDate)}`;
      }
      return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
    }
    if (startDate) return `Desde ${formatDisplayDate(startDate)}`;
    if (endDate) return `Hasta ${formatDisplayDate(endDate)}`;
    return 'Cualquier fecha';
  };

  const handleApply = () => {
    onChange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    setIsOpen(false);
  };

  // Presets estilo Airbnb
  const applyPreset = (preset: 'hoy' | '7dias' | '30dias' | 'esteMes' | 'mesPasado' | 'anoActual') => {
    const today = new Date();
    const todayStr = getTodayMexicoCity();

    if (preset === 'hoy') {
      setTempStart(todayStr);
      setTempEnd(todayStr);
    } else if (preset === '7dias') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      const startStr = d.toISOString().split('T')[0];
      setTempStart(startStr);
      setTempEnd(todayStr);
    } else if (preset === '30dias') {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      const startStr = d.toISOString().split('T')[0];
      setTempStart(startStr);
      setTempEnd(todayStr);
    } else if (preset === 'esteMes') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      setTempStart(`${y}-${m}-01`);
      setTempEnd(todayStr);
    } else if (preset === 'mesPasado') {
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      const y = prev.getFullYear();
      const m = String(prev.getMonth() + 1).padStart(2, '0');
      const d = String(lastDay.getDate()).padStart(2, '0');
      setTempStart(`${y}-${m}-01`);
      setTempEnd(`${y}-${m}-${d}`);
    } else if (preset === 'anoActual') {
      const y = today.getFullYear();
      setTempStart(`${y}-01-01`);
      setTempEnd(todayStr);
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Botón Gatillador Estilo Cápsula Airbnb */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
          hasFilter
            ? accentColor === 'emerald'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
            : 'bg-white dark:bg-[#121824] text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      >
        <span className="text-gray-400 dark:text-gray-500 shrink-0">
          {icon || <Calendar className="h-3.5 w-3.5" />}
        </span>
        
        <span className="text-gray-500 dark:text-gray-400 font-medium">
          {label}:
        </span>

        <span className={`font-bold ${hasFilter ? (accentColor === 'emerald' ? 'text-emerald-900 dark:text-emerald-200' : 'text-blue-900 dark:text-blue-200') : 'text-gray-800 dark:text-gray-200'}`}>
          {getPillLabel()}
        </span>

        {hasFilter ? (
          <span
            onClick={handleClear}
            title="Borrar fechas"
            className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors ml-0.5"
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Popover Desplegable Airbnb */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-[340px] sm:w-[380px] bg-white dark:bg-[#121824] rounded-2xl border border-gray-200/90 dark:border-gray-800 shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 origin-top-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                {icon || <Calendar className="h-4 w-4 text-blue-600" />}
                <span>Rango: {label}</span>
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Selecciona fechas de inicio y término (Airbnb Style)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cajas de Fecha Dual (Desde - Hasta) */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-800">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Desde
              </label>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Hasta
              </label>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full p-2 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Accesos Rápidos de Airbnb */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
              Accesos Rápidos
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('hoy')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => applyPreset('7dias')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset('30dias')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Últimos 30 días
              </button>
              <button
                type="button"
                onClick={() => applyPreset('esteMes')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Este Mes
              </button>
              <button
                type="button"
                onClick={() => applyPreset('mesPasado')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Mes Pasado
              </button>
              <button
                type="button"
                onClick={() => applyPreset('anoActual')}
                className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Todo el 2026
              </button>
            </div>
          </div>

          {/* Footer con Acciones */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold underline underline-offset-2"
            >
              Borrar fechas
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className={`px-4 py-1.5 font-bold text-white rounded-xl shadow-xs transition-all ${
                  accentColor === 'emerald'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Aplicar Rango
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
