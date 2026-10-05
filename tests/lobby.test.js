const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function lobby() {
  const events = {};
  const window = { addEventListener() {} };
  const context = vm.createContext({
    window, document: { querySelector: () => null }, Math,
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/lobby.js'), 'utf8'), context);
  const canvas = {
    getContext: () => ({}), style: {}, focus() {},
    getBoundingClientRect: () => ({ left: 20, top: 10, width: 512, height: 512 }),
    addEventListener(name, callback) { events[name] = callback; },
  };
  const engine = new window.GuildLobbyEngine(canvas, { audio: { playStep() {} } });
  const interactions = [];
  engine.interactWithStation = id => interactions.push(id);
  const click = (x, y) => events.click({ clientX: 20 + x / 2, clientY: 10 + y / 2 });
  const arrive = () => {
    for (let i = 0; i < 500 && engine.hero.targetX !== null; i++) engine.update();
    assert.equal(engine.hero.targetX, null, 'the destination must be reachable');
  };
  return { engine, click, arrive, interactions };
}

test('clicking the objects reaches the matching station at any canvas scale', () => {
  for (const [id, x, y] of [
    ['bedroom', 90, 320], ['altar', 512, 220], ['artifacts', 885, 438],
    ['board', 560, 550], ['armory', 861, 816], ['portal', 512, 990],
  ]) {
    const { engine, click, arrive, interactions } = lobby();
    click(x, y);
    assert.equal(engine.pendingStationId, id);
    arrive();
    assert.deepEqual(interactions, [id]);
  }
});

test('both armory tables have their own approach and open the same station', () => {
  const { engine, click, arrive, interactions } = lobby();
  click(860, 490);
  assert.equal(engine.hero.targetY, 540);
  arrive();
  click(860, 810);
  assert.equal(engine.hero.targetY, 877);
  arrive();
  assert.deepEqual(interactions, ['armory', 'armory']);
});

test('floor clicks cancel a pending object interaction', () => {
  const { engine, click, arrive, interactions } = lobby();
  click(512, 220);
  click(500, 460); // Near the altar's approach, outside its visual hitbox.
  assert.equal(engine.pendingStationId, null);
  arrive();
  assert.deepEqual(interactions, []);
});

test('old floating markers no longer act as furniture hitboxes', () => {
  const { engine } = lobby();
  assert.equal(engine.stationAt(230, 260), null);
  assert.equal(engine.stationAt(800, 310), null);
  assert.equal(engine.stationAt(512, 890), null);
});

test('side shortcuts and cancellation use the same station destinations', () => {
  const { engine, arrive, interactions } = lobby();
  engine.goToStation('bedroom');
  assert.equal(engine.hero.targetX, 174);
  assert.equal(engine.hero.targetY, 391);
  arrive();
  assert.deepEqual(interactions, ['bedroom']);
  engine.goToStation('portal');
  engine.cancelMovement();
  assert.equal(engine.pendingStationId, null);
  assert.equal(engine.hero.targetY, null);
});

test('both armory approach points support keyboard interaction', () => {
  const { engine } = lobby();
  for (const [x, y] of [[834, 540], [880, 877]]) {
    engine.hero.x = x;
    engine.hero.y = y;
    engine.update();
    assert.equal(engine.nearestStation.id, 'armory');
  }
});
