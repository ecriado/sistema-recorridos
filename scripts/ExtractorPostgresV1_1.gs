/**************************************************************
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
  sql.push("BEGIN;\n");

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
    const match = String(v).match(/(\d{1,2}):(\d{2})(:(\d{2}))?/);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2];
      const s = match[4] || "00";
      return `'${h}:${m}:${s}'`;
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

    sql.push(`INSERT INTO usuarios (id, nombre, email, usuario_login, rol, activo, cambiar_password, intentos_fallidos, created_at)
VALUES ('${uuid}', ${esc(u.Nombre)}, ${esc(email)}, ${esc(login)}, '${rol}', ${sqlBool(u.Activo)}, ${sqlBool(u.Cambiar_Password)}, ${Number(u.Intentos_Fallidos) || 0}, NOW())
ON CONFLICT (email) DO NOTHING;`);
  });

  // 2. EDIFICIOS
  const edificios = leerHoja(CONFIG.SHEETS.EDIFICIOS);
  sql.push("\n-- 2. TABLA: EDIFICIOS");
  edificios.forEach(e => {
    const uuid = Utilities.getUuid();
    const oldId = String(e.ID_Edificio || "").trim();
    mapEdificios[oldId] = uuid;

    sql.push(`INSERT INTO edificios (id, codigo, nombre, direccion, activo, created_at)
VALUES ('${uuid}', ${esc(oldId)}, ${esc(e.Nombre)}, ${esc(e.Direccion)}, ${sqlBool(e.Activo)}, NOW());`);
  });

  // 3. USUARIO_EDIFICIOS
  const asignaciones = leerHoja(CONFIG.SHEETS.USUARIO_EDIFICIOS);
  sql.push("\n-- 3. TABLA: USUARIO_EDIFICIOS");
  asignaciones.forEach(a => {
    const uId = mapUsuarios[String(a.ID_Usuario).trim()];
    const eId = mapEdificios[String(a.ID_Edificio).trim()];
    if (uId && eId) {
      sql.push(`INSERT INTO usuario_edificios (id, usuario_id, edificio_id, activo, fecha_asignacion, fecha_finalizacion)
VALUES ('${Utilities.getUuid()}', '${uId}', '${eId}', ${sqlBool(a.Activo)}, ${sqlDate(a.Fecha_Asignacion)}, ${sqlDate(a.Fecha_Finalizacion)});`);
    }
  });

  // 4. JERARQUIA_USUARIOS
  const jerarquias = leerHoja(CONFIG.SHEETS.JERARQUIA_USUARIOS);
  sql.push("\n-- 4. TABLA: JERARQUIA_USUARIOS");
  jerarquias.forEach(j => {
    const adminId = mapUsuarios[String(j.ID_Administrador).trim()];
    const subId = mapUsuarios[String(j.ID_Subordinado).trim()];
    if (adminId && subId) {
      sql.push(`INSERT INTO jerarquia_usuarios (id, administrador_id, subordinado_id, activo, created_at)
VALUES ('${Utilities.getUuid()}', '${adminId}', '${subId}', ${sqlBool(j.Activo)}, ${sqlDate(j.Fecha_Asignacion)});`);
    }
  });

  // 5. CHECKPOINTS
  const checkpoints = leerHoja(CONFIG.SHEETS.CHECKPOINTS);
  sql.push("\n-- 5. TABLA: CHECKPOINTS");
  checkpoints.forEach(c => {
    const uuid = Utilities.getUuid();
    const oldId = String(c.ID_Checkpoint || "").trim();
    mapCheckpoints[oldId] = uuid;
    const eId = mapEdificios[String(c.ID_Edificio).trim()];

    if (eId) {
      sql.push(`INSERT INTO checkpoints (id, edificio_id, ubicacion, descripcion, orden, activo, created_at)
VALUES ('${uuid}', '${eId}', ${esc(c.Ubicacion)}, ${esc(c.Descripcion)}, ${Number(c.Orden) || 1}, ${sqlBool(c.Activo)}, NOW());`);
    }
  });

  // 6. RECORRIDOS
  const recorridos = leerHoja(CONFIG.SHEETS.RECORRIDOS);
  sql.push("\n-- 6. TABLA: RECORRIDOS");
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
      sql.push(`INSERT INTO recorridos (id, codigo, edificio_id, inspector_id, creado_por, fecha_programada, fecha_cierre_programada, cierre_automatico, estado, observaciones, fecha_inicio, fecha_fin, comentario_cierre, calificacion_cierre, tipo_cierre, resultado_cierre, created_at)
VALUES ('${uuid}', ${esc(oldId)}, '${eId}', '${inspId}', '${creadorId}', ${sqlDate(r.Fecha_Programada)}, ${sqlDate(r.Fecha_Cierre_Programada)}, ${sqlBool(r.Cierre_Automatico)}, '${estado}', ${esc(r.Observaciones)}, ${sqlDate(r.Fecha_Inicio)}, ${sqlDate(r.Fecha_Fin)}, ${esc(r.Comentario_Cierre)}, ${Number(r.Calificacion_Cierre) || "NULL"}, ${esc(r.Tipo_Cierre)}, ${esc(r.Resultado_Cierre)}, NOW());`);
    }
  });

  // 7. HALLAZGOS
  const hallazgos = leerHoja(CONFIG.SHEETS.HALLAZGOS);
  sql.push("\n-- 7. TABLA: HALLAZGOS");
  hallazgos.forEach(h => {
    const uuid = Utilities.getUuid();
    const oldId = String(h.ID_Hallazgo || "").trim();
    mapHallazgos[oldId] = uuid;
    const recId = mapRecorridos[String(h.ID_Recorrido).trim()];
    const chkId = mapCheckpoints[String(h.ID_Checkpoint).trim()];

    let estatus = String(h.Estatus || "").toLowerCase().includes("falla") ? "hallazgo_falla" : "conforme";

    if (recId && chkId) {
      sql.push(`INSERT INTO hallazgos (id, codigo, recorrido_id, checkpoint_id, estatus, comentario, foto_url, cerrado, fecha_cierre, created_at)
VALUES ('${uuid}', ${esc(oldId)}, '${recId}', '${chkId}', '${estatus}', ${esc(h.Comentario)}, ${esc(h.Foto)}, ${sqlBool(h.Cerrado)}, ${sqlDate(h.Fecha_Cierre)}, ${sqlDate(h.Fecha)});`);
    }
  });

  // 8. LOTES MASIVOS
  const lotes = leerHoja(CONFIG.SHEETS.LOTES_TAREAS);
  sql.push("\n-- 8. TABLA: LOTES_TAREAS");
  lotes.forEach(l => {
    const uuid = Utilities.getUuid();
    const oldId = String(l.ID_Lote_Masivo || "").trim();
    mapLotes[oldId] = uuid;
    const creadorId = mapUsuariosEmail[String(l.Creado_Por || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];

    sql.push(`INSERT INTO lotes_tareas (id, codigo, clave_idempotencia, titulo, cantidad_solicitada, cantidad_creada, creado_por, created_at)
VALUES ('${uuid}', ${esc(oldId)}, ${esc(l.Clave_Idempotencia || uuid)}, ${esc(l.Titulo)}, ${Number(l.Cantidad_Solicitada) || 0}, ${Number(l.Cantidad_Creada) || 0}, '${creadorId}', ${sqlDate(l.Fecha_Creacion)});`);
  });

  // 9. AUTOMATIZACIONES (Con fix para hora y fecha_inicio)
  const autos = leerHoja(CONFIG.SHEETS.TAREAS_AUTOMATICAS);
  sql.push("\n-- 9. TABLA: TAREAS_AUTOMATICAS");
  autos.forEach(a => {
    const uuid = Utilities.getUuid();
    const oldId = String(a.ID_Automatizacion || "").trim();
    mapAutos[oldId] = uuid;
    const eId = mapEdificios[String(a.ID_Edificio).trim()] || Object.values(mapEdificios)[0];
    const asigId = mapUsuariosEmail[String(a.Asignado_A_Email || "").trim().toLowerCase()] || Object.values(mapUsuarios)[0];
    const creadorId = mapUsuariosEmail[String(a.Creado_Por_Email || "").trim().toLowerCase()] || asigId;

    let frec = String(a.Frecuencia || "diaria").toLowerCase();
    if (!["diaria","semanal","mensual"].includes(frec)) frec = "diaria";

    sql.push(`INSERT INTO tareas_automaticas (id, codigo, edificio_id, asignado_a_id, creado_por, titulo, instrucciones, prioridad, frecuencia, dia_semana, dia_mes, hora, fecha_inicio, fecha_fin, proxima_ejecucion, ultima_ejecucion, activo, created_at)
VALUES ('${uuid}', ${esc(oldId)}, '${eId}', '${asigId}', '${creadorId}', ${esc(a.Titulo)}, ${esc(a.Instrucciones)}, '${String(a.Prioridad||"media").toLowerCase()}', '${frec}', ${Number(a.Dia_Semana) || "NULL"}, ${Number(a.Dia_Mes) || "NULL"}, ${sqlTime(a.Hora)}, ${sqlDateOnly(a.Fecha_Inicio)}, ${sqlDateOnly(a.Fecha_Fin)}, ${sqlDate(a.Proxima_Ejecucion)}, ${sqlDate(a.Ultima_Ejecucion)}, ${sqlBool(a.Activo)}, NOW());`);
  });

  // 10. TAREAS
  const tareas = leerHoja(CONFIG.SHEETS.TAREAS);
  sql.push("\n-- 10. TABLA: TAREAS");
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

    sql.push(`INSERT INTO tareas (id, codigo, edificio_id, hallazgo_id, automatizacion_id, lote_id, asignado_a_id, creado_por, tipo_origen, titulo, instrucciones, prioridad, estado, fecha_limite, fecha_inicio, fecha_resolucion, tiempo_total_minutos, resultado_cumplimiento, observaciones_cierre, foto_cierre_url, clave_idempotencia, created_at)
VALUES ('${uuid}', ${esc(oldId)}, '${eId}', ${hallazgoId ? `'${hallazgoId}'` : "NULL"}, ${autoId ? `'${autoId}'` : "NULL"}, ${loteId ? `'${loteId}'` : "NULL"}, '${asigId}', '${creadorId}', '${origen}', ${esc(t.Titulo_Tarea)}, ${esc(t.Instrucciones)}, '${prioridad}', '${estado}', ${sqlDate(t.Fecha_Limite)}, ${sqlDate(t.Fecha_Inicio)}, ${sqlDate(t.Fecha_Resolucion)}, ${Number(t.Tiempo_Total_Minutos) || "NULL"}, ${esc(t.Resultado_Cumplimiento)}, ${esc(t.Observaciones_Cierre)}, ${esc(t.Foto_Evidencia_Cierre)}, ${esc(t.Clave_Idempotencia)}, ${sqlDate(t.Fecha_Creacion)});`);
  });

  // 11. ACTUALIZACIÓN DE SECUENCIAS
  sql.push("\n-- 11. ACTUALIZACIÓN DE SECUENCIAS CORRELATIVAS");
  sql.push("SELECT setval('seq_codigo_edificio', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM edificios), 1));");
  sql.push("SELECT setval('seq_codigo_recorrido', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM recorridos), 1));");
  sql.push("SELECT setval('seq_codigo_hallazgo', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM hallazgos), 1));");
  sql.push("SELECT setval('seq_codigo_tarea', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM tareas), 1));");
  sql.push("SELECT setval('seq_codigo_lote', COALESCE((SELECT MAX(SUBSTRING(codigo, 6)::INT) FROM lotes_tareas), 1));");
  sql.push("SELECT setval('seq_codigo_auto', COALESCE((SELECT MAX(SUBSTRING(codigo, 5)::INT) FROM tareas_automaticas), 1));");

  sql.push("\nCOMMIT;");

  const contenidoSql = sql.join("\n");
  const nombreArchivo = "migracion_recorridos_v2_" + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyyMMdd_HHmmss") + ".sql";
  const archivoDrive = DriveApp.createFile(nombreArchivo, contenidoSql, "application/sql");

  Logger.log("✅ NUEVA MIGRACIÓN GENERADA");
  Logger.log("Archivo: " + archivoDrive.getUrl());
  return archivoDrive.getUrl();
}
