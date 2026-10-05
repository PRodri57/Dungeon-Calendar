// db.js - Capa de acceso a datos con SQLite (better-sqlite3)
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Asegurar que el directorio data/ exista
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'orbita.db'));

// WAL para mejor concurrencia de lectura
db.pragma('journal_mode = WAL');

// Esquema
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject    TEXT    NOT NULL,
    date       TEXT    NOT NULL,            -- formato ISO YYYY-MM-DD
    time       TEXT,                        -- formato HH:MM (opcional)
    type       TEXT    NOT NULL DEFAULT 'parcial',  -- 'parcial' | 'final'
    location   TEXT,                        -- aula / sede (opcional)
    topics     TEXT,                        -- temas que incluye (opcional)
    status     TEXT    NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'aprobado' | 'desaprobado'
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_exams_date   ON exams(date);
  CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);

  CREATE TABLE IF NOT EXISTS schedules (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject    TEXT    NOT NULL,
    weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 6),
    start_time TEXT    NOT NULL,
    end_time   TEXT    NOT NULL,
    location   TEXT,
    professor  TEXT,
    color      TEXT    NOT NULL DEFAULT '#2563FF',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_schedules_weekday
    ON schedules(weekday, start_time);
`);

// --- Sentencias preparadas ---

const selectAll = db.prepare(`
  SELECT * FROM exams ORDER BY date ASC, time ASC NULLS LAST
`);

const selectById = db.prepare(`
  SELECT * FROM exams WHERE id = ?
`);

const insertExam = db.prepare(`
  INSERT INTO exams (subject, date, time, type, location, topics, status)
  VALUES (@subject, @date, @time, @type, @location, @topics, @status)
`);

const updateExam = db.prepare(`
  UPDATE exams
     SET subject = @subject,
         date    = @date,
         time    = @time,
         type    = @type,
         location= @location,
         topics  = @topics,
         status  = @status
   WHERE id = @id
`);

const deleteExam = db.prepare(`
  DELETE FROM exams WHERE id = ?
`);

const selectSchedules = db.prepare(`
  SELECT * FROM schedules ORDER BY weekday ASC, start_time ASC
`);

const selectScheduleById = db.prepare(`
  SELECT * FROM schedules WHERE id = ?
`);

const insertSchedule = db.prepare(`
  INSERT INTO schedules
    (subject, weekday, start_time, end_time, location, professor, color)
  VALUES
    (@subject, @weekday, @start_time, @end_time, @location, @professor, @color)
`);

const updateSchedule = db.prepare(`
  UPDATE schedules
     SET subject = @subject,
         weekday = @weekday,
         start_time = @start_time,
         end_time = @end_time,
         location = @location,
         professor = @professor,
         color = @color
   WHERE id = @id
