import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Layers, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  User, 
  Calendar, 
  Camera, 
  X, 
  Image as ImageIcon,
  Check,
  Search,
  ArrowUpDown,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide
} from 'lucide-react';
import { Tarea, Edificio, Usuario, TareaPrioridad, TareaEstado } from '../../types';

interface TareasViewProps {
  tareas: Tarea[];
  edificios: Edificio[];
  usuarios: Usuario[];
  onCreateTarea: (nueva: Partial<Tarea>) => void;
  onUpdateTarea: (id: string, updates: Partial<Tarea>) => void;
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
  onCreateTarea,
  onUpdateTarea,
  onCreateLoteMasivo,
  initialSelectId = '',
  initialSubview = 'lista',
  initialFilterEstado = '',
  initialFilterEdificio = '',
  initialFilterVencidas = false,
}) => {
  const [subview, setSubview] = useState<'lista' | 'nueva' | 'lote'>(initialSubview);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'recientes' | 'antiguas' | 'limite_cercano'>('recientes');
  const [filterEdificio, setFilterEdificio] = useState(initialFilterEdificio);
  const [filterEstado, setFilterEstado] = useState(initialFilterEstado);
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterSoloVencidas, setFilterSoloVencidas] = useState(initialFilterVencidas);
  const [selectedTareaId, setSelectedTareaId] = useState(initialSelectId || tareas[0]?.id_tarea || '');

  // Resolve modal state
  const [resolvingTarea, setResolvingTarea] = useState<Tarea | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState<string>('');

  // New task form state
  const [titulo, setTitulo] = useState('');
  const [asignado, setAsignado] = useState(usuarios[3]?.email || usuarios[0]?.email || '');
  const [edificio, setEdificio] = useState(edificios[0]?.id_edificio || '');
  const [prioridad, setPrioridad] = useState<TareaPrioridad>('Media');
  const [fechaLimite, setFechaLimite] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  );
  const [instrucciones, setInstrucciones] = useState('');

  // Lote form state
  const [loteTitulo, setLoteTitulo] = useState('');
  const [lotePrioridad, setLotePrioridad] = useState<TareaPrioridad>('Media');
  const [loteFecha, setLoteFecha] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10)
  );
  const [loteInstrucciones, setLoteInstrucciones] = useState('');
  const [selectedEdificiosLote, setSelectedEdificiosLote] = useState<string[]>(
    edificios.map((e) => e.id_edificio)
  );

  const filteredTareas = tareas
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
        const timeA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : 9999999999999;
        const timeB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : 9999999999999;
        return timeA - timeB;
      }
      return 0;
    });

  const selectedTarea = tareas.find((t) => t.id_tarea === selectedTareaId) || filteredTareas[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !asignado || !edificio) return;

    const building = edificios.find((b) => b.id_edificio === edificio);
    const user = usuarios.find((u) => u.email === asignado);

    onCreateTarea({
      titulo_tarea: titulo.trim(),
      asignado_a_email: asignado,
      asignado_a_nombre: user?.nombre || asignado,
      asignado_a_rol: user?.rol || 'Mantenimiento',
      id_edificio: edificio,
      edificio_nombre: building?.nombre,
      prioridad,
      fecha_limite: fechaLimite,
      instrucciones: instrucciones.trim(),
      tipo_origen: 'Manual',
      estado_tarea: 'Pendiente',
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Gestión Central de Tareas
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Control de actividades preventivas, correctivas y asignaciones operativas
          </p>
        </div>

        {/* Subnav Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#eff4ff] rounded-xl self-start sm:self-auto border border-[#d3e4fe]">
          <button
            type="button"
            onClick={() => setSubview('lista')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subview === 'lista'
                ? 'bg-white text-[#0051d5] shadow-sm'
                : 'text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            Lista de tareas
          </button>
          <button
            type="button"
            onClick={() => setSubview('nueva')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              subview === 'nueva'
                ? 'bg-white text-[#0051d5] shadow-sm'
                : 'text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva tarea
          </button>
          <button
            type="button"
            onClick={() => setSubview('lote')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              subview === 'lote'
                ? 'bg-white text-[#0051d5] shadow-sm'
                : 'text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Lote masivo
          </button>
        </div>
      </div>

      {subview === 'nueva' && (
        <div className="rounded-2xl bg-white border border-[#e5eeff] p-6 max-w-2xl shadow-sm">
          <h2 className="text-base font-bold text-[#0b1c30] mb-4">Crear Tarea Manual</h2>
          <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#0b1c30]">Título de la Tarea</label>
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
                <label className="text-xs font-semibold text-[#0b1c30]">Responsable Asignado</label>
                <select
                  value={asignado}
                  onChange={(e) => setAsignado(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  {usuarios.map((u) => (
                    <option key={u.email} value={u.email}>
                      {u.nombre} ({u.rol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Edificio</label>
                <select
                  value={edificio}
                  onChange={(e) => setEdificio(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                >
                  {edificios.map((ed) => (
                    <option key={ed.id_edificio} value={ed.id_edificio}>
                      {ed.nombre}
                    </option>
                  ))}
                </select>
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
                className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm"
              >
                Crear Tarea en Supabase
              </button>
              <button
                type="button"
                onClick={() => setSubview('lista')}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {subview === 'lote' && (
        <div className="rounded-2xl bg-white border border-[#e5eeff] p-6 max-w-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-[#0051d5]" />
            <h2 className="text-base font-bold text-[#0b1c30]">
              Crear Lote Masivo de Tareas
            </h2>
          </div>
          <p className="text-xs text-[#64748b] mb-4">
            Distribuye una misma directriz técnica o preventiva a múltiples edificios con clave de idempotencia única.
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff]">
                {edificios.map((ed) => {
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
                        className="w-4 h-4 accent-[#0051d5] rounded"
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
              Se generarán <strong>{selectedEdificiosLote.length}</strong> tareas independientes asignadas a los administradores responsables.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!selectedEdificiosLote.length || !loteTitulo.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm disabled:opacity-50"
              >
                Crear Lote en PostgreSQL
              </button>
              <button
                type="button"
                onClick={() => setSubview('lista')}
                className="px-4 py-2.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

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
                  className="text-xs text-[#94a3b8] hover:text-[#0b1c30]"
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
              {edificios.map((e) => (
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
              className={`h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                filterSoloVencidas
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-[#f8f9ff] text-[#64748b] border border-[#e5eeff] hover:text-[#ba1a1a]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#ba1a1a]" />
              <span>Solo Vencidas</span>
            </button>

            {(filterEdificio || filterEstado || filterPrioridad || filterSoloVencidas || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setFilterEdificio('');
                  setFilterEstado('');
                  setFilterPrioridad('');
                  setFilterSoloVencidas(false);
                  setSearchTerm('');
                }}
                className="h-9 px-2.5 rounded-lg text-xs text-[#64748b] hover:text-[#0b1c30] bg-white border border-[#e5eeff] transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}

            <span className="text-xs text-[#64748b] ml-auto">
              Mostrando {filteredTareas.length} de {tareas.length} tareas
            </span>
          </div>

          {/* Master-Detail Layout (Apps Script Style) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Task list column (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-2.5 max-h-[75vh] overflow-y-auto pr-1">
              {filteredTareas.map((t) => {
                const isSelected = selectedTarea?.id_tarea === t.id_tarea;
                return (
                  <div
                    key={t.id_tarea}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTareaId(t.id_tarea)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#eff4ff] border-[#0051d5] shadow-sm ring-1 ring-[#0051d5]/20'
                        : 'bg-white border-[#e5eeff] hover:border-[#c5c6cd]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-[#64748b]">
                        {t.id_tarea}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.prioridad === 'Alta'
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : t.prioridad === 'Media'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {t.prioridad}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.estado_tarea === 'Resuelta'
                              ? 'bg-[#e5eeff] text-[#069669]'
                              : t.estado_tarea === 'En Proceso'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {t.estado_tarea}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-[#0b1c30] line-clamp-2 leading-snug">
                      {t.titulo_tarea}
                    </h4>

                    <div className="flex items-center justify-between mt-2 text-[11px] text-[#64748b]">
                      <span className="truncate max-w-[140px]">{t.asignado_a_nombre}</span>
                      <span>{t.fecha_limite || 'Sin límite'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Task Detail Side Panel (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-sm sticky top-20">
              {selectedTarea ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-[#0051d5]">
                          {selectedTarea.id_tarea}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] text-[10px] font-semibold">
                          Origen: {selectedTarea.tipo_origen}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[#0b1c30] leading-snug">
                        {selectedTarea.titulo_tarea}
                      </h3>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        selectedTarea.estado_tarea === 'Resuelta'
                          ? 'bg-[#e5eeff] text-[#069669] border border-[#a7f3d0]'
                          : selectedTarea.estado_tarea === 'En Proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedTarea.estado_tarea}
                    </span>
                  </div>

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
                        {selectedTarea.asignado_a_nombre} ({selectedTarea.departamento || 'Técnico'})
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Fecha Creación
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.fecha_creacion}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#64748b] block text-[10px] uppercase font-bold">
                        Fecha Límite
                      </span>
                      <span className="font-semibold text-[#0b1c30]">
                        {selectedTarea.fecha_limite || 'Sin fecha'}
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
                  <div className="pt-3 border-t border-[#e5eeff] flex items-center gap-3">
                    {selectedTarea.estado_tarea === 'Pendiente' && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTarea(selectedTarea.id_tarea, {
                            estado_tarea: 'En Proceso',
                            fecha_inicio: new Date().toISOString(),
                          })
                        }
                        className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm"
                      >
                        Iniciar Tarea
                      </button>
                    )}

                    {selectedTarea.estado_tarea === 'En Proceso' && (
                      <button
                        type="button"
                        onClick={() => setResolvingTarea(selectedTarea)}
                        className="px-4 py-2 rounded-lg bg-[#069669] text-white text-xs font-bold hover:bg-[#057a55] transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Resolver Tarea (Con Evidencia)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#64748b]">
                  Seleccione una tarea de la lista para consultar su detalle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Task Modal */}
      {resolvingTarea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">
                  Cierre de Tarea Técnica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolvingTarea(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-[#eff4ff] text-xs text-[#0b1c30]">
                <strong>{resolvingTarea.id_tarea}</strong>: {resolvingTarea.titulo_tarea}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Comentario de Cierre y Trabajos Realizados *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describa el reemplazo de piezas, calibración efectuada o validación operativa..."
                  value={resolveComment}
                  onChange={(e) => setResolveComment(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
                ></textarea>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Fotografía de Evidencia de Cierre *
                </label>
                <div className="p-4 rounded-xl border border-dashed border-[#c5c6cd] bg-[#f8f9ff] flex flex-col items-center justify-center gap-2 text-center">
                  <Camera className="w-6 h-6 text-[#0051d5]" />
                  <span className="text-xs font-medium text-[#0b1c30]">
                    Subir fotografía de evidencia a Supabase Storage
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setResolvePhoto(url);
                      }
                    }}
                    className="text-xs cursor-pointer text-[#64748b]"
                  />
                  {resolvePhoto && (
                    <img
                      src={resolvePhoto}
                      alt="Preview"
                      className="w-32 h-24 object-cover rounded-lg border mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResolvingTarea(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!resolveComment.trim()}
                  onClick={handleConfirmResolve}
                  className="px-5 py-2.5 rounded-lg bg-[#069669] text-white text-xs font-bold hover:bg-[#057a55] transition-all shadow-sm disabled:opacity-50"
                >
                  Guardar y Cerrar en PostgreSQL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
