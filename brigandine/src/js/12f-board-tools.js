/* ============================================================================
   15f. FERRAMENTAS DA BARRA DO TABULEIRO — mão, lixeira e lápis
   - Mão: arrastar move a visão (também segurando Espaço). Vale na montagem e no combate.
   - Lixeira (montagem): apaga o que veio da Caixa de ferramentas — peça, objeto, perigo
     ou terreno, nessa ordem de prioridade. Arrastar apaga objetos/terreno em sequência
     (peças só com clique). Ctrl+Z desfaz.
   - Lápis (montagem): clique abre a edição (peça → inspetor; objeto/perigo/terreno →
     editor flutuante); arrastar move peça, objeto ou perigo.
   Com uma dessas ferramentas ligada, o clique no tabuleiro é dela, qualquer que seja o menu aberto.
   ============================================================================ */

const HUD_TOOLS = ['pan', 'erase', 'edit'];
const ERASE_UNDO_LIMIT = 30;
const eraseUndo = [];

function setHudTool(tool) {
  const next = HUD_TOOLS.includes(tool) && STATE.hudTool !== tool ? tool : null;
  if (next && next !== 'pan' && STATE.mode !== 'setup') return;
  if (next && STATE.ruler.active) toggleRulerTool();
  STATE.hudTool = next;
  closeBoardEditor();
  syncHudToolButtons();
  requestRender();
}

function syncHudToolButtons() {
  const ids = { pan: 'btnHudPan', erase: 'btnHudErase', edit: 'btnHudEdit' };
  for (const [t, id] of Object.entries(ids)) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.classList.toggle('active', STATE.hudTool === t);
    b.setAttribute('aria-pressed', String(STATE.hudTool === t));
  }
  canvas.style.cursor = STATE.hudTool === 'pan' || STATE.spacePan ? 'grab'
    : STATE.hudTool === 'erase' ? 'not-allowed' : STATE.hudTool === 'edit' ? 'pointer' : '';
  const hint = document.getElementById('hudInstructionText');
  if (hint && !STATE.hudTool) hint.textContent = STATE.mode === 'setup'
    ? 'Clique em uma peça para editar a ficha. Arraste para reposicionar.'
    : 'Escolha um comando: Ação, Mover, Magias, Itens ou Ficha.';
  if (hint && STATE.hudTool) {
    hint.textContent = {
      pan: 'Mão: arraste para mover a visão do tabuleiro.',
      erase: 'Lixeira: clique numa peça, objeto, perigo ou terreno para apagar. Ctrl+Z desfaz.',
      edit: 'Lápis: clique para editar; arraste uma peça, objeto ou perigo para mover.'
    }[STATE.hudTool];
  }
}

/* ---------------- O que existe numa casa ---------------- */

/** Coisas da Caixa de ferramentas numa casa, da mais "alta" para a mais baixa. */
function boardItemsAt(col, row) {
  const items = [];
  const unit = STATE.units.find(u => u.col === col && u.row === row && u.hp > 0) || STATE.units.find(u => u.col === col && u.row === row);
  if (unit) items.push({ kind: 'unit', ref: unit, label: unit.name });
  for (const o of STATE.objects) {
    if (o.col !== col || o.row !== row) continue;
    if (OBJECT_TYPES[o.type]) items.push({ kind: 'object', ref: o, label: OBJECT_TYPES[o.type].label });
  }
  for (const o of STATE.objects) {
    if (o.col !== col || o.row !== row) continue;
    if (HAZARD_TYPES[o.type]) items.push({ kind: 'hazard', ref: o, label: HAZARD_TYPES[o.type].label });
  }
  const t = STATE.terrainMap[`${col},${row}`];
  if (t) items.push({ kind: 'terrain', ref: { col, row, type: t }, label: TERRAIN_TYPES[t]?.label || t });
  return items;
}

/* ---------------- Lixeira ---------------- */

