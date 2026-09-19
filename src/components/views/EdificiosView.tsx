import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  MapPin, 
  User, 
  ShieldCheck, 
  Power, 
  X, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Search,
  Wrench
} from 'lucide-react';
import { Edificio, Usuario } from '../../types';

interface EdificiosViewProps {
  edificios: Edificio[];
  usuarios: Usuario[];
  currentUser?: Usuario;
  isSuperAdmin?: boolean;
  onCreateEdificio: (nuevo: { nombre: string; direccion: string; id_administrador?: string; administrador_actual?: string }) => void;
  onUpdateEdificio: (id: string, updates: Partial<Edificio>) => void;
  onDeleteEdificio: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export const EdificiosView: React.FC<EdificiosViewProps> = ({
  edificios,
  usuarios,
  currentUser,
  isSuperAdmin: propIsSuperAdmin,
  onCreateEdificio,
  onUpdateEdificio,
  onDeleteEdificio,
  onToggleActive,
}) => {
  const isSuperAdmin = currentUser?.rol === 'SuperAdmin' || propIsSuperAdmin === true;
  const isSupervisor = currentUser?.rol === 'Supervisor';
  const isAdmin = currentUser?.rol === 'Administrador';
  const isMantenimiento = currentUser?.rol === 'Mantenimiento';

  // Permissions according to role specifications:
  // SuperAdmin: Full access
  // Supervisor: Can create, modify, inactivate, but NOT delete
  // Admin & Mantenimiento: Can view only assigned buildings
  const canCreateOrEdit = isSuperAdmin || isSupervisor;
  const canToggleActive = isSuperAdmin || isSupervisor;
  const canDelete = isSuperAdmin; // Supervisor cannot delete

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEdificio, setEditingEdificio] = useState<Edificio | null>(null);
  const [deletingEdificio, setDeletingEdificio] = useState<Edificio | null>(null);
  
