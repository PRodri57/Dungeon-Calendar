// app.js - Lógica principal de Órbita: Dungeon Calendar 8-Bit con Lobby Interactivo
(function () {
  'use strict';

  // --- ESTADO GLOBAL ---
  const state = {
    view: 'month',
    currentDate: new Date(),
    selectedHour: new Date().getHours(),
    exams: [],
    schedules: [],
    activeQuest: null,
    hero: {
      x: 100,
      y: 110,
      state: 'idle',
      frame: 0,
      scale: 4,
      flash: false
    },
    monster: {
      x: 280,
      y: 110,
      state: 'idle',
      type: 'parcial', // 'parcial' | 'final' | 'tarea'
      frame: 0,
      scale: 4,
      flash: false
    },
    autoFight: false,
    autoFightTimer: null,
    floatingTexts: [],
    tick: 0,
    lvl: 1,
    gold: 150,
    goldSpent: Math.max(0, Number(localStorage.getItem('dungeon_gold_spent')) || 0),
    selectedArmorTheme: 'classic'
  };

  // Inicializar motor de sprites y audio
  const spriteEngine = new window.SpriteEngine();
  const audio = spriteEngine.audio;
  audio.enabled = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let noticeTimer;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }
  function isComplete(q) {
    return q.status === 'aprobado' || q.status === 'completado';
  }
  const TYPE_LABELS = { parcial: 'Parcial', final: 'Final', tarea: 'Tarea / TP', entrega: 'Entrega', cursada: 'Clase' };
  function spriteMarkup(type) {
    const actor = type === 'final' ? 'dragon' : type === 'parcial' ? 'goblin' : 'slime';
    return '<img src="/assets/sprites/frames/' + actor + '_idle_0.png" alt="" loading="lazy">';
  }
  function notify(message) {
    const notice = document.getElementById('appNotice');
    notice.textContent = message;
    notice.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { notice.hidden = true; }, 7000);
  }
  window.addEventListener('dungeon-notice', e => notify(e.detail));
  function selectQuest(id) {
    const quest = state.exams.find(q => String(q.id) === String(id));
    if (!quest) return;
    state.activeQuest = quest;
    state.monster.state = 'idle';
    updateBattleDeck();
    renderAgenda();
  }
  function selectDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    state.currentDate = new Date(y, m - 1, d);
    syncActiveQuest();
    renderAllViews();
  }
  function shiftMonth(amount) {
    const date = state.currentDate;
    const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
    target.setDate(Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    state.currentDate = target;
    syncActiveQuest();
    renderAllViews();
  }
  function shiftYear(amount) {
    const date = state.currentDate;
    const target = new Date(date.getFullYear() + amount, date.getMonth(), 1);
    target.setDate(Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    state.currentDate = target;
    syncActiveQuest();
    renderAllViews();
  }

  // Cargar tema de armadura guardado
  const savedArmorTheme = localStorage.getItem('dungeon_armor_theme') || 'classic';
  state.selectedArmorTheme = savedArmorTheme;
  spriteEngine.setArmorTheme(savedArmorTheme);

  // --- ELEMENTOS DEL DOM ---
  const dom = {
    body: document.body,
    crtToggle: document.getElementById('crtToggle'),
    soundToggle: document.getElementById('soundToggle'),
    bestiaryBtn: document.getElementById('bestiaryBtn'),
    newQuestBtn: document.getElementById('newQuestBtn'),
    seedBtn: document.getElementById('seedBtn'),

    // HUD Stats
    hudLvl: document.getElementById('hudLvl'),
    hudExp: document.getElementById('hudExp'),
    hudGold: document.getElementById('hudGold'),
    hudClock: document.getElementById('hudClock'),

    // Pestañas y Paneles
    viewTabs: document.querySelectorAll('.view-tab'),
    battleArenaCard: document.getElementById('battleArenaCard'),
    panels: {
      lobby: document.getElementById('panelLobby'),
      day: document.getElementById('panelDay'),
      week: document.getElementById('panelWeek'),
      month: document.getElementById('panelMonth'),
      year: document.getElementById('panelYear')
    },

    // Lobby Elements
    lobbyCanvas: document.getElementById('lobbyCanvas'),
    quickBtnAltar: document.getElementById('quickBtnAltar'),
    quickBtnArmory: document.getElementById('quickBtnArmory'),
    quickBtnBedroom: document.getElementById('quickBtnBedroom'),
    quickBtnMagic: document.getElementById('quickBtnMagic'),
    quickBtnArtifacts: document.getElementById('quickBtnArtifacts'),
    quickBtnCat: document.getElementById('quickBtnCat'),
    quickBtnPortal: document.getElementById('quickBtnPortal'),

    // D-Pad
    dpadUp: document.getElementById('dpadUp'),
    dpadDown: document.getElementById('dpadDown'),
    dpadLeft: document.getElementById('dpadLeft'),
    dpadRight: document.getElementById('dpadRight'),
    dpadAction: document.getElementById('dpadAction'),

    // Battle Arena
    battleCanvas: document.getElementById('battleCanvas'),
    dialogueSpeaker: document.getElementById('dialogueSpeaker'),
    dialogueText: document.getElementById('dialogueText'),
    questInfoMeta: document.getElementById('questInfoMeta'),
    btnAttack: document.getElementById('btnAttack'),
    btnDefend: document.getElementById('btnDefend'),
    btnSpell: document.getElementById('btnSpell'),
    btnAutoFight: document.getElementById('btnAutoFight'),
    btnApprove: document.getElementById('btnApprove'),
    btnDeleteQuest: document.getElementById('btnDeleteQuest'),

    // Day View
    dayTitle: document.getElementById('dayTitle'),
    dayTrack: document.getElementById('dayTrack'),
    btnPrevDay: document.getElementById('btnPrevDay'),
    btnTodayDay: document.getElementById('btnTodayDay'),
    btnNextDay: document.getElementById('btnNextDay'),

    // Week View
    weekTitle: document.getElementById('weekTitle'),
    weekChambers: document.getElementById('weekChambers'),
    btnPrevWeek: document.getElementById('btnPrevWeek'),
    btnTodayWeek: document.getElementById('btnTodayWeek'),
    btnNextWeek: document.getElementById('btnNextWeek'),

    // Month View
    monthTitle: document.getElementById('monthTitle'),
    monthTiles: document.getElementById('monthTiles'),
    btnPrevMonth: document.getElementById('btnPrevMonth'),
    btnTodayMonth: document.getElementById('btnTodayMonth'),
    btnNextMonth: document.getElementById('btnNextMonth'),

    // Year View
    yearTitle: document.getElementById('yearTitle'),
    yearFill: document.getElementById('yearFill'),
    yearProgressText: document.getElementById('yearProgressText'),
    yearBossStats: document.getElementById('yearBossStats'),
    yearCastles: document.getElementById('yearCastles'),
    btnPrevYear: document.getElementById('btnPrevYear'),
    btnNextYear: document.getElementById('btnNextYear'),

    // Modales de Salas
    goddessModal: document.getElementById('goddessModal'),
    btnCloseGoddess: document.getElementById('btnCloseGoddess'),
    btnPrayGoddess: document.getElementById('btnPrayGoddess'),
    btnOfferGold: document.getElementById('btnOfferGold'),
    goddessOracleText: document.getElementById('goddessOracleText'),

    armoryModal: document.getElementById('armoryModal'),
    btnCloseArmory: document.getElementById('btnCloseArmory'),
    armoryPreviewCanvas: document.getElementById('armoryPreviewCanvas'),
    armorThemeSwatches: document.getElementById('armorThemeSwatches'),
    armoryThemeLabel: document.getElementById('armoryThemeLabel'),
    btnSaveArmory: document.getElementById('btnSaveArmory'),

    bedroomModal: document.getElementById('bedroomModal'),
    btnCloseBedroom: document.getElementById('btnCloseBedroom'),
    btnRestHero: document.getElementById('btnRestHero'),
    btnStudyTip: document.getElementById('btnStudyTip'),
    bedroomStatusText: document.getElementById('bedroomStatusText'),

    magicModal: document.getElementById('magicModal'),
    btnCloseMagic: document.getElementById('btnCloseMagic'),

    artifactsModal: document.getElementById('artifactsModal'),
    btnCloseArtifacts: document.getElementById('btnCloseArtifacts'),
    artifactsVaultGrid: document.getElementById('artifactsVaultGrid'),

    // Modales Generales
    questModal: document.getElementById('questModal'),
    questForm: document.getElementById('questForm'),
    btnCancelQuest: document.getElementById('btnCancelQuest'),
    bestiaryModal: document.getElementById('bestiaryModal'),
    btnCloseBestiary: document.getElementById('btnCloseBestiary')
  };

  const battleCtx = dom.battleCanvas ? dom.battleCanvas.getContext('2d') : null;

  // Instanciar Motor de Lobby
  let lobbyEngine = null;
  if (dom.lobbyCanvas && window.GuildLobbyEngine) {
    lobbyEngine = new window.GuildLobbyEngine(
      dom.lobbyCanvas,
      spriteEngine,
      (targetView) => switchView(targetView),
      () => {
        if (dom.newQuestBtn) dom.newQuestBtn.click();
      }
    );
  }

  // --- HELPERS DE FECHA ---
  function pad(n) { return String(n).padStart(2, '0'); }
  function formatDateKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // --- GESTOR DE DATOS 100% CLIENT-SIDE (LOCALSTORAGE) ---
  const DEFAULT_EXAMS = [
    { id: 1, subject: 'Parcial: Algoritmos y Estructuras', date: '2026-10-04', time: '10:00', type: 'parcial', location: 'Mazmorra Sala 3', topics: 'Árboles binarios, Grafos, Dijkstra', status: 'pendiente' },
    { id: 2, subject: 'Misión: Entrega TP Laboratorio', date: '2026-10-04', time: '16:30', type: 'tarea', location: 'Gremio de Alquimia', topics: 'Código fuente y pruebas unitarias', status: 'pendiente' },
    { id: 3, subject: 'Parcial: Sistemas Operativos', date: '2026-10-08', time: '19:00', type: 'parcial', location: 'Torre Norte 4-5', topics: 'Procesos, Hilos, Semáforos, Memoria Virtual', status: 'pendiente' },
    { id: 4, subject: 'Parcial: Bases de Datos', date: '2026-10-15', time: '18:00', type: 'parcial', location: 'Cripta de Datos', topics: 'SQL, Normalización, Índices B-Tree', status: 'pendiente' },
    { id: 5, subject: 'Parcial: Análisis Matemático II', date: '2026-10-22', time: '09:00', type: 'parcial', location: 'Torre Este 12', topics: 'Integrales dobles, Gradiente, Divergencia', status: 'pendiente' },
    { id: 6, subject: 'JEFE SUPREMO: Final de Arquitectura', date: '2026-11-25', time: '19:00', type: 'final', location: 'Cámara del Dragón', topics: 'Pipeline, Caché, Microarquitectura RISC-V', status: 'pendiente' },
    { id: 7, subject: 'DRAGÓN ANCESTRAL: Final de Redes', date: '2026-12-14', time: '18:30', type: 'final', location: 'Guarida Final', topics: 'TCP/IP, Enrutamiento BGP, Criptografía SSL', status: 'pendiente' },
    { id: 8, subject: 'FINAL ÉPICO: Inteligencia Artificial', date: '2026-12-21', time: '17:00', type: 'final', location: 'Santuario del Conocimiento', topics: 'Redes Neuronales, Búsqueda A*, Minimax', status: 'pendiente' }
  ];

  const DEFAULT_SCHEDULES = [
    { id: 1, subject: 'Algoritmos y Estructuras', weekday: 1, start_time: '10:00', end_time: '13:00', location: 'Aula 302', professor: 'Prof. Bianchi', color: '#3b82f6' },
    { id: 2, subject: 'Sistemas Operativos', weekday: 2, start_time: '18:00', end_time: '22:00', location: 'Lab Central', professor: 'Prof. Rossi', color: '#10b981' },
    { id: 3, subject: 'Laboratorio de Programación', weekday: 3, start_time: '14:00', end_time: '18:00', location: 'Sala Alfa', professor: 'Prof. Torres', color: '#f59e0b' },
    { id: 4, subject: 'Bases de Datos', weekday: 4, start_time: '18:00', end_time: '21:00', location: 'Aula 210', professor: 'Prof. Gómez', color: '#8b5cf6' },
    { id: 5, subject: 'Redes de Información', weekday: 5, start_time: '18:00', end_time: '22:00', location: 'Aula Magna', professor: 'Prof. Méndez', color: '#ef4444' }
  ];

  const DungeonStorage = {
    getExams() {
      try {
        const raw = localStorage.getItem('orbita_dungeon_exams');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      this.saveExams(DEFAULT_EXAMS);
      return [...DEFAULT_EXAMS];
    },
    saveExams(list) {
      try {
        localStorage.setItem('orbita_dungeon_exams', JSON.stringify(list));
      } catch (e) {}
    },
    getSchedules() {
      try {
        const raw = localStorage.getItem('orbita_dungeon_schedules');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      this.saveSchedules(DEFAULT_SCHEDULES);
      return [...DEFAULT_SCHEDULES];
    },
    saveSchedules(list) {
      try {
        localStorage.setItem('orbita_dungeon_schedules', JSON.stringify(list));
      } catch (e) {}
    },
    addExam(item) {
      const exams = this.getExams();
      item.id = Date.now();
      exams.push(item);
      this.saveExams(exams);
      return item;
    },
    updateExam(id, updates) {
      const exams = this.getExams();
      const idx = exams.findIndex(e => String(e.id) === String(id));
      if (idx !== -1) {
        exams[idx] = { ...exams[idx], ...updates };
        this.saveExams(exams);
        return exams[idx];
      }
      return null;
    },
    deleteExam(id) {
      const exams = this.getExams().filter(e => String(e.id) !== String(id));
      this.saveExams(exams);
    },
    seedExams() {
      const exams = this.getExams();
      const additions = DEFAULT_EXAMS.filter(sample => !exams.some(q =>
        q.subject === sample.subject && q.date === sample.date && q.type === sample.type));
      const firstId = Math.max(Date.now(), ...exams.map(q => Number(q.id) || 0)) + 1;
      const merged = exams.concat(additions.map((q, i) => ({ ...q, id: firstId + i })));
      this.saveExams(merged);
      return merged;
    }
  };

  // --- CARGA DE DATOS LOCALES ---
  function loadData() {
    state.exams = DungeonStorage.getExams();
    state.schedules = DungeonStorage.getSchedules();

    updateStats();
    syncActiveQuest();
    renderAllViews();
  }

  // Calcula nivel, EXP y Oro según misiones completadas
  function updateStats() {
    const total = state.exams.length;
    const approved = state.exams.filter(e => e.status === 'aprobado' || e.status === 'completado').length;
    state.lvl = 1 + Math.floor(approved / 2);
    const expPct = total > 0 ? Math.round((approved / total) * 100) : 0;
    state.gold = Math.max(0, 100 + approved * 50 - state.goldSpent);

    if (dom.hudLvl) dom.hudLvl.textContent = state.lvl;
    if (dom.hudExp) dom.hudExp.textContent = `${expPct}%`;
    if (dom.hudGold) dom.hudGold.textContent = `${state.gold}G`;
  }

  // Sincroniza la misión activa para el combate en el stage
  function syncActiveQuest() {
    const dateKey = formatDateKey(state.currentDate);
    const questsOnDate = state.exams.filter(e => e.date === dateKey);
    const previousId = state.activeQuest?.id;
    state.activeQuest = questsOnDate.find(q => q.id === previousId)
      || questsOnDate.find(q => !isComplete(q)) || questsOnDate[0] || null;
    state.monster.state = 'idle';
    updateBattleDeck();
  }

  function updateBattleDeck() {
    if (!state.activeQuest) {
      if (dom.dialogueSpeaker) dom.dialogueSpeaker.textContent = 'EXPLORACIÓN';
      if (dom.dialogueText) dom.dialogueText.textContent = 'Esta cámara está despejada. Aprovechá para preparar tu próxima conquista.';
      if (dom.questInfoMeta) dom.questInfoMeta.textContent = 'Sin encuentros programados.';
      if (dom.btnApprove) dom.btnApprove.disabled = true;
      if (dom.btnDeleteQuest) dom.btnDeleteQuest.disabled = true;
      state.monster.type = 'parcial';
      document.getElementById('encounterStatus').textContent = 'DESPEJADO';
      return;
    }

    const q = state.activeQuest;
    const isApproved = q.status === 'aprobado' || q.status === 'completado';
    if (dom.btnApprove) {
      dom.btnApprove.disabled = false;
      dom.btnApprove.textContent = isApproved ? '↶ Volver a pendiente' : (q.type === 'parcial' || q.type === 'final' ? '✓ Marcar aprobado' : '✓ Marcar completada');
    }
    if (dom.btnDeleteQuest) dom.btnDeleteQuest.disabled = false;

    if (q.type === 'final') {
      state.monster.type = 'final';
      if (dom.dialogueSpeaker) dom.dialogueSpeaker.textContent = '¡JEFE SUPREMO: FINAL!';
      if (dom.dialogueText) dom.dialogueText.textContent = isApproved
        ? `¡El Dragón de ${q.subject} ha sido derrotado con honores!`
        : `¡Un temible Dragón Ancestral de ${q.subject} custodia el aula ${q.location || 'Central'}!`;
    } else if (q.type === 'parcial') {
      state.monster.type = 'parcial';
      if (dom.dialogueSpeaker) dom.dialogueSpeaker.textContent = '¡ENEMIGO: PARCIAL!';
      if (dom.dialogueText) dom.dialogueText.textContent = isApproved
        ? `¡El Goblin de ${q.subject} cayó ante tus apuntes!`
        : `¡Un Goblin armado con el cuestionario de ${q.subject} te desafía a las ${q.time || '10:00'}!`;
    } else {
      state.monster.type = 'tarea';
      if (dom.dialogueSpeaker) dom.dialogueSpeaker.textContent = '¡CRIATURA: TAREA / TP!';
      if (dom.dialogueText) dom.dialogueText.textContent = isApproved
        ? `¡La entrega de ${q.subject} fue presentada a tiempo!`
        : `¡Un Slime gelatinoso de ${q.subject} bloquea el pasillo!`;
    }

    if (dom.questInfoMeta) {
      dom.questInfoMeta.innerHTML = '<strong>' + escapeHtml(q.subject) + '</strong><br>' +
        escapeHtml(q.date + ' · ' + (q.time || 'Sin horario')) + (q.location ? '<br>' + escapeHtml(q.location) : '') +
        (q.topics ? '<br>Temas: ' + escapeHtml(q.topics) : '');
    }
    document.getElementById('encounterStatus').textContent = isApproved ? 'COMPLETADA' : q.status.toUpperCase();
  }

  // --- ANIMATION LOOP (LOBBY + COMBATE) ---
  function resizeBattleCanvas() {
    if (!dom.battleCanvas) return;
    const rect = dom.battleCanvas.getBoundingClientRect();
    if (dom.battleCanvas.width !== rect.width || dom.battleCanvas.height !== rect.height) {
      dom.battleCanvas.width = rect.width;
      dom.battleCanvas.height = rect.height;
    }
  }

  function addFloatingText(text, x, y, color = '#fef08a') {
    state.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 50,
      maxLife: 50
    });
  }

  function mainRenderLoop() {
    state.tick++;

    // 1. Si la vista actual es el Lobby, actualizar y renderizar el mundo 2D
    if (state.view === 'lobby' && lobbyEngine) {
      lobbyEngine.update();
      lobbyEngine.render();
    }

    // 2. Si no es el lobby, renderizar la Arena de Combate
    if (state.view !== 'lobby' && battleCtx && dom.battleCanvas) {
      resizeBattleCanvas();
      const w = dom.battleCanvas.width;
      const h = dom.battleCanvas.height;

      // Dibujar fondo de mazmorra
      spriteEngine.drawDungeonBackground(battleCtx, w, h, state.tick);

      // Posiciones del Héroe y Monstruo en alta definición
      const heroScale = w < 450 ? 2.8 : 4;
      const heroX = Math.floor(w * 0.15);
      const heroY = h - (heroScale / 4) * 115 - 12;
      const monsterX = Math.floor(w * 0.57);
      const monsterH = state.monster.type === 'final' ? 165 : state.monster.type === 'parcial' ? 125 : 85;
      const monsterY = h - (heroScale / 4) * monsterH - 12;

      // Animar frames según tick
      if (state.tick % 10 === 0) {
        state.hero.frame = reducedMotion.matches ? 0 : state.hero.frame + 1;
        state.monster.frame = reducedMotion.matches ? 0 : state.monster.frame + 1;
      }

      // Dibujar Héroe
      spriteEngine.drawHero(
        battleCtx,
        heroX,
        heroY,
        state.hero.state,
        state.hero.frame,
        heroScale,
        false,
        state.hero.flash,
        state.selectedArmorTheme
      );

      // Dibujar Monstruo
      if (state.activeQuest) spriteEngine.drawMonster(
        battleCtx,
        monsterX,
        monsterY,
        state.monster.type,
        isComplete(state.activeQuest) && state.monster.type === 'final' ? 'defeat' : state.monster.state,
        state.monster.frame,
        heroScale,
        true,
        state.monster.flash
      );

      // Textos Flotantes de Combate
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.life--;
        ft.y -= 1.2;
        const alpha = ft.life / ft.maxLife;

        battleCtx.save();
        battleCtx.font = "14px 'Press Start 2P', monospace";
        battleCtx.fillStyle = ft.color;
        battleCtx.globalAlpha = alpha;
        battleCtx.fillText(ft.text, ft.x, ft.y);
        battleCtx.restore();

        if (ft.life <= 0) {
          state.floatingTexts.splice(i, 1);
        }
      }
    }

    requestAnimationFrame(mainRenderLoop);
  }

  // --- ACCIONES DE COMBATE ---
  function triggerHeroAttack() {
    audio.playSwordSwing();
    state.hero.state = 'attack';
    state.hero.flash = true;
    setTimeout(() => { state.hero.flash = false; }, 100);

    setTimeout(() => {
      audio.playMonsterHit();
      state.monster.state = 'hit';
      state.monster.flash = true;

      const w = dom.battleCanvas ? dom.battleCanvas.width : 500;
      const texts = ['¡CRITICAL STUDY!', '¡8/10!', '¡ZAS!', '¡RESUMEN EFECTIVO!', '¡FÓRMULA CORRECTA!'];
      const pick = texts[Math.floor(Math.random() * texts.length)];
      addFloatingText(pick, Math.floor(w * 0.65), 70, '#fde047');

      setTimeout(() => {
        state.monster.flash = false;
        state.monster.state = 'idle';
        state.hero.state = 'idle';
      }, 350);
    }, 180);
  }

  function triggerHeroDefend() {
    audio.playShieldBlock();
    state.hero.state = 'defend';
    state.hero.flash = true;

    const w = dom.battleCanvas ? dom.battleCanvas.width : 500;
    addFloatingText('¡DEFENSA TOTAL!', Math.floor(w * 0.22), 80, '#60a5fa');

    state.monster.state = 'attack';
    setTimeout(() => {
      state.hero.flash = false;
      state.hero.state = 'idle';
      state.monster.state = 'idle';
    }, 450);
  }

  function triggerHeroSpell() {
    audio.playMagicCast();
    state.hero.state = 'victory';

    const w = dom.battleCanvas ? dom.battleCanvas.width : 500;
    addFloatingText('✨ ¡MAGIA DE REPASO! ✨', Math.floor(w * 0.45), 60, '#c084fc');

    setTimeout(() => {
      audio.playMonsterHit();
      state.monster.state = 'hit';
      state.monster.flash = true;
      setTimeout(() => {
        state.monster.flash = false;
        state.monster.state = 'idle';
        state.hero.state = 'idle';
      }, 400);
    }, 300);
  }

  function toggleAutoFight() {
    state.autoFight = !state.autoFight;
    if (dom.btnAutoFight) {
      dom.btnAutoFight.classList.toggle('active', state.autoFight);
      dom.btnAutoFight.textContent = state.autoFight ? 'Detener' : 'Auto';
    }

    if (state.autoFight) {
      if (dom.dialogueText) dom.dialogueText.textContent = '¡Combate continuo activado! Los golpes y destellos se suceden sin cesar.';
      state.autoFightTimer = setInterval(() => {
        const r = Math.random();
        if (r < 0.5) triggerHeroAttack();
        else if (r < 0.8) triggerHeroDefend();
        else triggerHeroSpell();
      }, 1200);
    } else {
      clearInterval(state.autoFightTimer);
    }
  }

  function handleApproveQuest() {
    if (!state.activeQuest) return;
    audio.playVictoryFanfare();
    state.hero.state = 'victory';

    const w = dom.battleCanvas ? dom.battleCanvas.width : 500;
    addFloatingText('🏆 ¡MISIÓN APROBADA! 🏆', Math.floor(w * 0.45), 50, '#4ade80');

    const nextStatus = isComplete(state.activeQuest) ? 'pendiente' :
      (['parcial', 'final'].includes(state.activeQuest.type) ? 'aprobado' : 'completado');
    state.activeQuest.status = nextStatus;
    DungeonStorage.updateExam(state.activeQuest.id, { status: nextStatus });
    loadData();

    setTimeout(() => {
      state.hero.state = 'idle';
    }, 1500);
  }

  function handleDeleteQuest() {
    if (!state.activeQuest) return;
    if (!confirm(`¿Descartar la misión "${state.activeQuest.subject}" de la mazmorra?`)) return;
    audio.playShieldBlock();
    DungeonStorage.deleteExam(state.activeQuest.id);
    loadData();
  }

  // --- VISTAS DEL CALENDARIO ---
  function renderAllViews() {
    renderDayView();
    renderWeekView();
    renderMonthView();
    renderYearView();
    renderArtifactsVault();
    renderAgenda();
    const pending = state.exams.filter(q => !isComplete(q));
    const next = pending.filter(q => q.date >= formatDateKey(new Date())).sort((a, b) => (a.date + (a.time || '23:59')).localeCompare(b.date + (b.time || '23:59')))[0];
    let nextText = 'El camino está despejado';
    if (next) {
      const [y, m, d] = next.date.split('-').map(Number);
      const now = new Date();
      const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
      nextText = 'Próxima misión: ' + (days === 0 ? 'hoy' : days === 1 ? 'mañana' : 'en ' + days + ' días');
    }
    document.getElementById('adventureSummary').innerHTML =
      '<span><strong>' + pending.length + '</strong> pendientes</span><span><strong>' +
      (state.exams.length - pending.length) + '</strong> completadas</span><span>' + nextText + '</span>';
  }

  function renderAgenda() {
    const quests = state.exams.filter(q => q.date === formatDateKey(state.currentDate))
      .sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
    document.getElementById('agendaDate').textContent = state.currentDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });
    document.getElementById('agendaCount').textContent = quests.length + (quests.length === 1 ? ' misión' : ' misiones');
    const agenda = document.getElementById('questAgenda');
    agenda.innerHTML = quests.length ? quests.map(q =>
      '<button type="button" class="agenda-item ' + (isComplete(q) ? 'aprobado ' : '') +
      (state.activeQuest?.id === q.id ? 'selected' : '') + '" data-id="' + escapeHtml(q.id) +
      '" aria-pressed="' + (state.activeQuest?.id === q.id) + '">' + spriteMarkup(q.type) +
      '<span><strong>' + escapeHtml(q.subject) + '</strong><small>' +
      escapeHtml((q.time || 'Sin horario') + ' · ' + (TYPE_LABELS[q.type] || 'Misión')) +
      (isComplete(q) ? ' · ✓ Completada' : '') + '</small></span></button>'
    ).join('') : '<div class="empty-agenda">' + spriteMarkup('tarea') +
      '<strong>Una cámara tranquila.</strong><p>No hay misiones para este día.<br>Podés agregar una o seguir explorando.</p></div>';
    agenda.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => {
      audio.playBlip();
      selectQuest(button.dataset.id);
    }));
  }

  function renderDayView() {
    const key = formatDateKey(state.currentDate);
    dom.dayTitle.textContent = DAY_NAMES[state.currentDate.getDay()] + ' · ' + state.currentDate.toLocaleDateString('es-AR');
    const quests = state.exams.filter(q => q.date === key);
    dom.dayTrack.innerHTML = Array.from({ length: 24 }, (_, hour) => {
      const hourly = quests.filter(q => Number((q.time || '10:00').split(':')[0]) === hour);
      const now = hour === new Date().getHours() && key === formatDateKey(new Date());
      return '<button type="button" class="hour-chamber ' + (hour === state.selectedHour ? 'active-hour ' : '') +
        (hourly.length ? 'has-quest' : '') + '" data-hour="' + hour + '" aria-pressed="' + (hour === state.selectedHour) +
        '"><span class="chamber-time-badge">' + pad(hour) + ':00</span><span class="chamber-room-icon">' +
        (hourly.length ? spriteMarkup(hourly[0].type) : '<span class="quiet-room" aria-hidden="true">◇</span>') +
        '</span><span class="chamber-quest-list">' + hourly.map(q =>
          '<span class="chamber-quest-badge">' + escapeHtml(q.subject) + '</span>').join('') + '</span>' +
        (now ? '<span class="hero-marker-pin"><img src="/assets/sprites/frames/hero_idle_0.png" alt="Hora actual"></span>' : '') + '</button>';
    }).join('');
    dom.dayTrack.querySelectorAll('[data-hour]').forEach(button => button.addEventListener('click', () => {
      state.selectedHour = Number(button.dataset.hour);
      state.activeQuest = quests.find(q => Number((q.time || '10:00').split(':')[0]) === state.selectedHour) || null;
      updateBattleDeck();
      renderDayView();
      renderAgenda();
    }));
  }

  function renderWeekView() {
    const monday = new Date(state.currentDate);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const dateLabel = date => date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    dom.weekTitle.textContent = dateLabel(monday) + ' – ' + dateLabel(sunday) + ' · ' + sunday.getFullYear();
    dom.weekChambers.innerHTML = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + i);
      const key = formatDateKey(date);
      const quests = state.exams.filter(q => q.date === key);
      const guardian = quests.find(q => q.type === 'final') || quests[0];
      return '<article class="week-chamber-card ' + (key === formatDateKey(new Date()) ? 'today' : '') +
        '"><button class="week-date-button" type="button" data-date="' + key + '"><span class="chamber-card-day">' +
        DAY_NAMES[date.getDay()] + '</span><span class="chamber-card-date">' + pad(date.getDate()) + '/' +
        pad(date.getMonth() + 1) + '</span></button><div class="chamber-card-body"><div class="chamber-monster-avatar">' +
        (guardian ? spriteMarkup(guardian.type) : '<span class="quiet-room" aria-hidden="true">◇</span>') +
        '</div><div class="chamber-activities">' + (quests.length ? quests.map(q =>
          '<button type="button" class="activity-item ' + (isComplete(q) ? 'aprobado' : '') + '" data-date="' +
          key + '" data-id="' + escapeHtml(q.id) + '">' + escapeHtml((q.time || '') + ' ' + q.subject) + '</button>').join('') :
          '<span class="empty-week">Sin misiones</span>') + '</div></div></article>';
    }).join('');
    dom.weekChambers.querySelectorAll('button[data-date]').forEach(button => button.addEventListener('click', () => {
      audio.playStep();
      selectDate(button.dataset.date);
      if (button.dataset.id) selectQuest(button.dataset.id);
    }));
  }

  function renderMonthView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    dom.monthTitle.textContent = MONTH_NAMES[month] + ' ' + year;
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const days = new Date(year, month + 1, 0).getDate();
    const count = Math.ceil((offset + days) / 7) * 7;
    const today = formatDateKey(new Date());
    const selected = formatDateKey(state.currentDate);
    dom.monthTiles.innerHTML = Array.from({ length: count }, (_, i) => {
      const day = i - offset + 1;
      if (day < 1 || day > days) return '<div class="dungeon-tile empty-tile" aria-hidden="true"></div>';
      const key = formatDateKey(new Date(year, month, day));
      const quests = state.exams.filter(q => q.date === key);
      const label = day + ' de ' + MONTH_NAMES[month] + ', ' + quests.length + ' misiones' +
        (quests.length ? ': ' + quests.map(q => q.subject).join(', ') : '');
      return '<button type="button" class="dungeon-tile ' + (key === today ? 'today-tile ' : '') +
        (key === selected ? 'selected-tile' : '') + '" data-date="' + key + '" aria-label="' +
        escapeHtml(label) + '" aria-pressed="' + (key === selected) + '">' +
        '<span class="tile-top"><span class="tile-number">' + day + '</span>' +
        (key === selected ? '<img class="tile-hero" src="/assets/sprites/frames/hero_idle_0.png" alt="">' : '') +
        '</span><span class="tile-events">' + quests.slice(0, 2).map(q =>
          '<span class="tile-event-pill ' + escapeHtml(q.type) + (isComplete(q) ? ' aprobado' : '') +
          '" title="' + escapeHtml((q.time || '') + ' ' + q.subject) + '">' + spriteMarkup(q.type) +
          '<span>' + (isComplete(q) ? '✓ ' : '') + escapeHtml(q.subject) + '</span></span>').join('') +
        (quests.length > 2 ? '<span class="tile-more">+' + (quests.length - 2) + ' más</span>' : '') +
        '</span></button>';
    }).join('');
    dom.monthTiles.querySelectorAll('[data-date]').forEach(button => button.addEventListener('click', () => {
      audio.playStep();
      selectDate(button.dataset.date);
    }));
  }

  function renderYearView() {
    const year = state.currentDate.getFullYear();
    dom.yearTitle.textContent = 'El reino de ' + year;
    const start = Date.UTC(year, 0, 1);
    const total = (Date.UTC(year + 1, 0, 1) - start) / 86400000;
    const now = new Date();
    const elapsed = Math.max(0, Math.min(total, Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - start) / 86400000) + 1));
    const pct = Math.round(elapsed / total * 100);
    dom.yearFill.style.width = pct + '%';
    dom.yearProgressText.textContent = 'DÍA ' + elapsed + ' / ' + total + ' · ' + pct + '%';
    const quests = state.exams.filter(q => q.date.startsWith(year + '-'));
    const bosses = quests.filter(q => q.type === 'final');
    dom.yearBossStats.textContent = 'FINALES: ' + bosses.filter(isComplete).length + ' / ' + bosses.length + ' APROBADOS';
    dom.yearCastles.innerHTML = Array.from({ length: 12 }, (_, m) => {
      const monthly = quests.filter(q => q.date.startsWith(year + '-' + pad(m + 1)));
      const hasFinal = monthly.some(q => q.type === 'final');
      return '<button type="button" class="castle-card ' + (m === state.currentDate.getMonth() ? 'current-month' : '') +
        '" data-month="' + m + '"><span class="castle-head"><span>PISO ' + pad(m + 1) + '</span><span>' +
        MONTH_NAMES[m] + '</span></span><span class="castle-visual">' +
        (monthly.length ? spriteMarkup(hasFinal ? 'final' : monthly[0].type) : '<span class="quiet-room" aria-hidden="true">◇</span>') +
        '</span><span class="castle-stats"><span>' + monthly.length + ' misiones</span><span>' +
        monthly.filter(isComplete).length + ' completadas</span></span></button>';
    }).join('');
    dom.yearCastles.querySelectorAll('[data-month]').forEach(button => button.addEventListener('click', () => {
      state.currentDate = new Date(year, Number(button.dataset.month), 1);
      syncActiveQuest();
      switchView('month');
    }));
  }


  // Renderiza la Bóveda de Artefactos según exámenes aprobados
  function renderArtifactsVault() {
    if (!dom.artifactsVaultGrid) return;

    const approvedCount = state.exams.filter(e => e.status === 'aprobado' || e.status === 'completado').length;
    const hasFinalApproved = state.exams.some(e => e.type === 'final' && (e.status === 'aprobado' || e.status === 'completado'));
    const hasParcialApproved = state.exams.some(e => e.type === 'parcial' && (e.status === 'aprobado' || e.status === 'completado'));

    const artifacts = [
      {
        id: 'scroll',
        name: '📜 Pergamino de los Apuntes Sagrados',
        unlocked: true,
        desc: 'Compendio de fórmulas y resúmenes que ilumina el camino del estudiante novato.'
      },
      {
        id: 'parcial_cup',
        name: '🏆 Cáliz del Parcial Invicto',
        unlocked: hasParcialApproved,
        desc: hasParcialApproved ? '¡Forjado tras triunfar en tu primer parcial con nota sobresaliente!' : 'Bloqueado: Aprueba al menos 1 examen parcial para reclamarlo.'
      },
      {
        id: 'dragon_crown',
        name: '👑 Corona del Conquistador de Finales',
        unlocked: hasFinalApproved,
        desc: hasFinalApproved ? '¡Arrancada de la cabeza del Dragón Supremo en una épica mesa de examen!' : 'Bloqueado: Derrota y aprueba un examen final para lucir esta corona.'
      },
      {
        id: 'hourglass',
        name: '⏳ Reloj de Arena de la Disciplina',
        unlocked: approvedCount >= 3,
        desc: approvedCount >= 3 ? 'Otorga maestría sobre los plazos y horarios de cursada.' : 'Bloqueado: Aprueba 3 o más actividades académicas en el calendario.'
      }
    ];

    const introHtml = `
      <div style="grid-column: 1 / -1; background: #14172a; border: 2px dashed #eab308; padding: 8px 12px; margin-bottom: 6px; display: flex; gap: 10px; align-items: center;">
        <span style="font-size: 24px;">🧝</span>
        <div>
          <strong style="color: #facc15; font-size: 9px;">Anticuario Grikk:</strong>
          <p style="font-size: 8px; color: #e5e7eb; margin: 2px 0 0; line-height: 1.3;">
            “Bienvenido a mi cámara del tesoro, paladín. Cada parcial y final aprobado se transmuta en una reliquia de sabiduría en nuestras vitrinas.”
          </p>
        </div>
      </div>
    `;

    dom.artifactsVaultGrid.innerHTML = introHtml + artifacts.map(art => `
      <div class="artifact-card ${art.unlocked ? '' : 'locked'}">
        <div class="artifact-header">
          <strong>${art.name}</strong>
          <span>${art.unlocked ? '✨ DESBLOQUEADO' : '🔒 BLOQUEADO'}</span>
        </div>
        <p style="font-size: 8px; color: ${art.unlocked ? '#fde047' : '#9ca3af'}; line-height: 1.4;">
          ${art.desc}
        </p>
      </div>
    `).join('');
  }

  // --- NAVEGACIÓN Y CAMBIO DE VISTAS ---
  function switchView(viewName) {
    state.view = viewName;
    dom.body.dataset.view = viewName;
    if (lobbyEngine) lobbyEngine.cancelMovement();
    if (state.autoFight) {
      clearInterval(state.autoFightTimer);
      state.autoFight = false;
      dom.btnAutoFight.classList.remove('active');
      dom.btnAutoFight.textContent = 'Auto';
    }
    audio.playBlip();

    dom.viewTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
      if (tab.dataset.view === viewName) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    Object.entries(dom.panels).forEach(([k, panel]) => {
      if (panel) panel.classList.toggle('active', k === viewName);
    });

    // Ocultar la arena de combate en el Lobby para darle protagonismo al mapa RPG
    if (dom.battleArenaCard) {
      dom.battleArenaCard.style.display = (viewName === 'lobby') ? 'none' : 'block';
    }

    renderAllViews();
  }

  // Actualiza la vista previa en la Armería
  function updateArmoryPreview() {
    if (!dom.armoryPreviewCanvas) return;
    const pctx = dom.armoryPreviewCanvas.getContext('2d');
    pctx.clearRect(0, 0, dom.armoryPreviewCanvas.width, dom.armoryPreviewCanvas.height);
    pctx.fillStyle = '#0e0e1c';
    pctx.fillRect(0, 0, dom.armoryPreviewCanvas.width, dom.armoryPreviewCanvas.height);
    spriteEngine.drawIsometricHero(
      pctx,
      dom.armoryPreviewCanvas.width / 2,
      dom.armoryPreviewCanvas.height * 0.85,
      'dr',
      0,
      1.7,
      false,
      state.selectedArmorTheme
    );
  }

  // --- LISTENERS DEL SISTEMA ---
  function initEventListeners() {
    document.getElementById('agendaAddBtn').addEventListener('click', () => dom.newQuestBtn.click());
    // Keep dialogs usable by keyboard and protect text selection from backdrop closes.
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      const dialog = modal.querySelector('.modal-dialog');
      const heading = modal.querySelector('.modal-head > span');
      if (heading) {
        heading.id = modal.id + 'Title';
        dialog.setAttribute('aria-labelledby', heading.id);
      }
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.tabIndex = -1;
      let previousFocus;
      let wasOpen = false;
      let pointerStart;
      const observer = new MutationObserver(() => {
        const open = modal.classList.contains('open');
        if (open === wasOpen) return;
        wasOpen = open;
        if (lobbyEngine) lobbyEngine.cancelMovement();
        if (open) {
          previousFocus = document.activeElement;
          (dialog.querySelector('input') || dialog.querySelector('button') || dialog).focus();
        } else if (previousFocus?.isConnected) previousFocus.focus();
        const hasModal = !!document.querySelector('.modal-overlay.open');
        document.querySelectorAll('body > header, body > nav, body > main, body > footer').forEach(el => { el.inert = hasModal; });
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
      modal.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          modal.classList.remove('open');
          e.preventDefault();
        } else if (e.key === 'Tab') {
          const focusable = [...dialog.querySelectorAll('button, input, select, textarea, a[href]')]
            .filter(el => !el.disabled && el.getClientRects().length);
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (!first) { e.preventDefault(); dialog.focus(); }
          else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
      modal.addEventListener('pointerdown', e => {
        pointerStart = e.target === modal ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
      });
      modal.addEventListener('pointermove', e => {
        if (pointerStart && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) > 6) pointerStart = null;
      });
      modal.addEventListener('pointerup', e => {
        if (pointerStart && pointerStart.id === e.pointerId && e.target === modal) modal.classList.remove('open');
        pointerStart = null;
      });
      modal.addEventListener('pointercancel', () => { pointerStart = null; });
    });
    // Pestañas
    dom.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Sonido y CRT
    if (dom.soundToggle) {
      dom.soundToggle.addEventListener('click', () => {
        const active = audio.toggle();
        dom.soundToggle.textContent = active ? 'Sonido: on' : 'Sonido: off';
        dom.soundToggle.setAttribute('aria-pressed', active);
      });
    }

    if (dom.crtToggle) {
      dom.crtToggle.addEventListener('click', () => {
        dom.body.classList.toggle('no-crt');
        const hasCrt = !dom.body.classList.contains('no-crt');
        dom.crtToggle.textContent = hasCrt ? 'CRT: on' : 'CRT: off';
        dom.crtToggle.setAttribute('aria-pressed', hasCrt);
      });
    }


    // Sidebar and object clicks use the same destination and arrival behavior.
    if (lobbyEngine) {
      const shortcuts = {
        quickBtnAltar: 'altar', quickBtnArmory: 'armory', quickBtnBedroom: 'bedroom',
        quickBtnMagic: 'magic', quickBtnArtifacts: 'artifacts', quickBtnCat: 'cat',
        quickBtnPortal: 'portal'
      };
      Object.entries(shortcuts).forEach(([key, id]) => {
        dom[key]?.addEventListener('click', () => {
          dom.lobbyCanvas.focus();
          lobbyEngine.goToStation(id);
        });
      });

      // Controles D-Pad Virtual
      const bindDpad = (btn, keyName) => {
        if (!btn) return;
        const press = (e) => {
          e.preventDefault();
          lobbyEngine.pendingStationId = null;
          lobbyEngine.keys[keyName] = true;
          lobbyEngine.hero.targetX = null;
          lobbyEngine.hero.targetY = null;
        };
        const release = (e) => {
          e.preventDefault();
          delete lobbyEngine.keys[keyName];
        };
        btn.addEventListener('mousedown', press);
        btn.addEventListener('mouseup', release);
        btn.addEventListener('mouseleave', release);
        btn.addEventListener('touchstart', press, { passive: false });
        btn.addEventListener('touchend', release, { passive: false });
      };

      bindDpad(dom.dpadUp, 'arrowup');
      bindDpad(dom.dpadDown, 'arrowdown');
      bindDpad(dom.dpadLeft, 'arrowleft');
      bindDpad(dom.dpadRight, 'arrowright');

      if (dom.dpadAction) {
        dom.dpadAction.addEventListener('click', () => {
          if (lobbyEngine.nearestStation) {
            lobbyEngine.interactWithStation(lobbyEngine.nearestStation.id);
          } else {
            audio.playSwordSwing();
          }
        });
      }
    }

    // --- MODALES DEL LOBBY ---
    // 1. Altar Diosa
    if (dom.btnCloseGoddess) {
      dom.btnCloseGoddess.addEventListener('click', () => {
        dom.goddessModal.classList.remove('open');
      });
    }
    if (dom.btnPrayGoddess) {
      dom.btnPrayGoddess.addEventListener('click', () => {
        audio.playGoddessBlessing();
        const oracles = [
          '“Quien domina los axiomas fundamentales nunca teme a las preguntas sorpresa.”',
          '“La memoria es un músculo forjado en el repaso espaciado. Confía en tu espada del saber.”',
          '“Un examen final no es más que un dragón hecho de tinta y papel. ¡Adelante, paladín!”',
          '“Respira hondo antes de cada consigna. Tu preparación y serenidad son tu mejor escudo.”',
          '“La perseverancia vence donde el talento se confía. ¡Sigue adelante!”',
          '“Bendición de Minerva: +20 a la concentración mental en los próximos 7 días.”'
        ];
        const pick = oracles[Math.floor(Math.random() * oracles.length)];
        if (dom.goddessOracleText) dom.goddessOracleText.innerHTML = `🕊️ <strong>[Sacerdotisa Minerva]:</strong><br>${pick}`;
      });
    }
    if (dom.btnOfferGold) {
      dom.btnOfferGold.addEventListener('click', () => {
        if (state.gold >= 10) {
          state.goldSpent += 10;
          localStorage.setItem('dungeon_gold_spent', String(state.goldSpent));
          updateStats();
          audio.playTone(880, 0.25, 'sine');
          if (dom.goddessOracleText) {
            dom.goddessOracleText.innerHTML = '🕊️ <strong>[Sacerdotisa Minerva]:</strong><br>“La Diosa recibe tu ofrenda con agrado. Las velas del templo arden con flama sagrada protegiendo tu cursada.”';
          }
        } else {
          notify('No tienes suficiente oro para la ofrenda (Requiere 10G).');
        }
      });
    }

    // 2. Armería / Customizador
    if (dom.btnCloseArmory) {
      dom.btnCloseArmory.addEventListener('click', () => {
        dom.armoryModal.classList.remove('open');
      });
    }
    if (dom.armorThemeSwatches) {
      dom.armorThemeSwatches.querySelectorAll('.swatch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          audio.playEquipItem();
          dom.armorThemeSwatches.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          state.selectedArmorTheme = btn.dataset.theme;
          if (dom.armoryThemeLabel) {
            dom.armoryThemeLabel.textContent = `Armadura: ${btn.textContent.trim()}`;
          }
          updateArmoryPreview();
        });
      });
    }
    if (dom.btnSaveArmory) {
      dom.btnSaveArmory.addEventListener('click', () => {
        audio.playEquipItem();
        spriteEngine.setArmorTheme(state.selectedArmorTheme);
        localStorage.setItem('dungeon_armor_theme', state.selectedArmorTheme);
        dom.armoryModal.classList.remove('open');
        notify(`⚒️ [Herrero Brokk]: ¡Por el fuego de la forja! Tu armadura ${state.selectedArmorTheme.toUpperCase()} ha quedado templada y reluciente.`);
      });
    }

    // 3. Habitación
    if (dom.btnCloseBedroom) {
      dom.btnCloseBedroom.addEventListener('click', () => {
        dom.bedroomModal.classList.remove('open');
      });
    }
    if (dom.btnRestHero) {
      dom.btnRestHero.addEventListener('click', () => {
        audio.playLullaby();
        if (dom.bedroomStatusText) {
          dom.bedroomStatusText.innerHTML = `
            💤 <em>Zzz... El caballero duerme plácidamente cobijado en mantas nórdicas.</em><br>
            ✨ ¡Fatiga mental reducida al 0%! Te levantas con energía renovada y mente clara.
          `;
        }
      });
    }
    if (dom.btnStudyTip) {
      dom.btnStudyTip.addEventListener('click', () => {
        audio.playBlip();
        const tips = [
          'Técnica Pomodoro: Estudia 25 minutos enfocado y descansa 5 minutos. ¡Evita el agotamiento!',
          'Explicación de Feynman: Si no puedes explicar un tema con palabras sencillas, aún no lo dominas.',
          'Sueño reparador: Dormir 8 horas consolida la memoria a largo plazo antes del examen.',
          'Repaso espaciado: Revisa tus apuntes a las 24hs, a los 3 días y a la semana.'
        ];
        notify(`🦉 [Búho Archimedes]:\n\n"${tips[Math.floor(Math.random() * tips.length)]}"`);
      });
    }

    // 4. Sala de Magia
    if (dom.btnCloseMagic) {
      dom.btnCloseMagic.addEventListener('click', () => {
        dom.magicModal.classList.remove('open');
      });
    }
    if (dom.magicModal) {
      dom.magicModal.querySelectorAll('.potion-card button').forEach(btn => {
        btn.addEventListener('click', () => {
          audio.playPotionBubble();
          notify(`🔮 [Alquimista Elenia]:\n\n¡Poción destilada con éxito! He mezclado esencias de concentración para tu próxima sesión de estudio.`);
        });
      });
    }

    // 5. Sala de Artefactos
    if (dom.btnCloseArtifacts) {
      dom.btnCloseArtifacts.addEventListener('click', () => {
        dom.artifactsModal.classList.remove('open');
      });
    }

    // Botones del Combate
    if (dom.btnAttack) dom.btnAttack.addEventListener('click', triggerHeroAttack);
    if (dom.btnDefend) dom.btnDefend.addEventListener('click', triggerHeroDefend);
    if (dom.btnSpell) dom.btnSpell.addEventListener('click', triggerHeroSpell);
    if (dom.btnAutoFight) dom.btnAutoFight.addEventListener('click', toggleAutoFight);
    if (dom.btnApprove) dom.btnApprove.addEventListener('click', handleApproveQuest);
    if (dom.btnDeleteQuest) dom.btnDeleteQuest.addEventListener('click', handleDeleteQuest);

    // Navegación Día
    if (dom.btnPrevDay) {
      dom.btnPrevDay.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() - 1);
        syncActiveQuest();
        renderAllViews();
      });
    }
    if (dom.btnTodayDay) {
      dom.btnTodayDay.addEventListener('click', () => {
        state.currentDate = new Date();
        syncActiveQuest();
        renderAllViews();
      });
    }
    if (dom.btnNextDay) {
      dom.btnNextDay.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() + 1);
        syncActiveQuest();
        renderAllViews();
      });
    }

    // Navegación Semana
    if (dom.btnPrevWeek) {
      dom.btnPrevWeek.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() - 7);
        syncActiveQuest();
        renderAllViews();
      });
    }
    if (dom.btnTodayWeek) {
      dom.btnTodayWeek.addEventListener('click', () => {
        state.currentDate = new Date();
        syncActiveQuest();
        renderAllViews();
      });
    }
    if (dom.btnNextWeek) {
      dom.btnNextWeek.addEventListener('click', () => {
        state.currentDate.setDate(state.currentDate.getDate() + 7);
        syncActiveQuest();
        renderAllViews();
      });
    }

    // Navegación Mes
    if (dom.btnPrevMonth) {
      dom.btnPrevMonth.addEventListener('click', () => {
        shiftMonth(-1);
      });
    }
    if (dom.btnTodayMonth) {
      dom.btnTodayMonth.addEventListener('click', () => {
        state.currentDate = new Date();
        syncActiveQuest();
        renderAllViews();
      });
    }
    if (dom.btnNextMonth) {
      dom.btnNextMonth.addEventListener('click', () => {
        shiftMonth(1);
      });
    }

    // Navegación Año
    if (dom.btnPrevYear) {
      dom.btnPrevYear.addEventListener('click', () => {
        shiftYear(-1);
      });
    }
    if (dom.btnNextYear) {
      dom.btnNextYear.addEventListener('click', () => {
        shiftYear(1);
      });
    }

    // Sembrar misiones de ejemplo
    if (dom.seedBtn) {
      dom.seedBtn.addEventListener('click', () => {
        audio.playVictoryFanfare();
        DungeonStorage.seedExams();
        loadData();
        notify('Misiones de ejemplo incorporadas al calendario.');
      });
    }

    // Modal Nueva Misión
    if (dom.newQuestBtn) {
      dom.newQuestBtn.addEventListener('click', () => {
        audio.playBlip();
        const dateInput = document.getElementById('questDate');
        if (dateInput) dateInput.value = formatDateKey(state.currentDate);
        if (dom.questModal) dom.questModal.classList.add('open');
      });
    }
    if (dom.btnCancelQuest) {
      dom.btnCancelQuest.addEventListener('click', () => {
        if (dom.questModal) dom.questModal.classList.remove('open');
      });
    }
    if (dom.questForm) {
      dom.questForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
          subject: document.getElementById('questSubject').value.trim(),
          type: document.getElementById('questType').value,
          date: document.getElementById('questDate').value,
          time: document.getElementById('questTime').value || null,
          location: document.getElementById('questLocation').value || null,
          topics: document.getElementById('questTopics').value || null,
          status: 'pendiente'
        };

        const formError = document.getElementById('questFormError');
        formError.hidden = true;
        if (!payload.subject) {
          formError.textContent = 'Ingresá el nombre de la materia o misión.';
          formError.hidden = false;
          document.getElementById('questSubject').focus();
          return;
        }
        audio.playVictoryFanfare();
        DungeonStorage.addExam(payload);
        if (dom.questModal) dom.questModal.classList.remove('open');
        dom.questForm.reset();
        loadData();
      });
    }

    // Modal Bestiario
    if (dom.bestiaryBtn) {
      dom.bestiaryBtn.addEventListener('click', () => {
        audio.playBlip();
        if (dom.bestiaryModal) dom.bestiaryModal.classList.add('open');
      });
    }
    if (dom.btnCloseBestiary) {
      dom.btnCloseBestiary.addEventListener('click', () => {
        if (dom.bestiaryModal) dom.bestiaryModal.classList.remove('open');
      });
    }

    // Reloj HUD en tiempo real
    setInterval(() => {
      const d = new Date();
      if (dom.hudClock) {
        dom.hudClock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }
    }, 1000);
  }

  // --- INICIALIZACIÓN ---
  window.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadData();
    switchView('month');
    mainRenderLoop();
  });

})();