/** Apaga o item mais alto da casa. allowUnits=false no arrasto (peças só com clique). */
function eraseAt(cell, allowUnits = true) {
  const item = boardItemsAt(cell.col, cell.row).find(it => allowUnits || it.kind !== 'unit');
  if (!item) return null;
  if (item.kind === 'unit') {
    const u = item.ref;
    const idx = STATE.units.indexOf(u);
    const zones = STATE.effectZones.filter(z => z.unitId === u.id);
    STATE.units.splice(idx, 1);
    STATE.effectZones = STATE.effectZones.filter(z => z.unitId !== u.id);
    if (STATE.selectedUnitId === u.id) STATE.selectedUnitId = null;
    if (STATE.combat.activeUnitId === u.id) STATE.combat.activeUnitId = STATE.units.find(x => x.hp > 0)?.id || null;
    pushEraseUndo({ kind: 'unit', unit: u, idx, zones });
    syncInspectorUI();
  } else if (item.kind === 'object' || item.kind === 'hazard') {
    const idx = STATE.objects.indexOf(item.ref);
    STATE.objects.splice(idx, 1);
    pushEraseUndo({ kind: 'object', obj: item.ref, idx });
  } else {
    delete STATE.terrainMap[`${cell.col},${cell.row}`];
    pushEraseUndo({ kind: 'terrain', key: `${cell.col},${cell.row}`, type: item.ref.type });
  }
  requestRender();
  return item;
}

function pushEraseUndo(entry) {
  eraseUndo.push(entry);
  if (eraseUndo.length > ERASE_UNDO_LIMIT) eraseUndo.shift();
}

/** Ctrl+Z: devolve o último item apagado pela lixeira. */
function undoErase() {
  const e = eraseUndo.pop();
  if (!e) return false;
  if (e.kind === 'unit') {
    STATE.units.splice(Math.min(e.idx, STATE.units.length), 0, e.unit);
    STATE.effectZones.push(...e.zones);
    STATE.selectedUnitId = e.unit.id;
    syncInspectorUI();
    addLog(`↩️ <strong>${escapeHtml(e.unit.name)}</strong> voltou ao tabuleiro.`);
  } else if (e.kind === 'object') {
    STATE.objects.splice(Math.min(e.idx, STATE.objects.length), 0, e.obj);
  } else {
    STATE.terrainMap[e.key] = e.type;
  }
  requestRender();
  return true;
}

/* ---------------- Lápis ---------------- */

/** Pousar o lápis: guarda o alvo; arrastar move, soltar sem arrastar abre a edição. */
function editPointerDown(cell) {
  const item = boardItemsAt(cell.col, cell.row)[0] || null;
  STATE.interaction.editDrag = { item, start: cell, moved: false };
  closeBoardEditor();
  return true;
}

function editDragTo(cell) {
  const d = STATE.interaction.editDrag;
  if (!d || !d.item || !cell || d.item.kind === 'terrain') return;
  if (cell.col === d.start.col && cell.row === d.start.row && !d.moved) return;
  const ref = d.item.ref;
  if (d.item.kind === 'unit') {
    const occupied = STATE.units.some(u => u !== ref && u.hp > 0 && u.col === cell.col && u.row === cell.row);
    if (occupied) return;
  } else {
    // objeto e perigo dividem a casa, mas dois do mesmo tipo de coisa não
    const isHz = !!HAZARD_TYPES[ref.type];
    if (STATE.objects.some(o => o !== ref && o.col === cell.col && o.row === cell.row && !!HAZARD_TYPES[o.type] === isHz)) return;
  }
  if (ref.col !== cell.col || ref.row !== cell.row) {
    ref.col = cell.col;
    ref.row = cell.row;
    d.moved = true;
    requestRender();
  }
}

