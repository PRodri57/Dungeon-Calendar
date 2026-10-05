const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the calendar with isolated storage; no real browser or database is changed.
function calendar(withLobby = false) {
  const storage = new Map();
  const elements = new Map();
  const element = () => ({
    textContent: '', innerHTML: '', style: {}, dataset: {},
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll: () => [], querySelector: () => null,
    getContext: () => ({}), setAttribute() {}, removeAttribute() {}, addEventListener() {},
  });
  const window = {
    SpriteEngine: class {
      constructor() { this.audio = { playBlip() {}, playStep() {} }; }
      setArmorTheme() {}
    },
    addEventListener() {}, matchMedia: () => ({ matches: true }),
  };
  const document = {
    body: element(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll: () => [], querySelector: () => null,
  };
  const context = vm.createContext({
    window, document, console, Date, setTimeout, clearTimeout,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  if (withLobby) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/lobby.js'), 'utf8'), context);
  const source = fs.readFileSync(path.join(__dirname, '../public/js/app.js'), 'utf8');
  vm.runInContext(source.replace(/\}\)\(\);\s*$/, 
    'window.testCalendar = { state, DungeonStorage, shiftMonth, shiftYear, syncActiveQuest, renderAllViews, selectQuest, switchView, lobbyEngine }; })();'), context);
  return { ...window.testCalendar, elements };
}

test('all five views switch with the real lobby engine and cancel pending movement', () => {
  const { state, switchView, lobbyEngine } = calendar(true);
  for (const view of ['lobby', 'day', 'week', 'year', 'month']) {
    lobbyEngine.goToStation('bedroom');
    lobbyEngine.keys.w = true;
    switchView(view);
    assert.equal(state.view, view);
    assert.equal(lobbyEngine.hero.targetX, null);
    assert.equal(lobbyEngine.pendingStationId, null);
    assert.equal(Object.keys(lobbyEngine.keys).length, 0);
  }
});

test('month navigation clamps the 31st without skipping a month', () => {
  const { state, shiftMonth } = calendar();
  state.currentDate = new Date(2026, 9, 31);
  shiftMonth(1);
  assert.equal(state.currentDate.getMonth(), 10);
  assert.equal(state.currentDate.getDate(), 30);
  state.currentDate = new Date(2026, 2, 31);
  shiftMonth(-1);
  assert.equal(state.currentDate.getMonth(), 1);
  assert.equal(state.currentDate.getDate(), 28);
});

test('year navigation clamps February 29 to February 28', () => {
  const { state, shiftYear } = calendar();
  state.currentDate = new Date(2028, 1, 29);
  shiftYear(1);
  assert.equal(state.currentDate.getFullYear(), 2029);
  assert.equal(state.currentDate.getMonth(), 1);
  assert.equal(state.currentDate.getDate(), 28);
});

test('selection stays on the chosen mission and clears on an empty day', () => {
  const { state, syncActiveQuest, selectQuest } = calendar();
  state.currentDate = new Date(2026, 9, 4);
  state.exams = [
    { id: 1, date: '2026-10-04', subject: 'Parcial', type: 'parcial', status: 'pendiente' },
    { id: 2, date: '2026-10-04', subject: 'TP', type: 'tarea', status: 'pendiente' },
  ];
  syncActiveQuest();
  selectQuest(2);
  syncActiveQuest();
  assert.equal(state.activeQuest.id, 2);
  state.currentDate = new Date(2026, 9, 5);
  syncActiveQuest();
  assert.equal(state.activeQuest, null);
});

test('an empty saved calendar stays empty', () => {
  const { DungeonStorage } = calendar();
  DungeonStorage.saveExams([]);
  assert.equal(DungeonStorage.getExams().length, 0);
  DungeonStorage.saveSchedules([]);
  assert.equal(DungeonStorage.getSchedules().length, 0);
});

test('demo missions merge without deleting or duplicating existing missions', () => {
  const { DungeonStorage } = calendar();
  DungeonStorage.saveExams([{ id: 1, subject: 'Mi examen', date: '2027-01-02', type: 'final', status: 'aprobado' }]);
  const first = DungeonStorage.seedExams();
  const second = DungeonStorage.seedExams();
  assert.equal(second.length, first.length);
  assert.equal(second.find(q => q.subject === 'Mi examen').status, 'aprobado');
  assert.equal(new Set(second.map(q => q.id)).size, second.length);
});

test('mission names and details render as text, including inside attributes', () => {
  const { state, syncActiveQuest, renderAllViews, elements } = calendar();
  state.currentDate = new Date(2026, 9, 4);
  state.exams = [{
    id: 1, date: '2026-10-04', subject: '<img src=x onerror="bad()">',
    location: '<script>bad()</script>', topics: 'A & B', type: 'parcial', status: 'pendiente',
  }];
  syncActiveQuest();
  renderAllViews();
  assert.ok(elements.get('monthTiles').innerHTML.includes('&lt;img src=x onerror=&quot;bad()&quot;&gt;'));
  assert.ok(!elements.get('questAgenda').innerHTML.includes('<img src=x'));
  assert.ok(elements.get('questInfoMeta').innerHTML.includes('&lt;script&gt;'));
  assert.ok(elements.get('questInfoMeta').innerHTML.includes('A &amp; B'));
});
