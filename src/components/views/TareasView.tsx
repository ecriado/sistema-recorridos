import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Plus,
  Layers,
  Filter,
  CheckCircle2,
  Building,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Search,
  X,
  Camera,
  Check,
  ArrowUpDown,
  Trash2,
  Lock,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { Tarea, Edificio, Usuario, TareaPrioridad, TareaEstado } from '../../types';

interface TareasViewProps {
  tareas: Tarea[];
  edificios: Edificio[];
  usuarios: Usuario[];
  currentUser?: Usuario;
  onCreateTarea: (nueva: Partial<Tarea>) => void;
  onUpdateTarea: (id: string, updates: Partial<Tarea>) => void;
  onDeleteTarea?: (id: string) => void;
  onCreateLoteMasivo: (lote: { titulo: string; prioridad: TareaPrioridad; fecha_limite: string; instrucciones: string; edificios: string[] }) => void;
  initialSelectId?: string;
  initialSubview?: 'lista' | 'nueva' | 'lote';
  initialFilterEstado?: string;
  initialFilterEdificio?: string;
  initialFilterVencidas?: boolean;
}

export const TareasView: React.FC<TareasViewProps> = ({
  tareas,
  edificios,
  usuarios,
  currentUser,
  onCreateTarea,
  onUpdateTarea,
  onDeleteTarea,
  onCreateLoteMasivo,
  initialSelectId = '',
  initialSubview = 'lista',
  initialFilterEstado = '',
  initialFilterEdificio = '',
  initialFilterVencidas = false,
}) => {
  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';
  const isSupervisor = currentUser?.rol === 'Supervisor';
  const isAdmin = currentUser?.rol === 'Administrador';
  const isMantenimiento = currentUser?.rol === 'Mantenimiento';

  // Filter buildings accessible to current user
  const userEdificios = useMemo(() => {
    if (isSuperAdmin || isSupervisor || !currentUser) return edificios;
    return edificios.filter(
      (ed) =>
        (currentUser.id_edificio_asignado && currentUser.id_edificio_asignado === ed.id_edificio) ||
        (currentUser.edificio_asignado && currentUser.edificio_asignado === ed.nombre) ||
        (currentUser.edificios && currentUser.edificios.includes(ed.id_edificio)) ||
        (ed.id_administrador_actual && ed.id_administrador_actual === currentUser.id_usuario) ||
        (ed.administrador_actual && ed.administrador_actual === currentUser.nombre)
    );
  }, [edificios, currentUser, isSuperAdmin, isSupervisor]);

  const activeEdificios = userEdificios.length > 0 ? userEdificios : edificios;

  // Helper to find default assigned technician/admin for a building
  const getAssignedUserForBuilding = (bldId: string) => {
    const bld = edificios.find((b) => b.id_edificio === bldId);
    // Prefer Mantenimiento assigned to this building
    const mant = usuarios.find(
      (u) =>
        u.rol === 'Mantenimiento' &&
        ((u.id_edificio_asignado && u.id_edificio_asignado === bldId) ||
          (bld && u.edificio_asignado === bld.nombre) ||
          (u.edificios && u.edificios.includes(bldId)))
    );
    if (mant) return mant;

    // Next check Admin assigned to this building
    const admin = usuarios.find(
      (u) =>
        ((u.id_edificio_asignado && u.id_edificio_asignado === bldId) ||
          (bld && u.edificio_asignado === bld.nombre) ||
          (u.edificios && u.edificios.includes(bldId)) ||
          (bld && (u.id_usuario === bld.id_administrador_actual || u.nombre === bld.administrador_actual)))
    );
    if (admin) return admin;

    // Fallback to first maintenance user
    const firstMant = usuarios.find((u) => u.rol === 'Mantenimiento');
    return firstMant || usuarios[0];
  };

  const [subview, setSubview] = useState<'lista' | 'nueva' | 'lote'>(initialSubview);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recientes' | 'antiguas' | 'limite_cercano'>('recientes');
  const [filterEdificio, setFilterEdificio] = useState(initialFilterEdificio);
  const [filterEstado, setFilterEstado] = useState(initialFilterEstado);
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterSoloVencidas, setFilterSoloVencidas] = useState(initialFilterVencidas);
  const [selectedTareaId, setSelectedTareaId] = useState(initialSelectId || '');

  // Delete modal state
  const [deletingTarea, setDeletingTarea] = useState<Tarea | null>(null);

  // Resolve modal state
  const [resolvingTarea, setResolvingTarea] = useState<Tarea | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState<string>('');

  // Initial building for new task
  const defaultInitialBuilding = activeEdificios[0]?.id_edificio || edificios[0]?.id_edificio || '';
  const defaultUser = isMantenimiento && currentUser
    ? currentUser
    : getAssignedUserForBuilding(defaultInitialBuilding);

  // New task form state
  const [titulo, setTitulo] = useState('');
  const [asignado, setAsignado] = useState(defaultUser?.email || '');
  const [edificio, setEdificio] = useState(defaultInitialBuilding);
  const [prioridad, setPrioridad] = useState<TareaPrioridad>('Media');
  const [fechaLimite, setFechaLimite] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [instrucciones, setInstrucciones] = useState('');

  // Handle building change with auto-selection of assigned technician
  const handleEdificioChange = (newBldId: string) => {
    setEdificio(newBldId);
    if (!isMantenimiento) {
      const autoUser = getAssignedUserForBuilding(newBldId);
      if (autoUser) {
        setAsignado(autoUser.email);
      }
    }
  };

  // Lote form state
  const [loteTitulo, setLoteTitulo] = useState('');
  const [lotePrioridad, setLotePrioridad] = useState<TareaPrioridad>('Media');
  const [loteFecha, setLoteFecha] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );
  const [loteInstrucciones, setLoteInstrucciones] = useState('');
  const [selectedEdificiosLote, setSelectedEdificiosLote] = useState<string[]>(
    activeEdificios.map((e) => e.id_edificio)
  );

  // Filter tasks based on role
  const roleFilteredTareas = useMemo(() => {
    return tareas.filter((t) => {
      if (isSuperAdmin || isSupervisor) return true;
      if (isMantenimiento) {
        // Mantenimiento can only view tasks of their assigned building
        if (currentUser?.id_edificio_asignado && t.id_edificio === currentUser.id_edificio_asignado) return true;
        if (currentUser?.edificio_asignado && t.edificio_nombre === currentUser.edificio_asignado) return true;
        if (currentUser?.edificios && currentUser.edificios.includes(t.id_edificio)) return true;
        if (t.asignado_a_email && currentUser?.email && t.asignado_a_email.toLowerCase() === currentUser.email.toLowerCase()) return true;
        return false;
      }
      if (isAdmin) {
        // Administrador can view tasks of assigned buildings
        if (currentUser?.id_edificio_asignado && t.id_edificio === currentUser.id_edificio_asignado) return true;
        if (currentUser?.edificio_asignado && t.edificio_nombre === currentUser.edificio_asignado) return true;
        if (currentUser?.edificios && currentUser.edificios.includes(t.id_edificio)) return true;
        if (t.asignado_a_email && currentUser?.email && t.asignado_a_email.toLowerCase() === currentUser.email.toLowerCase()) return true;
        return false;
      }
      return true;
    });
  }, [tareas, currentUser, isSuperAdmin, isSupervisor, isAdmin, isMantenimiento]);

  const filteredTareas = roleFilteredTareas
    .filter((t) => {
      if (filterEdificio && t.id_edificio !== filterEdificio) return false;
      if (filterEstado && t.estado_tarea !== filterEstado) return false;
      if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
      if (filterSoloVencidas) {
        const isPastDue = t.fecha_limite && new Date(t.fecha_limite).getTime() < Date.now();
        if (!isPastDue || t.estado_tarea === 'Resuelta') return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = t.titulo_tarea?.toLowerCase().includes(term);
        const matchesDesc = t.instrucciones?.toLowerCase().includes(term);
        const matchesEdificio = t.edificio_nombre?.toLowerCase().includes(term) || t.id_edificio?.toLowerCase().includes(term);
        const matchesUser = t.asignado_a_nombre?.toLowerCase().includes(term) || t.asignado_a_email?.toLowerCase().includes(term);
        const matchesCode = t.id_tarea?.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesEdificio && !matchesUser && !matchesCode) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'recientes') {
        const timeA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
        const timeB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOrder === 'antiguas') {
        const timeA = a.fecha_creacion ? new Date(a.fecha_creacion).getTime() : 0;
        const timeB = b.fecha_creacion ? new Date(b.fecha_creacion).getTime() : 0;
        return timeA - timeB;
      }
      if (sortOrder === 'limite_cercano') {
        const limA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : 9999999999999;
        const limB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : 9999999999999;
        return limA - limB;
      }
      return 0;
    });

  const selectedTarea = filteredTareas.find((t) => t.id_tarea === selectedTareaId) || filteredTareas[0];

  useEffect(() => {
    if (!selectedTareaId && filteredTareas.length > 0) {
      setSelectedTareaId(filteredTareas[0].id_tarea);
    }
  }, [filteredTareas, selectedTareaId]);

  // Permission to delete task:
  // SuperAdmin & Supervisor: full delete
  // Admin: only tasks created by him, NOT assigned by SuperAdmin or Supervisor
  // Mantenimiento: only tasks created by him
  const canDeleteTarea = (t: Tarea): boolean => {
    if (isSuperAdmin || isSupervisor) return true;
    const isAssignedBySuperior = t.creado_por_rol === 'SuperAdmin' || t.creado_por_rol === 'Supervisor';
    if (isAdmin) {
      if (isAssignedBySuperior) return false;
      if (t.creado_por && currentUser?.email && t.creado_por.toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
      return !isAssignedBySuperior;
    }
    if (isMantenimiento) {
      return !!(t.creado_por && currentUser?.email && t.creado_por.toLowerCase() === currentUser.email.toLowerCase());
    }
    return false;
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !edificio) return;

    const building = edificios.find((b) => b.id_edificio === edificio);
    const targetEmail = isMantenimiento && currentUser ? currentUser.email : asignado;
    const targetUser = usuarios.find((u) => u.email === targetEmail) || (isMantenimiento ? currentUser : undefined);

    onCreateTarea({
      titulo_tarea: titulo.trim(),
      asignado_a_email: targetEmail,
      asignado_a_nombre: targetUser?.nombre || targetEmail,
      asignado_a_rol: targetUser?.rol || 'Mantenimiento',
      id_edificio: edificio,
      edificio_nombre: building?.nombre,
      prioridad,
      fecha_limite: fechaLimite,
      instrucciones: instrucciones.trim(),
      tipo_origen: 'Manual',
      estado_tarea: 'Pendiente',
      creado_por: currentUser?.email || 'admin@eazyops.gt',
      creado_por_rol: currentUser?.rol || 'SuperAdmin',
    });

    setTitulo('');
    setInstrucciones('');
    setSubview('lista');
  };

  const handleLoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteTitulo.trim() || !selectedEdificiosLote.length) return;

    onCreateLoteMasivo({
      titulo: loteTitulo.trim(),
      prioridad: lotePrioridad,
      fecha_limite: loteFecha,
      instrucciones: loteInstrucciones.trim(),
      edificios: selectedEdificiosLote,
    });

    setLoteTitulo('');
    setLoteInstrucciones('');
    setSubview('lista');
  };

  const handleConfirmResolve = () => {
    if (!resolvingTarea || !resolveComment.trim()) return;

    onUpdateTarea(resolvingTarea.id_tarea, {
      estado_tarea: 'Resuelta',
      observaciones_cierre: resolveComment.trim(),
      foto_evidencia_cierre:
        resolvePhoto ||
        'https://lh3.googleusercontent.com/aida-public/AB6AXuATBNXT7fcqDVoSHWy72t7dxMfI4pg0eYtQ82-XxM9S_nFpCEr_JVxbADsFx0ynko-qwZkcj4C8MUkMMD5NECVbnASsHZEersgC0DAalUkZh7EzCwPNY8qbbdcduAskqfC4iJjk8K5WaEbalSCHg3JP5H_IF6PJWOi1HEWVFKUQtmqVN-2ZEoThK76OBO34jvAqt6HPlYhDjXcrm5U0QsLiz-_uTP1o4_42U1g2rSrKFSd_fX8qPOgsiQ',
      fecha_resolucion: new Date().toISOString(),
      resultado_cumplimiento: 'Cerrada en tiempo',
    });

    setResolvingTarea(null);
    setResolveComment('');
    setResolvePhoto('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Title & Subnav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
              Gestión Central de Tareas
            </h1>
            {currentUser && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#0051d5] text-[10px] font-bold">
                {currentUser.rol}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Control de actividades preventivas, correctivas y asignaciones operativas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubview('lista')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              subview === 'lista'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'bg-white border border-[#c5c6cd] text-[#0b1c30] hover:bg-[#f8f9ff]'
            }`}
          >
            Ver Lista ({filteredTareas.length})
          </button>

          <button
            type="button"
            onClick={() => setSubview('nueva')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subview === 'nueva'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'bg-white border border-[#c5c6cd] text-[#0b1c30] hover:bg-[#f8f9ff]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            + Nueva Tarea
          </button>

          {/* Lote Masivo: Only SuperAdmin, Supervisor and Admin */}
          {!isMantenimiento && (
            <button
              type="button"
              onClick={() => setSubview('lote')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                subview === 'lote'
                  ? 'bg-[#0051d5] text-white shadow-sm'
                  : 'bg-white border border-[#c5c6cd] text-[#0b1c30] hover:bg-[#f8f9ff]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              + Lote Masivo
            </button>
          )}
        </div>
      </div>

      {/* SUBVIEW: NUEVA TAREA */}
      {subview === 'nueva' && (
        <div className="rounded-2xl bg-white border border-[#e5eeff] p-6 max-w-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-[#0051d5]" />
            <h2 className="text-base font-bold text-[#0b1c30]">
              {isMantenimiento ? 'Registrar Tarea Propia' : 'Crear Nueva Tarea Individual'}
            </h2>
          </div>

          {isMantenimiento && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Como <strong>Mantenimiento</strong>, la tarea quedará autoasignada a tu perfil y en tu edificio asignado.</span>
            </div>
          )}

          <form onSubmit={handleSingleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Título de la Tarea *</label>
              <input
                type="text"
                required
                placeholder="Ej. Revisión y ajuste de válvula compuerta piso 3"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Edificio Asignado *</label>
                <select
                  value={edificio}
                  onChange={(e) => handleEdificioChange(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] font-medium"
                >
                  {activeEdificios.map((ed) => (
                    <option key={ed.id_edificio} value={ed.id_edificio}>
                      {ed.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Responsable Asignado *</label>
                {isMantenimiento && currentUser ? (
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.nombre} (${currentUser.rol})`}
                    className="w-full h-10 px-3 bg-gray-100 text-[#64748b] rounded-lg text-xs border border-[#e5eeff] font-medium cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={asignado}
                    onChange={(e) => setAsignado(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] font-medium"
                  >
                    {usuarios.map((u) => (
                      <option key={u.id_usuario || u.email} value={u.email}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Prioridad</label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as TareaPrioridad)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  <option value="Alta">Alta (Crítica)</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Fecha Límite</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Instrucciones Técnicas</label>
              <textarea
                rows={3}
                placeholder="Detalle los procedimientos específicos o piezas a utilizar..."
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
              ></textarea>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm cursor-pointer"
              >
                Crear Tarea en Supabase
              </button>
              <button
                type="button"
                onClick={() => setSubview('lista')}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBVIEW: LOTE MASIVO */}
      {subview === 'lote' && !isMantenimiento && (
        <div className="rounded-2xl bg-white border border-[#e5eeff] p-6 max-w-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#0051d5]" />
            <h2 className="text-base font-bold text-[#0b1c30]">
              Crear Lote Masivo de Tareas
            </h2>
          </div>
          <p className="text-xs text-[#64748b] mb-4">
            Distribuye una misma directriz técnica o preventiva a múltiples edificios asignando automáticamente al personal correspondiente.
          </p>

          <form onSubmit={handleLoteSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Título de la Tarea General</label>
              <input
                type="text"
                required
                placeholder="Ej. Prueba mensual de sensores fotoeléctricos"
                value={loteTitulo}
                onChange={(e) => setLoteTitulo(e.target.value)}
                className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Edificios Destino</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] max-h-48 overflow-y-auto">
                {activeEdificios.map((ed) => {
                  const checked = selectedEdificiosLote.includes(ed.id_edificio);
                  return (
                    <label key={ed.id_edificio} className="flex items-center gap-2 text-xs text-[#0b1c30] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEdificiosLote([...selectedEdificiosLote, ed.id_edificio]);
                          } else {
                            setSelectedEdificiosLote(selectedEdificiosLote.filter((id) => id !== ed.id_edificio));
                          }
                        }}
                        className="w-4 h-4 accent-[#0051d5] rounded cursor-pointer"
                      />
                      <span className="truncate">{ed.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Prioridad</label>
                <select
                  value={lotePrioridad}
                  onChange={(e) => setLotePrioridad(e.target.value as TareaPrioridad)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Fecha Límite</label>
                <input
                  type="date"
                  value={loteFecha}
                  onChange={(e) => setLoteFecha(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Instrucciones</label>
              <textarea
                rows={3}
                placeholder="Indicaciones para los administradores o técnicos..."
                value={loteInstrucciones}
                onChange={(e) => setLoteInstrucciones(e.target.value)}
                className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
              ></textarea>
            </div>

            <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe] text-xs text-[#0051d5]">
              Se generarán <strong>{selectedEdificiosLote.length}</strong> tareas independientes asignadas a los técnicos o administradores responsables de cada edificio.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!selectedEdificiosLote.length || !loteTitulo.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                Crear Lote en Supabase
              </button>
              <button
                type="button"
                onClick={() => setSubview('lista')}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBVIEW: LISTA */}
      {subview === 'lista' && (
        <div className="flex flex-col gap-4">
          {/* Filters toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white border border-[#e5eeff] rounded-xl shadow-sm">
            {/* Buscador de tareas */}
            <div className="flex items-center gap-2 bg-[#f8f9ff] px-3 py-1.5 rounded-lg border border-[#e5eeff] flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#64748b] shrink-0" />
              <input
                type="text"
                placeholder="Buscar tarea, código, responsable o edificio..."
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
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Ordenar por fecha */}
            <div className="flex items-center gap-1.5 bg-[#f8f9ff] px-2.5 py-1 rounded-lg border border-[#e5eeff]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
              <span className="text-[11px] font-semibold text-[#64748b]">Ordenar:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-[#0b1c30] focus:outline-none cursor-pointer"
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguas">Más antiguas primero</option>
                <option value="limite_cercano">Fecha límite más próxima</option>
              </select>
            </div>

            <select
              value={filterEdificio}
              onChange={(e) => setFilterEdificio(e.target.value)}
              className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-medium border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
            >
              <option value="">Todos los edificios</option>
              {activeEdificios.map((ed) => (
                <option key={ed.id_edificio} value={ed.id_edificio}>
                  {ed.nombre}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-medium border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
            >
              <option value="">Todos los estados</option>
              <option value="Pendiente">Pendientes</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Resuelta">Resueltas</option>
            </select>

            <select
              value={filterPrioridad}
              onChange={(e) => setFilterPrioridad(e.target.value)}
              className="h-9 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-medium border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
            >
              <option value="">Todas las prioridades</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>

            <button
              type="button"
              onClick={() => setFilterSoloVencidas(!filterSoloVencidas)}
              className={`h-9 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterSoloVencidas
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-[#f8f9ff] text-[#64748b] border border-[#e5eeff] hover:bg-[#eff4ff]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Solo Vencidas
            </button>
          </div>

          {/* Main 2-column Layout: List + Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Task List */}
            <div className="lg:col-span-5 flex flex-col gap-2.5 max-h-[680px] overflow-y-auto pr-1">
              {filteredTareas.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#e5eeff] rounded-2xl">
                  <CheckSquare className="w-10 h-10 text-[#94a3b8] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#0b1c30]">No se encontraron tareas</p>
                  <p className="text-[11px] text-[#64748b] mt-1">Ajuste los filtros o cree una nueva tarea.</p>
                </div>
              ) : (
                filteredTareas.map((t) => {
                  const isSelected = selectedTarea?.id_tarea === t.id_tarea;
                  const isPastDue = t.fecha_limite && new Date(t.fecha_limite).getTime() < Date.now() && t.estado_tarea !== 'Resuelta';
                  const isAssignedBySuperior = t.creado_por_rol === 'SuperAdmin' || t.creado_por_rol === 'Supervisor';

                  return (
                    <div
                      key={t.id_tarea}
                      onClick={() => setSelectedTareaId(t.id_tarea)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-[#eff4ff] border-[#0051d5] shadow-xs ring-1 ring-[#0051d5]'
                          : 'bg-white border-[#e5eeff] hover:border-[#cbd5e1] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#0051d5]">
                          {t.id_tarea}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isAssignedBySuperior && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 border border-purple-200 text-[10px] text-purple-700 font-bold" title="Asignada por Supervisor/SuperAdmin">
                              Superior
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.prioridad === 'Alta'
                                ? 'bg-red-100 text-red-800'
                                : t.prioridad === 'Media'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {t.prioridad}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-[#0b1c30] line-clamp-1 mb-1">
                        {t.titulo_tarea}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-[#64748b] mt-2">
                        <span className="truncate max-w-[140px]">
                          {t.edificio_nombre || t.id_edificio}
                        </span>
                        <span
                          className={`font-semibold ${
                            t.estado_tarea === 'Resuelta'
                              ? 'text-[#069669]'
                              : isPastDue
                              ? 'text-red-600 font-bold'
                              : 'text-[#64748b]'
                          }`}
                        >
                          {isPastDue ? 'Vencida' : t.estado_tarea}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task Detail Pane */}
            <div className="lg:col-span-7">
              {selectedTarea ? (
                <div className="rounded-2xl bg-white border border-[#e5eeff] p-6 shadow-sm flex flex-col gap-4 sticky top-6">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#e5eeff]">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#0051d5]">
                          {selectedTarea.id_tarea}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedTarea.prioridad === 'Alta'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Prioridad {selectedTarea.prioridad}
                        </span>
                        {selectedTarea.creado_por_rol && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            Origen: {selectedTarea.creado_por_rol}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#0b1c30]">
                        {selectedTarea.titulo_tarea}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        selectedTarea.estado_tarea === 'Resuelta'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedTarea.estado_tarea === 'En Proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedTarea.estado_tarea}
                    </span>
                  </div>

                  {/* Notice if assigned by superior and user is admin/maintenance */}
                  {(isAdmin || isMantenimiento) &&
                    (selectedTarea.creado_por_rol === 'SuperAdmin' || selectedTarea.creado_por_rol === 'Supervisor') && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Esta tarea fue asignada por la superioridad (SuperAdmin/Supervisor). No puede ser eliminada y requiere evidencia formal al resolverse.</span>
                      </div>
                    )}

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-xs">
                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Edificio
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.edificio_nombre || selectedTarea.id_edificio}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Responsable
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.asignado_a_nombre || selectedTarea.asignado_a_email}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Fecha Creación
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.fecha_creacion || 'Reciente'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Fecha Límite
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.fecha_limite || 'Sin fecha límite'}
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h4 className="text-xs font-bold text-[#0b1c30] mb-1">Instrucciones Técnicas:</h4>
                    <p className="text-xs text-[#45474c] bg-[#eff4ff]/60 p-3 rounded-lg border border-[#d3e4fe] leading-relaxed">
                      {selectedTarea.instrucciones || 'Sin instrucciones adicionales especificadas.'}
                    </p>
                  </div>

                  {/* Resolution Notes & Photo (if resolved) */}
                  {selectedTarea.estado_tarea === 'Resuelta' && (
                    <div className="p-3.5 rounded-xl bg-[#e5eeff]/70 border border-[#a7f3d0] flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#069669]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Tarea Resuelta y Conforme</span>
                      </div>
                      <p className="text-xs text-[#0b1c30]">
                        <strong>Dictamen de cierre:</strong> {selectedTarea.observaciones_cierre}
                      </p>
                      {selectedTarea.foto_evidencia_cierre && (
                        <div className="mt-1">
                          <span className="text-[11px] font-bold text-[#64748b] block mb-1">
                            Evidencia fotográfica de cierre:
                          </span>
                          <img
                            src={selectedTarea.foto_evidencia_cierre}
                            alt="Evidencia cierre"
                            className="w-32 h-24 object-cover rounded-lg border border-[#e5eeff] shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedTarea.estado_tarea === 'Pendiente' && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTarea(selectedTarea.id_tarea, {
                              estado_tarea: 'En Proceso',
                              fecha_inicio: new Date().toISOString(),
                            })
                          }
                          className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm cursor-pointer"
                        >
                          Iniciar Tarea
                        </button>
                      )}

                      {selectedTarea.estado_tarea === 'En Proceso' && (
                        <button
                          type="button"
                          onClick={() => setResolvingTarea(selectedTarea)}
                          className="px-4 py-2 rounded-lg bg-[#069669] text-white text-xs font-bold hover:bg-[#057a55] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          Resolver Tarea (Con Evidencia)
                        </button>
                      )}
                    </div>

                    {/* Delete action if permitted */}
                    {onDeleteTarea && canDeleteTarea(selectedTarea) && (
                      <button
                        type="button"
                        onClick={() => setDeletingTarea(selectedTarea)}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-white border border-[#e5eeff] rounded-2xl">
                  <FileText className="w-12 h-12 text-[#94a3b8] mx-auto mb-2" />
                  <p className="text-xs font-semibold text-[#0b1c30]">Seleccione una tarea</p>
                  <p className="text-[11px] text-[#64748b]">Haga clic en la lista para ver el detalle de la tarea.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVER TAREA */}
      {resolvingTarea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Resolver y Cerrar Tarea</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTarea(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-mono text-[#0051d5] font-bold">
                  {resolvingTarea.id_tarea}
                </span>
                <h4 className="font-bold text-sm text-[#0b1c30] mt-0.5">
                  {resolvingTarea.titulo_tarea}
                </h4>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Dictamen u Observaciones de Cierre *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalle los trabajos efectuados, pruebas de funcionamiento y condiciones en que queda el equipo o área..."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  URL de Evidencia Fotográfica (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={resolvePhoto}
                    onChange={(e) => setResolvePhoto(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setResolvePhoto(
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
                      )
                    }
                    className="px-3 h-10 rounded-lg bg-[#eff4ff] text-[#0051d5] text-xs font-semibold hover:bg-[#d3e4fe] shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Demo
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingTarea(null)}
                  className="px-4 py-2.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!resolveComment.trim()}
                  onClick={handleConfirmResolve}
                  className="px-5 py-2.5 rounded-lg bg-[#069669] hover:bg-[#057a55] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Confirmar Resolución
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINAR TAREA */}
      {deletingTarea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-red-200">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base text-white">Eliminar Tarea</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTarea(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs text-[#0b1c30]">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente la tarea <strong>{deletingTarea.id_tarea}</strong>?
              </p>

              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="font-bold text-sm text-red-950">{deletingTarea.titulo_tarea}</div>
                <div className="text-red-700 text-[11px] mt-1">
                  Edificio: {deletingTarea.edificio_nombre || deletingTarea.id_edificio}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingTarea(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteTarea) onDeleteTarea(deletingTarea.id_tarea);
                    setDeletingTarea(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
