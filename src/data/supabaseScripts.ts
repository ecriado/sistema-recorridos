// Scripts SQL para Supabase (EAZY Property Ops)

export const repairSql = `-- ==============================================================================
-- EAZY PROPERTY OPS - SCRIPT DE REPARACIÓN Y ADECUACIÓN UNIVERSAL EN SUPABASE
-- ==============================================================================
-- Solución al error: "foreign key constraint 'routes_building_id_fkey' cannot be implemented"
-- Este script conserva las columnas 'id' (UUID) intactas sin romper restricciones
-- foráneas existentes, y añade 'id_edificio', 'id_usuario', etc., como columnas
-- compatibles sincronizadas automáticamente.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- (OPCIONAL) Si tienes tablas heredadas de prueba como 'routes' que ya no usas,
-- puedes desvincularlas ejecutando:
-- ALTER TABLE IF EXISTS public.routes DROP CONSTRAINT IF EXISTS routes_building_id_fkey;

-- ------------------------------------------------------------------------------
-- 1. TABLA: edificios
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edificios') THEN
        -- Conservamos la columna 'id' intacta para NO romper foreign keys existentes
        ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_edificio TEXT;
        
        -- Si existe 'id' UUID, asegurar default para nuevos inserts
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'edificios' AND column_name = 'id' AND udt_name = 'uuid') THEN
            BEGIN
                ALTER TABLE public.edificios ALTER COLUMN id SET DEFAULT gen_random_uuid();
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        -- Poblar id_edificio con el valor de id
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'edificios' AND column_name = 'id') THEN
            UPDATE public.edificios SET id_edificio = id::text WHERE id_edificio IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.edificios (
            id_edificio TEXT PRIMARY KEY,
            nombre VARCHAR(150) NOT NULL,
            direccion TEXT,
            activo BOOLEAN DEFAULT true,
            creado_en TIMESTAMPTZ DEFAULT NOW(),
            actualizado_en TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_edificio TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS nombre VARCHAR(150);
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.edificios ALTER COLUMN id_edificio SET DEFAULT concat('EDI-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_edificios_id_edificio ON public.edificios (id_edificio);

-- ------------------------------------------------------------------------------
-- 2. TABLA: usuarios
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
        ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS id_usuario TEXT;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'id' AND udt_name = 'uuid') THEN
            BEGIN
                ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'id') THEN
            UPDATE public.usuarios SET id_usuario = id::text WHERE id_usuario IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.usuarios (
            id_usuario TEXT PRIMARY KEY,
            nombre VARCHAR(150) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            rol VARCHAR(50) NOT NULL DEFAULT 'Administrador',
            usuario_login VARCHAR(60) UNIQUE NOT NULL,
            activo BOOLEAN DEFAULT true,
            creado_en TIMESTAMPTZ DEFAULT NOW(),
            ultimo_acceso TIMESTAMPTZ
        );
    END IF;
END $$;

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS id_usuario TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nombre VARCHAR(150);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(50) DEFAULT 'Administrador';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS usuario_login VARCHAR(60);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMPTZ;
ALTER TABLE public.usuarios ALTER COLUMN id_usuario SET DEFAULT concat('USR-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_id_usuario ON public.usuarios (id_usuario);

-- ------------------------------------------------------------------------------
-- 3. TABLA: recorridos
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recorridos') THEN
        ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS id_recorrido TEXT;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recorridos' AND column_name = 'id' AND udt_name = 'uuid') THEN
            BEGIN
                ALTER TABLE public.recorridos ALTER COLUMN id SET DEFAULT gen_random_uuid();
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'recorridos' AND column_name = 'id') THEN
            UPDATE public.recorridos SET id_recorrido = id::text WHERE id_recorrido IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.recorridos (
            id_recorrido TEXT PRIMARY KEY,
            nombre VARCHAR(200) NOT NULL,
            id_edificio TEXT,
            fecha_programada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            fecha_cierre_programada TIMESTAMPTZ,
            cierre_automatico BOOLEAN DEFAULT false,
            inspector_email VARCHAR(150) NOT NULL,
            estado VARCHAR(50) DEFAULT 'Programado',
            observaciones TEXT,
            creado_por VARCHAR(150) NOT NULL,
            fecha_inicio TIMESTAMPTZ,
            fecha_fin TIMESTAMPTZ,
            comentario_cierre TEXT,
            calificacion_cierre NUMERIC(3, 1),
            tipo_cierre VARCHAR(50),
            resultado_cierre VARCHAR(50),
            firma_digital_hash TEXT,
            creado_en TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS id_recorrido TEXT;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS id_edificio TEXT;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS fecha_cierre_programada TIMESTAMPTZ;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS cierre_automatico BOOLEAN DEFAULT false;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS inspector_email VARCHAR(150);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) DEFAULT 'Programado';
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS observaciones TEXT;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS creado_por VARCHAR(150);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMPTZ;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS comentario_cierre TEXT;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS calificacion_cierre NUMERIC(3, 1);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS tipo_cierre VARCHAR(50);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS resultado_cierre VARCHAR(50);
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS firma_digital_hash TEXT;
ALTER TABLE public.recorridos ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.recorridos ALTER COLUMN id_recorrido SET DEFAULT concat('REC-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_recorridos_id_recorrido ON public.recorridos (id_recorrido);

-- ------------------------------------------------------------------------------
-- 4. TABLA: checkpoints
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checkpoints') THEN
        ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS id_checkpoint TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'checkpoints' AND column_name = 'id') THEN
            UPDATE public.checkpoints SET id_checkpoint = id::text WHERE id_checkpoint IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.checkpoints (
            id_checkpoint TEXT PRIMARY KEY,
            id_edificio TEXT,
            id_recorrido TEXT,
            ubicacion VARCHAR(200) NOT NULL,
            descripcion TEXT,
            orden INT DEFAULT 1,
            activo BOOLEAN DEFAULT true,
            creado_en TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;

ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS id_checkpoint TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS id_edificio TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS id_recorrido TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(200);
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS orden INT DEFAULT 1;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.checkpoints ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.checkpoints ALTER COLUMN id_checkpoint SET DEFAULT concat('CHK-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkpoints_id_checkpoint ON public.checkpoints (id_checkpoint);

-- ------------------------------------------------------------------------------
-- 5. TABLA: hallazgos
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hallazgos') THEN
        ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS id_hallazgo TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hallazgos' AND column_name = 'id') THEN
            UPDATE public.hallazgos SET id_hallazgo = id::text WHERE id_hallazgo IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.hallazgos (
            id_hallazgo TEXT PRIMARY KEY,
            id_recorrido TEXT,
            id_checkpoint TEXT,
            estatus VARCHAR(50) NOT NULL DEFAULT 'Conforme',
            comentario TEXT,
            foto_url TEXT,
            fecha TIMESTAMPTZ DEFAULT NOW(),
            cerrado BOOLEAN DEFAULT false,
            fecha_cierre TIMESTAMPTZ
        );
    END IF;
END $$;

ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS id_hallazgo TEXT;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS id_recorrido TEXT;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS id_checkpoint TEXT;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS estatus VARCHAR(50) DEFAULT 'Conforme';
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS comentario TEXT;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS cerrado BOOLEAN DEFAULT false;
ALTER TABLE public.hallazgos ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ;
ALTER TABLE public.hallazgos ALTER COLUMN id_hallazgo SET DEFAULT concat('HAL-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_hallazgos_id_hallazgo ON public.hallazgos (id_hallazgo);

-- ------------------------------------------------------------------------------
-- 6. TABLA: tareas
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tareas') THEN
        ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_tarea TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tareas' AND column_name = 'id') THEN
            UPDATE public.tareas SET id_tarea = id::text WHERE id_tarea IS NULL;
        END IF;
    ELSE
        CREATE TABLE public.tareas (
            id_tarea TEXT PRIMARY KEY,
            id_hallazgo TEXT,
            id_edificio TEXT,
            tipo_origen VARCHAR(50) DEFAULT 'Manual',
            id_automatizacion TEXT,
            id_lote_masivo TEXT,
            clave_idempotencia VARCHAR(100),
            asignado_a_email VARCHAR(150) NOT NULL,
            titulo_tarea VARCHAR(200) NOT NULL,
            instrucciones TEXT,
            prioridad VARCHAR(20) DEFAULT 'Media',
            departamento VARCHAR(50),
            fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
            fecha_limite DATE,
            fecha_inicio TIMESTAMPTZ,
            fecha_resolucion TIMESTAMPTZ,
            creado_por VARCHAR(150) NOT NULL,
            estado_tarea VARCHAR(50) DEFAULT 'Pendiente',
            observaciones_cierre TEXT,
            foto_evidencia_cierre TEXT,
            tiempo_total_minutos INT,
            resultado_cumplimiento VARCHAR(50),
            notificacion_enviada BOOLEAN DEFAULT false
        );
    END IF;
END $$;

ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_tarea TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_hallazgo TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_edificio TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS tipo_origen VARCHAR(50) DEFAULT 'Manual';
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS asignado_a_email VARCHAR(150);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS titulo_tarea VARCHAR(200);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS instrucciones TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'Media';
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS departamento VARCHAR(50);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS estado_tarea VARCHAR(50) DEFAULT 'Pendiente';
ALTER TABLE public.tareas ALTER COLUMN id_tarea SET DEFAULT concat('TAR-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
CREATE UNIQUE INDEX IF NOT EXISTS idx_tareas_id_tarea ON public.tareas (id_tarea);

-- ------------------------------------------------------------------------------
-- 7. TABLA: tareas_automaticas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tareas_automaticas (
    id_automatizacion TEXT PRIMARY KEY,
    creado_por_email VARCHAR(150) NOT NULL,
    asignado_a_email VARCHAR(150) NOT NULL,
    id_edificio TEXT,
    titulo VARCHAR(200) NOT NULL,
    instrucciones TEXT,
    prioridad VARCHAR(20) DEFAULT 'Media',
    frecuencia VARCHAR(30) NOT NULL DEFAULT 'Semanal',
    dia_semana INT,
    dia_mes INT,
    hora VARCHAR(10) DEFAULT '08:00',
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    proxima_ejecucion TIMESTAMPTZ,
    ultima_ejecucion TIMESTAMPTZ,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. Storage y RLS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('walkthrough-photos', 'walkthrough-photos', true),
  ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total a edificios" ON public.edificios;
CREATE POLICY "Acceso total a edificios" ON public.edificios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a usuarios" ON public.usuarios;
CREATE POLICY "Acceso total a usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a recorridos" ON public.recorridos;
CREATE POLICY "Acceso total a recorridos" ON public.recorridos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a tareas" ON public.tareas;
CREATE POLICY "Acceso total a tareas" ON public.tareas FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 9. Insertar datos de prueba seguros
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.edificios WHERE id_edificio = 'EDI-000001' OR nombre LIKE '%Roble%') THEN
        INSERT INTO public.edificios (id_edificio, nombre, direccion, activo)
        VALUES ('EDI-000001', 'Torre Roble Corporativo', 'Av. Las Américas 15-20, Zona 13, Ciudad de Guatemala', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.edificios WHERE id_edificio = 'EDI-000002' OR nombre LIKE '%Las Américas%') THEN
        INSERT INTO public.edificios (id_edificio, nombre, direccion, activo)
        VALUES ('EDI-000002', 'Torre Las Américas Nivel 1 a 18', 'Diagonal 6 10-50, Zona 10, Ciudad de Guatemala', true);
    END IF;
END $$;

SELECT 'ESQUEMA SUPABASE REPARADO CON ÉXITO' AS status;`;

