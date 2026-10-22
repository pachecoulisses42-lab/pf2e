/* ============================================================================
   16. COMBAT UI SYNCHRONIZATION (5 MAIN MENUS)
   ============================================================================ */
const AREA_LABELS = { single: 'Alvo único', line: 'Linha', burst: 'Explosão' };

function damageTagHTML(type) {
  return type ? `<span class="tag ${DAMAGE_TAG_CLASS[type] || 'tag-phys'}">${escapeHtml(type)}</span>` : '';
}

function extraTagsHTML(src) {
  return (src.extra || []).map(x =>
    `<span class="tag ${DAMAGE_TAG_CLASS[x.type] || 'tag-phys'}" title="${escapeHtml(x.name)}">+${escapeHtml(x.die)}${x.bonus ? signed(x.bonus) : ''} ${escapeHtml(x.type)}</span>`).join('');
}

function reachLabel(meters) {
  return meters <= STATE.grid.cellScale ? 'Adjacente' : `${String(meters).replace('.', ',')} m`;
}

function spellSummary(sp) {
  if (sp.desc) return sp.desc;
  const area = sp.areaType === 'single' ? 'Alvo único' : `${AREA_LABELS[sp.areaType]} de ${sp.areaSize} m`;
  return `${area} · alcance ${reachLabel(sp.range)}`;
}

/* ============================================================================
   16. COMBAT UI SYNCHRONIZATION (5 MAIN MENUS)
   ============================================================================ */
