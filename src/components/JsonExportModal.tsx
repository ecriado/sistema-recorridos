import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';
import { AuditData, DictamenFormState } from '../types';
import { copyToClipboard } from '../lib/clipboard';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: AuditData;
  formState: DictamenFormState;
  isSealed: boolean;
  sealedAt?: string;
  signatureData?: string;
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  isOpen,
  onClose,
  audit,
  formState,
  isSealed,
  sealedAt,
  signatureData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportPayload = {
    supabase_schema: 'public',
    table: 'recorridos',
    record_id: audit.id,
    codigo_auditoria: audit.code,
    inmueble: audit.location,
    supervisor: {
      nombre: audit.supervisorName,
      cargo: audit.supervisorRole,
      credencial: audit.supervisorLicense,
    },
    estado: isSealed ? 'finalizado' : audit.status,
    estado_etiqueta: isSealed ? 'Auditoría Sellada' : audit.statusLabel,
    fecha_cierre: sealedAt || null,
    dictamen: {
      calificacion: formState.rating,
      tipo_cierre: formState.tipoCierre,
      resumen_tecnico: formState.dictamenTexto,
      notificar_pdf: formState.notifyPdfInSupabase,
      webhook_postgres_activado: formState.generateWebhook,
      firma_hash: signatureData ? 'sha256:7e99bc18fa...' : null,
      firma_presente: Boolean(signatureData),
    },
    kpis: audit.stats,
    checkpoints: audit.checkpoints.map((chk) => ({
      numero: chk.number,
      titulo: chk.title,
      estado: chk.status,
      hora: chk.time,
      descripcion: chk.description,
      etiqueta: chk.tag,
      severidad: chk.severity || null,
      responsable: chk.assignee || null,
      evidencias: chk.evidence
        ? {
            archivo: chk.evidence.filename,
            bucket: chk.evidence.bucket,
            url_almacenamiento: chk.evidence.displayUrl,
            tamano: chk.evidence.size,
            hash: chk.evidence.hash || null,
            publico: chk.evidence.isPublic || false,
          }
        : null,
      comparativa: chk.comparison || null,
    })),
    metadatos_supabase: {
      storage_bucket_auditorias: 'audit-reports',
      storage_bucket_fotos: 'walkthrough-photos',
      rls_policy: 'supervisor_signoff_only',
      postgres_version: '15.4',
      edge_runtime: 'supabase-realtime-v2.39.8',
    },
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const handleCopy = async () => {
    const ok = await copyToClipboard(jsonString);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      prompt('Copia manualmente este JSON:', jsonString);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${audit.code}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/65 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff] flex flex-col">
        {/* Header */}
        <div className="bg-[#111c2e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0051d5] flex items-center justify-center text-white">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">
                Exportar Registro Supabase (JSON)
              </h4>
              <p className="text-xs text-[#bcc7df]">
                Estructura compatible con la tabla <code className="text-[#85f8c4]">public.recorridos</code>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* JSON Preview */}
        <div className="p-4 flex-1 overflow-auto bg-[#0b1c30]">
          <pre className="text-xs font-mono text-[#d3e4fe] leading-relaxed">
            <code>{jsonString}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#f8f9ff] border-t border-[#e5eeff] flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            Payload estandarizado para migración o auditoría externa
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-medium text-[#0b1c30] hover:bg-[#e5eeff] transition-colors flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#069669]" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar JSON
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .json
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
