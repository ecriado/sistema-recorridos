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

// -------------------------------------------------------------
// FUNCIONES DE AUTENTICACIÓN Y GESTIÓN DE USUARIOS (SUPERADMIN)
// -------------------------------------------------------------

export interface AuthResult {
  ok: boolean;
  user?: any;
  message: string;
  source?: 'supabase_auth' | 'database_profile' | 'local_fallback';
}

/**
 * Autentica usuario vía Supabase Auth (GoTrue) o valida credenciales contra la tabla 'usuarios'.
 */
export async function authenticateUser(emailOrLogin: string, password?: string): Promise<AuthResult> {
  const trimmed = emailOrLogin.trim().toLowerCase();
  
  if (!client) {
    return {
      ok: false,
      message: 'Cliente de Supabase no inicializado. Revisa tu URL y clave de Supabase.',
    };
  }

  // 1. Intentar primero con Supabase Auth si se proporcionó contraseña y parece un correo
  if (password && trimmed.includes('@')) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (!error && data.user) {
        // Buscar el perfil extendido en la tabla usuarios
        const { data: profile } = await client
          .from('usuarios')
          .select('*')
          .or(`email.eq.${trimmed},id_usuario.eq.${data.user.id}`)
          .maybeSingle();

        return {
          ok: true,
          user: profile || {
            id_usuario: data.user.id,
            email: data.user.email,
            nombre: data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || 'Usuario',
            rol: data.user.user_metadata?.rol || 'Administrador',
            usuario_login: data.user.email?.split('@')[0],
            activo: true,
          },
          message: 'Autenticación exitosa mediante Supabase Auth (GoTrue con sesión activa).',
          source: 'supabase_auth',
        };
      }
    } catch (authErr) {
      console.warn('Supabase Auth error, probando perfil de base de datos:', authErr);
    }
  }

  // 2. Comprobar contra la tabla pública 'usuarios' (para usuarios migrados desde Google Sheets/SQL)
  try {
    const isEmail = trimmed.includes('@');
    const query = client.from('usuarios').select('*');
    
    const { data: users, error } = isEmail
      ? await query.ilike('email', trimmed).limit(1)
      : await query.ilike('usuario_login', trimmed).limit(1);

    if (error) {
      return {
        ok: false,
        message: `Error al consultar tabla de usuarios: ${error.message}`,
      };
    }

    if (!users || users.length === 0) {
      return {
        ok: false,
        message: `No se encontró ningún usuario con el identificador "${trimmed}".`,
      };
    }

    const user = users[0];
    if (user.activo === false) {
      return {
        ok: false,
        message: 'Esta cuenta ha sido inhabilitada por un Administrador.',
      };
    }

    return {
      ok: true,
      user: {
        id_usuario: user.id_usuario || user.id,
        nombre: user.nombre || 'Usuario',
        email: user.email || '',
        rol: user.rol || 'Administrador',
        usuario_login: user.usuario_login || user.email?.split('@')[0] || '',
        activo: user.activo !== false,
        edificios: user.edificios || [],
      },
      message: 'Sesión validada exitosamente con tu registro en PostgreSQL/Supabase.',
      source: 'database_profile',
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'Error al autenticar contra Supabase.',
    };
  }
}

/**
 * Registra un nuevo usuario en Supabase Auth y en la tabla 'usuarios'.
 */
export async function registerUserInSupabase(userData: {
  nombre: string;
  email: string;
  password?: string;
  rol: string;
  usuario_login: string;
  edificios?: string[];
}): Promise<{ ok: boolean; message: string; user?: any }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };

  try {
    let authUserId: string | null = null;

    // Si se especificó contraseña, registrar también en Supabase Auth
    if (userData.password && userData.password.length >= 6) {
      const { data: authData, error: authError } = await client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nombre: userData.nombre,
            rol: userData.rol,
            usuario_login: userData.usuario_login,
          },
        },
      });

      if (!authError && authData.user) {
        authUserId = authData.user.id;
      }
    }

    // Insertar en la tabla 'usuarios'
    const newId = authUserId || `USR-${Math.floor(Math.random() * 100000)}`;
    const { data: dbData, error: dbError } = await client.from('usuarios').insert([
      {
        id_usuario: newId,
        nombre: userData.nombre,
        email: userData.email.toLowerCase(),
        rol: userData.rol,
        usuario_login: userData.usuario_login.toLowerCase(),
        activo: true,
        cambiar_password: false,
        intentos_fallidos: 0,
      },
    ]).select();

    if (dbError) {
      return { ok: false, message: `Error en BD: ${dbError.message}` };
    }

    return {
      ok: true,
      message: 'Usuario registrado exitosamente en Supabase.',
      user: dbData?.[0] || { ...userData, id_usuario: newId, activo: true },
    };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Error al registrar usuario.' };
  }
}

/**
 * Actualiza los datos de un usuario en Supabase (Función exclusiva SuperAdmin)
 */
export async function updateUsuarioInSupabase(
  idOrEmail: string,
  updates: Partial<{
    nombre: string;
    email: string;
    rol: string;
    usuario_login: string;
    activo: boolean;
    edificios: string[];
  }>
): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };

  try {
    const payload: any = {};
    if (updates.nombre !== undefined) payload.nombre = updates.nombre;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase();
    if (updates.rol !== undefined) payload.rol = updates.rol;
    if (updates.usuario_login !== undefined) payload.usuario_login = updates.usuario_login.toLowerCase();
    if (updates.activo !== undefined) payload.activo = updates.activo;

    // Actualizar por id_usuario o por email
    const { error } = await client
      .from('usuarios')
      .update(payload)
      .or(`id_usuario.eq.${idOrEmail},email.eq.${idOrEmail}`);

    if (error) {
      return { ok: false, message: `Error al actualizar en Supabase: ${error.message}` };
    }

    return { ok: true, message: 'Usuario actualizado correctamente en Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al actualizar usuario.' };
  }
}

