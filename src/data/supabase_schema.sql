-- ==============================================================================
-- SISTEMA DE RECORRIDOS v8.7.0 (EAZY PROPERTY OPS)
-- Esquema DDL de Migración a Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: Edificios
CREATE TABLE IF NOT EXISTS public.edificios (
    id_edificio VARCHAR(30) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla: Usuarios
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

-- 3. Tabla: Asignaciones de Edificios (UsuarioEdificios)
CREATE TABLE IF NOT EXISTS public.usuario_edificios (
    id_asignacion VARCHAR(30) PRIMARY KEY,
    id_usuario VARCHAR(30) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    asignado_por VARCHAR(150),
    fecha_finalizacion TIMESTAMPTZ,
    desactivado_por VARCHAR(150)
);

-- 4. Tabla: Jerarquía Organizacional (Supervisores / Administradores / Mantenimiento)
CREATE TABLE IF NOT EXISTS public.jerarquia_usuarios (
    id_relacion VARCHAR(30) PRIMARY KEY,
    id_administrador VARCHAR(30) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    id_subordinado VARCHAR(30) REFERENCES public.usuarios(id_usuario) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
    asignado_por VARCHAR(150)
);

-- 5. Tabla: Recorridos de Inspección
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
    firma_digital_hash TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla: Checkpoints (Puntos de Control)
CREATE TABLE IF NOT EXISTS public.checkpoints (
    id_checkpoint VARCHAR(30) PRIMARY KEY,
    id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
    id_recorrido VARCHAR(30) REFERENCES public.recorridos(id_recorrido) ON DELETE CASCADE,
    ubicacion VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla: Hallazgos de Inspección
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

-- 8. Tabla: Tareas Correctivas y Preventivas
CREATE TABLE IF NOT EXISTS public.tareas (
    id_tarea VARCHAR(30) PRIMARY KEY,
    id_hallazgo VARCHAR(30) REFERENCES public.hallazgos(id_hallazgo) ON DELETE SET NULL,
    id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE RESTRICT,
    tipo_origen VARCHAR(50) DEFAULT 'Manual' CHECK (tipo_origen IN ('Manual', 'Hallazgo', 'Automatica', 'Masiva')),
    id_automatizacion VARCHAR(30),
    id_lote_masivo VARCHAR(30),
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

-- 9. Tabla: Tareas Automáticas (Recurrentes)
CREATE TABLE IF NOT EXISTS public.tareas_automaticas (
    id_automatizacion VARCHAR(30) PRIMARY KEY,
    creado_por_email VARCHAR(150) NOT NULL,
    asignado_a_email VARCHAR(150) NOT NULL,
    id_edificio VARCHAR(30) REFERENCES public.edificios(id_edificio) ON DELETE CASCADE,
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

-- 10. Tabla: Archivos y Evidencias Multimedia
CREATE TABLE IF NOT EXISTS public.archivos (
    id_archivo VARCHAR(30) PRIMARY KEY,
    bucket VARCHAR(100) NOT NULL,
    url_archivo TEXT NOT NULL,
    nombre_archivo VARCHAR(250) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamano_bytes BIGINT,
    tipo_archivo VARCHAR(50),
    entidad VARCHAR(50) NOT NULL,
    id_entidad VARCHAR(30) NOT NULL,
    id_edificio VARCHAR(30),
    id_recorrido VARCHAR(30),
    activo BOOLEAN DEFAULT true,
    fecha_subida TIMESTAMPTZ DEFAULT NOW(),
    subido_por VARCHAR(150)
);

-- 11. Tabla: Reportes Mensuales Generados
CREATE TABLE IF NOT EXISTS public.reportes (
    id_reporte VARCHAR(30) PRIMARY KEY,
    fecha_generacion TIMESTAMPTZ DEFAULT NOW(),
    generado_por VARCHAR(150) NOT NULL,
    periodo VARCHAR(10) NOT NULL,
    id_edificio VARCHAR(30),
    url_pdf TEXT,
    url_csv TEXT
);

-- 12. Tabla: Bitácora de Auditoría
CREATE TABLE IF NOT EXISTS public.bitacora (
    id BIGSERIAL PRIMARY KEY,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    usuario VARCHAR(150) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    tabla VARCHAR(50) NOT NULL,
    registro VARCHAR(100) NOT NULL,
    observaciones TEXT
);

-- 13. Buckets de Almacenamiento (Supabase Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('walkthrough-photos', 'walkthrough-photos', true),
  ('audit-reports', 'audit-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_recorridos_edificio ON public.recorridos(id_edificio);
CREATE INDEX IF NOT EXISTS idx_recorridos_estado ON public.recorridos(estado);
CREATE INDEX IF NOT EXISTS idx_checkpoints_recorrido ON public.checkpoints(id_recorrido);
CREATE INDEX IF NOT EXISTS idx_hallazgos_recorrido ON public.hallazgos(id_recorrido);
CREATE INDEX IF NOT EXISTS idx_tareas_edificio ON public.tareas(id_edificio);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON public.tareas(estado_tarea);
CREATE INDEX IF NOT EXISTS idx_tareas_responsable ON public.tareas(asignado_a_email);