`);

const deleteSchedule = db.prepare(`DELETE FROM schedules WHERE id = ?`);

// --- API pública del módulo ---

// Normaliza y valida los campos de entrada. Lanza error si algo no cierra.
function sanitize(input = {}) {
  const v = {
    subject:  String(input.subject ?? '').trim(),
    date:     String(input.date ?? '').trim(),
    time:     String(input.time ?? '').trim(),
    type:     String(input.type ?? 'parcial').trim(),
    location: String(input.location ?? '').trim(),
    topics:   String(input.topics ?? '').trim(),
    status:   String(input.status ?? 'pendiente').trim(),
  };

  if (!v.subject) throw new Error('La materia es obligatoria.');
  if (!v.date || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) {
    throw new Error('La fecha no es válida (se espera YYYY-MM-DD).');
  }
  const [year, month, day] = v.date.split('-').map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new Error('La fecha no existe en el calendario.');
  }
  if (!['parcial', 'final', 'tarea', 'entrega', 'cursada'].includes(v.type)) {
    throw new Error('El tipo debe ser "parcial", "final", "tarea", "entrega" o "cursada".');
  }
  if (!['pendiente', 'aprobado', 'desaprobado', 'completado'].includes(v.status)) {
    throw new Error('El estado no es válido.');
  }
  // Hora opcional pero con formato correcto
  if (v.time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.time)) {
    throw new Error('La hora no es válida (se espera HH:MM).');
  }

  // Null en lugar de string vacío para los opcionales
  v.time     = v.time     || null;
  v.location = v.location || null;
  v.topics   = v.topics   || null;

  return v;
}

function sanitizeSchedule(input = {}) {
  const v = {
    subject: String(input.subject ?? '').trim(),
    weekday: Number(input.weekday),
    start_time: String(input.start_time ?? '').trim(),
    end_time: String(input.end_time ?? '').trim(),
    location: String(input.location ?? '').trim(),
    professor: String(input.professor ?? '').trim(),
    color: String(input.color ?? '#2563FF').trim(),
  };

  if (!v.subject) throw new Error('La materia es obligatoria.');
  if (!Number.isInteger(v.weekday) || v.weekday < 1 || v.weekday > 6) {
    throw new Error('El día de cursada no es válido.');
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.start_time) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.end_time)) {
    throw new Error('Los horarios deben tener formato HH:MM.');
  }
  if (v.start_time >= v.end_time) {
    throw new Error('El horario de fin debe ser posterior al de inicio.');
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(v.color)) {
    throw new Error('El color elegido no es válido.');
  }

  v.location = v.location || null;
  v.professor = v.professor || null;
  return v;
}

module.exports = {
  list() {
    return selectAll.all();
  },

  get(id) {
    return selectById.get(id);
  },

  create(input) {
    const v = sanitize(input);
    const info = insertExam.run(v);
    return selectById.get(info.lastInsertRowid);
  },

  update(id, input) {
    const v = sanitize(input);
    v.id = Number(id);
    const info = updateExam.run(v);
    if (info.changes === 0) return undefined;
    return selectById.get(v.id);
  },

  remove(id) {
    const info = deleteExam.run(Number(id));
    return info.changes > 0;
  },

  listSchedules() {
    return selectSchedules.all();
  },

  createSchedule(input) {
    const v = sanitizeSchedule(input);
    const info = insertSchedule.run(v);
    return selectScheduleById.get(info.lastInsertRowid);
  },

  updateSchedule(id, input) {
    const v = sanitizeSchedule(input);
    v.id = Number(id);
    const info = updateSchedule.run(v);
    if (info.changes === 0) return undefined;
    return selectScheduleById.get(v.id);
  },

  removeSchedule(id) {
    const info = deleteSchedule.run(Number(id));
    return info.changes > 0;
  },

  clearAllExams() {
    db.prepare('DELETE FROM exams').run();
  },

  seedDungeonQuests() {
    const sampleQuests = [
      { subject: 'Parcial: Algoritmos y Estructuras', date: '2026-10-04', time: '10:00', type: 'parcial', location: 'Mazmorra Sala 3', topics: 'Árboles binarios, Grafos, Dijkstra', status: 'pendiente' },
      { subject: 'Misión: Entrega TP Laboratorio', date: '2026-10-04', time: '16:30', type: 'tarea', location: 'Gremio de Alquimia', topics: 'Código fuente y pruebas unitarias', status: 'pendiente' },
      { subject: 'Parcial: Sistemas Operativos', date: '2026-10-08', time: '19:00', type: 'parcial', location: 'Torre Norte 4-5', topics: 'Procesos, Hilos, Semáforos, Memoria Virtual', status: 'pendiente' },
      { subject: 'Parcial: Bases de Datos', date: '2026-10-15', time: '18:00', type: 'parcial', location: 'Cripta de Datos', topics: 'SQL, Normalización, Índices B-Tree', status: 'pendiente' },
      { subject: 'JEFE SUPREMO: Final de Arquitectura', date: '2026-11-25', time: '19:00', type: 'final', location: 'Cámara del Dragón', topics: 'Pipeline, Caché, Microarquitectura RISC-V', status: 'pendiente' },
      { subject: 'DRAGÓN ANCESTRAL: Final de Redes', date: '2026-12-14', time: '18:30', type: 'final', location: 'Guarida Final', topics: 'TCP/IP, Enrutamiento BGP, Criptografía SSL', status: 'pendiente' }
    ];

    for (const q of sampleQuests) {
      try {
        const v = sanitize(q);
        insertExam.run(v);
      } catch (err) {
        console.error('Error seeding quest:', err);
      }
    }
    return selectAll.all();
  }
};
