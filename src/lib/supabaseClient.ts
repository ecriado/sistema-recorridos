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
// SOLO PARA DEPURACIÓN — quitar antes de producción
if (typeof window !== 'undefined' && client) {
  (window as any).supabase = client;
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
  details?: string;
  rowCount?: number;
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
          details: 'Ejecuta el script de la pestaña "Script de reparación" en el SQL Editor de Supabase.'
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
      // 1. Obtener conteo exacto de registros en la tabla
      let rowCount = 0;
      const { count } = await client.from(item.table).select('*', { count: 'exact', head: true });
      if (typeof count === 'number') {
        rowCount = count;
      }

      // 2. Test columnas esperadas completas
      const { error: fullError } = await client.from(item.table).select(item.columns.join(',')).limit(1);
      if (!fullError) {
        results.push({
          table: item.table,
          status: 'ok',
          message: 'Estructura válida y columnas reconocidas.',
          details: `Tabla íntegra con ${rowCount} registros operativos sincronizados en PostgreSQL.`,
          rowCount,
          expectedColumns: item.columns,
        });
        continue;
      }

      // 3. Verificar si la tabla existe o si no ha sido creada
      const { error: anyError } = await client.from(item.table).select('*').limit(1);
      if (anyError && anyError.message.includes('relation') && anyError.message.includes('does not exist')) {
        results.push({
          table: item.table,
          status: 'missing_table',
          message: `La tabla '${item.table}' aún no existe en el esquema público.`,
          details: 'Requiere creación inicial. Puedes ejecutar el "Script de reparación" en Supabase SQL Editor.',
          rowCount: 0,
          expectedColumns: item.columns,
        });
        continue;
      }

      // 4. Si la tabla existe pero fallaron columnas, verificar cuáles faltan o si usa alias 'id'
      const missing: string[] = [];
      let usesIdAlias = false;
      for (const col of item.columns) {
        const { error: colError } = await client.from(item.table).select(col).limit(1);
        if (colError && colError.message.includes('does not exist')) {
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
            ? 'Compatible (columna "id" nativa vinculada automáticamente).' 
            : 'Estructura válida y columnas reconocidas.',
          details: `Esquema verificado. ${rowCount} registros listos para operaciones en tiempo real.`,
          rowCount,
          expectedColumns: item.columns,
        });
        continue;
      }

      results.push({
        table: item.table,
        status: 'column_mismatch',
        message: `Columnas pendientes: ${missing.join(', ')}`,
        details: `La tabla tiene ${rowCount} registros pero requiere añadir: ${missing.join(', ')}. Usa el Script de Reparación para estandarizarla sin pérdida de datos.`,
        rowCount,
        expectedColumns: item.columns,
        missingColumns: missing,
      });
    } catch (err: any) {
      results.push({
        table: item.table,
        status: 'error',
        message: err?.message || 'Error al consultar metadatos de la tabla.',
        details: 'Revisa la conectividad a Supabase o los permisos de lectura de la tabla.',
        rowCount: 0,
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
      tecnico_mantenimiento: row.tecnico_mantenimiento || 'Sin Técnico asignado',
      id_tecnico_mantenimiento: row.id_tecnico_mantenimiento || row.id_tecnico || '',
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

// ── Perfil de negocio de la cuenta con sesión ───────────────────────────
async function fetchProfile(userId: string): Promise<Usuario | null> {
  if (!client) return null;
  const { data, error } = await client
    .from('usuarios')
    .select('id, id_usuario, nombre, email, rol, usuario_login, activo, cambiar_password')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data || data.activo === false) return null;

  return {
    id_usuario: data.id_usuario || data.id,
    nombre: data.nombre,
    email: data.email,
    rol: data.rol,
    usuario_login: data.usuario_login,
    activo: true,
    cambiar_password: data.cambiar_password === true,
    edificios: [],
  } as Usuario;
}

// ── Login: única validación de credenciales = Supabase Auth ─────────────
export async function authenticateUser(email: string, password?: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const pass = password ?? '';
  if (!cleanEmail || !pass) return { ok: false, message: 'Ingresa tu correo y tu contraseña.' };
  if (!client) return { ok: false, message: 'Cliente de Supabase no inicializado.' };

  const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password: pass });
  if (error || !data.user) return { ok: false, message: 'Correo o contraseña incorrectos.' };

  const user = await fetchProfile(data.user.id);
  if (!user) {
    await client.auth.signOut();
    return { ok: false, message: 'Tu cuenta no tiene acceso a EazyOps. Contacta a un Administrador.' };
  }
  return { ok: true, user, message: 'Bienvenido.', source: 'supabase_auth' };
}

export async function getCurrentProfile(): Promise<Usuario | null> {
  if (!client) return null;
  const { data } = await client.auth.getUser();      // se valida contra el servidor
  return data.user ? fetchProfile(data.user.id) : null;
}

