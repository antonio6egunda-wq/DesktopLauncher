/* Desktop Launcher: desktop, barra de tarefas, painéis e menus.
 * Fala com o Android através de window.Desktop (ver MainActivity.java).
 * Fora do Android (ex.: abrir index.html no PC) usa uma ponte de pré-visualização. */
(function () {
  'use strict';

  const STORE_KEY = 'desktop-launcher.v2';
  const LONG_PRESS_MS = 450;
  const MOVE_TOLERANCE_PX = 10;   // movimento que cancela o toque longo e inicia o arrasto
  const WALLPAPER_COUNT = 5;
  const WALLPAPER_FILES = ['00.jpg', '01.jpg', '02.jpg', '03.jpg', '04.jpg'];

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

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root) => Array.prototype.slice.call((root || document).querySelectorAll(selector));
  const pad2 = (n) => String(n).padStart(2, '0');
  const isFocused = (el) => document.activeElement === el;

  const bridge = window.Desktop || createPreviewBridge();

  const state = {
    apps: [],
    byPackage: new Map(),
    pins: { desktop: [], dock: [] },
    wallpaper: 0,
    drag: null,          // { pkg, zone } enquanto um ícone afixado está a ser arrastado
  };
  const iconCache = new Map();
  let openPanelId = null;
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
      openNotificationAccess: () => console.log('acesso às notificações'),
      openAndroidSettings: () => console.log('definições'),
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
      getVolume: () => 50,
      setVolume: () => {},
      toggleMute: () => {},
      getBrightness: () => 50,
      setBrightness: () => {},
    };
  }

  /* ---------- Estado persistente ---------- */

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      const onlyStrings = (list) => Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];
      state.pins.desktop = onlyStrings(saved.desktop);
      state.pins.dock = onlyStrings(saved.dock);
      const w = Number(saved.wallpaper);
      state.wallpaper = Number.isInteger(w) && w >= 0 && w < WALLPAPER_COUNT ? w : 0;
    } catch (e) {
      // dados corrompidos: começa com o estado por omissão
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        desktop: state.pins.desktop,
        dock: state.pins.dock,
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

  /* ---------- Aplicações e fixações ---------- */

  function loadApps() {
    let list = [];
    try { list = JSON.parse(bridge.getApps() || '[]'); } catch (e) { list = []; }
    state.apps = list
      .filter((a) => a && a.packageName)
      .map((a) => ({ name: String(a.name || a.packageName), packageName: a.packageName }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
    state.byPackage = new Map(state.apps.map((a) => [a.packageName, a]));
    renderDesktop();
    renderDock();
  }

  function isPinned(zone, pkg) {
    return state.pins[zone].indexOf(pkg) !== -1;
  }

  function refreshAfterPinChange() {
    renderDesktop();
    renderDock();
    if (openPanelId === 'apps') renderApps($('appSearch').value);
  }

  function setPinned(zone, pkg, on) {
    const list = state.pins[zone];
    const index = list.indexOf(pkg);
    if (on && index === -1) list.push(pkg);
    if (!on && index !== -1) list.splice(index, 1);
    saveState();
    refreshAfterPinChange();
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
    refreshAfterPinChange();
  }

  function removeFromZone(zone, pkg) {
    const list = state.pins[zone];
    const index = list.indexOf(pkg);
    if (index !== -1) list.splice(index, 1);
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

  /** Arrasto por ponteiro (funciona com toque; o drag-and-drop HTML5 não funciona na WebView). */
  function makePinnedDraggable(button, zone, pkg) {
    button.classList.add('pinned-tile');
    button.dataset.packageName = pkg;
    button.dataset.zone = zone;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;

    button.addEventListener('pointerdown', (e) => {
      if (e.button > 0 || isContextOpen()) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragging = false;
    });

    button.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId || isContextOpen()) return;
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

  function dropZoneAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('#dock, #desktopIcons') : null;
  }

  function markDropZone(x, y) {
    const zoneEl = dropZoneAt(x, y);
    $$('.drop-target').forEach((n) => { if (n !== zoneEl) n.classList.remove('drop-target'); });
    if (zoneEl) zoneEl.classList.add('drop-target');
  }

  function clearDropMarks() {
    $$('.drop-target').forEach((n) => n.classList.remove('drop-target'));
  }

  function dropAt(x, y) {
    const drag = state.drag;
    if (!drag) return;
    const el = document.elementFromPoint(x, y);
    const zoneEl = el && el.closest('#dock, #desktopIcons');
    if (!zoneEl) return; // largado fora da barra ou do ambiente de trabalho: não muda nada

    const zone = zoneEl.id === 'dock' ? 'dock' : 'desktop';
    const list = state.pins[zone];
    let beforePkg = null;

    const tile = el.closest('.pinned-tile');
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

    if (opts.pinned) {
      const badge = document.createElement('img');
      badge.className = 'pin-badge';
      badge.alt = '';
      applyIcon(badge, featureIcon('ic_pin'));
      button.appendChild(badge);
    }

    button.addEventListener('click', (event) => {
      if (longPressFired) {
        longPressFired = false;
        event.preventDefault();
        return;
      }
      if (opts.onActivate) opts.onActivate();
    });

    if (opts.menu) attachLongPress(button, () => openContextMenu(opts.menu(), button));
    if (opts.zone && opts.packageName) makePinnedDraggable(button, opts.zone, opts.packageName);
    return button;
  }

  function openContextMenu(items, anchor) {
    const menu = $('ctxMenu');
    menu.innerHTML = '';
    items.forEach((item) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'ctx-item';
      option.setAttribute('role', 'menuitem');
      option.textContent = item.label;
      option.addEventListener('click', () => {
        closeContextMenu();
        item.action();
      });
      menu.appendChild(option);
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

  /* ---------- Desktop e barra de tarefas ---------- */

  function renderDesktop() {
    const box = $('desktopIcons');
    box.innerHTML = '';

    box.appendChild(createTile({
      className: 'desk-tile', label: 'Aplicações', icon: featureIcon('ic_category'), showLabel: true,
      onActivate: () => togglePanel('apps'),
    }));
    box.appendChild(createTile({
      className: 'desk-tile', label: 'Papel de parede', icon: featureIcon('ic_wallpaper'), showLabel: true,
      onActivate: () => togglePanel('wallpaper'),
    }));
    box.appendChild(createTile({
      className: 'desk-tile', label: 'Definições', icon: featureIcon('ic_settings'), showLabel: true,
      onActivate: () => bridge.openAndroidSettings(),
    }));

    state.pins.desktop.forEach((pkg) => {
      const app = state.byPackage.get(pkg);
      if (!app) return;
      box.appendChild(createTile({
        className: 'desk-tile', label: app.name, icon: appIcon(app), showLabel: true,
        zone: 'desktop', packageName: app.packageName,
        onActivate: () => launch(app),
        menu: () => [
          { label: 'Abrir', action: () => launch(app) },
          { label: 'Remover do ambiente de trabalho', action: () => setPinned('desktop', app.packageName, false) },
        ],
      }));
    });
  }

  function renderDock() {
    const dock = $('dock');
    dock.innerHTML = '';
    state.pins.dock.forEach((pkg) => {
      const app = state.byPackage.get(pkg);
      if (!app) return;
      dock.appendChild(createTile({
        className: 'dock-tile', label: app.name, icon: appIcon(app),
        zone: 'dock', packageName: app.packageName,
        onActivate: () => launch(app),
        menu: () => [
          { label: 'Abrir', action: () => launch(app) },
          { label: 'Remover da barra', action: () => setPinned('dock', app.packageName, false) },
        ],
      }));
    });
  }

  /* ---------- Painel de aplicações ---------- */

  function renderApps(filter) {
    const grid = $('appGrid');
    grid.innerHTML = '';
    if (!state.apps.length) {
      grid.appendChild(emptyNode('Não foi possível carregar as aplicações.'));
      return;
    }
    const term = (filter || '').toLowerCase().trim();
    const matches = state.apps.filter((a) => a.name.toLowerCase().includes(term));
    if (!matches.length) {
      grid.appendChild(emptyNode('Nenhuma aplicação corresponde à pesquisa.'));
      return;
    }
    matches.forEach((app) => {
      const onDesktop = isPinned('desktop', app.packageName);
      const onDock = isPinned('dock', app.packageName);
      grid.appendChild(createTile({
        className: 'app-tile', label: app.name, icon: appIcon(app), showLabel: true,
        pinned: onDesktop || onDock,
        onActivate: () => launch(app),
        menu: () => [
          { label: 'Abrir', action: () => launch(app) },
          {
            label: onDesktop ? 'Remover do ambiente de trabalho' : 'Afixar no ambiente de trabalho',
            action: () => setPinned('desktop', app.packageName, !onDesktop),
          },
          {
            label: onDock ? 'Remover da barra' : 'Afixar na barra',
            action: () => setPinned('dock', app.packageName, !onDock),
          },
        ],
      }));
    });
  }

  function emptyNode(text) {
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = text;
    return div;
  }

  /* ---------- Papel de parede ---------- */

  function applyWallpaper(index) {
    state.wallpaper = index;
    saveState();
    $('desktop').style.backgroundImage = "url('wallpapers/" + pad2(index) + ".jpg')";
    if (openPanelId === 'wallpaper') renderWallpapers();
  }

  function renderWallpapers() {
    const grid = $('wallpaperGrid');
    grid.innerHTML = '';
    for (let i = 0; i < WALLPAPER_COUNT; i++) {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'wallpaper-option';
      option.setAttribute('aria-label', 'Papel de parede ' + (i + 1));
      option.setAttribute('aria-pressed', String(i === state.wallpaper));
      const img = document.createElement('img');
      img.alt = '';
      img.src = 'wallpapers/' + WALLPAPER_FILES[i];
      option.appendChild(img);
      option.addEventListener('click', () => applyWallpaper(i));
      grid.appendChild(option);
    }
  }

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

      const appName = document.createElement('span');
      appName.className = 'notif-app';
      appName.textContent = app ? app.name : (n.packageName || '');

      const title = document.createElement('strong');
      title.textContent = n.title || 'Notificação';

      const body = document.createElement('p');
      body.textContent = n.text || '';

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
    notificationsEnabled = bridge.hasNotificationAccess() === true;
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

  /* ---------- Pesquisa, controlos rápidos e definições ---------- */

  function openSettingsTab() {
    $('appsView').hidden = true;
    $('launcherSettingsView').hidden = false;
    $('appsTabBtn').classList.remove('active');
    $('settingsTabBtn').classList.add('active');
    $('appsTabBtn').setAttribute('aria-selected', 'false');
    $('settingsTabBtn').setAttribute('aria-selected', 'true');
  }

  function openAppsTab() {
    $('appsView').hidden = false;
    $('launcherSettingsView').hidden = true;
    $('appsTabBtn').classList.add('active');
    $('settingsTabBtn').classList.remove('active');
    $('appsTabBtn').setAttribute('aria-selected', 'true');
    $('settingsTabBtn').setAttribute('aria-selected', 'false');
    renderApps($('appSearch').value);
  }

  function volumeIconFor(level) {
    if (level <= 0) return 'ic_volume_off';
    if (level < 50) return 'ic_volume_down';
    return 'ic_volume_up';
  }

  function setToggle(button, on) {
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', String(on));
  }

  function refreshQuickSettings() {
    try {
      const wifi = bridge.isWifiEnabled() === true;
      const bluetooth = bridge.isBluetoothEnabled() === true;
      const volume = Number(bridge.getVolume()) || 0;

      setToggle($('wifiToggle'), wifi);
      setIcon($('wifiIcon'), wifi ? 'ic_wifi' : 'ic_wifi_off');
      setToggle($('bluetoothToggle'), bluetooth);

      // Não mexe nos sliders enquanto o utilizador os está a arrastar.
      if (!isFocused($('volumeRange'))) $('volumeRange').value = volume;
      if (!isFocused($('brightnessRange'))) $('brightnessRange').value = Number(bridge.getBrightness()) || 50;

      setIcon($('volumeIcon'), volumeIconFor(volume));
      setIcon($('volumeRangeIcon'), volumeIconFor(volume));
    } catch (e) { /* ponte indisponível */ }
  }

  function searchDock(query) {
    const value = (query || '').trim();
    if (!value) return;
    const match = state.apps.find((a) => a.name.toLowerCase().includes(value.toLowerCase()));
    if (match) launch(match);
    else bridge.openGoogleSearch(value);
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
    } else if (id === 'wallpaper') {
      renderWallpapers();
    }
    updateExpandedState();
  }

  function closePanels() {
    Object.keys(PANELS).forEach((key) => { $(PANELS[key]).hidden = true; });
    openPanelId = null;
    closeContextMenu();
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
    $('launcherSettingsBtn').addEventListener('click', openSettingsTab);
    $('androidSettingsBtn').addEventListener('click', () => bridge.openAndroidSettings());
    $$('[data-open-wallpaper]').forEach((btn) => btn.addEventListener('click', () => openPanel('wallpaper')));
    $('dockSearchForm').addEventListener('submit', (e) => { e.preventDefault(); searchDock($('dockSearch').value); });
    $('volumeBtn').addEventListener('click', () => { bridge.toggleMute(); refreshQuickSettings(); });
    $('muteBtn').addEventListener('click', () => { bridge.toggleMute(); refreshQuickSettings(); });
    $('volumeRange').addEventListener('input', (e) => { bridge.setVolume(Number(e.target.value)); refreshQuickSettings(); });
    $('brightnessRange').addEventListener('change', (e) => bridge.setBrightness(Number(e.target.value)));
    $('wifiToggle').addEventListener('click', () => { bridge.toggleWifi(); setTimeout(refreshQuickSettings, 700); });
    $('bluetoothToggle').addEventListener('click', () => { bridge.toggleBluetooth(); setTimeout(refreshQuickSettings, 700); });
    $('locationToggle').addEventListener('click', () => bridge.openLocationSettings());
    $('clearNotificationsBtn').addEventListener('click', () => { bridge.clearNotifications(); refreshNotifications(true); });
    $$('[data-close]').forEach((button) => button.addEventListener('click', closePanels));

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (isContextOpen()) closeContextMenu();
      else closePanels();
    });

    // Toque fora de painéis e menus fecha-os. Os tiles do desktop e a barra
    // tratam dos seus próprios cliques para não abrir e fechar no mesmo gesto.
    // Em fase de captura, antes de qualquer tile: cada toque novo limpa o estado de toque longo.
    document.addEventListener('pointerdown', () => { longPressFired = false; }, true);

    document.addEventListener('pointerdown', (e) => {
      if (isContextOpen() && !e.target.closest('#ctxMenu')) closeContextMenu();
      if (openPanelId && !e.target.closest('.panel, .taskbar, .desk-tile, #ctxMenu')) closePanels();
    });
  }

  // Chamado pelo Android ao premir Voltar: fecha o que estiver aberto.
  window.desktopBack = function () {
    if (isContextOpen()) { closeContextMenu(); return true; }
    if (openPanelId) { closePanels(); return true; }
    return false;
  };

  function boot() {
    loadState();
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