function syncCombatUI() {
  updateSheetLabel();
  document.getElementById('roundCounterBadge').textContent = STATE.combat.round;
  const activeUnit = STATE.units.find(u => u.id === STATE.combat.activeUnitId);

  const initList = document.getElementById('initiativeList');
  initList.innerHTML = '';
  if (STATE.units.length === 0) {
    initList.innerHTML = `<div class="empty"><strong>Sem peças em campo</strong><span>Volte à montagem e posicione as peças.</span></div>`;
  }
  for (const u of STATE.units) {
    const div = document.createElement('div');
    const isAct = u.id === STATE.combat.activeUnitId;
    const isDead = u.hp <= 0;
    div.className = `init-item ${isAct ? 'active-turn' : ''} ${isDead ? 'dead-unit' : ''}`;
    div.onclick = () => selectActiveTurnUnit(u.id);
    div.innerHTML = `
      <div class="row">
        <span class="badge ${u.faction === 'hero' ? 'badge-hero' : 'badge-villain'} num">${u.initiative}</span>
        <span class="init-name">${escapeHtml(u.name)}</span>
        ${isDead ? '<span class="badge badge-dead">MORTO</span>' : ''}
        ${u.shieldRaised && !isDead ? '<svg class="icon" style="color:var(--ward)"><use href="#i-shield"/></svg>' : ''}
      </div>
      <div class="init-meta">
        <span class="num">${u.hp}/${u.maxHp}</span>
        <span class="init-pips">${'◆'.repeat(u.actions)}${u.reaction ? '↺' : ''}</span>
      </div>`;
    initList.appendChild(div);
  }

  if (!activeUnit) return;
  recalculateUnitFromSheet(activeUnit, false);

  document.getElementById('combatUnitSculpt').innerHTML = getTokenPreviewHTML(activeUnit.sculpt, activeUnit.customTokenDataUrl, customTokenOptions(activeUnit));
  document.getElementById('combatUnitName').textContent = activeUnit.name;
  document.getElementById('combatUnitLevel').textContent = activeUnit.sheet?.level || 1;
  document.getElementById('combatUnitAC').textContent = activeUnit.ac;
  document.getElementById('combatUnitACBox').classList.toggle('raised', !!activeUnit.shieldRaised);
  document.getElementById('combatUnitHpText').innerHTML = `${activeUnit.hp} <small>/ ${activeUnit.maxHp} PV</small>`;
  document.getElementById('combatUnitMoveText').textContent = `Movimento ${String(activeUnit.moveSpeed).replace('.', ',')} m`;
  const hpPct = Math.max(0, Math.min(100, (activeUnit.hp / activeUnit.maxHp) * 100));
  const hpBar = document.getElementById('combatUnitHpBar');
  hpBar.style.width = `${hpPct}%`;
  hpBar.dataset.level = hpPct > 50 ? 'high' : (hpPct > 25 ? 'mid' : 'low');

  const defChips = ['resistances', 'weaknesses'].flatMap(k => (activeUnit[k] || []).map(e => defenseChipHTML(k, e)))
    .concat((activeUnit.immunities || []).map(e => defenseChipHTML('immunities', e))).join('');
  const defBox = document.getElementById('combatUnitDefenses');
  defBox.innerHTML = defChips;
  defBox.classList.toggle('hidden', !defChips);

  const fBadge = document.getElementById('combatUnitFactionBadge');
  fBadge.className = `badge ${activeUnit.faction === 'hero' ? 'badge-hero' : 'badge-villain'}`;
  fBadge.textContent = activeUnit.faction === 'hero' ? 'HERÓI' : 'VILÃO';

  for (let i = 1; i <= 3; i++) {
    document.getElementById(`pipAction${i}`).className = activeUnit.actions >= i ? 'action-pip available' : 'action-pip';
  }
  document.getElementById('pipReaction').className = activeUnit.reaction ? 'reaction-pip available' : 'reaction-pip';

  // Subpanel 1: Ação (armas + Erguer Escudo)
  const mapVal = activeUnit.strikesMade === 0 ? 'MAP 0' : (activeUnit.strikesMade === 1 ? 'MAP −5' : 'MAP −10');
  document.getElementById('lblCurrentMAP').textContent = mapVal;
  const wBox = document.getElementById('combatWeaponList');
  wBox.innerHTML = '';
  activeUnit.weapons.forEach((w, idx) => {
    const card = document.createElement('div');
    card.className = `option-card ${idx === STATE.combat.selectedWeaponIdx ? 'selected-attack' : ''}`;
    card.onclick = () => { STATE.combat.selectedWeaponIdx = idx; syncCombatUI(); requestRender(); };
    card.classList.add('has-cost');
    card.innerHTML = `
      <div class="card-ribbon">${escapeHtml(w.name)}</div>
      <div class="card-art"><svg class="icon"><use href="#i-swords"/></svg></div>
      <div class="card-text"><b class="num">${escapeHtml(describeDamage(w))}</b><span>${reachLabel(w.reach)} · ${signed(w.atkBonus)} acerto</span>${(w.extra || []).length ? `<div class="chip-row" style="justify-content:center">${extraTagsHTML(w)}</div>` : ''}</div>
      <div class="card-cost"><span class="cost-badge">1</span></div>`;
    wBox.appendChild(card);
  });

  const bonus = shieldBonusOf(activeUnit);
  const shieldBtn = document.getElementById('btnRaiseShield');
  shieldBtn.classList.toggle('active', !!activeUnit.shieldRaised);
  shieldBtn.disabled = !!activeUnit.shieldRaised || bonus <= 0 || activeUnit.actions < 1;
  shieldBtn.innerHTML = `<svg class="icon"><use href="#i-${activeUnit.shieldRaised ? 'check' : 'shield'}"/></svg>${activeUnit.shieldRaised ? 'Erguido' : 'Erguer'}`;
  document.getElementById('lblShieldInfo').textContent = bonus <= 0
    ? 'Sem escudo equipado'
    : (activeUnit.shieldRaised ? `CA ${activeUnit.baseAc} → ${activeUnit.ac} até o início do próximo turno` : `+${bonus} CA até o início do seu próximo turno`);

  // Subpanel 2: Movimento
  document.getElementById('lblSubMoveSpeed').textContent = `${String(activeUnit.moveSpeed).replace('.', ',')} m / ação`;

  // Subpanel 3: Magias
  const sBox = document.getElementById('combatSpellList');
  sBox.innerHTML = '';
  if (activeUnit.spells.length === 0) {
    sBox.innerHTML = `<div class="empty"><svg class="icon"><use href="#i-sparkles"/></svg><strong>Sem magias</strong><span>Adicione magias na aba Magias do modo Montagem.</span></div>`;
  } else {
    activeUnit.spells.forEach((sp, idx) => {
      const card = document.createElement('div');
      card.className = `option-card ${idx === STATE.combat.selectedSpellIdx ? 'selected-magic' : ''}`;
      card.onclick = () => { STATE.combat.selectedSpellIdx = idx; syncCombatUI(); requestRender(); };
      card.classList.add('has-cost', 'spell-card');
      card.innerHTML = `
        <div class="card-ribbon">${escapeHtml(sp.name)}</div>
        <div class="card-art"><svg class="icon"><use href="#i-sparkles"/></svg></div>
        <div class="card-text"><b class="num">${escapeHtml(describeDamage(sp))}</b><span>${escapeHtml(spellSummary(sp))} · ${signed(sp.atkBonus)}</span>${(sp.extra || []).length ? `<div class="chip-row" style="justify-content:center">${extraTagsHTML(sp)}</div>` : ''}</div>
        <div class="card-cost"><span class="cost-badge">${sp.cost || 2}</span></div>`;
      sBox.appendChild(card);
    });
  }

  // Subpanel 4: Itens
  const iBox = document.getElementById('combatItemList');
  iBox.innerHTML = '';
  const availableItems = activeUnit.items.filter(it => it.qty > 0);
  if (availableItems.length === 0) {
    iBox.innerHTML = `<div class="empty"><svg class="icon"><use href="#i-flask"/></svg><strong>Inventário vazio</strong><span>Nenhuma poção ou pergaminho disponível.</span></div>`;
  } else {
    activeUnit.items.forEach((it, idx) => {
      if (it.qty <= 0) return;
      const card = document.createElement('div');
      card.className = `option-card ${idx === STATE.combat.selectedItemIdx ? 'selected-item' : ''}`;
      card.onclick = () => { STATE.combat.selectedItemIdx = idx; syncCombatUI(); requestRender(); };
      card.classList.add('has-cost', 'item-card');
      card.innerHTML = `
        <div class="card-ribbon">${escapeHtml(it.name)}</div>
        <div class="card-art"><svg class="icon"><use href="#i-${it.kind === 'potion' ? 'flask' : 'scroll'}"/></svg></div>
        <div class="card-text"><b>×${it.qty}</b><span>${escapeHtml(it.desc)}</span></div>
        <div class="card-cost"><span class="cost-badge">${it.cost || 2}</span></div>`;
      iBox.appendChild(card);
    });
  }

  // Subpanel 5: Ficha (somente leitura no combate)
  document.getElementById('sheetHeaderBadge').textContent = `${activeUnit.sheet?.ancestry || ''} · Nív ${activeUnit.sheet?.level || 1}`;
  document.getElementById('combatSheetContainer').innerHTML = buildPF2eSheetHTML(activeUnit, false);
}