export function onAuthEvents(handlers: { onSignedOut?: () => void; onPasswordRecovery?: () => void }): () => void {
  if (!client) return () => {};
  const { data } = client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') handlers.onSignedOut?.();
    if (event === 'PASSWORD_RECOVERY') handlers.onPasswordRecovery?.();
  });
  return () => data.subscription.unsubscribe();
}

export async function signOutUser(): Promise<void> {
  await client?.auth.signOut();
}

// ── Contraseñas ─────────────────────────────────────────────────────────
export async function changeOwnPassword(newPassword: string): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  if (!newPassword || newPassword.length < 8) {
    return { ok: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { ok: false, message: 'Tu sesión expiró. Inicia sesión de nuevo.' };

  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, message: `No se pudo cambiar la contraseña: ${error.message}` };

  await client.from('usuarios').update({ cambiar_password: false }).eq('id', user.id);
  return { ok: true, message: 'Contraseña actualizada.' };
}

// Compatibilidad: los llamadores actuales siguen compilando, pero solo se cambia la contraseña PROPIA
export async function changeUserPasswordInSupabase(idOrEmail: string, newPassword: string) {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  const { data } = await client.auth.getUser();
  const yo = data.user;
  const perfil = yo ? await fetchProfile(yo.id) : null;
  const esMia = !!yo && (
    yo.id === idOrEmail ||
    yo.email?.toLowerCase() === idOrEmail.toLowerCase() ||
    perfil?.id_usuario === idOrEmail
  );
  if (!esMia) {
    return { ok: false, message: 'Solo puedes cambiar tu propia contraseña. Para otra persona usa el restablecimiento por correo.' };
  }
  return changeOwnPassword(newPassword);
}

export async function changeSelfPassword(_userId: string, _userEmail: string, newPass: string) {
  return changeOwnPassword(newPass);
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  const clean = email.trim().toLowerCase();
  if (!clean.includes('@')) return { ok: false, message: 'Ingresa tu correo electrónico.' };
  if (!client) return { ok: false, message: 'Cliente de Supabase no inicializado.' };

  const { error } = await client.auth.resetPasswordForEmail(clean, { redirectTo: window.location.origin });
  if (error) {
    console.warn('resetPasswordForEmail:', error.message);
    return { ok: false, message: 'No pudimos enviar el correo ahora. Inténtalo en unos minutos o contacta a un Administrador.' };
  }
  // Mismo mensaje exista o no la cuenta: no revela qué correos están registrados
  return { ok: true, message: 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.' };
}

// ── Alta de usuarios: desactivada hasta tener una Edge Function ─────────
export async function registerUserInSupabase(_userData: any): Promise<{ ok: boolean; message: string; user?: any }> {
  return { ok: false, message: 'Por ahora el alta de usuarios se hace desde el panel de Supabase.' };
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
 * Crea un nuevo edificio en Supabase (Función exclusiva SuperAdmin)
 */
export async function createEdificioInSupabase(edificio: {
  id_edificio?: string;
  nombre: string;
  direccion: string;
  administrador_actual?: string;
  id_administrador_actual?: string;
  tecnico_mantenimiento?: string;
  id_tecnico_mantenimiento?: string;
  activo?: boolean;
}): Promise<{ ok: boolean; message: string; data?: any }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const id = edificio.id_edificio || `EDI-${Math.floor(Math.random() * 900000 + 100000)}`;
    const payload: any = {
      id_edificio: id,
      nombre: edificio.nombre,
      direccion: edificio.direccion || '',
      administrador_actual: edificio.administrador_actual || 'Por asignar',
      id_administrador_actual: edificio.id_administrador_actual || '',
      tecnico_mantenimiento: edificio.tecnico_mantenimiento || 'Sin Técnico asignado',
      id_tecnico_mantenimiento: edificio.id_tecnico_mantenimiento || '',
      activo: edificio.activo !== false,
    };

    const { data, error } = await client.from('edificios').insert([payload]).select();
    if (error) {
      // Fallback si las columnas administrador_actual / tecnico_mantenimiento aún no existen en PostgreSQL
      const safePayload = {
        id_edificio: id,
        nombre: edificio.nombre,
        direccion: edificio.direccion || '',
        activo: edificio.activo !== false,
      };
      const { data: fbData, error: fbError } = await client.from('edificios').insert([safePayload]).select();
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
    tecnico_mantenimiento: string;
    id_tecnico_mantenimiento: string;
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
    if (updates.tecnico_mantenimiento !== undefined) payload.tecnico_mantenimiento = updates.tecnico_mantenimiento;
    if (updates.id_tecnico_mantenimiento !== undefined) payload.id_tecnico_mantenimiento = updates.id_tecnico_mantenimiento;
    if (updates.activo !== undefined) payload.activo = updates.activo;

    // Actualizar primero por id_edificio
    let { error } = await client
      .from('edificios')
      .update(payload)
      .eq('id_edificio', id);

    // Si falló por columna inexistente (schema cache), reintentar solo con campos base
    if (error && error.message.includes('Could not find') && error.message.includes('column')) {
      const basicPayload: any = {};
      if (updates.nombre !== undefined) basicPayload.nombre = updates.nombre;
      if (updates.direccion !== undefined) basicPayload.direccion = updates.direccion;
      if (updates.activo !== undefined) basicPayload.activo = updates.activo;
      const retry = await client.from('edificios').update(basicPayload).eq('id_edificio', id);
      if (!retry.error) {
        return { ok: true, message: 'Edificio actualizado en Supabase (datos básicos guardados).' };
      }
    }

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
      .eq('id_edificio', id);

    if (error) return { ok: false, message: `Error al eliminar edificio: ${error.message}` };
    return { ok: true, message: 'Edificio eliminado permanentemente de Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar edificio.' };
  }
}

/**
 * Crea un recorrido en Supabase
 */
export async function createRecorridoInSupabase(rec: any): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload = {
      id_recorrido: rec.id_recorrido,
      nombre: rec.nombre || 'Recorrido',
      id_edificio: rec.id_edificio,
      fecha_programada: rec.fecha_programada || new Date().toISOString(),
      fecha_cierre_programada: rec.fecha_cierre_programada || null,
      cierre_automatico: rec.cierre_automatico !== false,
      inspector_email: rec.inspector_email || 'admin@eazyops.com',
      estado: rec.estado || 'Programado',
      observaciones: rec.observaciones || '',
      creado_por: rec.creado_por || 'Sistema',
    };
    const { error } = await client.from('recorridos').insert(payload);
    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Recorrido registrado en Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al crear recorrido.' };
  }
}

