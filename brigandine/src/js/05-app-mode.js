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
  STATE.mode = mode;
  // lixeira e lápis são da montagem; a mão vale nos dois modos
  if (mode !== 'setup' && STATE.hudTool && STATE.hudTool !== 'pan') { STATE.hudTool = null; closeBoardEditor(); }
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

    const alive = STATE.units.filter(u => u.hp > 0);
    if (!STATE.combat.activeUnitId && alive.length > 0) {
      sortInitiativeOrder();
      STATE.combat.activeUnitId = alive[0].id;
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

