import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck } from 'lucide-react';
import { DictamenFormState } from '../types';
import { copyToClipboard } from '../lib/clipboard';

interface SupabaseCodePreviewProps {
  recorridoId: string;
  formState: DictamenFormState;
}

export const SupabaseCodePreview: React.FC<SupabaseCodePreviewProps> = ({
  recorridoId,
  formState,
}) => {
  const [copied, setCopied] = useState(false);

  const codeString = `// 1. Transacción de cierre en Postgres
const { data, error } = await supabase
  .from('recorridos')
  .update({
    estado: 'finalizado',
    calificacion: ${formState.rating.toFixed(1)},
    tipo_cierre: '${formState.tipoCierre}',
    cerrado_en: new Date().toISOString(),
    supervisor_id: user.id
  })
  .eq('id', '${recorridoId}');

// 2. Commit del reporte a Storage
const pdfFile = await generateAuditPDF();
await supabase.storage
  .from('audit-reports')
  .upload('${recorridoId}/reporte_final.pdf', pdfFile);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-[#111c2e] text-white p-4 sm:p-5 shadow-sm border border-[#213145]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#069669]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#bcc7df]">
            Supabase Client Handler
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white font-medium">
            v2.39.8
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[#bcc7df] hover:text-white p-1 transition-colors"
            title="Copiar snippet de código"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#069669]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-black/50 p-3 overflow-x-auto text-[11px] font-mono text-[#d3e4fe] leading-relaxed border border-white/5">
        <pre>
          <code>
            <span className="text-[#85f8c4]">// 1. Transacción de cierre en Postgres</span>
            {'\n'}
            <span className="text-[#346cef]">const</span> &#123; data, error &#125; = <span className="text-[#346cef]">await</span> supabase
            {'\n'}  .<span className="text-[#85f8c4]">from</span>(<span className="text-amber-300">'recorridos'</span>)
            {'\n'}  .<span className="text-[#85f8c4]">update</span>(&#123;
            {'\n'}    estado: <span className="text-amber-300">'finalizado'</span>,
            {'\n'}    calificacion: <span className="text-amber-300">{formState.rating.toFixed(1)}</span>,
            {'\n'}    tipo_cierre: <span className="text-amber-300">'{formState.tipoCierre}'</span>,
            {'\n'}    cerrado_en: <span className="text-[#346cef]">new</span> Date().toISOString(),
            {'\n'}    supervisor_id: user.id
            {'\n'}  &#125;)
            {'\n'}  .<span className="text-[#85f8c4]">eq</span>(<span className="text-amber-300">'id'</span>, <span className="text-amber-300">'{recorridoId}'</span>);
            {'\n\n'}
            <span className="text-[#85f8c4]">// 2. Commit del reporte a Storage</span>
            {'\n'}
            <span className="text-[#346cef]">const</span> pdfFile = <span className="text-[#346cef]">await</span> generateAuditPDF();
            {'\n'}
            <span className="text-[#346cef]">await</span> supabase.storage
            {'\n'}  .<span className="text-[#85f8c4]">from</span>(<span className="text-amber-300">'audit-reports'</span>)
            {'\n'}  .<span className="text-[#85f8c4]">upload</span>(<span className="text-amber-300">`{recorridoId}/reporte_final.pdf`</span>, pdfFile);
          </code>
        </pre>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[#bcc7df]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#069669]"></span>
          RLS Enforcement: Enabled
        </span>
        <span className="text-[11px] text-[#7a849b] font-mono">PostgreSQL 15</span>
      </div>
    </div>
  );
};
