/* Desktop Launcher v1.0.0: ambiente de trabalho, barra de tarefas, painéis e menus.
 * Fala com o Android através de window.Desktop (ver MainActivity.java).
 * Fora do Android (ex.: abrir index.html no PC) usa uma ponte de pré-visualização. */
(function () {
  'use strict';

  const STORE_KEY = 'desktop-launcher.v3';
  const LEGACY_KEY = 'desktop-launcher.v2';
  const LONG_PRESS_MS = 450;
  const MOVE_TOLERANCE_PX = 10;   // movimento que cancela o toque longo e inicia o arrasto
  const WALLPAPER_COUNT = 5;
  const WALLPAPER_FILES = ['00.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'];
  const SEARCH_APP_LIMIT = 5;
  const DEFAULT_NAME = 'Utilizador';
  const AVATARS = ['ic_avatar_00', 'ic_avatar_01'];
  const BAR_DEFAULTS = { height: 56, icon: 30 };
  const BAR_LIMITS = { height: [52, 84], icon: [20, 40] };

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

  // Ícones do menu de contexto (usam currentColor).
  const SVG = {
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    image: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M9,42q-1.2,0-2.1-0.9T6,39V9Q6,7.8 6.9,6.9T9,6H39q1.2,0 2.1,0.9T42,9V39q0,1.2-0.9,2.1T39,42H9Zm0-3H39V9H9V39Zm2.8-4.85H36.25l-7.35-9.8L22.3,32.9l-4.65-6.35l-5.85,7.6ZM9,39V9V39Zm9.78-20.23q0.72-0.73 0.72-1.77t-0.73-1.77T16.99,14.5t-1.77,0.73T14.5,17.01t0.73,1.77t1.77,0.73t1.77-0.73Z"/></svg>',
    minus: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M10,25.5v-3H38v3H10Z"/></svg>',
    plus: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M22.5,38V25.5H10v-3h12.5V10h3v12.5H38v3H25.5V38Z"/></svg>',
    arrange: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/></svg>',
    trash: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M13.05,42q-1.24,0-2.12-0.88T10.05,39V10.5H8v-3h9.4V6H30.6V7.5H40v3H37.95V39q0,1.2-0.9,2.1T34.95,42H13.05Zm21.9-31.5H13.05V39h21.9V10.5ZM18.35,34.7h3V14.75h-3V34.7Zm8.3,0h3V14.75h-3V34.7ZM13.05,10.5V39V10.5Z"/></svg>',
    info: '<svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M22.65,34h3V22h-3V34Zm2.52-16.16q0.48-0.46 0.48-1.14q0-0.72-0.47-1.21T24,15t-1.18,0.49T22.35,16.7q0,0.68 0.47,1.14T24,18.3t1.18-0.46ZM24.01,44q-4.14,0-7.78-1.58t-6.36-4.3t-4.3-6.37T4,23.98t1.58-7.78t4.3-6.34t6.37-4.28T24.03,4t7.78,1.57t6.34,4.28t4.28,6.35T44,23.99t-1.57,7.78t-4.28,6.35t-6.35,4.3T24.01,44Zm0.01-3q7.07,0 12.03-4.98T41,23.98T36.06,11.95T24,7q-7.05,0-12.02,4.94T7,24q0,7.05 4.98,12.02T24.03,41ZM24,24Z"/></svg>',
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
    const n = Math.round(Number(value));
    if (value === null || value === undefined || value === '' || !Number.isFinite(n)) return fallback;
    return Math.min(range[1], Math.max(range[0], n));
  };

  const bridge = window.Desktop || createPreviewBridge();

  const state = {
    apps: [],
    byPackage: new Map(),
    pins: { desktop: [], dock: [] },
    hidden: [],                                   // pacotes ocultos (somem do launcher todo)
    custom: {},                                   // { pacote: { name?: string, icon?: nome } }
    profile: { name: DEFAULT_NAME, avatar: AVATARS[0] },
    wallpaper: 0,                                 // índice 0-4, ou 'custom'
    bar: { height: BAR_DEFAULTS.height, icon: BAR_DEFAULTS.icon },
    drag: null,                                   // { pkg, zone } enquanto um ícone afixado é arrastado
    arranging: false,                             // modo "Organizar"
  };
  const iconCache = new Map();
  const suggest = { items: [] };
  let customUri = '';                             // papel de parede do utilizador, em memória
  let openPanelId = null;
  let dialogOnOk = null;
  let longPressFired = false;   // o gesto que acabou de acontecer não deve contar como toque
  let notificationsEnabled = false;
  let notificationSignature = '';

  const PANELS = { apps: 'panelApps', notif: 'panelNotif', wallpaper: 'panelWallpaper' };

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
    try {
      saved = JSON.parse(localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_KEY) || '{}') || {};
    } catch (e) {
      saved = {};
    }
    const onlyStrings = (list) => Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];

    state.pins.desktop = onlyStrings(saved.desktop);
    state.pins.dock = onlyStrings(saved.dock);
    state.hidden = onlyStrings(saved.hidden);

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
    state.bar.height = clampInt(bar.height, BAR_LIMITS.height, BAR_DEFAULTS.height);
    state.bar.icon = clampInt(bar.icon, BAR_LIMITS.icon, BAR_DEFAULTS.icon);

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
        custom: state.custom,
        profile: state.profile,
        bar: state.bar,
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
      if (!uri) uri = featureIcon('ic_category');
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

  /* ---------- Aplicações, fixações e ocultação ---------- */

  function loadApps() {
    let list = [];
    try { list = JSON.parse(bridge.getApps() || '[]'); } catch (e) { list = []; }
    state.apps = list
      .filter((a) => a && a.packageName)
      .map((a) => ({ name: String(a.name || a.packageName), packageName: a.packageName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
    state.byPackage = new Map(state.apps.map((a) => [a.packageName, a]));
    if (state.apps.length) pruneMissingPins();
    refreshAll();
  }

  /** Tira das fixações e da lista de ocultas as apps que já não existem (ex.: desinstaladas). */
  function pruneMissingPins() {
    let changed = false;
    ['desktop', 'dock'].forEach((zone) => {
      const before = state.pins[zone].length;
      state.pins[zone] = state.pins[zone].filter((pkg) => state.byPackage.has(pkg));
      if (state.pins[zone].length !== before) changed = true;
    });
    const hiddenBefore = state.hidden.length;
    state.hidden = state.hidden.filter((pkg) => state.byPackage.has(pkg));
    if (state.hidden.length !== hiddenBefore) changed = true;
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

  function refreshAll() {
    renderDesktop();
    renderDock();
    renderProfile();
    renderSettings();
    if (openPanelId === 'apps') renderApps($('appSearch').value);
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

  /** Coloca `pkg` na zona `zone`, antes de `beforePkg` (ou no fim se for null). */
  function movePinned(zone, pkg, beforePkg) {
    const list = state.pins[zone];
    const oldIndex = list.indexOf(pkg);
    if (oldIndex !== -1) list.splice(oldIndex, 1);
    const newIndex = beforePkg ? list.indexOf(beforePkg) : -1;
    if (newIndex < 0) list.push(pkg);
    else list.splice(newIndex, 0, pkg);
    saveState();
    refreshAll();
  }

  function removeFromZone(zone, pkg) {
    const list = state.pins[zone];
    const index = list.indexOf(pkg);
    if (index !== -1) list.splice(index, 1);
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

  function launch(app) {
    closePanels();
    bridge.openApp(app.packageName);
  }

  /* ---------- Toque longo, arrasto e menu de contexto ---------- */

  function attachLongPress(element, onLong) {
    let timer = 0;
    let startX = 0;
    let startY = 0;
    const cancel = () => { clearTimeout(timer); timer = 0; };

    element.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return; // ignora botões secundários e do meio
      cancel();
      startX = e.clientX;
      startY = e.clientY;
      timer = setTimeout(() => {
        timer = 0;
        longPressFired = true;
        if (navigator.vibrate) navigator.vibrate(20);
        onLong();
      }, LONG_PRESS_MS);
    });
    // Mexer o dedo mais do que a tolerância cancela o toque longo (é um arrasto ou um scroll).
    element.addEventListener('pointermove', (e) => {
      if (timer && Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_TOLERANCE_PX) cancel();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => element.addEventListener(type, cancel));
    element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Arrasto por ponteiro, só no modo "Organizar" (o drag-and-drop HTML5 não funciona na WebView). */
  function makePinnedDraggable(button, zone, pkg) {
    button.classList.add('pinned-tile');
    button.dataset.packageName = pkg;
    button.dataset.zone = zone;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    button.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || isContextOpen() || !state.arranging) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
    });

    button.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId || isContextOpen() || !state.arranging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging) {
        if (Math.hypot(dx, dy) < MOVE_TOLERANCE_PX) return;
        dragging = true;
        longPressFired = true;  // o gesto acaba num arrasto, não num toque
        try { button.setPointerCapture(pointerId); } catch (err) { /* ignorado */ }
        button.classList.add('dragging');
        state.drag = { pkg: pkg, zone: zone };
      }
      button.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
      markDropZone(e.clientX, e.clientY);
    });

    const finish = (e, drop) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (!dragging) return;
      dragging = false;
      try { button.releasePointerCapture(e.pointerId); } catch (err) { /* ignorado */ }
      button.classList.remove('dragging');
      button.style.transform = '';
      clearDropMarks();
      if (drop) dropAt(e.clientX, e.clientY);
      state.drag = null;
    };
    button.addEventListener('pointerup', (e) => finish(e, true));
    button.addEventListener('pointercancel', (e) => finish(e, false));
  }

  function markDropZone(x, y) {
    const hit = document.elementFromPoint(x, y);
    const zoneEl = hit ? hit.closest('#dock, #desktopIcons') : null;
    $$('.drop-target').forEach((n) => { if (n !== zoneEl) n.classList.remove('drop-target'); });
    if (zoneEl) zoneEl.classList.add('drop-target');
  }

  function clearDropMarks() {
    $$('.drop-target').forEach((n) => n.classList.remove('drop-target'));
  }

  function dropAt(x, y) {
    const drag = state.drag;
    if (!drag) return;
    const hit = document.elementFromPoint(x, y);
    const zoneEl = hit && hit.closest('#dock, #desktopIcons');
    if (!zoneEl) return; // largado fora da barra ou do ambiente de trabalho: não muda nada

    const zone = zoneEl.id === 'dock' ? 'dock' : 'desktop';
    const list = state.pins[zone];
    let beforePkg = null;

    const tile = hit.closest('.pinned-tile');
    if (tile && tile.dataset.zone === zone) {
      if (tile.dataset.packageName === drag.pkg) return; // largou em cima de si próprio
      const r = tile.getBoundingClientRect();
      const firstHalf = zone === 'dock' ? x < r.left + r.width / 2 : y < r.top + r.height / 2;
      const index = list.indexOf(tile.dataset.packageName);
      beforePkg = firstHalf ? tile.dataset.packageName : (list[index + 1] || null);
      if (beforePkg === drag.pkg) return; // já está nesse lugar
    }

    if (drag.zone !== zone) removeFromZone(drag.zone, drag.pkg); // mover de uma zona para a outra
    movePinned(zone, drag.pkg, beforePkg);
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

    button.addEventListener('click', (event) => {
      if (longPressFired) {
        longPressFired = false;
        event.preventDefault();
        return;
      }
      if (state.arranging) return; // em "Organizar" um toque não abre a app
      if (opts.onActivate) opts.onActivate();
    });

    if (opts.menu) {
      attachLongPress(button, () => {
        if (!state.arranging) openContextMenu(opts.menu(), button);
      });
    }
    if (opts.zone && opts.packageName) makePinnedDraggable(button, opts.zone, opts.packageName);
    return button;
  }

  /* ---------- Menu de contexto ---------- */

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
    groups.push([
      { label: 'Ocultar', icon: SVG.eyeOff, action: () => setHidden(pkg, true) },
    ]);
    groups.push([
      { label: 'Desinstalar', icon: SVG.trash, danger: true, action: () => openUninstallDialog(app) },
    ]);
    groups.push([
      { label: 'Informação', icon: SVG.info, accent: true, action: () => bridge.openAppInfo(pkg) },
    ]);
    return groups;
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
    $('desktop').classList.toggle('arranging', on);
    $('arrangeBar').hidden = !on;
    closePanels();
    if (!on) clearDropMarks();
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
    $('deskHint').hidden = count > 0;
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
  }

  function applyBarSize() {
    const style = document.documentElement.style;
    style.setProperty('--taskbar-h', state.bar.height + 'px');
    style.setProperty('--dock-icon', state.bar.icon + 'px');
  }

  /* ---------- Cabeçalho do perfil e painel de aplicações ---------- */

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
      grid.appendChild(emptyNode('Todas as aplicações estão ocultas. Podes voltar a mostrá-las em Configurações.'));
      return;
    }
    const term = norm(filter).trim();
    const matches = apps
      .filter((a) => norm(displayName(a)).includes(term))
      .sort((a, b) => displayName(a).localeCompare(displayName(b), 'pt', { sensitivity: 'base' }));
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

  /* ---------- Configurações ---------- */

  function renderSettings() {
    $('settingsName').textContent = state.profile.name;
    applyIcon($('settingsAvatar'), featureIcon(state.profile.avatar));
    syncBarSliders();
    renderHiddenList();
  }

  function syncBarSliders() {
    const height = $('barHeightRange');
    const icon = $('barIconRange');
    if (!isFocused(height)) height.value = state.bar.height;
    if (!isFocused(icon)) icon.value = state.bar.icon;
    $('barHeightValue').textContent = state.bar.height + ' px';
    $('barIconValue').textContent = state.bar.icon + ' px';
  }

  function renderHiddenList() {
    const box = $('hiddenList');
    box.innerHTML = '';
    const hidden = state.apps.filter((app) => isHidden(app.packageName));
    if (!hidden.length) {
      box.appendChild(el('p', 'card-note', 'Não há aplicações ocultas. Mantém premida uma aplicação e escolhe «Ocultar».'));
      return;
    }
    hidden.forEach((app) => {
      const row = el('div', 'hidden-row');
      const img = el('img');
      img.alt = '';
      applyIcon(img, displayIcon(app));
      const name = el('span', 'hidden-name', displayName(app));
      const show = el('button', 'pill-btn', 'Mostrar');
      show.type = 'button';
      show.addEventListener('click', () => setHidden(app.packageName, false));
      row.append(img, name, show);
      box.appendChild(row);
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
    if (openPanelId === 'wallpaper') renderWallpapers();
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
      { label: 'Aplicações', icon: 'ic_category', keys: ['aplicacoes', 'apps', 'aplicativos'],
        run: () => openPanel('apps') },
      { label: 'Papel de parede', icon: 'ic_wallpaper', keys: ['papel', 'parede', 'wallpaper', 'fundo'],
        run: () => openPanel('wallpaper') },
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

  function setTab(name) {
    const apps = name === 'apps';
    $('appsView').hidden = !apps;
    $('launcherSettingsView').hidden = apps;
    $('appsTabBtn').classList.toggle('active', apps);
    $('settingsTabBtn').classList.toggle('active', !apps);
    $('appsTabBtn').setAttribute('aria-selected', String(apps));
    $('settingsTabBtn').setAttribute('aria-selected', String(!apps));
  }

  function openSettingsTab() {
    setTab('settings');
    renderSettings();
  }

  function openAppsTab() {
    setTab('apps');
    renderApps($('appSearch').value);
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
    } else if (id === 'wallpaper') {
      renderWallpapers();
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

  /* ---------- Eventos e arranque ---------- */

  function bindEvents() {
    $('startBtn').addEventListener('click', () => togglePanel('apps'));
    $('trayBtn').addEventListener('click', () => togglePanel('notif'));
    $('notifPermission').addEventListener('click', () => bridge.openNotificationAccess());
    $('appSearch').addEventListener('input', (e) => renderApps(e.target.value));
    $('appsTabBtn').addEventListener('click', openAppsTab);
    $('settingsTabBtn').addEventListener('click', openSettingsTab);
    $('profileChip').addEventListener('click', openSettingsTab);
    $('avatarRow').addEventListener('click', openAvatarDialog);
    $('nameRow').addEventListener('click', openNameDialog);
    $('androidSettingsBtn').addEventListener('click', () => bridge.openAndroidSettings());
    $$('[data-open-wallpaper]').forEach((btn) => btn.addEventListener('click', () => openPanel('wallpaper')));

    $('barHeightRange').addEventListener('input', (e) => {
      state.bar.height = clampInt(e.target.value, BAR_LIMITS.height, BAR_DEFAULTS.height);
      applyBarSize();
      $('barHeightValue').textContent = state.bar.height + ' px';
    });
    $('barHeightRange').addEventListener('change', saveState);
    $('barIconRange').addEventListener('input', (e) => {
      state.bar.icon = clampInt(e.target.value, BAR_LIMITS.icon, BAR_DEFAULTS.icon);
      applyBarSize();
      $('barIconValue').textContent = state.bar.icon + ' px';
    });
    $('barIconRange').addEventListener('change', saveState);
    $('resetBarBtn').addEventListener('click', () => {
      state.bar = { height: BAR_DEFAULTS.height, icon: BAR_DEFAULTS.icon };
      applyBarSize();
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

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (!$('dialog').hidden) closeDialog();
      else if (isContextOpen()) closeContextMenu();
      else if (state.arranging) setArranging(false);
      else closePanels();
    });

    // Toque fora de painéis e menus fecha-os. Os tiles do desktop e a barra
    // tratam dos seus próprios cliques para não abrir e fechar no mesmo gesto.
    // Em fase de captura, antes de qualquer tile: cada toque novo limpa o estado de toque longo.
    document.addEventListener('pointerdown', () => { longPressFired = false; }, true);

    document.addEventListener('pointerdown', (e) => {
      if (isContextOpen() && !e.target.closest('#ctxMenu')) closeContextMenu();
      if (openPanelId && !e.target.closest('.panel, .taskbar, .desk-tile, #ctxMenu, .dialog-backdrop')) closePanels();
      if (!e.target.closest('.taskbar-center')) hideSuggest();
    });

    // Ao voltar de outra app (ex.: após desinstalar), atualiza a lista.
    window.addEventListener('focus', () => { if (!state.arranging) loadApps(); });
  }

  // Chamado pelo Android ao premir Voltar: fecha o que estiver aberto.
  window.desktopBack = function () {
    if (!$('dialog').hidden) { closeDialog(); return true; }
    if (isContextOpen()) { closeContextMenu(); return true; }
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
    applyBarSize();
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
