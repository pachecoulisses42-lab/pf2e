/* ============================================================================
   15c. CAIXA DE FERRAMENTAS E MENUS DA MONTAGEM
   - Só um menu aberto por vez (Tabuleiro, Mapa de fundo, Caixa de ferramentas);
     só o menu aberto age no tabuleiro e, ao fechar, a escolha dele é desfeita.
   - Caixa de ferramentas: Personagens, Terreno, Objetos, Animais, Perigos.
   - Tabuleiro: clima pintado em célula, raio, emanação, cone, linha, quadrado ou tudo.
   - Cada menu termina com a própria transparência (0 % a 90 %).
   ============================================================================ */

const TOOL_TABS = ['piece', 'terrain', 'object', 'animal', 'hazard'];
const PAINT_SIZES = [1.5, 3, 4.5, 6, 9, 12, 18, 30];
const SWATCH_CACHE = {};

function swatch(type) {
  if (!SWATCH_CACHE[type]) SWATCH_CACHE[type] = environmentSwatchURL(type);
  return SWATCH_CACHE[type];
}

/* ---------------- Menus exclusivos ---------------- */

function initSetupMenus() {
  const menus = Array.from(document.querySelectorAll('#setupLeftPanel details.acc[data-menu]'));
  for (const el of menus) {
    el.addEventListener('toggle', () => onSetupMenuToggle(el, menus));
    if (el.open) STATE.openMenu = el.dataset.menu;
  }
  // garante um só aberto já no início
  let seen = false;
  for (const el of menus) { if (el.open && seen) el.open = false; if (el.open) seen = true; }
}

function onSetupMenuToggle(el, menus) {
  const menu = el.dataset.menu;
  if (el.open) {
    for (const other of menus) if (other !== el && other.open) other.open = false;
    STATE.openMenu = menu;
  } else {
    if (STATE.openMenu === menu) STATE.openMenu = null;
    deselectMenu(menu);
  }
  STATE.paint.start = null;
  STATE.paint.preview = null;
  requestRender();
}

/** Ao fechar um menu, a ferramenta escolhida nele deixa de valer. */
function deselectMenu(menu) {
  if (menu === 'tools') {
    STATE.selectedTemplateId = null;
    STATE.terrainBrush = null;
    STATE.objectBrush = null;
    renderPieceGallery();
  }
  if (menu === 'board') STATE.effectBrush = null;
  renderEnvPalettes();
}

/** Ferramenta que o clique no tabuleiro usa agora (montagem). */
function currentBoardTool() {
  if (STATE.openMenu === 'tools') return STATE.toolTab;
  if (STATE.openMenu === 'board') return 'effect';
  return 'none';
}

/* ---------------- Abas da caixa de ferramentas ---------------- */

function setSetupTool(tool) {
  if (!TOOL_TABS.includes(tool)) tool = 'piece';
  STATE.toolTab = tool;
  STATE.setupTool = tool; // compatibilidade
  for (const t of TOOL_TABS) {
    document.getElementById(`toolTab_${t}`)?.classList.toggle('active', t === tool);
    document.getElementById(`toolPanel_${t}`)?.classList.toggle('hidden', t !== tool);
  }
  // abrir a ferramenta pelo código também abre a caixa de ferramentas
  const box = document.querySelector('#setupLeftPanel details.acc[data-menu="tools"]');
  if (box && !box.open) box.open = true;
  STATE.paint.preview = null;
  renderEnvPalettes();
  requestRender();
}

/* ---------------- Paletas ---------------- */

function paletteHTML(entries, current, onPick) {
  return entries.map(([key, label]) =>
    `<button type="button" class="env-pick${key === current ? ' active' : ''}" title="${escapeHtml(label)}" onclick="${onPick}('${key}')">` +
    (key === 'erase' || key === 'normal'
      ? `<span class="env-swatch env-erase"><svg class="icon"><use href="#i-x"/></svg></span>`
      : `<img class="env-swatch" src="${swatch(key)}" alt="">`) +
    `<span>${escapeHtml(label)}</span></button>`).join('');
}

function renderEnvPalettes() {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('terrainPalette', paletteHTML([...Object.entries(TERRAIN_TYPES).map(([k, t]) => [k, t.label]), ['normal', 'Apagar']], STATE.terrainBrush, 'selectTerrainBrush'));
  set('objectPalette', paletteHTML([...Object.entries(OBJECT_TYPES).map(([k, t]) => [k, t.label]), ['erase', 'Remover']], STATE.toolTab === 'object' ? STATE.objectBrush : null, 'selectObjectBrush'));
  set('hazardPalette', paletteHTML([...Object.entries(HAZARD_TYPES).map(([k, t]) => [k, t.label]), ['erase', 'Remover']], STATE.toolTab === 'hazard' ? STATE.objectBrush : null, 'selectObjectBrush'));
  set('effectPalette', paletteHTML([...Object.entries(EFFECT_TYPES).map(([k, t]) => [k, t.label]), ['erase', 'Apagar']], STATE.effectBrush, 'selectEffectBrush'));
  renderShapeControls('terrainShapeControls', false);
  renderShapeControls('effectShapeControls', true);
  syncTransparencyUI();
}

