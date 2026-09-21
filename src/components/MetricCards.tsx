import React from 'react';
import { 
  ListChecks, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  ShieldCheck, 
  Flag 
} from 'lucide-react';
import { AuditStats } from '../types';

interface MetricCardsProps {
  stats: AuditStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Checkpoints */}
      <div className="rounded-xl bg-white border border-[#e5eeff] p-4 sm:p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Checkpoints
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#0b1c30]">
                {stats.completedCheckpoints}
              </span>
              <span className="text-sm font-semibold text-[#64748b]">
                / {stats.totalCheckpoints}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0051d5]">
            <ListChecks className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-[#64748b] mb-1.5">
            <span>Cobertura total</span>
            <span className="text-[#069669] font-bold">{stats.coveragePercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#e5eeff] overflow-hidden">
            <div
              className="h-full bg-[#069669] rounded-full transition-all duration-500"
              style={{ width: `${stats.coveragePercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Card 2: Conformes */}
      <div className="rounded-xl bg-white border border-[#e5eeff] p-4 sm:p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Conformes
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#069669]">
                {stats.conformingCount}
              </span>
              <span className="text-xs font-medium text-[#64748b]">puntos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#069669]">
            <CheckCircle2 className="w-5 h-5 fill-[#069669] text-white" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[#069669] text-xs font-medium">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{stats.conformingPercent.toFixed(1)}% sin no-conformidades</span>
        </div>
      </div>

      {/* Card 3: Hallazgos Detectados */}
      <div className="rounded-xl bg-white border border-[#e5eeff] p-4 sm:p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Hallazgos Activos
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#ba1a1a]">
                {stats.activeFindingsCount}
              </span>
              <span className="text-xs font-medium text-[#64748b]">reportados</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a]">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[#64748b] text-xs font-medium">
          <Flag className="w-3.5 h-3.5 text-[#ba1a1a] shrink-0" />
          <span>
            {stats.minorFindings} Leves • {stats.majorFindings} Mayor (PCI)
          </span>
        </div>
      </div>

      {/* Card 4: Acciones Correctivas */}
      <div className="rounded-xl bg-white border border-[#e5eeff] p-4 sm:p-5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
              Acciones Correctivas
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold tracking-tight text-[#0051d5]">
                {stats.correctiveActionsCount}
              </span>
              <span className="text-xs font-medium text-[#64748b]">total</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#0051d5]">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-[#069669] font-semibold">{stats.resolvedActions} Resueltas</span>
          <span className="px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] font-semibold text-[11px]">
            {stats.pendingActions} Pendiente
          </span>
        </div>
      </div>
    </div>
  );
};
