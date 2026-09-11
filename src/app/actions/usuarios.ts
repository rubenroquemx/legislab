'use server';

import { db } from '@/db';
import { users, offices, type User } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { PLAN_CONFIGS } from '@/lib/saas-config';
import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';
import { getActiveOfficeId } from '@/lib/session-office';

async function resolveOffice(officeId?: string) {
  try {
    const targetId = await getActiveOfficeId(officeId);
    const officeList = await db.select().from(offices).where(eq(offices.id, targetId));
    if (officeList.length > 0) return officeList[0];
    const anyOffice = await db.select().from(offices).limit(1);
    if (anyOffice.length > 0) return anyOffice[0];

    const [created] = await db
      .insert(offices)
      .values({
        id: targetId,
        name: 'Despacho Parlamentario Dip. Ruben Roque',
        titularName: 'Dip. Ruben Roque',
        titularEmail: 'ruben.roque@congresotabasco.gob.mx',
        legislature: 'LXVI Legislatura',
        district: 'Distrito 04 Federal',
        state: 'Tabasco',
        party: 'MORENA',
        maxUsers: 2,
        plan: 'starter',
      })
      .returning();
    return created;
  } catch (e) {
    console.warn('resolveOffice error:', e);
    return null;
  }
}

/**
 * Obtiene todos los integrantes del despacho junto con los límites del plan
 */
export async function getOfficeUsersAction(officeId?: string) {
  try {
    const office = await resolveOffice(officeId);
    if (!office) {
      return { success: false, error: 'Despacho no encontrado', users: [] };
    }

    const officeUsers = await db
      .select()
      .from(users)
      .where(eq(users.officeId, office.id))
      .orderBy(desc(users.createdAt));

    // Si aún no hay usuarios en este despacho, sembramos al titular inicial
    if (officeUsers.length === 0) {
      const defaultPermissions = JSON.stringify({
        Agenda: { ver: true, crear: true, editar: true, eliminar: true },
        Gestiones: { ver: true, crear: true, editar: true, eliminar: true },
        Iniciativas: { ver: true, crear: true, editar: true, eliminar: true },
        Discursos: { ver: true, crear: true, editar: true, eliminar: true },
        Boletines: { ver: true, crear: true, editar: true, eliminar: true },
        Medios: { ver: true, crear: true, editar: true, eliminar: true },
        Usuarios: { ver: true, crear: true, editar: true, eliminar: true },
        Configuración: { ver: true, crear: true, editar: true, eliminar: true },
      });

      const hash = await bcrypt.hash('legislab2026', 10);

      const [createdTitular] = await db
        .insert(users)
        .values({
          name: office.titularName || 'Dip. Ruben Roque',
          email: office.titularEmail || 'ruben.roque@congresotabasco.gob.mx',
          role: 'diputado',
          cargo: 'Diputado Titular',
          officeId: office.id,
          status: 'active',
          isSuperAdmin: office.titularEmail?.toLowerCase() === SUPERADMIN_EMAIL,
          permissions: defaultPermissions,
          passwordHash: hash,
        })
        .returning();

      officeUsers.push(createdTitular);
    }

    const planKey = (office.plan || 'starter') as keyof typeof PLAN_CONFIGS;
    const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.starter;
    const maxUsers = office.maxUsers || planConfig.maxUsers || 2;

    return {
      success: true,
      users: officeUsers,
      office: {
        id: office.id,
        name: office.name,
        plan: office.plan,
        titularEmail: office.titularEmail,
        maxUsers,
      },
      currentCount: officeUsers.length,
      maxUsers,
    };
  } catch (error: any) {
    console.error('Error in getOfficeUsersAction:', error);
    return { success: false, error: error?.message || 'Error al obtener usuarios', users: [] };
  }
}

/**
 * Invita o registra a un nuevo usuario para el despacho validando cuotas de plan
 */
export async function inviteOfficeUserAction(data: {
  name: string;
  email: string;
  cargo: string;
  role: 'diputado' | 'secretario_tecnico' | 'coordinador_territorial' | 'asesor_a' | 'asesor_b' | 'admin';
  phone?: string;
  permissions?: any;
  officeId?: string;
}) {
  try {
    const office = await resolveOffice(data.officeId);
    if (!office) {
      return { success: false, error: 'Despacho no encontrado' };
    }

    const cleanEmail = data.email.toLowerCase().trim();
    if (!cleanEmail || !data.name.trim()) {
      return { success: false, error: 'Nombre y correo son obligatorios' };
    }

    // 1. Validar límite de usuarios por Plan
    const currentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.officeId, office.id));

    const planKey = (office.plan || 'starter') as keyof typeof PLAN_CONFIGS;
    const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.starter;
    const maxAllowed = office.maxUsers || planConfig.maxUsers || 2;

    if (currentUsers.length >= maxAllowed) {
      return {
        success: false,
        error: `Has alcanzado el límite máximo de usuarios (${maxAllowed}) permitido para tu plan actual. Contacta al Administrador de LegisLab para ampliar tu cupo.`,
      };
    }

    // 2. Verificar si el correo ya existe
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return {
        success: false,
        error: 'Este correo electrónico ya está registrado en la plataforma.',
      };
    }

    // 3. Generar token criptográfico de activación (válido por 7 días)
    const activationToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const activationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const permissionsJson = typeof data.permissions === 'object' 
      ? JSON.stringify(data.permissions) 
      : data.permissions || null;

    const [newUser] = await db
      .insert(users)
      .values({
        name: data.name.trim(),
        email: cleanEmail,
        cargo: data.cargo.trim() || 'Asesor Legislativo',
        role: data.role || 'asesor_a',
        phone: data.phone?.trim() || null,
        officeId: office.id,
        status: 'invited',
        permissions: permissionsJson,
        activationToken,
        activationTokenExpiry: activationExpiry,
        isSuperAdmin: cleanEmail === SUPERADMIN_EMAIL,
      })
      .returning();

    revalidatePath('/usuarios');
    revalidatePath('/admin/usuarios');
    revalidatePath(`/admin/despachos/${office.id}`);

    return {
      success: true,
      user: newUser,
      activationToken,
      activationUrl: `/activar-cuenta?token=${activationToken}`,
      message: 'Invitación generada exitosamente',
    };
  } catch (error: any) {
    console.error('Error in inviteOfficeUserAction:', error);
    return { success: false, error: error?.message || 'Error al invitar usuario' };
  }
}

