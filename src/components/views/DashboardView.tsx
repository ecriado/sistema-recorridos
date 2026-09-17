import React from 'react';
import { 
  Building, 
  ClipboardCheck, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Plus, 
  Database,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Edificio, Recorrido, Tarea } from '../../types';

interface DashboardViewProps {
  edificios: Edificio[];
  selectedEdificioId: string;
  onSelectEdificio: (id: string) => void;
  recorridos: Recorrido[];
  tareas: Tarea[];
  onNavigateToScreen: (screen: any, filterState?: any) => void;
  onOpenMigrationModal: () => void;
  isSuperAdmin?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  edificios,
  selectedEdificioId,
  onSelectEdificio,
  recorridos,
  tareas,
  onNavigateToScreen,
  onOpenMigrationModal,
  isSuperAdmin = false,
}) => {
  // Filter by selected building if any
  const filteredRecorridos = selectedEdificioId
    ? recorridos.filter((r) => r.id_edificio === selectedEdificioId)
    : recorridos;

  const filteredTareas = selectedEdificioId
    ? tareas.filter((t) => t.id_edificio === selectedEdificioId)
    : tareas;

  const recorridosProgramados = filteredRecorridos.filter((r) => r.estado === 'Programado').length;
  const recorridosEnProceso = filteredRecorridos.filter((r) => r.estado === 'En Proceso').length;
  const recorridosCompletados = filteredRecorridos.filter((r) => r.estado === 'Completado').length;

  const tareasPendientes = filteredTareas.filter((t) => t.estado_tarea === 'Pendiente').length;
  const tareasEnProceso = filteredTareas.filter((t) => t.estado_tarea === 'En Proceso').length;
  const tareasResueltas = filteredTareas.filter((t) => t.estado_tarea === 'Resuelta').length;

  const hallazgosAbiertos = filteredTareas.filter(
    (t) => t.tipo_origen === 'Hallazgo' && t.estado_tarea !== 'Resuelta'
  ).length;

  const selectedEdificioName = selectedEdificioId
    ? edificios.find((e) => e.id_edificio === selectedEdificioId)?.nombre || selectedEdificioId
    : 'Todos los edificios';

  return (
    <div className="flex flex-col gap-6">
      {/* Top Heading & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Dashboard Operativo
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Visión general del estado de recorridos, hallazgos y tareas • Conectado a Supabase
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* BOTÓN MIGRACIÓN / REPARACIÓN: SOLO VISIBLE EN PERFIL SUPERADMIN */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={onOpenMigrationModal}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#d3e4fe] text-[#0051d5] text-xs font-bold hover:bg-[#eff4ff] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Herramienta de diagnóstico de BD (Exclusivo SuperAdmin)"
            >
              <Database className="w-4 h-4 text-[#069669]" />
              <span>Migración a Supabase (SQL)</span>
              <span className="text-[9px] px-1 py-0.2 bg-[#eff4ff] text-[#0051d5] border border-[#d3e4fe] rounded font-semibold font-mono">
                SuperAdmin
              </span>
            </button>
          )}

          {/* Building Selector */}
          <div className="flex items-center gap-2 bg-white border border-[#e5eeff] rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-[#64748b]" />
            <select
              value={selectedEdificioId}
              onChange={(e) => onSelectEdificio(e.target.value)}
              className="text-xs font-semibold text-[#0b1c30] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">Todos los edificios ({edificios.length})</option>
              {edificios.map((ed) => (
                <option key={ed.id_edificio} value={ed.id_edificio}>
                  {ed.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Edificios */}
        <div className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Edificios
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0b1c30] mt-1">
            {selectedEdificioId ? '1' : edificios.length}
          </div>
          <span className="text-[11px] text-[#069669] font-medium flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> 100% operativos
          </span>
        </div>

        {/* Recorridos Pendientes / Programados */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('recorridos', { estado: 'Programado' })}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow hover:border-[#bfdbfe] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Recorridos Programados
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {recorridosProgramados}
          </div>
          <span className="text-[11px] text-[#64748b] mt-1 block">Por iniciar</span>
        </div>

        {/* Recorridos En Proceso */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('recorridos', { estado: 'En Proceso' })}
          className="rounded-xl bg-white border border-[#bfdbfe] p-4 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0051d5] uppercase tracking-wider">
              En Proceso
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0051d5]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0051d5] mt-1">
            {recorridosEnProceso}
          </div>
          <span className="text-[11px] text-[#0051d5] font-semibold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0051d5] animate-pulse"></span>
            Auditoría en curso
          </span>
        </div>

        {/* Recorridos Completados */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('recorridos', { estado: 'Completado' })}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Recorridos Completados
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#069669]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#069669] mt-1">
            {recorridosCompletados}
          </div>
          <span className="text-[11px] text-[#069669] font-medium mt-1 block">
            Sellados en Supabase
          </span>
        </div>

        {/* Tareas Pendientes */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('tareas', { estado: 'Pendiente' })}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow hover:border-[#fecaca] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Tareas Pendientes
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#ba1a1a] mt-1">
            {tareasPendientes}
          </div>
          <span className="text-[11px] text-[#ba1a1a] font-semibold mt-1 block">
            Requieren atención
          </span>
        </div>

        {/* Tareas En Proceso */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('tareas', { estado: 'En Proceso' })}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Tareas En Proceso
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#0051d5]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#0051d5] mt-1">
            {tareasEnProceso}
          </div>
          <span className="text-[11px] text-[#64748b] mt-1 block">En ejecución</span>
        </div>

        {/* Tareas Resueltas */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('tareas', { estado: 'Resuelta' })}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Tareas Resueltas
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#069669]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#069669] mt-1">
            {tareasResueltas}
          </div>
          <span className="text-[11px] text-[#069669] font-semibold mt-1 block">
            Con foto de cierre
          </span>
        </div>

        {/* Hallazgos Abiertos */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigateToScreen('recorridos')}
          className="rounded-xl bg-white border border-[#e5eeff] p-4 shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
              Hallazgos Abiertos
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#ba1a1a] mt-1">
            {hallazgosAbiertos}
          </div>
          <span className="text-[11px] text-[#64748b] mt-1 block">En puntos inspeccionados</span>
        </div>
      </div>

      {/* Two Column Section: Active Inspections & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recorridos Recientes */}
        <div className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#0051d5]" />
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Recorridos de Inspección ({selectedEdificioName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToScreen('recorridos')}
                className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#e5eeff]">
              {filteredRecorridos.slice(0, 3).map((rec) => (
                <div key={rec.id_recorrido} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0051d5]">
                        {rec.id_recorrido}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          rec.estado === 'En Proceso'
                            ? 'bg-blue-100 text-blue-800'
                            : rec.estado === 'Completado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.estado}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#0b1c30] mt-1 line-clamp-1">
                      {rec.nombre}
                    </h4>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      {rec.edificio_nombre} • {rec.inspector_nombre}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (rec.id_recorrido === 'REC-2024-089') {
                        onNavigateToScreen('recorrido_cierre');
                      } else {
                        onNavigateToScreen('recorrido_detalle', { recorridoId: rec.id_recorrido });
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors shrink-0"
                  >
                    Abrir
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#64748b]">
            <span>Total registrados: {filteredRecorridos.length}</span>
            <button
              type="button"
              onClick={() => onNavigateToScreen('recorridos')}
              className="text-[#0051d5] font-semibold hover:underline"
            >
              + Nuevo recorrido
            </button>
          </div>
        </div>

        {/* Tareas Operativas Recientes */}
        <div className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#069669]" />
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Tareas y Acciones Correctivas ({selectedEdificioName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToScreen('tareas')}
                className="text-xs font-semibold text-[#0051d5] hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#e5eeff]">
              {filteredTareas.slice(0, 3).map((t) => (
                <div key={t.id_tarea} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#64748b]">
                        {t.id_tarea}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.estado_tarea}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-[#0b1c30] mt-1 line-clamp-1">
                      {t.titulo_tarea}
                    </h4>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      {t.edificio_nombre} • {t.asignado_a_nombre}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToScreen('tareas', { selectId: t.id_tarea })}
                    className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] hover:bg-[#d3e4fe] text-xs font-semibold transition-colors shrink-0"
                  >
                    Detalle
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between text-xs text-[#64748b]">
            <span>Total tareas: {filteredTareas.length}</span>
            <button
              type="button"
              onClick={() => onNavigateToScreen('tareas', { subview: 'nueva' })}
              className="text-[#0051d5] font-semibold hover:underline"
            >
              + Nueva tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
