import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Calendar, 
  Building, 
  User, 
  CheckCircle2, 
  X, 
  Power, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { TareaAutomatica, Edificio, Usuario, TareaPrioridad } from '../../types';

interface AutomatizacionesViewProps {
  automatizaciones: TareaAutomatica[];
  edificios: Edificio[];
  usuarios: Usuario[];
  onCreateAutomatizacion: (nueva: Partial<TareaAutomatica>) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const AutomatizacionesView: React.FC<AutomatizacionesViewProps> = ({
  automatizaciones,
  edificios,
  usuarios,
  onCreateAutomatizacion,
  onToggleActive,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [asignado, setAsignado] = useState(usuarios[3]?.email || usuarios[0]?.email || '');
  const [edificio, setEdificio] = useState(edificios[0]?.id_edificio || '');
  const [frecuencia, setFrecuencia] = useState<'Diaria' | 'Semanal' | 'Mensual'>('Semanal');
  const [hora, setHora] = useState('08:00');
  const [prioridad, setPrioridad] = useState<TareaPrioridad>('Media');
  const [instrucciones, setInstrucciones] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !asignado || !edificio) return;

    const building = edificios.find((b) => b.id_edificio === edificio);
    const user = usuarios.find((u) => u.email === asignado);

    onCreateAutomatizacion({
      titulo: titulo.trim(),
      asignado_a_email: asignado,
      asignado_a_nombre: user?.nombre || asignado,
      id_edificio: edificio,
      edificio_nombre: building?.nombre,
      frecuencia,
      hora,
      prioridad,
      instrucciones: instrucciones.trim(),
      fecha_inicio: new Date().toISOString().slice(0, 10),
      proxima_ejecucion: new Date(Date.now() + 86400000 * 2).toISOString(),
      activo: true,
    });

    setIsModalOpen(false);
    setTitulo('');
    setInstrucciones('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Tareas Automáticas y Cron Jobs
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Generación periódica y autónoma de órdenes de trabajo mediante Supabase Edge Functions / Cron
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Nueva Automatización
        </button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
        <div className="text-xs text-[#0b1c30] leading-relaxed">
          <strong>Motor Autónomo PG_CRON en Supabase:</strong> En lugar de depender de activadores de Google Apps Script, las directrices recurrentes se ejecutan de manera nativa mediante extensiones <code>pg_cron</code> en PostgreSQL, asegurando alta disponibilidad e idempotencia en cada ciclo.
        </div>
      </div>

      {/* Automations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automatizaciones.map((a) => (
          <div
            key={a.id_automatizacion}
            className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-[#0051d5]">
                  {a.id_automatizacion}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    a.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {a.activo ? 'Activa' : 'Pausada'}
                </span>
              </div>

              <h3 className="font-bold text-sm text-[#0b1c30] mb-2 leading-snug">
                {a.titulo}
              </h3>

              <div className="grid grid-cols-2 gap-2 p-3 bg-[#f8f9ff] rounded-xl border border-[#e5eeff] text-xs text-[#64748b] mb-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#64748b]">Frecuencia</span>
                  <span className="font-semibold text-[#0b1c30]">{a.frecuencia} • {a.hora}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#64748b]">Prioridad</span>
                  <span className="font-semibold text-[#0b1c30]">{a.prioridad}</span>
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-[#64748b]">Edificio &amp; Responsable</span>
                  <span className="font-semibold text-[#0b1c30] truncate block">
                    {a.edificio_nombre} • {a.asignado_a_nombre}
                  </span>
                </div>
              </div>

              {a.instrucciones && (
                <p className="text-xs text-[#64748b] line-clamp-2">
                  {a.instrucciones}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
              <span className="text-[11px] text-[#64748b] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0051d5]" />
                Próxima: {new Date(a.proxima_ejecucion || Date.now()).toLocaleDateString('es-GT', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleActive(a.id_automatizacion)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    a.activo ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' : 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {a.activo ? 'Pausar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(a.id_automatizacion)}
                  className="p-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Automation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">
                  Programar Nueva Automatización
                </h3>
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
                <label className="text-xs font-semibold text-[#0b1c30]">Título de la Tarea Recurrente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Limpieza y desinfección de cisterna de agua potable"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Frecuencia</label>
                  <select
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="Diaria">Diaria</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Hora de Disparo</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Instrucciones</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre las pruebas o comprobaciones requeridas..."
                  value={instrucciones}
                  onChange={(e) => setInstrucciones(e.target.value)}
                  className="w-full p-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5] resize-none"
                ></textarea>
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
                  Guardar Cron Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