export const cleanRebuildSql = `-- ==============================================================================
-- EAZY PROPERTY OPS - RECONSTRUCCIÓN COMPLETA LIMPIA (DROP & CREATE)
-- ==============================================================================
-- Utiliza este script si tus tablas de Supabase fueron creadas sólo de prueba
-- y deseas recrearlas 100% limpias con todos los tipos, claves y datos demo.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Eliminar tablas existentes (en orden inverso de dependencia)
DROP TABLE IF EXISTS public.routes CASCADE;
DROP TABLE IF EXISTS public.archivos CASCADE;
DROP TABLE IF EXISTS public.reportes CASCADE;
DROP TABLE IF EXISTS public.bitacora CASCADE;
DROP TABLE IF EXISTS public.tareas_automaticas CASCADE;
DROP TABLE IF EXISTS public.tareas CASCADE;
DROP TABLE IF EXISTS public.hallazgos CASCADE;
DROP TABLE IF EXISTS public.checkpoints CASCADE;
DROP TABLE IF EXISTS public.recorridos CASCADE;
DROP TABLE IF EXISTS public.jerarquia_usuarios CASCADE;
DROP TABLE IF EXISTS public.usuario_edificios CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.edificios CASCADE;

-- 1. Edificios
CREATE TABLE public.edificios (
    id_edificio VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Usuarios
CREATE TABLE public.usuarios (
    id_usuario VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('SuperAdmin', 'Administrador', 'Supervisor', 'Mantenimiento')),
    usuario_login VARCHAR(60) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ
);

-- 3. Recorridos
CREATE TABLE public.recorridos (
    id_recorrido VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    id_edificio VARCHAR(50) REFERENCES public.edificios(id_edificio) ON DELETE RESTRICT,
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
    firma_digital_hash TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Checkpoints
CREATE TABLE public.checkpoints (
    id_checkpoint VARCHAR(50) PRIMARY KEY,
    id_edificio VARCHAR(50) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
    id_recorrido VARCHAR(50) REFERENCES public.recorridos(id_recorrido) ON DELETE CASCADE,
    ubicacion VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Hallazgos
CREATE TABLE public.hallazgos (
    id_hallazgo VARCHAR(50) PRIMARY KEY,
    id_recorrido VARCHAR(50) REFERENCES public.recorridos(id_recorrido) ON DELETE CASCADE,
    id_checkpoint VARCHAR(50) REFERENCES public.checkpoints(id_checkpoint) ON DELETE CASCADE,
    estatus VARCHAR(50) NOT NULL CHECK (estatus IN ('Conforme', 'Hallazgo/Falla')),
    comentario TEXT,
    foto_url TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    cerrado BOOLEAN DEFAULT false,
    fecha_cierre TIMESTAMPTZ
);

-- 6. Tareas
CREATE TABLE public.tareas (
    id_tarea VARCHAR(50) PRIMARY KEY,
    id_hallazgo VARCHAR(50) REFERENCES public.hallazgos(id_hallazgo) ON DELETE SET NULL,
    id_edificio VARCHAR(50) REFERENCES public.edificios(id_edificio) ON DELETE RESTRICT,
    tipo_origen VARCHAR(50) DEFAULT 'Manual' CHECK (tipo_origen IN ('Manual', 'Hallazgo', 'Automatica', 'Masiva')),
    id_automatizacion VARCHAR(50),
    id_lote_masivo VARCHAR(50),
    clave_idempotencia VARCHAR(100),
    asignado_a_email VARCHAR(150) NOT NULL,
    titulo_tarea VARCHAR(200) NOT NULL,
    instrucciones TEXT,
    prioridad VARCHAR(20) DEFAULT 'Media' CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
    departamento VARCHAR(50),
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_limite DATE,
    fecha_inicio TIMESTAMPTZ,
    fecha_resolucion TIMESTAMPTZ,
    creado_por VARCHAR(150) NOT NULL,
    estado_tarea VARCHAR(50) DEFAULT 'Pendiente' CHECK (estado_tarea IN ('Pendiente', 'En Proceso', 'Resuelta', 'Cancelada')),
    observaciones_cierre TEXT,
    foto_evidencia_cierre TEXT,
    tiempo_total_minutos INT,
    resultado_cumplimiento VARCHAR(50),
    notificacion_enviada BOOLEAN DEFAULT false
);

-- 7. Tareas Automáticas
CREATE TABLE public.tareas_automaticas (
    id_automatizacion VARCHAR(50) PRIMARY KEY,
    creado_por_email VARCHAR(150) NOT NULL,
    asignado_a_email VARCHAR(150) NOT NULL,
    id_edificio VARCHAR(50) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    instrucciones TEXT,
    prioridad VARCHAR(20) DEFAULT 'Media',
    frecuencia VARCHAR(30) NOT NULL CHECK (frecuencia IN ('Diaria', 'Semanal', 'Mensual')),
    dia_semana INT,
    dia_mes INT,
    hora VARCHAR(10) DEFAULT '08:00',
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    proxima_ejecucion TIMESTAMPTZ,
    ultima_ejecucion TIMESTAMPTZ,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('walkthrough-photos', 'walkthrough-photos', true),
  ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

-- 9. RLS
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hallazgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_automaticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total a edificios" ON public.edificios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a recorridos" ON public.recorridos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a checkpoints" ON public.checkpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a hallazgos" ON public.hallazgos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a tareas" ON public.tareas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total a tareas_automaticas" ON public.tareas_automaticas FOR ALL USING (true) WITH CHECK (true);

-- 10. Datos Iniciales
INSERT INTO public.edificios (id_edificio, nombre, direccion, activo) VALUES 
('EDI-000001', 'Torre Roble Corporativo', 'Av. Las Américas 15-20, Zona 13, Ciudad de Guatemala', true),
('EDI-000002', 'Torre Las Américas Nivel 1 a 18', 'Diagonal 6 10-50, Zona 10, Ciudad de Guatemala', true),
('EDI-000003', 'Centro Financiero Zona 4', 'Ruta 6 9-21, Zona 4, Ciudad de Guatemala', true);

INSERT INTO public.usuarios (id_usuario, nombre, email, rol, usuario_login, activo) VALUES 
('USR-000001', 'Ing. Carlos Méndez', 'carlos.mendez@eazyops.gt', 'Supervisor', 'carlos.mendez', true),
('USR-000002', 'Licda. Sofía Castillo', 'sofia.castillo@eazyops.gt', 'Administrador', 'sofia.castillo', true),
('USR-000003', 'Juan Mantenimiento', 'juan.mantenimiento@eazyops.gt', 'Mantenimiento', 'juan.mantenimiento', true),
('USR-000004', 'SuperAdmin EAZY', 'admin@eazyops.gt', 'SuperAdmin', 'admin.eazy', true);

SELECT 'INSTALACIÓN LIMPIA COMPLETADA' AS resultado;`;