function editPointerUp(e) {
  const d = STATE.interaction.editDrag;
  STATE.interaction.editDrag = null;
  if (!d) return;
  if (d.moved) {
    if (d.item.kind === 'unit') { STATE.selectedUnitId = d.item.ref.id; syncInspectorUI(); }
    return;
  }
  if (!d.item) { addLog('✏️ Nada para editar nesta casa (peças, objetos, perigos e terreno vêm da Caixa de ferramentas).'); return; }
  if (d.item.kind === 'unit') {
    STATE.selectedUnitId = d.item.ref.id;
    syncInspectorUI();
    if (isCompactLayout()) toggleSheet(true);
    requestRender();
    return;
  }
  openBoardEditor(d.item, e);
}

/* ---------------- Editor flutuante (objeto, perigo, terreno) ---------------- */

let boardEditTarget = null;

function closeBoardEditor() {
  boardEditTarget = null;
  document.getElementById('boardEditPop')?.classList.add('hidden');
}

/** Abre o editor perto da casa clicada. */
function openBoardEditor(item, e) {
  boardEditTarget = item;
  const pop = document.getElementById('boardEditPop');
  pop.innerHTML = boardEditorHTML(item);
  pop.classList.remove('hidden');
  const stage = pop.parentElement.getBoundingClientRect();
  const c = getCellPixelCenter(item.ref.col, item.ref.row);
  const cr = canvas.getBoundingClientRect();
  const x = cr.left - stage.left + c.x + 30, y = cr.top - stage.top + c.y - 20;
  pop.style.left = `${Math.max(8, Math.min(stage.width - pop.offsetWidth - 8, x))}px`;
  pop.style.top = `${Math.max(8, Math.min(stage.height - pop.offsetHeight - 8, y))}px`;
}

function boardEditorHTML(item) {
  const ref = item.ref;
  const opts = (map, cur) => Object.entries(map).map(([k, t]) => `<option value="${k}"${k === cur ? ' selected' : ''}>${escapeHtml(t.label)}</option>`).join('');
  const title = { object: 'Objeto', hazard: 'Perigo', terrain: 'Terreno' }[item.kind];
  let body = `<div class="field"><label>Tipo</label><select onchange="boardEditSet('type', this.value)">${
    opts(item.kind === 'object' ? OBJECT_TYPES : item.kind === 'hazard' ? HAZARD_TYPES : TERRAIN_TYPES, ref.type)}</select></div>`;
  const light = item.kind !== 'terrain' ? envObjectLight(ref) : null;
  if (light) {
    body += `<div class="grid-2">
      <div class="field"><label>Luz plena (m)</label><input type="number" min="0" max="60" step="1.5" value="${light.bright}" onchange="boardEditSet('bright', this.value)"></div>
      <div class="field"><label>Penumbra até (m)</label><input type="number" min="1.5" max="120" step="1.5" value="${light.dim}" onchange="boardEditSet('dim', this.value)"></div>
    </div>`;
  }
  if (item.kind === 'hazard') {
    const dmg = envHazardDamage(ref);
    body += `<div class="grid-2">
      <div class="field"><label>Dano</label><input type="text" value="${escapeHtml(dmg.dmgDie)}" onchange="boardEditSet('dmgDie', this.value)"></div>
      <div class="field"><label>Tipo de dano</label><select onchange="boardEditSet('dmgType', this.value)">${DAMAGE_TYPES.map(t => `<option value="${t}"${t === dmg.dmgType ? ' selected' : ''}>${t}</option>`).join('')}</select></div>
    </div>`;
  }
  if (item.kind === 'terrain') {
    const t = TERRAIN_TYPES[ref.type];
    body += `<p class="hint">${escapeHtml(t?.desc || '')}${t && t.move === null ? ' · intransponível' : t && t.move > 1 ? ' · custa o dobro para andar' : ''}</p>`;
  }
  return `<div class="board-pop-head"><strong>${title}</strong><span class="faint">casa ${ref.col + 1}, ${ref.row + 1}</span>
      <button class="btn btn-ghost btn-icon btn-sm" onclick="closeBoardEditor()" aria-label="Fechar"><svg class="icon"><use href="#i-x"/></svg></button></div>
    ${body}
    <div class="board-pop-actions"><button class="btn btn-sm btn-danger" onclick="boardEditRemove()"><svg class="icon"><use href="#i-trash"/></svg>Remover</button>
      ${item.kind !== 'terrain' ? '<span class="hint">Arraste com o lápis para mover.</span>' : ''}</div>`;
}

