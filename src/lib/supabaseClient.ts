import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  localStorage.getItem('sr_supabase_url') || 
  localStorage.getItem('VITE_SUPABASE_URL') || 
  'https://wafkfxukpgtfromlgvif.supabase.co';

const defaultKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  localStorage.getItem('sr_supabase_key') || 
  localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 
  'sb_publishable_9ZCxxaFBaoRTAuwQm28FOQ_17LFmqkE';

let client: SupabaseClient | null = null;

if (defaultUrl && defaultKey && !defaultUrl.includes('xyzcompany')) {
  try {
    client = createClient(defaultUrl, defaultKey);
  } catch (e) {
    console.warn('Supabase client failed to initialize with provided env:', e);
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  return client;
}

export function isSupabaseConnected(): boolean {
  return Boolean(client);
}

export function configureSupabase(url: string, anonKey: string): { success: boolean; message: string } {
  try {
    if (!url || !anonKey) {
      localStorage.removeItem('sr_supabase_url');
      localStorage.removeItem('sr_supabase_key');
      client = null;
      return { success: true, message: 'Configuración de Supabase restablecida a modo local.' };
    }
    client = createClient(url, anonKey);
    localStorage.setItem('sr_supabase_url', url);
    localStorage.setItem('sr_supabase_key', anonKey);
    return { success: true, message: 'Conectado a Supabase correctamente.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error al conectar con Supabase.' };
  }
}

export interface TableDiagnosticResult {
  table: string;
  status: 'ok' | 'missing_table' | 'column_mismatch' | 'error';
  message: string;
  expectedColumns: string[];
  missingColumns?: string[];
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; details?: string }> {
  if (!client) {
    return { ok: false, message: 'No se han ingresado credenciales de Supabase (URL y Anon Key).' };
  }
  try {
    // Select * with limit 1 so it does not fail whether columns are named id or id_edificio
    const { data, error } = await client.from('edificios').select('*').limit(1);
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { 
          ok: true, 
          message: `Conectado a Supabase, pero la tabla 'edificios' aún no existe en el esquema.`,
          details: 'Ejecuta el script de la pestaña "Script Reparador" o "Reinstalación Limpia" en el SQL Editor de Supabase.'
        };
      }
      return { ok: true, message: `Conexión con Supabase verificada (aviso tabla: ${error.message}).` };
    }
    
    // Check if table contains records and whether id or id_edificio exists
    if (data && data.length > 0) {
      const firstRow = data[0];
      const hasIdCol = 'id_edificio' in firstRow || 'id' in firstRow;
      if (!hasIdCol) {
        return {
          ok: true,
          message: 'Conectado a Supabase. Se recomienda ejecutar el script de reparación para estandarizar las columnas.',
          details: 'La tabla edificios no contiene la columna id ni id_edificio.'
        };
      }
    }
    return { ok: true, message: 'Conexión con PostgreSQL y Supabase exitosa. Tabla de edificios validada y en línea.' };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Fallo de conexión a Supabase.' };
  }
}

