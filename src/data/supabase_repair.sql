-- ==============================================================================
-- EAZY PROPERTY OPS - SCRIPT DE REPARACIÓN Y ADECUACIÓN UNIVERSAL EN SUPABASE
-- ==============================================================================
-- Compatible con bases de datos existentes con UUID, llaves foráneas heredadas
-- (ej. foreign key "routes_building_id_fkey") y tablas creadas manualmente.
--
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- (OPCIONAL) Si la tabla 'routes' es una prueba antigua y deseas desvincularla:
-- ALTER TABLE IF EXISTS public.routes DROP CONSTRAINT IF EXISTS routes_building_id_fkey;

-- ------------------------------------------------------------------------------
-- 1. TABLA: edificios
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Si la tabla 'edificios' ya existe:
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edificios') THEN
        -- Conservamos la columna 'id' intacta para NO romper foreign keys existentes (como routes_building_id_fkey)
        -- Agregamos 'id_edificio' como columna de texto complementaria
        ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_edificio TEXT;
        
        -- Si existe 'id', aseguramos que tenga DEFAULT para nuevos inserts si no lo tenía
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'edificios' AND column_name = 'id' AND udt_name = 'uuid') THEN
            BEGIN
                ALTER TABLE public.edificios ALTER COLUMN id SET DEFAULT gen_random_uuid();
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;

        -- Copiamos el id existente a id_edificio para los registros existentes
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'edificios' AND column_name = 'id') THEN
            UPDATE public.edificios SET id_edificio = id::text WHERE id_edificio IS NULL;
        END IF;
    ELSE
        -- Si no existe, la creamos desde cero
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

-- Asegurar columnas estándar en 'edificios'
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_edificio TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS nombre VARCHAR(150);
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS administrador_actual TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_administrador_actual TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS tecnico_mantenimiento TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS id_tecnico_mantenimiento TEXT;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS creado_en TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.edificios ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ DEFAULT NOW();

-- Generador por defecto para id_edificio si se inserta sin especificarlo
ALTER TABLE public.edificios ALTER COLUMN id_edificio SET DEFAULT concat('EDI-', substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));

-- Índice único en id_edificio para permitir consultas rápidas y relaciones
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
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS id_edificio_asignado TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS edificio_asignado TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS edificios TEXT[];

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
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_automatizacion TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS id_lote_masivo TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS clave_idempotencia VARCHAR(100);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS asignado_a_email VARCHAR(150);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS titulo_tarea VARCHAR(200);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS instrucciones TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS prioridad VARCHAR(20) DEFAULT 'Media';
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS departamento VARCHAR(50);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS fecha_limite DATE;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS fecha_resolucion TIMESTAMPTZ;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS creado_por VARCHAR(150);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS estado_tarea VARCHAR(50) DEFAULT 'Pendiente';
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS observaciones_cierre TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS foto_evidencia_cierre TEXT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS tiempo_total_minutos INT;
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS resultado_cumplimiento VARCHAR(50);
ALTER TABLE public.tareas ADD COLUMN IF NOT EXISTS notificacion_enviada BOOLEAN DEFAULT false;

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
-- 8. STORAGE BUCKETS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('walkthrough-photos', 'walkthrough-photos', true),
  ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- ------------------------------------------------------------------------------
ALTER TABLE public.edificios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hallazgos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_automaticas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total a edificios" ON public.edificios;
CREATE POLICY "Acceso total a edificios" ON public.edificios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a usuarios" ON public.usuarios;
CREATE POLICY "Acceso total a usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a recorridos" ON public.recorridos;
CREATE POLICY "Acceso total a recorridos" ON public.recorridos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a checkpoints" ON public.checkpoints;
CREATE POLICY "Acceso total a checkpoints" ON public.checkpoints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a hallazgos" ON public.hallazgos;
CREATE POLICY "Acceso total a hallazgos" ON public.hallazgos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a tareas" ON public.tareas;
CREATE POLICY "Acceso total a tareas" ON public.tareas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total a tareas_automaticas" ON public.tareas_automaticas;
CREATE POLICY "Acceso total a tareas_automaticas" ON public.tareas_automaticas FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 10. INSERTAR REGISTROS DEMO SI NO EXISTEN
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    -- Edificios demo
    IF NOT EXISTS (SELECT 1 FROM public.edificios WHERE id_edificio = 'EDI-000001' OR nombre LIKE '%Roble%') THEN
        INSERT INTO public.edificios (id_edificio, nombre, direccion, activo)
        VALUES ('EDI-000001', 'Torre Roble Corporativo', 'Av. Las Américas 15-20, Zona 13, Ciudad de Guatemala', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.edificios WHERE id_edificio = 'EDI-000002' OR nombre LIKE '%Las Américas%') THEN
        INSERT INTO public.edificios (id_edificio, nombre, direccion, activo)
        VALUES ('EDI-000002', 'Torre Las Américas Nivel 1 a 18', 'Diagonal 6 10-50, Zona 10, Ciudad de Guatemala', true);
    END IF;

    -- Usuarios demo
    IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'carlos.mendez@eazyops.gt') THEN
        INSERT INTO public.usuarios (id_usuario, nombre, email, rol, usuario_login, activo)
        VALUES ('USR-000001', 'Ing. Carlos Méndez', 'carlos.mendez@eazyops.gt', 'Supervisor', 'carlos.mendez', true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE email = 'sofia.castillo@eazyops.gt') THEN
        INSERT INTO public.usuarios (id_usuario, nombre, email, rol, usuario_login, activo)
        VALUES ('USR-000002', 'Licda. Sofía Castillo', 'sofia.castillo@eazyops.gt', 'Administrador', 'sofia.castillo', true);
    END IF;
END $$;

SELECT 'ESQUEMA SUPABASE REPARADO Y ADAPTADO EXITOSAMENTE SIN ALTERAR FOREIGN KEYS NI TIPOS UUID' AS resultado;