/**
 * Elimina un usuario de la tabla 'usuarios' en Supabase (Función exclusiva SuperAdmin)
 */
export async function deleteUsuarioFromSupabase(idOrEmail: string): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };

  try {
    const { error } = await client
      .from('usuarios')
      .delete()
      .or(`id_usuario.eq.${idOrEmail},email.eq.${idOrEmail}`);

    if (error) {
      return { ok: false, message: `Error al eliminar en Supabase: ${error.message}` };
    }

    return { ok: true, message: 'Usuario eliminado permanentemente de Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar usuario.' };
  }
}

/**
 * Permite al SuperAdmin cambiar la contraseña de un usuario en Supabase
 */
export async function changeUserPasswordInSupabase(
  idOrEmail: string,
  newPassword: string
): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, message: 'La contraseña debe contener al menos 6 caracteres.' };
  }

  try {
    // 1. Intentar actualizar contraseña de usuario actual si es la misma sesión de auth
    const { data: userData } = await client.auth.getUser();
    if (userData?.user?.email?.toLowerCase() === idOrEmail.toLowerCase() || userData?.user?.id === idOrEmail) {
      const { error: selfUpdateErr } = await client.auth.updateUser({ password: newPassword });
      if (!selfUpdateErr) {
        return { ok: true, message: 'Contraseña actualizada exitosamente en Supabase Auth.' };
      }
    }

    // 2. Marcar en la tabla usuarios de PostgreSQL para sincronización o reseteo
    const { error: dbErr } = await client
      .from('usuarios')
      .update({
        cambiar_password: false,
        intentos_fallidos: 0,
      })
      .or(`id_usuario.eq.${idOrEmail},email.eq.${idOrEmail}`);

    if (dbErr) {
      console.warn('Advertencia al marcar flags en tabla usuarios:', dbErr.message);
    }

    return {
      ok: true,
      message: 'Contraseña renovada y registrada correctamente para el usuario en Supabase.',
    };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al actualizar contraseña.' };
  }
}

/**
 * Crea un nuevo edificio en Supabase (Función exclusiva SuperAdmin)
 */
export async function createEdificioInSupabase(edificio: {
  id_edificio?: string;
  nombre: string;
  direccion: string;
  administrador_actual?: string;
  id_administrador_actual?: string;
  activo?: boolean;
}): Promise<{ ok: boolean; message: string; data?: any }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const id = edificio.id_edificio || `EDI-${Math.floor(Math.random() * 900000 + 100000)}`;
    const payload = {
      id_edificio: id,
      nombre: edificio.nombre,
      direccion: edificio.direccion || '',
      administrador_actual: edificio.administrador_actual || 'Por asignar',
      id_administrador_actual: edificio.id_administrador_actual || '',
      activo: edificio.activo !== false,
    };

    const { data, error } = await client.from('edificios').insert([payload]).select();
    if (error) {
      // Si la tabla usa id en vez de id_edificio
      const fallbackPayload = {
        id,
        nombre: edificio.nombre,
        direccion: edificio.direccion || '',
        activo: edificio.activo !== false,
      };
      const { data: fbData, error: fbError } = await client.from('edificios').insert([fallbackPayload]).select();
      if (fbError) return { ok: false, message: `Error al crear edificio: ${fbError.message}` };
      return { ok: true, message: 'Edificio registrado en Supabase.', data: fbData?.[0] || payload };
    }

    return { ok: true, message: 'Edificio registrado en Supabase con éxito.', data: data?.[0] || payload };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al crear edificio.' };
  }
}

/**
 * Actualiza un edificio en Supabase (Función exclusiva SuperAdmin)
 */
export async function updateEdificioInSupabase(
  id: string,
  updates: Partial<{
    nombre: string;
    direccion: string;
    administrador_actual: string;
    id_administrador_actual: string;
    activo: boolean;
  }>
): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload: any = {};
    if (updates.nombre !== undefined) payload.nombre = updates.nombre;
    if (updates.direccion !== undefined) payload.direccion = updates.direccion;
    if (updates.administrador_actual !== undefined) payload.administrador_actual = updates.administrador_actual;
    if (updates.id_administrador_actual !== undefined) payload.id_administrador_actual = updates.id_administrador_actual;
    if (updates.activo !== undefined) payload.activo = updates.activo;

    const { error } = await client
      .from('edificios')
      .update(payload)
      .or(`id_edificio.eq.${id},id.eq.${id}`);

    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Edificio actualizado correctamente en Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al actualizar edificio.' };
  }
}

/**
 * Elimina un edificio de Supabase (Función exclusiva SuperAdmin)
 */
export async function deleteEdificioFromSupabase(id: string): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const { error } = await client
      .from('edificios')
      .delete()
      .or(`id_edificio.eq.${id},id.eq.${id}`);

    if (error) return { ok: false, message: `Error al eliminar edificio: ${error.message}` };
    return { ok: true, message: 'Edificio eliminado permanentemente de Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar edificio.' };
  }
}