function selectTerrainBrush(type) { STATE.terrainBrush = type; renderEnvPalettes(); }
function selectObjectBrush(type) { STATE.objectBrush = type; renderEnvPalettes(); }
function selectEffectBrush(type) { STATE.effectBrush = type; renderEnvPalettes(); }

/* ---------------- Formas ---------------- */

function renderShapeControls(containerId, allowEmanation) {
  const box = document.getElementById(containerId);
  if (!box) return;
  const shapes = Object.entries(PAINT_SHAPES).filter(([, d]) => allowEmanation || !d.effectOnly);
  // terreno não tem emanação: mostra (e usa) como raio, sem mexer na escolha do clima
  const shown = !allowEmanation && STATE.paint.shape === 'emanation' ? 'burst' : STATE.paint.shape;
  const cur = PAINT_SHAPES[shown] || PAINT_SHAPES.cell;
  const hints = {
    cell: 'Clique ou arraste para pintar casa por casa.',
    burst: 'Clique no centro.',
    emanation: 'Clique numa peça: o efeito acompanha a peça. Numa casa vazia, vale como raio.',
    cone: 'Arraste da origem para a direção do cone.',
    line: 'Arraste da origem para a direção da linha.',
    square: 'Arraste de um canto ao outro.',
    all: 'Clique em qualquer casa para cobrir o tabuleiro todo.'
  };
  box.innerHTML = `<div class="chip-row">${shapes.map(([k, d]) =>
    `<button type="button" class="chip${k === shown ? ' active' : ''}" onclick="setPaintShape('${k}')">${d.label}</button>`).join('')}</div>` +
    (cur.sized ? `<div class="field-label" style="margin-top:6px"><span>Tamanho</span><select aria-label="Tamanho da forma" onchange="setPaintSize(this.value)">${PAINT_SIZES.map(m =>
      `<option value="${m}"${m === STATE.paint.size ? ' selected' : ''}>${String(m).replace('.', ',')} m</option>`).join('')}</select></div>` : '') +
    `<p class="hint">${hints[shown] || ''}</p>`;
}

function setPaintShape(shape) {
  if (PAINT_SHAPES[shape]) STATE.paint.shape = shape;
  STATE.paint.preview = null;
  renderEnvPalettes();
}

function setPaintSize(m) {
  const n = Number(m);
  if (PAINT_SIZES.includes(n)) STATE.paint.size = n;
}

/* ---------------- Transparência ---------------- */

function setLayerTransparency(layer, value) {
  STATE.layers[layer] = clampTransparency(value);
  syncTransparencyUI();
  requestRender();
}

function syncTransparencyUI() {
  for (const layer of ['terrain', 'effects', 'map']) {
    const v = clampTransparency(STATE.layers[layer]);
    const slider = document.getElementById(`transp_${layer}`);
    if (slider && Number(slider.value) !== v) slider.value = String(v);
    const label = document.getElementById(`transpVal_${layer}`);
    if (label) label.textContent = `${v} %`;
  }
}

/* ---------------- Pintura (terreno e clima) ---------------- */

/** Pinta (ou apaga) uma lista de células com o pincel da ferramenta atual. */
function applyPaintCells(tool, cells) {
  for (const { col, row } of cells) {
    if (col < 0 || row < 0 || col >= STATE.grid.cols || row >= STATE.grid.rows) continue;
    const k = `${col},${row}`;
    if (tool === 'terrain') {
      if (STATE.terrainBrush === 'normal') delete STATE.terrainMap[k];
      else STATE.terrainMap[k] = STATE.terrainBrush;
    } else if (tool === 'effect') {
      if (STATE.effectBrush === 'erase') for (const t of Object.keys(STATE.effects)) delete STATE.effects[t][k];
      else (STATE.effects[STATE.effectBrush] ||= {})[k] = 1;
    }
  }
  requestRender();
}

function brushFor(tool) {
  return tool === 'terrain' ? STATE.terrainBrush : tool === 'effect' ? STATE.effectBrush : null;
}

