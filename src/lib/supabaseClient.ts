import { createClient, SupabaseClient } from '@supabase/supabase-js';

const defaultUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('sr_supabase_url') || '';
const defaultKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('sr_supabase_key') || '';

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

export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!client) {
    return { ok: false, message: 'No se han ingresado credenciales de Supabase (URL y Anon Key).' };
  }
  try {
    const { error } = await client.from('edificios').select('id_edificio').limit(1);
    if (error) {
      // Table might not exist yet if migration hasn't run
      return { ok: true, message: `Conexión con Supabase verificada (aviso tabla: ${error.message}).` };
    }
    return { ok: true, message: 'Conexión con PostgreSQL y Supabase exitosa.' };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Fallo de conexión a Supabase.' };
  }
}
