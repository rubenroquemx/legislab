import postgres from 'postgres';

let migrationExecuted = false;

export async function ensureDatabaseTables(connectionString: string) {
  if (migrationExecuted) return;
  
  try {
    const sql = postgres(connectionString, { max: 1, connect_timeout: 5 });
    
    // Enable uuid extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // 1. Offices
    await sql`
      CREATE TABLE IF NOT EXISTS offices (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        titular_name TEXT NOT NULL,
        legislature TEXT NOT NULL DEFAULT 'LXVI Legislatura',
        district TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'Tabasco',
        party TEXT,
        logo_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Default office
    await sql`
      INSERT INTO offices (id, name, titular_name, legislature, district, state, party)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Despacho Parlamentario Dip. Ruben Roque',
        'Dip. Ruben Roque',
        'LXVI Legislatura',
        'Distrito 04 Federal',
        'Tabasco',
        'MORENA'
      ) ON CONFLICT (id) DO NOTHING
    `;

    // 2. Users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        email_verified TIMESTAMP WITH TIME ZONE,
        image TEXT,
        cargo TEXT DEFAULT 'Asesor Legislativo',
        office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'asesor_a',
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 3. NextAuth Accounts & Sessions
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, provider_account_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        session_token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    // 4. Gestiones
    await sql`
      CREATE TABLE IF NOT EXISTS gestiones (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        folio TEXT NOT NULL,
        asunto TEXT NOT NULL,
        solicitante TEXT NOT NULL,
        colonia TEXT NOT NULL,
        municipio TEXT DEFAULT 'Centro',
        telefono TEXT,
        email TEXT,
        categoria TEXT DEFAULT 'General',
        prioridad TEXT NOT NULL DEFAULT 'Media',
        estatus TEXT NOT NULL DEFAULT 'En Trámite',
        dependencia_canalizada TEXT,
        notas_internas TEXT,
        responsable_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 5. Tareas
    await sql`
      CREATE TABLE IF NOT EXISTS tareas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        usuario_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        usuario_nombre TEXT NOT NULL,
        usuario_cargo TEXT,
        usuario_foto TEXT,
        usuario_whatsapp TEXT,
        prioridad TEXT NOT NULL DEFAULT 'Media',
        estatus TEXT NOT NULL DEFAULT 'Pendiente',
        fecha_limite TEXT NOT NULL,
        hora_limite TEXT NOT NULL,
        modulo_relacionado TEXT DEFAULT 'Gestiones',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 6. Agenda
    await sql`
      CREATE TABLE IF NOT EXISTS agenda_eventos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'Comisión',
        fecha TEXT NOT NULL,
        hora_inicio TEXT NOT NULL,
        hora_fin TEXT NOT NULL,
        lugar_nombre TEXT NOT NULL,
        lugar_url TEXT,
        color TEXT DEFAULT '#0284c7',
        notas TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 7. Directorio
    await sql`
      CREATE TABLE IF NOT EXISTS directorio_contactos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        cargo TEXT NOT NULL,
        organizacion TEXT NOT NULL,
        categoria TEXT DEFAULT 'Gabinete Estatal',
        telefono TEXT NOT NULL,
        email TEXT,
        foto TEXT,
        fecha_nacimiento TEXT,
        direccion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 8. Grupos
    await sql`
      CREATE TABLE IF NOT EXISTS grupos_contactos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        categoria TEXT NOT NULL,
        color TEXT DEFAULT 'blue',
        whatsapp_link TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS grupo_miembros (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        grupo_id UUID NOT NULL REFERENCES grupos_contactos(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        cargo TEXT NOT NULL,
        telefono TEXT NOT NULL,
        municipio TEXT DEFAULT 'Centro',
        foto TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 9. Atencion
    await sql`
      CREATE TABLE IF NOT EXISTS atencion_mensajes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        ciudadano_nombre TEXT NOT NULL,
        ciudadano_telefono TEXT NOT NULL,
        ciudadano_foto TEXT,
        ultimo_mensaje TEXT NOT NULL,
        hora_ultimo_mensaje TEXT NOT NULL,
        colonia TEXT DEFAULT 'Tamulté',
        estatus TEXT NOT NULL DEFAULT 'Pendiente',
        sin_leer BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 10. Iniciativas
    await sql`
      CREATE TABLE IF NOT EXISTS iniciativas (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        titulo TEXT NOT NULL,
        tipo_documento TEXT NOT NULL,
        ambito TEXT NOT NULL DEFAULT 'Federal (Cámara de Diputados)',
        comision TEXT,
        estado TEXT NOT NULL DEFAULT 'Borrador',
        exposicion_motivos TEXT,
        decreto_texto TEXT,
        transitorios_texto TEXT,
        documento_completo TEXT,
        autor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 11. IA Generations
    await sql`
      CREATE TABLE IF NOT EXISTS ia_generations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        prompt TEXT NOT NULL,
        tipo_documento TEXT NOT NULL,
        ambito TEXT NOT NULL,
        generated_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql.end();
    migrationExecuted = true;
    console.log('✅ PostgreSQL tables verified and auto-initialized successfully!');
  } catch (err) {
    console.warn('Database auto-migration skipped or waiting for connection:', err);
  }
}
