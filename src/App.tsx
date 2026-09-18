import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Cloud, 
  Download, 
  CheckCircle2, 
  Database, 
  Info, 
  ListFilter, 
  X, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { CheckpointCard } from './components/CheckpointCard';
import { SupervisorDictamen } from './components/SupervisorDictamen';
import { SupabaseCodePreview } from './components/SupabaseCodePreview';
import { SignatureModal } from './components/SignatureModal';
import { LightboxModal } from './components/LightboxModal';
import { JsonExportModal } from './components/JsonExportModal';
import { SupabaseMigrationModal } from './components/SupabaseMigrationModal';
import { AuthScreen } from './components/AuthScreen';

import { 
  loadEdificiosFromSupabase, 
  loadUsuariosFromSupabase, 
  loadRecorridosFromSupabase, 
  loadTareasFromSupabase, 
  loadAutomatizacionesFromSupabase,
  updateUsuarioInSupabase,
  deleteUsuarioFromSupabase,
  registerUserInSupabase,
  changeUserPasswordInSupabase,
  createEdificioInSupabase,
  updateEdificioInSupabase,
  deleteEdificioFromSupabase
} from './lib/supabaseClient';

import { DashboardView } from './components/views/DashboardView';
import { RecorridosView } from './components/views/RecorridosView';
import { RecorridoDetalleView } from './components/views/RecorridoDetalleView';
import { TareasView } from './components/views/TareasView';
import { AutomatizacionesView } from './components/views/AutomatizacionesView';
import { ReportesView } from './components/views/ReportesView';
import { EdificiosView } from './components/views/EdificiosView';
import { UsuariosView } from './components/views/UsuariosView';

import { initialAuditData } from './data/auditData';
import { 
  initialEdificios, 
  initialUsuarios, 
  initialRecorridos, 
  initialTareas, 
  initialAutomatizaciones 
} from './data/initialData';
import { 
  NavScreen, 
  DictamenFormState, 
  Recorrido, 
  RecorridoProgramado,
  Tarea, 
  TareaAutomatica, 
  Edificio, 
  Usuario 
} from './types';

