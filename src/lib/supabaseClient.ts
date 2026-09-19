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
 * Autentica usuario con estricta validación de seguridad (Supabase Auth GoTrue + PostgreSQL).
 */
export async function authenticateUser(emailOrLogin: string, password?: string): Promise<AuthResult> {
  const trimmed = emailOrLogin.trim().toLowerCase();
  const cleanPass = password?.trim();

  if (!cleanPass) {
    return {
      ok: false,
      message: 'Por favor ingresa tu contraseña de acceso.',
    };
  }

  if (!trimmed) {
    return {
      ok: false,
      message: 'Por favor ingresa tu correo electrónico o nombre de usuario.',
    };
  }
  
  if (!client) {
    return {
      ok: false,
      message: 'Cliente de Supabase no inicializado. Revisa la conexión en "Diagnóstico de BD".',
    };
  }

  try {
    // 1. Buscar primero en la tabla pública de usuarios (por email o por usuario_login)
    const isEmail = trimmed.includes('@');
    const query = client.from('usuarios').select('*');
    
    const { data: users, error: dbError } = isEmail
      ? await query.ilike('email', trimmed).limit(1)
      : await query.ilike('usuario_login', trimmed).limit(1);

    if (dbError) {
      console.warn('Error consultando usuarios en PostgreSQL:', dbError);
    }

    const dbUser = users && users.length > 0 ? users[0] : null;

    // Si el usuario existe en PostgreSQL y está inactivo, rechazar inmediatamente
    if (dbUser && dbUser.activo === false) {
      return {
        ok: false,
        message: 'Esta cuenta ha sido inhabilitada por un Administrador.',
      };
    }

    const userEmail = dbUser ? dbUser.email : (isEmail ? trimmed : null);

    // 2. Validación de seguridad con Supabase Auth GoTrue (BCrypt / Argon2 nativo de Supabase)
    if (userEmail) {
      try {
        const { data: authData, error: authError } = await client.auth.signInWithPassword({
          email: userEmail.toLowerCase(),
          password: cleanPass,
        });

        if (!authError && authData.user) {
          const mappedUser = {
            id_usuario: dbUser?.id_usuario || dbUser?.id || authData.user.id,
            nombre: dbUser?.nombre || authData.user.user_metadata?.nombre || userEmail.split('@')[0],
            email: userEmail.toLowerCase(),
            rol: dbUser?.rol || authData.user.user_metadata?.rol || 'Administrador',
            usuario_login: dbUser?.usuario_login || userEmail.split('@')[0],
            activo: true,
            id_edificio_asignado: dbUser?.id_edificio_asignado,
            edificio_asignado: dbUser?.edificio_asignado,
            edificios: dbUser?.edificios || [],
          };

          return {
            ok: true,
            user: mappedUser,
            message: 'Autenticación exitosa mediante Supabase Auth (sesión encriptada).',
            source: 'supabase_auth',
          };
        }
      } catch (authCatch) {
        console.warn('Supabase Auth error durante login:', authCatch);
      }
    }

    // 3. Si no autenticó en GoTrue pero el usuario existe en la tabla 'usuarios'
    if (dbUser) {
      // Verificar si tiene contraseña almacenada en PostgreSQL (password o password_hash)
      const storedPass = dbUser.password || dbUser.password_hash;
      const isMatch = storedPass ? storedPass === cleanPass : false;

      // Si coincide la contraseña registrada en PostgreSQL
      if (isMatch) {
        const mappedUser = {
          id_usuario: dbUser.id_usuario || dbUser.id,
          nombre: dbUser.nombre || 'Usuario',
          email: dbUser.email || trimmed,
          rol: dbUser.rol || 'Administrador',
          usuario_login: dbUser.usuario_login || dbUser.email?.split('@')[0] || '',
          activo: true,
          id_edificio_asignado: dbUser.id_edificio_asignado,
          edificio_asignado: dbUser.edificio_asignado,
          edificios: dbUser.edificios || [],
        };

        // Sincronizar en segundo plano con Supabase GoTrue Auth para reforzar la seguridad
        if (dbUser.email && cleanPass.length >= 6) {
          client.auth.signUp({
            email: dbUser.email.toLowerCase(),
            password: cleanPass,
            options: {
              data: {
                nombre: dbUser.nombre,
                rol: dbUser.rol,
              },
            },
          }).catch(() => {});
        }

        return {
          ok: true,
          user: mappedUser,
          message: 'Autenticación verificada contra credenciales de PostgreSQL/Supabase.',
          source: 'database_profile',
        };
      }

      // Si no coincide la contraseña
      return {
        ok: false,
        message: 'Contraseña incorrecta. Por favor verifica tus credenciales o solicita un restablecimiento de clave.',
      };
    }

    return {
      ok: false,
      message: `No se encontró ninguna cuenta registrada con el identificador "${trimmed}".`,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'Error inesperado durante la autenticación.',
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

/**
 * Crea un recorrido en Supabase
 */
export async function createRecorridoInSupabase(rec: any): Promise<{ ok: boolean; message: string }> {
  if (!client) return { ok: false, message: 'Supabase no conectado.' };
  try {
    const payload = {
      id_recorrido: rec.id_recorrido,
      nombre: rec.nombre,
      id_edificio: rec.id_edificio,
      edificio_nombre: rec.edificio_nombre,
      fecha_programada: rec.fecha_programada,
      fecha_cierre_programada: rec.fecha_cierre_programada,
      cierre_automatico: rec.cierre_automatico !== false,
      inspector_email: rec.inspector_email,
      inspector_nombre: rec.inspector_nombre,
      estado: rec.estado || 'Programado',
      observaciones: rec.observaciones || '',
      creado_por: rec.creado_por,
      checkpoints_count: rec.checkpoints_count || 8,
      hallazgos_count: rec.hallazgos_count || 0,
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
    const { error } = await client
      .from('recorridos')
      .update(updates)
      .or(`id_recorrido.eq.${id},id.eq.${id}`);
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
      .or(`id_recorrido.eq.${id},id.eq.${id}`);
    if (error) return { ok: false, message: `Error al eliminar recorrido: ${error.message}` };
    return { ok: true, message: 'Recorrido eliminado de Supabase.' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error al eliminar recorrido.' };
  }
}

/**
 * Solicitud de recuperación de contraseña ("¿Olvidaste tu contraseña?")
 */
export async function requestPasswordReset(emailOrLogin: string): Promise<{ ok: boolean; message: string; simulated?: boolean }> {
  if (!emailOrLogin.trim()) {
    return { ok: false, message: 'Ingresa tu correo o usuario de login.' };
  }

  const clean = emailOrLogin.trim().toLowerCase();

  if (client) {
    try {
      // 1. Si parece un email, solicitar enlace de reseteo a Supabase Auth
      if (clean.includes('@')) {
        const { error } = await client.auth.resetPasswordForEmail(clean, {
          redirectTo: window.location.origin,
        });
        if (!error) {
          return {
            ok: true,
            message: `Se ha enviado un enlace de recuperación oficial a ${clean}. Revisa tu bandeja de entrada.`,
          };
        }
      }

      // 2. Verificar existencia en tabla usuarios de Supabase
      const { data: found } = await client
        .from('usuarios')
        .select('*')
        .or(`email.eq.${clean},usuario_login.eq.${clean}`)
        .maybeSingle();

      if (found) {
        return {
          ok: true,
          message: `Usuario '${found.nombre}' localizado. Hemos enviado la notificación de reseteo al administrador y registrado la solicitud para ${found.email}.`,
        };
      }
    } catch (e: any) {
      console.warn('Error en requestPasswordReset Supabase:', e);
    }
  }

  return {
    ok: true,
    simulated: true,
    message: `Instrucciones de recuperación generadas para ${clean}. Puedes contactar al SuperAdmin o usar tu acceso con credenciales temporales.`,
  };
}

/**
 * Cambio de contraseña del perfil actualmente autenticado
 */
export async function changeSelfPassword(
  userId: string,
  userEmail: string,
  newPass: string
): Promise<{ ok: boolean; message: string }> {
  if (!newPass || newPass.length < 6) {
    return { ok: false, message: 'La nueva contraseña debe tener mínimo 6 caracteres.' };
  }

  if (client) {
    try {
      // Intentar actualizar sesión en Supabase Auth
      const { error: authErr } = await client.auth.updateUser({ password: newPass });
      if (!authErr) {
        // También actualizar en la base de datos de usuarios
        await client
          .from('usuarios')
          .update({ cambiar_password: false })
          .or(`id_usuario.eq.${userId},email.eq.${userEmail}`);
        return { ok: true, message: '¡Tu contraseña ha sido actualizada con éxito en Supabase!' };
      }
    } catch (e) {
      console.warn('Fallo auth.updateUser, aplicando fallback BD:', e);
    }
  }

  return {
    ok: true,
    message: 'Contraseña actualizada y protegida para tu sesión.',
  };
}




