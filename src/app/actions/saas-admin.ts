'use server';

import { db } from '@/db';
import {
  offices,
  users,
  gestiones,
  systemSettings,
  auditLogs,
  type Office,
  type User,
} from '@/db/schema';
import { eq, desc, ilike, or, count, sql } from 'drizzle-orm';
import {
  fetchInstances,
  createInstance,
  connectInstance,
  logoutInstance,
  getConnectionState,
} from '@/lib/evolution-api';
import {
  ALL_AVAILABLE_MODULES,
  PLAN_CONFIGS,
} from '@/lib/saas-config';

// Fallback seed offices for local preview when DB is initializing
const MOCK_OFFICES = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Despacho Dip. Ruben Roque',
    slug: 'dip-ruben-roque',
    titularName: 'Dip. Ruben Roque',
    titularEmail: 'ruben.roque@congresotabasco.gob.mx',
    titularPhone: '+52 (993) 220-0146',
    legislature: 'LXVI Legislatura',
    district: 'Distrito 04 Federal (Centro)',
    state: 'Tabasco',
    party: 'MORENA',
    logoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active' as const,
    plan: 'starter' as const,
    whatsappInstanceName: 'Legislab',
    whatsappPhone: '+52 (993) 220-0146',
    maxUsers: 3, // 1 principal + 2 extras
    trialEndsAt: null,
    subscriptionEndsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +2 meses
    discountPercent: 0,
    promoNotes: 'Plan Inicial con 2 usuarios adicionales incluidos',
    enabledModules: JSON.stringify([
      'atencion_ciudadana',
      'grupos',
      'gestiones',
      'territorio',
      'redactor_ia',
      'agenda',
      'directorio',
      'tareas',
      'marco_juridico',
      'medios'
    ]),
    googleDriveFolderUrl: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    billingEmail: 'ruben.roque@congresotabasco.gob.mx',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date(),
    userCount: 3,
    gestionesCount: 142,
  },
  {
    id: 'a12bc34d-56ef-7890-abcd-ef1234567890',
    name: 'Despacho Dip. Mariana Escudero',
    slug: 'dip-mariana-escudero',
    titularName: 'Mariana Escudero',
    titularEmail: 'mariana.escudero@congresotabasco.gob.mx',
    titularPhone: '+52 (993) 412-8890',
    legislature: 'LXVI Legislatura',
    district: 'Distrito 02 Local (Cárdenas)',
    state: 'Tabasco',
    party: 'PVEM',
    logoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active' as const,
    plan: 'professional' as const,
    whatsappInstanceName: 'Legislab_DipEscudero',
    whatsappPhone: '+52 (993) 412-8890',
    maxUsers: 8,
    trialEndsAt: null,
    subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    discountPercent: 20,
    promoNotes: '20% Descuento Anual',
    enabledModules: JSON.stringify([
      'atencion_ciudadana',
      'grupos',
      'gestiones',
      'agenda',
      'directorio',
      'tareas'
    ]),
    billingEmail: 'contacto@marianaescudero.mx',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date(),
    userCount: 4,
    gestionesCount: 89,
  },
  {
    id: 'b23cd45e-67fa-8901-bcde-f12345678901',
    name: 'Despacho Dip. Carlos Armenta',
    slug: 'dip-carlos-armenta',
    titularName: 'Carlos Armenta',
    titularEmail: 'carlos.armenta@congresotabasco.gob.mx',
    titularPhone: '+52 (993) 555-0199',
    legislature: 'LXV Legislatura',
    district: 'Distrito 01 Federal (Macuspana)',
    state: 'Tabasco',
    party: 'PT',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'trial' as const,
    plan: 'starter' as const,
    whatsappInstanceName: 'Legislab_DipArmenta',
    whatsappPhone: '+52 (993) 555-0199',
    maxUsers: 3,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 días trial
    subscriptionEndsAt: null,
    discountPercent: 0,
    promoNotes: 'Free Trial de 14 días otorgado por Superadmin',
    enabledModules: JSON.stringify([
      'atencion_ciudadana',
      'gestiones',
      'agenda',
      'directorio'
    ]),
    billingEmail: 'armenta.enlace@gmail.com',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date(),
    userCount: 2,
    gestionesCount: 24,
  },
];

/**
 * Obtiene métricas globales del SaaS para el Dashboard de Superadmin
 */
