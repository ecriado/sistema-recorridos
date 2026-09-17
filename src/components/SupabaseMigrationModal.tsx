import React, { useState } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { configureSupabase, isSupabaseConnected, testSupabaseConnection } from '../lib/supabaseClient';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'config' | 'storage'>('sql');
  const [copied, setCopied] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('sr_supabase_url') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('sr_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const sqlCode = `-- SISTEMA DE RECORRIDOS v8.7.0 (EAZY PROPERTY OPS)
-- Esquema DDL para Supabase (PostgreSQL 15+)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Edificios
CREATE TABLE IF NOT EXISTS public.edificios (
  id_edificio VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usuarios y Roles
CREATE TABLE IF NOT EXISTS public.usuarios (
  id_usuario VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('SuperAdmin', 'Administrador', 'Supervisor', 'Mantenimiento')),
  usuario_login VARCHAR(60) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  ultimo_acceso TIMESTAMPTZ
);

-- 3. Recorridos
CREATE TABLE IF NOT EXISTS public.recorridos (
  id_recorrido VARCHAR(30) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE RESTRICT,
  fecha_programada TIMESTAMPTZ NOT NULL,
  fecha_cierre_programada TIMESTAMPTZ,
  cierre_automatico BOOLEAN DEFAULT false,
  inspector_email VARCHAR(150) NOT NULL,
  estado VARCHAR(50) DEFAULT 'Programado' CHECK (estado IN ('Programado', 'En Proceso', 'Completado', 'Cancelado')),
  observaciones TEXT,
  creado_por VARCHAR(150) NOT NULL,
  fecha_inicio TIMESTAMPTZ,
  fecha_fin TIMESTAMPTZ,
  comentario_cierre TEXT,
  calificacion_cierre NUMERIC(3, 1),
  tipo_cierre VARCHAR(50),
  resultado_cierre VARCHAR(50),
  firma_digital_hash TEXT
);

-- 4. Checkpoints
CREATE TABLE IF NOT EXISTS public.checkpoints (
  id_checkpoint VARCHAR(30) PRIMARY KEY,
  id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
  id_recorrido VARCHAR(30) REFERENCES public.recorridos(id_recorrido) ON DELETE CASCADE,
  ubicacion VARCHAR(200) NOT NULL,
  descripcion TEXT,
  orden INT DEFAULT 1,
  activo BOOLEAN DEFAULT true
);

-- 5. Hallazgos
CREATE TABLE IF NOT EXISTS public.hallazgos (
  id_hallazgo VARCHAR(30) PRIMARY KEY,
  id_recorrido VARCHAR(30) REFERENCES public.recorridos(id_recorrido) ON DELETE CASCADE,
  id_checkpoint VARCHAR(30) REFERENCES public.checkpoints(id_checkpoint) ON DELETE CASCADE,
  estatus VARCHAR(50) NOT NULL CHECK (estatus IN ('Conforme', 'Hallazgo/Falla')),
  comentario TEXT,
  foto_url TEXT,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  cerrado BOOLEAN DEFAULT false,
  fecha_cierre TIMESTAMPTZ
);

-- 6. Tareas
CREATE TABLE IF NOT EXISTS public.tareas (
  id_tarea VARCHAR(30) PRIMARY KEY,
  id_hallazgo VARCHAR(30) REFERENCES public.hallazgos(id_hallazgo) ON DELETE SET NULL,
  id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE RESTRICT,
  tipo_origen VARCHAR(50) DEFAULT 'Manual',
  asignado_a_email VARCHAR(150) NOT NULL,
  titulo_tarea VARCHAR(200) NOT NULL,
  instrucciones TEXT,
  prioridad VARCHAR(20) DEFAULT 'Media',
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_limite DATE,
  fecha_inicio TIMESTAMPTZ,
  fecha_resolucion TIMESTAMPTZ,
  creado_por VARCHAR(150) NOT NULL,
  estado_tarea VARCHAR(50) DEFAULT 'Pendiente',
  observaciones_cierre TEXT,
  foto_evidencia_cierre TEXT,
  tiempo_total_minutos INT,
  resultado_cumplimiento VARCHAR(50)
);

-- 7. Buckets de Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('walkthrough-photos', 'walkthrough-photos', true),
  ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlCode], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supabase_migration_schema.sql';
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
    } else {
      setTestResult({ ok: false, message: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111c2e]/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#e5eeff] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#111c2e] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0051d5] flex items-center justify-center text-white shadow-sm">
              <Database className="w-5 h-5 text-[#85f8c4]" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Migración a Supabase &amp; PostgreSQL
              </h3>
              <p className="text-xs text-[#bcc7df]">
                Transición desde Google Sheets (DB_ID: 1ZrFWv2Z...) hacia Supabase Cloud
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
        <div className="flex border-b border-[#e5eeff] bg-[#eff4ff]/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            Esquema SQL (DDL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            Conexión &amp; API Keys
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'storage'
                ? 'border-[#0051d5] text-[#0051d5]'
                : 'border-transparent text-[#64748b] hover:text-[#0b1c30]'
            }`}
          >
            Buckets de Storage
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto">
          {activeTab === 'sql' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-[#64748b]">
                <span>
                  Ejecuta este script en el <strong>SQL Editor</strong> de tu proyecto Supabase:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#069669]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .sql
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#0b1c30] p-4 text-xs font-mono text-[#d3e4fe] overflow-x-auto max-h-80 border border-[#213145] leading-relaxed">
                <pre>{sqlCode}</pre>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0051d5] shrink-0 mt-0.5" />
                <div className="text-xs text-[#45474c] leading-relaxed">
                  Puedes ingresar las credenciales de tu proyecto Supabase para que la app se comunique de inmediato con tu base de datos y buckets. Si no se configuran, la aplicación opera en <strong>modo local integrado</strong> con datos de demostración en tiempo real.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#0b1c30]">Supabase Project URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
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
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                    testResult.ok
                      ? 'bg-[#e5eeff] text-[#069669] border-[#a7f3d0]'
                      : 'bg-[#ffdad6] text-[#ba1a1a] border-[#fecaca]'
                  }`}
                >
                  {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

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
