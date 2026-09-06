import { Users, UserPlus } from 'lucide-react';

export default function EquipoPage() {
  const team = [
    { name: 'Dip. Ruben Roque', role: 'Titular de Despacho / Diputado Federal', email: 'ruben.roque@diputados.gob.mx', badge: 'Diputado' },
    { name: 'Lic. Mariana Soto', role: 'Coordinadora de Gestión y Territorio', email: 'mariana.soto@legislab.mx', badge: 'Asesor A' },
    { name: 'Lic. Roberto Garza', role: 'Secretario Técnico y Redacción Legislativa', email: 'roberto.garza@legislab.mx', badge: 'Secretario Técnico' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Equipo y Asesores Parlamentarios
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión de roles, permisos y colaboración en el despacho.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Invitar Asesor
        </button>
      </div>


      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {team.map((m, i) => (
          <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                {m.name.split(' ').map(n => n[0]).slice(-2).join('')}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-xm">{m.name}</h3>
                <p className="text-xs text-slate-500">{m.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {m.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
