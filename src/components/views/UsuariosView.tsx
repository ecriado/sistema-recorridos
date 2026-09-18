import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  Mail, 
  Building, 
  Power, 
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  Check,
  Building2,
  Lock
} from 'lucide-react';
import { Usuario, Edificio, UserRole } from '../../types';

interface UsuariosViewProps {
  usuarios: Usuario[];
  edificios: Edificio[];
  currentUser?: Usuario;
  isSuperAdmin: boolean;
  onCreateUsuario: (nuevo: Partial<Usuario>) => void;
  onUpdateUsuario: (id: string, updates: Partial<Usuario>) => void;
  onDeleteUsuario: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const UsuariosView: React.FC<UsuariosViewProps> = ({
  usuarios,
  edificios,
  currentUser,
  isSuperAdmin,
  onCreateUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  onToggleActive,
}) => {
  // New User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('Administrador');
  const [login, setLogin] = useState('');
  const [selectedEdificios, setSelectedEdificios] = useState<string[]>([]);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRol, setEditRol] = useState<UserRole>('Administrador');
  const [editLogin, setEditLogin] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [editEdificios, setEditEdificios] = useState<string[]>([]);

  // Delete Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('todos');

  const handleOpenCreateModal = () => {
    setNombre('');
    setEmail('');
    setLogin('');
    setRol('Administrador');
    setSelectedEdificios(edificios.slice(0, 3).map((e) => e.id_edificio));
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !login.trim()) return;

    onCreateUsuario({
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      rol,
      usuario_login: login.trim().toLowerCase(),
      activo: true,
      edificios: selectedEdificios.length > 0 ? selectedEdificios : edificios.map((e) => e.id_edificio),
    });

