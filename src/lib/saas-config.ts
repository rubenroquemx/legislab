export interface SaasModule {
  id: string;
  name: string;
  category: string;
}

export const ALL_AVAILABLE_MODULES: SaasModule[] = [
  { id: 'atencion_ciudadana', name: 'Atención Ciudadana (WhatsApp Inbox)', category: 'Comunicación' },
  { id: 'grupos', name: 'Grupos de WhatsApp', category: 'Comunicación' },
  { id: 'gestiones', name: 'Gestiones y Folios (Ilimitado)', category: 'Atención Social' },
  { id: 'territorio', name: 'Territorio y Seccionales', category: 'Territorio' },
  { id: 'redactor_ia', name: 'Redactor IA (Iniciativas, Discursos, Boletines)', category: 'Inteligencia Artificial' },
  { id: 'agenda', name: 'Agenda Legislativa', category: 'Organización' },
  { id: 'directorio', name: 'Directorio y Cumpleaños', category: 'Organización' },
  { id: 'tareas', name: 'Tareas y Kanban de Equipo', category: 'Organización' },
  { id: 'marco_juridico', name: 'Marco Jurídico y Leyes', category: 'Legislativo' },
  { id: 'medios', name: 'Monitoreo de Medios y Prensa', category: 'Comunicación' },
];

export interface PlanConfig {
  name: string;
  price: number;
  maxUsers: number;
  description: string;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  starter: {
    name: 'Starter (Inicial)',
    price: 1999,
    maxUsers: 2, // 1 principal + 1 extra
    description: '1 Titular + 1 Usuario adicional (2 en total) • Gestiones Ilimitadas',
  },
  professional: {
    name: 'Professional',
    price: 4999,
    maxUsers: 5, // 1 principal + 4 extras
    description: '1 Titular + 4 Usuarios adicionales (5 en total) • Gestiones Ilimitadas',
  },
  parliamentary: {
    name: 'Parlamentario',
    price: 12999,
    maxUsers: 8, // 1 principal + 7 extras
    description: '1 Titular + 7 Usuarios adicionales (8 en total) • Gestiones Ilimitadas',
  },
  enterprise: {
    name: 'Enterprise',
    price: 24999,
    maxUsers: 50,
    description: 'Ilimitado • Soporte 24/7 y servidores dedicados',
  },
};
