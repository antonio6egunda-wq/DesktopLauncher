/* Desktop Launcher v1.1.2: ambiente de trabalho, barra de tarefas, painéis e menus.
 * Fala com o Android através de window.Desktop (ver MainActivity.java).
 * Fora do Android (ex.: abrir index.html no PC) usa uma ponte de pré-visualização. */
(function () {
  'use strict';

  const STORE_KEY = 'desktop-launcher.v4';
  const LEGACY_KEYS = ['desktop-launcher.v3', 'desktop-launcher.v2'];
  const LONG_PRESS_MS = 450;
  const MOVE_TOLERANCE_PX = 10;
  const WALLPAPER_COUNT = 5;
  const WALLPAPER_FILES = ['00.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'];
  const SEARCH_APP_LIMIT = 5;
  const RECENT_LIMIT = 3;
  const DEFAULT_NAME = 'Utilizador';
  const AVATARS = ['ic_avatar_00', 'ic_avatar_01'];
  const BAR_DEFAULTS = { height: 68, icon: 40 };
  const BAR_LIMITS = { height: [56, 84], icon: [20, 44] };
  const OLD_BAR_DEFAULTS = { height: 56, icon: 30 };   // predefinições da 1.0 / 1.1: migradas para as novas
  const DESK_DEFAULT_ICON = 40;
  const DESK_LIMIT = [32, 72];

  const SETTINGS_TITLES = {
    main: 'Configurações', profile: 'Perfil', aspect: 'Aspeto',
    bar: 'Barra e ícones', apps: 'Aplicações', system: 'Sistema',
  };

  // Ícones de marca usados só quando o sistema não devolve o ícone da app.
  const BRAND_ICONS = [
    ['onedrive', 'ic_app_microsoft_onedrive'],
    ['google drive', 'ic_app_google_drive'],
    ['play store', 'ic_app_google_play_store_one'],
    ['chrome', 'ic_app_google_chrome'],
    ['whatsapp', 'ic_app_whatsapp'],
    ['powerpoint', 'ic_app_microsoft_powerpoint'],
    ['onenote', 'ic_app_microsoft_onenote'],
    ['outlook', 'ic_app_microsoft_outlook'],
    ['teams', 'ic_app_microsoft_teams'],
    ['solitaire', 'ic_app_microsoft_solitaire'],
    ['translate', 'ic_app_microsoft_translate'],
    ['office', 'ic_app_microsoft_office_mobile'],
    ['word', 'ic_app_microsoft_word'],
    ['sway', 'ic_app_microsoft_sway'],
    ['groove', 'ic_app_microsoft_groove_music_one'],
    ['vlc', 'ic_app_vlc_media_player'],
    ['calculadora', 'ic_app_calculator_one'],
    ['calculator', 'ic_app_calculator_one'],
    ['calendário', 'ic_app_calendar'],
    ['calendar', 'ic_app_calendar'],
    ['ficheiros', 'ic_app_file_explorer'],
    ['file explorer', 'ic_app_file_explorer'],
    ['fotos', 'ic_app_gallery_one'],
  ];

  // Ícones que o utilizador pode atribuir a uma aplicação (res/drawable-nodpi).
  const ICON_CHOICES = [
    'ic_app_calculator_one', 'ic_app_calendar', 'ic_app_file_explorer', 'ic_app_gallery_one',
    'ic_app_google_chrome', 'ic_app_google_drive', 'ic_app_google_play_store_one',
    'ic_app_microsoft_groove_music_one', 'ic_app_microsoft_office_mobile', 'ic_app_microsoft_onedrive',
    'ic_app_microsoft_onenote', 'ic_app_microsoft_outlook', 'ic_app_microsoft_powerpoint',
    'ic_app_microsoft_solitaire', 'ic_app_microsoft_sway', 'ic_app_microsoft_teams',
    'ic_app_microsoft_translate', 'ic_app_microsoft_word', 'ic_app_settings_one',
    'ic_app_vlc_media_player', 'ic_app_whatsapp',
  ];

  // Ícones dos menus (usam currentColor).
  const SVG = {
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    image: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M9,42q-1.2,0-2.1-0.9T6,39V9Q6,7.8 6.9,6.9T9,6H39q1.2,0 2.1,0.9T42,9V39q0,1.2-0.9,2.1T39,42H9Zm0-3H39V9H9V39Zm2.8-4.85H36.25l-7.35-9.8L22.3,32.9l-4.65-6.35l-5.85,7.6ZM9,39V9V39Zm9.78-20.23q0.72-0.73 0.72-1.77t-0.73-1.77T16.99,14.5t-1.77,0.73T14.5,17.01t0.73,1.77t1.77,0.73t1.77-0.73Z"/></svg>',
    minus: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M10,25.5v-3H38v3H10Z"/></svg>',
    plus: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M22.5,38V25.5H10v-3h12.5V10h3v12.5H38v3H25.5V38Z"/></svg>',
    arrange: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/></svg>',
    trash: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M13.05,42q-1.24,0-2.12-0.88T10.05,39V10.5H8v-3h9.4V6H30.6V7.5H40v3H37.95V39q0,1.2-0.9,2.1T34.95,42H13.05Zm21.9-31.5H13.05V39h21.9V10.5ZM18.35,34.7h3V14.75h-3V34.7Zm8.3,0h3V14.75h-3V34.7ZM13.05,10.5V39V10.5Z"/></svg>',
    info: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M22.65,34h3V22h-3V34Zm2.52-16.16q0.48-0.46 0.48-1.14q0-0.72-0.47-1.21T24,15t-1.18,0.49T22.35,16.7q0,0.68 0.47,1.14T24,18.3t1.18-0.46ZM24.01,44q-4.14,0-7.78-1.58t-6.36-4.3t-4.3-6.37T4,23.98t1.58-7.78t4.3-6.34t6.37-4.28T24.03,4t7.78,1.57t6.34,4.28t4.28,6.35T44,23.99t-1.57,7.78t-4.28,6.35t-6.35,4.3T24.01,44Zm0.01-3q7.07,0 12.03-4.98T41,23.98T36.06,11.95T24,7q-7.05,0-12.02,4.94T7,24q0,7.05 4.98,12.02T24.03,41ZM24,24Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root) => Array.prototype.slice.call((root || document).querySelectorAll(selector));
  const pad2 = (n) => String(n).padStart(2, '0');
  const isFocused = (node) => document.activeElement === node;
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  // Remove acentos e põe em minúsculas, para que "definições" encontre "definicoes".
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const safe = (fn, fallback) => {
    try {
      const v = fn();
      return v === undefined || v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };
  const clampInt = (value, range, fallback) => {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.min(range[1], Math.max(range[0], n));
  };
  const byName = (a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' });

  const bridge = window.Desktop || createPreviewBridge();

  const state = {
    apps: [],
    byPackage: new Map(),
    pins: { desktop: [], dock: [] },
    hidden: [],                                   // pacotes ocultos (somem do launcher todo)
    recent: [],                                   // apps abertas pelo launcher, mais recente primeiro
    custom: {},                                   // { pacote: { name?: string, icon?: nome } }
    profile: { name: DEFAULT_NAME, avatar: AVATARS[0] },
    wallpaper: 0,                                 // índice 0-4, ou 'custom'
    bar: { height: BAR_DEFAULTS.height, icon: BAR_DEFAULTS.icon },
    desk: { icon: DESK_DEFAULT_ICON },
    arranging: false,                             // modo "Organizar"
    selected: null,                               // { pkg, zone } à espera de troca no modo "Organizar"
    settingsView: 'main',
  };
  const iconCache = new Map();
  const suggest = { items: [] };
  let customUri = '';                             // papel de parede do utilizador, em memória
  let openPanelId = null;
  let dialogOnOk = null;
  let longPressFired = false;                     // o gesto que acabou de acontecer não deve contar como toque
  let notificationsEnabled = false;
  let notificationSignature = '';

  const PANELS = { apps: 'panelApps', notif: 'panelNotif', settings: 'panelSettings' };

  /* ---------- Ponte de pré-visualização (só fora do Android) ---------- */

  function createPreviewBridge() {
    const sample = ['Calculadora', 'Chrome', 'Fotos', 'Gmail', 'Mapas', 'Relógio', 'VLC', 'WhatsApp', 'Word']
      .map((name, i) => ({ name: name, packageName: 'preview.app' + i }));
    return {
      getApps: () => JSON.stringify(sample),
      getAppIcon: () => '',
      getIcon: () => '',
      openApp: (pkg) => console.log('abrir', pkg),
      openAppInfo: (pkg) => console.log('informação', pkg),
      uninstallApp: (pkg) => console.log('desinstalar', pkg),
      killApp: (pkg) => { console.log('fechar', pkg); return true; },
      openNotificationAccess: () => console.log('acesso às notificações'),
      openAndroidSettings: () => console.log('definições'),
      openWifiSettings: () => console.log('wifi'),
      openBluetoothSettings: () => console.log('bluetooth'),
      openGoogleSearch: (q) => console.log('pesquisar', q),
      openLocationSettings: () => console.log('localização'),
      getNotifications: () => '[]',
      hasNotificationAccess: () => false,
      clearNotifications: () => {},
      dismissNotification: (key) => console.log('dispensar', key),
      isWifiEnabled: () => false,
      toggleWifi: () => false,
      isBluetoothEnabled: () => false,
      toggleBluetooth: () => false,
      isLocationEnabled: () => false,
      getVolume: () => 50,
      setVolume: () => {},
      toggleMute: () => {},
      getBrightness: () => 50,
      setBrightness: () => {},
      pickWallpaper: () => console.log('galeria'),
      hasCustomWallpaper: () => false,
      getCustomWallpaper: () => '',
    };
  }

  /* ---------- Estado persistente ---------- */

  function loadState() {
    let saved = {};
    const raw = [STORE_KEY].concat(LEGACY_KEYS)
      .map((key) => safe(() => localStorage.getItem(key), null))
      .find((value) => value);
    try { saved = JSON.parse(raw || '{}') || {}; } catch (e) { saved = {}; }
    const onlyStrings = (list) => Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];

    state.pins.desktop = onlyStrings(saved.desktop);
    state.pins.dock = onlyStrings(saved.dock);
    state.hidden = onlyStrings(saved.hidden);
    state.recent = onlyStrings(saved.recent).slice(0, RECENT_LIMIT);

    const custom = saved.custom && typeof saved.custom === 'object' ? saved.custom : {};
    Object.keys(custom).forEach((pkg) => {
      const c = custom[pkg] || {};
      const entry = {};
      if (typeof c.name === 'string' && c.name.trim()) entry.name = c.name.trim().slice(0, 40);
      if (typeof c.icon === 'string' && ICON_CHOICES.indexOf(c.icon) !== -1) entry.icon = c.icon;
      if (Object.keys(entry).length) state.custom[pkg] = entry;
    });

    const profile = saved.profile && typeof saved.profile === 'object' ? saved.profile : {};
    if (typeof profile.name === 'string' && profile.name.trim()) state.profile.name = profile.name.trim().slice(0, 24);
    if (AVATARS.indexOf(profile.avatar) !== -1) state.profile.avatar = profile.avatar;

    const bar = saved.bar && typeof saved.bar === 'object' ? saved.bar : {};
    const isOldDefault = Number(bar.height) === OLD_BAR_DEFAULTS.height && Number(bar.icon) === OLD_BAR_DEFAULTS.icon;
    if (!isOldDefault) {
      state.bar.height = clampInt(bar.height, BAR_LIMITS.height, BAR_DEFAULTS.height);
      state.bar.icon = clampInt(bar.icon, BAR_LIMITS.icon, BAR_DEFAULTS.icon);
    }

    const desk = saved.desk && typeof saved.desk === 'object' ? saved.desk : {};
    state.desk.icon = clampInt(desk.icon, DESK_LIMIT, DESK_DEFAULT_ICON);

    if (saved.wallpaper === 'custom') {
      state.wallpaper = 'custom';
    } else {
      const w = Number(saved.wallpaper);
      state.wallpaper = Number.isInteger(w) && w >= 0 && w < WALLPAPER_COUNT ? w : 0;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        desktop: state.pins.desktop,
        dock: state.pins.dock,
        hidden: state.hidden,
        recent: state.recent,
        custom: state.custom,
        profile: state.profile,
        bar: state.bar,
        desk: state.desk,
        wallpaper: state.wallpaper,
      }));
    } catch (e) { /* armazenamento indisponível */ }
  }

  /* ---------- Ícones ---------- */

  function featureIcon(name) {
    const key = 'res:' + name;
    if (!iconCache.has(key)) {
      let uri = '';
      try { uri = bridge.getIcon(name) || ''; } catch (e) { uri = ''; }
      iconCache.set(key, uri);
    }
    return iconCache.get(key);
  }

  function applyIcon(img, uri) {
    if (uri) img.src = uri;
    else img.removeAttribute('src');
  }

  /** Muda o ícone de uma imagem já existente (ex.: volume, Wi-Fi). */
  function setIcon(img, name) {
    if (!img) return;
    img.dataset.icon = name;
    applyIcon(img, featureIcon(name));
  }

  function hydrateIcons(root) {
    $$('img[data-icon]', root).forEach((img) => applyIcon(img, featureIcon(img.dataset.icon)));
  }

  function brandIconFor(name) {
    const lower = (name || '').toLowerCase();
    for (const [keyword, resource] of BRAND_ICONS) {
      if (lower.includes(keyword)) return resource;
    }
    return '';
  }

  function appIcon(app) {
    const key = 'app:' + app.packageName;
    if (!iconCache.has(key)) {
      let uri = '';
      try { uri = bridge.getAppIcon(app.packageName) || ''; } catch (e) { uri = ''; }
      if (!uri) {
        const brand = brandIconFor(app.name);
        if (brand) uri = featureIcon(brand);
      }
      if (!uri) uri = featureIcon('ic_app');
      iconCache.set(key, uri);
    }
    return iconCache.get(key);
  }

  /** Nome e ícone mostrados: os personalizados têm prioridade sobre os do sistema. */
  function displayName(app) {
    const c = state.custom[app.packageName];
    return (c && c.name) || app.name;
  }

  function displayIcon(app) {
    const c = state.custom[app.packageName];
    if (c && c.icon) {
      const uri = featureIcon(c.icon);
      if (uri) return uri;
    }
    return appIcon(app);
  }

  /* ---------- Aplicações, fixações, ocultação e apps em segundo plano ---------- */

  function loadApps() {
    let list = [];
    try { list = JSON.parse(bridge.getApps() || '[]'); } catch (e) { list = []; }
    state.apps = list
      .filter((a) => a && a.packageName)
      .map((a) => ({ name: String(a.name || a.packageName), packageName: a.packageName }))
      .sort((a, b) => byName(a.name, b.name));
    state.byPackage = new Map(state.apps.map((a) => [a.packageName, a]));
    if (state.apps.length) pruneMissing();
    refreshAll();
  }

  /** Remove das listas as apps que já não existem (ex.: desinstaladas). */
  function pruneMissing() {
    let changed = false;
    const keep = (list) => list.filter((pkg) => state.byPackage.has(pkg));
    ['desktop', 'dock'].forEach((zone) => {
      const before = state.pins[zone].length;
      state.pins[zone] = keep(state.pins[zone]);
      if (state.pins[zone].length !== before) changed = true;
    });
    [['hidden'], ['recent']].forEach(([key]) => {
      const before = state[key].length;
      state[key] = keep(state[key]);
      if (state[key].length !== before) changed = true;
    });
    if (changed) saveState();
  }

  function isPinned(zone, pkg) {
    return state.pins[zone].indexOf(pkg) !== -1;
  }

  function isHidden(pkg) {
    return state.hidden.indexOf(pkg) !== -1;
  }

  function visibleApps() {
    return state.apps.filter((app) => !isHidden(app.packageName));
  }

  /** Apps abertas pelo launcher que ainda não estão fixadas na barra (máximo de 3). */
  function runningApps() {
    return state.recent
      .map((pkg) => state.byPackage.get(pkg))
      .filter((app) => app && !isHidden(app.packageName) && !isPinned('dock', app.packageName))
      .slice(0, RECENT_LIMIT);
  }

  function rememberRecent(pkg) {
    state.recent = [pkg].concat(state.recent.filter((p) => p !== pkg)).slice(0, RECENT_LIMIT);
    saveState();
  }

  function setPinned(zone, pkg, on) {
    const list = state.pins[zone];
    const index = list.indexOf(pkg);
    if (on && index === -1) list.push(pkg);
    if (!on && index !== -1) list.splice(index, 1);
    saveState();
    refreshAll();
  }

  /** Oculta ou mostra uma app em todo o launcher. As fixações ficam guardadas. */
  function setHidden(pkg, on) {
    const index = state.hidden.indexOf(pkg);
    if (on && index === -1) state.hidden.push(pkg);
    if (!on && index !== -1) state.hidden.splice(index, 1);
    saveState();
    refreshAll();
  }

  /** Guarda (ou apaga, se `value` for vazio) um nome ou ícone personalizado. */
  function setCustom(pkg, key, value) {
    const entry = Object.assign({}, state.custom[pkg]);
    if (value) entry[key] = value;
    else delete entry[key];
    if (Object.keys(entry).length) state.custom[pkg] = entry;
    else delete state.custom[pkg];
    saveState();
    refreshAll();
  }

  function removeFrom(list, value) {
    const index = list.indexOf(value);
    if (index !== -1) list.splice(index, 1);
  }

  /* ---------- Modo "Organizar": tocar para trocar ---------- */

  /** Toque num ícone no modo "Organizar": seleciona-o, ou troca-o com o que estava selecionado. */
  function arrangeTap(pkg, zone) {
    const sel = state.selected;
    if (!sel) {
      state.selected = { pkg: pkg, zone: zone };
    } else if (sel.pkg === pkg && sel.zone === zone) {
      state.selected = null;
    } else {
      swapSlots(sel, { pkg: pkg, zone: zone });
      state.selected = null;
      saveState();
    }
    refreshAll();
  }

  /** Move o item selecionado para o fim de uma zona. */
  function moveSelectedToEnd(zone) {
    const sel = state.selected;
    if (!sel) return;
    removeFrom(state.pins[sel.zone], sel.pkg);
    removeFrom(state.pins[zone], sel.pkg);
    state.pins[zone].push(sel.pkg);
    state.selected = null;
    saveState();
    refreshAll();
  }

  /** Troca as posições de dois itens; se estiverem em zonas diferentes, cada um fica no lugar do outro. */
  function swapSlots(a, b) {
    const listA = state.pins[a.zone];
    const listB = state.pins[b.zone];

    if (listA === listB) {
      const i = listA.indexOf(a.pkg);
      const j = listA.indexOf(b.pkg);
      if (i === -1 || j === -1) return;
      listA[i] = b.pkg;
      listA[j] = a.pkg;
      return;
    }

    // Caso a app esteja fixada nas duas zonas: evita duplicados, move só o item selecionado.
    if (listA.indexOf(b.pkg) !== -1 || listB.indexOf(a.pkg) !== -1) {
      removeFrom(listA, a.pkg);
      removeFrom(listB, a.pkg);
      const target = listB.indexOf(b.pkg);
      if (target === -1) listB.push(a.pkg);
      else listB.splice(target, 0, a.pkg);
      return;
    }

    const i = listA.indexOf(a.pkg);
    const j = listB.indexOf(b.pkg);
    if (i === -1 || j === -1) return;
    listA[i] = b.pkg;
    listB[j] = a.pkg;
  }

  /* ---------- Ações sobre apps em segundo plano ---------- */

  function launch(app) {
    if (isHidden(app.packageName)) return;
    rememberRecent(app.packageName);
    closePanels();
    bridge.openApp(app.packageName);
  }

  /** Fecha os processos em segundo plano de uma app e retira-a da lista. */
  function closeRunningApp(pkg) {
    bridge.killApp(pkg);
    state.recent = state.recent.filter((p) => p !== pkg);
    saveState();
    refreshAll();
  }

  function closeAllRunning() {
    state.recent.forEach((pkg) => bridge.killApp(pkg));
    state.recent = [];
    saveState();
    refreshAll();
  }

  /* ---------- Atualização das vistas ---------- */

  function refreshAll() {
    renderDesktop();
    renderDock();
    renderProfile();
    if (openPanelId === 'apps') renderApps($('appSearch').value);
    if (openPanelId === 'settings') renderSettings();
  }

  function applyDisplaySize() {
    const style = document.documentElement.style;
    style.setProperty('--taskbar-h', state.bar.height + 'px');
    style.setProperty('--dock-icon', state.bar.icon + 'px');
    style.setProperty('--desk-icon', state.desk.icon + 'px');
    style.setProperty('--desk-tile-w', Math.max(92, state.desk.icon + 52) + 'px');
  }

  /* ---------- Toque longo, menus e diálogos ---------- */

  /**
   * Toque longo em `element`. `filter(target)` decide se o toque inicial conta.
   * `onLong(x, y)` recebe a posição do dedo.
   */
  function attachLongPress(element, onLong, filter) {
    let timer = 0;
    let startX = 0;
    let startY = 0;
    const cancel = () => { clearTimeout(timer); timer = 0; };

    element.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return;
      cancel();
      if (filter && !filter(e.target)) return;
      startX = e.clientX;
      startY = e.clientY;
      timer = setTimeout(() => {
        timer = 0;
        longPressFired = true;
        if (navigator.vibrate) navigator.vibrate(20);
        onLong(startX, startY);
      }, LONG_PRESS_MS);
    });
    // Mexer o dedo mais do que a tolerância cancela o toque longo (é um scroll).
    element.addEventListener('pointermove', (e) => {
      if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_TOLERANCE_PX) cancel();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => element.addEventListener(type, cancel));
    element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function createTile(opts) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = opts.className;
    button.title = opts.label;
    button.setAttribute('aria-label', opts.label);

    const img = document.createElement('img');
    img.alt = '';
    img.draggable = false;
    applyIcon(img, opts.icon);
    button.appendChild(img);

    if (opts.showLabel) {
      const label = document.createElement('span');
      label.className = 'tile-label';
      label.textContent = opts.label;
      button.appendChild(label);
    }

    if (opts.zone) {
      button.classList.add('pinned-tile');
      if (state.selected && state.selected.pkg === opts.packageName && state.selected.zone === opts.zone) {
        button.classList.add('selected');
      }
    }

    button.addEventListener('click', (event) => {
      if (longPressFired) {
        longPressFired = false;
        event.preventDefault();
        return;
      }
      if (state.arranging) {
        if (opts.zone) arrangeTap(opts.packageName, opts.zone);
        return;
      }
      if (opts.onActivate) opts.onActivate();
    });

    if (opts.menu) {
      attachLongPress(button, () => {
        if (!state.arranging) {
          openContextMenu(opts.menu(), button);
        }
      });
    }
    return button;
  }

  /** Espaço vazio no fim de uma zona, usado no modo "Organizar" para mover para o fim. */
  function endSlot(zone) {
    const button = el('button', 'slot-end');
    button.type = 'button';
    button.setAttribute('aria-label', 'Mover para o fim');
    button.title = 'Mover para o fim';
    const icon = el('span', 'slot-plus');
    icon.innerHTML = SVG.plus;
    button.appendChild(icon);
    button.addEventListener('click', () => {
      if (state.selected) moveSelectedToEnd(zone);
    });
    return button;
  }

  /** Itens do menu de uma aplicação, agrupados. */
  function appMenu(app) {
    const pkg = app.packageName;
    const onDesktop = isPinned('desktop', pkg);
    const onDock = isPinned('dock', pkg);
    const groups = [
      [
        { label: 'Renomear', icon: SVG.pencil, action: () => openRenameDialog(app) },
        { label: 'Editar ícone', icon: SVG.image, action: () => openIconDialog(app) },
      ],
      [
        onDesktop
          ? { label: 'Remover do ambiente', icon: SVG.minus, action: () => setPinned('desktop', pkg, false) }
          : { label: 'Afixar no ambiente', icon: SVG.plus, action: () => setPinned('desktop', pkg, true) },
        onDock
          ? { label: 'Remover da barra', icon: SVG.minus, action: () => setPinned('dock', pkg, false) }
          : { label: 'Afixar na barra', icon: SVG.plus, action: () => setPinned('dock', pkg, true) },
      ],
    ];
    if (onDesktop || onDock) {
      groups[1].push({ label: 'Organizar', icon: SVG.arrange, action: () => setArranging(true) });
    }
    groups.push([{ label: 'Ocultar', icon: SVG.eyeOff, action: () => setHidden(pkg, true) }]);
    groups.push([{ label: 'Desinstalar', icon: SVG.trash, danger: true, action: () => openUninstallDialog(app) }]);
    groups.push([{ label: 'Informação', icon: SVG.info, accent: true, action: () => bridge.openAppInfo(pkg) }]);
    return groups;
  }

  /** Menu de uma app em segundo plano: fixar na barra ou fechar. */
  function runningMenu(app) {
    const pkg = app.packageName;
    return [
      [{ label: 'Fixar na barra', icon: SVG.plus, action: () => setPinned('dock', pkg, true) }],
      [{ label: 'Fechar app', icon: SVG.close, danger: true, action: () => closeRunningApp(pkg) }],
    ];
  }

  /** Menu do espaço vazio do ambiente de trabalho. */
  function desktopMenu() {
    return [
      [{ label: 'Organizar', icon: SVG.arrange, action: () => setArranging(true) }],
      [{ label: 'Fechar todas as apps', icon: SVG.close, danger: true, action: closeAllRunning }],
      [{ label: 'Configurações do launcher', icon: SVG.sliders, accent: true, action: () => openPanel('settings') }],
    ];
  }

  function openContextMenu(groups, anchor) {
    const menu = $('ctxMenu');
    menu.innerHTML = '';
    groups.forEach((items, index) => {
      if (index > 0) menu.appendChild(el('div', 'ctx-separator'));
      const list = el('ul', 'ctx-group');
      items.forEach((item) => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ctx-item' + (item.danger ? ' danger' : '') + (item.accent ? ' accent' : '');
        button.setAttribute('role', 'menuitem');
        button.innerHTML = item.icon; // SVG fixo definido neste ficheiro
        button.appendChild(el('span', null, item.label));
        button.addEventListener('click', () => {
          closeContextMenu();
          item.action();
        });
        li.appendChild(button);
        list.appendChild(li);
      });
      menu.appendChild(list);
    });
    menu.hidden = false;

    const r = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - mw / 2), window.innerWidth - mw - 8);
    const above = r.top > mh + 16;
    const top = above ? r.top - mh - 8 : Math.min(r.bottom + 8, window.innerHeight - mh - 8);
    menu.style.left = left + 'px';
    menu.style.top = Math.max(8, top) + 'px';

    const first = menu.querySelector('.ctx-item');
    if (first) first.focus();
  }

  function closeContextMenu() {
    const menu = $('ctxMenu');
    menu.hidden = true;
    menu.innerHTML = '';
  }

  function isContextOpen() {
    return !$('ctxMenu').hidden;
  }

  /* ---------- Diálogos ---------- */

  function openDialog(opts) {
    $('dlgTitle').textContent = opts.title;
    const body = $('dlgBody');
    body.innerHTML = '';
    opts.render(body);
    const ok = $('dlgOk');
    ok.textContent = opts.okLabel || 'Guardar';
    ok.className = 'dlg-btn ' + (opts.danger ? 'danger' : 'primary');
    dialogOnOk = opts.onOk;
    $('dialog').hidden = false;
    const first = body.querySelector('input, button') || ok;
    first.focus();
  }

  function closeDialog() {
    $('dialog').hidden = true;
    dialogOnOk = null;
    $('dlgBody').innerHTML = '';
  }

  function openRenameDialog(app) {
    const pkg = app.packageName;
    openDialog({
      title: 'Renomear',
      okLabel: 'Guardar',
      render(body) {
        const input = el('input', 'text-input');
        input.id = 'dlgInput';
        input.type = 'text';
        input.maxLength = 40;
        input.value = displayName(app);
        input.setAttribute('aria-label', 'Novo nome');
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('dlgOk').click(); });
        body.appendChild(input);
        body.appendChild(el('p', null, 'Deixa o campo vazio para voltar ao nome original («' + app.name + '»).'));
      },
      onOk() {
        const value = $('dlgInput').value.trim();
        setCustom(pkg, 'name', value && value !== app.name ? value : null);
        return true;
      },
    });
  }

  function openIconDialog(app) {
    const pkg = app.packageName;
    const current = state.custom[pkg] && state.custom[pkg].icon;
    let chosen = current || '';   // '' = ícone original
    openDialog({
      title: 'Editar ícone',
      okLabel: 'Guardar',
      render(body) {
        body.appendChild(el('p', null, 'Escolhe um ícone para «' + displayName(app) + '».'));
        const grid = el('div', 'icon-grid');
        grid.setAttribute('role', 'radiogroup');

        const addChoice = (name, uri, isOriginal) => {
          const button = el('button', 'icon-choice' + (isOriginal ? ' original' : ''));
          button.type = 'button';
          button.setAttribute('role', 'radio');
          button.setAttribute('aria-label', isOriginal ? 'Ícone original' : name);
          button.setAttribute('aria-pressed', String(name === chosen));
          if (isOriginal) {
            button.textContent = 'Original';
          } else {
            const img = el('img');
            img.alt = '';
            applyIcon(img, uri);
            button.appendChild(img);
          }
          button.addEventListener('click', () => {
            chosen = name;
            $$('.icon-choice', grid).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
          });
          grid.appendChild(button);
        };

        addChoice('', appIcon(app), true);
        ICON_CHOICES.forEach((name) => addChoice(name, featureIcon(name), false));
        body.appendChild(grid);
      },
      onOk() {
        setCustom(pkg, 'icon', chosen || null);
        return true;
      },
    });
  }

  function openNameDialog() {
    openDialog({
      title: 'Nome de utilizador',
      okLabel: 'Guardar',
      render(body) {
        const input = el('input', 'text-input');
        input.id = 'dlgInput';
        input.type = 'text';
        input.maxLength = 24;
        input.value = state.profile.name;
        input.setAttribute('aria-label', 'Nome de utilizador');
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('dlgOk').click(); });
        body.appendChild(input);
        body.appendChild(el('p', null, 'Aparece no topo do painel de aplicações. Se o deixares vazio, volta a «' + DEFAULT_NAME + '».'));
      },
      onOk() {
        const value = $('dlgInput').value.trim();
        state.profile.name = value ? value.slice(0, 24) : DEFAULT_NAME;
        saveState();
        refreshAll();
        return true;
      },
    });
  }

  function openAvatarDialog() {
    let chosen = state.profile.avatar;
    openDialog({
      title: 'Editar avatar',
      okLabel: 'Guardar',
      render(body) {
        body.appendChild(el('p', null, 'Escolhe o avatar do teu perfil.'));
        const grid = el('div', 'avatar-grid');
        grid.setAttribute('role', 'radiogroup');
        AVATARS.forEach((name, index) => {
          const button = el('button', 'avatar-choice');
          button.type = 'button';
          button.setAttribute('role', 'radio');
          button.setAttribute('aria-label', 'Avatar ' + (index + 1));
          button.setAttribute('aria-pressed', String(name === chosen));
          const img = el('img');
          img.alt = '';
          applyIcon(img, featureIcon(name));
          button.appendChild(img);
          button.addEventListener('click', () => {
            chosen = name;
            $$('.avatar-choice', grid).forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
          });
          grid.appendChild(button);
        });
        body.appendChild(grid);
      },
      onOk() {
        state.profile.avatar = chosen;
        saveState();
        refreshAll();
        return true;
      },
    });
  }

  function openUninstallDialog(app) {
    openDialog({
      title: 'Desinstalar',
      okLabel: 'Desinstalar',
      danger: true,
      render(body) {
        const p = el('p');
        p.appendChild(document.createTextNode('Queres desinstalar '));
        p.appendChild(el('strong', null, displayName(app)));
        p.appendChild(document.createTextNode('? O Android vai pedir a confirmação final.'));
        body.appendChild(p);
      },
      onOk() {
        bridge.uninstallApp(app.packageName);
        return true;
      },
    });
  }

  function openInfoDialog(title, text) {
    openDialog({
      title: title,
      okLabel: 'OK',
      render(body) { body.appendChild(el('p', null, text)); },
      onOk() { return true; },
    });
  }

  /* ---------- Modo "Organizar" ---------- */

  function setArranging(on) {
    state.arranging = on;
    state.selected = null;
    $('desktop').classList.toggle('arranging', on);
    $('arrangeBar').hidden = !on;
    closePanels();
    refreshAll();
  }

  /* ---------- Ambiente de trabalho e barra de tarefas ---------- */

  function renderDesktop() {
    const box = $('desktopIcons');
    box.innerHTML = '';
    let count = 0;
    state.pins.desktop.forEach((pkg) => {
      const app = state.byPackage.get(pkg);
      if (!app || isHidden(pkg)) return;
      count++;
      box.appendChild(createTile({
        className: 'desk-tile', label: displayName(app), icon: displayIcon(app), showLabel: true,
        zone: 'desktop', packageName: app.packageName,
        onActivate: () => launch(app),
        menu: () => appMenu(app),
      }));
    });
    if (state.arranging) box.appendChild(endSlot('desktop'));
    $('deskHint').hidden = count > 0 || state.arranging;
  }

  function renderDock() {
    const dock = $('dock');
    dock.innerHTML = '';
    state.pins.dock.forEach((pkg) => {
      const app = state.byPackage.get(pkg);
      if (!app || isHidden(pkg)) return;
      dock.appendChild(createTile({
        className: 'dock-tile', label: displayName(app), icon: displayIcon(app),
        zone: 'dock', packageName: app.packageName,
        onActivate: () => launch(app),
        menu: () => appMenu(app),
      }));
    });
    if (state.arranging) {
      dock.appendChild(endSlot('dock'));
      return;
    }
    const running = runningApps();
    if (running.length) {
      dock.appendChild(el('span', 'dock-sep'));
      running.forEach((app) => {
        dock.appendChild(createTile({
          className: 'dock-tile running', label: displayName(app), icon: displayIcon(app),
          onActivate: () => launch(app),
          menu: () => runningMenu(app),
        }));
      });
    }
  }

  function renderProfile() {
    $('headerName').textContent = state.profile.name;
    applyIcon($('headerAvatar'), featureIcon(state.profile.avatar));
    const n = visibleApps().length;
    $('headerCount').textContent = n + (n === 1 ? ' aplicação' : ' aplicações');
  }

  function renderApps(filter) {
    const grid = $('appGrid');
    grid.innerHTML = '';
    const apps = visibleApps();
    if (!state.apps.length) {
      grid.appendChild(emptyNode('Não foi possível carregar as aplicações.'));
      return;
    }
    if (!apps.length) {
      grid.appendChild(emptyNode('Todas as aplicações estão ocultas. Podes voltar a mostrá-las em Configurações → Aplicações.'));
      return;
    }
    const term = norm(filter).trim();
    const matches = apps
      .filter((a) => norm(displayName(a)).includes(term))
      .sort((a, b) => byName(displayName(a), displayName(b)));
    if (!matches.length) {
      grid.appendChild(emptyNode('Nenhuma aplicação corresponde à pesquisa.'));
      return;
    }
    matches.forEach((app) => {
      grid.appendChild(createTile({
        className: 'app-tile', label: displayName(app), icon: displayIcon(app), showLabel: true,
        onActivate: () => launch(app),
        menu: () => appMenu(app),
      }));
    });
  }

  function emptyNode(text) {
    return el('div', 'empty', text);
  }

  /* ---------- Configurações do launcher ---------- */

  function setSettingsView(name) {
    state.settingsView = SETTINGS_TITLES[name] ? name : 'main';
    Object.keys(SETTINGS_TITLES).forEach((key) => {
      $('set' + key.charAt(0).toUpperCase() + key.slice(1)).hidden = key !== state.settingsView;
    });
    $('settingsTitle').textContent = SETTINGS_TITLES[state.settingsView];
    $('settingsBack').hidden = state.settingsView === 'main';
    renderSettings();
  }

  function renderSettings() {
    if (openPanelId !== 'settings') return;
    $('settingsName').textContent = state.profile.name;
    applyIcon($('settingsAvatar'), featureIcon(state.profile.avatar));
    syncBarSliders();
    if (state.settingsView === 'aspect') renderWallpapers();
    if (state.settingsView === 'apps') renderAppsSettings();
  }

  function syncBarSliders() {
    const sliders = [
      ['barHeightRange', 'barHeightValue', state.bar.height, ' px'],
      ['barIconRange', 'barIconValue', state.bar.icon, ' px'],
      ['deskIconRange', 'deskIconValue', state.desk.icon, ' px'],
    ];
    sliders.forEach(([rangeId, valueId, value, unit]) => {
      const range = $(rangeId);
      if (!isFocused(range)) range.value = value;
      $(valueId).textContent = value + unit;
    });
  }

  /** Lista de todas as aplicações instaladas, com editar e ocultar/mostrar. */
  function renderAppsSettings() {
    const list = $('appsList');
    list.innerHTML = '';
    if (!state.apps.length) {
      list.appendChild(el('p', 'card-note', 'Não foi possível carregar as aplicações.'));
      return;
    }
    state.apps.forEach((app) => {
      const hidden = isHidden(app.packageName);
      const row = el('div', 'app-row' + (hidden ? ' is-hidden' : ''));

      const img = el('img', 'app-row-icon');
      img.alt = '';
      applyIcon(img, displayIcon(app));

      const name = el('span', 'app-row-name', displayName(app));

      const edit = el('button', 'row-action');
      edit.type = 'button';
      edit.setAttribute('aria-label', 'Editar ' + displayName(app));
      edit.title = 'Editar';
      edit.innerHTML = SVG.pencil;
      edit.addEventListener('click', () => openContextMenu([
        [{ label: 'Renomear', icon: SVG.pencil, action: () => openRenameDialog(app) }],
        [{ label: 'Editar ícone', icon: SVG.image, action: () => openIconDialog(app) }],
      ], edit));

      const toggle = el('button', 'row-action toggle' + (hidden ? ' off' : ''));
      toggle.type = 'button';
      toggle.setAttribute('aria-pressed', String(hidden));
      toggle.setAttribute('aria-label', hidden ? 'Mostrar ' + displayName(app) : 'Ocultar ' + displayName(app));
      toggle.title = hidden ? 'Mostrar' : 'Ocultar';
      toggle.innerHTML = hidden ? SVG.eyeOff : SVG.eye;
      toggle.addEventListener('click', () => setHidden(app.packageName, !hidden));

      row.append(img, name, edit, toggle);
      list.appendChild(row);
    });
  }

  /* ---------- Papel de parede ---------- */

  function applyWallpaper(value) {
    if (value === 'custom' && !customUri) value = 0;
    state.wallpaper = value;
    saveState();
    $('desktop').style.backgroundImage = value === 'custom'
      ? 'url("' + customUri + '")'
      : "url('wallpapers/" + pad2(value) + ".jpg')";
    if (openPanelId === 'settings' && state.settingsView === 'aspect') renderWallpapers();
  }

  function renderWallpapers() {
    const grid = $('wallpaperGrid');
    grid.innerHTML = '';

    const options = [];
    for (let i = 0; i < WALLPAPER_COUNT; i++) {
      options.push({ value: i, label: 'Papel de parede ' + (i + 1), src: 'wallpapers/' + WALLPAPER_FILES[i] });
    }
    if (customUri) options.push({ value: 'custom', label: 'Papel de parede da galeria', src: customUri });

    options.forEach((opt) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'wallpaper-option';
      option.setAttribute('aria-label', opt.label);
      option.setAttribute('aria-pressed', String(opt.value === state.wallpaper));
      const img = document.createElement('img');
      img.alt = '';
      img.src = opt.src;
      option.appendChild(img);
      option.addEventListener('click', () => applyWallpaper(opt.value));
      grid.appendChild(option);
    });

    const add = el('button', 'wallpaper-option wallpaper-add');
    add.type = 'button';
    add.setAttribute('aria-label', 'Escolher imagem da galeria');
    const plus = el('img');
    plus.alt = '';
    plus.dataset.icon = 'ic_add';
    applyIcon(plus, featureIcon('ic_add'));
    add.append(plus, el('span', null, 'Galeria'));
    add.addEventListener('click', () => bridge.pickWallpaper());
    grid.appendChild(add);
  }

  // Chamado pelo Android depois de escolher uma imagem na galeria.
  window.desktopWallpaperPicked = function (ok) {
    if (!ok) {
      openInfoDialog('Papel de parede', 'Não foi possível usar essa imagem. Experimenta outra.');
      return;
    }
    customUri = safe(() => bridge.getCustomWallpaper(), '') || '';
    if (customUri) applyWallpaper('custom');
  };

  /* ---------- Notificações ---------- */

  function renderNotificationList(items) {
    // Só redesenha quando há mudanças: senão a rolagem salta a cada atualização.
    const signature = notificationsEnabled ? JSON.stringify(items) : 'sem-acesso';
    if (signature === notificationSignature) return;
    notificationSignature = signature;

    const list = $('notificationList');
    list.innerHTML = '';
    if (!notificationsEnabled) {
      list.appendChild(emptyNode('Autoriza o acesso às notificações nas definições do Android para as veres aqui.'));
      return;
    }
    if (!items.length) {
      list.appendChild(emptyNode('Não existem notificações ativas.'));
      return;
    }
    items.forEach((n) => {
      const app = state.byPackage.get(n.packageName);
      const card = document.createElement('div');
      card.className = 'notification-card';

      const appName = el('span', 'notif-app', app ? displayName(app) : (n.packageName || ''));
      const title = el('strong', null, n.title || 'Notificação');
      const body = el('p', null, n.text || '');
      card.append(appName, title, body);

      // Botão para dispensar esta notificação (não abre a app).
      if (n.key) {
        card.classList.add('has-dismiss');
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'notif-dismiss';
        dismiss.setAttribute('aria-label', 'Dispensar notificação');
        dismiss.title = 'Dispensar';
        const icon = document.createElement('img');
        icon.alt = '';
        icon.dataset.icon = 'ic_close';
        applyIcon(icon, featureIcon('ic_close'));
        dismiss.appendChild(icon);
        dismiss.addEventListener('click', (e) => {
          e.stopPropagation();
          bridge.dismissNotification(n.key);
          refreshNotifications(true);
        });
        card.appendChild(dismiss);
      }

      // Tocar numa notificação abre a aplicação de origem.
      if (app) {
        card.dataset.package = app.packageName;
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        card.addEventListener('click', () => launch(app));
        card.addEventListener('keydown', (e) => { if (e.key === 'Enter') launch(app); });
      }
      list.appendChild(card);
    });
  }

  function refreshNotifications(force) {
    notificationsEnabled = safe(() => bridge.hasNotificationAccess() === true, false);
    let items = [];
    if (notificationsEnabled) {
      try { items = JSON.parse(bridge.getNotifications() || '[]'); } catch (e) { items = []; }
    }
    $('notificationDot').hidden = !(notificationsEnabled && items.length);
    $('notifPermission').hidden = notificationsEnabled;
    if (openPanelId === 'notif') {
      if (force) notificationSignature = '';
      renderNotificationList(items);
    }
  }

  /* ---------- Controlos rápidos ---------- */

  function volumeIconFor(level) {
    if (level <= 0) return 'ic_volume_off';
    if (level < 50) return 'ic_volume_down';
    return 'ic_volume_up';
  }

  /** Um botão de estado: azul quando ligado, cinzento quando desligado. Mesma regra para todos. */
  function setQuickTile(name, on) {
    $(name + 'Toggle').setAttribute('aria-pressed', String(on));
    $(name + 'State').textContent = on ? 'Ligado' : 'Desligado';
  }

  function refreshQuickSettings() {
    const wifi = safe(() => bridge.isWifiEnabled() === true, false);
    const bluetooth = safe(() => bridge.isBluetoothEnabled() === true, false);
    const location = safe(() => bridge.isLocationEnabled() === true, false);
    const volume = Number(safe(() => bridge.getVolume(), 0)) || 0;
    const brightness = Number(safe(() => bridge.getBrightness(), 50)) || 50;

    setQuickTile('wifi', wifi);
    setIcon($('wifiIcon'), wifi ? 'ic_wifi' : 'ic_wifi_off');
    setQuickTile('bluetooth', bluetooth);
    setQuickTile('location', location);

    // Não mexe nos sliders enquanto o utilizador os está a arrastar.
    if (!isFocused($('volumeRange'))) $('volumeRange').value = volume;
    if (!isFocused($('brightnessRange'))) $('brightnessRange').value = brightness;
    $('volumeValue').textContent = $('volumeRange').value + '%';
    $('brightnessValue').textContent = $('brightnessRange').value + '%';

    const volIcon = volumeIconFor(Number($('volumeRange').value));
    setIcon($('volumeIcon'), volIcon);
    setIcon($('muteIcon'), volIcon);
  }

  /* ---------- Pesquisa da barra: apps, definições ou Google ---------- */

  /** Definições que a pesquisa também encontra. `keys` estão sem acentos e em minúsculas. */
  function settingsOptions() {
    return [
      { label: 'Definições do Android', icon: 'ic_settings', keys: ['definicoes', 'configuracoes', 'settings', 'android'],
        run: () => bridge.openAndroidSettings() },
      { label: 'Aplicações', icon: 'ic_app', keys: ['aplicacoes', 'apps', 'aplicativos'],
        run: () => openPanel('apps') },
      { label: 'Configurações do launcher', icon: 'ic_settings', keys: ['launcher', 'configuracoes do launcher', 'preferencias'],
        run: () => openPanel('settings') },
      { label: 'Papel de parede', icon: 'ic_wallpaper', keys: ['papel', 'parede', 'wallpaper', 'fundo'],
        run: () => { openPanel('settings'); setSettingsView('aspect'); } },
      { label: 'Wi-Fi', icon: 'ic_wifi', keys: ['wifi', 'wi-fi', 'rede'],
        run: () => bridge.openWifiSettings() },
      { label: 'Bluetooth', icon: 'ic_bluetooth', keys: ['bluetooth'],
        run: () => bridge.openBluetoothSettings() },
      { label: 'Localização', icon: 'ic_location', keys: ['localizacao', 'gps', 'location'],
        run: () => bridge.openLocationSettings() },
      { label: 'Notificações', icon: 'ic_notifications', keys: ['notificacoes', 'notificacao'],
        run: () => openPanel('notif') },
    ].map((opt) => Object.assign(opt, {
      match: (q) => norm(opt.label).includes(q) || opt.keys.some((k) => k.includes(q)),
    }));
  }

  function searchGoogle(query) {
    hideSuggest();
    bridge.openGoogleSearch(query);
  }

  function renderSuggest() {
    const raw = $('dockSearch').value.trim();
    if (!raw) { hideSuggest(); return; }
    const q = norm(raw);
    const box = $('searchSuggest');
    box.innerHTML = '';
    suggest.items = [];

    visibleApps()
      .filter((app) => norm(displayName(app)).includes(q))
      .slice(0, SEARCH_APP_LIMIT)
      .forEach((app) => suggest.items.push({
        label: displayName(app), sub: 'Aplicação', icon: displayIcon(app),
        run: () => launch(app),
      }));

    settingsOptions()
      .filter((opt) => opt.match(q))
      .forEach((opt) => suggest.items.push({
        label: opt.label, sub: 'Definição', icon: featureIcon(opt.icon), run: opt.run,
      }));

    // Só se não houver nenhuma opção é que se oferece a pesquisa na Web.
    if (!suggest.items.length) {
      suggest.items.push({
        label: 'Pesquisar «' + raw + '» no Google', sub: '', icon: featureIcon('ic_search'),
        run: () => searchGoogle(raw),
      });
    }

    suggest.items.forEach((item) => {
      const button = el('button', 'suggest-item');
      button.type = 'button';
      button.setAttribute('role', 'option');
      const img = el('img');
      img.alt = '';
      applyIcon(img, item.icon);
      const text = el('span', 'suggest-text');
      text.appendChild(el('strong', null, item.label));
      if (item.sub) text.appendChild(el('small', null, item.sub));
      button.append(img, text);
      button.addEventListener('click', () => runSuggest(item));
      box.appendChild(button);
    });
    box.hidden = false;
  }

  function hideSuggest() {
    const box = $('searchSuggest');
    box.hidden = true;
    box.innerHTML = '';
    suggest.items = [];
  }

  function runSuggest(item) {
    hideSuggest();
    $('dockSearch').value = '';
    item.run();
  }

  function submitSearch(e) {
    e.preventDefault();
    if (!$('dockSearch').value.trim()) return;
    renderSuggest();
    if (suggest.items.length) runSuggest(suggest.items[0]);
  }

  /* ---------- Painéis ---------- */

  function updateExpandedState() {
    $('startBtn').setAttribute('aria-expanded', String(openPanelId === 'apps'));
    $('trayBtn').setAttribute('aria-expanded', String(openPanelId === 'notif'));
  }

  function openPanel(id) {
    closePanels();
    openPanelId = id;
    $(PANELS[id]).hidden = false;
    if (id === 'apps') {
      loadApps();
      renderApps($('appSearch').value);
    } else if (id === 'notif') {
      refreshQuickSettings();
      refreshNotifications(true);
    } else if (id === 'settings') {
      setSettingsView('main');
    }
    updateExpandedState();
  }

  function closePanels() {
    Object.keys(PANELS).forEach((key) => { $(PANELS[key]).hidden = true; });
    openPanelId = null;
    closeContextMenu();
    hideSuggest();
    updateExpandedState();
  }

  function togglePanel(id) {
    if (openPanelId === id) closePanels();
    else openPanel(id);
  }

  function clock() {
    const now = new Date();
    $('time').textContent = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    $('date').textContent = now.toLocaleDateString('pt-PT');
  }

  /** Espaço vazio do ambiente de trabalho: toque longo abre o menu. */
  function isEmptyDesktopTarget(target) {
    if (state.arranging) return false;
    return !target.closest('.desk-tile, .taskbar, .panel, .arrange-bar, .dialog-backdrop, .context-menu');
  }

  /* ---------- Eventos e arranque ---------- */

  function bindEvents() {
    $('startBtn').addEventListener('click', () => togglePanel('apps'));
    $('trayBtn').addEventListener('click', () => togglePanel('notif'));
    $('notifPermission').addEventListener('click', () => bridge.openNotificationAccess());
    $('appSearch').addEventListener('input', (e) => renderApps(e.target.value));
    $('profileChip').addEventListener('click', () => { openPanel('settings'); setSettingsView('profile'); });
    $('openSettingsBtn').addEventListener('click', () => openPanel('settings'));
    $('settingsBack').addEventListener('click', () => setSettingsView('main'));
    $$('[data-goto]').forEach((btn) => btn.addEventListener('click', () => setSettingsView(btn.dataset.goto)));
    $('avatarRow').addEventListener('click', openAvatarDialog);
    $('nameRow').addEventListener('click', openNameDialog);
    $('androidSettingsBtn').addEventListener('click', () => bridge.openAndroidSettings());

    const sliderBindings = [
      ['barHeightRange', 'barHeightValue', ' px', (v) => { state.bar.height = clampInt(v, BAR_LIMITS.height, BAR_DEFAULTS.height); return state.bar.height; }],
      ['barIconRange', 'barIconValue', ' px', (v) => { state.bar.icon = clampInt(v, BAR_LIMITS.icon, BAR_DEFAULTS.icon); return state.bar.icon; }],
      ['deskIconRange', 'deskIconValue', ' px', (v) => { state.desk.icon = clampInt(v, DESK_LIMIT, DESK_DEFAULT_ICON); return state.desk.icon; }],
    ];
    sliderBindings.forEach(([rangeId, valueId, unit, apply]) => {
      const range = $(rangeId);
      range.addEventListener('input', (e) => {
        $(valueId).textContent = apply(e.target.value) + unit;
        applyDisplaySize();
      });
      range.addEventListener('change', saveState);
    });
    $('resetBarBtn').addEventListener('click', () => {
      state.bar = { height: BAR_DEFAULTS.height, icon: BAR_DEFAULTS.icon };
      state.desk = { icon: DESK_DEFAULT_ICON };
      applyDisplaySize();
      saveState();
      syncBarSliders();
    });

    $('dockSearchForm').addEventListener('submit', submitSearch);
    $('dockSearch').addEventListener('input', renderSuggest);
    $('dockSearch').addEventListener('focus', renderSuggest);
    $('dockSearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSuggest(); });

    $('volumeBtn').addEventListener('click', () => { bridge.toggleMute(); refreshQuickSettings(); });
    $('muteBtn').addEventListener('click', () => { bridge.toggleMute(); refreshQuickSettings(); });
    $('volumeRange').addEventListener('input', (e) => {
      bridge.setVolume(Number(e.target.value));
      $('volumeValue').textContent = e.target.value + '%';
    });
    $('volumeRange').addEventListener('change', () => refreshQuickSettings());
    $('brightnessRange').addEventListener('input', (e) => {
      $('brightnessValue').textContent = e.target.value + '%';
    });
    $('brightnessRange').addEventListener('change', (e) => bridge.setBrightness(Number(e.target.value)));

    $('wifiToggle').addEventListener('click', () => { bridge.toggleWifi(); setTimeout(refreshQuickSettings, 700); });
    $('bluetoothToggle').addEventListener('click', () => { bridge.toggleBluetooth(); setTimeout(refreshQuickSettings, 700); });
    $('locationToggle').addEventListener('click', () => bridge.openLocationSettings());
    $('clearNotificationsBtn').addEventListener('click', () => { bridge.clearNotifications(); refreshNotifications(true); });

    $$('[data-close]').forEach((button) => button.addEventListener('click', closePanels));
    $('arrangeDone').addEventListener('click', () => setArranging(false));

    $('dlgCancel').addEventListener('click', closeDialog);
    $('dlgOk').addEventListener('click', () => {
      const onOk = dialogOnOk;
      if (!onOk) { closeDialog(); return; }
      if (onOk() !== false) closeDialog();
    });
    $('dialog').addEventListener('click', (e) => { if (e.target === $('dialog')) closeDialog(); });

    // Toque longo no espaço vazio do ambiente abre o menu do ambiente.
    attachLongPress($('desktop'), (x, y) => {
      closePanels();
      openContextMenu(desktopMenu(), {
        getBoundingClientRect: () => ({ left: x, right: x, top: y, bottom: y, width: 0, height: 0 }),
      });
    }, isEmptyDesktopTarget);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('dialog').hidden) closeDialog();
      else if (isContextOpen()) closeContextMenu();
      else if (state.arranging) setArranging(false);
      else closePanels();
    });

    // Em fase de captura, antes de qualquer tile: cada toque novo limpa o estado de toque longo.
    document.addEventListener('pointerdown', () => { longPressFired = false; }, true);

    // Toque fora de painéis e menus fecha-os.
    document.addEventListener('pointerdown', (e) => {
      if (isContextOpen() && !e.target.closest('#ctxMenu')) closeContextMenu();
      if (openPanelId && !e.target.closest('.panel, .taskbar, .desk-tile, #ctxMenu, .dialog-backdrop')) closePanels();
      if (!e.target.closest('.taskbar-center')) hideSuggest();
    });

    // Ao voltar de outra app (ex.: após desinstalar), atualiza a lista.
    window.addEventListener('focus', () => { if (!state.arranging) loadApps(); });
  }

  // Chamado pelo Android ao premir Voltar: fecha o que estiver aberto, ou recua uma vista das configurações.
  window.desktopBack = function () {
    if (!$('dialog').hidden) { closeDialog(); return true; }
    if (isContextOpen()) { closeContextMenu(); return true; }
    if (openPanelId === 'settings' && state.settingsView !== 'main') { setSettingsView('main'); return true; }
    if (openPanelId) { closePanels(); return true; }
    if (state.arranging) { setArranging(false); return true; }
    return false;
  };

  function boot() {
    loadState();
    if (safe(() => bridge.hasCustomWallpaper() === true, false)) {
      customUri = safe(() => bridge.getCustomWallpaper(), '') || '';
    }
    if (state.wallpaper === 'custom' && !customUri) state.wallpaper = 0;
    applyDisplaySize();
    applyWallpaper(state.wallpaper);
    hydrateIcons(document);
    bindEvents();
    clock();
    setInterval(clock, 10000);
    loadApps();
    refreshQuickSettings();
    refreshNotifications();
    setInterval(refreshNotifications, 6000);
    setInterval(refreshQuickSettings, 12000);
  }

  boot();
})();
