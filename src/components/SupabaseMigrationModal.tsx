import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Wrench,
  Activity,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { 
  configureSupabase, 
  isSupabaseConnected, 
  testSupabaseConnection,
  diagnoseAllTables,
  TableDiagnosticResult
} from '../lib/supabaseClient';
import { repairSql, cleanRebuildSql } from '../data/supabaseScripts';
import { SheetsToSupabaseMigrator } from './SheetsToSupabaseMigrator';
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
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'reparar' | 'sql' | 'migrar_sheets' | 'config' | 'storage'>('diagnostico');
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

  // repairSql and cleanRebuildSql are imported from ../data/supabaseScripts



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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-[#0b1c30]">Acceso Exclusivo de SuperAdmin</h3>
          <p className="text-xs text-[#64748b] mt-2 leading-relaxed">
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
                  Adecuación y Diagnóstico de Supabase
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-[#85f8c4] border border-[#85f8c4]/30 text-[10px] font-mono">
                  PostgreSQL 15+
                </span>
              </div>
              <p className="text-xs text-[#bcc7df]">
                Detección y corrección de columnas faltantes como <code>edificios.id_edificio</code>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e5eeff] bg-[#eff4ff]/60 px-5 pt-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostico')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'reparar'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-500" />
            Script de Reparación (In-Place)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Reinstalación Limpia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('migrar_sheets')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'migrar_sheets'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Migrar desde Sheets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Conexión &amp; Keys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'storage'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            Buckets Storage
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* TAB 1: DIAGNÓSTICO EN VIVO */}
          {activeTab === 'diagnostico' && (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-950 mb-1">
                    Causa detectada: Mapeo de columnas en Supabase
                  </h4>
                  <p className="leading-relaxed text-amber-900/90">
                    Al crear tablas con la interfaz gráfica de Supabase, el sistema asigna automáticamente una columna primaria llamada <code>id</code>. El backend y los formularios de este proyecto esperan el identificador canónico <code>id_edificio</code>. 
                    El comando <code>CREATE TABLE IF NOT EXISTS</code> no modifica columnas si la tabla ya existía.
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
                  className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors"
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
                          : 'bg-amber-50/60 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs flex items-center gap-1.5">
                          public.{diag.table}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          diag.status === 'ok' 
                            ? 'bg-emerald-200/60 text-emerald-800'
                            : diag.status === 'column_mismatch'
                            ? 'bg-rose-200/80 text-rose-800'
                            : 'bg-amber-200/70 text-amber-800'
                        }`}>
                          {diag.status === 'ok' ? 'Válida' : diag.status === 'column_mismatch' ? 'Faltan Columnas' : 'No Encontrada'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {diag.message}
                      </p>
                      {diag.missingColumns && diag.missingColumns.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-rose-200/60 font-mono text-[10px] text-rose-700">
                          Requeridas: {diag.missingColumns.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#f8f9ff] border border-dashed border-[#c5c6cd] text-center text-xs text-[#64748b]">
                  {isSupabaseConnected() 
                    ? 'Haz clic en "Re-escanear Tablas" para auditar cada tabla y columna en tu Supabase.'
                    : 'Ingresa primero tus credenciales en la pestaña "Conexión & Keys" para analizar tu base de datos.'
                  }
                </div>
              )}

              <div className="mt-2 p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs text-[#0051d5]">¿Cómo solucionarlo en 1 minuto?</h5>
                  <p className="text-xs text-[#45474c] mt-0.5">
                    Copia el script de la pestaña <strong>"Script de Reparación"</strong> y pégalo en el SQL Editor de Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reparar')}
                  className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] flex items-center gap-2 shrink-0 shadow-sm"
                >
                  Ir al Script Reparador
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCRIPT DE REPARACIÓN IN-PLACE */}
          {activeTab === 'reparar' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] text-xs text-[#0b1c30] space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-[#0051d5]">
                  <ShieldCheck className="w-4 h-4 text-[#0051d5]" />
                  Modo No-Destructivo Universal (Sin pérdida de datos)
                </div>
                <p className="text-[#334155] leading-relaxed">
                  Este script repara las tablas existentes añadiendo las columnas compatibles (como <code>id_edificio TEXT</code>) <strong>sin alterar ni renombrar la columna <code>id UUID</code></strong>. De este modo, no entra en conflicto con llaves foráneas existentes como <code>routes_building_id_fkey</code>.
                </p>
                <div className="pt-1 text-[11px] text-[#475569] bg-white/70 p-2 rounded-lg border border-[#e2e8f0]">
                  <strong>¿Tienes la tabla heredada 'routes'?</strong> Si deseas eliminar la restricción foránea antigua directamente antes de correr el script, puedes ejecutar en Supabase:
                  <div className="flex items-center justify-between mt-1 font-mono text-[#0041ab] bg-[#f8fafc] p-1.5 rounded border border-[#cbd5e1]">
                    <code>ALTER TABLE IF EXISTS public.routes DROP CONSTRAINT IF EXISTS routes_building_id_fkey;</code>
                    <button
                      type="button"
                      onClick={() => copyText("ALTER TABLE IF EXISTS public.routes DROP CONSTRAINT IF EXISTS routes_building_id_fkey;", 'drop_fk')}
                      className="ml-2 px-2 py-0.5 rounded bg-[#0051d5] text-white text-[10px] font-sans font-medium hover:bg-[#0041ab] transition-colors shrink-0"
                    >
                      {copied === 'drop_fk' ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>Pasos: <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Pegar &rarr; Run</strong></span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(repairSql, 'repair')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-colors"
                  >
                    {copied === 'repair' ? <Check className="w-3.5 h-3.5 text-[#069669]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'repair' ? '¡Copiado!' : 'Copiar Script Reparador'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(repairSql, 'supabase_repair_universal.sql')}
                    className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .sql
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b1c30] p-4 text-xs font-mono text-[#d3e4fe] overflow-x-auto max-h-80 border border-[#213145] leading-relaxed">
                <pre>{repairSql}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: REINSTALACIÓN LIMPIA */}
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950">
                <strong>Reinstalación Completa (Clean Slate):</strong> Utiliza este script si tu base de datos sólo contiene pruebas iniciales. Ejecuta <code>DROP TABLE CASCADE</code> y crea todas las tablas desde cero con sus relaciones foráneas, constraints, RLS y datos iniciales de edificios guatemaltecos.
              </div>

              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>Script DDL Completo:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(cleanRebuildSql, 'clean')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-colors"
                  >
                    {copied === 'clean' ? <Check className="w-3.5 h-3.5 text-[#069669]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === 'clean' ? '¡Copiado!' : 'Copiar Script Limpio'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(cleanRebuildSql, 'supabase_clean_rebuild.sql')}
                    className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .sql
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b1c30] p-4 text-xs font-mono text-[#d3e4fe] overflow-x-auto max-h-80 border border-[#213145] leading-relaxed">
                <pre>{cleanRebuildSql}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: CONEXIÓN & KEYS */}
          {activeTab === 'config' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
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
                  className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-all flex items-center gap-2 shadow-sm"
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

          {/* TAB 4: MIGRAR DESDE GOOGLE SHEETS */}
          {activeTab === 'migrar_sheets' && (
            <SheetsToSupabaseMigrator
              supabaseUrl={supabaseUrl}
              supabaseKey={supabaseKey}
            />
          )}

          {/* TAB 5: STORAGE */}
          {activeTab === 'storage' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-[#64748b]">
                El sistema de inspecciones de <strong>EAZY PROPERTY OPS</strong> utiliza 2 buckets principales en Supabase Storage:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#eff4ff]/70 border border-[#d3e4fe] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0051d5]">walkthrough-photos</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">Público / CDN</span>
                    </div>
                    <p className="text-xs text-[#45474c] mt-1">
                      Almacena evidencias fotográficas de checkpoints (Lobby, Tableros, Extintores, Bombas) con compresión WebP y URLs firmadas para hallazgos.
                    </p>
                  </div>
                  <span className="text-[11px] text-[#64748b] mt-3 font-mono">Max size: 10MB • WebP / JPG / PNG</span>
                </div>

                <div className="p-4 rounded-xl bg-[#eff4ff]/70 border border-[#d3e4fe] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#0051d5]">audit-reports</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold">Privado con RLS</span>
                    </div>
                    <p className="text-xs text-[#45474c] mt-1">
                      Almacena las actas técnicas y reportes finales compilados en PDF con firma digital criptográfica del supervisor.
                    </p>
                  </div>
                  <span className="text-[11px] text-[#64748b] mt-3 font-mono">Restringido a supervisores autenticados</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#eff4ff]/60 border-t border-[#e5eeff] flex items-center justify-between">
          <span className="text-xs text-[#64748b]">
            Reemplazo de <code>DriveApp</code> y <code>SpreadsheetApp</code> por PostgreSQL y Supabase Storage
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
