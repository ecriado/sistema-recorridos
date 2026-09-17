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
  FileCheck
} from 'lucide-react';
import { Recorrido, Edificio, Usuario } from '../../types';

interface RecorridosViewProps {
  recorridos: Recorrido[];
  edificios: Edificio[];
  usuarios: Usuario[];
  onOpenRecorrido: (recorrido: Recorrido) => void;
  onCreateRecorrido: (nuevo: Partial<Recorrido>) => void;
  initialFilterStatus?: string;
}

export const RecorridosView: React.FC<RecorridosViewProps> = ({
  recorridos,
  edificios,
  usuarios,
  onOpenRecorrido,
  onCreateRecorrido,
  initialFilterStatus = '',
}) => {
  const [filterEdificio, setFilterEdificio] = useState('');
  const [filterEstado, setFilterEstado] = useState(initialFilterStatus);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Recorrido Form State
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEdificio, setNuevoEdificio] = useState(edificios[0]?.id_edificio || '');
  const [nuevaFecha, setNuevaFecha] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState('');
  const [nuevoCierreAuto, setNuevoCierreAuto] = useState(true);
  const [nuevoInspector, setNuevoInspector] = useState(usuarios[1]?.email || '');
  const [nuevasObservaciones, setNuevasObservaciones] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = recorridos.filter((r) => {
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Recorridos de Inspección
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Programación, ejecución y auditorías físicas de infraestructura
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Nuevo Recorrido
        </button>
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
            className="text-xs text-[#0051d5] hover:underline font-semibold ml-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Recorridos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const isCurrentSigned = r.id_recorrido === 'REC-2024-089';

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
                  {r.checkpoints_count || 12} checkpoints
                </span>

                <button
                  type="button"
                  onClick={() => onOpenRecorrido(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isCurrentSigned
                      ? 'bg-[#0051d5] text-white hover:bg-[#0041ab] shadow-sm'
                      : 'bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe]'
                  }`}
                >
                  {r.estado === 'Completado' ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" />
                      Ver Acta
                    </>
                  ) : (
                    <>
                      {isCurrentSigned ? 'Previsualizar & Cierre' : 'Abrir Recorrido'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Recorrido Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">
                  Programar Nuevo Recorrido
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 flex flex-col gap-4">
              {formError && (
                <div className="p-3 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">
                  Nombre de la Auditoría o Recorrido
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Inspección Mensual Seguridad y PCI - Torre Norte"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Edificio</label>
                  <select
                    value={nuevoEdificio}
                    onChange={(e) => setNuevoEdificio(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {edificios.map((ed) => (
                      <option key={ed.id_edificio} value={ed.id_edificio}>
                        {ed.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Inspector Responsable</label>
                  <select
                    value={nuevoInspector}
                    onChange={(e) => setNuevoInspector(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    {usuarios.map((u) => (
                      <option key={u.email} value={u.email}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Fecha y Hora de Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Fecha Límite / Cierre (Opcional)</label>
                  <input
                    type="datetime-local"
                    value={nuevaFechaCierre}
                    onChange={(e) => setNuevaFechaCierre(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={nuevoCierreAuto}
                  onChange={(e) => setNuevoCierreAuto(e.target.checked)}
                  className="w-4 h-4 accent-[#0051d5] rounded"
                />
                <span className="text-xs font-semibold text-[#0b1c30]">
                  Cerrar automáticamente al alcanzar la fecha programada
                </span>
              </label>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Observaciones / Alcance</label>
                <textarea
                  rows={3}
                  placeholder="Instrucciones para el inspector, áreas de acceso restringido o puntos críticos..."
                  value={nuevasObservaciones}
                  onChange={(e) => setNuevasObservaciones(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm"
                >
                  Crear en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
