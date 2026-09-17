import React from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Bot, 
  FileSpreadsheet, 
  LayoutDashboard,
  CheckSquare, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';
import { NavScreen } from '../types';

interface OtherScreenProps {
  screen: NavScreen | 'lista_recorridos';
  onReturnToCurrentAudit: () => void;
  onSelectAudit?: (auditId: string) => void;
}

export const OtherScreens: React.FC<OtherScreenProps> = ({
  screen,
  onReturnToCurrentAudit,
}) => {
  if (screen === 'dashboard') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">
              Dashboard Operativo de Infraestructura
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Monitoreo en tiempo real de inspecciones, activos y nivel de servicio técnico
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToCurrentAudit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir a Cierre Activo: REC-2024-089
          </button>
        </div>

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Auditorías del Mes
            </span>
            <div className="text-3xl font-bold text-[#0b1c30] mt-1">28 / 30</div>
            <span className="text-xs text-[#069669] font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> 93.3% de meta completada
            </span>
          </div>
          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Tiempo Promedio de Cierre
            </span>
            <div className="text-3xl font-bold text-[#0051d5] mt-1">1.4 hrs</div>
            <span className="text-xs text-[#64748b] mt-2 block">
              Reducción de 22 min vs. mes previo
            </span>
          </div>
          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm">
            <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
              Hallazgos Críticos Resueltos
            </span>
            <div className="text-3xl font-bold text-[#069669] mt-1">96.8%</div>
            <span className="text-xs text-[#64748b] mt-2 block">
              14 de 15 incidentes cerrados
            </span>
          </div>
        </div>

        {/* Recent Audits Table */}
        <div className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm">
          <h2 className="font-bold text-base text-[#0b1c30] mb-3">
            Últimas Auditorías Registradas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e5eeff] text-[#64748b]">
                  <th className="pb-3 font-semibold">Código</th>
                  <th className="pb-3 font-semibold">Inmueble</th>
                  <th className="pb-3 font-semibold">Supervisor</th>
                  <th className="pb-3 font-semibold">Estado</th>
                  <th className="pb-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 font-mono font-bold text-[#0051d5]">REC-2024-089</td>
                  <td className="py-3 font-medium text-[#0b1c30]">Torre Roble (Nivel 1 a 12)</td>
                  <td className="py-3 text-[#45474c]">Ing. Carlos Mendez</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px]">
                      En Proceso de Firma
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={onReturnToCurrentAudit}
                      className="text-[#0051d5] font-semibold hover:underline"
                    >
                      Continuar Cierre
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#f8f9ff] transition-colors">
                  <td className="py-3 font-mono font-bold text-[#64748b]">REC-2024-088</td>
                  <td className="py-3 font-medium text-[#0b1c30]">Edificio Platinum Business</td>
                  <td className="py-3 text-[#45474c]">Arq. Sofia Navarro</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                      Finalizado
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-[#64748b]">Sellado (PostgreSQL)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'tareas') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">
              Gestión de Tareas Correctivas y Preventivas
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Órdenes de trabajo derivadas de inspecciones técnicas en Torre Roble
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToCurrentAudit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Auditoría REC-2024-089
          </button>
        </div>

        {/* Task Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#ffdad6] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
                  Pendiente (No bloqueante)
                </span>
                <span className="text-xs text-[#64748b] font-mono">Piso 4 • REC-2024-089</span>
              </div>
              <h3 className="font-bold text-sm text-[#0b1c30]">
                Sustitución de batería de luces de emergencia
              </h3>
              <p className="text-xs text-[#45474c] mt-2 leading-relaxed">
                Revisión del pasillo nor-oriente y reemplazo del acumulador gel 12V 7Ah. Asignado a Juan Mantenimiento.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="text-[#ba1a1a] font-semibold">Plazo: 48 hrs laborales</span>
              <span className="text-[#0051d5] font-semibold">En Curso</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#069669] text-xs font-bold">
                  Resuelta en Sitio
                </span>
                <span className="text-xs text-[#64748b] font-mono">Piso 7 • REC-2024-089</span>
              </div>
              <h3 className="font-bold text-sm text-[#0b1c30]">
                Reemplazo de extintor PQS vencido por unidad certificada 2025
              </h3>
              <p className="text-xs text-[#45474c] mt-2 leading-relaxed">
                Extintor reemplazado de manera inmediata durante el recorrido por el equipo de seguridad física.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#e5eeff] flex items-center justify-between text-xs">
              <span className="text-[#069669] font-semibold">Completado: 11:15 hrs</span>
              <span className="text-[#64748b]">Sello Certificado</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'automatizaciones') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0b1c30]">
              Automatizaciones & Supabase Edge Functions
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Disparadores y webhooks configurados para auditorías técnicas
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToCurrentAudit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Cierre de Recorrido
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#e5eeff] text-[#0051d5] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Webhook Postgres: Sello de Auditoría & Notificación
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  Activo
                </span>
              </div>
              <p className="text-xs text-[#45474c] mt-1 leading-relaxed">
                Al actualizarse <code className="text-[#0051d5] font-mono">recorridos.estado = 'finalizado'</code>, se compila el reporte en PDF con firma digital y se envía alerta vía webhook a administradores.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-[#e5eeff] shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#e5eeff] text-[#0051d5] flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  Compresión Automática de Imágenes en Supabase Storage
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  Activo (WebP 85%)
                </span>
              </div>
              <p className="text-xs text-[#45474c] mt-1 leading-relaxed">
                Todas las evidencias fotográficas subidas al bucket <code className="text-[#0051d5] font-mono">walkthrough-photos</code> son transcodificadas automáticamente a WebP optimizado con hash de integridad.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reportes
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b1c30]">
            Reportes e Informes de Seguridad Técnica
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Archivos consolidados de recorridos, bitácoras y cumplimiento normativo
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnToCurrentAudit}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Auditoría REC-2024-089
        </button>
      </div>

      <div className="rounded-xl bg-white border border-[#e5eeff] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-[#0b1c30]">
            Informes Recientes Almacenados en Supabase
          </h3>
          <span className="text-xs text-[#64748b]">Bucket: audit-reports</span>
        </div>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#0051d5]" />
              <span className="font-medium text-[#0b1c30]">
                REC-2024-089_informe_cierre_preliminar.pdf
              </span>
            </div>
            <span className="text-[#64748b]">Generado en borrador • 1.2 MB</span>
          </div>
          <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e5eeff] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-[#069669]" />
              <span className="font-medium text-[#0b1c30]">
                REC-2024-088_acta_final_sellada.pdf
              </span>
            </div>
            <span className="text-[#069669] font-medium">Sellado con firma digital • 2.4 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
