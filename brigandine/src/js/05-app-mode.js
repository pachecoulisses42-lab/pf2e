/* ============================================================================
   6. INITIALIZATION
   ============================================================================ */
function initApp() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  initTouchpadXY();
  initCanvasEvents();
  appendExtraTokenOptions(document.getElementById('inspTokenSelect'));
  appendExtraTokenOptions(document.getElementById('newPieceSculpt'));
  initSetupMenus();
  renderPieceGallery();
  renderEnvPalettes();
  populateDemoBattle();
  resetCamera();
  applyPrefs();
  initScenes();
  addLog('📜 <strong>Brigandine v5 pronto.</strong> Monte o tabuleiro e as peças, depois inicie o combate.');
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  requestRender();
}

/* ============================================================================
   7. MODE SWITCHING & END COMBAT FUNCTION
   ============================================================================ */
function setAppMode(mode) {
  finishAnimation();
  const leavingSetup = STATE.mode === 'setup' && mode !== 'setup';
  STATE.mode = mode;
  // trocar de modo desliga régua, mão, lixeira e lápis: o primeiro clique no outro modo é do próprio modo
  if (STATE.ruler.active) toggleRulerTool();
  if (STATE.hudTool) { STATE.hudTool = null; closeBoardEditor(); }
  STATE.spacePan = false;
  // a peça/pincel escolhido na montagem não continua engatilhado (nem ao voltar do combate)
  if (leavingSetup) releaseSetupSelection();
  if (mode !== 'combat') STATE.flashLights = []; // clarões de magia só existem durante o combate
  document.body.classList.toggle('mode-combat', mode === 'combat');
  document.body.classList.toggle('mode-setup', mode !== 'combat');

  document.getElementById('btnModeSetup').className = mode === 'setup' ? 'mode-btn active-setup' : 'mode-btn';
  document.getElementById('btnModeCombat').className = mode === 'combat' ? 'mode-btn active-combat' : 'mode-btn';

  document.getElementById('setupLeftPanel').classList.toggle('hidden', mode !== 'setup');
  document.getElementById('combatLeftPanel').classList.toggle('hidden', mode !== 'combat');

  document.getElementById('setupRightPanel').classList.toggle('hidden', mode !== 'setup');
  document.getElementById('combatRightPanel').classList.toggle('hidden', mode !== 'combat');

  const hudMode = document.getElementById('hudModeIndicator');
  const headerStatus = document.getElementById('headerStatusText');
  const hudInstruction = document.getElementById('hudInstructionText');

  if (mode === 'setup') {
    hudMode.textContent = 'Montagem';
    headerStatus.textContent = 'Montagem do tabuleiro';
    hudInstruction.textContent = 'Clique em uma peça para editar a ficha. Arraste para reposicionar.';
    syncInspectorUI();
  } else {
    hudMode.textContent = 'Combate';
    headerStatus.textContent = 'Combate tático';
    hudInstruction.textContent = 'Escolha um comando: Ação, Mover, Magias, Itens ou Ficha.';

    // a peça da vez precisa existir e estar viva (as peças podem ter sido trocadas ou excluídas na montagem)
    if (!STATE.units.some(u => u.id === STATE.combat.activeUnitId && u.hp > 0)) {
      sortInitiativeOrder();
      STATE.combat.activeUnitId = STATE.units.find(u => u.hp > 0)?.id || null;
    }
    STATE.selectedUnitId = STATE.combat.activeUnitId;
    selectCombatMainMenu(STATE.combat.mainMenu);
  }
  updateSheetLabel();
  if (isCompactLayout()) toggleSheet(false);
  if (typeof syncHudToolButtons === 'function') syncHudToolButtons();
  requestRender();
}

function endCombatSession() {
  STATE.combat.round = 1;
  STATE.combat.activeUnitId = null; // o próximo combate começa no topo da iniciativa
  for (const u of STATE.units) {
    u.actions = 3;
    u.reaction = true;
    u.strikesMade = 0;
    lowerShield(u);
  }
  addLog('⏹ <strong>Combate encerrado!</strong> Ações e reações restauradas. Retornando ao Modo Montagem & Edição do tabuleiro.');
  setAppMode('setup');
  if (SCENES.activeId) afterCombatInScene();
}

