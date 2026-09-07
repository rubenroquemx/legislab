import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';
import type { AdapterAccount } from 'next-auth/adapters';

// -------------------------------------------------------------
// ENUMS
// -------------------------------------------------------------
export const userRoleEnum = pgEnum('user_role', [
  'diputado',
  'asesor_a',
  'asesor_b',
  'secretario_tecnico',
  'coordinador_territorial',
  'admin',
]);

export const gestionEstatusEnum = pgEnum('gestion_estatus', [
  'Recibido',
  'En Trámite',
  'Oficio Enviado',
  'Audiencia Programada',
  'Aprobado',
  'Rechazado',
  'Concluido',
  'Urgente',
]);

// -------------------------------------------------------------
// TENANT: DESPACHOS / OFFICES
// -------------------------------------------------------------
export const offices = pgTable('offices', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // Ej: "Despacho Dip. Ruben Roque"
  titularName: text('titular_name').notNull(), // Ej: "Ruben Roque"
  legislature: text('legislature').notNull().default('LXVI Legislatura'),
  district: text('district').notNull(), // Ej: "Distrito 04 Federal"
  state: text('state').notNull().default('Tabasco'),
  party: text('party'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// USERS & NEXTAUTH TABLES (Multi-tenant via officeId)
// -------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  cargo: text('cargo').default('Asesor Legislativo'),
  officeId: uuid('office_id').references(() => offices.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('asesor_a'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccount['type']>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// -------------------------------------------------------------
// GESTIONES CIUDADANAS
// -------------------------------------------------------------
export const gestiones = pgTable('gestiones', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  folio: text('folio').notNull(), // Ej: "GES-2026-0142"
  asunto: text('asunto').notNull(),
  solicitante: text('solicitante').notNull(),
  colonia: text('colonia').notNull(),
  municipio: text('municipio').default('Centro'),
  telefono: text('telefono'),
  email: text('email'),
  categoria: text('categoria').default('General'),
  prioridad: text('prioridad').default('Media').notNull(),
  estatus: text('estatus').default('En Trámite').notNull(),
  dependenciaCanalizada: text('dependencia_canalizada'),
  notasInternas: text('notas_internas'),
  responsableId: text('responsable_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// TAREAS DEL EQUIPO & PERSONALES
// -------------------------------------------------------------
export const tareas = pgTable('tareas', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  descripcion: text('descripcion'),
  usuarioId: text('usuario_id').references(() => users.id, { onDelete: 'set null' }),
  usuarioNombre: text('usuario_nombre').notNull(),
  usuarioCargo: text('usuario_cargo'),
  usuarioFoto: text('usuario_foto'),
  usuarioWhatsapp: text('usuario_whatsapp'),
  prioridad: text('prioridad').default('Media').notNull(), // 'Alta' | 'Media' | 'Baja'
  estatus: text('estatus').default('Pendiente').notNull(), // 'Pendiente' | 'En Proceso' | 'Completada'
  fechaLimite: text('fecha_limite').notNull(), // YYYY-MM-DD
  horaLimite: text('hora_limite').notNull(), // HH:MM
  moduloRelacionado: text('modulo_relacionado').default('Gestiones'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// AGENDA PARLAMENTARIA Y EVENTOS
// -------------------------------------------------------------
export const agendaEventos = pgTable('agenda_eventos', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  tipo: text('tipo').default('Comisión').notNull(),
  fecha: text('fecha').notNull(), // YYYY-MM-DD
  horaInicio: text('hora_inicio').notNull(), // HH:MM
  horaFin: text('hora_fin').notNull(), // HH:MM
  lugarNombre: text('lugar_nombre').notNull(),
  lugarUrl: text('lugar_url'),
  color: text('color').default('#0284c7'),
  notas: text('notas'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// DIRECTORIO INSTITUCIONAL & CUMPLEAÑOS
// -------------------------------------------------------------
export const directorioContactos = pgTable('directorio_contactos', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  cargo: text('cargo').notNull(),
  organizacion: text('organizacion').notNull(),
  categoria: text('categoria').default('Gabinete Estatal'),
  telefono: text('telefono').notNull(),
  email: text('email'),
  foto: text('foto'),
  fechaNacimiento: text('fecha_nacimiento'), // '03 de Septiembre' o MM-DD
  direccion: text('direccion'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// GRUPOS Y REDES DE CONTACTOS
// -------------------------------------------------------------
export const gruposContactos = pgTable('grupos_contactos', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  categoria: text('categoria').notNull(), // 'Líderes Seccionales' | 'Comunitario' | 'Medios'
  color: text('color').default('blue'),
  whatsappLink: text('whatsapp_link'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const grupoMiembros = pgTable('grupo_miembros', {
  id: uuid('id').defaultRandom().primaryKey(),
  grupoId: uuid('grupo_id')
    .notNull()
    .references(() => gruposContactos.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  cargo: text('cargo').notNull(),
  telefono: text('telefono').notNull(),
  municipio: text('municipio').default('Centro'),
  foto: text('foto'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// ATENCIÓN CIUDADANA / WHATSAPP BANDEJA
// -------------------------------------------------------------
export const atencionMensajes = pgTable('atencion_mensajes', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  ciudadanoNombre: text('ciudadano_nombre').notNull(),
  ciudadanoTelefono: text('ciudadano_telefono').notNull(),
  ciudadanoFoto: text('ciudadano_foto'),
  ultimoMensaje: text('ultimo_mensaje').notNull(),
  horaUltimoMensaje: text('hora_ultimo_mensaje').notNull(),
  colonia: text('colonia').default('Tamulté'),
  estatus: text('estatus').default('Pendiente').notNull(), // 'Pendiente' | 'Canalizado' | 'Resuelto'
  sinLeer: boolean('sin_leer').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// INICIATIVAS DE LEY & PUNTOS DE ACUERDO
// -------------------------------------------------------------
export const iniciativas = pgTable('iniciativas', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  titulo: text('titulo').notNull(),
  tipoDocumento: text('tipo_documento').notNull(),
  ambito: text('ambito').notNull().default('Federal (Cámara de Diputados)'),
  comision: text('comision'),
  estado: text('estado').default('Borrador').notNull(),
  exposicionMotivos: text('exposicion_motivos'),
  decretoTexto: text('decreto_texto'),
  transitoriosTexto: text('transitorios_texto'),
  documentoCompleto: text('documento_completo'),
  autorId: text('autor_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// -------------------------------------------------------------
// HISTORIAL DE GENERACIONES IA
// -------------------------------------------------------------
export const iaGenerations = pgTable('ia_generations', {
  id: uuid('id').defaultRandom().primaryKey(),
  officeId: uuid('office_id')
    .notNull()
    .references(() => offices.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  prompt: text('prompt').notNull(),
  tipoDocumento: text('tipo_documento').notNull(),
  ambito: text('ambito').notNull(),
  generatedText: text('generated_text').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Tipos Inferidos
export type Office = typeof offices.$inferSelect;
export type NewOffice = typeof offices.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Gestion = typeof gestiones.$inferSelect;
export type NewGestion = typeof gestiones.$inferInsert;
export type Tarea = typeof tareas.$inferSelect;
export type NewTarea = typeof tareas.$inferInsert;
export type AgendaEvento = typeof agendaEventos.$inferSelect;
export type NewAgendaEvento = typeof agendaEventos.$inferInsert;
export type DirectorioContacto = typeof directorioContactos.$inferSelect;
export type NewDirectorioContacto = typeof directorioContactos.$inferInsert;
export type GrupoContacto = typeof gruposContactos.$inferSelect;
export type NewGrupoContacto = typeof gruposContactos.$inferInsert;
export type GrupoMiembro = typeof grupoMiembros.$inferSelect;
export type NewGrupoMiembro = typeof grupoMiembros.$inferInsert;
export type AtencionMensaje = typeof atencionMensajes.$inferSelect;
export type NewAtencionMensaje = typeof atencionMensajes.$inferInsert;
export type Iniciativa = typeof iniciativas.$inferSelect;
export type NewIniciativa = typeof iniciativas.$inferInsert;
export type IaGeneration = typeof iaGenerations.$inferSelect;
export type NewIaGeneration = typeof iaGenerations.$inferInsert;