/* ============================================================================
   17. SETUP / EDIT MODE INSPECTOR (FICHA/BUILD, BASE, WEAPONS, SPELLS, ITEMS)
   ============================================================================ */
function switchEditTab(tab) {
  STATE.editTab = tab;
  const tabs = { sheet: 'Sheet', base: 'Base', weapons: 'Weapons', spells: 'Spells', items: 'Items' };
  for (const key of Object.keys(tabs)) {
    document.getElementById(`editTab${tabs[key]}Btn`).classList.toggle('active', key === tab);
    document.getElementById(`editTab${tabs[key]}`).classList.toggle('hidden', key !== tab);
  }
}

function selectedUnit() {
  return STATE.units.find(x => x.id === STATE.selectedUnitId) || null;
}

/* ---------- Editor de dano adicional (runas) — compartilhado por armas e magias ---------- */
function extraEditorHTML(kind, idx, src) {
  const key = `${kind}-${idx}`;
  const rows = (src.extra || []).map((x, xi) => `
    <div class="rune-row">
      <span><strong>${escapeHtml(x.name || 'Dano extra')}</strong> · ${escapeHtml(x.die)}${x.bonus ? signed(x.bonus) : ''} ${damageTagHTML(x.type)}</span>
      <button class="btn btn-sm btn-ghost btn-icon" onclick="removeExtraDamage('${kind}', ${idx}, ${xi})" aria-label="Remover ${escapeHtml(x.name)}"><svg class="icon"><use href="#i-x"/></svg></button>
    </div>`).join('') || `<p class="hint">Nenhum dano adicional.</p>`;

  return `
    <div class="stack">
      <span class="subtle-title">${kind === 'weapon' ? 'Runas e dano adicional' : 'Dano adicional'}</span>
      ${rows}
      <div class="row">
        <select id="xPreset-${key}" aria-label="Runa">
          ${Object.entries(RUNE_PRESETS).map(([k, r]) => `<option value="${k}">${r.name} · ${r.die} ${r.type}</option>`).join('')}
        </select>
        <button class="btn btn-sm" onclick="addPresetExtraDamage('${kind}', ${idx})">Adicionar</button>
      </div>
      <details class="more">
        <summary>Dano personalizado<svg class="icon chev"><use href="#i-chevron"/></svg></summary>
        <div class="more-body">
          <div class="field"><label>Nome</label><input type="text" id="xName-${key}" placeholder="Ex.: Runa de Ferrão"></div>
          <div class="grid-3">
            <div class="field"><label>Dado</label><input type="text" id="xDie-${key}" value="1d6"></div>
            <div class="field"><label>Bônus</label><input type="number" id="xBonus-${key}" value="0"></div>
            <div class="field"><label>Tipo</label><select id="xType-${key}">${DAMAGE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}</select></div>
          </div>
          <button class="btn btn-sm btn-block" onclick="addCustomExtraDamage('${kind}', ${idx})"><svg class="icon"><use href="#i-plus"/></svg>Incluir dano</button>
        </div>
      </details>
    </div>`;
}

