Órbita — Gestor de parciales y finales
Aplicación web calendario para administrar exámenes, con identidad cósmica de la marca Órbita.

Stack (simple, sin paso de build)
Backend: Node.js + Express + SQLite (better-sqlite3, base de datos en un archivo local — persistente, sin instalar servidor de DB)
Frontend: HTML + CSS + JS vanilla servidos como archivos estáticos por Express (sin framework ni compilador → fácil de entender y modificar)
Fuentes: Sora (títulos) + JetBrains Mono (fechas/datos), vía Google Fonts
Paleta de marca (extraída de tu identidad): fondo #0A0C10, superficies #11151C, acento azul #2563FF, texto #E6EAF2, gris #8B95A7
Modelo de datos (tabla exams)
Cada examen guarda: materia, fecha, hora, tipo (parcial/final), aula/sede, temas y estado (pendiente/aprobado/desaprobado).

Modelo de datos (tabla schedules)
Cada cursada guarda: materia, día de la semana, hora de inicio y fin, aula/sede, docente y color identificador.

API (REST, JSON)
GET /api/exams · POST /api/exams · PUT /api/exams/:id · DELETE /api/exams/:id
GET /api/schedules · POST /api/schedules · PUT /api/schedules/:id · DELETE /api/schedules/:id
Funcionalidades (las que pediste)
Calendario mensual — grilla del mes con navegación anterior/siguiente; los exámenes se marcan en su día, codificados por tipo y con badge de estado.
Alta/edición/eliminación — botón "Nuevo examen" y click en un día/examen abre un modal con el formulario detallado.
Countdown — hero arriba con el próximo examen pendiente y los días faltantes, bien grande.
Estado del examen — marcar pendiente / aprobado / desaprobado (se refleja visualmente).
Horarios de cursada — grilla semanal de lunes a sábado, con alta, edición y eliminación de cada bloque horario.
Imprimir para la heladera — la impresión respeta la vista activa: calendario mensual o grilla de cursada. Oculta controles, optimiza el contenido para A4 apaisado y queda lista para imprimir o guardar como PDF.
Estructura de archivos

text
OrbitaCalendar/
  server.js            → Express + API
  db.js                → init SQLite + consultas
  package.json
  data/orbita.db       → se crea solo al correr (ignorado por git)
  public/
    index.html
    css/styles.css     → diseño cósmico de marca
    js/app.js          → lógica del calendario y CRUD
    assets/            → logo + favicon
Cómo se ejecuta
npm install → npm start → abrir http://localhost:3000. (También dejo un script dev con reinicio automático.)

Detalles de diseño
Fondo negro espacial con sutil grano de estrellas, acento azul neón en fechas clave y CTAs.
Modales con glassmorphism sutil; tipografía monoespaciada para datos.
Estado vacío amistoso (sin datos de ejemplo falsos).
Responsive y con CSS de impresión dedicado para la vista heladera.
Notas / fuera de alcance
UI y datos en español.
Válido para una máquina (localhost). Para acceder desde varios dispositivos habría que deployar el backend (lo dejo como siguiente paso opcional, no incluido ahora).
Durante la implementación aplicaré el skill de diseño frontend para asegurar un resultado pulido y coherente con la marca.