export default function App() {
  // Main Navigation & Entity Stores
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('recorrido_cierre');
  const [selectedEdificioId, setSelectedEdificioId] = useState<string>('');
  const [activeRecorrido, setActiveRecorrido] = useState<Recorrido>(initialRecorridos[0]);

  const [edificios, setEdificios] = useState<Edificio[]>(initialEdificios);
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  
  // Authentication session persistence in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('eazyops_authenticated') === 'true';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('eazyops_user_id') || 'USR-000004';
  });
  const [cachedUser, setCachedUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('eazyops_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const defaultFallbackUser: Usuario = {
    id_usuario: currentUserId || 'USR-000001',
    nombre: 'Super Administrador',
    email: 'superadmin@eazyops.com',
    rol: 'SuperAdmin',
    activo: true,
    usuario_login: 'superadmin',
  };

  const currentUser: Usuario =
    usuarios.find((u) => u.id_usuario === currentUserId) ||
    (cachedUser && cachedUser.id_usuario === currentUserId ? cachedUser : null) ||
    usuarios[0] ||
    cachedUser ||
    defaultFallbackUser;

  const isSuperAdmin = currentUser?.rol === 'SuperAdmin';
  const [recorridos, setRecorridos] = useState<Recorrido[]>(initialRecorridos);
  const [tareas, setTareas] = useState<Tarea[]>(initialTareas);
  const [automatizaciones, setAutomatizaciones] = useState<TareaAutomatica[]>(initialAutomatizaciones);
  const [recorridosProgramados, setRecorridosProgramados] = useState<RecorridoProgramado[]>(() => {
    try {
      const saved = localStorage.getItem('eazyops_recorridos_programados');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);
  const [supabaseLoaded, setSupabaseLoaded] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem('eazyops_authenticated');
    localStorage.removeItem('eazyops_user_id');
    localStorage.removeItem('eazyops_user_profile');
    setCachedUser(null);
    setIsAuthenticated(false);
    showToast('Has cerrado sesión correctamente.');
  };

  // Carga automática en vivo desde Supabase
  const fetchLiveSupabaseData = async (silent = false) => {
    setIsSyncingSupabase(true);
    try {
      const [resEdificios, resUsuarios, resRecorridos, resTareas, resAuto] = await Promise.all([
        loadEdificiosFromSupabase(),
        loadUsuariosFromSupabase(),
        loadRecorridosFromSupabase(),
        loadTareasFromSupabase(),
        loadAutomatizacionesFromSupabase(),
      ]);

      let loadedEdificios = 0;
      if (resEdificios.data && resEdificios.data.length > 0) {
        setEdificios(resEdificios.data);
        loadedEdificios = resEdificios.data.length;
      }
      if (resUsuarios.data && resUsuarios.data.length > 0) {
        setUsuarios(resUsuarios.data);
        // Si el usuario actual no existe en Supabase, asignar el primero con rol SuperAdmin o el primer registro
        if (!resUsuarios.data.some((u) => u.id_usuario === currentUserId)) {
          const adminUser = resUsuarios.data.find((u) => u.rol === 'SuperAdmin') || resUsuarios.data[0];
          setCurrentUserId(adminUser.id_usuario);
        }
      }
      if (resRecorridos.data && resRecorridos.data.length > 0) {
        setRecorridos(resRecorridos.data);
        setActiveRecorrido(resRecorridos.data[0]);
      }
      if (resTareas.data && resTareas.data.length > 0) {
        setTareas(resTareas.data);
      }
      if (resAuto.data && resAuto.data.length > 0) {
        setAutomatizaciones(resAuto.data);
      }

      if (loadedEdificios > 0) {
        setSupabaseLoaded(true);
        if (!silent) {
          showToast(`¡Sincronización exitosa! ${loadedEdificios} edificios y ${resUsuarios.data?.length || 0} usuarios cargados desde Supabase.`);
        }
      } else if (!silent) {
        showToast('Supabase conectado pero la tabla no devolvió registros.');
      }
    } catch (err: any) {
      console.warn('Error al cargar datos de Supabase:', err);
      if (!silent) {
        showToast('Aviso de conexión: no se pudieron obtener datos remotos.');
      }
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  useEffect(() => {
    fetchLiveSupabaseData(false);
  }, []);

  // Active filters for navigation from KPI cards (GAS style)
  const [recorridosFilterStatus, setRecorridosFilterStatus] = useState<string>('');
  const [tareasFilterEstado, setTareasFilterEstado] = useState<string>('');
  const [tareasFilterEdificio, setTareasFilterEdificio] = useState<string>('');
  const [tareasFilterVencidas, setTareasFilterVencidas] = useState<boolean>(false);

  // Initial Previsualización y Cierre de Recorrido audit data
  const [auditData, setAuditData] = useState(initialAuditData);
  const [formState, setFormState] = useState<DictamenFormState>({
    rating: 4.0,
    tipoCierre: 'conforme_obs',
    dictamenTexto:
      'El recorrido en Torre Roble concluye con 75% de cumplimiento estricto. Se verificó el reemplazo del extintor en Piso 7. Se aprueba pase provisional condicionado a la sustitución de la batería de emergencia en Piso 4 antes de 48 horas laborales.',
    notifyPdfInSupabase: true,
    generateWebhook: true,
  });

  // Modals
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<{
    url: string;
    title: string;
    filename: string;
    metadata?: string;
    size?: string;
  } | null>(null);

  // Sealed status
  const [isSealed, setIsSealed] = useState(false);
  const [sealedAt, setSealedAt] = useState<string | undefined>(undefined);
  const [signatureData, setSignatureData] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const handleFormChange = (updates: Partial<DictamenFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleConfirmSeal = async (sigData: string) => {
    // Simulate Supabase PostgreSQL latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    const nowIso = new Date().toISOString();
    setIsSealed(true);
    setSealedAt(nowIso);
    setSignatureData(sigData);
    setAuditData((prev) => ({
      ...prev,
      status: 'finalizado',
      statusLabel: 'Auditoría Finalizada y Sellada',
    }));

    // Also update in recorridos list
    setRecorridos((prev) =>
      prev.map((r) =>
        r.id_recorrido === auditData.code || r.id_recorrido === 'REC-2024-089'
          ? {
              ...r,
              estado: 'Completado',
              comentario_cierre: formState.dictamenTexto,
              calificacion_cierre: formState.rating,
              resultado_cierre: 'Satisfactorio con Observaciones',
            }
          : r
      )
    );

    showToast(`¡Auditoría ${auditData.code} Sellada con Éxito en Supabase!`);
  };

  const handleResetAudit = () => {
    setIsSealed(false);
    setSealedAt(undefined);
    setSignatureData(undefined);
    setAuditData(initialAuditData);
  };

  // Entity Handlers
  const handleCreateRecorrido = (nuevo: Partial<Recorrido>) => {
    const nextId = `REC-2024-0${recorridos.length + 90}`;
    const item: Recorrido = {
      id_recorrido: nextId,
      nombre: nuevo.nombre || 'Nuevo Recorrido',
      id_edificio: nuevo.id_edificio || edificios[0]?.id_edificio,
      edificio_nombre: nuevo.edificio_nombre,
      fecha_programada: nuevo.fecha_programada || new Date().toISOString(),
      fecha_cierre_programada: nuevo.fecha_cierre_programada,
      cierre_automatico: nuevo.cierre_automatico ?? true,
      inspector_email: nuevo.inspector_email || 'carlos.mendez@eazyops.gt',
      inspector_nombre: nuevo.inspector_nombre || 'Ing. Carlos Mendez',
      estado: 'Programado',
      observaciones: nuevo.observaciones,
      creado_por: 'carlos.mendez@eazyops.gt',
      checkpoints_count: 8,
      hallazgos_count: 0,
    };

    setRecorridos([item, ...recorridos]);
    showToast(`Recorrido ${nextId} registrado en Supabase.`);
  };

  const handleCreateTarea = (nueva: Partial<Tarea>) => {
    const nextId = `TAR-000${tareas.length + 105}`;
    const item: Tarea = {
      id_tarea: nextId,
      id_edificio: nueva.id_edificio || edificios[0]?.id_edificio,
      edificio_nombre: nueva.edificio_nombre,
      tipo_origen: nueva.tipo_origen || 'Manual',
      asignado_a_email: nueva.asignado_a_email || '',
      asignado_a_nombre: nueva.asignado_a_nombre || 'Sin nombre',
      asignado_a_rol: nueva.asignado_a_rol || 'Técnico',
      titulo_tarea: nueva.titulo_tarea || 'Nueva Tarea',
      instrucciones: nueva.instrucciones || '',
      prioridad: nueva.prioridad || 'Media',
      fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' '),
      fecha_limite: nueva.fecha_limite,
      creado_por: 'carlos.mendez@eazyops.gt',
      estado_tarea: 'Pendiente',
    };

    setTareas([item, ...tareas]);
    showToast(`Tarea ${nextId} creada correctamente en Supabase.`);
  };

  const handleUpdateTarea = (id: string, updates: Partial<Tarea>) => {
    setTareas((prev) =>
      prev.map((t) => (t.id_tarea === id ? { ...t, ...updates } : t))
    );
    showToast(`Tarea ${id} actualizada.`);
  };

  const handleCreateLoteMasivo = (lote: {
    titulo: string;
    prioridad: any;
    fecha_limite: string;
    instrucciones: string;
    edificios: string[];
  }) => {
    const nuevasTareas: Tarea[] = lote.edificios.map((edId, index) => {
      const bld = edificios.find((b) => b.id_edificio === edId);
      const nextNum = tareas.length + 110 + index;
      return {
        id_tarea: `TAR-000${nextNum}`,
        id_edificio: edId,
        edificio_nombre: bld?.nombre,
        tipo_origen: 'Masiva',
        asignado_a_email: 'juan.mantenimiento@eazyops.gt',
        asignado_a_nombre: 'Juan Mantenimiento',
        titulo_tarea: lote.titulo,
        instrucciones: lote.instrucciones,
        prioridad: lote.prioridad,
        fecha_creacion: new Date().toISOString().slice(0, 19).replace('T', ' '),
        fecha_limite: lote.fecha_limite,
        creado_por: 'carlos.mendez@eazyops.gt',
        estado_tarea: 'Pendiente',
      };
    });

    setTareas([...nuevasTareas, ...tareas]);
    showToast(`Lote masivo de ${nuevasTareas.length} tareas creado en Supabase.`);
  };

  const handleCreateAutomatizacion = (nueva: Partial<TareaAutomatica>) => {
    const nextId = `AUT-00000${automatizaciones.length + 3}`;
    const item: TareaAutomatica = {
      id_automatizacion: nextId,
      creado_por_email: 'carlos.mendez@eazyops.gt',
      asignado_a_email: nueva.asignado_a_email || '',
      asignado_a_nombre: nueva.asignado_a_nombre || '',
      id_edificio: nueva.id_edificio || edificios[0]?.id_edificio,
      edificio_nombre: nueva.edificio_nombre,
      titulo: nueva.titulo || 'Nueva Automatización',
      instrucciones: nueva.instrucciones,
      prioridad: nueva.prioridad || 'Media',
      frecuencia: nueva.frecuencia || 'Semanal',
      hora: nueva.hora || '08:00',
      fecha_inicio: nueva.fecha_inicio || new Date().toISOString().slice(0, 10),
      proxima_ejecucion: nueva.proxima_ejecucion,
      activo: true,
    };

    setAutomatizaciones([item, ...automatizaciones]);
    showToast(`Cron Job ${nextId} registrado en Supabase.`);
  };

  const handleToggleAutoActive = (id: string) => {
    setAutomatizaciones((prev) =>
      prev.map((a) => (a.id_automatizacion === id ? { ...a, activo: !a.activo } : a))
    );
  };

  const handleDeleteAuto = (id: string) => {
    setAutomatizaciones((prev) => prev.filter((a) => a.id_automatizacion !== id));
    showToast('Automatización eliminada.');
  };

  const handleCreateEdificio = async (nuevo: { nombre: string; direccion: string; id_administrador?: string; administrador_actual?: string }) => {
    const nextId = `EDI-${String(Date.now()).slice(-6)}`;
    const admin = usuarios.find((u) => u.id_usuario === nuevo.id_administrador);
    const item: Edificio = {
      id_edificio: nextId,
      nombre: nuevo.nombre,
      direccion: nuevo.direccion,
      activo: true,
      id_administrador_actual: nuevo.id_administrador,
      administrador_actual: nuevo.administrador_actual || admin?.nombre || 'Sin Administrador',
    };
    setEdificios([...edificios, item]);
    showToast(`Guardando edificio en Supabase...`);
    try {
      const res = await createEdificioInSupabase(item);
      if (res.ok) {
        showToast(`Edificio ${nuevo.nombre} guardado en Supabase.`);
      } else {
        showToast(`Aviso Supabase: ${res.message}`);
      }
    } catch (e: any) {
      console.warn(e);
    }
  };

  const handleUpdateEdificio = async (id: string, updates: Partial<Edificio>) => {
    setEdificios((prev) =>
      prev.map((e) => (e.id_edificio === id ? { ...e, ...updates } : e))
    );
    showToast(`Actualizando edificio en Supabase...`);
    try {
      const res = await updateEdificioInSupabase(id, updates);
      if (res.ok) {
        showToast(`Edificio actualizado en Supabase.`);
      } else {
        showToast(`Aviso Supabase: ${res.message}`);
      }
    } catch (e: any) {
      console.warn(e);
    }
  };

  const handleDeleteEdificio = async (id: string) => {
    const vict = edificios.find((e) => e.id_edificio === id);
    setEdificios((prev) => prev.filter((e) => e.id_edificio !== id));
    showToast(`Eliminando edificio de Supabase...`);
    try {
      const res = await deleteEdificioFromSupabase(id);
      if (res.ok) {
        showToast(`Edificio ${vict?.nombre || id} eliminado de Supabase.`);
      } else {
        showToast(`Aviso Supabase: ${res.message}`);
      }
    } catch (e: any) {
      console.warn(e);
    }
  };

  const handleToggleEdificio = async (id: string) => {
    const ed = edificios.find((e) => e.id_edificio === id);
    if (!ed) return;
    const newActivo = !ed.activo;
    setEdificios((prev) =>
      prev.map((e) => (e.id_edificio === id ? { ...e, activo: newActivo } : e))
    );
    try {
      await updateEdificioInSupabase(id, { activo: newActivo });
      showToast(`Edificio ${ed.nombre} ${newActivo ? 'habilitado' : 'inhabilitado'} en Supabase.`);
    } catch (e: any) {
      console.warn(e);
    }
  };

  const handleCreateUsuario = async (nuevo: Partial<Usuario>) => {
    const nextId = `USR-${String(usuarios.length + 1).padStart(6, '0')}`;
    const item: Usuario = {
      id_usuario: nextId,
      nombre: nuevo.nombre || '',
      email: nuevo.email || '',
      rol: nuevo.rol || 'Administrador',
      usuario_login: nuevo.usuario_login || '',
      activo: true,
      edificios: nuevo.edificios,
    };
    setUsuarios((prev) => [...prev, item]);
    showToast(`Registrando ${nuevo.nombre} en Supabase...`);

    try {
      const res = await registerUserInSupabase({
        nombre: item.nombre,
        email: item.email,
        rol: item.rol,
        usuario_login: item.usuario_login,
      });
      if (res.ok && res.user) {
        setUsuarios((prev) =>
          prev.map((u) => (u.id_usuario === nextId ? res.user! : u))
        );
        showToast(`Usuario ${item.nombre} guardado en Supabase.`);
      }
    } catch (err: any) {
      console.warn('Error al persistir usuario en Supabase:', err);
    }
  };

  const handleUpdateUsuario = async (id: string, updates: Partial<Usuario>) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id_usuario === id ? { ...u, ...updates } : u))
    );
    showToast(`Guardando cambios de usuario en Supabase...`);
    try {
      const res = await updateUsuarioInSupabase(id, updates);
      if (res.ok) {
        showToast(`¡Usuario ${updates.nombre || id} actualizado en Supabase!`);
      } else {
        showToast(`Aviso Supabase: ${res.message}`);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleDeleteUsuario = async (id: string) => {
    if (id === currentUserId) {
      showToast('No puedes eliminar tu propio usuario en sesión activa.');
      return;
    }
    const victim = usuarios.find((u) => u.id_usuario === id);
    setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id));
    showToast(`Eliminando usuario de Supabase...`);
    try {
      const res = await deleteUsuarioFromSupabase(id);
      if (res.ok) {
        showToast(`Usuario ${victim?.nombre || id} eliminado de Supabase.`);
      } else {
        showToast(`Aviso Supabase: ${res.message}`);
      }
    } catch (err: any) {
      console.warn(err);
    }
  };

  const handleToggleUsuario = async (id: string) => {
    const user = usuarios.find((u) => u.id_usuario === id);
    if (!user) return;
    const newActivo = !user.activo;
    setUsuarios((prev) =>
      prev.map((u) => (u.id_usuario === id ? { ...u, activo: newActivo } : u))
    );
    try {
      await updateUsuarioInSupabase(id, { activo: newActivo });
      showToast(`Usuario ${user.nombre} ${newActivo ? 'habilitado' : 'inhabilitado'} en Supabase.`);
    } catch (e: any) {
      console.warn(e);
    }
  };

  const handleChangePassword = async (idOrEmail: string, newPass: string) => {
    try {
      const res = await changeUserPasswordInSupabase(idOrEmail, newPass);
      if (res.ok) {
        showToast(res.message);
      } else {
        showToast(`Error Supabase: ${res.message}`);
      }
      return res;
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Error al conectar con Supabase' };
    }
  };

  // Handlers para Recorridos Programados (Automatizaciones)
  const handleCreateRecorridoProgramado = (nuevo: Partial<RecorridoProgramado>) => {
    const nextId = `PROG-${String(Date.now()).slice(-6)}`;
    const nuevoRec: RecorridoProgramado = {
      id_programacion: nextId,
      nombre: nuevo.nombre || 'Recorrido Periódico',
      id_edificio: nuevo.id_edificio || edificios[0]?.id_edificio || '',
      edificio_nombre: nuevo.edificio_nombre || '',
      frecuencia: nuevo.frecuencia || 'Semanal',
      hora: nuevo.hora || '09:00',
      dia_semana: nuevo.dia_semana ?? 1,
      dia_mes: nuevo.dia_mes ?? 1,
      inspector_email: nuevo.inspector_email || usuarios[0]?.email || '',
      inspector_nombre: nuevo.inspector_nombre || usuarios[0]?.nombre || '',
      proxima_generacion: nuevo.proxima_generacion || new Date(Date.now() + 86400000 * 7).toISOString(),
      activo: true,
      creado_por: currentUser?.email || 'superadmin@eazyops.com',
      checkpoints_base: nuevo.checkpoints_base || 8,
    };
    const updated = [nuevoRec, ...recorridosProgramados];
    setRecorridosProgramados(updated);
    try {
      localStorage.setItem('eazyops_recorridos_programados', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Programación de recorrido ${nuevoRec.nombre} creada exitosamente.`);
  };

  const handleToggleRecorridoProgramado = (id: string) => {
    const updated = recorridosProgramados.map((r) =>
      r.id_programacion === id ? { ...r, activo: !r.activo } : r
    );
    setRecorridosProgramados(updated);
    try {
      localStorage.setItem('eazyops_recorridos_programados', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Estado de programación de recorrido actualizado.`);
  };

  const handleDeleteRecorridoProgramado = (id: string) => {
    const updated = recorridosProgramados.filter((r) => r.id_programacion !== id);
    setRecorridosProgramados(updated);
    try {
      localStorage.setItem('eazyops_recorridos_programados', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    showToast(`Programación de recorrido eliminada.`);
  };

  const pendingTasksCount = tareas.filter((t) => t.estado_tarea === 'Pendiente').length;

  // Si el usuario no ha iniciado sesión, mostrar estrictamente la pantalla de Login
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLoginSuccess={(loggedUser) => {
          setCurrentUserId(loggedUser.id_usuario);
          setIsAuthenticated(true);
          localStorage.setItem('eazyops_authenticated', 'true');
          localStorage.setItem('eazyops_user_id', loggedUser.id_usuario);
          localStorage.setItem('eazyops_user_profile', JSON.stringify(loggedUser));
          setCachedUser(loggedUser);
          setUsuarios((prev) => {
            if (prev.some((u) => u.id_usuario === loggedUser.id_usuario)) return prev;
            return [loggedUser, ...prev];
          });
          showToast(`¡Bienvenido! Sesión iniciada como ${loggedUser.nombre} (${loggedUser.rol})`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      {/* Fixed Header with Role and Profile Switcher */}
      <Header
        currentUser={currentUser}
        usuarios={usuarios}
        onSelectUser={(u) => {
          setCurrentUserId(u.id_usuario);
          localStorage.setItem('eazyops_user_id', u.id_usuario);
          localStorage.setItem('eazyops_user_profile', JSON.stringify(u));
          setCachedUser(u);
          // If switching away from SuperAdmin while on 'usuarios' screen, redirect to dashboard
          if (u.rol !== 'SuperAdmin' && currentScreen === 'usuarios') {
            setCurrentScreen('dashboard');
          }
          // If switching to Mantenimiento while on recorridos/reportes, redirect to tareas
          if (u.rol === 'Mantenimiento' && (currentScreen === 'recorridos' || currentScreen === 'reportes' || currentScreen === 'recorrido_cierre' || currentScreen === 'recorrido_detalle')) {
            setCurrentScreen('tareas');
          }
          showToast(`Perfil activo: ${u.nombre} (${u.rol})`);
        }}
        onOpenMigrationModal={() => {
          if (isSuperAdmin) {
            setIsMigrationModalOpen(true);
          } else {
            showToast('Acceso restringido: Solo el perfil SuperAdmin puede acceder al diagnóstico y reparación de BD.');
          }
        }}
        isSuperAdmin={isSuperAdmin}
        onSyncSupabase={() => fetchLiveSupabaseData(false)}
        isSyncing={isSyncingSupabase}
        supabaseCount={{
          edificios: edificios.length,
          tareas: tareas.length,
          usuarios: usuarios.length,
        }}
        onLogout={handleLogout}
      />

      {/* Fixed Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        pendingTasksCount={pendingTasksCount}
        onOpenMigrationModal={() => {
          if (isSuperAdmin) {
            setIsMigrationModalOpen(true);
          }
        }}
        isSuperAdmin={isSuperAdmin}
        userRole={currentUser?.rol || 'Administrador'}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="pl-0 md:pl-64 pt-16 min-h-screen flex flex-col">
        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {/* 1. Dashboard View */}
          {currentScreen === 'dashboard' && (
            <DashboardView
              edificios={edificios}
              selectedEdificioId={selectedEdificioId}
              onSelectEdificio={setSelectedEdificioId}
              recorridos={recorridos}
              tareas={tareas}
              onNavigateToScreen={(scr, filterState) => {
                if (scr === 'recorridos') {
                  setRecorridosFilterStatus(filterState?.estado || '');
                  setCurrentScreen('recorridos');
                } else if (scr === 'tareas') {
                  setTareasFilterEstado(filterState?.estado || '');
                  setTareasFilterEdificio(filterState?.edificioId || '');
                  setTareasFilterVencidas(filterState?.filter === 'vencidas');
                  setCurrentScreen('tareas');
                } else if (scr === 'recorrido_cierre') {
                  setCurrentScreen('recorrido_cierre');
                } else if (scr === 'recorrido_detalle') {
                  const target = recorridos.find((r) => r.id_recorrido === filterState?.recorridoId) || recorridos[0];
                  setActiveRecorrido(target);
                  setCurrentScreen('recorrido_detalle');
                }
              }}
              onOpenMigrationModal={() => {
                if (isSuperAdmin) {
                  setIsMigrationModalOpen(true);
                }
              }}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          {/* 2. Recorridos View */}
          {currentScreen === 'recorridos' && (
            <RecorridosView
              recorridos={recorridos}
              edificios={edificios}
              usuarios={usuarios}
              initialFilterStatus={recorridosFilterStatus}
              onOpenRecorrido={(rec) => {
                setActiveRecorrido(rec);
                if (rec.id_recorrido === 'REC-2024-089') {
                  setCurrentScreen('recorrido_cierre');
                } else {
                  setCurrentScreen('recorrido_detalle');
                }
              }}
              onCreateRecorrido={handleCreateRecorrido}
            />
          )}

          {/* 3. Recorrido Detalle View */}
          {currentScreen === 'recorrido_detalle' && (
            <RecorridoDetalleView
              recorrido={activeRecorrido}
              onBack={() => setCurrentScreen('recorridos')}
              onGoToClosure={() => setCurrentScreen('recorrido_cierre')}
              onStartRecorrido={(id) => {
                setRecorridos((prev) =>
                  prev.map((r) => (r.id_recorrido === id ? { ...r, estado: 'En Proceso' } : r))
                );
                setActiveRecorrido((prev) => ({ ...prev, estado: 'En Proceso' }));
                showToast(`Recorrido ${id} marcado En Proceso.`);
              }}
            />
          )}

          {/* 4. Previsualización y Cierre de Recorrido (Initial High-Fidelity Screen) */}
          {currentScreen === 'recorrido_cierre' && (
            <div className="flex flex-col w-full pb-16">
              {/* Sub-header Breadcrumb / Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-2 mb-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setCurrentScreen('recorridos')}
                    type="button"
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e5eeff] hover:bg-[#d3e4fe] transition-all text-[#0b1c30] text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#0051d5] group-hover:-translate-x-0.5 transition-transform" />
                    <span>Volver a Recorridos</span>
                  </button>

                  <span className="text-[#c5c6cd]">/</span>
                  <span className="text-xs uppercase tracking-wider text-[#64748b] font-medium">
                    Auditorías Activas
                  </span>
                  <span className="text-[#c5c6cd]">/</span>
                  <span className="text-xs font-bold text-[#0051d5] font-mono">
                    {auditData.code}
                  </span>
                </div>

                {/* Live Sync Pill */}
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsMigrationModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#e5eeff] shadow-sm hover:border-[#bfdbfe] cursor-pointer transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#069669]" />
                  <span className="text-xs text-[#0b1c30]">
                    Supabase Edge Sync:{' '}
                    <span className="text-[#069669] font-semibold">
                      Realtime Activo
                    </span>
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#069669] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#069669]"></span>
                  </span>
                </div>
              </div>

              {/* High Contrast Header Section */}
              <div className="relative overflow-hidden rounded-2xl bg-[#111c2e] text-white p-6 sm:p-7 mb-6 shadow-md border border-[#213145]">
                <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-[#0051d5] opacity-20 blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="flex flex-col gap-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {isSealed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#069669]/20 text-[#85f8c4] text-xs font-bold border border-[#069669]/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#85f8c4]" />
                          Auditoría Sellada en PostgreSQL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium backdrop-blur-sm">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          En Proceso de Firma
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsMigrationModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#85f8c4] text-[#002114] text-xs font-semibold hover:bg-[#a7f3d0] transition-colors"
                      >
                        <Database className="w-3.5 h-3.5 text-[#069669]" />
                        Supabase Storage &amp; DB Connected
                      </button>

                      <span className="text-xs text-[#bcc7df] font-mono">
                        ID: {auditData.id}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-snug">
                      {auditData.title}
                    </h1>

                    <p className="text-xs sm:text-sm text-[#bcc7df] leading-relaxed">
                      {auditData.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsJsonModalOpen(true)}
                      className="px-3.5 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-xs font-semibold flex items-center gap-2 border border-white/10"
                    >
                      <Download className="w-4 h-4" />
                      Exportar JSON
                    </button>

                    <button
                      type="button"
                      id="btnOpenSignatureModal"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                        isSealed
                          ? 'bg-[#069669] text-white hover:bg-[#057a55]'
                          : 'bg-[#0051d5] text-white hover:bg-[#0041ab] active:scale-[0.99]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isSealed ? 'Ver Acta Sellada' : 'Confirmar y Finalizar Auditoría'}
                    </button>

                    {isSealed && (
                      <button
                        type="button"
                        onClick={handleResetAudit}
                        title="Reiniciar estado de prueba"
                        className="p-2 rounded-lg bg-white/10 text-[#bcc7df] hover:text-white hover:bg-white/20 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4 KPI Metrics */}
              <MetricCards stats={auditData.stats} />

              {/* Non-blocking Alert Banner */}
              <div className="rounded-xl bg-white border border-[#e5eeff] p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e5eeff] text-[#0051d5] flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-[#0b1c30]">
                        {auditData.pendingAlert.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#45474c] text-[11px] font-semibold">
                        {auditData.pendingAlert.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">
                      {auditData.pendingAlert.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 pl-12 sm:pl-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formState.generateWebhook}
                      onChange={(e) =>
                        handleFormChange({ generateWebhook: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#0051d5] rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#0b1c30]">
                      Generar webhook en Postgres
                    </span>
                  </label>
                </div>
              </div>

              {/* 12-Column Grid Layout: Checkpoints & Evidences (8 cols) vs Evaluation (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Workspace: Checkpoints & Evidences (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#e5eeff] text-[#0051d5] flex items-center justify-center">
                        <ListFilter className="w-4 h-4" />
                      </div>
                      <h2 className="font-bold text-base sm:text-lg text-[#0b1c30]">
                        Registro de Checkpoints y Evidencias Multimedia
                      </h2>
                    </div>
                    <span className="text-xs text-[#64748b]">
                      Bucket:{' '}
                      <code className="px-1.5 py-0.5 bg-[#eff4ff] border border-[#d3e4fe] rounded text-[#0051d5] font-mono text-[11px]">
                        walkthrough-photos
                      </code>
                    </span>
                  </div>

                  {/* List of Checkpoints */}
                  <div className="flex flex-col gap-3.5">
                    {auditData.checkpoints.map((checkpoint) => (
                      <CheckpointCard
                        key={checkpoint.id}
                        checkpoint={checkpoint}
                        onViewImage={(img) => setActiveLightboxImage(img)}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Column: Supervisor Dictamen & Supabase Code Preview (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <SupervisorDictamen
                    formState={formState}
                    onChange={handleFormChange}
                    onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
                    isSealed={isSealed}
                  />

                  <SupabaseCodePreview
                    recorridoId={auditData.id}
                    formState={formState}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Tareas View */}
          {currentScreen === 'tareas' && (
            <TareasView
              tareas={tareas}
              edificios={edificios}
              usuarios={usuarios}
              onCreateTarea={handleCreateTarea}
              onUpdateTarea={handleUpdateTarea}
              onCreateLoteMasivo={handleCreateLoteMasivo}
              initialFilterEstado={tareasFilterEstado}
              initialFilterEdificio={tareasFilterEdificio}
              initialFilterVencidas={tareasFilterVencidas}
            />
          )}

          {/* 6. Automatizaciones View */}
          {currentScreen === 'automatizaciones' && (
            <AutomatizacionesView
              automatizaciones={automatizaciones}
              recorridosProgramados={recorridosProgramados}
              edificios={edificios}
              usuarios={usuarios}
              onCreateAutomatizacion={handleCreateAutomatizacion}
              onToggleActive={handleToggleAutoActive}
              onDelete={handleDeleteAuto}
              onCreateRecorridoProgramado={handleCreateRecorridoProgramado}
              onToggleRecorridoProgramado={handleToggleRecorridoProgramado}
              onDeleteRecorridoProgramado={handleDeleteRecorridoProgramado}
            />
          )}

          {/* 7. Reportes View */}
          {currentScreen === 'reportes' && (
            <ReportesView
              edificios={edificios}
              recorridos={recorridos}
              tareas={tareas}
            />
          )}

          {/* 8. Edificios View */}
          {currentScreen === 'edificios' && (
            <EdificiosView
              edificios={edificios}
              usuarios={usuarios}
              isSuperAdmin={isSuperAdmin}
              onCreateEdificio={handleCreateEdificio}
              onUpdateEdificio={handleUpdateEdificio}
              onDeleteEdificio={handleDeleteEdificio}
              onToggleActive={handleToggleEdificio}
            />
          )}

          {/* 9. Usuarios View (Exclusivo SuperAdmin) */}
          {currentScreen === 'usuarios' && isSuperAdmin && (
            <UsuariosView
              usuarios={usuarios}
              edificios={edificios}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
              onCreateUsuario={handleCreateUsuario}
              onUpdateUsuario={handleUpdateUsuario}
              onDeleteUsuario={handleDeleteUsuario}
              onToggleActive={handleToggleUsuario}
              onChangePassword={handleChangePassword}
            />
          )}
        </main>
      </div>

      {/* Supabase Migration Modal - Restricted to SuperAdmin */}
      <SupabaseMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        isSuperAdmin={isSuperAdmin}
        onDataMigrated={() => fetchLiveSupabaseData(false)}
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        auditCode={auditData.code}
        auditLocation={auditData.location}
        supervisorLicense={auditData.supervisorLicense}
        onConfirmSeal={handleConfirmSeal}
      />

      {/* Lightbox Modal */}
      <LightboxModal
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />

      {/* JSON Export Modal */}
      <JsonExportModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        audit={auditData}
        formState={formState}
        isSealed={isSealed}
        sealedAt={sealedAt}
        signatureData={signatureData}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#111c2e] text-white p-4 shadow-2xl flex items-center gap-3.5 border border-[#213145] animate-in slide-in-from-bottom duration-300 max-w-md">
          <div className="w-9 h-9 rounded-full bg-[#069669] flex items-center justify-center text-white shrink-0 shadow">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col pr-2">
            <span className="font-bold text-xs sm:text-sm text-white">{toastMessage}</span>
            <span className="text-[11px] text-[#bcc7df] mt-0.5">
              Transacción confirmada en Supabase PostgreSQL
            </span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#bcc7df] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
