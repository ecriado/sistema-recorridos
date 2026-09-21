/**
 * ==============================================================================
 * SCRIPT DE MIGRACIÓN: GOOGLE SHEETS -> SUPABASE
 * SISTEMA DE RECORRIDOS Y GESTIÓN DE PROPIEDADES (EAZY PROPERTY OPS)
 * ==============================================================================
 *
 * ¿CÓMO USAR ESTE SCRIPT?
 * -----------------------
 * 1. En la hoja de cálculo de Google Sheets donde tienes tus datos, ve al menú:
 *    Extensiones -> Apps Script.
 * 2. En el panel izquierdo de archivos, haz clic en "+" -> "Secuencia de comandos".
 * 3. Nómbralo: "MigrarASupabase.gs".
 * 4. Pega todo el contenido de este archivo.
 * 5. Reemplaza las constantes SUPABASE_URL y SUPABASE_KEY con las credenciales de tu proyecto.
 * 6. En el selector superior de funciones, elige "ejecutarMigracionCompleta" y pulsa "Ejecutar".
 * 7. Revisa la consola (Ver -> Registro de ejecución). ¡Tus datos estarán en Supabase!
 * ==============================================================================
 */

// REEMPLAZA CON LOS DATOS DE TU PROYECTO DE SUPABASE (Settings -> API en Supabase)
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co"; 
const SUPABASE_KEY = "TU_SERVICE_ROLE_KEY_O_ANON_KEY";

function testConexionSupabase() {
  Logger.log("Probando conexión con Supabase...");
  const url = SUPABASE_URL + "/rest/v1/edificios?select=count";
  const res = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    muteHttpExceptions: true
  });
  Logger.log("Código de respuesta: " + res.getResponseCode());
  Logger.log("Cuerpo: " + res.getContentText());
}

