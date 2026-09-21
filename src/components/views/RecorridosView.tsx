import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Plus, 
  Calendar, 
  User, 
  Building, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle,
  Filter,
  X,
  FileCheck,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Recorrido, Edificio, Usuario } from '../../types';

interface RecorridosViewProps {
  recorridos: Recorrido[];
  edificios: Edificio[];
  usuarios: Usuario[];
  currentUser?: Usuario;
  onOpenRecorrido: (recorrido: Recorrido) => void;
  onCreateRecorrido: (nuevo: Partial<Recorrido>) => void;
  onUpdateRecorrido?: (id: string, updates: Partial<Recorrido>) => void;
  onDeleteRecorrido?: (id: string) => void;
  initialFilterStatus?: string;
}

export const RecorridosView: React.FC<RecorridosViewProps> = ({
  recorridos,
  edificios,
  usuarios,
  currentUser,
  onOpenRecorrido,
  onCreateRecorrido,
  onUpdateRecorrido,
  onDeleteRecorrido,
  initialFilterStatus = '',
}) => {
  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';
  const isSupervisor = currentUser?.rol === 'Supervisor';
  const isAdmin = currentUser?.rol === 'Administrador';
  const isMantenimiento = currentUser?.rol === 'Mantenimiento';

  // Available buildings for current user
  const availableEdificios = edificios.filter((e) => {
    if (isSuperAdmin || isSupervisor) return true;
    if (isAdmin || isMantenimiento) {
      if (currentUser?.id_edificio_asignado && currentUser.id_edificio_asignado === e.id_edificio) return true;
      if (currentUser?.edificio_asignado && currentUser.edificio_asignado === e.nombre) return true;
      if (currentUser?.edificios && currentUser.edificios.includes(e.id_edificio)) return true;
      if (e.id_administrador_actual && e.id_administrador_actual === currentUser?.id_usuario) return true;
      if (e.administrador_actual && e.administrador_actual === currentUser?.nombre) return true;
      return false;
    }
    return true;
  });

  // Effective list of buildings (fallback to all if filter resulted in none)
  const userEdificios = availableEdificios.length > 0 ? availableEdificios : edificios;

  const [filterEdificio, setFilterEdificio] = useState('');
  const [filterEstado, setFilterEstado] = useState(initialFilterStatus);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Helper to find default inspector for a building
  const getInspectorForBuilding = (buildingId: string): string => {
    const bld = edificios.find((e) => e.id_edificio === buildingId);
    // 1. Look for maintenance or administrator assigned to this building
    const assignedUser = usuarios.find((u) => 
      (u.id_edificio_asignado === buildingId || (bld && u.edificio_asignado === bld.nombre) || u.edificios?.includes(buildingId))
    );
    if (assignedUser) return assignedUser.email;

    // 2. Match with bld.administrador_actual
    if (bld?.administrador_actual) {
      const matchAdmin = usuarios.find((u) => u.nombre === bld.administrador_actual || u.email === bld.administrador_actual);
      if (matchAdmin) return matchAdmin.email;
    }

    // 3. Current user or first inspector
    return currentUser?.email || usuarios[0]?.email || '';
  };

  // New Recorrido Form State
  const initialEdificioId = userEdificios[0]?.id_edificio || '';
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEdificio, setNuevoEdificio] = useState(initialEdificioId);
  const [nuevaFecha, setNuevaFecha] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState('');
  const [nuevoCierreAuto, setNuevoCierreAuto] = useState(true);
  const [nuevoInspector, setNuevoInspector] = useState(getInspectorForBuilding(initialEdificioId));
  const [nuevasObservaciones, setNuevasObservaciones] = useState('');
  const [formError, setFormError] = useState('');

  // Edit Recorrido State
  const [editingRecorrido, setEditingRecorrido] = useState<Recorrido | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editEdificio, setEditEdificio] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editFechaCierre, setEditFechaCierre] = useState('');
  const [editCierreAuto, setEditCierreAuto] = useState(true);
  const [editInspector, setEditInspector] = useState('');
  const [editEstado, setEditEstado] = useState<'Programado' | 'En Proceso' | 'Completado' | 'Cancelado'>('Programado');
  const [editObservaciones, setEditObservaciones] = useState('');
  const [editError, setEditError] = useState('');

  // Delete Recorrido State
  const [deletingRecorrido, setDeletingRecorrido] = useState<Recorrido | null>(null);

  // When changing building in New Modal, auto-select assigned user
  const handleEdificioChangeNew = (bldId: string) => {
    setNuevoEdificio(bldId);
    const autoInspector = getInspectorForBuilding(bldId);
    if (autoInspector) {
      setNuevoInspector(autoInspector);
    }
  };

  // When changing building in Edit Modal, auto-select assigned user
  const handleEdificioChangeEdit = (bldId: string) => {
    setEditEdificio(bldId);
    const autoInspector = getInspectorForBuilding(bldId);
    if (autoInspector) {
      setEditInspector(autoInspector);
    }
  };

  // Permission check: only SuperAdmin or the creator/inspector of the Recorrido can edit/delete
  const canModifyRecorrido = (r: Recorrido): boolean => {
    if (isSuperAdmin) return true;
    if (!currentUser) return false;
    if (r.creado_por && r.creado_por.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (r.inspector_email && r.inspector_email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (r.inspector_nombre && currentUser.nombre && r.inspector_nombre.toLowerCase() === currentUser.nombre.toLowerCase()) return true;
    return false;
  };

  const handleOpenEdit = (r: Recorrido) => {
    setEditingRecorrido(r);
    setEditNombre(r.nombre);
    setEditEdificio(r.id_edificio);
    setEditFecha(r.fecha_programada ? r.fecha_programada.slice(0, 16) : '');
    setEditFechaCierre(r.fecha_cierre_programada ? r.fecha_cierre_programada.slice(0, 16) : '');
    setEditCierreAuto(r.cierre_automatico ?? true);
    setEditInspector(r.inspector_email);
    setEditEstado((r.estado as any) || 'Programado');
    setEditObservaciones(r.observaciones || '');
    setEditError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecorrido || !onUpdateRecorrido) return;

    if (!editNombre.trim() || !editEdificio || !editFecha || !editInspector) {
      setEditError('Por favor complete todos los campos obligatorios.');
      return;
    }

    const building = edificios.find((ed) => ed.id_edificio === editEdificio);
    const inspectorUser = usuarios.find((u) => u.email === editInspector);

    onUpdateRecorrido(editingRecorrido.id_recorrido, {
      nombre: editNombre.trim(),
      id_edificio: editEdificio,
      edificio_nombre: building?.nombre,
      fecha_programada: editFecha,
      fecha_cierre_programada: editFechaCierre || undefined,
      cierre_automatico: editCierreAuto,
      inspector_email: editInspector,
      inspector_nombre: inspectorUser?.nombre || editInspector,
      estado: editEstado,
      observaciones: editObservaciones.trim(),
    });

    setEditingRecorrido(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingRecorrido || !onDeleteRecorrido) return;
    onDeleteRecorrido(deletingRecorrido.id_recorrido);
    setDeletingRecorrido(null);
  };

  // Filter recorridos based on user role and UI filters
  const filtered = recorridos.filter((r) => {
    // Role-based visibility
    if (isAdmin || isMantenimiento) {
      const allowedBuildingIds = userEdificios.map((e) => e.id_edificio);
      const allowedBuildingNames = userEdificios.map((e) => e.nombre);
      const isInBuilding = allowedBuildingIds.includes(r.id_edificio) || allowedBuildingNames.includes(r.edificio_nombre || '');
      if (!isInBuilding && !canModifyRecorrido(r)) return false;
    }

    if (filterEdificio && r.id_edificio !== filterEdificio) return false;
    if (filterEstado && r.estado !== filterEstado) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEdificio || !nuevaFecha || !nuevoInspector) {
      setFormError('Por favor complete nombre, edificio, fecha programada e inspector.');
      return;
    }

    const building = edificios.find((ed) => ed.id_edificio === nuevoEdificio);
    const inspectorUser = usuarios.find((u) => u.email === nuevoInspector);

    onCreateRecorrido({
      nombre: nuevoNombre.trim(),
      id_edificio: nuevoEdificio,
      edificio_nombre: building?.nombre,
      fecha_programada: nuevaFecha,
      fecha_cierre_programada: nuevaFechaCierre || undefined,
      cierre_automatico: nuevoCierreAuto,
      inspector_email: nuevoInspector,
      inspector_nombre: inspectorUser?.nombre || nuevoInspector,
      estado: 'Programado',
      observaciones: nuevasObservaciones.trim(),
      creado_por: currentUser?.email || 'admin@eazyops.gt',
      checkpoints_count: 8,
      hallazgos_count: 0,
    });

    setIsNewModalOpen(false);
    setNuevoNombre('');
    setNuevasObservaciones('');
    setFormError('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Recorridos de Inspección
            </h1>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5] text-[10px] font-bold">
                {currentUser.rol}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Programación, ejecución y auditorías físicas de infraestructura
          </p>
        </div>

        {/* SuperAdmin, Supervisor and Admin can create recorridos */}
        {!isMantenimiento && (
          <button
            type="button"
            onClick={() => {
              const bldId = userEdificios[0]?.id_edificio || '';
              setNuevoEdificio(bldId);
              setNuevoInspector(getInspectorForBuilding(bldId));
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Recorrido
          </button>
        )}
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white border border-[#e5eeff] rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
          <Filter className="w-4 h-4 text-[#0051d5]" />
          <span>Filtrar:</span>
        </div>

        <select
          value={filterEdificio}
          onChange={(e) => setFilterEdificio(e.target.value)}
          className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-medium border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
        >
          <option value="">Todos los edificios</option>
          {userEdificios.map((e) => (
            <option key={e.id_edificio} value={e.id_edificio}>
              {e.nombre}
            </option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-medium border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
        >
          <option value="">Todos los estados</option>
          <option value="Programado">Programados</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completado">Completados</option>
          <option value="Cancelado">Cancelados</option>
        </select>

        {(filterEdificio || filterEstado) && (
          <button
            type="button"
            onClick={() => {
              setFilterEdificio('');
              setFilterEstado('');
            }}
            className="text-xs text-[#0051d5] hover:underline font-semibold ml-auto cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Recorridos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const isCurrentSigned = r.id_recorrido === 'REC-2024-089';
          const canEditOrDelete = canModifyRecorrido(r);

          return (
            <div
              key={r.id_recorrido}
              className={`rounded-xl bg-white border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                isCurrentSigned ? 'border-[#0051d5]/40 ring-1 ring-[#0051d5]/20' : 'border-[#e5eeff]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold text-[#0051d5] uppercase tracking-wider">
                    {r.id_recorrido}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.estado === 'En Proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : r.estado === 'Completado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.estado === 'Programado'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.estado}
                    </span>

                    {/* Botones de Editar y Eliminar para SuperAdmin o Creador */}
                    {canEditOrDelete && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="p-1 rounded-md text-[#64748b] hover:text-[#0051d5] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                          title="Editar recorrido (SuperAdmin o Creador)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRecorrido(r)}
                          className="p-1 rounded-md text-[#64748b] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar recorrido (SuperAdmin o Creador)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-[#0b1c30] leading-snug line-clamp-2">
                  {r.nombre}
                </h3>

                <div className="flex flex-col gap-1.5 mt-3 text-xs text-[#64748b]">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                    <span className="truncate text-[#0b1c30] font-medium">
                      {r.edificio_nombre || r.id_edificio}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span>
                      {new Date(r.fecha_programada).toLocaleDateString('es-GT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="truncate">{r.inspector_nombre || r.inspector_email}</span>
                  </div>
                </div>

                {r.cierre_automatico && (
                  <div className="mt-2.5 px-2 py-1 rounded bg-[#eff4ff] text-[#0051d5] text-[11px] font-medium flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Cierre automático programado
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
                <span className="text-[11px] text-[#64748b]">
                  {r.checkpoints_count || 8} checkpoints
                </span>

                <button
                  type="button"
                  onClick={() => onOpenRecorrido(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentSigned
                      ? 'bg-[#0051d5] text-white hover:bg-[#0041ab] shadow-sm'
                      : 'bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe]'
                  }`}
                >
                  <span>{isCurrentSigned ? 'Auditoría en Curso' : 'Ver Detalles'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-white border border-[#e5eeff] shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#0051d5] flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#0b1c30]">No se encontraron recorridos</h3>
          <p className="text-xs text-[#64748b] mt-1">
            {filterEdificio || filterEstado
              ? 'Prueba a cambiar o limpiar los filtros seleccionados.'
              : 'No hay recorridos registrados en este momento para tus edificios asignados.'}
          </p>
        </div>
      )}

      {/* Modal: Nuevo Recorrido */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Programar Nuevo Recorrido</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Título del Recorrido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Recorrido Rutinario de Seguridad y Mantenimiento"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Edificio / Complejo *</label>
                  <select
                    value={nuevoEdificio}
                    onChange={(e) => handleEdificioChangeNew(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {userEdificios.map((ed) => (
                      <option key={ed.id_edificio} value={ed.id_edificio}>
                        {ed.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Inspector / Asignado *</label>
                  <select
                    value={nuevoInspector}
                    onChange={(e) => setNuevoInspector(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.email}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Fecha y Hora Programada *</label>
                  <input
                    type="datetime-local"
                    required
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Fecha Cierre Estimada</label>
                  <input
                    type="datetime-local"
                    value={nuevaFechaCierre}
                    onChange={(e) => setNuevaFechaCierre(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkAutoClose"
                  checked={nuevoCierreAuto}
                  onChange={(e) => setNuevoCierreAuto(e.target.checked)}
                  className="w-4 h-4 accent-[#0051d5] rounded cursor-pointer"
                />
                <label htmlFor="chkAutoClose" className="text-xs text-[#0b1c30] font-medium cursor-pointer">
                  Activar cierre automático al vencer fecha de cierre
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Observaciones / Instrucciones</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre áreas de enfoque o checkpoints prioritarios..."
                  value={nuevasObservaciones}
                  onChange={(e) => setNuevasObservaciones(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Guardar Recorrido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Recorrido (SuperAdmin o Creador) */}
      {editingRecorrido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#0051d5] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-bold text-base text-white">Editar Recorrido</h3>
                  <p className="text-[11px] text-white/80 font-mono">{editingRecorrido.id_recorrido}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRecorrido(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {editError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Título del Recorrido *</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Edificio / Complejo *</label>
                  <select
                    value={editEdificio}
                    onChange={(e) => handleEdificioChangeEdit(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {userEdificios.map((ed) => (
                      <option key={ed.id_edificio} value={ed.id_edificio}>
                        {ed.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Inspector / Asignado *</label>
                  <select
                    value={editInspector}
                    onChange={(e) => setEditInspector(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {usuarios.map((u) => (
                      <option key={u.id_usuario} value={u.email}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Fecha Programada *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Estado del Recorrido</label>
                  <select
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="Programado">Programado</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkEditAutoClose"
                  checked={editCierreAuto}
                  onChange={(e) => setEditCierreAuto(e.target.checked)}
                  className="w-4 h-4 accent-[#0051d5] rounded cursor-pointer"
                />
                <label htmlFor="chkEditAutoClose" className="text-xs text-[#0b1c30] font-medium cursor-pointer">
                  Activar cierre automático
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Observaciones / Instrucciones</label>
                <textarea
                  rows={3}
                  value={editObservaciones}
                  onChange={(e) => setEditObservaciones(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingRecorrido(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0051d5] hover:bg-[#0041ab] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación (SuperAdmin o Creador) */}
      {deletingRecorrido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base text-white">Eliminar Recorrido</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingRecorrido(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs text-[#0b1c30]">
              <p>
                ¿Estás seguro de que deseas eliminar este recorrido? Esta acción eliminará el registro y sus checkpoints asociados.
              </p>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="font-bold text-sm text-red-950">{deletingRecorrido.nombre}</div>
                <div className="text-red-800 font-mono text-[11px] mt-0.5">ID: {deletingRecorrido.id_recorrido}</div>
                <div className="text-red-700 text-[11px] mt-1">
                  Edificio: {deletingRecorrido.edificio_nombre || deletingRecorrido.id_edificio}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingRecorrido(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Sí, Eliminar Recorrido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
