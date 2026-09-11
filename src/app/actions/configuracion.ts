'use server';

import { db, offices, type Office } from '@/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getActiveOfficeId } from '@/lib/session-office';

/**
 * Obtiene la configuración completa del despacho activo actual
 */
export async function getOfficeConfigAction(officeId?: string) {
  try {
    const activeOfficeId = await getActiveOfficeId(officeId);
    let [office] = await db.select().from(offices).where(eq(offices.id, activeOfficeId)).limit(1);

    if (!office) {
      // Si no existe, crear o buscar el primero
      const anyOffice = await db.select().from(offices).limit(1);
      if (anyOffice.length > 0) {
        office = anyOffice[0];
      } else {
        const [created] = await db.insert(offices).values({
          id: activeOfficeId,
          name: 'Despacho Parlamentario Dip. Ruben Roque',
          titularName: 'Dip. Ruben Roque',
          titularEmail: 'contacto@rubenroque.mx',
          legislature: 'LXVI Legislatura',
          district: 'Distrito 04 Federal',
          state: 'Tabasco',
          party: 'MORENA',
          whatsappInstanceName: 'Legislab',
        }).returning();
        office = created;
      }
    }

    const defaultInstanceName = office.whatsappInstanceName || `legislab_${office.id.slice(0, 8)}`;

    return {
      success: true,
      data: {
        id: office.id,
        name: office.name,
        titularName: office.titularName,
        titularEmail: office.titularEmail || '',
        titularPhone: office.titularPhone || '',
        district: office.district || '',
        state: office.state || 'Tabasco',
        legislature: office.legislature || 'LXVI Legislatura',
        party: office.party || 'MORENA',
        plan: office.plan || 'starter',
        status: office.status || 'active',
        whatsappInstanceName: defaultInstanceName,
        whatsappPhone: office.whatsappPhone || '',
        googleDriveConnected: Boolean(office.googleDriveConnected),
        googleDriveEmail: office.googleDriveEmail || '',
        googleDriveFolderUrl: office.googleDriveFolderUrl || '',
        googleDriveFolderId: office.googleDriveFolderId || '',
        googleCalendarConnected: Boolean(office.googleCalendarConnected),
        googleCalendarEmail: office.googleCalendarEmail || '',
        googleCalendarId: office.googleCalendarId || 'primary',
        googleCalendarLastSync: office.googleCalendarLastSync || null,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, data: null };
  }
}

/**
 * Guarda los datos generales del despacho activo
 */
export async function updateOfficeGeneralConfigAction(data: {
  name: string;
  titularName: string;
  titularEmail?: string;
  titularPhone?: string;
  district?: string;
  state?: string;
  legislature?: string;
  party?: string;
  officeId?: string;
}) {
  try {
    const activeOfficeId = await getActiveOfficeId(data.officeId);

    const [updated] = await db
      .update(offices)
      .set({
        name: data.name.trim(),
        titularName: data.titularName.trim(),
        titularEmail: data.titularEmail?.trim() || '',
        titularPhone: data.titularPhone?.trim() || '',
        district: data.district?.trim() || '',
        state: data.state?.trim() || 'Tabasco',
        legislature: data.legislature?.trim() || 'LXVI Legislatura',
        party: data.party?.trim() || '',
        updatedAt: new Date(),
      })
      .where(eq(offices.id, activeOfficeId))
      .returning();

    revalidatePath('/configuracion');
    revalidatePath('/dashboard');
    revalidatePath('/admin/despachos');

    return { success: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}
