import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Wrench,
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  configureSupabase, 
  isSupabaseConnected, 
  testSupabaseConnection,
  diagnoseAllTables,
  TableDiagnosticResult
} from '../lib/supabaseClient';
import { repairSql } from '../data/supabaseScripts';
import { copyToClipboard } from '../lib/clipboard';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  onDataMigrated?: () => void;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({
  isOpen,
  onClose,
  isSuperAdmin = true,
  onDataMigrated,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'reparar' | 'config'>('diagnostico');
  const [copied, setCopied] = useState<string | null>(null);
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('sr_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('sr_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; details?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostics, setDiagnostics] = useState<TableDiagnosticResult[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    if (isOpen && isSupabaseConnected()) {
      runDiagnostics();
    }
  }, [isOpen]);

  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const results = await diagnoseAllTables();
      setDiagnostics(results);
    } catch (e) {
      console.error('Error running diagnostics:', e);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const copyText = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    } else {
      prompt('Copia manualmente este texto con Ctrl+C / Cmd+C:', text);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveConfig = async () => {
    const res = configureSupabase(supabaseUrl.trim(), supabaseKey.trim());
    if (res.success) {
      setIsTesting(true);
      const test = await testSupabaseConnection();
      setIsTesting(false);
      setTestResult(test);
      if (test.ok) {
        runDiagnostics();
        onDataMigrated?.();
      }
    } else {
      setTestResult({ ok: false, message: res.message });
    }
  };

  if (!isOpen) return null;

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-[#ba1a1a] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0b1c30] mb-2">
            Acceso Restringido
          </h3>
          <p className="text-xs text-[#64748b] leading-relaxed">
            La herramienta para diagnosticar, modificar esquemas y ejecutar scripts de reparación en la base de datos de Supabase está reservada estrictamente para usuarios con el rol <strong>SuperAdmin</strong>.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-colors cursor-pointer"
            >
              Entendido, volver a la aplicación
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0051d5] flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5 text-[#85f8c4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Diagnóstico de BD
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[#85f8c4] border border-[#85f8c4]/30 text-[10px] font-mono">
                  PostgreSQL 15+
                </span>
              </div>
              <p className="text-xs text-[#bcc7df]">
                Diagnóstico en vivo, verificación de integridad y scripts de reparación para Supabase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: ONLY the 3 requested tabs */}
        <div className="flex border-b border-[#e5eeff] bg-[#eff4ff]/60 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostico')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'diagnostico'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Diagnóstico en Vivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reparar')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'reparar'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            Script de Reparación
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Conexión &amp; Keys
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* TAB 1: DIAGNÓSTICO EN VIVO */}
          {activeTab === 'diagnostico' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-[#0b1c30] text-xs flex items-start gap-3">
                <Activity className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-[#0051d5] mb-1">
                    Estado Operativo de Base de Datos PostgreSQL
                  </h4>
                  <p className="leading-relaxed text-[#45474c]">
                    EazyOps sincroniza directamente con tu clúster de Supabase en tiempo real. Todas las entidades (edificios, usuarios con asignación por rol, recorridos sellados y tareas operativas) cuentan con esquemas canónicos. A continuación puedes verificar la salud de cada tabla y validar que las columnas primarias y foráneas estén listas.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-[#64748b]">
                  Estado de las tablas en tu base de datos Supabase conectada:
                </div>
                <button
                  type="button"
                  onClick={runDiagnostics}
                  disabled={isDiagnosing}
                  className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  {isDiagnosing ? 'Analizando BD...' : 'Re-escanear Tablas'}
                </button>
              </div>

              {diagnostics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {diagnostics.map((diag) => (
                    <div 
                      key={diag.table} 
                      className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        diag.status === 'ok'
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : diag.status === 'column_mismatch'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : diag.status === 'missing_table'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {diag.status === 'ok' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : diag.status === 'column_mismatch' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <Database className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span className="font-mono font-bold text-sm">
                            {diag.table}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-[11px] px-2 py-0.5 rounded bg-white/70 border border-black/5">
                          {diag.rowCount ?? 0} filas
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] opacity-90 leading-relaxed">
                        {diag.details || diag.message}
                      </div>

                      {(diag.status === 'column_mismatch' || diag.status === 'missing_table') && (
                        <div className="mt-2 pt-2 border-t border-rose-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-rose-800 font-semibold">
                            {diag.status === 'missing_table' ? 'Requiere creación en Supabase' : 'Requiere sincronización DDL'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveTab('reparar')}
                            className="text-[10px] text-[#0051d5] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Ir al Script <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-[#c5c6cd] text-center text-xs text-[#64748b]">
                  {isDiagnosing ? (
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-[#0051d5] animate-spin" />
                      <span>Consultando metadatos de PostgreSQL en Supabase...</span>
                    </div>
                  ) : (
                    <span>Haz clic en &quot;Re-escanear Tablas&quot; para verificar el estado de las tablas de Supabase.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCRIPT DE REPARACIÓN */}
          {activeTab === 'reparar' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <Wrench className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 mb-1">
                    Reparación Segura sin Pérdida de Datos
                  </h4>
                  <p className="leading-relaxed text-amber-900/90">
                    Este script añade de forma no destructiva las columnas faltantes (como <code>id_edificio</code>, <code>id_recorrido</code>, <code>id_tarea</code>) y habilita políticas Row Level Security (RLS) en Supabase SQL Editor.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0b1c30]">
                  Script SQL de Reparación (In-Place)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(repairSql, 'repair')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#d3e4fe] hover:bg-[#eff4ff] text-xs font-medium text-[#0051d5] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied === 'repair' ? <Check className="w-3.5 h-3.5 text-[#069669]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === 'repair' ? 'Copiado' : 'Copiar SQL'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(repairSql, 'eazyops-repair-schema.sql')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#d3e4fe] hover:bg-[#eff4ff] text-xs font-medium text-[#0051d5] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .sql</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl bg-[#0b1c30] text-[#85f8c4] font-mono text-[11px] overflow-x-auto max-h-80 border border-[#213145] leading-relaxed">
                {repairSql}
              </pre>
            </div>
          )}

          {/* TAB 3: CONEXIÓN & KEYS */}
          {activeTab === 'config' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
                <div className="text-xs text-[#45474c] leading-relaxed">
                  Las credenciales se guardan localmente en tu navegador. Una vez guardadas, la aplicación consultará directamente tu proyecto Supabase en la nube.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-mono border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Supabase Anon Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f8f9ff] text-[#0b1c30] rounded-lg text-xs font-mono border border-[#e5eeff] focus:outline-none focus:border-[#0051d5]"
                />
              </div>

              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  Guardar &amp; Probar Conexión
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1 ${
                    testResult.ok
                      ? testResult.details ? 'bg-amber-50 text-amber-950 border-amber-300' : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                      : 'bg-rose-50 text-rose-950 border-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {testResult.ok && !testResult.details ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.details && (
                    <p className="text-[11px] opacity-90 pl-6 mt-0.5">
                      {testResult.details}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#eff4ff]/60 border-t border-[#e5eeff] flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            Conexión activa con PostgreSQL en Supabase • Herramienta exclusiva de SuperAdmin
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