  // Create / Edit form fields
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [adminId, setAdminId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const admins = usuarios.filter((u) => u && (u.rol === 'Administrador' || u.rol === 'SuperAdmin'));

  const openCreateModal = () => {
    setEditingEdificio(null);
    setNombre('');
    setDireccion('');
    setAdminId(admins[0]?.id_usuario || '');
    setIsModalOpen(true);
  };

  const openEditModal = (ed: Edificio) => {
    setEditingEdificio(ed);
    setNombre(ed.nombre);
    setDireccion(ed.direccion || '');
    setAdminId(ed.id_administrador_actual || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const selectedAdmin = usuarios.find((u) => u.id_usuario === adminId);

    if (editingEdificio) {
      onUpdateEdificio(editingEdificio.id_edificio, {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        id_administrador_actual: adminId || undefined,
        administrador_actual: selectedAdmin ? selectedAdmin.nombre : editingEdificio.administrador_actual,
      });
    } else {
      onCreateEdificio({
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        id_administrador: adminId || undefined,
        administrador_actual: selectedAdmin?.nombre || 'Sin Administrador',
      });
    }

    setIsModalOpen(false);
    setEditingEdificio(null);
    setNombre('');
    setDireccion('');
  };

  // Visibility filter based on user role
  const visibleEdificios = edificios.filter((ed) => {
    if (isSuperAdmin || isSupervisor) return true;
    if (isAdmin || isMantenimiento) {
      if (currentUser?.id_edificio_asignado && currentUser.id_edificio_asignado === ed.id_edificio) return true;
      if (currentUser?.edificio_asignado && currentUser.edificio_asignado === ed.nombre) return true;
      if (currentUser?.edificios && currentUser.edificios.includes(ed.id_edificio)) return true;
      if (ed.id_administrador_actual && ed.id_administrador_actual === currentUser?.id_usuario) return true;
      if (ed.administrador_actual && ed.administrador_actual === currentUser?.nombre) return true;
      return false;
    }
    return true;
  });

  const baseEdificios = visibleEdificios.length > 0 ? visibleEdificios : edificios;

  const filteredEdificios = baseEdificios.filter((ed) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      ed.nombre?.toLowerCase().includes(term) ||
      ed.direccion?.toLowerCase().includes(term) ||
      ed.administrador_actual?.toLowerCase().includes(term) ||
      ed.id_edificio?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Directorio de Edificios y Complejos
            </h1>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5] text-[10px] font-bold">
                {currentUser.rol}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Gestión de propiedades, asignación de administradores y técnicos de mantenimiento
          </p>
        </div>

        {canCreateOrEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Edificio
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-md bg-white border border-[#e5eeff] rounded-xl px-3.5 py-2 shadow-xs">
        <Search className="w-4 h-4 text-[#64748b] shrink-0" />
        <input
          type="text"
          placeholder="Buscar edificio por nombre, dirección o administrador..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent text-xs text-[#0b1c30] placeholder-[#94a3b8] focus:outline-none"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs text-[#94a3b8] hover:text-[#0b1c30] cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Empty State */}
      {filteredEdificios.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-12 text-center bg-white">
          <Building className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#0b1c30]">No se encontraron edificios</h3>
          <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'No hay resultados que coincidan con la búsqueda actual.'
              : 'No hay edificios asignados a tu perfil en este momento.'}
          </p>
          {canCreateOrEdit && !searchTerm && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all cursor-pointer"
            >
              Crear Primer Edificio
            </button>
          )}
        </div>
      )}

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEdificios.map((ed) => {
          // Find maintenance technicians assigned to this building
          const assignedMantenimiento = usuarios.filter(
            (u) =>
              u.rol === 'Mantenimiento' &&
              (u.id_edificio_asignado === ed.id_edificio ||
                u.edificio_asignado === ed.nombre ||
                u.edificios?.includes(ed.id_edificio))
          );

          return (
            <div
              key={ed.id_edificio}
              className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-[#0051d5]">
                    {ed.id_edificio}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      ed.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {ed.activo ? 'Operativo' : 'Inactivo'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#0b1c30] mb-2 leading-snug">
                  {ed.nombre}
                </h3>

                <div className="flex items-center gap-2 text-xs text-[#64748b] mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                  <span className="truncate">{ed.direccion || 'Sin dirección registrada'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#64748b] p-2.5 bg-[#f8f9ff] rounded-lg border border-[#e5eeff] mb-2">
                  <User className="w-3.5 h-3.5 text-[#069669] shrink-0" />
                  <span className="truncate">
                    Admin: <strong>{ed.administrador_actual || 'Sin Administrador'}</strong>
                  </span>
                </div>

                {/* Técnicos de Mantenimiento asignados a este edificio */}
                <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs">
                  <div className="flex items-center gap-1.5 text-[#475569] font-semibold mb-1">
                    <Wrench className="w-3 h-3 text-[#0051d5]" />
                    <span>Mantenimiento Asignado:</span>
                  </div>
                  {assignedMantenimiento.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assignedMantenimiento.map((m) => (
                        <span
                          key={m.id_usuario}
                          className="px-2 py-0.5 rounded bg-white border border-[#cbd5e1] text-[11px] text-[#0b1c30] font-medium"
                        >
                          {m.nombre}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#94a3b8] italic">Sin técnico de mantenimiento asignado</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#069669] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Supabase
                </span>

                <div className="flex items-center gap-1.5">
                  {canCreateOrEdit && (
                    <button
                      type="button"
                      onClick={() => openEditModal(ed)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0051d5] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                      title="Editar edificio"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeletingEdificio(ed)}
                      className="p-1.5 rounded-lg text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Eliminar edificio (Solo SuperAdmin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {canToggleActive && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(ed.id_edificio)}
                      className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Power className="w-3 h-3" />
                      {ed.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear / Editar Edificio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">
                  {editingEdificio ? 'Editar Edificio en Supabase' : 'Registrar Nuevo Edificio en Supabase'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingEdificio(null);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre del Edificio / Complejo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Torre Empresarial Reforma"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Dirección / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Avenida Reforma 12-01, Zona 10, Ciudad de Guatemala"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Administrador Responsable</label>
                <select
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  <option value="">-- Sin Administrador Asignado --</option>
                  {admins.map((adm) => (
                    <option key={adm.id_usuario} value={adm.id_usuario}>
                      {adm.nombre} ({adm.rol}) - {adm.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingEdificio(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {editingEdificio ? 'Guardar Cambios' : 'Crear Edificio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación (Solo SuperAdmin) */}
      {deletingEdificio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base text-white">Eliminar Edificio</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingEdificio(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs text-[#0b1c30]">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente de Supabase el siguiente edificio?
              </p>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="font-bold text-sm text-red-950">{deletingEdificio.nombre}</div>
                <div className="text-red-800 font-mono text-[11px] mt-0.5">ID: {deletingEdificio.id_edificio}</div>
                <div className="text-red-700 text-[11px] mt-1">
                  Admin: {deletingEdificio.administrador_actual || 'Sin Administrador'}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingEdificio(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEdificio(deletingEdificio.id_edificio);
                    setDeletingEdificio(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Sí, Eliminar Edificio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
