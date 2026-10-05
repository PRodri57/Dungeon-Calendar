const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function sprites() {
  const window = {};
  const document = {
    createElement() {
      const canvas = { width: 0, height: 0, source: null };
      canvas.getContext = () => ({
        drawImage(...args) { canvas.source = args.slice(1); },
        getImageData: (_, __, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData() {},
      });
      return canvas;
    },
  };
  const context = vm.createContext({
    window, document, Image: class {}, Uint8Array, Uint32Array, Math,
  });
  const source = fs.readFileSync(path.join(__dirname, '../public/js/sprite_engine.js'), 'utf8');
  vm.runInContext(source.replace('global.SpriteEngine = SpriteEngine;', 
    'global.SpriteEngine = SpriteEngine; global.testClearBackdrop = clearConnectedBackdrop;'), context);
  return { engine: new window.SpriteEngine(), clearBackdrop: window.testClearBackdrop };
}

test('backdrop removal preserves enclosed dark armor pixels', () => {
  const { clearBackdrop } = sprites();
  const width = 9;
  const data = new Uint8ClampedArray(width * width * 4);
  for (let i = 0; i < width * width; i++) data.set([28, 35, 50, 255], i * 4);
  for (let y = 2; y <= 6; y++) {
    for (let x = 2; x <= 6; x++) {
      if (x === 2 || x === 6 || y === 2 || y === 6) data.set([195, 165, 90, 255], (y * width + x) * 4);
    }
  }
  clearBackdrop(data, width, width);
  assert.equal(data[3], 0, 'connected background must be transparent');
  assert.equal(data[(4 * width + 4) * 4 + 3], 255, 'dark armor must stay opaque');
  assert.equal(data[(2 * width + 2) * 4 + 3], 255, 'gold outlines must stay opaque');
});

test('all directions share a fixed cell size and back views use rear-facing cells', () => {
  const { engine } = sprites();
  engine.createIsometricFrames({ naturalWidth: 1024, naturalHeight: 1024 });
  for (const direction of ['dr', 'dl', 'ur', 'ul']) {
    assert.equal(engine.frames.isoHero[direction].length, 4);
    for (const frame of engine.frames.isoHero[direction]) {
      assert.equal(frame.width, 128);
      assert.equal(frame.height, 171);
    }
  }
  assert.equal(engine.frames.isoHero.ur[0].source[0], 256); // Rear-facing column 3.
  assert.equal(engine.frames.isoHero.ur[0].source[1], 341); // Third row, not a front view.
  assert.equal(engine.frames.isoHero.ul, engine.frames.isoHero.ur);
});

test('canvas textures render with a stable foot anchor and no interpolation', () => {
  const { engine } = sprites();
  engine.createIsometricFrames({ naturalWidth: 1024, naturalHeight: 1024 });
  const draws = [];
  const scales = [];
  const ctx = {
    save() {}, restore() {}, translate() {},
    scale(...args) { scales.push(args); },
    drawImage(...args) { draws.push(args.slice(1)); },
  };
  engine.drawIsometricHero(ctx, 500, 600, 'dr', 0, 1.5);
  engine.drawIsometricHero(ctx, 500, 600, 'dr', 3, 1.5);
  assert.deepEqual(draws[0], draws[1]);
  assert.equal(ctx.imageSmoothingEnabled, false);
  engine.drawIsometricHero(ctx, 500, 600, 'ul', 0, 1.5);
  assert.deepEqual(scales, [[-1, 1]]);
});