/** Começo da pintura. Devolve true se o clique foi usado. */
function beginPaint(tool, cell, clickedUnit) {
  if (!brushFor(tool)) {
    addLog(tool === 'effect' ? '🌫️ Escolha um efeito de clima (ou Apagar) antes de pintar.' : '🗺️ Escolha um tipo de terreno (ou Apagar) antes de pintar.');
    return false;
  }
  const shape = tool === 'terrain' && STATE.paint.shape === 'emanation' ? 'burst' : STATE.paint.shape;
  const size = STATE.paint.size;
  if (shape === 'emanation' && tool === 'effect' && clickedUnit) {
    STATE.effectZones = STATE.effectZones.filter(z => !(z.unitId === clickedUnit.id && (STATE.effectBrush === 'erase' || z.type === STATE.effectBrush)));
    if (STATE.effectBrush !== 'erase') {
      STATE.effectZones.push({ id: `z_${Date.now()}`, type: STATE.effectBrush, unitId: clickedUnit.id, radius: size });
      addLog(`🌫️ ${escapeHtml(EFFECT_TYPES[STATE.effectBrush].label)} em emanação de ${String(size).replace('.', ',')} m ao redor de <strong>${escapeHtml(clickedUnit.name)}</strong> (acompanha a peça).`);
    }
    requestRender();
    return true;
  }
  if (shape === 'cell') {
    STATE.interaction.paintingTerrain = tool;
    applyPaintCells(tool, [cell]);
    return true;
  }
  if (PAINT_SHAPES[shape]?.needsDrag) {
    STATE.paint.start = cell;
    STATE.paint.tool = tool;
    STATE.paint.preview = shapeCells(shape, cell, cell, size);
    requestRender();
    return true;
  }
  applyPaintCells(tool, shapeCells(shape, cell, cell, size));
  return true;
}

/** Arrasto: casa a casa (forma Célula) ou prévia da forma (cone, linha, quadrado). */
function paintDragTo(cell) {
  if (!cell) return;
  if (STATE.interaction.paintingTerrain) applyPaintCells(STATE.interaction.paintingTerrain, [cell]);
  else if (STATE.paint.start) {
    STATE.paint.preview = shapeCells(STATE.paint.shape === 'emanation' ? 'burst' : STATE.paint.shape, STATE.paint.start, cell, STATE.paint.size);
    requestRender();
  }
}

/** Soltar: aplica a forma arrastada. */
function finishPaint() {
  if (STATE.paint.start && STATE.paint.preview) applyPaintCells(STATE.paint.tool, STATE.paint.preview);
  STATE.paint.start = null;
  STATE.paint.preview = null;
  STATE.interaction.paintingTerrain = false;
}

function clearAllEffects() {
  for (const t of Object.keys(STATE.effects)) STATE.effects[t] = {};
  STATE.effectZones = [];
  requestRender();
}

/* ---------------- Objetos e perigos ---------------- */

function placeObjectAt(cell) {
  const brush = STATE.objectBrush;
  if (!brush) {
    addLog(STATE.toolTab === 'hazard' ? '⚠️ Escolha um perigo (ou Remover) antes de clicar no tabuleiro.' : '🪑 Escolha um objeto (ou Remover) antes de clicar no tabuleiro.');
    return;
  }
  // objetos e perigos dividem a casa: cada aba só mexe no seu tipo
  const isHazardTab = STATE.toolTab === 'hazard';
  const sameKind = (o) => (isHazardTab ? !!HAZARD_TYPES[o.type] : !!OBJECT_TYPES[o.type]);
  STATE.objects = STATE.objects.filter(o => !(o.col === cell.col && o.row === cell.row && sameKind(o)));
  if (brush !== 'erase') STATE.objects.push({ id: `o_${Date.now()}_${Math.floor(Math.random() * 1000)}`, type: brush, col: cell.col, row: cell.row });
  requestRender();
}

/* ---------------- Clique no tabuleiro (montagem) ---------------- */

/** Toque/clique simples já confirmado (no celular, ao soltar o dedo). */
function setupTap(cell, clickedUnit) {
  const tool = currentBoardTool();
  if (tool === 'object' || tool === 'hazard') { placeObjectAt(cell); return; }
  if (clickedUnit) {
    STATE.selectedUnitId = clickedUnit.id;
    syncInspectorUI();
    requestRender();
    return;
  }
  if (tool === 'piece' || tool === 'animal') {
    if (STATE.selectedTemplateId) spawnUnitFromTemplate(STATE.selectedTemplateId, cell.col, cell.row);
    else addLog(tool === 'animal' ? '🐺 Escolha um animal na caixa de ferramentas antes de clicar no tabuleiro.' : '🧙 Escolha uma peça na galeria antes de clicar no tabuleiro.');
  }
}

/** Ao pousar o ponteiro (mouse). Devolve true se a ação já foi tratada aqui. */
function setupPointerDown(cell, clickedUnit) {
  const tool = currentBoardTool();
  if (tool === 'terrain' || tool === 'effect') return beginPaint(tool, cell, clickedUnit) || selectOnly(clickedUnit);
  if (tool === 'object' || tool === 'hazard') { placeObjectAt(cell); return true; }
  if ((tool === 'piece' || tool === 'animal') && clickedUnit) {
    STATE.selectedUnitId = clickedUnit.id;
    STATE.interaction.draggingUnitId = clickedUnit.id;
    syncInspectorUI();
    requestRender();
    return true;
  }
  setupTap(cell, clickedUnit);
  return true;
}

function selectOnly(unit) {
  if (unit) { STATE.selectedUnitId = unit.id; syncInspectorUI(); requestRender(); }
  return true;
}
