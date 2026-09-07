import { db, offices, gestiones, tareas, agendaEventos, directorioContactos, gruposContactos, grupoMiembros, atencionMensajes } from './index';

const DEFAULT_OFFICE_ID = '00000000-0000-0000-0000-000000000001';

export async function seedDatabaseIfEmpty() {
  try {
    const existingOffices = await db.select().from(offices).limit(1);
    if (existingOffices.length === 0) {
      console.log('🌱 Seeding initial database tables for Dip. Ruben Roque...');
      
      // 1. Office
      await db.insert(offices).values({
        id: DEFAULT_OFFICE_ID as any,
        name: 'Despacho Parlamentario Dip. Ruben Roque',
        titularName: 'Dip. Ruben Roque',
        legislature: 'LXVI Legislatura',
        district: 'Distrito 04 Federal',
        state: 'Tabasco',
        party: 'MORENA',
      });

      // 2. Initial Gestiones
      await db.insert(gestiones).values([
        {
          officeId: DEFAULT_OFFICE_ID as any,
          folio: 'GES-2026-089',
          asunto: 'Petición de Medicamentos Oncológicos y Sesión de Hemodiálisis',
          solicitante: 'Juan Morales Domínguez',
          colonia: 'Col. Tamulté de las Barrancas',
          municipio: 'Centro',
          telefono: '993 456 7890',
          categoria: 'Salud y Apoyo Médico',
          prioridad: 'Alta',
          estatus: 'En Trámite',
          dependenciaCanalizada: 'Hospital Regional de Alta Especialidad Dr. Juan Graham',
        },
        {
          officeId: DEFAULT_OFFICE_ID as any,
          folio: 'GES-2026-090',
          asunto: 'Reparación de Colector Pluvial y Drenaje Sanitario',
          solicitante: 'Sra. Rosa Gómez',
          colonia: 'Col. Atasta de Serra',
          municipio: 'Centro',
          telefono: '993 234 5678',
          categoria: 'Servicios Municipales',
          prioridad: 'Alta',
          estatus: 'Recibido',
          dependenciaCanalizada: 'SAS / Ayuntamiento de Centro',
        },
        {
          officeId: DEFAULT_OFFICE_ID as any,
          folio: 'GES-2026-091',
          asunto: 'Solicitud de Beca para Deportista de Alto Rendimiento (Nacionales CONADE)',
          solicitante: 'Mateo Silván Hernández',
          colonia: 'Gaviotas Sur',
          municipio: 'Centro',
          telefono: '993 789 0123',
          categoria: 'Educación y Deporte',
          prioridad: 'Media',
          estatus: 'Concluido',
          dependenciaCanalizada: 'INJUDET Tabasco',
        }
      ]);

      console.log('✅ Database seeded successfully!');
    }
  } catch (error) {
    console.warn('Database not yet connected or already initialized:', error);
  }
}
