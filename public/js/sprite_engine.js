// sprite_engine.js - Motor de Sprites 8-bit y Audio Sintetizado para Dungeon Calendar
(function (global) {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API Retro 8-bit) ---
  class RetroAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.volume = 0.3;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playTone(freq, duration, type = 'square', startGain = 0.2, endGain = 0.01) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(startGain * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(endGain * this.volume, 0.0001), now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        // Ignorar errores de audio autoplay
      }
    }

    playSwordSwing() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }

    playMonsterHit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) {}
    }

    playShieldBlock() {
      if (!this.enabled) return;
      this.playTone(600, 0.08, 'triangle', 0.25, 0.01);
      setTimeout(() => this.playTone(350, 0.12, 'square', 0.2, 0.01), 30);
    }

    playMagicCast() {
      if (!this.enabled) return;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 0.1, 'sine', 0.2, 0.01), idx * 40);
      });
    }

    playVictoryFanfare() {
      if (!this.enabled) return;
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.28 }, // C6
        { f: 880.00, d: 0.12 }, // A5
        { f: 1046.5, d: 0.45 }  // C6
      ];
      let t = 0;
      melody.forEach(item => {
        setTimeout(() => this.playTone(item.f, item.d, 'square', 0.25, 0.01), t);
        t += item.d * 1000 + 40;
      });
    }

    playStep() {
      this.playTone(120, 0.04, 'triangle', 0.08, 0.001);
    }

    playBlip() {
      this.playTone(880, 0.05, 'square', 0.12, 0.001);
    }

    playGoddessBlessing() {
      if (!this.enabled) return;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 0.25, 'sine', 0.2, 0.01);
        }, i * 70);
      });
    }

    playCatMeow() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.linearRampToValueAtTime(750, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);

        gain.gain.setValueAtTime(0.2 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch (e) {}
    }

    playPotionBubble() {
      if (!this.enabled) return;
      [300, 480, 620, 540].forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.06, 'sine', 0.15, 0.01), idx * 45);
      });
    }

    playEquipItem() {
      if (!this.enabled) return;
      this.playTone(320, 0.08, 'square', 0.2, 0.01);
      setTimeout(() => this.playTone(640, 0.1, 'triangle', 0.25, 0.01), 40);
    }

    playLullaby() {
      if (!this.enabled) return;
      const notes = [440, 392, 349, 330, 261];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 0.3, 'sine', 0.15, 0.01), idx * 160);
      });
    }
  }

  // --- SPRITE MATRICES & PROCEDURAL 8-BIT RENDERER ---
  // Representación 16x16 de pixel-art para renderizado instantáneo y nítido a cualquier escala
  const PIXEL_PALETTE = {
    '.': null,                     // Transparente
    '0': '#000000',                // Negro borde
    'W': '#ffffff',                // Blanco
    'B': '#475569',                // Acero plateado oscuro (sombra metálica)
    'b': '#94a3b8',                // Acero plateado medio
    'L': '#e2e8f0',                // Plata reflejo especular
    'G': '#d4af37',                // Oro detalle / filigrana
    'g': '#fef08a',                // Oro brillo claro
    'R': '#4a2024',                // Capa / pluma vino sobrio (realista)
    'r': '#6b2d35',                // Capa / pluma vino medio
    'S': '#9ca3af',                // Acero espada
    's': '#e5e7eb',                // Acero brillo
    'K': '#fcd34d',                // Piel / Visor
    'k': '#4a3b32',                // Cuero botas realista
    // Goblin
    'O': '#15803d',                // Verde orco oscuro
    'o': '#22c55e',                // Verde orco claro
    'Y': '#facc15',                // Ojo amarillo
    'P': '#78350f',                // Ropa marrón
    'p': '#b45309',                // Ropa marrón claro
    'X': '#fef08a',                // Pergamino parcial
    'x': '#b91c1c',                // Sello rojo parcial
    // Dragon
    'D': '#991b1b',                // Dragón rojo oscuro
    'd': '#dc2626',                // Dragón escamas
    'F': '#f97316',                // Fuego naranja
    'f': '#facc15',                // Fuego amarillo
    'H': '#451a03',                // Cuerno
    // Slime
    'M': '#10b981',                // Slime verde
    'm': '#34d399',                // Slime verde claro
    'A': '#06b6d4',                // Slime cyan
    'a': '#22d3ee'                 // Slime cyan claro
  };

  // Sprites del Héroe Caballero (16x16)
  const HERO_FRAMES = {
    idle_1: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...0RR00RR0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB0....",
      "..0B000000B0....",
      "..0BbBbBbBB0..0.",
      ".00BbBbBbBb000S0",
      "0GBBbBbBbBB0SSs0",
      "0GgBbBbBbBB00Ss0",
      "0GGB000000B000S0",
      ".000B0..0B00000.",
      "...0kk0..0kk0...",
      ...[
      "...0kk0..0kk0...",
      "....00....00...."
      ]
    ],
    idle_2: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...0RR00RR0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB0....",
      "..0B000000B0....",
      "..0BbBbBbBB0..0.",
      ".00BbBbBbBb000S0",
      "0GBBbBbBbBB0SSs0",
      "0GgBbBbBbBB00Ss0",
      "0GGB000000B000S0",
      ".0000B..0B00000.",
      "...0kk0..0kk0...",
      "...0kk0..0kk0...",
      "....00....00...."
    ],
    walk_1: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...0RR00RR0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB0....",
      "..0BbBbBbBB0..0.",
      ".00BbBbBbBb000S0",
      "0GBBbBbBbBB0SSs0",
      "0GgB000000BB0Ss0",
      "0GGB0....00B00S0",
      ".000k0....0k000.",
      "...0kk0....0kk0.",
      "...000......000.",
      "................",
      "................"
    ],
    walk_2: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...0RR00RR0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB0....",
      "..0BbBbBbBB0..0.",
      ".00BbBbBbBb000S0",
      "0GBBbBbBbBB0SSs0",
      "0GgB000000BB0Ss0",
      "0GGB0....00B00S0",
      "..0k0....0k0....",
      "..0kk0..0kk0....",
      "...000..000.....",
      "................",
      "................"
    ],
    attack_1: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB00000",
      "..0B000000B0SSSS",
      ".00BbBbBbBB0Sss0",
      "0GBBbBbBbBb00SS0",
      "0GgBbBbBbBBB0000",
      "0GGB000000BB0...",
      ".000k0..0kk00...",
      "...0kk0..000....",
      "...000..........",
      "................",
      "................",
      "................"
    ],
    attack_2: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...00BBBB0000000",
      "..0BBBBBBBB0SSSS",
      "..0BKKKKKKB0Ssss",
      "..0B000000B00SSS",
      ".00BbBbBbBB0.000",
      "0GBBbBbBbBb0....",
      "0GgBbBbBbBBB0...",
      "0GGB000000BB0...",
      ".000k0..0kk00...",
      "...0kk0..000....",
      "...000..........",
      "................",
      "................",
      "................"
    ],
    defend_1: [
      "....0RRRR0......",
      "...0RrRrRr0.....",
      "...00BBBB00.....",
      "..0BBBBBBBB0....",
      "..0BKKKKKKB0....",
      "..0000000000....",
      ".00GGGGGGGG00...",
      ".0GgGgGgGgGg00..",
      ".0GGGGGGGGGG000.",
      ".0GgGgGgGgGg00S0",
      ".00GGGGGGGG0SSs0",
      "..00000000000Ss0",
      "...0kk0..0kk000.",
      "...0kk0..0kk0...",
      "....00....00....",
      "................"
    ]
  };

  // Sprites del Goblin de Parcial (16x16)
  const GOBLIN_FRAMES = {
    idle_1: [
      ".....00000......",
      "....0OOOOO0.....",
      "...0OOOoOOO0....",
      "..00OoOoOoOO0...",
      "..0OY00Oo00YO0..",
      "..0OOOOOOOOOO0..",
      "...0O000000O0...",
      "...00PP00PP00...",
      "..00PPPPPPPP000.",
      ".0X0PPPPPPPP00O0",
      "0XxX0PPPPPP0..00",
      "0XXX00000000....",
      ".000.0O0..0O0...",
      "....0kk0..0kk0..",
      "....000....000..",
      "................"
    ],
    idle_2: [
      ".....00000......",
      "....0OOOOO0.....",
      "...0OOOoOOO0....",
      "..00OoOoOoOO0...",
      "..0OY00Oo00YO0..",
      "..0OOOOOOOOOO0..",
      "...0O000000O0...",
      "...00PP00PP00...",
      "..00PPPPPPPP000.",
      ".0X0PPPPPPPP00O0",
      "0XxX0PPPPPP0..00",
      "0XXX00000000....",
      ".000..0O0.0O0...",
      ".....0kk0.0kk0..",
      ".....000...000..",
      "................"
    ],
    attack_1: [
      "..00000X0.......",
      ".0XxXxXX00000...",
      ".0XXXXX0OOOOO0..",
      "..00000OoOoOO0..",
      "....00OY000YO0..",
      "....0OOOOOOOO0..",
      ".....00000000...",
      "....00PPPPPP00..",
      "...00PPPPPPPP00.",
      "..0O0PPPPPPPP00.",
      "..00.00000000...",
      ".....0O0..0O0...",
      "....0kk0..0kk0..",
      "....000....000..",
      "................",
      "................"
    ],
    recoil_1: [
      ".......00000....",
      "......0OOOOO0...",
      ".....0OOOoOOO0..",
      "....00OoOoOoOO0.",
      "....0OW00Oo00WO0",
      "....0OOOOOOOOOO0",
      ".....0O000000O0.",
      "....000PP00PP00.",
      "...000PPPPPPPP00",
      "..0X0.PPPPPPPP00",
      ".0XxX0000000000.",
      ".0XXX0.0O0..0O0.",
      "..000.0kk0..0kk0",
      "......000....000",
      "................",
      "................"
    ]
  };

  // Sprites del Dragón Jefe Supremo de Finales (24x20 simplificado a 20x20)
  const DRAGON_FRAMES = {
    idle_1: [
      ".......000..........",
      "......0HH0000.......",
      ".....0HHDdddd0......",
      "....00DDdYYdD0......",
      "...0dDDDDD000.......",
      "...0ddDDDD0.........",
      "00.0ddddDD0000000...",
      "0D00ddddddDDDDDDd0..",
      "0Dd0ddFfFfdddddDd0..",
      ".0Dd0fFfFfdddddd0...",
      "..00ddddddddddd0....",
      "...00dddddddddd0....",
      "....0dddddddddd0....",
      "....00dd00dddd00....",
      ".....0d0..0ddd0.....",
      ".....000...0000.....",
      "....................",
      "....................",
      "....................",
      "...................."
    ],
    roar_1: [
      ".......000..........",
      "......0HH0000.......",
      ".....0HHDdddd0......",
      "....00DDdYYdD0000000",
      "...0dDD000000FFffFfF",
      "...0ddD0ffFfFFffffF0",
      "00.0dddd00000000000.",
      "0D00ddddddDDDDDDd0..",
      "0Dd0ddFfFfdddddDd0..",
      ".0Dd0fFfFfdddddd0...",
      "..00ddddddddddd0....",
      "...00dddddddddd0....",
      "....0dddddddddd0....",
      "....00dd00dddd00....",
      ".....0d0..0ddd0.....",
      ".....000...0000.....",
      "....................",
      "....................",
      "....................",
      "...................."
    ],
    recoil_1: [
      "........000.........",
      ".......0HH0000......",
      "......0HHDWWdd0.....",
      ".....00DDd000dD0....",
      "....0dDDDDD000......",
      "....0ddDDDD0........",
      ".00.0ddddDD0000000..",
      ".0D00ddddddDDDDDDd0.",
      ".0Dd0ddddddddddDd0..",
      "..0Dd0dddddddddd0...",
      "...00ddddddddddd0...",
      "....00dddddddddd0...",
      ".....0dddddddddd0...",
      ".....00dd00dddd00...",
      "......0d0..0ddd0....",
      "......000...0000....",
      "....................",
      "....................",
      "....................",
      "...................."
    ]
  };

  // Sprites de Slime (16x16)
  const SLIME_FRAMES = {
    idle_1: [
      "................",
      "................",
      "................",
      ".....000000.....",
      "...00mmmmmm00...",
      "..0mmmmMmmmmm0..",
      ".0mmm00mm00mmm0.",
      ".0mmm00mm00mmm0.",
      "0mmmmmmmmmmmmmm0",
      "0mmmmMMMMmmmmmm0",
      "0mmmmmmmmmmmmmm0",
      "0mmmmmmmmmmmmmm0",
      ".00mmmmmmmmmm00.",
      "..000000000000..",
      "................",
      "................"
    ],
    jump_1: [
      "................",
      ".....000000.....",
      "...00mmmmmm00...",
      "..0mmmmMmmmmm0..",
      ".0mmm00mm00mmm0.",
      ".0mmm00mm00mmm0.",
      "0mmmmmmmmmmmmmm0",
      "0mmmmMMMMmmmmmm0",
      ".0mmmmmmmmmmmm0.",
      "..000000000000..",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................"
    ],
    recoil_1: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "....00000000....",
      "..00mmmmmmmm00..",
      ".0mmmmWWmmWWmm0.",
      "0mmmmmmmmmmmmmm0",
      "0mmmmMMMMmmmmmm0",
      "0000000000000000",
      "................",
      "................",
      "................",
      "................"
    ]
  };

  const ARMOR_THEMES = {
    classic: { 'B': '#475569', 'b': '#94a3b8', 'L': '#e2e8f0', 'G': '#d4af37', 'g': '#fef08a' },
    gold:    { 'B': '#b45309', 'b': '#f59e0b', 'L': '#fef08a', 'G': '#fbbf24', 'g': '#ffffff' },
    crimson: { 'B': '#991b1b', 'b': '#ef4444', 'L': '#fca5a5', 'G': '#d4af37', 'g': '#fef08a' },
    shadow:  { 'B': '#1f2937', 'b': '#4b5563', 'L': '#9ca3af', 'G': '#b45309', 'g': '#f59e0b' },
    amethyst:{ 'B': '#581c87', 'b': '#9333ea', 'L': '#d8b4fe', 'G': '#d4af37', 'g': '#fef08a' },
    emerald: { 'B': '#065f46', 'b': '#10b981', 'L': '#6ee7b7', 'G': '#d4af37', 'g': '#fef08a' }
  };

  const CAT_FRAMES = {
    idle_1: [
      "..000...000.....",
      ".0FF00.00FF0....",
      ".0FFFF00FFFF0...",
      "0FFFFFFFFFF0....",
      "0FY0FFFF0YF0....",
      "0FFFF00FFFF0....",
      ".0FFFWWFFFF0....",
      ".00FFFFFF00.....",
      "0FFFFFFFFFF0....",
      "0FFFFFFFFFF0.00.",
      "0FFFFFFFFFF00FF0",
      "0FFFFFFFFFF0FF0.",
      ".0000000000000..",
      "................"
    ],
    idle_2: [
      "..000...000.....",
      ".0FF00.00FF0....",
      ".0FFFF00FFFF0...",
      "0FFFFFFFFFF0....",
      "0FY0FFFF0YF0....",
      "0FFFF00FFFF0....",
      ".0FFFWWFFFF0....",
      ".00FFFFFF00.....",
      "0FFFFFFFFFF0....",
      "0FFFFFFFFFF000..",
      "0FFFFFFFFFF0FF0.",
      "0FFFFFFFFFF00FF0",
      ".0000000000000..",
      "................"
    ]
  };

  // Helper para dibujar una matriz de caracteres en un Canvas
  function drawPixelMatrix(ctx, matrix, x, y, pixelSize = 4, flip = false, flashWhite = false, overrides = null) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    ctx.save();
    if (flip) {
      ctx.translate(x + cols * pixelSize, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    for (let r = 0; r < rows; r++) {
      const line = matrix[r];
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        let color = overrides && overrides[char] ? overrides[char] : PIXEL_PALETTE[char];
        if (color) {
          ctx.fillStyle = flashWhite ? '#ffffff' : color;
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    ctx.restore();
  }

  const FRAME_MANIFEST = {
    hero: {
      idle: [
        '/assets/sprites/frames/hero_idle_0.png', '/assets/sprites/frames/hero_idle_1.png',
        '/assets/sprites/frames/hero_idle_2.png', '/assets/sprites/frames/hero_idle_3.png'
      ],
      walk: [
        '/assets/sprites/frames/hero_walk_0.png', '/assets/sprites/frames/hero_walk_1.png',
        '/assets/sprites/frames/hero_walk_2.png', '/assets/sprites/frames/hero_walk_3.png',
        '/assets/sprites/frames/hero_walk_4.png', '/assets/sprites/frames/hero_walk_5.png',
        '/assets/sprites/frames/hero_walk_6.png', '/assets/sprites/frames/hero_walk_7.png'
      ],
      attack: [
        '/assets/sprites/frames/hero_attack_0.png', '/assets/sprites/frames/hero_attack_1.png',
        '/assets/sprites/frames/hero_attack_2.png', '/assets/sprites/frames/hero_attack_3.png',
        '/assets/sprites/frames/hero_attack_4.png'
      ],
      defend: [
        '/assets/sprites/frames/hero_defend_0.png', '/assets/sprites/frames/hero_defend_1.png',
        '/assets/sprites/frames/hero_defend_2.png', '/assets/sprites/frames/hero_defend_3.png'
      ]
    },
    goblin: {
      idle: [
        '/assets/sprites/frames/goblin_idle_0.png', '/assets/sprites/frames/goblin_idle_1.png',
        '/assets/sprites/frames/goblin_idle_2.png', '/assets/sprites/frames/goblin_idle_3.png'
      ],
      walk: [
        '/assets/sprites/frames/goblin_walk_0.png', '/assets/sprites/frames/goblin_walk_1.png',
        '/assets/sprites/frames/goblin_walk_2.png', '/assets/sprites/frames/goblin_walk_3.png'
      ],
      attack: [
        '/assets/sprites/frames/goblin_attack_0.png', '/assets/sprites/frames/goblin_attack_1.png',
        '/assets/sprites/frames/goblin_attack_2.png', '/assets/sprites/frames/goblin_attack_3.png'
      ],
      recoil: [
        '/assets/sprites/frames/goblin_recoil_0.png', '/assets/sprites/frames/goblin_recoil_1.png',
        '/assets/sprites/frames/goblin_recoil_2.png', '/assets/sprites/frames/goblin_recoil_3.png'
      ]
    },
    dragon: {
      idle: [
        '/assets/sprites/frames/dragon_idle_0.png', '/assets/sprites/frames/dragon_idle_1.png',
        '/assets/sprites/frames/dragon_idle_2.png', '/assets/sprites/frames/dragon_idle_3.png'
      ],
      roar: [
        '/assets/sprites/frames/dragon_roar_0.png', '/assets/sprites/frames/dragon_roar_1.png',
        '/assets/sprites/frames/dragon_roar_2.png', '/assets/sprites/frames/dragon_roar_3.png'
      ],
      recoil: [
        '/assets/sprites/frames/dragon_recoil_0.png', '/assets/sprites/frames/dragon_recoil_1.png',
        '/assets/sprites/frames/dragon_recoil_2.png', '/assets/sprites/frames/dragon_recoil_3.png'
      ],
      defeat: [
        '/assets/sprites/frames/dragon_defeat_0.png', '/assets/sprites/frames/dragon_defeat_1.png',
        '/assets/sprites/frames/dragon_defeat_2.png', '/assets/sprites/frames/dragon_defeat_3.png'
      ]
    },
    slime: {
      idle: [
        '/assets/sprites/frames/slime_idle_0.png', '/assets/sprites/frames/slime_idle_1.png'
      ],
      jump: [
        '/assets/sprites/frames/slime_jump_0.png'
      ],
      recoil: [
        '/assets/sprites/frames/slime_recoil_0.png'
      ]
    },
    cat: {
      sit: [
        '/assets/sprites/frames/cat_sit_0.png', '/assets/sprites/frames/cat_sit_1.png',
        '/assets/sprites/frames/cat_sit_2.png', '/assets/sprites/frames/cat_sit_3.png'
      ],
      sleep: [
        '/assets/sprites/frames/cat_sleep_0.png', '/assets/sprites/frames/cat_sleep_1.png',
        '/assets/sprites/frames/cat_sleep_2.png', '/assets/sprites/frames/cat_sleep_3.png'
      ],
      stretch: [
        '/assets/sprites/frames/cat_stretch_0.png', '/assets/sprites/frames/cat_stretch_1.png',
        '/assets/sprites/frames/cat_stretch_2.png', '/assets/sprites/frames/cat_stretch_3.png'
      ],
      lick: [
        '/assets/sprites/frames/cat_lick_0.png', '/assets/sprites/frames/cat_lick_1.png',
        '/assets/sprites/frames/cat_lick_2.png', '/assets/sprites/frames/cat_lick_3.png'
      ]
    },
    npcs: {
      blacksmith: '/assets/sprites/frames/npc_blacksmith.png',
      alchemist: '/assets/sprites/frames/npc_alchemist.png',
      receptionist: '/assets/sprites/frames/npc_receptionist.png',
      priestess: '/assets/sprites/frames/npc_priestess.png',
      collector: [
        '/assets/sprites/frames/npc_collector_0.png',
        '/assets/sprites/frames/npc_collector_1.png'
      ],
      owl: [
        '/assets/sprites/frames/npc_owl_read.png',
        '/assets/sprites/frames/npc_owl_stand.png',
        '/assets/sprites/frames/npc_owl_sleep.png'
      ]
    },
    goddessCutout: '/assets/sprites/frames/goddess_statue_cutout.png'
  };

  // Remove only backdrop pixels connected to the cell edges. A global dark-color
  // key also erases the knight's boots, outlines and shaded armor.
  function clearConnectedBackdrop(data, width, height) {
    const visited = new Uint8Array(width * height);
    const queue = new Uint32Array(width * height);
    let head = 0;
    let tail = 0;
    const enqueue = index => {
      if (visited[index]) return;
      visited[index] = 1;
      const offset = index * 4;
      const r = data[offset], g = data[offset + 1], b = data[offset + 2];
      if (r > 46 || g > 54 || b > 74 || r > g + 8 || g > b + 8) return;
      queue[tail++] = index;
    };
    for (let x = 0; x < width; x++) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }
    while (head < tail) {
      const index = queue[head++];
      data[index * 4 + 3] = 0;
      const x = index % width;
      const y = Math.floor(index / width);
      if (x > 0) enqueue(index - 1);
      if (x < width - 1) enqueue(index + 1);
      if (y > 0) enqueue(index - width);
      if (y < height - 1) enqueue(index + width);
    }
  }

  // --- SPRITE MANAGER & ANIMATION ENGINE ---
  class SpriteEngine {
    constructor() {
      this.audio = new RetroAudioEngine();
      this.images = {};
      this.imageLoaded = {};
      this.frames = {};
      this.framesLoaded = {};
      this.frames.isoHero = { dr: [], dl: [], ur: [], ul: [] };
      this.armorTheme = 'classic';
      this.loadGeneratedImages();
      this.loadAllFrames();
    }

    setArmorTheme(themeName) {
      if (ARMOR_THEMES[themeName]) {
        this.armorTheme = themeName;
      }
    }

    resolvePath(u) {
      if (!u) return u;
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:' && u.startsWith('/')) {
        return u.slice(1);
      }
      return u;
    }

    loadAllFrames() {
      // Pre-cargar todas las imágenes de alta definición
      ['hero', 'goblin', 'dragon', 'slime'].forEach(actor => {
        this.frames[actor] = {};
        for (const [anim, urls] of Object.entries(FRAME_MANIFEST[actor])) {
          this.frames[actor][anim] = urls.map(url => {
            const img = new Image();
            img.src = this.resolvePath(url);
            img.onload = () => {
              this.framesLoaded[url] = true;
            };
            return img;
          });
        }
      });

      // Cargar gato Pixel animado
      this.frames.cat = {};
      if (FRAME_MANIFEST.cat) {
        for (const [anim, urls] of Object.entries(FRAME_MANIFEST.cat)) {
          this.frames.cat[anim] = urls.map(url => {
            const img = new Image();
            img.src = this.resolvePath(url);
            img.onload = () => {
              this.framesLoaded[url] = true;
            };
            return img;
          });
        }
      }

      // Cargar NPCs del gremio
      this.frames.npcs = {};
      if (FRAME_MANIFEST.npcs) {
        for (const [npcId, val] of Object.entries(FRAME_MANIFEST.npcs)) {
          if (Array.isArray(val)) {
            this.frames.npcs[npcId] = val.map(url => {
              const img = new Image();
              img.src = this.resolvePath(url);
              img.onload = () => {
                this.framesLoaded[url] = true;
              };
              return img;
            });
          } else {
            const img = new Image();
            img.src = this.resolvePath(val);
            img.onload = () => {
              this.framesLoaded[val] = true;
            };
            this.frames.npcs[npcId] = img;
          }
        }
      }

      // Estatua de la Diosa
      const gImg = new Image();
      gImg.src = this.resolvePath(FRAME_MANIFEST.goddessCutout);
      gImg.onload = () => {
        this.framesLoaded['goddess_cutout'] = true;
        this.images['goddess_cutout'] = gImg;
      };
    }

    createIsometricFrames(sheet) {
      const frameW = Math.floor(sheet.naturalWidth / 8);
      const frameH = Math.ceil(sheet.naturalHeight / 6);
      const directions = {
        dr: { row: 0, columns: [0, 1, 2, 3] },
        dl: { row: 1, columns: [0, 1, 2, 3] },
        // These cells show the back; the first cells in rows 3 and 4 face front.
        ur: { row: 2, columns: [2, 3, 5, 7] },
      };
      for (const [direction, { row, columns }] of Object.entries(directions)) {
        this.frames.isoHero[direction] = columns.map(column => {
          const canvas = document.createElement('canvas');
          canvas.width = frameW;
          canvas.height = frameH;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.imageSmoothingEnabled = false;
          const top = Math.round(row * sheet.naturalHeight / 6);
          const bottom = Math.round((row + 1) * sheet.naturalHeight / 6);
          ctx.drawImage(sheet, column * frameW, top, frameW, bottom - top, 0, 0, frameW, bottom - top);
          const pixels = ctx.getImageData(0, 0, frameW, frameH);
          clearConnectedBackdrop(pixels.data, frameW, frameH);
          ctx.putImageData(pixels, 0, 0);
          return canvas;
        });
      }
      // Mirror the coherent rear-facing frames for the other back direction.
      this.frames.isoHero.ul = this.frames.isoHero.ur;
    }

    loadGeneratedImages() {
      const spriteUrls = {
        hero: '/assets/sprites/hero_knight.jpg',
        goblin: '/assets/sprites/monster_parcial.jpg',
        dragon: '/assets/sprites/boss_final.jpg',
        slime: '/assets/sprites/monster_slime.jpg',
        corridor: '/assets/bg/castle_corridor_16bit.jpg',
        map: '/assets/bg/dungeon_map.jpg',
        goddess: '/assets/sprites/goddess_statue.jpg',
        lobby_bg: '/assets/bg/guild_lobby.jpg',
        lobby_isometric: '/assets/bg/lobby_isometric.jpg',
        knight_isometric: '/assets/sprites/knight_isometric.jpg'
      };

      for (const [key, url] of Object.entries(spriteUrls)) {
        if (!url) continue;
        const img = new Image();
        img.src = this.resolvePath(url);
        img.onload = () => {
          this.images[key] = img;
          this.imageLoaded[key] = true;
          if (key === 'knight_isometric') this.createIsometricFrames(img);
        };
        img.onerror = () => {
          console.warn(`[SpriteEngine] Imagen ${url} no cargó aún.`);
        };
      }
    }

    // Dibuja el héroe usando los frames de alta definición
    drawHero(ctx, x, y, state = 'idle', frameIdx = 0, scale = 4, flip = false, flash = false, theme = null) {
      const activeTheme = theme || this.armorTheme;
      let anim = state;
      if (anim === 'victory') anim = 'attack';
      if (!this.frames.hero || !this.frames.hero[anim]) anim = 'idle';

      const animList = this.frames.hero[anim] || this.frames.hero.idle;
      const img = animList[frameIdx % animList.length];

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        // Filtro de personalización de color de armadura
        let filterStr = '';
        if (flash) {
          filterStr += 'brightness(2.5) ';
        }
        if (activeTheme === 'gold') {
          filterStr += 'hue-rotate(180deg) saturate(2) ';
        } else if (activeTheme === 'crimson') {
          filterStr += 'hue-rotate(120deg) saturate(1.8) ';
        } else if (activeTheme === 'shadow') {
          filterStr += 'grayscale(0.9) brightness(0.65) ';
        } else if (activeTheme === 'amethyst') {
          filterStr += 'hue-rotate(45deg) saturate(1.7) ';
        } else if (activeTheme === 'emerald') {
          filterStr += 'hue-rotate(250deg) saturate(1.8) ';
        }
        if (filterStr) ctx.filter = filterStr.trim();

        const baseH = (scale / 4) * 115;
        const aspect = img.naturalWidth / img.naturalHeight;
        const baseW = baseH * aspect;

        if (flip) {
          ctx.translate(x + baseW, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, baseW, baseH);
        } else {
          ctx.drawImage(img, x, y, baseW, baseH);
        }
        ctx.restore();
      } else {
        // Fallback procedural nítido
        let matrix = HERO_FRAMES.idle_1;
        if (state === 'idle') {
          matrix = (frameIdx % 2 === 0) ? HERO_FRAMES.idle_1 : HERO_FRAMES.idle_2;
        } else if (state === 'walk') {
          matrix = (frameIdx % 2 === 0) ? HERO_FRAMES.walk_1 : HERO_FRAMES.walk_2;
        } else if (state === 'attack') {
          matrix = (frameIdx % 2 === 0) ? HERO_FRAMES.attack_1 : HERO_FRAMES.attack_2;
        } else if (state === 'defend') {
          matrix = HERO_FRAMES.defend_1;
        } else if (state === 'victory') {
          matrix = HERO_FRAMES.attack_2;
        }
        const overrides = ARMOR_THEMES[activeTheme] || null;
        drawPixelMatrix(ctx, matrix, x, y, scale, flip, flash, overrides);
      }
    }

    // Dibuja el héroe caballero en vista isométrica con 4 direcciones y corte
    drawIsometricHero(ctx, x, y, direction = 'dr', frameIdx = 0, scale = 1.45, flash = false, theme = null) {
      const activeTheme = theme || this.armorTheme;
      let dir = direction;
      if (dir === 'down') dir = 'dr';
      else if (dir === 'up') dir = 'ul';
      else if (dir === 'left') dir = 'dl';
      else if (dir === 'right') dir = 'ur';

      const animList = (this.frames.isoHero && this.frames.isoHero[dir])
        ? this.frames.isoHero[dir]
        : (this.frames.isoHero ? this.frames.isoHero.dr : null);

      const img = animList ? animList[frameIdx % animList.length] : null;

      if (img && img.width > 0 && img.height > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        let filterStr = '';
        if (flash) filterStr += 'brightness(2.5) ';
        if (activeTheme === 'gold') filterStr += 'hue-rotate(180deg) saturate(2) ';
        else if (activeTheme === 'crimson') filterStr += 'hue-rotate(120deg) saturate(1.8) ';
        else if (activeTheme === 'shadow') filterStr += 'grayscale(0.9) brightness(0.65) ';
        else if (activeTheme === 'amethyst') filterStr += 'hue-rotate(45deg) saturate(1.7) ';
        else if (activeTheme === 'emerald') filterStr += 'hue-rotate(250deg) saturate(1.8) ';
        if (filterStr) ctx.filter = filterStr.trim();

        const targetH = 88 * scale;
        const aspect = img.width / img.height;
        const targetW = targetH * aspect;

        // Anclar a los pies del caballero en (x, y)
        ctx.translate(Math.round(x), Math.round(y));
        if (dir === 'ul') ctx.scale(-1, 1);
        ctx.drawImage(img, Math.round(-targetW / 2), Math.round(-targetH * 0.92), Math.round(targetW), Math.round(targetH));
        ctx.restore();
      } else {
        // Fallback al sprite 2D
        this.drawHero(ctx, x - 25, y - 35, 'idle', frameIdx, scale * 2.2, (dir === 'ul' || dir === 'dl'), flash, activeTheme);
      }
    }

    // Dibuja el gato Pixel animado en alta definición
    drawDetailedCat(ctx, x, y, state = 'sit', frameIdx = 0, scale = 1.0, flip = false) {
      const animList = (this.frames.cat && this.frames.cat[state])
        ? this.frames.cat[state]
        : (this.frames.cat ? this.frames.cat.sit : null);

      const img = animList ? animList[frameIdx % animList.length] : null;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Sombra elíptica suave a los pies del gato
        ctx.save();
        ctx.translate(x, y + 2);
        ctx.scale(1, 0.45);
        ctx.beginPath();
        ctx.arc(0, 0, 16 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fill();
        ctx.restore();

        const baseH = 48 * scale;
        const aspect = img.naturalWidth / img.naturalHeight;
        const baseW = baseH * aspect;

        if (flip) {
          ctx.translate(x + baseW / 2, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, -baseH * 0.92, baseW, baseH);
        } else {
          ctx.drawImage(img, x - baseW / 2, y - baseH * 0.92, baseW, baseH);
        }
        ctx.restore();
      } else {
        const matrix = (frameIdx % 2 === 0) ? CAT_FRAMES.idle_1 : CAT_FRAMES.idle_2;
        drawPixelMatrix(ctx, matrix, x - 18, y - 24, scale * 3, flip);
      }
    }

    drawCat(ctx, x, y, frameIdx = 0, scale = 1.0, flip = false, state = 'sit') {
      this.drawDetailedCat(ctx, x, y, state, frameIdx, scale, flip);
    }

    // Dibuja NPCs del gremio con escala, sombra y respiración
    drawNPC(ctx, npcId, x, y, frameIdx = 0, scale = 1.0, bounce = 0) {
      if (!this.frames.npcs) return;
      let img = null;
      const entry = this.frames.npcs[npcId];
      if (Array.isArray(entry)) {
        img = entry[frameIdx % entry.length];
      } else {
        img = entry;
      }

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Sombra isométrica al suelo
        ctx.save();
        ctx.translate(x, y + 6);
        ctx.scale(1, 0.45);
        ctx.beginPath();
        ctx.arc(0, 0, 32 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fill();
        ctx.restore();

        let targetH = 110 * scale;
        if (npcId === 'blacksmith') targetH = 125 * scale;
        else if (npcId === 'alchemist') targetH = 120 * scale;
        else if (npcId === 'receptionist') targetH = 115 * scale;
        else if (npcId === 'priestess') targetH = 130 * scale;
        else if (npcId === 'collector') targetH = 100 * scale;
        else if (npcId === 'owl') targetH = 95 * scale;

        const aspect = img.naturalWidth / img.naturalHeight;
        const targetW = targetH * aspect;

        ctx.drawImage(img, x - targetW / 2, y - targetH * 0.93 + bounce, targetW, targetH);
        ctx.restore();
      }
    }

    // Dibuja el monstruo usando los frames de alta definición
    drawMonster(ctx, x, y, type = 'parcial', state = 'idle', frameIdx = 0, scale = 4, flip = false, flash = false) {
      let actor = 'goblin';
      let anim = state;

      if (type === 'final' || type === 'dragon') {
        actor = 'dragon';
        if (anim === 'attack') anim = 'roar';
        if (anim === 'hit') anim = 'recoil';
      } else if (type === 'tarea' || type === 'entrega' || type === 'slime' || type === 'cursada') {
        actor = 'slime';
        if (anim === 'attack') anim = 'jump';
        if (anim === 'hit') anim = 'recoil';
      } else {
        actor = 'goblin';
        if (anim === 'hit') anim = 'recoil';
      }

      const animList = this.frames[actor] && this.frames[actor][anim] ? this.frames[actor][anim] : (this.frames[actor] ? this.frames[actor].idle : null);
      const img = animList ? animList[frameIdx % animList.length] : null;

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        if (flash) {
          ctx.filter = 'brightness(2.5)';
        }

        let baseH = (scale / 4) * 125;
        if (actor === 'dragon') baseH = (scale / 4) * 165;
        if (actor === 'slime') baseH = (scale / 4) * 85;

        const aspect = img.naturalWidth / img.naturalHeight;
        const baseW = baseH * aspect;

        if (flip) {
          ctx.translate(x + baseW, y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, baseW, baseH);
        } else {
          ctx.drawImage(img, x, y, baseW, baseH);
        }
        ctx.restore();
      } else {
        // Fallback procedural
        if (actor === 'dragon') {
          let matrix = DRAGON_FRAMES.idle_1;
          if (state === 'attack' || state === 'roar') matrix = DRAGON_FRAMES.roar_1;
          else if (state === 'hit' || state === 'recoil') matrix = DRAGON_FRAMES.recoil_1;
          drawPixelMatrix(ctx, matrix, x, y, scale * 1.3, flip, flash);
        } else if (actor === 'slime') {
          let matrix = SLIME_FRAMES.idle_1;
          if (state === 'attack' || state === 'jump') matrix = SLIME_FRAMES.jump_1;
          else if (state === 'hit' || state === 'recoil') matrix = SLIME_FRAMES.recoil_1;
          drawPixelMatrix(ctx, matrix, x, y, scale, flip, flash);
        } else {
          let matrix = GOBLIN_FRAMES.idle_1;
          if (state === 'idle') matrix = (frameIdx % 2 === 0) ? GOBLIN_FRAMES.idle_1 : GOBLIN_FRAMES.idle_2;
          else if (state === 'attack') matrix = GOBLIN_FRAMES.attack_1;
          else if (state === 'hit' || state === 'recoil') matrix = GOBLIN_FRAMES.recoil_1;
          drawPixelMatrix(ctx, matrix, x, y, scale, flip, flash);
        }
      }
    }

    // Dibuja fondo de mazmorra con antorchas y ladrillos en Canvas
    drawDungeonBackground(ctx, width, height, timeTick = 0) {
      // Si la imagen de pasillo está cargada, dibujarla con toque retro
      if (this.imageLoaded.corridor && this.images.corridor) {
        const img = this.images.corridor;
        const scale = Math.max(width / img.width, height / img.height);
        const drawWidth = img.width * scale;
        const drawHeight = img.height * scale;
        ctx.drawImage(img, (width - drawWidth) / 2, (height - drawHeight) * 0.7, drawWidth, drawHeight);
        // Tinte oscuro de ambientación
        ctx.fillStyle = 'rgba(15, 15, 27, 0.45)';
        ctx.fillRect(0, 0, width, height);
        return;
      } else {
        // Fallback procedural de mazmorra 8-bit
        ctx.fillStyle = '#0f0f1b';
        ctx.fillRect(0, 0, width, height);

        // Pared de ladrillos
        ctx.fillStyle = '#1e1e38';
        const brickH = 20;
        const brickW = 40;
        for (let y = 0; y < height - 60; y += brickH) {
          const shift = (Math.floor(y / brickH) % 2 === 0) ? 0 : 20;
          for (let x = -20; x < width + 20; x += brickW) {
            ctx.strokeRect(x + shift, y, brickW, brickH);
            ctx.strokeStyle = '#090910';
            ctx.lineWidth = 2;
          }
        }

        // Suelo de piedra
        ctx.fillStyle = '#2b2b48';
        ctx.fillRect(0, height - 60, width, 60);
        ctx.fillStyle = '#3a3a60';
        ctx.fillRect(0, height - 60, width, 6);
      }

      // Antorchas con fuego animado
      this.drawTorch(ctx, 60, height - 120, timeTick);
      this.drawTorch(ctx, width - 80, height - 120, timeTick + 2);
      if (width > 500) {
        this.drawTorch(ctx, Math.floor(width / 2), height - 130, timeTick + 4);
      }
    }

    drawTorch(ctx, x, y, tick) {
      // Soporte de madera
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 4, y + 16, 8, 20);
      ctx.fillStyle = '#374151';
      ctx.fillRect(x + 2, y + 12, 12, 6);

      // Fuego parpadeante de antorcha (animación pausada y atmosférica)
      const flicker = (Math.sin(tick * 0.08) * 1.5);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + 2 - flicker, y - 4, 12 + flicker * 2, 16);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 4 - flicker * 0.5, y - 8, 8 + flicker, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 6, y - 6, 4, 6);
    }
  }

  // Exportar al ámbito global
  global.RetroAudioEngine = RetroAudioEngine;
  global.SpriteEngine = SpriteEngine;
})(window);