function weaponEditorHTML(w, idx) {
  const auto = !w.manual;
  return `
    <div class="field"><label>Nome</label><input type="text" value="${escapeHtml(w.name)}" onchange="updateWeaponField(${idx}, 'name', this.value)"></div>
    <div class="grid-2">
      <div class="field"><label>Alcance (m)</label><input type="number" min="1.5" step="1.5" value="${w.reach}" onchange="updateWeaponField(${idx}, 'reach', this.value)"></div>
      <div class="field"><label>Tipo de dano</label>
        <select onchange="updateWeaponField(${idx}, 'dmgType', this.value)"><option value="">—</option>${DAMAGE_TYPES.map(t => `<option value="${t}" ${w.dmgType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Dado de dano</label><input type="text" value="${escapeHtml(w.dmgDie)}" placeholder="1d8" onchange="updateWeaponField(${idx}, 'dmgDie', this.value)"></div>
      <div class="field"><label>Bônus de dano</label><input type="number" value="${w.dmgBonus}" ${auto ? 'disabled' : ''} onchange="updateWeaponField(${idx}, 'dmgBonus', this.value)"></div>
    </div>
    <div class="field"><label>Bônus de ataque</label><input type="number" value="${w.atkBonus}" ${auto ? 'disabled' : ''} onchange="updateWeaponField(${idx}, 'atkBonus', this.value)"></div>
    <label class="check"><input type="checkbox" ${auto ? 'checked' : ''} onchange="updateWeaponField(${idx}, 'manual', !this.checked)"> Ataque e bônus de dano seguem a ficha</label>
    ${extraEditorHTML('weapon', idx, w)}`;
}

function spellEditorHTML(sp, idx) {
  const auto = !sp.manual;
  return `
    <div class="field"><label>Nome</label><input type="text" value="${escapeHtml(sp.name)}" onchange="updateSpellField(${idx}, 'name', this.value)"></div>
    <div class="field"><label>Descrição</label><input type="text" value="${escapeHtml(sp.desc)}" placeholder="Opcional" onchange="updateSpellField(${idx}, 'desc', this.value)"></div>
    <div class="grid-2">
      <div class="field"><label>Custo</label>
        <select onchange="updateSpellField(${idx}, 'cost', this.value)">${[1, 2, 3].map(c => `<option value="${c}" ${sp.cost === c ? 'selected' : ''}>${'◆'.repeat(c)} ${c} ${c === 1 ? 'ação' : 'ações'}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Alcance (m)</label><input type="number" min="1.5" step="1.5" value="${sp.range}" onchange="updateSpellField(${idx}, 'range', this.value)"></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Área</label>
        <select onchange="updateSpellField(${idx}, 'areaType', this.value)">${Object.entries(AREA_LABELS).map(([k, l]) => `<option value="${k}" ${sp.areaType === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Tamanho da área (m)</label><input type="number" min="0" step="1.5" value="${sp.areaSize}" ${sp.areaType === 'single' ? 'disabled' : ''} onchange="updateSpellField(${idx}, 'areaSize', this.value)"></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Dado de dano</label><input type="text" value="${escapeHtml(sp.dmgDie)}" placeholder="4d6" onchange="updateSpellField(${idx}, 'dmgDie', this.value)"></div>
      <div class="field"><label>Bônus de dano</label><input type="number" value="${sp.dmgBonus}" ${auto ? 'disabled' : ''} onchange="updateSpellField(${idx}, 'dmgBonus', this.value)"></div>
    </div>
    <div class="grid-2">
      <div class="field"><label>Tipo de dano</label>
        <select onchange="updateSpellField(${idx}, 'dmgType', this.value)"><option value="">—</option>${DAMAGE_TYPES.map(t => `<option value="${t}" ${sp.dmgType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Bônus de ataque</label><input type="number" value="${sp.atkBonus}" ${auto ? 'disabled' : ''} onchange="updateSpellField(${idx}, 'atkBonus', this.value)"></div>
    </div>
    <label class="check"><input type="checkbox" ${auto ? 'checked' : ''} onchange="updateSpellField(${idx}, 'manual', !this.checked)"> Ataque segue a ficha (bônus de dano &gt; 0 segue o atributo-chave)</label>
    ${extraEditorHTML('spell', idx, sp)}`;
}

function editorCardHTML({ kind, idx, title, sub, tags, open, body }) {
  return `
    <div class="editor-card">
      <div class="editor-head">
        <div class="grow option-main">
          <div class="option-title">${title}</div>
          <div class="option-sub">${sub}</div>
          ${tags ? `<div class="chip-row">${tags}</div>` : ''}
        </div>
        <div class="row">
          <button class="btn btn-sm btn-icon ${open ? 'active' : 'btn-ghost'}" onclick="toggleEditor('${kind}', ${idx})" aria-label="${open ? 'Fechar edição' : 'Editar'}" aria-expanded="${open}"><svg class="icon"><use href="#i-pencil"/></svg></button>
          <button class="btn btn-sm btn-icon btn-ghost" onclick="${kind === 'weapon' ? 'removeWeaponFromUnit' : 'removeSpellFromUnit'}(${idx})" aria-label="Remover"><svg class="icon"><use href="#i-trash"/></svg></button>
        </div>
      </div>
      ${open ? `<div class="editor-body">${body}</div>` : ''}
    </div>`;
}

function syncInspectorUI() {
  updateSheetLabel();
  const u = selectedUnit();
  const emptyBox = document.getElementById('inspectorEmpty');
  const contentBox = document.getElementById('inspectorContent');
  if (!u) {
    emptyBox.classList.remove('hidden');
    contentBox.classList.add('hidden');
    return;
  }
  emptyBox.classList.add('hidden');
  contentBox.classList.remove('hidden');

  recalculateUnitFromSheet(u, false);

  document.getElementById('inspSculptPreview').innerHTML = getTokenPreviewHTML(u.sculpt, u.customTokenDataUrl, customTokenOptions(u));
  document.getElementById('inspNameInput').value = u.name;
  document.getElementById('inspTokenSelect').value = u.sculpt;
  if (document.getElementById('tokenPickerDetails').open) {
    if (u.id !== syncInspectorUI.lastUnitId) syncTokenPickerTab(u.sculpt);
    renderTokenPicker();
  }
  syncInspectorUI.lastUnitId = u.id;
  const hasCustom = !!u.customTokenDataUrl;
  document.getElementById('btnRemoveToken').classList.toggle('hidden', !hasCustom);
  document.getElementById('tokenFrameField').classList.toggle('hidden', !hasCustom);
  document.getElementById('chkTokenFrame').checked = u.customTokenFrame !== false;
  document.getElementById('tokenSourceLabel').textContent = hasCustom ? 'Imagem personalizada' : 'Ilustração padrão';

  const fBadge = document.getElementById('inspFactionBadge');
  fBadge.className = `badge ${u.faction === 'hero' ? 'badge-hero' : 'badge-villain'}`;
  fBadge.textContent = u.faction === 'hero' ? 'HERÓI' : 'VILÃO';

  document.getElementById('setupSheetContainer').innerHTML = buildPF2eSheetHTML(u, true);

  document.getElementById('lblInspHP').textContent = `${u.hp} / ${u.maxHp} PV · CA ${u.ac}`;
  document.getElementById('lblInspMaxHP').textContent = u.maxHp;
  document.getElementById('lblInspAC').textContent = u.sheet?.armorItemBonus ?? 0;
  document.getElementById('lblInspMove').textContent = `${String(u.moveSpeed).replace('.', ',')} metros`;
  const shieldB = shieldBonusOf(u);
  document.getElementById('lblInspShield').textContent = shieldB > 0 ? `+${shieldB} CA` : 'Sem escudo';
  document.querySelectorAll('.shield-bonus-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.b, 10) === shieldB);
  });

  document.querySelectorAll('.unit-move-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.m) === u.moveSpeed);
  });

  renderDefenseEditor(u);

  const ewList = document.getElementById('editorWeaponList');
  ewList.innerHTML = u.weapons.map((w, idx) => editorCardHTML({
    kind: 'weapon', idx,
    title: escapeHtml(w.name),
    sub: `${signed(w.atkBonus)} · ${escapeHtml(describeDamage(w))} · ${reachLabel(w.reach)}`,
    tags: extraTagsHTML(w),
    open: STATE.editingWeapon === idx,
    body: weaponEditorHTML(w, idx)
  })).join('');

  const esList = document.getElementById('editorSpellList');
  esList.innerHTML = u.spells.length ? u.spells.map((sp, idx) => editorCardHTML({
    kind: 'spell', idx,
    title: escapeHtml(sp.name),
    sub: `${signed(sp.atkBonus)} · ${escapeHtml(describeDamage(sp))} · ${'◆'.repeat(sp.cost || 2)}`,
    tags: extraTagsHTML(sp),
    open: STATE.editingSpell === idx,
    body: spellEditorHTML(sp, idx)
  })).join('') : `<div class="empty"><svg class="icon"><use href="#i-sparkles"/></svg><strong>Sem magias</strong><span>Crie uma nova magia ou adicione de um modelo.</span></div>`;

  const eiList = document.getElementById('editorItemList');
  eiList.innerHTML = '';
  if (u.items.length === 0) {
    eiList.innerHTML = `<div class="empty"><svg class="icon"><use href="#i-flask"/></svg><strong>Sem itens</strong><span>Adicione poções ou pergaminhos abaixo.</span></div>`;
  }
  u.items.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'tag-list-item';
    row.innerHTML = `
      <div class="grow"><span class="option-title">${escapeHtml(it.name)}</span><span class="option-sub">×${it.qty} · ${escapeHtml(it.desc)}</span></div>
      <button class="btn btn-sm btn-ghost btn-icon" onclick="removeItemFromUnit(${idx})" aria-label="Remover ${escapeHtml(it.name)}"><svg class="icon"><use href="#i-trash"/></svg></button>`;
    eiList.appendChild(row);
  });
}

function changeSelectedUnitToken(newSculpt) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  u.sculpt = newSculpt;
  u.customTokenDataUrl = null;
  syncInspectorUI();
  requestRender();
}

const TOKEN_MAX_FILE_BYTES = 10 * 1024 * 1024;
const TOKEN_MAX_SIDE = 384;

/**
 * Prepara a imagem do usuário: SVG segue como está; imagens raster são reduzidas
 * (lado maior 384 px) para não inflar o salvamento e o JSON exportado.
 * Mantém PNG/WebP/GIF como PNG (preserva transparência) e JPEG como JPEG.
 */
function prepareTokenImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('O arquivo não é uma imagem.'));
    if (file.size > TOKEN_MAX_FILE_BYTES) return reject(new Error('Imagem maior que 10 MB.'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      if (file.type === 'image/svg+xml') return resolve(reader.result);
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida ou formato não suportado.'));
      img.onload = () => {
        const scale = Math.min(1, TOKEN_MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(file.type === 'image/jpeg' ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function applyTokenFile(unit, file) {
  try {
    unit.customTokenDataUrl = await prepareTokenImage(file);
    if (unit.customTokenFrame === undefined) unit.customTokenFrame = true;
    addLog(`🖼️ Imagem aplicada como token de <strong>${escapeHtml(unit.name)}</strong>.`);
    syncInspectorUI();
    syncCombatUI();
    renderPieceGallery();
    requestRender();
  } catch (err) {
    addLog(`⚠️ ${escapeHtml(err.message)} Use PNG, JPG, WebP, GIF ou SVG de até 10 MB.`);
  }
}

function handleCustomTokenUpload(event) {
  const file = event.target.files[0];
  event.target.value = '';
  const u = selectedUnit();
  if (file && u) applyTokenFile(u, file);
}

function removeCustomToken() {
  const u = selectedUnit();
  if (!u) return;
  u.customTokenDataUrl = null;
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

function setCustomTokenFrame(framed) {
  const u = selectedUnit();
  if (!u) return;
  u.customTokenFrame = !!framed;
  syncInspectorUI();
  syncCombatUI();
  requestRender();
}

function addWeaponToSelectedUnit() {
  const u = selectedUnit();
  if (!u) return;
  const val = document.getElementById('addWeaponPresetSelect').value;
  const [name, atkBonus, dmgDie, dmgBonus, reach, dmgType] = val.split('|');
  u.weapons.push(normalizeWeapon({
    name,
    atkBonus: parseInt(atkBonus, 10),
    dmgDie,
    dmgBonus: parseInt(dmgBonus, 10),
    reach: parseFloat(reach),
    dmgType
  }));
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
}

function createWeaponOnSelectedUnit() {
  const u = selectedUnit();
  if (!u) return;
  u.weapons.push(normalizeWeapon({ name: 'Nova arma', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }));
  STATE.editingWeapon = u.weapons.length - 1;
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
}

function removeWeaponFromUnit(idx) {
  const u = selectedUnit();
  if (!u || u.weapons.length <= 1) {
    addLog('⚠️ A peça deve manter pelo menos 1 arma de ataque.');
    return;
  }
  u.weapons.splice(idx, 1);
  STATE.editingWeapon = null;
  STATE.combat.selectedWeaponIdx = 0;
  syncInspectorUI();
}

function addSpellToSelectedUnit() {
  const u = selectedUnit();
  if (!u) return;
  const key = document.getElementById('addSpellPresetSelect').value;
  const tpl = SPELL_CATALOG[key];
  if (tpl) {
    u.spells.push(normalizeSpell(JSON.parse(JSON.stringify(tpl))));
    recalculateUnitFromSheet(u, false);
    syncInspectorUI();
  }
}

function createSpellOnSelectedUnit() {
  const u = selectedUnit();
  if (!u) return;
  u.spells.push(normalizeSpell({
    id: 'custom_' + Date.now(), name: 'Nova magia', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, dmgDie: '2d6', dmgType: 'fogo'
  }));
  STATE.editingSpell = u.spells.length - 1;
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
}

function removeSpellFromUnit(idx) {
  const u = selectedUnit();
  if (!u) return;
  u.spells.splice(idx, 1);
  STATE.editingSpell = null;
  STATE.combat.selectedSpellIdx = 0;
  syncInspectorUI();
}

function toggleEditor(kind, idx) {
  const field = kind === 'weapon' ? 'editingWeapon' : 'editingSpell';
  STATE[field] = STATE[field] === idx ? null : idx;
  syncInspectorUI();
}

/** Atualiza um campo de arma/magia com validação; entradas inválidas são recusadas com aviso. */
function updateEditableField(kind, idx, field, raw) {
  const u = selectedUnit();
  if (!u) return;
  const target = (kind === 'weapon' ? u.weapons : u.spells)[idx];
  if (!target) return;
  const asInt = () => parseInt(raw, 10);
  const asNum = () => parseFloat(raw);

  switch (field) {
    case 'name': {
      const v = cleanText(raw);
      if (v) target.name = v;
      break;
    }
    case 'desc': target.desc = cleanText(raw); break;
    case 'reach': case 'range': {
      const v = asNum();
      if (v > 0) target[field] = v; else addLog('⚠️ O alcance deve ser maior que zero.');
      break;
    }
    case 'areaSize': { const v = asNum(); if (v >= 0) target.areaSize = v; break; }
    case 'dmgDie': {
      const v = String(raw).trim().toLowerCase();
      if (isValidDice(v)) target.dmgDie = v; else addLog(`⚠️ Dado inválido "${escapeHtml(raw)}". Use o formato 1d8.`);
      break;
    }
    case 'dmgBonus': case 'atkBonus': { const v = asInt(); if (Number.isFinite(v)) target[field] = v; break; }
    case 'cost': { const v = asInt(); if ([1, 2, 3].includes(v)) target.cost = v; break; }
    case 'areaType':
      if (['single', 'line', 'burst'].includes(raw)) {
        target.areaType = raw;
        if (raw === 'single') target.areaSize = 0;
        else if (!target.areaSize) target.areaSize = 9;
      }
      break;
    case 'dmgType': target.dmgType = DAMAGE_TYPES.includes(raw) ? raw : ''; break;
    case 'manual': target.manual = !!raw; break;
    default: return;
  }
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
  requestRender();
}

function updateWeaponField(idx, field, raw) { updateEditableField('weapon', idx, field, raw); }
function updateSpellField(idx, field, raw) { updateEditableField('spell', idx, field, raw); }

function pushExtraDamage(kind, idx, extra) {
  const u = selectedUnit();
  if (!u) return;
  const target = (kind === 'weapon' ? u.weapons : u.spells)[idx];
  if (!target) return;
  if (!isValidDice(extra.die)) {
    addLog(`⚠️ Dado inválido "${escapeHtml(extra.die)}". Use o formato 1d6.`);
    return;
  }
  target.extra = target.extra || [];
  target.extra.push({ name: cleanText(extra.name) || 'Dano extra', die: extra.die.trim().toLowerCase(), bonus: parseInt(extra.bonus, 10) || 0, type: extra.type });
  syncInspectorUI();
}

function addPresetExtraDamage(kind, idx) {
  const preset = RUNE_PRESETS[document.getElementById(`xPreset-${kind}-${idx}`).value];
  if (preset) pushExtraDamage(kind, idx, preset);
}

function addCustomExtraDamage(kind, idx) {
  const key = `${kind}-${idx}`;
  pushExtraDamage(kind, idx, {
    name: document.getElementById(`xName-${key}`).value,
    die: document.getElementById(`xDie-${key}`).value,
    bonus: document.getElementById(`xBonus-${key}`).value,
    type: document.getElementById(`xType-${key}`).value
  });
}

function removeExtraDamage(kind, idx, extraIdx) {
  const u = selectedUnit();
  if (!u) return;
  const target = (kind === 'weapon' ? u.weapons : u.spells)[idx];
  if (!target || !target.extra) return;
  target.extra.splice(extraIdx, 1);
  syncInspectorUI();
}

/* ---------- Resistências, fraquezas e imunidades ---------- */
const DEFENSE_KINDS = {
  resistances: { label: 'Resistência', cls: 'tag-cold', icon: '−' },
  weaknesses: { label: 'Fraqueza', cls: 'tag-fire', icon: '+' },
  immunities: { label: 'Imunidade', cls: 'tag-holy', icon: '∅' }
};

function defenseChipHTML(kind, entry) {
  const text = kind === 'immunities' ? `imune a ${escapeHtml(entry)}` : `${kind === 'resistances' ? 'res.' : 'fraq.'} ${escapeHtml(entry.type)} ${entry.value}`;
  return `<span class="tag ${DEFENSE_KINDS[kind].cls}">${text}</span>`;
}

/** Linhas de defesa na aba Base: lista com remover + formulário de inclusão. */
function renderDefenseEditor(u) {
  const box = document.getElementById('defenseList');
  const rows = [];
  for (const kind of Object.keys(DEFENSE_KINDS)) {
    (u[kind] || []).forEach((entry, idx) => {
      rows.push(`
        <div class="rune-row">
          <span><strong>${DEFENSE_KINDS[kind].label}</strong> · ${kind === 'immunities' ? escapeHtml(entry) : `${escapeHtml(entry.type)} ${entry.value}`}</span>
          <button class="btn btn-sm btn-ghost btn-icon" onclick="removeDefense('${kind}', ${idx})" aria-label="Remover ${DEFENSE_KINDS[kind].label.toLowerCase()}"><svg class="icon"><use href="#i-x"/></svg></button>
        </div>`);
    });
  }
  box.innerHTML = rows.length ? rows.join('') : '<p class="hint">Nenhuma defesa. Dano de qualquer tipo é causado por inteiro.</p>';
  document.getElementById('defenseValueField').classList.toggle('hidden', document.getElementById('defenseKind').value === 'immunities');
}

function addDefenseToSelectedUnit() {
  const u = selectedUnit();
  if (!u) return;
  const kind = document.getElementById('defenseKind').value;
  const type = document.getElementById('defenseType').value;
  const value = parseInt(document.getElementById('defenseValue').value, 10);
  if (!DEFENSE_TYPES.includes(type)) return;
  if (kind === 'immunities') {
    if (!u.immunities.includes(type)) u.immunities.push(type);
  } else {
    if (!(value > 0)) { addLog('⚠️ Informe um valor maior que zero para a defesa.'); return; }
    const existing = u[kind].find(d => d.type === type);
    if (existing) existing.value = value; else u[kind].push({ type, value });
  }
  syncInspectorUI();
  syncCombatUI();
}

function removeDefense(kind, idx) {
  const u = selectedUnit();
  if (!u || !Array.isArray(u[kind])) return;
  u[kind].splice(idx, 1);
  syncInspectorUI();
  syncCombatUI();
}

function setSelectedShieldBonus(bonus) {
  const u = selectedUnit();
  if (!u || !u.sheet) return;
  u.sheet.shieldBonus = bonus;
  if (bonus <= 0) u.shieldRaised = false;
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
  requestRender();
}

function addItemToSelectedUnit() {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  const key = document.getElementById('addItemPresetSelect').value;
  const tpl = ITEM_CATALOG[key];
  if (!tpl) return;
  const existing = u.items.find(i => i.id === tpl.id);
  if (existing) existing.qty += 1;
  else u.items.push({ ...tpl, qty: 1 });
  syncInspectorUI();
}

function removeItemFromUnit(idx) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  u.items.splice(idx, 1);
  syncInspectorUI();
}

function updateSelectedUnitField(field, value) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  u[field] = field === 'name' ? (cleanText(value) || u.name) : value;
  syncInspectorUI();
  requestRender();
}

function modifySelectedHP(delta) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  u.hp = Math.max(0, Math.min(u.maxHp, u.hp + delta));
  syncInspectorUI();
  requestRender();
}

function modifySelectedMaxHP(delta) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  if (u.sheet) u.sheet.ancestryHp = Math.max(1, (u.sheet.ancestryHp || 8) + delta);
  recalculateUnitFromSheet(u, true);
  syncInspectorUI();
  requestRender();
}

function modifySelectedAC(delta) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  if (u.sheet) u.sheet.armorItemBonus = Math.max(0, (u.sheet.armorItemBonus || 0) + delta);
  recalculateUnitFromSheet(u, false);
  syncInspectorUI();
}

function setSelectedUnitMove(meters) {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  u.moveSpeed = meters;
  syncInspectorUI();
  requestRender();
}

function cloneSelectedUnit() {
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  if (!u) return;
  const nbs = getNeighbors(u.col, u.row);
  const free = nbs.find(nb => !STATE.units.some(x => x.col === nb.col && x.row === nb.row)) || { col: 0, row: 0 };
  const copy = JSON.parse(JSON.stringify(u));
  copy.id = 'u_' + Date.now();
  copy.name = u.name + ' II';
  copy.col = free.col;
  copy.row = free.row;
  STATE.units.push(copy);
  STATE.selectedUnitId = copy.id;
  syncInspectorUI();
  requestRender();
}

function deleteSelectedUnit() {
  if (!STATE.selectedUnitId) return;
  STATE.units = STATE.units.filter(u => u.id !== STATE.selectedUnitId);
  STATE.selectedUnitId = STATE.units[0]?.id || null;
  syncInspectorUI();
  requestRender();
}