function ejecutarMigracionCompleta() {
  Logger.log("🚀 ============================================================");
  Logger.log("🚀 INICIANDO MIGRACIÓN GOOGLE SHEETS -> SUPABASE (POSTGRESQL)");
  Logger.log("🚀 ============================================================");

  if (!SUPABASE_URL || SUPABASE_URL.includes("TU-PROYECTO") || !SUPABASE_KEY) {
    throw new Error("❌ Error: Debes configurar SUPABASE_URL y SUPABASE_KEY en las líneas 21 y 22 antes de ejecutar.");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. EDIFICIOS
  migrarTabla(ss, "Edificios", "edificios", "id_edificio", fila => ({
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "Edificio").trim(),
    direccion: String(fila["Direccion"] || fila["Dirección"] || fila["direccion"] || "").trim(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 2. USUARIOS
  migrarTabla(ss, "Usuarios", "usuarios", "id_usuario", fila => ({
    id_usuario: String(fila["ID_Usuario"] || fila["id_usuario"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "").trim(),
    email: String(fila["Email"] || fila["email"] || "").trim().toLowerCase(),
    rol: normalizarRol(fila["Rol"] || fila["rol"]),
    usuario_login: String(fila["Usuario_Login"] || fila["usuario_login"] || fila["Usuario"] || "").trim().toLowerCase(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 3. RECORRIDOS
  migrarTabla(ss, "Recorridos", "recorridos", "id_recorrido", fila => ({
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || fila["ID"] || "").trim(),
    nombre: String(fila["Nombre"] || fila["nombre"] || "Recorrido").trim(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    fecha_programada: parseFechaIso(fila["Fecha_Programada"] || fila["fecha_programada"]),
    fecha_cierre_programada: parseFechaIso(fila["Fecha_Cierre_Programada"] || fila["fecha_cierre_programada"]),
    cierre_automatico: parseBoolean(fila["Cierre_Automatico"], false),
    inspector_email: String(fila["Inspector_Email"] || fila["inspector_email"] || fila["Inspector"] || "").trim().toLowerCase(),
    estado: String(fila["Estado"] || fila["estado"] || "Programado").trim(),
    observaciones: String(fila["Observaciones"] || fila["observaciones"] || "").trim(),
    creado_por: String(fila["Creado_Por"] || fila["creado_por"] || "sistema").trim()
  }));

  // 4. CHECKPOINTS
  migrarTabla(ss, "Checkpoints", "checkpoints", "id_checkpoint", fila => ({
    id_checkpoint: String(fila["ID_Checkpoint"] || fila["id_checkpoint"] || fila["ID"] || "").trim(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || "").trim(),
    ubicacion: String(fila["Ubicacion"] || fila["Ubicación"] || fila["ubicacion"] || "").trim(),
    descripcion: String(fila["Descripcion"] || fila["Descripción"] || fila["descripcion"] || "").trim(),
    orden: Number(fila["Orden"] || fila["orden"] || 1),
    activo: parseBoolean(fila["Activo"], true)
  }));

  // 5. HALLAZGOS
  migrarTabla(ss, "Hallazgos", "hallazgos", "id_hallazgo", fila => ({
    id_hallazgo: String(fila["ID_Hallazgo"] || fila["id_hallazgo"] || fila["ID"] || "").trim(),
    id_recorrido: String(fila["ID_Recorrido"] || fila["id_recorrido"] || "").trim(),
    id_checkpoint: String(fila["ID_Checkpoint"] || fila["id_checkpoint"] || "").trim(),
    estatus: String(fila["Estatus"] || fila["estatus"] || "Conforme").trim(),
    comentario: String(fila["Comentario"] || fila["comentario"] || "").trim(),
    foto_url: String(fila["Foto"] || fila["foto_url"] || fila["Foto_URL"] || "").trim(),
    cerrado: parseBoolean(fila["Cerrado"], false)
  }));

  // 6. TAREAS
  migrarTabla(ss, "Tareas", "tareas", "id_tarea", fila => ({
    id_tarea: String(fila["ID_Tarea"] || fila["id_tarea"] || fila["ID"] || "").trim(),
    id_hallazgo: fila["ID_Hallazgo"] ? String(fila["ID_Hallazgo"]).trim() : null,
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    tipo_origen: String(fila["Tipo_Origen"] || fila["tipo_origen"] || "Manual").trim(),
    asignado_a_email: String(fila["Asignado_A_Email"] || fila["asignado_a_email"] || "").trim().toLowerCase(),
    titulo_tarea: String(fila["Titulo_Tarea"] || fila["Título_Tarea"] || fila["titulo_tarea"] || fila["Titulo"] || "").trim(),
    instrucciones: String(fila["Instrucciones"] || fila["instrucciones"] || "").trim(),
    prioridad: String(fila["Prioridad"] || fila["prioridad"] || "Media").trim(),
    estado_tarea: String(fila["Estado_Tarea"] || fila["estado_tarea"] || fila["Estado"] || "Pendiente").trim(),
    fecha_limite: parseFechaSolo(fila["Fecha_Limite"] || fila["fecha_limite"]),
    creado_por: String(fila["Creado_Por"] || fila["creado_por"] || "sistema").trim(),
    observaciones_cierre: String(fila["Observaciones_Cierre"] || fila["observaciones_cierre"] || "").trim(),
    foto_evidencia_cierre: String(fila["Foto_Evidencia_Cierre"] || fila["foto_evidencia_cierre"] || "").trim()
  }));

  // 7. TAREAS AUTOMÁTICAS
  migrarTabla(ss, "Tareas_Automaticas", "tareas_automaticas", "id_automatizacion", fila => ({
    id_automatizacion: String(fila["ID_Automatizacion"] || fila["id_automatizacion"] || fila["ID"] || "").trim(),
    titulo: String(fila["Titulo"] || fila["titulo"] || "").trim(),
    creado_por_email: String(fila["Creado_Por_Email"] || fila["creado_por_email"] || "").trim().toLowerCase(),
    asignado_a_email: String(fila["Asignado_A_Email"] || fila["asignado_a_email"] || "").trim().toLowerCase(),
    id_edificio: String(fila["ID_Edificio"] || fila["id_edificio"] || "").trim(),
    frecuencia: String(fila["Frecuencia"] || fila["frecuencia"] || "Semanal").trim(),
    hora: String(fila["Hora"] || fila["hora"] || "08:00").trim(),
    fecha_inicio: parseFechaSolo(fila["Fecha_Inicio"] || fila["fecha_inicio"]),
    prioridad: String(fila["Prioridad"] || fila["prioridad"] || "Media").trim(),
    activo: parseBoolean(fila["Activo"], true)
  }));

  Logger.log("🎉 ============================================================");
  Logger.log("🎉 ¡MIGRACIÓN COMPLETADA SATISFACTORIAMENTE!");
  Logger.log("🎉 ============================================================");
}

function migrarTabla(ss, nombreHoja, tablaSupabase, columnaId, mapperFn) {
  let hoja = ss.getSheetByName(nombreHoja);
  if (!hoja) {
    // Intentar buscar sin distinción de mayúsculas
    const hojas = ss.getSheets();
    hoja = hojas.find(h => h.getName().toLowerCase().replace(/[\s_-]/g, "") === nombreHoja.toLowerCase().replace(/[\s_-]/g, ""));
  }

  if (!hoja) {
    Logger.log("⚠️ Hoja '" + nombreHoja + "' no encontrada en este Google Sheet. Omitiendo.");
    return;
  }

  const datos = hoja.getDataRange().getValues();
  if (datos.length <= 1) {
    Logger.log("ℹ️ Hoja '" + nombreHoja + "' está vacía. Omitiendo.");
    return;
  }

  const encabezados = datos[0].map(h => String(h).trim());
  const registros = [];

  for (let i = 1; i < datos.length; i++) {
    const filaObj = {};
    for (let j = 0; j < encabezados.length; j++) {
      filaObj[encabezados[j]] = datos[i][j];
    }
    
    try {
      const record = mapperFn(filaObj);
      if (record && record[columnaId]) {
        registros.push(record);
      }
    } catch (err) {
      Logger.log("Error en fila " + (i + 1) + " de " + nombreHoja + ": " + err.message);
    }
  }

  if (registros.length === 0) {
    Logger.log("ℹ️ No hay registros válidos con clave primaria en " + nombreHoja);
    return;
  }

  Logger.log("📤 Procesando " + registros.length + " filas de " + nombreHoja + " -> " + tablaSupabase + "...");

  const CHUNK_SIZE = 50;
  for (let c = 0; c < registros.length; c += CHUNK_SIZE) {
    const chunk = registros.slice(c, c + CHUNK_SIZE);
    enviarASupabase(tablaSupabase, columnaId, chunk);
  }
}

function enviarASupabase(tabla, onConflictCol, payload) {
  const url = SUPABASE_URL + "/rest/v1/" + tabla + "?on_conflict=" + encodeURIComponent(onConflictCol);
  const options = {
    method: "post",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": "resolution=merge-duplicates"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    Logger.log("✅ Lote de " + payload.length + " registros insertado en '" + tabla + "'");
  } else {
    Logger.log("❌ Error en '" + tabla + "' (Código HTTP " + code + "): " + response.getContentText());
  }
}

function parseBoolean(val, defecto) {
  if (val === undefined || val === null || val === "") return defecto;
  const s = String(val).toLowerCase().trim();
  return s === "true" || s === "1" || s === "si" || s === "sí" || s === "activo";
}

function parseFechaIso(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString();
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch (e) {
    return null;
  }
}

function parseFechaSolo(val) {
  if (!val) return null;
  if (val instanceof Date) return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT", "yyyy-MM-dd");
  const s = String(val).trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function normalizarRol(val) {
  const s = String(val || "").trim().toLowerCase();
  if (s.includes("super")) return "SuperAdmin";
  if (s.includes("supervisor")) return "Supervisor";
  if (s.includes("mantenimiento") || s.includes("tecnico") || s.includes("técnico")) return "Mantenimiento";
  return "Administrador";
}
