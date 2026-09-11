'use server';

import { getServerSession } from 'next-auth';
import { authOptions, SUPERADMIN_EMAIL } from '@/lib/auth';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { offices, users, type Office } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const ACTIVE_OFFICE_COOKIE = 'legislab_active_office_id';

/**
 * Resuelve el ID del despacho activo para la sesión o petición actual.
 * Prioridad de resolución:
 * 1. Si se envía un `explicitOfficeId` válido (no undefined, null, ni string vacío), se valida/utiliza.
 * 2. Si el usuario actual es Superadmin:
 *    - Revisa la cookie `legislab_active_office_id`. Si existe y pertenece a un despacho real, retorna ese despacho.
 *    - Si no hay cookie o no es válida, retorna el despacho más recientemente creado/activo en la base de datos.
 * 3. Si es un usuario regular (Diputado, Asesor, etc.):
 *    - Retorna `session.user.officeId` o el `officeId` registrado en la tabla `users`.
 * 4. Fallback final: Primer despacho disponible en la base de datos o el ID por defecto.
 */
export async function getActiveOfficeId(explicitOfficeId?: string | null): Promise<string> {
  if (explicitOfficeId && typeof explicitOfficeId === 'string' && explicitOfficeId.trim() !== '' && explicitOfficeId !== 'undefined' && explicitOfficeId !== 'null' && explicitOfficeId.length > 5) {
    return explicitOfficeId.trim();
  }

  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (e) {
    // Entorno de renderizado sin sesión de servidor
  }

  const isSuper = Boolean(
    session?.user?.isSuperAdmin ||
    session?.user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
  );

  // 1. Para Superadmin: Consultar cookie de Despacho Activo
  if (isSuper) {
    try {
      const cookieStore = await cookies();
      const cookieOfficeId = cookieStore.get(ACTIVE_OFFICE_COOKIE)?.value;
      if (cookieOfficeId && cookieOfficeId.length > 5) {
        const [found] = await db
          .select({ id: offices.id })
          .from(offices)
          .where(eq(offices.id, cookieOfficeId))
          .limit(1);

        if (found) {
          return found.id;
        }
      }
    } catch (cookieErr) {
      console.warn('Error reading active office cookie:', cookieErr);
    }
  }

  // 2. Si el usuario tiene un officeId asignado en su sesión
  if (session?.user?.officeId) {
    return session.user.officeId;
  }

  // 3. Consultar usuario en BD por correo si no viene en sesión
  if (session?.user?.email) {
    try {
      const [dbUser] = await db
        .select({ officeId: users.officeId })
        .from(users)
        .where(eq(users.email, session.user.email.toLowerCase().trim()))
        .limit(1);

      if (dbUser?.officeId) {
        return dbUser.officeId;
      }
    } catch (dbErr) {
      console.warn('Error querying user office in DB:', dbErr);
    }
  }

  // 4. Intentar leer cookie de despacho activo incluso si no hay sesión activa aún
  try {
    const cookieStore = await cookies();
    const cookieOfficeId = cookieStore.get(ACTIVE_OFFICE_COOKIE)?.value;
    if (cookieOfficeId && cookieOfficeId.length > 5) {
      const [found] = await db
        .select({ id: offices.id })
        .from(offices)
        .where(eq(offices.id, cookieOfficeId))
        .limit(1);

      if (found) {
        return found.id;
      }
    }
  } catch (e) {}

  // 5. Fallback a la base de datos: obtener el despacho más reciente
  try {
    const [latestOffice] = await db
      .select({ id: offices.id })
      .from(offices)
      .orderBy(desc(offices.createdAt))
      .limit(1);

    if (latestOffice) {
      return latestOffice.id;
    }
  } catch (dbErr) {
    console.warn('Error querying fallback office in DB:', dbErr);
  }

  return '00000000-0000-0000-0000-000000000001';
}

/**
 * Obtiene la información completa del despacho activo actual
 */
export async function getActiveOfficeInfoAction() {
  try {
    const activeOfficeId = await getActiveOfficeId();
    let session = null;
    try {
      session = await getServerSession(authOptions);
    } catch (e) {}

    const isSuperAdmin = Boolean(
      session?.user?.isSuperAdmin ||
      session?.user?.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
    );

    let activeOffice: any = null;
    try {
      const [dbOffice] = await db
        .select()
        .from(offices)
        .where(eq(offices.id, activeOfficeId))
        .limit(1);

      if (dbOffice) {
        activeOffice = dbOffice;
      }
    } catch (e) {
      console.warn('DB error in getActiveOfficeInfoAction:', e);
    }

    if (!activeOffice) {
      activeOffice = {
        id: activeOfficeId,
        name: 'Despacho Parlamentario',
        titularName: 'Diputado',
        titularEmail: '',
        district: 'Distrito 04 Federal',
        state: 'Tabasco',
        legislature: 'LXVI Legislatura',
        party: 'MORENA',
        status: 'active',
        plan: 'starter',
      };
    }

    // Si es superadmin, también obtenemos la lista de despachos para el switcher
    let allOffices: any[] = [];
    if (isSuperAdmin) {
      try {
        allOffices = await db
          .select({
            id: offices.id,
            name: offices.name,
            titularName: offices.titularName,
            status: offices.status,
            plan: offices.plan,
            district: offices.district,
          })
          .from(offices)
          .orderBy(desc(offices.createdAt));
      } catch (e) {}
    }

    return {
      success: true,
      activeOffice,
      isSuperAdmin,
      allOffices,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      activeOffice: null,
      isSuperAdmin: false,
      allOffices: [],
    };
  }
}

/**
 * Server action para cambiar el despacho activo (establece la cookie y revalida las rutas)
 */
export async function setActiveOfficeAction(officeId: string) {
  try {
    if (!officeId || typeof officeId !== 'string') {
      return { success: false, error: 'ID de despacho inválido' };
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_OFFICE_COOKIE, officeId, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 días
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    revalidatePath('/dashboard');
    revalidatePath('/agenda');
    revalidatePath('/gestiones');
    revalidatePath('/usuarios');
    revalidatePath('/directorio');
    revalidatePath('/tareas');
    revalidatePath('/grupos');
    revalidatePath('/atencion-ciudadana');
    revalidatePath('/configuracion');
    revalidatePath('/iniciativas');
    revalidatePath('/territorio');
    revalidatePath('/medios');
    revalidatePath('/admin/despachos');

    return { success: true, officeId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