/** Aplica uma mudança do editor flutuante e redesenha o editor com os valores válidos. */
function boardEditSet(field, value) {
  const it = boardEditTarget;
  if (!it) return;
  const ref = it.ref;
  if (it.kind === 'terrain') {
    if (field === 'type' && TERRAIN_TYPES[value]) { STATE.terrainMap[`${ref.col},${ref.row}`] = value; ref.type = value; }
  } else {
    const idx = STATE.objects.indexOf(ref);
    if (idx < 0) return closeBoardEditor();
    const draft = { ...ref };
    if (field === 'type' && (it.kind === 'object' ? OBJECT_TYPES : HAZARD_TYPES)[value]) { draft.type = value; delete draft.light; delete draft.dmgDie; delete draft.dmgType; }
    if (field === 'bright' || field === 'dim') {
      const cur = envObjectLight(ref) || {};
      draft.light = { bright: cur.bright, dim: cur.dim, [field]: Number(value) };
    }
    if (field === 'dmgDie') draft.dmgDie = String(value);
    if (field === 'dmgType') draft.dmgType = value;
    const clean = normalizeEnvObject(draft);
    if (field === 'dmgDie' && !clean.dmgDie) addLog(`⚠️ Dado inválido "${escapeHtml(value)}". Use o formato 1d6.`);
    STATE.objects[idx] = clean;
    it.ref = clean;
  }
  document.getElementById('boardEditPop').innerHTML = boardEditorHTML(it);
  requestRender();
}

function boardEditRemove() {
  const it = boardEditTarget;
  if (!it) return;
  if (it.kind === 'terrain') {
    delete STATE.terrainMap[`${it.ref.col},${it.ref.row}`];
    pushEraseUndo({ kind: 'terrain', key: `${it.ref.col},${it.ref.row}`, type: it.ref.type });
  } else {
    const idx = STATE.objects.indexOf(it.ref);
    if (idx >= 0) { STATE.objects.splice(idx, 1); pushEraseUndo({ kind: 'object', obj: it.ref, idx }); }
  }
  closeBoardEditor();
  requestRender();
}

/* ---------------- Ligação com o ponteiro (chamado por 08-input) ---------------- */

/** Ponteiro pousou no tabuleiro com uma ferramenta da barra ligada. Devolve true se tratou. */
function hudToolPointerDown(pt, cell) {
  const tool = STATE.spacePan ? 'pan' : STATE.hudTool;
  if (!tool) return false;
  if (tool === 'pan') {
    STATE.interaction.isPanning = true;
    STATE.interaction.panStart = { x: pt.x - STATE.camera.x, y: pt.y - STATE.camera.y };
    canvas.style.cursor = 'grabbing';
    return true;
  }
  if (!cell) return true;
  if (tool === 'erase') {
    const item = eraseAt(cell, true);
    if (item) addLog(`🗑️ ${escapeHtml(item.label)} apagado do tabuleiro (Ctrl+Z desfaz).`);
    STATE.interaction.erasing = !item || item.kind !== 'unit';
    return true;
  }
  if (tool === 'edit') return editPointerDown(cell);
  return false;
}

/** Arrasto com ferramenta da barra. Devolve true se tratou. */
function hudToolPointerMove(cell) {
  if (STATE.interaction.erasing) { if (cell) eraseAt(cell, false); return true; }
  if (STATE.interaction.editDrag) { editDragTo(cell); return true; }
  return false;
}

function hudToolPointerUp(e) {
  STATE.interaction.erasing = false;
  if (STATE.interaction.editDrag) { if (e) editPointerUp(e); else STATE.interaction.editDrag = null; }
  if (STATE.hudTool === 'pan' || STATE.spacePan) canvas.style.cursor = 'grab';
}
