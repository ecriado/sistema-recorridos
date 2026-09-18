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
  AlertCircle,
  Repeat,
  Compass,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  TareaAutomatica, 
  RecorridoProgramado, 
  Edificio, 
  Usuario, 
  TareaPrioridad,
  RecorridoFrecuencia 
} from '../../types';

interface AutomatizacionesViewProps {
  automatizaciones: TareaAutomatica[];
  recorridosProgramados?: RecorridoProgramado[];
  edificios: Edificio[];
  usuarios: Usuario[];
  onCreateAutomatizacion: (nueva: Partial<TareaAutomatica>) => void;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onCreateRecorridoProgramado?: (nuevo: Partial<RecorridoProgramado>) => void;
  onToggleRecorridoProgramado?: (id: string) => void;
  onDeleteRecorridoProgramado?: (id: string) => void;
}

export const AutomatizacionesView: React.FC<AutomatizacionesViewProps> = ({
  automatizaciones,
  recorridosProgramados = [],
  edificios,
  usuarios,
  onCreateAutomatizacion,
  onToggleActive,
  onDelete,
  onCreateRecorridoProgramado,
  onToggleRecorridoProgramado,
  onDeleteRecorridoProgramado,
}) => {
  const [activeTab, setActiveTab] = useState<'recorridos' | 'tareas'>('recorridos');

  // Modal para Tareas Automáticas
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [asignado, setAsignado] = useState(usuarios[0]?.email || '');
  const [edificio, setEdificio] = useState(edificios[0]?.id_edificio || '');
  const [frecuencia, setFrecuencia] = useState<'Diaria' | 'Semanal' | 'Mensual'>('Semanal');
  const [hora, setHora] = useState('08:00');
  const [prioridad, setPrioridad] = useState<TareaPrioridad>('Media');
  const [instrucciones, setInstrucciones] = useState('');

  // Modal para Recorridos Programados
  const [isRecorridoModalOpen, setIsRecorridoModalOpen] = useState(false);
  const [recNombre, setRecNombre] = useState('');
  const [recEdificio, setRecEdificio] = useState(edificios[0]?.id_edificio || '');
  const [recInspector, setRecInspector] = useState(usuarios[0]?.email || '');
  const [recFrecuencia, setRecFrecuencia] = useState<RecorridoFrecuencia>('Semanal');
  const [recHora, setRecHora] = useState('09:00');
  const [recDiaSemana, setRecDiaSemana] = useState(1); // Lunes
  const [recDiaMes, setRecDiaMes] = useState(1);
  const [recCheckpoints, setRecCheckpoints] = useState(8);

  const handleSubmitTarea = (e: React.FormEvent) => {
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

  const handleSubmitRecorrido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recNombre.trim() || !recEdificio || !recInspector) return;

    const building = edificios.find((b) => b.id_edificio === recEdificio);
    const user = usuarios.find((u) => u.email === recInspector);

    const proxima = new Date(Date.now() + 86400000 * (recFrecuencia === 'Semanal' ? 7 : recFrecuencia === 'Quincenal' ? 15 : 30)).toISOString();

    if (onCreateRecorridoProgramado) {
      onCreateRecorridoProgramado({
        nombre: recNombre.trim(),
        id_edificio: recEdificio,
        edificio_nombre: building?.nombre || recEdificio,
        frecuencia: recFrecuencia,
        hora: recHora,
        dia_semana: recDiaSemana,
        dia_mes: recDiaMes,
        inspector_email: recInspector,
        inspector_nombre: user?.nombre || recInspector,
        proxima_generacion: proxima,
        activo: true,
        checkpoints_base: recCheckpoints,
      });
    }

    setIsRecorridoModalOpen(false);
    setRecNombre('');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Automatizaciones &amp; Programación
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Programación periódica autónoma de recorridos preventivos y órdenes de trabajo en Supabase
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'recorridos' ? (
            <button
              type="button"
              onClick={() => setIsRecorridoModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
              + Programar Recorrido
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Nueva Tarea Automática
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#eff4ff] rounded-xl self-start border border-[#d3e4fe]">
        <button
          type="button"
          onClick={() => setActiveTab('recorridos')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'recorridos'
              ? 'bg-white text-[#0051d5] shadow-xs'
              : 'text-[#64748b] hover:text-[#0b1c30]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Recorridos Programados ({recorridosProgramados.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tareas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tareas'
              ? 'bg-white text-[#0051d5] shadow-xs'
              : 'text-[#64748b] hover:text-[#0b1c30]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Tareas Automáticas ({automatizaciones.length})</span>
        </button>
      </div>

      {/* TAB 1: RECORRIDOS PROGRAMADOS */}
      {activeTab === 'recorridos' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
            <Repeat className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Automatización de Recorridos Periódicos:</strong> Permite planificar rondas o inspecciones preventivas que se repiten con frecuencia <strong>Semanal, Quincenal, Mensual o Trimestral</strong>. El sistema genera el recorrido automáticamente y asigna la orden con sus checkpoints al inspector correspondiente.
            </div>
          </div>

          {recorridosProgramados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-12 text-center bg-white">
              <Compass className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0b1c30]">No hay recorridos programados aún</h3>
              <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
                Crea una programación recurrente (semanal, quincenal o mensual) para inspeccionar de manera constante los edificios en Supabase.
              </p>
              <button
                type="button"
                onClick={() => setIsRecorridoModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all"
              >
                Programar Primer Recorrido
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recorridosProgramados.map((rp) => (
                <div
                  key={rp.id_programacion}
                  className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#0051d5]">
                        {rp.id_programacion}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          rp.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rp.activo ? 'Activa' : 'Pausada'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#0b1c30] mb-2 leading-snug">
                      {rp.nombre}
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b] mb-3">
                      <div className="flex items-center gap-1.5 p-2 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                        <Building className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                        <span className="truncate">{rp.edificio_nombre || rp.id_edificio}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                        <User className="w-3.5 h-3.5 text-[#069669] shrink-0" />
                        <span className="truncate">{rp.inspector_nombre || rp.inspector_email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#475569] p-2 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                      <span className="font-semibold text-[#0051d5]">
                        Repetición: <strong>{rp.frecuencia}</strong> a las {rp.hora} hrs
                      </span>
                      <span>{rp.checkpoints_base || 8} Checkpoints</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748b]">
                      Próx. generación: <strong>{new Date(rp.proxima_generacion).toLocaleDateString()}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {onToggleRecorridoProgramado && (
                        <button
                          type="button"
                          onClick={() => onToggleRecorridoProgramado(rp.id_programacion)}
                          className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Power className="w-3 h-3" />
                          {rp.activo ? 'Pausar' : 'Activar'}
                        </button>
                      )}

                      {onDeleteRecorridoProgramado && (
                        <button
                          type="button"
                          onClick={() => onDeleteRecorridoProgramado(rp.id_programacion)}
                          className="p-1 rounded text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                          title="Eliminar programación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TAREAS AUTOMÁTICAS */}
      {activeTab === 'tareas' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0b1c30] leading-relaxed">
              <strong>Motor Autónomo PG_CRON en Supabase:</strong> Las directrices de tareas recurrentes se ejecutan periódicamente generando órdenes de trabajo directamente en PostgreSQL.
            </div>
          </div>

          {automatizaciones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#cbd5e1] p-12 text-center bg-white">
              <Clock className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0b1c30]">No hay tareas automáticas registradas</h3>
              <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
                Configura tareas que se generen solas periódicamente en base a un horario o frecuencia.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all"
              >
                Crear Primera Tarea Automática
              </button>
            </div>
          ) : (
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

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b] mb-3">
                      <div className="flex items-center gap-1.5 p-2 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                        <Building className="w-3.5 h-3.5 text-[#0051d5] shrink-0" />
                        <span className="truncate">{a.edificio_nombre || a.id_edificio}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-[#f8f9ff] rounded-lg border border-[#e5eeff]">
                        <User className="w-3.5 h-3.5 text-[#069669] shrink-0" />
                        <span className="truncate">{a.asignado_a_nombre || a.asignado_a_email}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#475569] mb-3 bg-[#f8f9ff] p-2.5 rounded-lg border border-[#e5eeff]">
                      {a.instrucciones || 'Sin instrucciones adicionales'}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748b]">
                      Frecuencia: <strong>{a.frecuencia} ({a.hora})</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleActive(a.id_automatizacion)}
                        className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Power className="w-3 h-3" />
                        {a.activo ? 'Pausar' : 'Activar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(a.id_automatizacion)}
                        className="p-1 rounded text-red-600 hover:bg-red-50 text-xs transition-colors cursor-pointer"
                        title="Eliminar cron job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Programar Nuevo Recorrido Recurrente */}
      {isRecorridoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Repeat className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Programar Recorrido Automatizado</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecorridoModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRecorrido} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Nombre o Título del Recorrido</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ronda de Seguridad Semanal y Calibración PCI"
                  value={recNombre}
                  onChange={(e) => setRecNombre(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Edificio Destino</label>
                  <select
                    value={recEdificio}
                    onChange={(e) => setRecEdificio(e.target.value)}
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
                    value={recInspector}
                    onChange={(e) => setRecInspector(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Frecuencia</label>
                  <select
                    value={recFrecuencia}
                    onChange={(e) => setRecFrecuencia(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Hora de Inicio</label>
                  <input
                    type="time"
                    value={recHora}
                    onChange={(e) => setRecHora(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Checkpoints Base</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={recCheckpoints}
                    onChange={(e) => setRecCheckpoints(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] text-xs text-[#0051d5]">
                Esta automatización programará recorridos recurrentes que aparecerán en la agenda del inspector asignado en cada ciclo establecido.
              </div>

              <div className="pt-3 border-t border-[#e5eeff] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecorridoModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all shadow-sm cursor-pointer"
                >
                  Guardar Programación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Tarea Automática */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff]">
            <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#85f8c4]" />
                <h3 className="font-bold text-base text-white">Configurar Cron Job de Tarea</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTarea} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Título de la Tarea Recurrente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Revisión semanal de generador eléctrico diésel"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30]">Edificio Destino</label>
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
                      <option key={u.id_usuario} value={u.email}>
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