export const extractorPostgresV1_1Script = `/**************************************************************
 * EXTRACTOR Y MIGRATOR A POSTGRESQL / SUPABASE v1.1 (Corregido)
 * Corrección de tipos TIME y DATE para Google Sheets
 **************************************************************/

function ejecutarMigracionAGoogleDrive() {
  const ss = SpreadsheetApp.openById(CONFIG.DB_ID);
  let sql = [];
  
  sql.push("-- =========================================================");
  sql.push("-- MIGRACIÓN DE DATOS: GOOGLE SHEETS -> POSTGRESQL / SUPABASE");
  sql.push("-- Generado: " + new Date().toISOString());
  sql.push("-- =========================================================");
  sql.push("BEGIN;\\n");

  const mapUsuarios = {};
  const mapUsuariosEmail = {};
  const mapEdificios = {};
  const mapCheckpoints = {};
  const mapRecorridos = {};
  const mapHallazgos = {};
  const mapLotes = {};
  const mapAutos = {};

  // Formateador de Strings escapados
  const esc = (v) => {
    if (v === null || v === undefined || v === "") return "NULL";
    return "'" + String(v).replace(/'/g, "''").trim() + "'";
  };

  // Formateador de Booleanos
  const sqlBool = (v) => {
    if (v === true || String(v).toLowerCase() === "true" || v === 1) return "true";
    return "false";
  };

  // Formateador de Timestamps completos (TIMESTAMPTZ)
  const sqlDate = (v) => {
    if (!v) return "NULL";
    let d = v instanceof Date ? v : new Date(String(v).includes("T") ? v : String(v).replace(" ", "T"));
    if (isNaN(d.getTime())) return "NULL";
    return "'" + d.toISOString() + "'";
  };

  // Formateador específico para campos DATE (YYYY-MM-DD)
  const sqlDateOnly = (v) => {
    if (!v) return "NULL";
    if (v instanceof Date) {
      return "'" + Utilities.formatDate(v, CONFIG.TIMEZONE, "yyyy-MM-dd") + "'";
    }
    const s = String(v).trim();
    let d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      return "'" + Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd") + "'";
    }
    return "NULL";
  };

  // Formateador específico para campos TIME (HH:mm:ss)
  const sqlTime = (v) => {
    if (!v) return "'08:00:00'";
    if (v instanceof Date) {
      return "'" + Utilities.formatDate(v, CONFIG.TIMEZONE, "HH:mm:ss") + "'";
    }
    const match = String(v).match(/(\\d{1,2}):(\\d{2})(:(\\d{2}))?/);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2];
      const s = match[4] || "00";
      return \`'\${h}:\${m}:\${s}'\`;
    }
    return "'08:00:00'";
  };

  const leerHoja = (nombre) => {
    const sh = ss.getSheetByName(nombre);
    if (!sh || sh.getLastRow() < 2) return [];
    const vals = sh.getDataRange().getValues();
    const headers = vals[0].map(h => String(h).trim());
    return vals.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  };

  Logger.log("Iniciando extracción corregida...");

  // 1. USUARIOS
  const usuarios = leerHoja(CONFIG.SHEETS.USUARIOS);
  sql.push("-- 1. TABLA: USUARIOS");
  usuarios.forEach(u => {
    const uuid = Utilities.getUuid();
    const oldId = String(u.ID_Usuario || "").trim();
    const email = String(u.Email || "").trim().toLowerCase();
    mapUsuarios[oldId] = uuid;
    if (email) mapUsuariosEmail[email] = uuid;

    let rol = String(u.Rol || "mantenimiento").toLowerCase();
    if (rol === "administrador") rol = "administrador";
    else if (rol === "superadmin") rol = "superadmin";
    else if (rol === "supervisor") rol = "supervisor";
    else rol = "mantenimiento";

    const login = String(u.Usuario_Login || email.split("@")[0] || uuid.slice(0,8)).toLowerCase();

    sql.push(\`INSERT INTO usuarios (id, nombre, email, usuario_login, rol, activo, cambiar_password, intentos_fallidos, created_at)
VALUES ('\${uuid}', \${esc(u.Nombre)}, \${esc(email)}, \${esc(login)}, '\${rol}', \${sqlBool(u.Activo)}, \${sqlBool(u.Cambiar_Password)}, \${Number(u.Intentos_Fallidos) || 0}, NOW())
ON CONFLICT (email) DO NOTHING;\`);
  });

  // 2. EDIFICIOS
  const edificios = leerHoja(CONFIG.SHEETS.EDIFICIOS);
  sql.push("\\n-- 2. TABLA: EDIFICIOS");
  edificios.forEach(e => {
    const uuid = Utilities.getUuid();
    const oldId = String(e.ID_Edificio || "").trim();
    mapEdificios[oldId] = uuid;

    sql.push(\`INSERT INTO edificios (id, codigo, nombre, direccion, activo, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, \${esc(e.Nombre)}, \${esc(e.Direccion)}, \${sqlBool(e.Activo)}, NOW());\`);
  });

  // 3. USUARIO_EDIFICIOS
  const asignaciones = leerHoja(CONFIG.SHEETS.USUARIO_EDIFICIOS);
  sql.push("\\n-- 3. TABLA: USUARIO_EDIFICIOS");
  asignaciones.forEach(a => {
    const uId = mapUsuarios[String(a.ID_Usuario).trim()];
    const eId = mapEdificios[String(a.ID_Edificio).trim()];
    if (uId && eId) {
      sql.push(\`INSERT INTO usuario_edificios (id, usuario_id, edificio_id, activo, fecha_asignacion, fecha_finalizacion)
VALUES ('\${Utilities.getUuid()}', '\${uId}', '\${eId}', \${sqlBool(a.Activo)}, \${sqlDate(a.Fecha_Asignacion)}, \${sqlDate(a.Fecha_Finalizacion)});\`);
    }
  });

  // 4. JERARQUIA_USUARIOS
  const jerarquias = leerHoja(CONFIG.SHEETS.JERARQUIA_USUARIOS);
  sql.push("\\n-- 4. TABLA: JERARQUIA_USUARIOS");
  jerarquias.forEach(j => {
    const adminId = mapUsuarios[String(j.ID_Administrador).trim()];
    const subId = mapUsuarios[String(j.ID_Subordinado).trim()];
    if (adminId && subId) {
      sql.push(\`INSERT INTO jerarquia_usuarios (id, administrador_id, subordinado_id, activo, created_at)
VALUES ('\${Utilities.getUuid()}', '\${adminId}', '\${subId}', \${sqlBool(j.Activo)}, \${sqlDate(j.Fecha_Asignacion)});\`);
    }
  });

  // 5. CHECKPOINTS
  const checkpoints = leerHoja(CONFIG.SHEETS.CHECKPOINTS);
  sql.push("\\n-- 5. TABLA: CHECKPOINTS");
  checkpoints.forEach(c => {
    const uuid = Utilities.getUuid();
    const oldId = String(c.ID_Checkpoint || "").trim();
    mapCheckpoints[oldId] = uuid;
    const eId = mapEdificios[String(c.ID_Edificio).trim()];

    if (eId) {
      sql.push(\`INSERT INTO checkpoints (id, edificio_id, ubicacion, descripcion, orden, activo, created_at)
VALUES ('\${uuid}', '\${eId}', \${esc(c.Ubicacion)}, \${esc(c.Descripcion)}, \${Number(c.Orden) || 1}, \${sqlBool(c.Activo)}, NOW());\`);
    }
  });

  // 6. RECORRIDOS
  const recorridos = leerHoja(CONFIG.SHEETS.RECORRIDOS);
  sql.push("\\n-- 6. TABLA: RECORRIDOS");
  recorridos.forEach(r => {
    const uuid = Utilities.getUuid();
    const oldId = String(r.ID_Recorrido || "").trim();
    mapRecorridos[oldId] = uuid;
    const eId = mapEdificios[String(r.ID_Edificio).trim()];
    const inspId = mapUsuariosEmail[String(r.Inspector_Email || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];
    const creadorId = mapUsuariosEmail[String(r.Creado_Por || "").trim().toLowerCase()] || inspId;

    let estado = "programado";
    const estLower = String(r.Estado || "").toLowerCase();
    if (estLower.includes("proceso")) estado = "en_proceso";
    else if (estLower.includes("completado")) estado = "completado";
    else if (estLower.includes("cancelado")) estado = "cancelado";

    if (eId) {
      sql.push(\`INSERT INTO recorridos (id, codigo, edificio_id, inspector_id, creado_por, fecha_programada, fecha_cierre_programada, cierre_automatico, estado, observaciones, fecha_inicio, fecha_fin, comentario_cierre, calificacion_cierre, tipo_cierre, resultado_cierre, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, '\${eId}', '\${inspId}', '\${creadorId}', \${sqlDate(r.Fecha_Programada)}, \${sqlDate(r.Fecha_Cierre_Programada)}, \${sqlBool(r.Cierre_Automatico)}, '\${estado}', \${esc(r.Observaciones)}, \${sqlDate(r.Fecha_Inicio)}, \${sqlDate(r.Fecha_Fin)}, \${esc(r.Comentario_Cierre)}, \${Number(r.Calificacion_Cierre) || "NULL"}, \${esc(r.Tipo_Cierre)}, \${esc(r.Resultado_Cierre)}, NOW());\`);
    }
  });

  // 7. HALLAZGOS
  const hallazgos = leerHoja(CONFIG.SHEETS.HALLAZGOS);
  sql.push("\\n-- 7. TABLA: HALLAZGOS");
  hallazgos.forEach(h => {
    const uuid = Utilities.getUuid();
    const oldId = String(h.ID_Hallazgo || "").trim();
    mapHallazgos[oldId] = uuid;
    const recId = mapRecorridos[String(h.ID_Recorrido).trim()];
    const chkId = mapCheckpoints[String(h.ID_Checkpoint).trim()];

    let estatus = String(h.Estatus || "").toLowerCase().includes("falla") ? "hallazgo_falla" : "conforme";

    if (recId && chkId) {
      sql.push(\`INSERT INTO hallazgos (id, codigo, recorrido_id, checkpoint_id, estatus, comentario, foto_url, cerrado, fecha_cierre, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, '\${recId}', '\${chkId}', '\${estatus}', \${esc(h.Comentario)}, \${esc(h.Foto)}, \${sqlBool(h.Cerrado)}, \${sqlDate(h.Fecha_Cierre)}, \${sqlDate(h.Fecha)});\`);
    }
  });

  // 8. LOTES MASIVOS
  const lotes = leerHoja(CONFIG.SHEETS.LOTES_TAREAS);
  sql.push("\\n-- 8. TABLA: LOTES_TAREAS");
  lotes.forEach(l => {
    const uuid = Utilities.getUuid();
    const oldId = String(l.ID_Lote_Masivo || "").trim();
    mapLotes[oldId] = uuid;
    const creadorId = mapUsuariosEmail[String(l.Creado_Por || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];

    sql.push(\`INSERT INTO lotes_tareas (id, codigo, clave_idempotencia, titulo, cantidad_solicitada, cantidad_creada, creado_por, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, \${esc(l.Clave_Idempotencia || uuid)}, \${esc(l.Titulo)}, \${Number(l.Cantidad_Solicitada) || 0}, \${Number(l.Cantidad_Creada) || 0}, '\${creadorId}', \${sqlDate(l.Fecha_Creacion)});\`);
  });

  // 9. AUTOMATIZACIONES (Con fix para hora y fecha_inicio)
  const autos = leerHoja(CONFIG.SHEETS.TAREAS_AUTOMATICAS);
  sql.push("\\n-- 9. TABLA: TAREAS_AUTOMATICAS");
  autos.forEach(a => {
    const uuid = Utilities.getUuid();
    const oldId = String(a.ID_Automatizacion || "").trim();
    mapAutos[oldId] = uuid;
    const eId = mapEdificios[String(a.ID_Edificio).trim()] || Object.values(mapEdificios)[0];
    const asigId = mapUsuariosEmail[String(a.Asignado_A_Email || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];
    const creadorId = mapUsuariosEmail[String(a.Creado_Por_Email || "").trim().toLowerCase()] || asigId;

    let frec = String(a.Frecuencia || "diaria").toLowerCase();
    if (!["diaria","semanal","mensual"].includes(frec)) frec = "diaria";

    sql.push(\`INSERT INTO tareas_automaticas (id, codigo, edificio_id, asignado_a_id, creado_por, titulo, instrucciones, prioridad, frecuencia, dia_semana, dia_mes, hora, fecha_inicio, fecha_fin, proxima_ejecucion, ultima_ejecucion, activo, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, '\${eId}', '\${asigId}', '\${creadorId}', \${esc(a.Titulo)}, \${esc(a.Instrucciones)}, '\${String(a.Prioridad||"media").toLowerCase()}', '\${frec}', \${Number(a.Dia_Semana) || "NULL"}, \${Number(a.Dia_Mes) || "NULL"}, \${sqlTime(a.Hora)}, \${sqlDateOnly(a.Fecha_Inicio)}, \${sqlDateOnly(a.Fecha_Fin)}, \${sqlDate(a.Proxima_Ejecucion)}, \${sqlDate(a.Ultima_Ejecucion)}, \${sqlBool(a.Activo)}, NOW());\`);
  });

  // 10. TAREAS
  const tareas = leerHoja(CONFIG.SHEETS.TAREAS);
  sql.push("\\n-- 10. TABLA: TAREAS");
  tareas.forEach(t => {
    const uuid = Utilities.getUuid();
    const oldId = String(t.ID_Tarea || "").trim();
    const eId = mapEdificios[String(t.ID_Edificio).trim()] || Object.values(mapEdificios)[0];
    const asigId = mapUsuariosEmail[String(t.Asignado_A_Email || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];
    const creadorId = mapUsuariosEmail[String(t.Creado_Por || "").trim().toLowerCase()] || asigId;
    const hallazgoId = mapHallazgos[String(t.ID_Hallazgo).trim()] || null;
    const loteId = mapLotes[String(t.ID_Lote_Masivo).trim()] || null;
    const autoId = mapAutos[String(t.ID_Automatizacion).trim()] || null;

    let estado = "pendiente";
    const estLower = String(t.Estado_Tarea || "").toLowerCase();
    if (estLower.includes("proceso")) estado = "en_proceso";
    else if (estLower.includes("resuelta")) estado = "resuelta";
    else if (estLower.includes("cancelada")) estado = "cancelada";

    let origen = "manual";
    const origLower = String(t.Tipo_Origen || "").toLowerCase();
    if (origLower.includes("hallazgo")) origen = "hallazgo";
    else if (origLower.includes("auto")) origen = "automatica";
    else if (origLower.includes("masiva")) origen = "masiva";

    let prioridad = String(t.Prioridad || "media").toLowerCase();
    if (!["alta","media","baja"].includes(prioridad)) prioridad = "media";

    sql.push(\`INSERT INTO tareas (id, codigo, edificio_id, hallazgo_id, automatizacion_id, lote_id, asignado_a_id, creado_por, tipo_origen, titulo, instrucciones, prioridad, estado, fecha_limite, fecha_inicio, fecha_resolucion, tiempo_total_minutos, resultado_cumplimiento, observaciones_cierre, foto_cierre_url, clave_idempotencia, created_at)
VALUES ('\${uuid}', \${esc(oldId)}, '\${eId}', \${hallazgoId ? \`'\${hallazgoId}'\` : "NULL"}, \${autoId ? \`'\${autoId}'\` : "NULL"}, \${loteId ? \`'\${loteId}'\` : "NULL"}, '\${asigId}', '\${creadorId}', '\${origen}', \${esc(t.Titulo_Tarea)}, \${esc(t.Instrucciones)}, '\${prioridad}', '\${estado}', \${sqlDate(t.Fecha_Limite)}, \${sqlDate(t.Fecha_Inicio)}, \${sqlDate(t.Fecha_Resolucion)}, \${Number(t.Tiempo_Total_Minutos) || "NULL"}, \${esc(t.Resultado_Cumplimiento)}, \${esc(t.Observaciones_Cierre)}, \${esc(t.Foto_Evidencia_Cierre)}, \${esc(t.Clave_Idempotencia)}, \${sqlDate(t.Fecha_Creacion)});\`);
  });

  // 11. ACTUALIZACIÓN DE SECUENCIAS
  sql.push("\\n-- 11. ACTUALIZACIÓN DE SECUENCIAS CORRELATIVAS");
  sql.push("SELECT setval('seq_codigo_edificio', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM edificios), 1));");
  sql.push("SELECT setval('seq_codigo_recorrido', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM recorridos), 1));");
  sql.push("SELECT setval('seq_codigo_hallazgo', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM hallazgos), 1));");
  sql.push("SELECT setval('seq_codigo_tarea', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM tareas), 1));");
  sql.push("SELECT setval('seq_codigo_lote', COALESCE((SELECT MAX(SUBSTRING(codigo, 6)::INT) FROM lotes_tareas), 1));");
  sql.push("SELECT setval('seq_codigo_auto', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM tareas_automaticas), 1));");

  sql.push("\\nCOMMIT;");

  const contenidoSql = sql.join("\\n");
  const nombreArchivo = "migracion_recorridos_v2_" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd_HHmmss") + ".sql";
  const archivoDrive = DriveApp.createFile(nombreArchivo, contenidoSql, "application/sql");

  Logger.log("✅ NUEVA MIGRACIÓN GENERADA");
  Logger.log("Archivo: " + archivoDrive.getUrl());
  return archivoDrive.getUrl();
}
`;