/**
 * Valida un token de activación y retorna información preliminar para la pantalla de bienvenida
 */
export async function validateActivationTokenAction(token: string) {
  try {
    if (!token || !token.trim()) {
      return { valid: false, error: 'Enlace de activación inválido' };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.activationToken, token.trim()))
      .limit(1);

    if (!user) {
      return { valid: false, error: 'El enlace de activación no existe o ya fue utilizado.' };
    }

    if (user.activationTokenExpiry && new Date() > user.activationTokenExpiry) {
      return { valid: false, error: 'El enlace de activación ha expirado. Solicita una nueva invitación.' };
    }

    let officeName = 'Despacho Parlamentario';
    if (user.officeId) {
      const [office] = await db.select().from(offices).where(eq(offices.id, user.officeId));
      if (office) officeName = office.name;
    }

    return {
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cargo: user.cargo,
        officeName,
      },
    };
  } catch (error: any) {
    console.error('Error in validateActivationTokenAction:', error);
    return { valid: false, error: 'Error al verificar enlace de activación' };
  }
}

/**
 * Activa la cuenta de un usuario estableciendo su contraseña y datos finales
 */
export async function activateUserAccountAction(
  token: string,
  data: { password: string; name?: string; phone?: string }
) {
  try {
    if (!token || !data.password || data.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.activationToken, token.trim()))
      .limit(1);

    if (!user) {
      return { success: false, error: 'Enlace de activación inválido o caducado.' };
    }

    if (user.activationTokenExpiry && new Date() > user.activationTokenExpiry) {
      return { success: false, error: 'El enlace de activación ha expirado.' };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        status: 'active',
        activationToken: null,
        activationTokenExpiry: null,
        name: data.name?.trim() || user.name,
        phone: data.phone?.trim() || user.phone,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      email: user.email,
      message: '¡Cuenta activada exitosamente! Ya puedes iniciar sesión.',
    };
  } catch (error: any) {
    console.error('Error in activateUserAccountAction:', error);
    return { success: false, error: error?.message || 'Error al activar la cuenta' };
  }
}

/**
 * Actualiza permisos, cargo o rol de un integrante
 */
export async function updateUserPermissionsAction(
  userId: string,
  data: {
    permissions?: any;
    role?: string;
    cargo?: string;
    status?: string;
  }
) {
  try {
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const updates: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.permissions !== undefined) {
      updates.permissions = typeof data.permissions === 'object' ? JSON.stringify(data.permissions) : data.permissions;
    }
    if (data.role) updates.role = data.role as any;
    if (data.cargo) updates.cargo = data.cargo.trim();
    if (data.status) updates.status = data.status;

    await db.update(users).set(updates).where(eq(users.id, userId));

    revalidatePath('/usuarios');
    revalidatePath('/admin/usuarios');
    return { success: true, message: 'Permisos actualizados correctamente' };
  } catch (error: any) {
    console.error('Error in updateUserPermissionsAction:', error);
    return { success: false, error: error?.message || 'Error al actualizar permisos' };
  }
}

/**
 * Elimina o revoca el acceso de un usuario de un despacho
 */
export async function deleteOrRevokeUserAction(userId: string) {
  try {
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Proteger contra borrado al superadmin maestro
    if (targetUser.email.toLowerCase() === SUPERADMIN_EMAIL) {
      return { success: false, error: 'El Superadmin maestro principal no puede ser eliminado.' };
    }

    // Proteger al titular del despacho
    if (targetUser.officeId) {
      const [office] = await db.select().from(offices).where(eq(offices.id, targetUser.officeId));
      if (office && office.titularEmail?.toLowerCase() === targetUser.email.toLowerCase()) {
        return {
          success: false,
          error: 'No se puede eliminar al Diputado Titular del despacho. Si necesitas cambiarlo, hazlo desde el panel de administración.',
        };
      }
    }

    await db.delete(users).where(eq(users.id, userId));

    revalidatePath('/usuarios');
    revalidatePath('/admin/usuarios');
    return { success: true, message: 'Usuario eliminado exitosamente' };
  } catch (error: any) {
    console.error('Error in deleteOrRevokeUserAction:', error);
    return { success: false, error: error?.message || 'Error al eliminar usuario' };
  }
}
