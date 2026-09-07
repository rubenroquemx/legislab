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
  UserPlus
} from 'lucide-react';
import { getSaasUsersAction } from '@/app/actions/saas-admin';
import { cn } from '@/lib/utils';

export default function SaasUsuariosPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await getSaasUsersAction({
        search: searchTerm,
        role: roleFilter,
      });
      if (res.success && res.data) {
        setUsersList(res.data);
      }
    } catch (e) {
      console.warn('Error loading SaaS users:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-zinc-200/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-800" />
            <span>Directorio Global de Usuarios</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Supervisa todos los usuarios registrados en los despachos de la plataforma.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5 text-zinc-500', loading && 'animate-spin')} />
          <span>Refrescar</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-400"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-zinc-50/70 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-zinc-400"
          >
            <option value="all">Todos los Roles</option>
            <option value="diputado">Diputado Titular</option>
            <option value="secretario_tecnico">Secretario Técnico / Coord. Atención</option>
            <option value="coordinador_territorial">Coordinador Territorial</option>
            <option value="asesor_a">Asesor Legislativo A</option>
            <option value="asesor_b">Asesor Legislativo B</option>
            <option value="admin">Administrador de Despacho</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <tr>
              <th className="pb-3">Usuario</th>
              <th className="pb-3">Despacho Asignado</th>
              <th className="pb-3">Rol / Cargo</th>
              <th className="pb-3">Contacto</th>
              <th className="pb-3 text-right">Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {usersList.map((user) => (
              <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors group">
                <td className="py-3">
                  <div className="font-semibold text-zinc-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-700">
                      {user.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div>{user.name}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="text-zinc-800 font-medium">{user.officeName || 'Despacho Principal'}</span>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800 border border-zinc-200 capitalize">
                    {user.cargo || user.role}
                  </span>
                </td>
                <td className="py-3">
                  <span className="font-mono text-zinc-600 text-[11px]">{user.phone || 'Sin teléfono'}</span>
                </td>
                <td className="py-3 text-right text-[11px] text-zinc-500">
                  {new Date(user.createdAt).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}