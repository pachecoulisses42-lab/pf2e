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

/** Em telas estreitas os painéis laterais viram gavetas. */
function togglePanel(side) {
  const left = document.getElementById('sidebarLeft');
  const right = document.getElementById('sidebarRight');
  const target = side === 'left' ? left : right;
  const other = side === 'left' ? right : left;
  other.classList.remove('open');
  target.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('fileMenu');
  if (menu && menu.open && !menu.contains(e.target)) closeMenus();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenus();
    document.getElementById('sidebarLeft').classList.remove('open');
    document.getElementById('sidebarRight').classList.remove('open');
  }
});
