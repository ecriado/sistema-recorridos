import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Building, 
  CheckCircle2, 
  Filter,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Edificio, Recorrido, Tarea } from '../../types';

interface ReportesViewProps {
  edificios: Edificio[];
  recorridos: Recorrido[];
  tareas: Tarea[];
}

export const ReportesView: React.FC<ReportesViewProps> = ({
  edificios,
  recorridos,
  tareas,
}) => {
  const [periodo, setPeriodo] = useState('2024-11');
  const [edificioId, setEdificioId] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  const filteredRecorridos = recorridos.filter((r) => {
    if (edificioId && r.id_edificio !== edificioId) return false;
    return true;
  });

  const filteredTareas = tareas.filter((t) => {
    if (edificioId && t.id_edificio !== edificioId) return false;
    return true;
  });

  const cerradas = filteredTareas.filter((t) => t.estado_tarea === 'Resuelta');
  const enTiempo = cerradas.filter((t) => t.resultado_cumplimiento === 'Cerrada en tiempo').length;
  const fueraTiempo = cerradas.length - enTiempo;
  const cumplimiento = cerradas.length ? Math.round((enTiempo * 100) / cerradas.length) : 100;

  const buildingName = edificioId
    ? edificios.find((e) => e.id_edificio === edificioId)?.nombre || edificioId
    : 'Todos los edificios autorizados';

  const handleDownloadCsv = () => {
    const headers = 'Tipo,ID,Edificio,Titulo/Nombre,Responsable,Estado,Fecha,Resultado\n';
    const rows = [
      ...filteredRecorridos.map(
        (r) =>
          `"Recorrido","${r.id_recorrido}","${r.edificio_nombre || r.id_edificio}","${r.nombre}","${
            r.inspector_nombre
          }","${r.estado}","${r.fecha_programada}","${r.resultado_cierre || 'En proceso'}"`
      ),
      ...filteredTareas.map(
        (t) =>
          `"Tarea","${t.id_tarea}","${t.edificio_nombre || t.id_edificio}","${t.titulo_tarea}","${
            t.asignado_a_nombre
          }","${t.estado_tarea}","${t.fecha_creacion}","${t.resultado_cumplimiento || ''}"`
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_operaciones_${periodo}_${edificioId || 'todos'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Reportería Mensual y Auditoría
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Métricas de cumplimiento, tiempos de resolución y consolidado histórico
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-white border border-[#e5eeff] rounded-2xl shadow-sm flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-[#0b1c30]">Mes / Período</label>
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-[220px]">
          <label className="text-xs font-semibold text-[#0b1c30]">Edificio</label>
          <select
            value={edificioId}
            onChange={(e) => setEdificioId(e.target.value)}
            className="h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
          >
            <option value="">Todos los edificios permitidos</option>
            {edificios.map((e) => (
              <option key={e.id_edificio} value={e.id_edificio}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3.5 py-2.5 rounded-lg bg-white border border-[#d3e4fe] text-[#0051d5] hover:bg-[#eff4ff] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-lg bg-[#0051d5] text-white hover:bg-[#0041ab] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Recorridos</span>
          <div className="text-2xl font-bold text-[#0b1c30] mt-1">{filteredRecorridos.length}</div>
          <span className="text-[11px] text-[#0051d5] font-medium mt-0.5 block">Auditados en período</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Tareas Totales</span>
          <div className="text-2xl font-bold text-[#0b1c30] mt-1">{filteredTareas.length}</div>
          <span className="text-[11px] text-[#64748b] mt-0.5 block">{cerradas.length} resueltas</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Cerradas en Tiempo</span>
          <div className="text-2xl font-bold text-[#069669] mt-1">{enTiempo}</div>
          <span className="text-[11px] text-[#ba1a1a] mt-0.5 block">{fueraTiempo} fuera de tiempo</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Cumplimiento SLA</span>
          <div className="text-2xl font-bold text-[#0051d5] mt-1">{cumplimiento}%</div>
          <span className="text-[11px] text-[#069669] font-medium mt-0.5 block">Tasa de resolución</span>
        </div>
      </div>

      {/* Report Table Preview */}
      <div className="bg-white rounded-2xl border border-[#e5eeff] p-6 shadow-sm flex flex-col gap-6" id="reporteImprimible">
        <div className="border-b border-[#e5eeff] pb-4">
          <h2 className="text-lg font-bold text-[#0b1c30]">
            Reporte Ejecutivo de Gestión — {periodo}
          </h2>
          <p className="text-xs text-[#64748b] mt-1">
            Alcance: {buildingName} • Generado con almacenamiento persistente en Supabase
          </p>
        </div>

        {/* Recorridos Subtable */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0051d5] mb-2.5">
            Recorridos e Inspecciones
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] text-[#0b1c30] border-b border-[#d3e4fe]">
                  <th className="p-2.5 font-bold">Código</th>
                  <th className="p-2.5 font-bold">Edificio</th>
                  <th className="p-2.5 font-bold">Inspector</th>
                  <th className="p-2.5 font-bold">Fecha Programada</th>
                  <th className="p-2.5 font-bold">Estado</th>
                  <th className="p-2.5 font-bold">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {filteredRecorridos.map((r) => (
                  <tr key={r.id_recorrido} className="hover:bg-[#f8f9ff]">
                    <td className="p-2.5 font-mono font-bold text-[#0051d5]">{r.id_recorrido}</td>
                    <td className="p-2.5">{r.edificio_nombre || r.id_edificio}</td>
                    <td className="p-2.5">{r.inspector_nombre}</td>
                    <td className="p-2.5">{r.fecha_programada}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff4ff] text-[#0051d5]">
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-2.5 font-medium">{r.resultado_cierre || 'En proceso'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tareas Subtable */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#069669] mb-2.5">
            Tareas y Acciones Correctivas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#eff4ff] text-[#0b1c30] border-b border-[#d3e4fe]">
                  <th className="p-2.5 font-bold">ID Tarea</th>
                  <th className="p-2.5 font-bold">Título</th>
                  <th className="p-2.5 font-bold">Responsable</th>
                  <th className="p-2.5 font-bold">Prioridad</th>
                  <th className="p-2.5 font-bold">Estado</th>
                  <th className="p-2.5 font-bold">Cumplimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                {filteredTareas.map((t) => (
                  <tr key={t.id_tarea} className="hover:bg-[#f8f9ff]">
                    <td className="p-2.5 font-mono font-bold text-[#64748b]">{t.id_tarea}</td>
                    <td className="p-2.5 font-medium">{t.titulo_tarea}</td>
                    <td className="p-2.5">{t.asignado_a_nombre}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#eff4ff] text-[#0051d5]">
                        {t.prioridad}
                      </span>
                    </td>
                    <td className="p-2.5">{t.estado_tarea}</td>
                    <td className="p-2.5">{t.resultado_cumplimiento || 'Pendiente'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