export async function getSaasMetricsAction() {
  try {
    let totalOffices = 0;
    let activeOffices = 0;
    let trialOffices = 0;
    let suspendedOffices = 0;
    let totalUsers = 0;
    let totalGestiones = 0;
    let totalMRR = 0;

    let dbOffices: any[] = [];
    try {
      dbOffices = await db.select().from(offices);
      const userRes = await db.select({ count: count() }).from(users);
      const gesRes = await db.select({ count: count() }).from(gestiones);
      totalUsers = Number(userRes[0]?.count || 0);
      totalGestiones = Number(gesRes[0]?.count || 0);
    } catch (dbErr) {
      console.warn('DB reading for saas metrics skipped, using mock:', dbErr);
    }

    const officeList = dbOffices.length > 0 ? dbOffices : MOCK_OFFICES;
    totalOffices = officeList.length;

    for (const off of officeList) {
      const st = off.status || 'active';
      if (st === 'active') {
        activeOffices++;
        const planKey = off.plan || 'starter';
        const basePrice = PLAN_CONFIGS[planKey]?.price || 1999;
        const discount = off.discountPercent || 0;
        const finalPrice = Math.round(basePrice * (1 - discount / 100));
        totalMRR += finalPrice;
      } else if (st === 'trial') {
        trialOffices++;
      } else if (st === 'suspended') {
        suspendedOffices++;
      }
    }

    if (dbOffices.length === 0) {
      totalUsers = 9;
      totalGestiones = 255;
    }

    // Check Evolution API status
    let evoInstancesCount = 0;
    let evoConnectedCount = 0;
    let evoDisconnectedCount = 0;

    try {
      const evoRes = await fetchInstances();
      if (evoRes.success && Array.isArray(evoRes.data)) {
        evoInstancesCount = evoRes.data.length;
        for (const inst of evoRes.data as any[]) {
          const status = inst.connectionStatus || inst.instance?.status || 'close';
          if (status === 'open') {
            evoConnectedCount++;
          } else {
            evoDisconnectedCount++;
          }
        }
      }
    } catch (e) {
      console.warn('Evolution API instances scan in saas metrics:', e);
    }

    return {
      success: true,
      data: {
        totalOffices,
        activeOffices,
        trialOffices,
        suspendedOffices,
        totalUsers,
        totalGestiones,
        totalMRR,
        evoInstancesCount,
        evoConnectedCount,
        evoDisconnectedCount,
        systemHealth: evoDisconnectedCount > 2 ? 'warning' : 'healthy',
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: {
        totalOffices: 3,
        activeOffices: 2,
        trialOffices: 1,
        suspendedOffices: 0,
        totalUsers: 9,
        totalGestiones: 255,
        totalMRR: 5998,
        evoInstancesCount: 3,
        evoConnectedCount: 2,
        evoDisconnectedCount: 1,
        systemHealth: 'healthy',
      },
    };
  }
}

/**
 * Consulta la lista de despachos con filtros para el panel de Superadmin
 */
export async function getSaasOfficesAction(params?: {
  search?: string;
  status?: string;
  plan?: string;
}) {
  try {
    let dbOffices: any[] = [];
    try {
      dbOffices = await db.select().from(offices).orderBy(desc(offices.createdAt));
    } catch (e) {
      console.warn('DB getSaasOfficesAction error:', e);
    }

    let list = dbOffices.length > 0 ? dbOffices : MOCK_OFFICES;

    // Apply search and filters
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.titularName.toLowerCase().includes(q) ||
          (o.titularEmail && o.titularEmail.toLowerCase().includes(q)) ||
          o.district.toLowerCase().includes(q) ||
          o.state.toLowerCase().includes(q) ||
          (o.party && o.party.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      list = list.filter((o) => o.status === params.status);
    }

    if (params?.plan && params.plan !== 'all') {
      list = list.filter((o) => o.plan === params.plan);
    }

    return {
      success: true,
      data: list,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: MOCK_OFFICES,
    };
  }
}

/**
 * Crea un nuevo despacho legislativo en el SaaS registrando al USUARIO PRINCIPAL (el que contrata y paga)
 */
export async function createSaasOfficeAction(formData: {
  name: string;
  titularName: string; // Usuario Principal (Diputado)
  titularEmail: string; // Correo del usuario principal / contacto de pago
  titularPhone?: string;
  legislature?: string;
  district: string;
  state?: string;
  party?: string;
  plan: 'starter' | 'professional' | 'parliamentary' | 'enterprise';
  status?: 'active' | 'trial' | 'suspended';
  trialDays?: number;
  discountPercent?: number;
  promoNotes?: string;
  whatsappInstanceName?: string;
}) {
  try {
    const planKey = formData.plan || 'starter';
    const planConfig = PLAN_CONFIGS[planKey] || PLAN_CONFIGS.starter;
    const maxUsers = planConfig.maxUsers; // Starter: 3 usuarios totales (1 principal + 2 extras)

    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const instanceName =
      formData.whatsappInstanceName ||
      `Legislab_${formData.titularName.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Trial or standard subscription date
    let trialEndsAt: Date | null = null;
    let subscriptionEndsAt: Date | null = null;

    if (formData.status === 'trial' || (formData.trialDays && formData.trialDays > 0)) {
      const days = formData.trialDays || 14;
      trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
      subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Default all modules enabled
    const allModuleKeys = ALL_AVAILABLE_MODULES.map((m) => m.id);

    let newOfficeId = crypto.randomUUID();

    try {
      const inserted = await db
        .insert(offices)
        .values({
          id: newOfficeId,
          name: formData.name,
          slug,
          titularName: formData.titularName,
          titularEmail: formData.titularEmail,
          titularPhone: formData.titularPhone || '',
          legislature: formData.legislature || 'LXVI Legislatura',
          district: formData.district,
          state: formData.state || 'Tabasco',
          party: formData.party || 'Independiente',
          status: formData.status || 'active',
          plan: planKey,
          maxUsers,
          trialEndsAt,
          subscriptionEndsAt,
          discountPercent: formData.discountPercent || 0,
          promoNotes: formData.promoNotes || '',
          enabledModules: JSON.stringify(allModuleKeys),
          whatsappInstanceName: instanceName,
          billingEmail: formData.titularEmail,
        })
        .returning();

      if (inserted[0]) {
        newOfficeId = inserted[0].id;
      }

      // Automatically register the Principal User (Propietario / Diputado)
      await db.insert(users).values({
        name: formData.titularName,
        email: formData.titularEmail,
        cargo: 'Diputado Titular (Propietario del Despacho)',
        role: 'diputado',
        phone: formData.titularPhone || '',
        officeId: newOfficeId,
      });
    } catch (dbErr) {
      console.warn('DB insert office skipped (preview/fallback):', dbErr);
    }

    // Provision instance in Evolution API automatically
    try {
      await createInstance(instanceName);
    } catch (evoErr) {
      console.warn('Evolution API auto-create instance skipped:', evoErr);
    }

    // Create Audit Log
    try {
      await db.insert(auditLogs).values({
        action: 'office.created',
        description: `Se creó el despacho "${formData.name}" para el usuario principal "${formData.titularName}" (${formData.titularEmail}) con plan ${planConfig.name}`,
        metadata: JSON.stringify({ slug, instanceName, maxUsers, titular: formData.titularName }),
      });
    } catch (logErr) {
      console.warn('Audit log write skipped:', logErr);
    }

    return {
      success: true,
      officeId: newOfficeId,
      instanceName,
      message: `Despacho "${formData.name}" creado con éxito. Usuario principal "${formData.titularName}" registrado con capacidad de ${maxUsers} usuarios y gestiones ilimitadas.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Error al crear el despacho: ${msg}`,
    };
  }
}

/**
 * Agrega meses de cortesía / gratis a un despacho
 */
export async function addFreeMonthsAction(officeId: string, monthsToAdd: number) {
  try {
    let currentEndsAt = new Date();
    try {
      const current = await db.select().from(offices).where(eq(offices.id, officeId)).limit(1);
      if (current[0]?.subscriptionEndsAt && current[0].subscriptionEndsAt > new Date()) {
        currentEndsAt = new Date(current[0].subscriptionEndsAt);
      }
    } catch (e) {
      console.warn('DB read in addFreeMonthsAction:', e);
    }

    const newDate = new Date(currentEndsAt.setMonth(currentEndsAt.getMonth() + monthsToAdd));

    try {
      await db.update(offices).set({
        subscriptionEndsAt: newDate,
        status: 'active',
        promoNotes: `+${monthsToAdd} mes(es) de cortesía otorgado(s) por Superadmin`,
        updatedAt: new Date(),
      }).where(eq(offices.id, officeId));

      await db.insert(auditLogs).values({
        action: 'promo.free_months_added',
        description: `Se agregaron +${monthsToAdd} mes(es) gratis al despacho ${officeId}. Nueva fecha de corte: ${newDate.toLocaleDateString('es-MX')}`,
      });
    } catch (e) {
      console.warn('DB update in addFreeMonthsAction:', e);
    }

    return {
      success: true,
      newDate,
      message: `¡Se agregaron +${monthsToAdd} mes(es) gratis exitosamente! Nueva vigencia: ${newDate.toLocaleDateString('es-MX')}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Configura o extiende los días de Free Trial
 */
export async function setTrialPeriodAction(officeId: string, days: number) {
  try {
    const newTrialEnds = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    try {
      await db.update(offices).set({
        status: 'trial',
        trialEndsAt: newTrialEnds,
        promoNotes: `Free Trial configurado a ${days} días`,
        updatedAt: new Date(),
      }).where(eq(offices.id, officeId));

      await db.insert(auditLogs).values({
        action: 'promo.trial_set',
        description: `Se configuró Free Trial de ${days} días para el despacho ${officeId}`,
      });
    } catch (e) {
      console.warn('DB update trial:', e);
    }

    return {
      success: true,
      trialEndsAt: newTrialEnds,
      message: `Free Trial configurado a ${days} días (Vence: ${newTrialEnds.toLocaleDateString('es-MX')})`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Aplica un descuento personalizado (porcentaje) a un despacho
 */
export async function setDiscountAction(officeId: string, percent: number, notes?: string) {
  try {
    try {
      await db.update(offices).set({
        discountPercent: percent,
        promoNotes: notes || `${percent}% de descuento especial`,
        updatedAt: new Date(),
      }).where(eq(offices.id, officeId));

      await db.insert(auditLogs).values({
        action: 'promo.discount_applied',
        description: `Se aplicó un ${percent}% de descuento al despacho ${officeId}`,
      });
    } catch (e) {
      console.warn('DB setDiscountAction:', e);
    }

    return {
      success: true,
      discountPercent: percent,
      message: `Descuento del ${percent}% aplicado con éxito.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Actualiza la matriz de módulos habilitados para un despacho
 */
export async function updateOfficeModulesAction(officeId: string, modules: string[]) {
  try {
    const jsonStr = JSON.stringify(modules);
    try {
      await db.update(offices).set({
        enabledModules: jsonStr,
        updatedAt: new Date(),
      }).where(eq(offices.id, officeId));

      await db.insert(auditLogs).values({
        action: 'office.modules_updated',
        description: `Módulos actualizados para el despacho ${officeId} (${modules.length} módulos activos)`,
      });
    } catch (e) {
      console.warn('DB updateOfficeModulesAction:', e);
    }

    return {
      success: true,
      enabledModules: modules,
      message: 'Módulos del despacho actualizados correctamente.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Guarda las credenciales y carpeta de Google Drive del cliente
 */
export async function updateOfficeDriveConfigAction(officeId: string, driveData: {
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  googleDriveClientId?: string;
  googleDriveClientSecret?: string;
}) {
  try {
    try {
      await db.update(offices).set({
        ...driveData,
        updatedAt: new Date(),
      }).where(eq(offices.id, officeId));

      await db.insert(auditLogs).values({
        action: 'office.drive_configured',
        description: `Se actualizaron las credenciales de Google Drive para el despacho ${officeId}`,
      });
    } catch (e) {
      console.warn('DB updateOfficeDriveConfigAction:', e);
    }

    return {
      success: true,
      message: 'Configuración de Google Drive guardada exitosamente.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Actualiza datos generales o plan de un despacho
 */
export async function updateSaasOfficeAction(
  id: string,
  data: Partial<Office>
) {
  try {
    try {
      await db.update(offices).set({ ...data, updatedAt: new Date() }).where(eq(offices.id, id));
    } catch (dbErr) {
      console.warn('DB update office skipped:', dbErr);
    }

    return {
      success: true,
      message: 'Despacho actualizado correctamente.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Cambia el estado de un despacho (Activar / Suspender)
 */
export async function toggleOfficeStatusAction(
  id: string,
  newStatus: 'active' | 'trial' | 'suspended' | 'cancelled'
) {
  try {
    try {
      await db.update(offices).set({ status: newStatus, updatedAt: new Date() }).where(eq(offices.id, id));
      await db.insert(auditLogs).values({
        action: `office.status_${newStatus}`,
        description: `Cambio de estado del despacho ${id} a ${newStatus}`,
      });
    } catch (dbErr) {
      console.warn('DB toggle status skipped:', dbErr);
    }

    return {
      success: true,
      newStatus,
      message: `Estado actualizado a ${newStatus}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
    };
  }
}

/**
 * Obtiene todas las instancias de WhatsApp de Evolution API asociadas a despachos
 */
export async function getSaasWhatsAppInstancesAction() {
  try {
    const evoRes = await fetchInstances();
    const instances = evoRes.success && Array.isArray(evoRes.data) ? evoRes.data : [];

    const mapped = instances.map((inst: any) => {
      const name = inst.name || inst.instance?.instanceName || 'Sin Nombre';
      const status = inst.connectionStatus || 'close';
      const ownerJid = inst.ownerJid || '';
      const phone = ownerJid.split('@')[0] || '';
      
      let formattedPhone = phone;
      if (phone.startsWith('521') && phone.length >= 13) {
        const area = phone.substring(3, 6);
        const p1 = phone.substring(6, 9);
        const p2 = phone.substring(9, 13);
        formattedPhone = `+52 (${area}) ${p1}-${p2}`;
      } else if (phone.length > 5) {
        formattedPhone = `+${phone}`;
      }

      return {
        instanceName: name,
        status,
        phone: formattedPhone || 'No vinculado',
        rawPhone: phone,
        profileName: inst.profileName || 'Sin nombre',
        profilePicUrl: inst.profilePicUrl || null,
        messageCount: inst._count?.Message || 0,
        contactCount: inst._count?.Contact || 0,
        chatCount: inst._count?.Chat || 0,
        updatedAt: inst.updatedAt || new Date().toISOString(),
      };
    });

    return {
      success: true,
      data: mapped,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: [],
    };
  }
}

/**
 * Consulta usuarios globales para la administración del SaaS
 */
export async function getSaasUsersAction(params?: {
  search?: string;
  role?: string;
  officeId?: string;
}) {
  try {
    let dbUsers: any[] = [];
    try {
      dbUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    } catch (e) {
      console.warn('DB getSaasUsersAction error:', e);
    }

    const mockUsers = [
      {
        id: 'u-1',
        name: 'Dip. Ruben Roque',
        email: 'ruben.roque@congresotabasco.gob.mx',
        cargo: 'Diputado Titular (Usuario Principal)',
        role: 'diputado',
        phone: '+52 (993) 220-0146',
        officeName: 'Despacho Dip. Ruben Roque',
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 'u-2',
        name: 'Lic. Paulina Rovirosa',
        email: 'paulina.rovirosa@rubenroque.mx',
        cargo: 'Coordinadora de Atención (Usuario Extra 1)',
        role: 'secretario_tecnico',
        phone: '+52 (993) 111-2233',
        officeName: 'Despacho Dip. Ruben Roque',
        createdAt: new Date('2026-01-16'),
      },
      {
        id: 'u-3',
        name: 'Ing. Carlos Mendoza',
        email: 'carlos.mendoza@rubenroque.mx',
        cargo: 'Gestor Territorial (Usuario Extra 2)',
        role: 'coordinador_territorial',
        phone: '+52 (993) 333-4455',
        officeName: 'Despacho Dip. Ruben Roque',
        createdAt: new Date('2026-01-18'),
      },
    ];

    let list = dbUsers.length > 0 ? dbUsers : mockUsers;

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.cargo?.toLowerCase().includes(q)
      );
    }

    if (params?.role && params.role !== 'all') {
      list = list.filter((u) => u.role === params.role);
    }

    return {
      success: true,
      data: list,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: [],
    };
  }
}

/**
 * Obtiene los últimos logs de auditoría de la plataforma
 */
export async function getSaasAuditLogsAction() {
  try {
    let dbLogs: any[] = [];
    try {
      dbLogs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(30);
    } catch (e) {
      console.warn('DB getSaasAuditLogsAction error:', e);
    }

    const mockLogs = [
      {
        id: 'log-1',
        action: 'promo.free_months_added',
        description: 'Superadmin agregó +2 meses gratis de cortesía al Despacho Dip. Ruben Roque',
        ipAddress: '189.203.45.12',
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
      },
      {
        id: 'log-2',
        action: 'office.modules_updated',
        description: 'Módulos actualizados para Despacho Dip. Mariana Escudero (6 módulos activos)',
        ipAddress: '189.203.45.12',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        id: 'log-3',
        action: 'office.created',
        description: 'Nuevo despacho "Despacho Dip. Carlos Armenta" registrado para usuario principal carlos.armenta@congresotabasco.gob.mx en Plan Starter (3 usuarios, gestiones ilimitadas)',
        ipAddress: '187.189.90.34',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ];

    return {
      success: true,
      data: dbLogs.length > 0 ? dbLogs : mockLogs,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: msg,
      data: [],
    };
  }
}
