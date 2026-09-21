import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  ArrowRight, 
  UploadCloud, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Table,
  Play,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { getSupabaseClient, isSupabaseConnected } from '../lib/supabaseClient';
import { copyToClipboard } from '../lib/clipboard';
import { extractorPostgresV1_1Script } from '../data/supabaseScripts';

interface SheetsToSupabaseMigratorProps {
  supabaseUrl?: string;
  supabaseKey?: string;
}

export const SheetsToSupabaseMigrator: React.FC<SheetsToSupabaseMigratorProps> = ({
  supabaseUrl = localStorage.getItem('sr_supabase_url') || '',
  supabaseKey = localStorage.getItem('sr_supabase_key') || '',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'script' | 'paste' | 'diccionario'>('script');
  const [scriptVariant, setScriptVariant] = useState<'sql_generator' | 'direct_api'>('sql_generator');
  const [copied, setCopied] = useState<string | null>(null);

  // Paste / Import state
  const [selectedTable, setSelectedTable] = useState<'edificios' | 'usuarios' | 'recorridos' | 'checkpoints' | 'hallazgos' | 'tareas' | 'tareas_automaticas'>('edificios');
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string; count?: number }>({
    type: 'idle',
    message: ''
  });
  const [generatedSql, setGeneratedSql] = useState('');

  const copyText = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2500);
    } else {
      // Fallback: alert or prompt user
      prompt('Copia manualmente este texto con Ctrl+C / Cmd+C:', text);
    }
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Google Apps Script source code
  const appsScriptCode = `/**
 * ==============================================================================
 * SCRIPT DE MIGRACIÓN: GOOGLE SHEETS -> SUPABASE
 * EAZY PROPERTY OPS - SISTEMA DE RECORRIDOS
 * ==============================================================================
 * Instrucciones:
 * 1. En tu hoja de cálculo de Google Sheets, ve a:
 *    Extensiones -> Apps Script
 * 2. Crea un nuevo archivo llamado "MigrarASupabase.gs"
 * 3. Pega este código completo.
 * 4. Ajusta abajo las variables SUPABASE_URL y SUPABASE_SERVICE_KEY (o Anon Key).
 * 5. Selecciona la función "ejecutarMigracionCompleta" en la barra superior y pulsa "Ejecutar".
 * 6. Observa el registro en Ver -> Registro de ejecución (Logger).
 * ==============================================================================
 */

const SUPABASE_URL = "${supabaseUrl || 'https://TU-PROYECTO.supabase.co'}";
const SUPABASE_KEY = "${supabaseKey || 'TU_ANON_KEY_O_SERVICE_ROLE_KEY'}";

function ejecutarMigracionCompleta() {
  Logger.log("🚀 INICIANDO MIGRACIÓN DESDE GOOGLE SHEETS A SUPABASE...");

  if (!SUPABASE_URL || SUPABASE_URL.includes("TU-PROYECTO") || !SUPABASE_KEY) {
    throw new Error("❌ Error: Debes configurar SUPABASE_URL y SUPABASE_KEY antes de ejecutar.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Edificios
  migrarTabla(ss, "Edificios", "edificios", "id_edificio", fila => ({
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "Edificio sin nombre").trim(),
    direccion: String(fila["Direccion"] || fila["Dirección"] || fila["direccion"] || "").trim(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 2. Usuarios
  migrarTabla(ss, "Usuarios", "usuarios", "id_usuario", fila => ({
    id_usuario: String(fila["ID_Usuario"] || fila["id_usuario"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "").trim(),
    email: String(fila["Email"] || fila["email"] || "").trim().toLowerCase(),
    rol: normalizarRol(fila["Rol"] || fila["rol"]),
    usuario_login: String(fila["Usuario_Login"] || fila["usuario_login"] || fila["Usuario"] || "").trim().toLowerCase(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 3. Recorridos
  migrarTabla(ss, "Recorridos", "recorridos", "id_recorrido", fila => ({
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "Recorrido").trim(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    fecha_programada: parseFechaIso(fila["Fecha_Programada"] || fila["fecha_programada"]),
    fecha_cierre_programada: parseFechaIso(fila["Fecha_Cierre_Programada"] || fila["fecha_cierre_programada"]),
    cierre_automatico: parseBoolean(fila["Cierre_Automatico"], false),
    inspector_email: String(fila["Inspector_Email"] || fila["inspector_email"] || fila["Inspector"] || "").trim().toLowerCase(),
    estado: String(fila["Estado"] || fila["estado"] || "Programado").trim(),
    observaciones: String(fila["Observaciones"] || fila["observaciones"] || "").trim(),
    creado_por: String(fila["Creado_Por"] || fila["creado_por"] || "sistema").trim()
  }));

  // 4. Checkpoints
  migrarTabla(ss, "Checkpoints", "checkpoints", "id_checkpoint", fila => ({
    id_checkpoint: String(fila["ID_Checkpoint"] || fila["id_checkpoint"] || fila["ID"] || "").trim(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || "").trim(),
    ubicacion: String(fila["Ubicacion"] || fila["Ubicación"] || fila["ubicacion"] || "").trim(),
    descripcion: String(fila["Descripcion"] || fila["Descripción"] || fila["descripcion"] || "").trim(),
    orden: Number(fila["Orden"] || fila["orden"] || 1),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 5. Hallazgos
  migrarTabla(ss, "Hallazgos", "hallazgos", "id_hallazgo", fila => ({
    id_hallazgo: String(fila["ID_Hallazgo"] || fila["id_hallazgo"] || fila["ID"] || "").trim(),
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || "").trim(),
    id_checkpoint: String(fila["ID_Checkpoint"] || fila["id_checkpoint"] || "").trim(),
    estatus: String(fila["Estatus"] || fila["estatus"] || "Conforme").trim(),
    comentario: String(fila["Comentario"] || fila["comentario"] || "").trim(),
    foto_url: String(fila["Foto"] || fila["foto_url"] || fila["Foto_URL"] || "").trim(),
    cerrado: parseBoolean(fila["Cerrado"], false)
  }));

  // 6. Tareas
  migrarTabla(ss, "Tareas", "tareas", "id_tarea", fila => ({
    id_tarea: String(fila["ID_Tarea"] || fila["id_tarea"] || fila["ID"] || "").trim(),
    id_hallazgo: fila["ID_Hallazgo"] ? String(fila["ID_Hallazgo"]).trim() : null,
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    tipo_origen: String(fila["Tipo_Origen"] || fila["tipo_origen"] || "Manual").trim(),
    asignado_a_email: String(fila["Asignado_A_Email"] || fila["asignado_a_email"] || "").trim().toLowerCase(),
    titulo_tarea: String(fila["Titulo_Tarea"] || fila["Título_Tarea"] || fila["titulo_tarea"] || fila["Titulo"] || "").trim(),
    instrucciones: String(fila["Instrucciones"] || fila["instrucciones"] || "").trim(),
    prioridad: String(fila["Prioridad"] || fila["prioridad"] || "Media").trim(),
    estado_tarea: String(fila["Estado_Tarea"] || fila["estado_tarea"] || fila["Estado"] || "Pendiente").trim(),
    fecha_limite: parseFechaSolo(fila["Fecha_Limite"] || fila["fecha_limite"]),
    creado_por: String(fila["Creado_Por"] || fila["creado_por"] || "sistema").trim(),
    observaciones_cierre: String(fila["Observaciones_Cierre"] || fila["observaciones_cierre"] || "").trim(),
    foto_evidencia_cierre: String(fila["Foto_Evidencia_Cierre"] || fila["foto_evidencia_cierre"] || "").trim()
  }));

  // 7. Tareas Automáticas
  migrarTabla(ss, "Tareas_Automaticas", "tareas_automaticas", "id_automatizacion", fila => ({
    id_automatizacion: String(fila["ID_Automatizacion"] || fila["id_automatizacion"] || fila["ID"] || "").trim(),
    titulo: String(fila["Titulo"] || fila["titulo"] || "").trim(),
    creado_por_email: String(fila["Creado_Por_Email"] || fila["creado_por_email"] || "").trim().toLowerCase(),
    asignado_a_email: String(fila["Asignado_A_Email"] || fila["asignado_a_email"] || "").trim().toLowerCase(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    frecuencia: String(fila["Frecuencia"] || fila["frecuencia"] || "Semanal").trim(),
    hora: String(fila["Hora"] || fila["hora"] || "08:00").trim(),
    fecha_inicio: parseFechaSolo(fila["Fecha_Inicio"] || fila["fecha_inicio"]),
    prioridad: String(fila["Prioridad"] || fila["prioridad"] || "Media").trim(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  Logger.log("🎉 ¡MIGRACIÓN COMPLETADA SATISFACTORIAMENTE!");
}

function migrarTabla(ss, nombreHoja, tablaSupabase, columnaId, mapperFn) {
  const hoja = ss.getSheetByName(nombreHoja) || ss.getSheetByName(nombreHoja.toLowerCase());
  if (!hoja) {
    Logger.log("⚠️ Hoja '" + nombreHoja + "' no encontrada en este documento. Omitiendo.");
    return;
  }

  const datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) {
    Logger.log("ℹ️ Hoja '" + nombreHoja + "' está vacía. Omitiendo.");
    return;
  }

  const encabezados = datos[0].map(h => String(h).trim());
  const registros = [];

  for (let i = 1; i < datos.length; i++) {
    const filaObj = {};
    for (let j = 0; j < encabezados.length; j++) {
      filaObj[encabezados[j]] = datos[i][j];
    }
    
    try {
      const record = mapperFn(filaObj);
      if (record && record[columnaId]) {
        registros.push(record);
      }
    } catch (err) {
      Logger.log("Error procesando fila " + (i + 1) + " de " + nombreHoja + ": " + err.message);
    }
  }

  if (registros.length === 0) {
    Logger.log("ℹ️ No hay registros válidos en " + nombreHoja);
    return;
  }

  Logger.log("📤 Enviando " + registros.length + " registros de " + nombreHoja + " a Supabase (" + tablaSupabase + ")...");
  
  // Enviar en bloques de 50 para evitar exceder límites de payload
  const CHUNK_SIZE = 50;
  for (let c = 0; c < registros.length; c += CHUNK_SIZE) {
    const chunk = registros.slice(c, c + CHUNK_SIZE);
    enviarASupabase(tablaSupabase, columnaId, chunk);
  }
}

function enviarASupabase(tabla, onConflictCol, payload) {
  const url = SUPABASE_URL + "/rest/v1/" + tabla + "?on_conflict=" + encodeURIComponent(onConflictCol);
  const options = {
    method: "post",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    Logger.log("✅ Lote insertado correctamente en " + tabla);
  } else {
    Logger.log("❌ Error en " + tabla + " (Código " + code + "): " + response.getContentText());
  }
}

function parseBoolean(val, defecto) {
  if (val === undefined || val === null || val === "") return defecto;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "1" || s === "si" || s === "sí" || s === "activo";
}

function parseFechaIso(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch (e) {
    return null;
  }
}

function parseFechaSolo(val) {
  if (!val) return null;
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
  const s = String(val).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function normalizarRol(val) {
  const s = String(val || "").trim().toLowerCase();
  if (s.includes("super")) return "SuperAdmin";
  if (s.includes("supervisor")) return "Supervisor";
  if (s.includes("mantenimiento") || s.includes("tecnico") || s.includes("técnico")) return "Mantenimiento";
  return "Administrador";
}
`;

  // Parse pasted TSV / CSV data
  const handleParseData = () => {
    if (!pastedData.trim()) {
      setParsedRows([]);
      setParsedHeaders([]);
      setGeneratedSql('');
      return;
    }

    const lines = pastedData.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setImportStatus({
        type: 'error',
        message: 'Debes incluir al menos la fila de encabezados y una fila con datos.'
      });
      return;
    }

    // Determine separator: tab or comma
    const firstLine = lines[0];
    const separator = firstLine.includes('\t') ? '\t' : ',';
    const headers = firstLine.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
    setParsedHeaders(headers);

    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(separator).map(p => p.trim().replace(/^["']|["']$/g, ''));
      const obj: any = {};
      headers.forEach((h, idx) => {
        obj[h] = parts[idx] !== undefined ? parts[idx] : '';
      });
      rows.push(obj);
    }

    setParsedRows(rows);
    setImportStatus({
      type: 'idle',
      message: `${rows.length} fila(s) detectada(s). Lista para importar.`
    });

    // Auto-generate SQL insert statement
    generateSqlFromRows(selectedTable, headers, rows);
  };

  const generateSqlFromRows = (table: string, headers: string[], rows: any[]) => {
    if (!rows.length) {
      setGeneratedSql('');
      return;
    }

    // Map headers to snake_case column names
    const mappedHeaders = headers.map(h => {
      const clean = h.toLowerCase().trim();
      if (clean === 'id' || clean.startsWith('id_')) {
        if (table === 'edificios') return 'id_edificio';
        if (table === 'usuarios') return 'id_usuario';
        if (table === 'recorridos') return 'id_recorrido';
        if (table === 'checkpoints') return 'id_checkpoint';
        if (table === 'hallazgos') return 'id_hallazgo';
        if (table === 'tareas') return 'id_tarea';
        if (table === 'tareas_automaticas') return 'id_automatizacion';
      }
      return clean
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')
        .replace(/\s+/g, '_');
    });

    const valuesList = rows.map(r => {
      const vals = headers.map(h => {
        const val = r[h];
        if (val === null || val === undefined || val === '') return 'NULL';
        if (val.toLowerCase() === 'true' || val === '1') return 'true';
        if (val.toLowerCase() === 'false' || val === '0') return 'false';
        const num = Number(val);
        if (!isNaN(num) && !val.includes('-') && !val.includes('/')) return num;
        return `'${val.replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    });

    const pkMap: Record<string, string> = {
      edificios: 'id_edificio',
      usuarios: 'id_usuario',
      recorridos: 'id_recorrido',
      checkpoints: 'id_checkpoint',
      hallazgos: 'id_hallazgo',
      tareas: 'id_tarea',
      tareas_automaticas: 'id_automatizacion'
    };

    const pk = pkMap[table] || 'id';

    const sql = `INSERT INTO public.${table} (${mappedHeaders.join(', ')})
VALUES 
${valuesList.join(',\n')}
ON CONFLICT (${pk}) DO UPDATE 
SET ${mappedHeaders.filter(h => h !== pk).map(h => `${h} = EXCLUDED.${h}`).join(', ')};`;

    setGeneratedSql(sql);
  };

  const handleImportToSupabase = async () => {
    if (!isSupabaseConnected()) {
      setImportStatus({
        type: 'error',
        message: 'No hay conexión configurada con Supabase. Ingresa tus credenciales en la pestaña "Conexión & Keys".'
      });
      return;
    }

    if (!parsedRows.length) {
      setImportStatus({
        type: 'error',
        message: 'No hay datos para importar. Pega los datos y pulsa "Analizar datos".'
      });
      return;
    }

    setImportStatus({
      type: 'loading',
      message: `Importando ${parsedRows.length} registro(s) a la tabla '${selectedTable}' en Supabase...`
    });

    try {
      // Map rows
      const recordsToInsert = parsedRows.map(r => {
        const item: any = {};
        Object.keys(r).forEach(k => {
          let cleanKey = k.toLowerCase().trim()
            .replace(/á/g, 'a')
            .replace(/é/g, 'e')
            .replace(/í/g, 'i')
            .replace(/ó/g, 'o')
            .replace(/ú/g, 'u')
            .replace(/\s+/g, '_');
          
          if (cleanKey === 'id' || cleanKey.startsWith('id_')) {
            if (selectedTable === 'edificios') cleanKey = 'id_edificio';
            else if (selectedTable === 'usuarios') cleanKey = 'id_usuario';
            else if (selectedTable === 'recorridos') cleanKey = 'id_recorrido';
            else if (selectedTable === 'checkpoints') cleanKey = 'id_checkpoint';
            else if (selectedTable === 'hallazgos') cleanKey = 'id_hallazgo';
            else if (selectedTable === 'tareas') cleanKey = 'id_tarea';
            else if (selectedTable === 'tareas_automaticas') cleanKey = 'id_automatizacion';
          }

          let val = r[k];
          if (val === 'true' || val === 'TRUE') val = true;
          else if (val === 'false' || val === 'FALSE') val = false;
          else if (val === '') val = null;

          item[cleanKey] = val;
        });
        return item;
      });

      const client = getSupabaseClient();
      if (!client) {
        setImportStatus({
          type: 'error',
          message: 'No se pudo obtener el cliente de Supabase. Verifica tus credenciales.'
        });
        return;
      }

      const { data, error } = await client
        .from(selectedTable)
        .upsert(recordsToInsert);

      if (error) {
        setImportStatus({
          type: 'error',
          message: `Error al insertar en Supabase: ${error.message} (Código: ${error.code})`
        });
      } else {
        setImportStatus({
          type: 'success',
          message: `¡Éxito! Se migraron ${recordsToInsert.length} registro(s) a '${selectedTable}' en Supabase.`,
          count: recordsToInsert.length
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: `Excepción durante la migración: ${err.message || err}`
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between border-b border-[#d3e4fe] pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'script'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'bg-white text-[#475569] hover:bg-[#eff4ff] border border-[#e2e8f0]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Opción 1: Script Directo Apps Script (.gs)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'paste'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'bg-white text-[#475569] hover:bg-[#eff4ff] border border-[#e2e8f0]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Opción 2: Copiar y Pegar Celdas / CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('diccionario')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'diccionario'
                ? 'bg-[#0051d5] text-white shadow-sm'
                : 'bg-white text-[#475569] hover:bg-[#eff4ff] border border-[#e2e8f0]'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Mapeo de Columnas
          </button>
        </div>
      </div>

      {/* TAB 1: SCRIPT DE APPS SCRIPT (Automático 100%) */}
      {activeSubTab === 'script' && (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] text-xs text-[#0b1c30] space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-[#0051d5] text-sm">
              <FileSpreadsheet className="w-4 h-4 text-[#0051d5]" />
              Migración Automatizada en 1 Clic desde Google Apps Script
            </div>
            <p className="text-[#334155] leading-relaxed">
              Como tu sistema anterior operaba sobre Google Sheets, este script corre directamente en tu propio editor de Apps Script. Lee todas las pestañas (<strong>Edificios, Usuarios, Recorridos, Checkpoints, Hallazgos, Tareas</strong>), normaliza los formatos y envía la información en lotes directamente a Supabase sin necesidad de exportar archivos intermedios.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
              <div className="p-2 bg-white rounded-lg border border-[#cbd5e1]">
                <strong className="text-[#0051d5] block mb-0.5">Paso 1:</strong>
                Abre tu Google Sheet &rarr; Extensiones &rarr; <em>Apps Script</em>.
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#cbd5e1]">
                <strong className="text-[#0051d5] block mb-0.5">Paso 2:</strong>
                Crea un archivo <code>MigrarASupabase.gs</code> y pega el código.
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#cbd5e1]">
                <strong className="text-[#0051d5] block mb-0.5">Paso 3:</strong>
                Selecciona <code>ejecutarMigracionCompleta</code> y pulsa <strong>Ejecutar</strong>.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbd5e1] pb-3 pt-1">
            <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setScriptVariant('sql_generator')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  scriptVariant === 'sql_generator'
                    ? 'bg-white text-[#0051d5] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                v1.1 Generador SQL en Google Drive (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setScriptVariant('direct_api')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  scriptVariant === 'direct_api'
                    ? 'bg-white text-[#0051d5] shadow-xs'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                v1.0 Inserción directa API REST
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyText(scriptVariant === 'sql_generator' ? extractorPostgresV1_1Script : appsScriptCode, 'script_code')}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#c5c6cd] text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied === 'script_code' ? <Check className="w-3.5 h-3.5 text-[#069669]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'script_code' ? '¡Copiado!' : 'Copiar Script'}
              </button>
              <button
                type="button"
                onClick={() => handleDownloadFile(
                  scriptVariant === 'sql_generator' ? extractorPostgresV1_1Script : appsScriptCode,
                  scriptVariant === 'sql_generator' ? 'ExtractorPostgresV1_1.gs' : 'MigrarASupabase.gs'
                )}
                className="px-3 py-1.5 rounded-lg bg-[#0051d5] text-white text-xs font-semibold hover:bg-[#0041ab] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar {scriptVariant === 'sql_generator' ? 'ExtractorPostgresV1_1.gs' : 'MigrarASupabase.gs'}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#0b1c30] p-4 text-xs font-mono text-[#d3e4fe] overflow-x-auto max-h-72 border border-[#213145] leading-relaxed">
            <pre>{scriptVariant === 'sql_generator' ? extractorPostgresV1_1Script : appsScriptCode}</pre>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORTADOR COPIAR Y PEGAR / CSV */}
      {activeSubTab === 'paste' && (
        <div className="flex flex-col gap-3">
          <div className="p-3.5 rounded-xl bg-[#f8faff] border border-[#d3e4fe] text-xs text-[#0b1c30]">
            <strong>¿Prefieres importar tabla por tabla?</strong> Selecciona la tabla de destino, copia las filas de tu hoja de cálculo (incluyendo la fila de encabezados) con <code>Ctrl + C</code> y pégalas aquí. La app las procesará e insertará en Supabase.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#0b1c30] block mb-1">
                1. Selecciona la Tabla de Destino en Supabase:
              </label>
              <select
                value={selectedTable}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setSelectedTable(val);
                  if (parsedHeaders.length && parsedRows.length) {
                    generateSqlFromRows(val, parsedHeaders, parsedRows);
                  }
                }}
                className="w-full text-xs p-2 rounded-lg border border-[#c5c6cd] bg-white focus:outline-none focus:border-[#0051d5]"
              >
                <option value="edificios">edificios (Propiedades y torres)</option>
                <option value="usuarios">usuarios (Cuentas y roles)</option>
                <option value="recorridos">recorridos (Rondas programadas)</option>
                <option value="checkpoints">checkpoints (Puntos de control)</option>
                <option value="hallazgos">hallazgos (Inspecciones y fallas)</option>
                <option value="tareas">tareas (Actividades operativas)</option>
                <option value="tareas_automaticas">tareas_automaticas (Recordatorios)</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleParseData}
                className="px-4 py-2 rounded-lg bg-[#0051d5] text-white text-xs font-bold hover:bg-[#0041ab] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Analizar Datos Pegados
              </button>
              {parsedRows.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportToSupabase}
                  disabled={importStatus.type === 'loading'}
                  className="px-4 py-2 rounded-lg bg-[#069669] text-white text-xs font-bold hover:bg-[#05825b] transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {importStatus.type === 'loading' ? 'Importando...' : `Insertar en Supabase (${parsedRows.length})`}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0b1c30] block mb-1">
              2. Pega aquí los datos copiados de Google Sheets (TSV o CSV):
            </label>
            <textarea
              rows={5}
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Ejemplo:&#10;ID_Edificio	Nombre	Direccion	Activo&#10;EDI-000001	Torre Roble	Av. Las Americas 15-20	true&#10;EDI-000002	Torre Las Americas	Diagonal 6 10-50	true"
              className="w-full text-xs font-mono p-2.5 rounded-xl border border-[#c5c6cd] focus:outline-none focus:border-[#0051d5] bg-white leading-relaxed"
            />
          </div>

          {/* Status Alert */}
          {importStatus.message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              importStatus.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                : importStatus.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}>
              {importStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {importStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {importStatus.type === 'loading' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}

          {/* Table Preview */}
          {parsedRows.length > 0 && (
            <div className="border border-[#e5eeff] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#f8faff] px-3.5 py-2 border-b border-[#e5eeff] flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30]">
                  Vista Previa ({parsedRows.length} filas detectadas)
                </span>
                <span className="text-[#64748b] text-[11px]">
                  Columnas: {parsedHeaders.join(', ')}
                </span>
              </div>
              <div className="overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#eff4ff]/60 border-b border-[#e5eeff]">
                      {parsedHeaders.map((h, i) => (
                        <th key={i} className="p-2 font-bold text-[#0b1c30] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-[#f1f5f9] hover:bg-[#f8faff]">
                        {parsedHeaders.map((h, cIdx) => (
                          <td key={cIdx} className="p-2 text-[#334155] whitespace-nowrap font-mono text-[11px]">
                            {String(row[h] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <div className="p-1.5 bg-[#f8fafc] text-center text-[11px] text-[#64748b]">
                  Mostrando 5 de {parsedRows.length} registros...
                </div>
              )}
            </div>
          )}

          {/* Generated SQL Option */}
          {generatedSql && (
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0b1c30]">Opcional: Sentencia SQL INSERT generada:</span>
                <button
                  type="button"
                  onClick={() => copyText(generatedSql, 'sql_insert')}
                  className="px-2.5 py-1 rounded bg-[#eff4ff] text-[#0051d5] border border-[#d3e4fe] text-[11px] font-semibold hover:bg-[#d3e4fe] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copied === 'sql_insert' ? <Check className="w-3 h-3 text-[#069669]" /> : <Copy className="w-3 h-3" />}
                  {copied === 'sql_insert' ? '¡Copiado!' : 'Copiar SQL INSERT'}
                </button>
              </div>
              <div className="rounded-xl bg-[#0b1c30] p-3 text-xs font-mono text-[#d3e4fe] overflow-x-auto max-h-36 border border-[#213145]">
                <pre>{generatedSql}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DICCIONARIO Y MAPEO DE COLUMNAS */}
      {activeSubTab === 'diccionario' && (
        <div className="flex flex-col gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#eff4ff] border border-[#d3e4fe] text-[#0b1c30]">
            Este diccionario muestra la correspondencia exacta entre los nombres de columnas de tu Google Sheet y las columnas creadas en PostgreSQL (Supabase):
          </div>

          <div className="border border-[#e5eeff] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111c2e] text-white">
                  <th className="p-2.5">Hoja en Google Sheets</th>
                  <th className="p-2.5">Tabla Supabase</th>
                  <th className="p-2.5">Columna Clave (Sheets &rarr; Supabase)</th>
                  <th className="p-2.5">Otras Columnas Principales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5eeff]">
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Edificios</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">edificios</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Edificio &rarr; id_edificio</td>
                  <td className="p-2.5 text-[#64748b]">nombre, direccion, activo, creado_en</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Usuarios</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">usuarios</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Usuario &rarr; id_usuario</td>
                  <td className="p-2.5 text-[#64748b]">nombre, email, rol, usuario_login, activo</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Recorridos</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">recorridos</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Recorrido &rarr; id_recorrido</td>
                  <td className="p-2.5 text-[#64748b]">nombre, id_edificio, fecha_programada, inspector_email, estado</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Checkpoints</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">checkpoints</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Checkpoint &rarr; id_checkpoint</td>
                  <td className="p-2.5 text-[#64748b]">id_edificio, id_recorrido, ubicacion, descripcion, orden, activo</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Hallazgos</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">hallazgos</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Hallazgo &rarr; id_hallazgo</td>
                  <td className="p-2.5 text-[#64748b]">id_recorrido, id_checkpoint, estatus, comentario, foto_url, cerrado</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Tareas</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">tareas</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Tarea &rarr; id_tarea</td>
                  <td className="p-2.5 text-[#64748b]">id_hallazgo, id_edificio, titulo_tarea, asignado_a_email, estado_tarea, prioridad, fecha_limite</td>
                </tr>
                <tr className="hover:bg-[#f8faff]">
                  <td className="p-2.5 font-bold text-[#0b1c30]">Tareas_Automaticas</td>
                  <td className="p-2.5 font-mono text-[#0051d5]">tareas_automaticas</td>
                  <td className="p-2.5 font-mono text-[#069669]">ID_Automatizacion &rarr; id_automatizacion</td>
                  <td className="p-2.5 text-[#64748b]">titulo, frecuencia, hora, dia_semana, fecha_inicio, asignado_a_email, id_edificio</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
