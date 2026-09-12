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

    // Ensure all schema columns exist in offices
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS slug TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS titular_email TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS titular_phone TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter'`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS whatsapp_instance_name TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 3`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS promo_notes TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS enabled_modules TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS stripe_price_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS billing_email TEXT`;

    // Google Drive & Calendar columns
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_connected BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_email TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_access_token TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_refresh_token TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_token_expiry TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_folder_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_folder_url TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_client_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_drive_client_secret TEXT`;

    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_email TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_id TEXT`;
    await sql`ALTER TABLE offices ADD COLUMN IF NOT EXISTS google_calendar_last_sync TIMESTAMP WITH TIME ZONE`;

    // Default office
    await sql`
      INSERT INTO offices (id, name, titular_name, titular_email, legislature, district, state, party)
      VALUES (
        '00000000-0000-0000-0000-000000000001',
        'Despacho Parlamentario Dip. Ruben Roque',
        'Dip. Ruben Roque',
        'contacto@rubenroque.mx',
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
        "emailVerified" TIMESTAMP WITH TIME ZONE,
        password_hash TEXT,
        image TEXT,
        cargo TEXT DEFAULT 'Asesor Legislativo',
        office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'asesor_a',
        status TEXT NOT NULL DEFAULT 'active',
        is_super_admin BOOLEAN NOT NULL DEFAULT false,
        permissions TEXT,
        activation_token TEXT,
        activation_token_expiry TIMESTAMP WITH TIME ZONE,
        invited_by TEXT,
        phone TEXT,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Ensure all columns exist in users table
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cargo TEXT DEFAULT 'Asesor Legislativo'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES offices(id) ON DELETE CASCADE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'asesor_a'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token_expiry TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`;

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
        google_event_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`ALTER TABLE agenda_eventos ADD COLUMN IF NOT EXISTS google_event_id TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS agenda_sedes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        ubicacion_url TEXT NOT NULL,
        referencia TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS agenda_tipos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
        nombre TEXT NOT NULL,
        color TEXT DEFAULT 'blue',
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
        observaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    await sql`ALTER TABLE directorio_contactos ADD COLUMN IF NOT EXISTS observaciones TEXT`;

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

    // 12. System Settings
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        id TEXT PRIMARY KEY DEFAULT 'global',
        platform_name TEXT NOT NULL DEFAULT 'LegisLab SaaS',
        evolution_api_url TEXT DEFAULT 'https://evoapi.rubenroque.com.mx',
        evolution_api_key TEXT DEFAULT '429683C4C977415CAAFCCE10F7D57E11',
        maintenance_mode BOOLEAN DEFAULT false NOT NULL,
        global_announcement TEXT,
        announcement_type TEXT DEFAULT 'info',
        allow_new_registrations BOOLEAN DEFAULT true NOT NULL,
        default_trial_days INTEGER DEFAULT 14 NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // 13. Audit Logs
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        description TEXT NOT NULL,
        ip_address TEXT,
        metadata TEXT,
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
