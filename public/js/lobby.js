// lobby.js - Motor y lógica interactiva del Lobby Isométrico del Gremio 16-Bit con NPCs Vivos
(function (global) {
  'use strict';

  class GuildLobbyEngine {
    constructor(canvas, spriteEngine, onSwitchView, onOpenQuestForge) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.sprites = spriteEngine;
      this.audio = spriteEngine.audio;
      this.onSwitchView = onSwitchView;
      this.onOpenQuestForge = onOpenQuestForge;

      // Dimensiones lógicas virtuales de la sala isométrica (1024x1024)
      this.worldW = 1024;
      this.worldH = 1024;

      // Estado del Héroe en el Lobby Isométrico
      this.hero = {
        x: 580,
        y: 650,
        targetX: null,
        targetY: null,
        speed: 4.2,
        moving: false,
        direction: 'dr', // 'dr' (down-right), 'dl' (down-left), 'ur' (up-right), 'ul' (up-left)
        frame: 0
      };

      // Estado autónomo y animaciones de Pixel el Gato
      this.cat = {
        x: 435,
        y: 605,
        state: 'sit', // 'sit', 'sleep', 'stretch', 'lick'
        frame: 0,
        timer: 180,
        flip: false
      };

      // Partículas y efectos ambientales mejorados
      this.forgeSparks = [];
      this.alchemyBubbles = [];
      this.magicParticles = [];
      this.floatingHearts = [];
      this.dustParticles = [];
      this.fireEmbers = [];
      this.clickMarker = null;
      this.tick = 0;

      // Obstáculos sólidos con colisión física en el gran salón isométrico
      this.obstacles = [
        // Altar central superior de piedra
        { id: 'altar_structure', x: 430, y: 130, width: 164, height: 160 },
        // Gran tablón de madera de misiones (izquierda)
        { id: 'bulletin_board', x: 20, y: 410, width: 120, height: 150 },
        // Mobiliario de descanso / alcoba (esquina superior izquierda)
        { id: 'bedroom_furniture', x: 25, y: 240, width: 110, height: 130 },
        // Estanterías de la biblioteca (muro superior derecho)
        { id: 'bookshelves', x: 530, y: 220, width: 210, height: 170 },
        // Chimenea y hogar de piedra con fuego
        { id: 'fireplace_structure', x: 865, y: 390, width: 115, height: 110 },
        // Yunque de hierro y hornalla de herrería (inferior derecha)
        { id: 'forge_anvil', x: 860, y: 720, width: 125, height: 130 },
        // Mesas de madera y bancos de la taberna (inferior izquierda)
        { id: 'tavern_table_1', x: 35, y: 620, width: 135, height: 75 },
        { id: 'tavern_table_2', x: 200, y: 720, width: 135, height: 75 }
      ];

      // Teclas activas
      this.keys = {};

      // Estaciones / Salas ubicadas con precisión sobre el mapa isométrico 1024x1024
      this.stations = [
        {
          id: 'altar',
          name: 'Altar de la Diosa Minerva',
          shortName: 'Altar Diosa',
          npcTitle: 'Sacerdotisa Minerva',
          npcId: 'priestess',
          icon: '🕊️',
          x: 512,
          y: 220,
          hitbox: { x: 460, y: 128, width: 116, height: 180 },
          approach: { x: 512, y: 449 },
          radius: 70,
          color: '#fbbf24',
          desc: 'Rezar a la Diosa Minerva por claridad en los exámenes.'
        },
        {
          id: 'bedroom',
          name: 'Habitación del Héroe',
          shortName: 'Habitación',
          npcTitle: 'Búho Sabio Archimedes',
          npcId: 'owl',
          icon: '🛏️',
          x: 98,
          y: 326,
          hitbox: { x: 42, y: 249, width: 111, height: 157 },
          approach: { x: 174, y: 391 },
          radius: 65,
          color: '#38bdf8',
          desc: 'Descansar, despejar el estrés y consultar apuntes con el Búho Sabio.'
        },
        {
          id: 'artifacts',
          name: 'Bóveda de Artefactos & Trofeos',
          shortName: 'Artefactos',
          npcTitle: 'Anticuario Grikk',
          npcId: 'collector',
          icon: '🏆',
          x: 884,
          y: 432,
          hitbox: { x: 850, y: 408, width: 77, height: 59 },
          approach: { x: 832, y: 474 },
          radius: 65,
          color: '#facc15',
          desc: 'Contemplar reliquias ganadas en parciales y finales aprobados con el Coleccionista.'
        },
        {
          id: 'board',
          name: 'Tablón de Misiones',
          shortName: 'Tablón',
          npcTitle: 'Recepcionista Vane',
          npcId: 'receptionist',
          icon: '📜',
          x: 512,
          y: 548,
          hitbox: { x: 410, y: 517, width: 208, height: 76 },
          approach: { x: 584, y: 627 },
          radius: 55,
          color: '#f97316',
          desc: 'Consultar exámenes pendientes y forjar nuevas misiones con la Recepcionista.'
        },
        {
          id: 'armory',
          name: 'Armería & Taller de Forja',
          shortName: 'Armería',
          npcTitle: 'Maestro Herrero Brokk',
          npcId: 'blacksmith',
          icon: '⚔️',
          x: 862,
          y: 815,
          hitbox: { x: 769, y: 779, width: 190, height: 78 },
          approach: { x: 880, y: 877 },
          extraZones: [{
            hitbox: { x: 817, y: 464, width: 110, height: 50 },
            approach: { x: 834, y: 540 }
          }],
          radius: 75,
          color: '#ef4444',
          desc: 'Personalizar armadura, armas y equipo del héroe con el Herrero Brokk.'
        },
        {
          id: 'magic',
          name: 'Sala de Magia & Alquimia',
          shortName: 'Alquimia',
          npcTitle: 'Alquimista Elenia',
          npcId: 'alchemist',
          icon: '🔮',
          x: 230,
          y: 690,
          hitbox: { x: 117, y: 586, width: 187, height: 159 },
          approach: { x: 287, y: 782 },
          radius: 75,
          color: '#c084fc',
          desc: 'Elaborar pociones de estudio y brebajes de concentración con la Alquimista.'
        },
        {
          id: 'cat',
          name: 'Gato del Gremio (Pixel)',
          shortName: 'Pixel el Gato',
          icon: '🐱',
          x: 435,
          y: 605,
          hitbox: { x: 410, y: 570, width: 52, height: 55 },
          approach: { x: 435, y: 652 },
          radius: 40,
          color: '#fb923c',
          desc: 'Acariciar al fiel gatito del gremio.'
        },
        {
          id: 'portal',
          name: 'Portal a las Mazmorras',
          shortName: 'Portal Calendario',
          icon: '🌀',
          x: 512,
          y: 988,
          hitbox: { x: 439, y: 953, width: 150, height: 71 },
          approach: { x: 512, y: 932 },
          radius: 70,
          color: '#a855f7',
          desc: 'Teletransportarse al calendario de parciales y finales.'
        }
      ];

      this.stations.forEach(station => {
        station.zones = [{ hitbox: station.hitbox, approach: station.approach }, ...(station.extraZones || [])];
      });

      this.nearestStation = null;
      this.hoveredStation = null;
      this.hoveredZone = null;
      this.nearestZone = null;
      this.pendingStationId = null;

      this.initEvents();
      this.initParticles();
    }

    initParticles() {
      // Partículas mágicas ambientales en el altar y laboratorio
      for (let i = 0; i < 20; i++) {
        this.magicParticles.push({
          x: 512 + (Math.random() * 80 - 40),
          y: 220 + (Math.random() * 40 - 20),
          type: 'gold',
          speedY: 0.3 + Math.random() * 0.4,
          life: Math.random() * 100,
          maxLife: 100
        });
        this.magicParticles.push({
          x: 230 + (Math.random() * 80 - 40),
          y: 690 + (Math.random() * 40 - 20),
          type: 'purple',
          speedY: 0.3 + Math.random() * 0.4,
          life: Math.random() * 100,
          maxLife: 100
        });
      }
    }

    initEvents() {
      // Eventos de teclado para movimiento
      window.addEventListener('keydown', (e) => {
        if (document.body.dataset.view !== 'lobby' || document.querySelector('.modal-overlay.open')) return;
        if (e.target.closest('button, a, input, textarea, select')) return;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        const k = e.key.toLowerCase();
        if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(k)) {
          this.keys[k] = true;
          this.hero.targetX = null;
          this.hero.targetY = null;
          this.pendingStationId = null;
          e.preventDefault();
        } else if ([' ', 'enter', 'e'].includes(k)) {
          if (this.nearestStation) {
            this.interactWithStation(this.nearestStation.id);
            e.preventDefault();
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        delete this.keys[k];
      });
      window.addEventListener('blur', () => { this.keys = {}; });

      // Clic en el Canvas para moverse o interactuar
      if (this.canvas) {
        this.canvas.addEventListener('pointermove', e => {
          const point = this.canvasPoint(e);
          this.hoveredStation = this.stationAt(point.x, point.y);
          this.hoveredZone = this.hoveredStation?.zones.find(zone => this.contains(zone.hitbox, point.x, point.y)) || null;
          this.canvas.style.cursor = this.hoveredStation ? 'pointer' : 'crosshair';
        });
        this.canvas.addEventListener('pointerleave', () => {
          this.hoveredStation = null;
          this.hoveredZone = null;
        });
        this.canvas.addEventListener('click', (e) => {
          this.canvas.focus({ preventScroll: true });
          const { x: clickX, y: clickY } = this.canvasPoint(e);

          const clickedStation = this.stationAt(clickX, clickY);
          if (clickedStation) {
            this.goToStation(clickedStation.id, { x: clickX, y: clickY });
          } else {
            this.cancelMovement();
            this.hero.targetX = Math.max(140, Math.min(this.worldW - 140, clickX));
            this.hero.targetY = Math.max(180, Math.min(this.worldH - 70, clickY));
            this.pendingStationId = null;
            this.clickMarker = { x: clickX, y: clickY, life: 25, color: '#f59e0b' };
            this.audio.playStep();
          }
        });
      }
    }

    contains(box, x, y) {
      return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
    }

    canvasPoint(e) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (this.worldW / rect.width),
        y: (e.clientY - rect.top) * (this.worldH / rect.height)
      };
    }

    stationAt(x, y) {
      return this.stations.find(st => st.zones.some(zone => this.contains(zone.hitbox, x, y))) || null;
    }

    approachPoint(station, fromX = this.hero.x, fromY = this.hero.y) {
      let best = station.zones[0].approach;
      let minD = Infinity;
      station.zones.forEach(zone => {
        const d = Math.hypot(zone.approach.x - fromX, zone.approach.y - fromY);
        if (d < minD) {
          minD = d;
          best = zone.approach;
        }
      });
      return best;
    }

    goToStation(id, clickedPoint = null) {
      const station = this.stations.find(st => st.id === id);
      if (!station) return;
      const clickedZone = clickedPoint && station.zones.find(zone => this.contains(zone.hitbox, clickedPoint.x, clickedPoint.y));
      const approach = clickedZone ? clickedZone.approach : this.approachPoint(station);
      this.cancelMovement();
      this.hero.targetX = approach.x;
      this.hero.targetY = approach.y;
      this.pendingStationId = station.id;
      this.clickMarker = { x: approach.x, y: approach.y, life: 25, color: station.color };
      this.audio.playStep();
    }

    cancelMovement() {
      this.keys = {};
      this.hero.targetX = null;
      this.hero.targetY = null;
      this.hero.moving = false;
      this.pendingStationId = null;
      this.clickMarker = null;
    }

    // Comprueba colisiones con paredes perimetrales y mobiliario sólido del salón
    isBlocked(x, y, radius = 16) {
      // 1. Límites perimetrales de la sala
      if (x - radius < 140 || x + radius > this.worldW - 140) return true;
      if (y - radius < 180 || y + radius > this.worldH - 70) return true;

      // 2. Esquinas diagonales isométricas
      if ((460 - x) * 0.7 + (220 - y) > -radius) return true;
      if ((x - 564) * 0.7 + (220 - y) > -radius) return true;

      // 3. Muebles y elementos arquitectónicos sólidos
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        if (
          x + radius > obs.x &&
          x - radius < obs.x + obs.width &&
          y + radius > obs.y &&
          y - radius < obs.y + obs.height
        ) {
          return true;
        }
      }
      return false;
    }

    // Actualiza movimiento, física de colisiones y efectos ambientales
    update() {
      this.tick++;
      if (document.querySelector('.modal-overlay.open')) {
        this.cancelMovement();
        return;
      }
      let dx = 0;
      let dy = 0;

      // Movimiento por teclado con soporte isométrico y colisiones
      if (this.keys['arrowup'] || this.keys['w']) dy -= 1;
      if (this.keys['arrowdown'] || this.keys['s']) dy += 1;
      if (this.keys['arrowleft'] || this.keys['a']) dx -= 1;
      if (this.keys['arrowright'] || this.keys['d']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const stepX = (dx / len) * this.hero.speed;
        const stepY = (dy / len) * this.hero.speed;
        const nextX = this.hero.x + stepX;
        const nextY = this.hero.y + stepY;

        // Deslizamiento suave sobre paredes u obstáculos sólidos
        if (!this.isBlocked(nextX, nextY)) {
          this.hero.x = nextX;
          this.hero.y = nextY;
        } else if (!this.isBlocked(nextX, this.hero.y)) {
          this.hero.x = nextX;
        } else if (!this.isBlocked(this.hero.x, nextY)) {
          this.hero.y = nextY;
        }
        this.hero.moving = true;

        // Partículas de polvo de pasos al caminar
        if (this.tick % 10 === 0) {
          this.dustParticles.push({
            x: this.hero.x + (Math.random() * 8 - 4),
            y: this.hero.y + 2,
            vx: -stepX * 0.12 + (Math.random() - 0.5) * 0.2,
            vy: -stepY * 0.12 - Math.random() * 0.2,
            radius: 2 + Math.random() * 1.5,
            life: 18,
            maxLife: 18
          });
        }

        if (dx > 0 && dy >= 0) this.hero.direction = 'dr';
        else if (dx < 0 && dy >= 0) this.hero.direction = 'dl';
        else if (dx > 0 && dy < 0) this.hero.direction = 'ur';
        else if (dx < 0 && dy < 0) this.hero.direction = 'ul';
        else if (dx === 0 && dy > 0) this.hero.direction = 'dr';
        else if (dx === 0 && dy < 0) this.hero.direction = 'ur';
      } else if (this.hero.targetX !== null && this.hero.targetY !== null) {
        const toX = this.hero.targetX - this.hero.x;
        const toY = this.hero.targetY - this.hero.y;
        const dist = Math.hypot(toX, toY);

        if (dist > 5) {
          const stepX = (toX / dist) * this.hero.speed;
          const stepY = (toY / dist) * this.hero.speed;
          this.hero.x += stepX;
          this.hero.y += stepY;
          this.hero.moving = true;

          // Partículas de pasos
          if (this.tick % 10 === 0) {
            this.dustParticles.push({
              x: this.hero.x + (Math.random() * 8 - 4),
              y: this.hero.y + 2,
              vx: -stepX * 0.12 + (Math.random() - 0.5) * 0.2,
              vy: -stepY * 0.12 - Math.random() * 0.2,
              radius: 2 + Math.random() * 1.5,
              life: 18,
              maxLife: 18
            });
          }

          if (toX >= 0 && toY >= 0) this.hero.direction = 'dr';
          else if (toX < 0 && toY >= 0) this.hero.direction = 'dl';
          else if (toX >= 0 && toY < 0) this.hero.direction = 'ur';
          else if (toX < 0 && toY < 0) this.hero.direction = 'ul';
        } else {
          this.hero.x = this.hero.targetX;
          this.hero.y = this.hero.targetY;
          this.hero.moving = false;
          this.hero.targetX = null;
          this.hero.targetY = null;

          const stationId = this.pendingStationId;
          this.pendingStationId = null;
          if (stationId) this.interactWithStation(stationId);
        }
      } else {
        this.hero.moving = false;
      }

      // Restricciones perimetrales de sala (paredes del castillo isométrico)
      this.hero.x = Math.max(140, Math.min(this.worldW - 140, this.hero.x));
      this.hero.y = Math.max(180, Math.min(this.worldH - 70, this.hero.y));

      // Actualizar partículas de polvo de pasos
      for (let i = this.dustParticles.length - 1; i >= 0; i--) {
        const d = this.dustParticles[i];
        d.x += d.vx;
        d.y += d.vy;
        d.life--;
        if (d.life <= 0) this.dustParticles.splice(i, 1);
      }

      // Actualizar ascuas de la chimenea
      if (this.tick % 7 === 0) {
        this.fireEmbers.push({
          x: 808 + (Math.random() * 16 - 8),
          y: 468,
          vx: (Math.random() - 0.5) * 0.5,
          vy: -0.7 - Math.random() * 0.8,
          radius: 1.5 + Math.random() * 1.2,
          life: 40,
          maxLife: 40,
          color: Math.random() > 0.35 ? '#fbbf24' : '#f97316'
        });
      }
      for (let i = this.fireEmbers.length - 1; i >= 0; i--) {
        const e = this.fireEmbers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.life--;
        if (e.life <= 0) this.fireEmbers.splice(i, 1);
      }

      // Frames de animación del héroe (4 frames por ciclo, velocidad pausada 16-bit)
      if (this.hero.moving) {
        if (this.tick % 15 === 0) {
          this.hero.frame = (this.hero.frame + 1) % 4;
        }
      } else {
        this.hero.frame = 0;
      }

      // Detectar estación más cercana
      let closest = null;
      let closestZone = null;
      let minD = 9999;
      for (const st of this.stations) {
        for (const zone of st.zones) {
          const d = Math.hypot(zone.approach.x - this.hero.x, zone.approach.y - this.hero.y);
          if (d < minD) {
            minD = d;
            closest = st;
            closestZone = zone;
          }
        }
      }

      if (closest && minD <= 55) {
        this.nearestStation = closest;
        this.nearestZone = closestZone;
      } else {
        this.nearestStation = null;
        this.nearestZone = null;
      }

      // Marcador de clic
      if (this.clickMarker) {
        this.clickMarker.life--;
        if (this.clickMarker.life <= 0) this.clickMarker = null;
      }

      // Corazones flotantes
      for (let i = this.floatingHearts.length - 1; i >= 0; i--) {
        const h = this.floatingHearts[i];
        h.y -= 1.2;
        h.life--;
        if (h.life <= 0) this.floatingHearts.splice(i, 1);
      }

      // Partículas mágicas
      this.magicParticles.forEach(p => {
        p.y -= p.speedY;
        p.life--;
        if (p.life <= 0) {
          p.life = p.maxLife;
          if (p.type === 'gold') {
            p.x = 512 + (Math.random() * 80 - 40);
            p.y = 220 + (Math.random() * 20 - 10);
          } else {
            p.x = 230 + (Math.random() * 80 - 40);
            p.y = 690 + (Math.random() * 20 - 10);
          }
        }
      });

      // Comportamiento autónomo del gato Pixel
      this.cat.timer--;
      if (this.cat.timer <= 0) {
        const states = ['sit', 'sleep', 'stretch', 'lick'];
        const weights = [0.4, 0.25, 0.15, 0.2];
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < states.length; i++) {
          acc += weights[i];
          if (r <= acc) {
            this.cat.state = states[i];
            break;
          }
        }
        this.cat.timer = 140 + Math.floor(Math.random() * 220);
        if (Math.random() < 0.3) this.cat.flip = !this.cat.flip;
      }
      const catSpeed = this.cat.state === 'sleep' ? 36 : 22;
      this.cat.frame = Math.floor(this.tick / catSpeed) % 4;

      // Chispas del yunque del herrero Brokk
      if (this.tick % 16 === 0) {
        this.forgeSparks.push({
          x: 848 + (Math.random() * 24 - 12),
          y: 775 + (Math.random() * 10 - 5),
          vx: (Math.random() - 0.5) * 2,
          vy: -1.2 - Math.random() * 1.5,
          color: Math.random() > 0.4 ? '#fbbf24' : '#f97316',
          life: 30,
          maxLife: 30
        });
      }
      for (let i = this.forgeSparks.length - 1; i >= 0; i--) {
        const s = this.forgeSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.12;
        s.life--;
        if (s.life <= 0) this.forgeSparks.splice(i, 1);
      }

      // Burbujas alquímicas de la mesa de pociones de Elenia
      if (this.tick % 20 === 0) {
        this.alchemyBubbles.push({
          x: 220 + (Math.random() * 26 - 13),
          y: 630,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.5 - Math.random() * 0.4,
          color: Math.random() > 0.5 ? '#c084fc' : '#38bdf8',
          radius: 2 + Math.random() * 3,
          life: 60,
          maxLife: 60
        });
      }
      for (let i = this.alchemyBubbles.length - 1; i >= 0; i--) {
        const b = this.alchemyBubbles[i];
        b.x += b.vx;
        b.y += b.vy;
        b.life--;
        if (b.life <= 0) this.alchemyBubbles.splice(i, 1);
      }
    }

    // Renderiza el lobby en el Canvas
    render() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;

      // 1. Fondo Isométrico del Gran Salón del Gremio
      if (this.sprites.imageLoaded.lobby_isometric && this.sprites.images.lobby_isometric) {
        ctx.drawImage(this.sprites.images.lobby_isometric, 0, 0, this.worldW, this.worldH);
      } else if (this.sprites.imageLoaded.lobby_bg && this.sprites.images.lobby_bg) {
        ctx.drawImage(this.sprites.images.lobby_bg, 0, 0, this.worldW, this.worldH);
      } else {
        ctx.fillStyle = '#0f0f1b';
        ctx.fillRect(0, 0, this.worldW, this.worldH);
      }

      // 2. Partículas mágicas ambientales
      this.magicParticles.forEach(p => {
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.7;
        ctx.fillStyle = p.type === 'gold' ? `rgba(251, 191, 36, ${alpha})` : `rgba(192, 132, 252, ${alpha})`;
        ctx.fillRect(p.x, p.y, 3, 3);
      });

      // 3. Resaltado de muebles y estaciones
      this.stations.forEach(st => {
        st.zones.forEach(zone => {
          const box = zone.hitbox;
          const hovered = this.hoveredZone === zone;
          const active = hovered || this.nearestZone === zone;
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          if (hovered) {
            ctx.save();
            ctx.fillStyle = 'rgba(239, 255, 0, 0.12)';
            ctx.fillRect(box.x, box.y, box.width, box.height);
            ctx.strokeStyle = '#efff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            ctx.restore();
          } else if (active) {
            ctx.fillStyle = 'rgba(219, 183, 109, 0.12)';
            ctx.fillRect(box.x, box.y, box.width, box.height);
            ctx.strokeStyle = '#dbb76d';
            ctx.lineWidth = 2;
            const corner = 12;
            for (const [x, y, sx, sy] of [
              [box.x, box.y, 1, 1], [box.x + box.width, box.y, -1, 1],
              [box.x, box.y + box.height, 1, -1], [box.x + box.width, box.y + box.height, -1, -1]
            ]) {
              ctx.beginPath();
              ctx.moveTo(x + sx * corner, y);
              ctx.lineTo(x, y);
              ctx.lineTo(x, y + sy * corner);
              ctx.stroke();
            }
          }
          ctx.font = "15px 'VT323', monospace";
          const text = st.shortName;
          const labelWidth = ctx.measureText(text).width + 18;
          const centerX = Math.max(labelWidth / 2 + 8, Math.min(this.worldW - labelWidth / 2 - 8, box.x + box.width / 2));
          const labelY = Math.max(8, box.y - 24);
          ctx.fillStyle = active ? '#303629' : 'rgba(20, 25, 23, .88)';
          ctx.fillRect(centerX - labelWidth / 2, labelY, labelWidth, 21);
          ctx.strokeStyle = hovered ? '#efff00' : active ? '#dbb76d' : '#515c46';
          ctx.strokeRect(centerX - labelWidth / 2, labelY, labelWidth, 21);
          ctx.fillStyle = hovered ? '#efff00' : active ? '#edcf88' : '#dedec8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, centerX, labelY + 11);
          ctx.restore();
        });
      });

      // 4. Marcador de destino animado en el piso (brújula arcana dorada de 16 bits)
      if (this.clickMarker) {
        ctx.save();
        ctx.translate(this.clickMarker.x, this.clickMarker.y);
        ctx.scale(1, 0.55);
        const progress = Math.max(0, 1 - (this.clickMarker.life / 25));
        const alpha = Math.sin((1 - progress) * Math.PI * 0.5);
        const spin = this.tick * 0.05;

        // Anillo exterior pulsante
        ctx.strokeStyle = `rgba(245, 158, 11, ${alpha * 0.9})`;
        ctx.lineWidth = 2.5;
        const outerR = 12 + progress * 16;
        ctx.beginPath();
        ctx.arc(0, 0, outerR, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo interior brillante
        ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();

        // 4 diamantes cardinales
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        for (let i = 0; i < 4; i++) {
          const angle = spin + (i * Math.PI) / 2;
          const px = Math.cos(angle) * (outerR + 2);
          const py = Math.sin(angle) * (outerR + 2);
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
        ctx.restore();
      }

      // 5. Animación de chimenea de piedra y fuego (x: 808, y: 470)
      const fireBaseX = 808;
      const fireBaseY = 472;
      const flicker1 = Math.sin(this.tick * 0.12) * 2;
      const flicker2 = Math.cos(this.tick * 0.15) * 1.5;

      ctx.save();
      // Resplandor cálido ambiental sobre el piso
      const glowGrad = ctx.createRadialGradient(fireBaseX, fireBaseY, 3, fireBaseX, fireBaseY, 48);
      glowGrad.addColorStop(0, 'rgba(249, 115, 22, 0.28)');
      glowGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.1)');
      glowGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(fireBaseX, fireBaseY, 48, 0, Math.PI * 2);
      ctx.fill();

      // Llamas ardientes en el hogar
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(fireBaseX - 10 + flicker2, fireBaseY - 14, 20 - flicker2, 16);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(fireBaseX - 8 + flicker1, fireBaseY - 16, 16 - flicker1, 14);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(fireBaseX - 5 - flicker2, fireBaseY - 18, 10 + flicker2, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fireBaseX - 2, fireBaseY - 14, 4, 8);
      ctx.restore();

      // Ascuas flotantes de la chimenea
      this.fireEmbers.forEach(e => {
        const alpha = (e.life / e.maxLife) * 0.85;
        ctx.fillStyle = e.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(e.x, e.y, e.radius, e.radius);
      });
      ctx.globalAlpha = 1.0;

      // 6. Antorchas en candelabros de pared
      const torchSconces = [
        { x: 180, y: 382 },
        { x: 345, y: 298 },
        { x: 980, y: 472 }
      ];
      torchSconces.forEach((ts, idx) => {
        const tf = Math.sin(this.tick * 0.1 + idx) * 1.2;
        ctx.save();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.beginPath();
        ctx.arc(ts.x, ts.y - 6, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.fillRect(ts.x - 3 + tf, ts.y - 12, 6, 8);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(ts.x - 1.5 + tf * 0.5, ts.y - 14, 3, 6);
        ctx.restore();
      });

      // 7. Partículas de polvo de pasos a los pies del héroe
      this.dustParticles.forEach(d => {
        const alpha = (d.life / d.maxLife) * 0.45;
        ctx.fillStyle = `rgba(180, 170, 150, ${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. Renderizado del Héroe en el Gran Salón (sin otros personajes en el fondo)
      const idleBob = (!this.hero.moving) ? Math.sin(this.tick * 0.06) * 1.5 : 0;

      // Sombra isométrica a los pies del Héroe
      ctx.save();
      ctx.translate(this.hero.x, this.hero.y);
      ctx.scale(1, 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fill();
      ctx.restore();

      // Dibujar al Héroe con animación fluida de 16 bits
      this.sprites.drawIsometricHero(
        ctx,
        this.hero.x,
        this.hero.y + idleBob,
        this.hero.direction,
        this.hero.frame,
        1.5,
        false,
        this.sprites.armorTheme
      );

      // 6. Chispas del yunque en la armería
      this.forgeSparks.forEach(s => {
        const alpha = s.life / s.maxLife;
        ctx.fillStyle = s.color || '#fbbf24';
        ctx.globalAlpha = alpha;
        ctx.fillRect(s.x, s.y, 3, 3);
      });
      ctx.globalAlpha = 1.0;

      // 7. Burbujas alquímicas en la mesa de pociones
      this.alchemyBubbles.forEach(b => {
        const alpha = (b.life / b.maxLife) * 0.75;
        ctx.fillStyle = b.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // 8. Corazones flotantes
      this.floatingHearts.forEach(h => {
        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.fillText('❤️', h.x, h.y);
        ctx.restore();
      });

      // 9. Globo HUD de Interacción si está cerca de una estación
      if (this.nearestStation) {
        const st = this.nearestStation;
        ctx.save();
        ctx.fillStyle = '#090914';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;

        const tipText = st.npcTitle ? `[ESPACIO] ${st.npcTitle}` : `[ESPACIO] ${st.shortName}`;
        ctx.font = "10px 'Press Start 2P', monospace";
        const tw = ctx.measureText(tipText).width + 20;
        const bx = Math.max(16, Math.min(this.worldW - tw - 16, st.x - tw / 2));
        const by = Math.max(16, this.nearestZone.hitbox.y - 58);

        ctx.fillRect(bx, by, tw, 26);
        ctx.strokeRect(bx, by, tw, 26);

        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tipText, bx + 10, by + 13);
        ctx.restore();
      }
    }

    // Interacción activa con una estación
    interactWithStation(stationId) {
      this.audio.playBlip();

      switch (stationId) {
        case 'altar':
          this.openGoddessModal();
          break;
        case 'armory':
          this.openArmoryModal();
          break;
        case 'bedroom':
          this.openBedroomModal();
          break;
        case 'magic':
          this.openMagicModal();
          break;
        case 'artifacts':
          this.openArtifactsModal();
          break;
        case 'board':
          if (this.onOpenQuestForge) this.onOpenQuestForge();
          break;
        case 'cat':
          this.petCat();
          break;
        case 'portal':
          if (this.onSwitchView) this.onSwitchView('day');
          break;
      }
    }

    petCat() {
      this.cat.state = 'lick';
      this.cat.timer = 150;
      this.audio.playCatMeow();
      for (let i = 0; i < 6; i++) {
        this.floatingHearts.push({
          x: this.cat.x + (Math.random() * 40 - 20),
          y: this.cat.y - 30,
          life: 45
        });
      }
      const catPhrases = [
        '¡Pixel ronronea y se limpia las patitas! Sientes una bendición de concentración.',
        '¡Miau! Pixel frota su cabecita contra tus botas y bosteza con ternura.',
        'Pixel te mira fijamente... ¡Seguro apruebas con 10 en tu próximo examen!',
        '¡Pixel amasa sobre tus apuntes de estudio!'
      ];
      const pick = catPhrases[Math.floor(Math.random() * catPhrases.length)];
      alert(`🐱 [Pixel el Gato del Gremio]:\n\n"${pick}"`);
    }

    openGoddessModal() {
      const modal = document.getElementById('goddessModal');
      if (modal) modal.classList.add('open');
    }

    openArmoryModal() {
      const modal = document.getElementById('armoryModal');
      if (modal) {
        modal.classList.add('open');
        this.renderArmoryPreview();
      }
    }

    renderArmoryPreview() {
      const previewCanvas = document.getElementById('armoryPreviewCanvas');
      if (!previewCanvas) return;
      const pctx = previewCanvas.getContext('2d');
      pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
      pctx.fillStyle = '#0e0e1c';
      pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

      this.sprites.drawIsometricHero(
        pctx,
        previewCanvas.width / 2,
        previewCanvas.height * 0.85,
        'dr',
        0,
        1.7,
        false,
        this.sprites.armorTheme
      );
    }

    openBedroomModal() {
      const modal = document.getElementById('bedroomModal');
      if (modal) modal.classList.add('open');
    }

    openMagicModal() {
      const modal = document.getElementById('magicModal');
      if (modal) modal.classList.add('open');
    }

    openArtifactsModal() {
      const modal = document.getElementById('artifactsModal');
      if (modal) modal.classList.add('open');
    }
  }

  global.GuildLobbyEngine = GuildLobbyEngine;
})(window);
