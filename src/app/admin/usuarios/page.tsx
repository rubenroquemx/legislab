'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  UserCheck,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle2,
  AlertCircle,
  Crown,
  Lock,
  ArrowRightLeft
} from 'lucide-react';
import { 
  getSaasUsersAction,
  updateSaasUserStatusAction,
  resetSaasUserPasswordAction,
  reassignSaasUserOfficeAction,
  toggleSuperAdminRoleAction,
  deleteSaasUserAction,
  getSaasOfficesAction
} from '@/app/actions/saas-admin';
import { cn } from '@/lib/utils';
import { SUPERADMIN_EMAIL } from '@/lib/auth-constants';

export default function SaasUsuariosPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [officesList, setOfficesList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [officeFilter, setOfficeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Reassign office modal
  const [reassignModalUser, setReassignModalUser] = useState<any | null>(null);
  const [targetOfficeId, setTargetOfficeId] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);

  // Delete modal
  const [deleteModalUser, setDeleteModalUser] = useState<any | null>(null);

  // Toast feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const [usersRes, officesRes] = await Promise.all([
        getSaasUsersAction({
          search: searchTerm,
          role: roleFilter,
          officeId: officeFilter,
        }),
        getSaasOfficesAction(),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsersList(usersRes.data);
      }
      if (officesRes.success && officesRes.data) {
        setOfficesList(officesRes.data);
      }
    } catch (e) {
      console.warn('Error loading SaaS users:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [searchTerm, roleFilter, officeFilter]);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await updateSaasUserStatusAction(user.id, newStatus);
      if (res.success) {
        showToast(res.message || 'Estado actualizado');
        await loadData();
      } else {
        alert(res.error || 'Error al cambiar estado');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleToggleSuperAdmin = async (user: any) => {
    const isSuper = !user.isSuperAdmin;
    try {
      const res = await toggleSuperAdminRoleAction(user.id, isSuper);
      if (res.success) {
        showToast(res.message || 'Permisos actualizados');
        await loadData();
      } else {
        alert(res.error || 'Error al modificar permisos de Superadmin');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    setIsResetting(true);
    try {
      const res = await resetSaasUserPasswordAction(resetModalUser.id, newPassword);
      if (res.success) {
        showToast('Contraseña restablecida exitosamente');
        setResetModalUser(null);
        setNewPassword('');
      } else {
        alert(res.error || 'Error al restablecer contraseña');
      }
    } catch (e) {
      alert('Error inesperado');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalUser || !targetOfficeId) return;

    setIsReassigning(true);
    try {
      const res = await reassignSaasUserOfficeAction(reassignModalUser.id, targetOfficeId);
      if (res.success) {
        showToast(res.message || 'Usuario reasignado con éxito');
        setReassignModalUser(null);
        setTargetOfficeId('');
        await loadData();
      } else {
        alert(res.error || 'No se pudo reasignar el usuario');
      }
    } catch (e) {
      alert('Error al reasignar despacho');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    try {
      const res = await deleteSaasUserAction(deleteModalUser.id);
      if (res.success) {
        showToast('Usuario eliminado del sistema');
        setDeleteModalUser(null);
        await loadData();
      } else {
        alert(res.error || 'Error al eliminar usuario');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-zinc-200/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-800" />
            <span>Directorio Global de Usuarios (SaaS)</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supervisa, administra y gestiona credenciales de todos los integrantes de despachos.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-zinc-500', loading && 'animate-spin')} />
          <span>Refrescar</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, cargo o despacho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
          />
        </div>

        <div>
          <select
            value={officeFilter}
            onChange={(e) => setOfficeFilter(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
          >
            <option value="all">Todos los Despachos</option>
            {officesList.map((off) => (
              <option key={off.id} value={off.id}>{off.name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
          >
            <option value="all">Todos los Roles</option>
            <option value="diputado">Diputado Titular</option>
            <option value="secretario_tecnico">Secretario Técnico</option>
            <option value="coordinador_territorial">Coordinador Territorial</option>
            <option value="asesor_a">Asesor Legislativo A</option>
            <option value="asesor_b">Asesor Legislativo B</option>
            <option value="admin">Administrador de Despacho</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="pb-3">Usuario & Privilegios</th>
              <th className="pb-3">Despacho Asignado</th>
              <th className="pb-3">Cargo / Rol</th>
              <th className="pb-3">Estatus</th>
              <th className="pb-3 text-right">Acciones de Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {usersList.map((user) => {
              const isMasterSuperAdmin = user.email?.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();
              return (
                <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors group">
                  <td className="py-3">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isMasterSuperAdmin && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Crown className="w-3 h-3 text-amber-600" />
                              Superadmin Maestro
                            </span>
                          )}
                          {user.isSuperAdmin && !isMasterSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Superadmin
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="text-zinc-800 font-medium">{user.officeName || 'Sin despacho asignado'}</span>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                      {user.cargo || user.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      user.status === 'active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                      user.status === 'invited' && "bg-amber-50 text-amber-700 border-amber-200",
                      user.status === 'suspended' && "bg-red-50 text-red-700 border-red-200",
                    )}>
                      {user.status === 'invited' ? 'Invitación Pendiente' : user.status === 'suspended' ? 'Suspendido' : 'Activo'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Reset password */}
                      <button
                        onClick={() => {
                          setResetModalUser(user);
                          setNewPassword('');
                        }}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="Restablecer Contraseña"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Reassign office */}
                      <button
                        onClick={() => {
                          setReassignModalUser(user);
                          setTargetOfficeId(user.officeId || '');
                        }}
                        className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                        title="Reasignar a otro Despacho"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      {/* Toggle Superadmin role */}
                      {!isMasterSuperAdmin && (
                        <button
                          onClick={() => handleToggleSuperAdmin(user)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            user.isSuperAdmin 
                              ? "text-purple-600 hover:bg-purple-50" 
                              : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                          )}
                          title={user.isSuperAdmin ? "Quitar rol de Superadmin" : "Hacer Superadmin"}
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      )}

                      {/* Toggle suspend */}
                      {!isMasterSuperAdmin && (
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors cursor-pointer",
                            user.status === 'suspended' 
                              ? "text-emerald-600 hover:bg-emerald-50" 
                              : "text-amber-600 hover:bg-amber-50"
                          )}
                          title={user.status === 'suspended' ? "Activar cuenta" : "Suspender cuenta"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      {!isMasterSuperAdmin && (
                        <button
                          onClick={() => setDeleteModalUser(user)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL RESET PASSWORD */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Restablecer Contraseña</span>
              </h3>
              <button onClick={() => setResetModalUser(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <p className="text-xs text-zinc-500">
              Ingresa la nueva contraseña directa para <strong>{resetModalUser.name}</strong> ({resetModalUser.email}).
            </p>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña (mín 6 caracteres)"
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-400"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isResetting ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REASIGNAR DESPACHO */}
      {reassignModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>Reasignar Despacho</span>
              </h3>
              <button onClick={() => setReassignModalUser(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            <p className="text-xs text-zinc-500">
              Selecciona el nuevo despacho para <strong>{reassignModalUser.name}</strong>:
            </p>

            <form onSubmit={handleConfirmReassign} className="space-y-3">
              <select
                required
                value={targetOfficeId}
                onChange={(e) => setTargetOfficeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none"
              >
                <option value="">Selecciona un despacho...</option>
                {officesList.map((off) => (
                  <option key={off.id} value={off.id}>{off.name} (Plan {off.plan})</option>
                ))}
              </select>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalUser(null)}
                  className="px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !targetOfficeId}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isReassigning ? 'Reasignando...' : 'Confirmar Reasignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR USUARIO */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-zinc-200 max-w-sm w-full p-5 shadow-2xl text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">¿Eliminar este usuario del SaaS?</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Se eliminará permanentemente la cuenta de <strong>{deleteModalUser.email}</strong> y perderá acceso a todos los módulos.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-sm cursor-pointer"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
