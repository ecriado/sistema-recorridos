import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  Building, 
  Power, 
  X 
} from 'lucide-react';
import { Usuario, Edificio, UserRole } from '../../types';

interface UsuariosViewProps {
  usuarios: Usuario[];
  edificios: Edificio[];
  onCreateUsuario: (nuevo: Partial<Usuario>) => void;
  onToggleActive: (id: string) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  edificios,
  onCreateUsuario,
  onToggleActive,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('Administrador');
  const [login, setLogin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !login.trim()) return;

    onCreateUsuario({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
      usuario_login: login.trim().toLowerCase(),
      activo: true,
      edificios: edificios.map((e) => e.id_edificio),
    });

    setIsModalOpen(false);
    setNombre('');
    setEmail('');
    setLogin('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Gestión de Usuarios y Accesos
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Roles de operación, permisos por edificio y autenticación (Supabase Auth / RLS)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Usuario
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map((u) => (
          <div
            key={u.id_usuario}
            className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-[#0051d5]">
                  {u.id_usuario}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {u.activo ? 'Activo' : 'Inhabilitado'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#0b1c30] mb-1">
                {u.nombre}
              </h3>

              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff4ff] text-[#0051d5] mb-3">
                <ShieldCheck className="w-3 h-3" />
                Rol: {u.rol}
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-[#64748b]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                  <span className="truncate">{u.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                  <span>Login: <code className="font-mono text-[#0051d5]">{u.usuario_login}</code></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
              <span className="text-[11px] text-[#64748b]">
                {u.edificios?.length || 0} edificios asignados
              </span>
              <button
                type="button"
                onClick={() => onToggleActive(u.id_usuario)}
                className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Power className="w-3 h-3" />
                {u.activo ? 'Inhabilitar' : 'Habilitar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Registrar Nuevo Usuario</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Mario Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="mario.gomez@eazyops.gt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Usuario Login</label>
                  <input
                    type="text"
                    required
                    placeholder="mario.gomez"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Rol en el Sistema</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as UserRole)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  <option value="Administrador">Administrador de Propiedad</option>
                  <option value="Supervisor">Supervisor de Calidad y Auditorías</option>
                  <option value="Mantenimiento">Técnico de Mantenimiento</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm"
                >
                  Crear Usuario en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
