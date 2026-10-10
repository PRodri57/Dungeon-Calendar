// server.js - Servidor Express con API REST + archivos estáticos
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '256kb' }));

// Servir el frontend (HTML, CSS, JS, assets)
app.use(express.static(path.join(__dirname, 'public')));

// --- API REST ---

// Listar todos los exámenes
app.get('/api/exams', (_req, res) => {
  res.json(db.list());
});

// Crear un examen
app.post('/api/exams', (req, res) => {
  try {
    const created = db.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar un examen
app.put('/api/exams/:id', (req, res) => {
  try {
    const updated = db.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Examen no encontrado.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar un examen
app.delete('/api/exams/:id', (req, res) => {
  const ok = db.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Examen no encontrado.' });
  res.status(204).end();
});

// Sembrar misiones de ejemplo para la mazmorra
app.post('/api/exams/seed', (_req, res) => {
  try {
    const list = db.seedDungeonQuests();
    res.json({ message: 'Mazmorra poblada con misiones.', data: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Limpiar todas las misiones
app.post('/api/exams/reset', (_req, res) => {
  try {
    db.clearAllExams();
    res.json({ message: 'Mazmorra despejada.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catálogo de sprites disponibles
app.get('/api/sprites', (_req, res) => {
  res.json({
    hero: {
      id: 'hero_knight',
      name: 'Caballero del Conocimiento',
      path: '/assets/sprites/hero_knight.jpg',
      frames: { idle: 4, walk: 8, attack: 6, defend: 4 },
      role: 'Héroe aventurero en busca del título supremo'
    },
    monsters: {
      parcial: {
        id: 'monster_parcial',
        name: 'Goblin del Parcial',
        path: '/assets/sprites/monster_parcial.jpg',
        frames: { idle: 4, walk: 4, attack: 4, recoil: 4 },
        weapon: 'Rollo de Examen Escrito',
        danger: 'Medio (Requiere mate y machete)'
      },
      final: {
        id: 'boss_final',
        name: 'Dragón del Final Supremo',
        path: '/assets/sprites/boss_final.jpg',
        frames: { idle: 4, roar: 4, recoil: 4, defeat: 4 },
        weapon: 'Llamarada de Preguntas Trampa',
        danger: 'Extremo (Jefe de Cátedra)'
      },
      slime: {
        id: 'monster_slime',
        name: 'Slime de Tarea Semanal',
        path: '/assets/sprites/monster_slime.jpg',
        frames: { idle: 4, jump: 4, squish: 3 },
        weapon: 'Rebotes de Entrega Tardía',
        danger: 'Bajo pero pegajoso'
      }
    },
    scenery: {
      corridor: '/assets/bg/castle_corridor_16bit.jpg',
      map: '/assets/bg/dungeon_map.jpg'
    }
  });
});

// --- Horarios de cursada ---

app.get('/api/schedules', (_req, res) => {
  res.json(db.listSchedules());
});

app.post('/api/schedules', (req, res) => {
  try {
    res.status(201).json(db.createSchedule(req.body));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/schedules/:id', (req, res) => {
  try {
    const updated = db.updateSchedule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Horario no encontrado.' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/schedules/:id', (req, res) => {
  const ok = db.removeSchedule(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Horario no encontrado.' });
  res.status(204).end();
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado.' });
});

// SPA fallback: cualquier otra ruta sirve el index
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, _next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    const status = err.type === 'entity.parse.failed' ? 400 : 500;
    return res.status(status).json({
      error: status === 400 ? 'El cuerpo de la solicitud no es JSON válido.' : 'Ocurrió un error inesperado.',
    });
  }
  res.status(500).send('Ocurrió un error inesperado.');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Órbita corriendo en  http://localhost:${PORT}\n`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  No se pudo iniciar Órbita: el puerto ${PORT} ya está ocupado.`);
    console.error('  Si ya tenés el proyecto abierto en otra terminal, detenelo con Ctrl+C.');
    console.error('  Para identificar el proceso desde PowerShell:');
    console.error(`  Get-NetTCPConnection -State Listen -LocalPort ${PORT} | Select-Object OwningProcess`);
    console.error('  Luego: Get-Process -Id <OwningProcess>\n');
  } else {
    console.error(`No se pudo iniciar Órbita: ${err.message}`);
  }
  process.exit(1);
});