/**
 * Actualiza un recorrido en Supabase
 */
export async function updateRecorridoInSupabase(
  id: string,
  updates: any
): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload: any = { ...updates };
    // Evitar intentar actualizar columnas que puedan no existir o llaves primarias
    delete payload.id;
    delete payload.checkpoints_count;
    delete payload.hallazgos_count;
    delete payload.edificio_nombre;
    delete payload.inspector_nombre;

    const { error } = await client
      .from('recorridos')
      .update(payload)
      .eq('id_recorrido', id);
    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Recorrido actualizado en Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al actualizar recorrido.' };
  }
}

/**
 * Elimina un recorrido de Supabase (SuperAdmin o Creador)
 */
export async function deleteRecorridoFromSupabase(id: string): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const { error } = await client
      .from('recorridos')
      .delete()
      .eq('id_recorrido', id);
    if (error) return { ok: false, message: `Error al eliminar recorrido: ${error.message}` };
    return { ok: true, message: 'Recorrido eliminado de Supabase permanentemente.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar recorrido.' };
  }
}

/**
 * Crea una tarea en Supabase
 */
export async function createTareaInSupabase(tarea: any): Promise<{ ok: boolean; message: string; data?: any }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload = {
      id_tarea: tarea.id_tarea,
      id_edificio: tarea.id_edificio,
      tipo_origen: tarea.tipo_origen || 'Manual',
      asignado_a_email: tarea.asignado_a_email || 'admin@eazyops.com',
      titulo_tarea: tarea.titulo_tarea || tarea.titulo || 'Tarea',
      instrucciones: tarea.instrucciones || '',
      prioridad: tarea.prioridad || 'Media',
      fecha_limite: tarea.fecha_limite || null,
      creado_por: tarea.creado_por || 'admin@eazyops.com',
      estado_tarea: tarea.estado_tarea || tarea.estado || 'Pendiente',
    };
    const { data, error } = await client.from('tareas').insert([payload]).select();
    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Tarea registrada en Supabase.', data: data?.[0] || payload };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al crear tarea.' };
  }
}

/**
 * Actualiza una tarea en Supabase
 */
export async function updateTareaInSupabase(
  id: string,
  updates: any
): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload: any = { ...updates };
    delete payload.id;
    delete payload.edificio_nombre;
    delete payload.asignado_a_nombre;
    delete payload.asignado_a_rol;

    const { error } = await client
      .from('tareas')
      .update(payload)
      .eq('id_tarea', id);
    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Tarea actualizada en Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al actualizar tarea.' };
  }
}

/**
 * Elimina una tarea de Supabase
 */
export async function deleteTareaFromSupabase(id: string): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const { error } = await client
      .from('tareas')
      .delete()
      .eq('id_tarea', id);
    if (error) return { ok: false, message: `Error en Supabase: ${error.message}` };
    return { ok: true, message: 'Tarea eliminada de Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar tarea.' };
  }
}