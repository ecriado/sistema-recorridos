import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: usuarios, error } = await admin
  .from('usuarios').select('email, nombre').eq('activo', true);
if (error) throw error;

const filas = ['email,clave_temporal'];
for (const u of usuarios) {
  const clave = randomBytes(9).toString('base64url');   // 12 caracteres aleatorios
  const { error: e } = await admin.auth.admin.createUser({
    email: u.email.trim().toLowerCase(),
    password: clave,
    email_confirm: true,
    user_metadata: { nombre: u.nombre },
  });
  if (e) { console.log(`✗ ${u.email}: ${e.message}`); continue; }
  console.log(`✓ ${u.email}`);
  filas.push(`${u.email},${clave}`);
}
writeFileSync('claves-temporales.csv', filas.join('\n'));