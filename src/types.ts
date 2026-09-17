export type UserRole = 'SuperAdmin' | 'Administrador' | 'Supervisor' | 'Mantenimiento';

export interface Usuario {
  id_usuario: string;
  nombre: string;
  email: string;
  rol: UserRole;
  usuario_login: string;
  activo: boolean;
  edificios?: string[];
  id_administrador?: string;
}

export interface Edificio {
  id_edificio: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  id_administrador_actual?: string;
  administrador_actual?: string;
  conflicto_administradores?: boolean;
}

export type CheckpointStatus = 'conforme' | 'hallazgo_abierto' | 'hallazgo_resuelto';

export interface EvidenceFile {
  filename: string;
  bucket: string;
  displayUrl: string;
  imageUrl: string;
  size: string;
  hash?: string;
  typeTag: string;
  tokenExpires?: string;
  metadata?: string;
  isPublic?: boolean;
}

export interface ComparisonEvidence {
  before: {
    label: string;
    filename: string;
    size: string;
    imageUrl: string;
  };
  after: {
    label: string;
    filename: string;
    size: string;
    imageUrl: string;
    seal: string;
  };
}

export interface CheckpointItem {
  id: string;
  number: string;
  title: string;
  status: CheckpointStatus;
  statusLabel: string;
  time: string;
  description: string;
  tag?: string;
  assignee?: string;
  severity?: string;
  evidence?: EvidenceFile;
  comparison?: ComparisonEvidence;
}

export type RecorridoEstado = 'Programado' | 'En Proceso' | 'Completado' | 'Cancelado';

export interface Recorrido {
  id_recorrido: string;
  nombre: string;
  id_edificio: string;
  edificio_nombre?: string;
  fecha_programada: string;
  fecha_cierre_programada?: string;
  cierre_automatico?: boolean;
  inspector_email: string;
  inspector_nombre?: string;
  estado: RecorridoEstado;
  observaciones?: string;
  creado_por: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  comentario_cierre?: string;
  calificacion_cierre?: number;
  tipo_cierre?: string;
  resultado_cierre?: string;
  checkpoints_count?: number;
  hallazgos_count?: number;
}

export type TareaPrioridad = 'Alta' | 'Media' | 'Baja';
export type TareaEstado = 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada';
export type TareaOrigen = 'Manual' | 'Hallazgo' | 'Automatica' | 'Masiva';

export interface Tarea {
  id_tarea: string;
  id_hallazgo?: string;
  id_edificio: string;
  edificio_nombre?: string;
  tipo_origen: TareaOrigen;
  id_automatizacion?: string;
  id_lote_masivo?: string;
  asignado_a_email: string;
  asignado_a_nombre?: string;
  asignado_a_rol?: string;
  titulo_tarea: string;
  instrucciones?: string;
  prioridad: TareaPrioridad;
  departamento?: string;
  fecha_creacion: string;
  fecha_limite?: string;
  fecha_inicio?: string;
  fecha_resolucion?: string;
  creado_por: string;
  estado_tarea: TareaEstado;
  observaciones_cierre?: string;
  foto_evidencia_cierre?: string;
  tiempo_total_minutos?: number;
  resultado_cumplimiento?: string;
}

export interface TareaAutomatica {
  id_automatizacion: string;
  creado_por_email: string;
  asignado_a_email: string;
  asignado_a_nombre?: string;
  id_edificio: string;
  edificio_nombre?: string;
  titulo: string;
  instrucciones?: string;
  prioridad: TareaPrioridad;
  frecuencia: 'Diaria' | 'Semanal' | 'Mensual';
  dia_semana?: number;
  dia_mes?: number;
  hora: string;
  fecha_inicio: string;
  fecha_fin?: string;
  proxima_ejecucion?: string;
  ultima_ejecucion?: string;
  activo: boolean;
}

export interface DashboardMetrics {
  totalEdificios: number;
  recorridosTotales: number;
  recorridosProgramados: number;
  recorridosEnProceso: number;
  recorridosCompletados: number;
  recorridosCancelados: number;
  hallazgosTotales: number;
  hallazgosConformes: number;
  hallazgosAbiertos: number;
  hallazgosCerrados: number;
  tareasTotales: number;
  tareasPendientes: number;
  tareasEnProceso: number;
  tareasResueltas: number;
  tareasVencidas: number;
  automaticasActivas: number;
  administradoresAsignados: number;
}

export interface AuditStats {
  totalCheckpoints: number;
  completedCheckpoints: number;
  coveragePercent: number;
  conformingCount: number;
  conformingPercent: number;
  activeFindingsCount: number;
  minorFindings: number;
  majorFindings: number;
  correctiveActionsCount: number;
  resolvedActions: number;
  pendingActions: number;
}

export interface AuditData {
  id: string;
  code: string;
  title: string;
  location: string;
  id_edificio?: string;
  supervisorName: string;
  supervisorRole: string;
  supervisorLicense: string;
  description: string;
  status: 'en_proceso' | 'finalizado';
  statusLabel: string;
  stats: AuditStats;
  checkpoints: CheckpointItem[];
  pendingAlert: {
    title: string;
    badge: string;
    description: string;
  };
}

export type TipoCierre = 'conforme_obs' | 'conforme_pleno' | 'no_conforme';

export interface DictamenFormState {
  rating: number;
  tipoCierre: TipoCierre;
  dictamenTexto: string;
  notifyPdfInSupabase: boolean;
  generateWebhook: boolean;
}

export type NavScreen = 
  | 'dashboard' 
  | 'tareas' 
  | 'recorridos' 
  | 'recorrido_detalle'
  | 'recorrido_cierre'
  | 'automatizaciones' 
  | 'reportes' 
  | 'edificios' 
  | 'usuarios';