export async function diagnoseAllTables(): Promise<TableDiagnosticResult[]> {
  if (!client) return [];

  const tablesToTest: { table: string; columns: string[] }[] = [
    { table: 'edificios', columns: ['id_edificio', 'nombre', 'direccion', 'activo'] },
    { table: 'usuarios', columns: ['id_usuario', 'nombre', 'email', 'rol', 'usuario_login'] },
    { table: 'recorridos', columns: ['id_recorrido', 'nombre', 'id_edificio', 'fecha_programada', 'inspector_email', 'estado'] },
    { table: 'checkpoints', columns: ['id_checkpoint', 'id_edificio', 'id_recorrido', 'ubicacion', 'orden'] },
    { table: 'hallazgos', columns: ['id_hallazgo', 'id_recorrido', 'id_checkpoint', 'estatus'] },
    { table: 'tareas', columns: ['id_tarea', 'id_edificio', 'titulo_tarea', 'prioridad', 'estado_tarea'] },
    { table: 'tareas_automaticas', columns: ['id_automatizacion', 'id_edificio', 'titulo', 'frecuencia', 'activo'] },
  ];

  const results: TableDiagnosticResult[] = [];

  for (const item of tablesToTest) {
    try {
      // Test full expected columns
      const { error: fullError } = await client.from(item.table).select(item.columns.join(',')).limit(1);
      if (!fullError) {
        results.push({
          table: item.table,
          status: 'ok',
          message: 'Estructura válida y columnas reconocidas.',
          expectedColumns: item.columns,
        });
        continue;
      }

      // Check if table even exists
      const { error: anyError } = await client.from(item.table).select('*').limit(1);
      if (anyError && anyError.message.includes('relation') && anyError.message.includes('does not exist')) {
        results.push({
          table: item.table,
          status: 'missing_table',
          message: `La tabla '${item.table}' aún no ha sido creada en la base de datos.`,
          expectedColumns: item.columns,
        });
        continue;
      }

      // If table exists but specific columns failed, test each column
      const missing: string[] = [];
      let usesIdAlias = false;
      for (const col of item.columns) {
        const { error: colError } = await client.from(item.table).select(col).limit(1);
        if (colError && colError.message.includes('does not exist')) {
          // If the primary key is named 'id' instead of 'id_edificio', check if 'id' exists
          if (col.startsWith('id_')) {
            const { error: idError } = await client.from(item.table).select('id').limit(1);
            if (!idError) {
              usesIdAlias = true;
              continue; // Columna 'id' existe y la app la mapea automáticamente
            }
          }
          missing.push(col);
        }
      }

      if (missing.length === 0) {
        results.push({
          table: item.table,
          status: 'ok',
          message: usesIdAlias 
            ? 'Compatible (utiliza columna "id" nativa mapeada automáticamente).' 
            : 'Estructura válida y columnas reconocidas.',
          expectedColumns: item.columns,
        });
        continue;
      }

      results.push({
        table: item.table,
        status: missing.length > 0 ? 'column_mismatch' : 'error',
        message: missing.length > 0 
          ? `Columnas no encontradas: ${missing.join(', ')}` 
          : fullError.message,
        expectedColumns: item.columns,
        missingColumns: missing,
      });
    } catch (err: any) {
      results.push({
        table: item.table,
        status: 'error',
        message: err?.message || 'Error desconocido al consultar tabla.',
        expectedColumns: item.columns,
      });
    }
  }

  return results;
}

// Data loaders with resilient column mapping
export async function loadEdificiosFromSupabase(): Promise<{ data: any[] | null; error: string | null }> {
  if (!client) return { data: null, error: 'No conectado' };
  try {
    const { data, error } = await client.from('edificios').select('*');
    if (error) return { data: null, error: error.message };
    if (!data) return { data: [], error: null };
    
    // Normalize id vs id_edificio
    const mapped = data.map((row: any) => ({
      id_edificio: row.id_edificio || row.id || `EDI-${Math.floor(Math.random()*10000)}`,
      nombre: row.nombre || 'Edificio sin nombre',
      direccion: row.direccion || 'Sin dirección',
      activo: row.activo !== false,
      administrador_actual: row.administrador_actual || 'Administrador asignado',
      id_administrador_actual: row.id_administrador_actual || row.id_administrador || '',
    }));
    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Error desconocido' };
  }
}

export async function loadUsuariosFromSupabase(): Promise<{ data: any[] | null; error: string | null }> {
  if (!client) return { data: null, error: 'No conectado' };
  try {
    const { data, error } = await client.from('usuarios').select('*');
    if (error) return { data: null, error: error.message };
    if (!data) return { data: [], error: null };

    const mapped = data.map((row: any) => ({
      id_usuario: row.id_usuario || row.id || `USR-${Math.floor(Math.random()*10000)}`,
      nombre: row.nombre || 'Usuario',
      email: row.email || '',
      rol: row.rol || 'Administrador',
      usuario_login: row.usuario_login || row.email?.split('@')[0] || 'usuario',
      activo: row.activo !== false,
      edificios: row.edificios || [],
    }));
    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Error desconocido' };
  }
}

