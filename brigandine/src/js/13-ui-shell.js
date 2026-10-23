/* ============================================================================
   19. UI SHELL — menus, gaveta de registro, painéis responsivos
   ============================================================================ */
function closeMenus() {
  document.querySelectorAll('details.menu[open]').forEach(d => d.removeAttribute('open'));
}

function toggleLogDock() {
  const dock = document.getElementById('logDock');
  const open = dock.classList.toggle('open');
  dock.querySelector('.log-bar').setAttribute('aria-expanded', String(open));
}

/** Telas estreitas: painel esquerdo vira gaveta lateral e o direito vira folha inferior. */
function isCompactLayout() {
  return window.matchMedia('(max-width: 960px)').matches;
}

function togglePanel(side) {
  if (side === 'right') { toggleSheet(); return; }
  document.getElementById('sidebarRight').classList.remove('open');
  document.getElementById('sidebarLeft').classList.toggle('open');
}

/** Rótulo da alça da folha inferior conforme o modo e a peça. */
function updateSheetLabel() {
  const label = document.getElementById('sheetHandleLabel');
  if (!label) return;
  const u = STATE.mode === 'combat'
    ? STATE.units.find(x => x.id === STATE.combat.activeUnitId)
    : STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (STATE.mode === 'combat') label.textContent = u ? `Comandos · ${u.name}` : 'Comandos';
  else label.textContent = u ? `Editar · ${u.name}` : 'Editar peça (toque numa peça)';
}

/** Abre/fecha a folha inferior e reenquadra o tabuleiro no espaço que sobrou. */
function toggleSheet(force) {
  const sheet = document.getElementById('sidebarRight');
  const open = force === undefined ? !sheet.classList.contains('open') : !!force;
  document.getElementById('sidebarLeft').classList.remove('open');
  sheet.classList.toggle('open', open);
  document.getElementById('sheetHandle').setAttribute('aria-expanded', String(open));
  refitBoard();
}

/** Recalcula o canvas e reenquadra o tabuleiro (usado quando o espaço do palco muda). */
function refitBoard() {
  resizeCanvas();
  if (isCompactLayout()) resetCamera();
}

window.addEventListener('resize', () => { if (isCompactLayout()) updateSheetLabel(); });

document.addEventListener('click', (e) => {
  const menu = document.getElementById('fileMenu');
  if (menu && menu.open && !menu.contains(e.target)) closeMenus();
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && STATE.spacePan) { STATE.spacePan = false; syncHudToolButtons(); }
});

document.addEventListener('keydown', (e) => {
  const typingHere = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  // Espaço segurado: mão temporária para mover a visão
  if (e.code === 'Space' && !typingHere && !e.target.closest?.('button, summary, dialog')) {
    e.preventDefault();
    if (!STATE.spacePan) { STATE.spacePan = true; syncHudToolButtons(); }
    return;
  }
  // Ctrl/⌘+Z: desfaz o que a lixeira apagou (só na montagem: no combate não devolve peças ao tabuleiro)
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && !typingHere && STATE.mode === 'setup') {
    if (undoErase()) e.preventDefault();
    return;
  }
  if (e.key === 'Escape') {
    if (STATE.hudTool) setHudTool(STATE.hudTool);
    closeBoardEditor();
    closeMenus();
    document.getElementById('sidebarLeft').classList.remove('open');
    toggleSheet(false);
  }
  // Ctrl/⌘+S salva a cena aberta (ou cria uma)
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { e.preventDefault(); saveActiveScene(); return; }
  // Q / E giram a peça selecionada (montagem) ou a da vez (combate), fora de campos de texto
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'q' || e.key === 'e' || e.key === 'Q' || e.key === 'E')) {
    rotateControlledUnit(e.key.toLowerCase() === 'e' ? 1 : -1);
  }
});

/* ============================================================================
   21. PREFERÊNCIAS — tema da interface e estilo dos tokens (guardados no navegador)
   ============================================================================ */
const PREFS_KEY = 'brigandine_prefs_v1';
const THEMES = { parchment: 'Pergaminho', modern: 'Moderno' };

function readPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
}

function savePrefs(patch) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...patch })); } catch (e) { /* armazenamento indisponível */ }
}

function setTheme(theme) {
  const t = THEMES[theme] ? theme : 'parchment';
  document.body.classList.toggle('theme-parchment', t === 'parchment');
  const label = document.getElementById('themeMenuLabel');
  if (label) label.textContent = `Tema: ${THEMES[t]} (trocar)`;
  savePrefs({ theme: t });
  if (typeof resizeCanvas === 'function' && document.getElementById('battleCanvas')) requestRender();
}

function toggleTheme() {
  setTheme(document.body.classList.contains('theme-parchment') ? 'modern' : 'parchment');
}

/** Troca o estilo dos tokens (chibi/vista de cima) e redesenha tudo. */
function chooseTokenStyle(style) {
  setTokenStyle(style);
  document.getElementById('styleChibi').classList.toggle('active', activeTokenStyle === 'chibi');
  document.getElementById('styleTopo').classList.toggle('active', activeTokenStyle === 'topo');
  savePrefs({ tokenStyle: activeTokenStyle });
  renderPieceGallery();
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

function applyPrefs() {
  const prefs = readPrefs();
  setTheme(prefs.theme || 'parchment');
  if (prefs.tokenStyle && (TOKEN_STYLES[prefs.tokenStyle] || RETIRED_TOKEN_STYLES[prefs.tokenStyle])) chooseTokenStyle(prefs.tokenStyle);
  setAnimationsEnabled(prefs.animations !== false, false);
  if (prefs.combatLogOpen === false) document.getElementById('combatLogPanel').open = false;
}