    setIsModalOpen(false);
  };

  const handleOpenEditModal = (u: Usuario) => {
    setEditingUser(u);
    setEditNombre(u.nombre);
    setEditEmail(u.email);
    setEditRol(u.rol);
    setEditLogin(u.usuario_login || u.email.split('@')[0]);
    setEditActivo(u.activo !== false);
    setEditEdificios(u.edificios || []);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editNombre.trim() || !editEmail.trim()) return;

    onUpdateUsuario(editingUser.id_usuario, {
      nombre: editNombre.trim(),
      email: editEmail.trim().toLowerCase(),
      rol: editRol,
      usuario_login: editLogin.trim().toLowerCase(),
      activo: editActivo,
      edificios: editEdificios,
    });

    setEditingUser(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    onDeleteUsuario(deletingUser.id_usuario);
    setDeletingUser(null);
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesRole = filterRole === 'todos' || u.rol === filterRole;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.nombre.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.usuario_login.toLowerCase().includes(term) ||
      u.id_usuario.toLowerCase().includes(term);
    return matchesRole && matchesSearch;
  });

  const getRoleBadgeStyle = (userRol: UserRole) => {
    switch (userRol) {
      case 'SuperAdmin':
        return 'bg-[#eff4ff] text-[#0051d5] border-[#0051d5]/30';
      case 'Supervisor':
        return 'bg-[#ecfdf5] text-[#047857] border-[#047857]/30';
      case 'Administrador':
        return 'bg-[#fffbeb] text-[#b45309] border-[#b45309]/30';
      case 'Mantenimiento':
        return 'bg-[#f8fafc] text-[#475569] border-[#cbd5e1]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Gestión de Usuarios y Permisos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0051d5] text-white text-[10px] font-mono font-bold">
              SuperAdmin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Administración completa de cuentas, roles de seguridad y sincronización en tiempo real con Supabase.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Registrar Usuario
          </button>
        )}
      </div>

      {/* SuperAdmin Notice / Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-2xl border border-[#e5eeff] shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, login o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#f8f9ff] text-[#0b1c30] rounded-xl border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'SuperAdmin', 'Supervisor', 'Administrador', 'Mantenimiento'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterRole === r
                  ? 'bg-[#0051d5] text-white shadow-xs'
                  : 'bg-[#f8f9ff] text-[#64748b] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
              }`}
            >
              {r === 'todos' ? `Todos (${usuarios.length})` : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsuarios.map((u) => {
          const isCurrentSession = currentUser?.id_usuario === u.id_usuario;

          return (
            <div
              key={u.id_usuario}
              className={`rounded-2xl bg-white border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isCurrentSession ? 'border-[#0051d5] ring-1 ring-[#0051d5]/20' : 'border-[#e5eeff]'
              }`}
            >
              <div>
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#0051d5] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                      {u.id_usuario}
                    </span>
                    {isCurrentSession && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0051d5] text-white">
                        Tú
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      u.activo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {u.activo ? 'Activo' : 'Inhabilitado'}
                  </span>
                </div>

                {/* User Info */}
                <h3 className="font-bold text-base text-[#0b1c30] leading-tight mb-1">
                  {u.nombre}
                </h3>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border mb-3 mt-1"
                  style={{}}
                >
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getRoleBadgeStyle(u.rol)}`}>
                    Rol: {u.rol}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-xs text-[#64748b]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="truncate font-medium text-[#0b1c30]">{u.email}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span>Login: <code className="font-mono text-[#0051d5] font-semibold">{u.usuario_login || u.email.split('@')[0]}</code></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span>
                      {u.edificios && u.edificios.length > 0 
                        ? `${u.edificios.length} edificio(s) asignado(s)` 
                        : 'Todos los edificios'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for SuperAdmin */}
              <div className="mt-5 pt-3 border-t border-[#f1f5f9] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleActive(u.id_usuario)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    u.activo
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title={u.activo ? 'Deshabilitar acceso' : 'Reactivar acceso'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{u.activo ? 'Inhabilitar' : 'Habilitar'}</span>
                </button>

                {isSuperAdmin && (
                  <div className="flex items-center gap-1.5">
                    {/* Botón Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(u)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      title="Editar usuario (SuperAdmin)"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => setDeletingUser(u)}
                      disabled={isCurrentSession}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                      title={isCurrentSession ? 'No puedes eliminar tu propia cuenta en sesión' : 'Eliminar usuario de Supabase'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsuarios.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e5eeff] text-[#64748b]">
          <Users className="w-10 h-10 mx-auto text-[#94a3b8] mb-3" />
          <p className="font-semibold text-sm text-[#0b1c30]">No se encontraron usuarios</p>
          <p className="text-xs mt-1">Prueba cambiando los filtros o el término de búsqueda.</p>
        </div>
      )}

      {/* Modal: Registrar Nuevo Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#0b1c30] text-white p-5 flex items-center justify-between border-b border-[#213145]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0051d5] flex items-center justify-center text-white">
                  <Users className="w-5 h-5 text-[#85f8c4]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Registrar Nuevo Usuario</h3>
                  <p className="text-xs text-[#bcc7df]">Sincronización directa con tabla usuarios de Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Mario Gómez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
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
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
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
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Rol en el Sistema</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as UserRole)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                >
                  <option value="SuperAdmin">SuperAdmin (Acceso total & Diagnóstico)</option>
                  <option value="Supervisor">Supervisor de Calidad y Auditorías</option>
                  <option value="Administrador">Administrador de Propiedad</option>
                  <option value="Mantenimiento">Técnico de Mantenimiento</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm cursor-pointer"
                >
                  Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario (SUPERADMIN) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#0051d5] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Editar Usuario</h3>
                  <p className="text-xs text-white/80">Modificando ID: {editingUser.id_usuario}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Usuario Login</label>
                  <input
                    type="text"
                    required
                    value={editLogin}
                    onChange={(e) => setEditLogin(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Rol en el Sistema</label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as UserRole)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Estado de Cuenta</label>
                  <select
                    value={editActivo ? 'true' : 'false'}
                    onChange={(e) => setEditActivo(e.target.value === 'true')}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-xl text-xs border border-[#d3e4fe] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="true">Activo (Habilitado)</option>
                    <option value="false">Inhabilitado (Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Selector de Edificios Asignados */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#0b1c30]">
                    Edificios Asignados ({editEdificios.length} seleccionados)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editEdificios.length === edificios.length) {
                        setEditEdificios([]);
                      } else {
                        setEditEdificios(edificios.map((e) => e.id_edificio));
                      }
                    }}
                    className="text-[11px] text-[#0051d5] hover:underline font-semibold"
                  >
                    {editEdificios.length === edificios.length ? 'Deseleccionar todos' : 'Asignar todos'}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto border border-[#d3e4fe] rounded-xl p-2 bg-[#f8f9ff] flex flex-col gap-1.5">
                  {edificios.map((ed) => {
                    const isChecked = editEdificios.includes(ed.id_edificio);
                    return (
                      <label
                        key={ed.id_edificio}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs text-[#0b1c30] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditEdificios([...editEdificios, ed.id_edificio]);
                            } else {
                              setEditEdificios(editEdificios.filter((id) => id !== ed.id_edificio));
                            }
                          }}
                          className="rounded text-[#0051d5] focus:ring-[#0051d5]"
                        />
                        <span className="font-medium">{ed.nombre}</span>
                        <span className="text-[10px] text-[#64748b] ml-auto">{ed.id_edificio}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm cursor-pointer"
                >
                  Guardar Cambios en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación (SUPERADMIN) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Eliminar Usuario</h3>
                  <p className="text-xs text-white/80">Acción permanente en Supabase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs text-[#0b1c30]">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente de Supabase al siguiente usuario?
              </p>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="font-bold text-sm text-red-950">{deletingUser.nombre}</div>
                <div className="text-red-800 font-mono text-[11px] mt-0.5">{deletingUser.email}</div>
                <div className="text-red-700 text-[11px] mt-1">
                  Rol: <strong>{deletingUser.rol}</strong> • ID: <code>{deletingUser.id_usuario}</code>
                </div>
              </div>

              <p className="text-[11px] text-[#64748b]">
                Esta acción ejecutará una sentencia <code>DELETE FROM usuarios</code> en tu base de datos de PostgreSQL. No se podrá recuperar.
              </p>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Sí, Eliminar de Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