export async function loadRecorridosFromSupabase(): Promise<{ data: any[] | null; error: string | null }> {
  if (!client) return { data: null, error: 'No conectado' };
  try {
    const { data, error } = await client.from('recorridos').select('*');
    if (error) return { data: null, error: error.message };
    if (!data) return { data: [], error: null };

    const mapped = data.map((row: any) => ({
      id_recorrido: row.id_recorrido || row.id || `REC-${Math.floor(Math.random()*10000)}`,
      nombre: row.nombre || 'Recorrido',
      id_edificio: row.id_edificio || '',
      edificio_nombre: row.edificio_nombre || 'Edificio Corporativo',
      fecha_programada: row.fecha_programada || new Date().toISOString(),
      fecha_cierre_programada: row.fecha_cierre_programada,
      cierre_automatico: row.cierre_automatico !== false,
      inspector_email: row.inspector_email || 'inspector@eazyops.gt',
      inspector_nombre: row.inspector_nombre || 'Inspector',
      estado: row.estado || 'Programado',
      observaciones: row.observaciones || '',
      creado_por: row.creado_por || 'Sistema',
      checkpoints_count: row.checkpoints_count || 8,
      hallazgos_count: row.hallazgos_count || 0,
    }));
    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Error desconocido' };
  }
}

export async function loadTareasFromSupabase(): Promise<{ data: any[] | null; error: string | null }> {
  if (!client) return { data: null, error: 'No conectado' };
  try {
    const { data, error } = await client.from('tareas').select('*');
    if (error) return { data: null, error: error.message };
    if (!data) return { data: [], error: null };

    const mapped = data.map((row: any) => ({
      id_tarea: row.id_tarea || row.codigo || row.id || `TAR-${Math.floor(Math.random()*10000)}`,
      id_edificio: row.id_edificio || row.edificio_id || '',
      edificio_nombre: row.edificio_nombre || '',
      tipo_origen: row.tipo_origen || 'Manual',
      asignado_a_email: row.asignado_a_email || '',
      asignado_a_nombre: row.asignado_a_nombre || row.asignado_a_email?.split('@')[0] || 'Técnico',
      asignado_a_rol: row.asignado_a_rol || 'Mantenimiento',
      titulo_tarea: row.titulo_tarea || row.titulo || 'Tarea',
      instrucciones: row.instrucciones || '',
      prioridad: row.prioridad || 'Media',
      fecha_creacion: row.created_at || row.fecha_creacion || new Date().toISOString(),
      fecha_limite: row.fecha_limite,
      creado_por: row.creado_por || 'Sistema',
      estado_tarea: row.estado_tarea || row.estado || 'Pendiente',
    }));
    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Error desconocido' };
  }
}

export async function loadAutomatizacionesFromSupabase(): Promise<{ data: any[] | null; error: string | null }> {
  if (!client) return { data: null, error: 'No conectado' };
  try {
    const { data, error } = await client.from('tareas_automaticas').select('*');
    if (error) return { data: null, error: error.message };
    if (!data) return { data: [], error: null };

    const mapped = data.map((row: any) => ({
      id_automatizacion: row.id_automatizacion || row.codigo || row.id || `AUT-${Math.floor(Math.random()*10000)}`,
      creado_por_email: row.creado_por_email || row.creado_por || 'admin@eazyops.gt',
      asignado_a_email: row.asignado_a_email || '',
      asignado_a_nombre: row.asignado_a_nombre || row.asignado_a_email?.split('@')[0] || 'Técnico',
      id_edificio: row.id_edificio || row.edificio_id || '',
      edificio_nombre: row.edificio_nombre || '',
      titulo: row.titulo || 'Tarea Periódica',
      instrucciones: row.instrucciones || '',
      prioridad: row.prioridad || 'Media',
      frecuencia: row.frecuencia || 'Semanal',
      dia_semana: row.dia_semana,
      dia_mes: row.dia_mes,
      hora: row.hora || '08:00',
      fecha_inicio: row.fecha_inicio || new Date().toISOString().slice(0, 10),
      fecha_fin: row.fecha_fin,
      proxima_ejecucion: row.proxima_ejecucion,
      activo: row.activo !== false,
    }));
    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Error desconocido' };
  }
}

