/* ============================================================================
   18. BOARD & GALLERY HELPERS
   ============================================================================ */
function setGridType(type) {
  STATE.grid.type = type;
  document.getElementById('btnGridHex').classList.toggle('active', type === 'hex');
  document.getElementById('btnGridSquare').classList.toggle('active', type === 'square');
  updateGridSummaryBadge();
  requestRender();
}

function setGridSize(cols, rows) {
  if (cols !== null) STATE.grid.cols = Math.max(5, Math.min(36, parseInt(cols, 10)));
  if (rows !== null) STATE.grid.rows = Math.max(5, Math.min(36, parseInt(rows, 10)));
  document.getElementById('sliderCols').value = STATE.grid.cols;
  document.getElementById('sliderRows').value = STATE.grid.rows;
  document.getElementById('lblCols').textContent = `${STATE.grid.cols} células`;
  document.getElementById('lblRows').textContent = `${STATE.grid.rows} células`;
  for (const u of STATE.units) {
    u.col = Math.min(u.col, STATE.grid.cols - 1);
    u.row = Math.min(u.row, STATE.grid.rows - 1);
  }
  updateTouchpadVisual();
  updateGridSummaryBadge();
  requestRender();
}

function adjustGridSize(dc, dr) {
  setGridSize(STATE.grid.cols + dc, STATE.grid.rows + dr);
}

function initTouchpadXY() {
  const pad = document.getElementById('xyTouchpad');
  let dragging = false;
  const updateFromEvent = (e) => {
    const rect = pad.getBoundingClientRect();
    const rx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ry = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setGridSize(Math.round(5 + rx * 31), Math.round(5 + ry * 31));
  };
  pad.addEventListener('pointerdown', (e) => { dragging = true; updateFromEvent(e); });
  pad.addEventListener('pointermove', (e) => { if (dragging) updateFromEvent(e); });
  window.addEventListener('pointerup', () => { dragging = false; });
  updateTouchpadVisual();
}

function updateTouchpadVisual() {
  const fill = document.getElementById('xyTouchpadFill');
  const lbl = document.getElementById('xyTouchpadLabel');
  fill.style.width = `${((STATE.grid.cols - 5) / 31) * 100}%`;
  fill.style.height = `${((STATE.grid.rows - 5) / 31) * 100}%`;
  lbl.textContent = `${STATE.grid.cols} × ${STATE.grid.rows} células`;
}

function setCellScale(meters) {
  STATE.grid.cellScale = meters;
  document.getElementById('lblCellScale').textContent = `${String(meters).replace('.', ',')} metros`;
  document.querySelectorAll('.cell-scale-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.scale) === meters);
  });
  updateGridSummaryBadge();
  requestRender();
}

function updateGridSummaryBadge() {
  const gType = STATE.grid.type === 'hex' ? 'HEX' : 'QUAD';
  document.getElementById('gridSummaryBadge').textContent = `${gType} ${STATE.grid.cols}×${STATE.grid.rows} (${String(STATE.grid.cellScale).replace('.', ',')}m)`;
}

function handleMapUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    STATE.grid.bgImageData = e.target.result;
    const img = new Image();
    img.onload = () => { bgImageObj = img; requestRender(); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearBackgroundMap() {
  STATE.grid.bgImageData = null;
  bgImageObj = null;
  requestRender();
}

function setProceduralMap(theme) {
  STATE.grid.proceduralTheme = theme;
  clearBackgroundMap();
}

function setSetupTool(tool) {
  STATE.setupTool = tool;
  document.getElementById('toolPlacePiece').classList.toggle('active', tool === 'piece');
  document.getElementById('toolPaintTerrain').classList.toggle('active', tool === 'terrain');
  document.getElementById('terrainBrushBox').classList.toggle('hidden', tool !== 'terrain');
}

function setTerrainBrush(type) {
  STATE.terrainBrush = type;
  document.querySelectorAll('.terrain-btn').forEach(b => b.classList.toggle('active', b.dataset.t === type));
}

function paintCellTerrain(col, row) {
  const key = `${col},${row}`;
  if (STATE.terrainBrush === 'normal') delete STATE.terrainMap[key];
  else STATE.terrainMap[key] = STATE.terrainBrush;
  requestRender();
}

function renderPieceGallery() {
  const container = document.getElementById('pieceGalleryContainer');
  const heroes = UNIT_TEMPLATES.filter(t => t.faction === 'hero').length;
  document.getElementById('galleryCount').textContent = `${heroes} heróis · ${UNIT_TEMPLATES.length - heroes} vilões`;
  container.innerHTML = '';
  for (const t of UNIT_TEMPLATES) {
    const card = document.createElement('div');
    card.className = `piece-card ${t.id === STATE.selectedTemplateId ? 'selected' : ''}`;
    card.onclick = () => {
      STATE.selectedTemplateId = t.id;
      setSetupTool('piece');
      renderPieceGallery();
    };
    card.innerHTML = `
      ${getTokenPreviewHTML(t.sculpt, t.customTokenDataUrl, customTokenOptions(t))}
      <div class="piece-card-name">${t.name}</div>
      <div class="piece-card-meta">Nív ${t.sheet?.level || 1} | ${t.moveSpeed}m</div>
    `;
    container.appendChild(card);
  }
}

function spawnUnitFromTemplate(templateId, col, row) {
  const tpl = UNIT_TEMPLATES.find(t => t.id === templateId) || UNIT_TEMPLATES[0];
  const sameTypeCount = STATE.units.filter(u => u.sculpt === tpl.sculpt).length;
  const newUnit = {
    id: 'u_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: sameTypeCount > 0 ? `${tpl.name} ${sameTypeCount + 1}` : tpl.name,
    sculpt: tpl.sculpt,
    customTokenDataUrl: tpl.customTokenDataUrl || null,
    customTokenFrame: tpl.customTokenFrame !== false,
    faction: tpl.faction,
    col,
    row,
    moveSpeed: tpl.moveSpeed,
    hp: tpl.maxHp,
    maxHp: tpl.maxHp,
    ac: tpl.ac,
    sheet: JSON.parse(JSON.stringify(tpl.sheet)),
    weapons: JSON.parse(JSON.stringify(tpl.weapons)).map(normalizeWeapon),
    spells: JSON.parse(JSON.stringify(tpl.spells)).map(normalizeSpell),
    items: JSON.parse(JSON.stringify(tpl.items)),
    resistances: JSON.parse(JSON.stringify(tpl.resistances || [])),
    weaknesses: JSON.parse(JSON.stringify(tpl.weaknesses || [])),
    immunities: JSON.parse(JSON.stringify(tpl.immunities || [])),
    actions: 3,
    reaction: true,
    shieldRaised: false,
    strikesMade: 0,
    initiative: 10
  };
  normalizeDefenses(newUnit);
  recalculateUnitFromSheet(newUnit, true);
  newUnit.initiative = Math.floor(Math.random() * 20) + 1 + (newUnit.sheet?.derived?.perception || 5);

  STATE.units.push(newUnit);
  STATE.selectedUnitId = newUnit.id;
  syncInspectorUI();
  requestRender();
}

function registerCustomTemplate() {
  const sculpt = document.getElementById('newPieceSculpt').value;
  const faction = document.getElementById('newPieceFaction').value;
  const current = STATE.units.find(u => u.id === STATE.selectedUnitId);
  const fallbackSheet = UNIT_TEMPLATES[0].sheet;
  const newTpl = {
    id: 't_custom_' + Date.now(),
    name: current ? current.name : `Novo ${sculpt}`,
    sculpt,
    customTokenDataUrl: current ? current.customTokenDataUrl : null,
    customTokenFrame: current ? current.customTokenFrame !== false : true,
    faction,
    moveSpeed: current ? current.moveSpeed : 9,
    maxHp: current ? current.maxHp : 36,
    ac: current ? current.ac : 19,
    sheet: current && current.sheet ? JSON.parse(JSON.stringify(current.sheet)) : JSON.parse(JSON.stringify(fallbackSheet)),
    weapons: current ? JSON.parse(JSON.stringify(current.weapons)) : [{ name: 'Espada Longa', atkBonus: 9, dmgDie: '1d8', dmgBonus: 4, reach: 1.5 }],
    spells: current ? JSON.parse(JSON.stringify(current.spells)) : [{ ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.bola_de_fogo }],
    items: current ? JSON.parse(JSON.stringify(current.items)) : [{ ...ITEM_CATALOG.pocao_menor }],
    resistances: current ? JSON.parse(JSON.stringify(current.resistances || [])) : [],
    weaknesses: current ? JSON.parse(JSON.stringify(current.weaknesses || [])) : [],
    immunities: current ? JSON.parse(JSON.stringify(current.immunities || [])) : []
  };
  UNIT_TEMPLATES.push(newTpl);
  STATE.selectedTemplateId = newTpl.id;
  renderPieceGallery();
  addLog(`✨ Modelo "${newTpl.name}" salvo na galeria com sua Ficha PF2e (Build), armas, magias e itens.`);
}

/**
 * Importa várias imagens de uma vez: cada uma vira um modelo na galeria (nome = arquivo),
 * herdando ficha, armas e magias do modelo selecionado. Serve para usar pacotes de tokens próprios.
 */
async function importImagesAsTemplates(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (files.length === 0) return;
  const faction = document.getElementById('bulkFaction').value;
  const base = UNIT_TEMPLATES.find(t => t.id === STATE.selectedTemplateId) || UNIT_TEMPLATES[0];
  let added = 0;
  for (const file of files) {
    try {
      const dataUrl = await prepareTokenImage(file);
      const name = cleanText(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) || `Modelo ${UNIT_TEMPLATES.length + 1}`;
      UNIT_TEMPLATES.push({
        ...JSON.parse(JSON.stringify(base)),
        id: 't_img_' + Date.now() + '_' + added,
        name, faction, customTokenDataUrl: dataUrl, customTokenFrame: true
      });
      added++;
    } catch (err) {
      addLog(`⚠️ ${escapeHtml(file.name)}: ${escapeHtml(err.message)}`);
    }
  }
  if (added > 0) {
    STATE.selectedTemplateId = UNIT_TEMPLATES[UNIT_TEMPLATES.length - 1].id;
    renderPieceGallery();
    addLog(`🖼️ ${added} imagem(ns) adicionada(s) à galeria como modelos. Clique no tabuleiro para posicionar.`);
  }
}

function populateDemoBattle() {
  STATE.units = [];
  STATE.terrainMap = {
    '6,3': 'wall', '6,4': 'wall', '7,7': 'difficult', '7,8': 'difficult'
  };
  spawnUnitFromTemplate('t_guerreiro', 3, 1);
  spawnUnitFromTemplate('t_paladino', 3, 3);
  spawnUnitFromTemplate('t_barbaro', 3, 5);
  spawnUnitFromTemplate('t_rogue', 3, 7);
  spawnUnitFromTemplate('t_clerigo', 2, 2);
  spawnUnitFromTemplate('t_bardo', 2, 4);
  spawnUnitFromTemplate('t_ranger', 2, 6);
  spawnUnitFromTemplate('t_mago', 1, 3);
  spawnUnitFromTemplate('t_feiticeiro', 1, 5);

  spawnUnitFromTemplate('t_lobo', 4, 1);
  spawnUnitFromTemplate('t_goblin', 8, 2);
  spawnUnitFromTemplate('t_goblin', 8, 4);
  spawnUnitFromTemplate('t_lobo', 8, 6);
  spawnUnitFromTemplate('t_bandido', 10, 3);
  spawnUnitFromTemplate('t_bandido', 10, 5);

  sortInitiativeOrder();
  STATE.combat.activeUnitId = STATE.units[0].id;
  STATE.selectedUnitId = STATE.units[0].id;
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

function clearAllUnits() {
  STATE.units = [];
  STATE.terrainMap = {};
  STATE.selectedUnitId = null;
  STATE.combat.activeUnitId = null;
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

function toggleRulerTool() {
  STATE.ruler.active = !STATE.ruler.active;
  STATE.ruler.startCell = null;
  STATE.ruler.endCell = null;
  document.getElementById('btnToggleRuler').classList.toggle('active', STATE.ruler.active);
  requestRender();
}

function zoomBoard(factor) {
  STATE.camera.zoom = Math.max(0.45, Math.min(2.4, STATE.camera.zoom * factor));
  requestRender();
}

/** Enquadra o tabuleiro inteiro no palco, com folga para os HUDs. */
function resetCamera() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const base = STATE.camera.basePx;
  STATE.camera.zoom = 1;
  STATE.camera.x = 0;
  STATE.camera.y = 0;
  const first = getCellPixelCenter(0, 0);
  const last = getCellPixelCenter(STATE.grid.cols - 1, STATE.grid.rows - 1);
  const boardW = (last.x - first.x) + base * 1.2;
  const boardH = (last.y - first.y) + base * 1.2;
  const zoom = Math.max(0.45, Math.min(1.4, Math.min((w - 48) / boardW, (h - 170) / boardH)));
  STATE.camera.zoom = zoom;
  STATE.camera.x = (w - boardW * zoom) / 2 - (first.x - base * 0.6) * zoom;
  STATE.camera.y = 64 + ((h - 170) - boardH * zoom) / 2 - (first.y - base * 0.6) * zoom;
  requestRender();
}

function addLog(htmlMsg) {
  const box = document.getElementById('combatLogBox');
  const item = document.createElement('div');
  item.className = 'log-entry';
  item.innerHTML = htmlMsg;
  box.prepend(item);
  document.getElementById('logPeek').innerHTML = htmlMsg;
}

function clearCombatLog() {
  document.getElementById('combatLogBox').innerHTML = '';
  document.getElementById('logPeek').textContent = 'Registro de ações e rolagens';
}

function saveStateToLocal() {
  const payload = {
    grid: STATE.grid,
    terrainMap: STATE.terrainMap,
    units: STATE.units,
    templates: UNIT_TEMPLATES,
    round: STATE.combat.round
  };
  localStorage.setItem('brigandine_pf2e_v5_save', JSON.stringify(payload));
  addLog('💾 Configurações, grid e Fichas PF2e salvas no navegador.');
}

function loadStateFromLocal() {
  const raw = localStorage.getItem('brigandine_pf2e_v5_save') || localStorage.getItem('brigandine_pf2e_v4_save');
  if (!raw) {
    addLog('⚠️ Nenhum salvamento encontrado no navegador.');
    return;
  }
  applyLoadedPayload(JSON.parse(raw));
  addLog('📂 Tabuleiro e Fichas PF2e carregados.');
}

function exportJSON() {
  const payload = {
    grid: STATE.grid,
    terrainMap: STATE.terrainMap,
    units: STATE.units,
    templates: UNIT_TEMPLATES,
    round: STATE.combat.round
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `brigandine_pf2e_v5_${STATE.grid.cols}x${STATE.grid.rows}.json`;
  a.click();
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      applyLoadedPayload(JSON.parse(e.target.result));
      addLog('⬆️ Arquivo JSON importado com sucesso!');
    } catch (err) {
      addLog('⚠️ Erro ao ler o arquivo JSON.');
    }
  };
  reader.readAsText(file);
}

function applyLoadedPayload(data) {
  if (data.grid) {
    STATE.grid = { ...STATE.grid, ...data.grid };
    setGridType(STATE.grid.type);
    setGridSize(STATE.grid.cols, STATE.grid.rows);
    setCellScale(STATE.grid.cellScale);
  }
  if (data.terrainMap) STATE.terrainMap = data.terrainMap;
  if (data.templates) UNIT_TEMPLATES = data.templates;
  if (data.units) {
    STATE.units = data.units;
    STATE.units.forEach(u => {
      u.name = cleanText(u.name);
      u.weapons = (u.weapons || []).map(normalizeWeapon);
      u.spells = (u.spells || []).map(normalizeSpell);
      u.shieldRaised = !!u.shieldRaised;
      normalizeDefenses(u);
      recalculateUnitFromSheet(u, false);
    });
  }
  if (data.round) STATE.combat.round = data.round;

  STATE.selectedUnitId = STATE.units[0]?.id || null;
  STATE.combat.activeUnitId = STATE.units.find(u => u.hp > 0)?.id || null;
  renderPieceGallery();
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

window.addEventListener('DOMContentLoaded', initApp);
