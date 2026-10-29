/* ============================================================================
   15. PF2E REMASTER CHARACTER SHEET HTML BUILDER (FOR COMBAT & SETUP MODES)
   ============================================================================ */
const PROF_NAMES = { 0: 'Destreinado', 2: 'Treinado', 4: 'Especialista', 6: 'Mestre', 8: 'Lendário' };
const SHEET_TABS = [['attrs', 'Atributos'], ['tests', 'Testes'], ['combat', 'Combate'], ['build', 'Build']];
const ATTR_KEYS = [
  { k: 'FOR', name: 'Força' }, { k: 'DES', name: 'Destreza' }, { k: 'CON', name: 'Constituição' },
  { k: 'INT', name: 'Inteligência' }, { k: 'SAB', name: 'Sabedoria' }, { k: 'CAR', name: 'Carisma' }
];

function signed(n) { return n >= 0 ? `+${n}` : `${n}`; }

/**
 * Ficha PF2e em 4 abas (Atributos, Testes, Combate, Build).
 * `editable` = true na montagem (mostra controles); false no combate (somente leitura + rolagens).
 */
function buildPF2eSheetHTML(unit, editable = false) {
  if (!unit || !unit.sheet) return '';
  recalculateUnitFromSheet(unit, false);
  const s = unit.sheet;
  const d = s.derived;
  const uid = unit.id;
  const tab = STATE.sheetTab;

  const profControl = (field, rank) => editable
    ? `<select class="select-sm" style="width:auto" aria-label="Proficiência" onchange="updateUnitProf('${uid}', '${field}', this.value)">
         ${[0, 2, 4, 6, 8].map(r => `<option value="${r}" ${rank === r ? 'selected' : ''}>${PROF_SHORT[r]} · ${PROF_NAMES[r]}</option>`).join('')}
       </select>`
    : `<span class="prof-pill">${PROF_NAMES[rank]}</span>`;

  const tabsHTML = `<div class="tabs" role="tablist">${SHEET_TABS.map(([k, l]) =>
    `<button class="tab ${tab === k ? 'active' : ''}" role="tab" onclick="setSheetTab('${k}')">${l}</button>`).join('')}</div>`;

  let body = '';

  if (tab === 'attrs') {
    const identity = editable ? `
      <div class="grid-2">
        <div class="field"><label>Ancestralidade</label><input type="text" value="${escapeHtml(s.ancestry)}" onchange="updateUnitSheetMeta('${uid}', 'ancestry', this.value)"></div>
        <div class="field"><label>Classe</label><input type="text" value="${escapeHtml(s.className)}" onchange="updateUnitSheetMeta('${uid}', 'className', this.value)"></div>
      </div>
      <div class="grid-2">
        <div class="field"><label>Nível</label>
          <div class="stepper"><button class="btn btn-sm btn-icon" onclick="adjustUnitLevel('${uid}', -1)" aria-label="Diminuir nível">−</button><strong class="value num">${s.level}</strong><button class="btn btn-sm btn-icon" onclick="adjustUnitLevel('${uid}', 1)" aria-label="Aumentar nível">+</button></div>
        </div>
        <div class="field"><label>Atributo-chave</label>
          <select onchange="updateUnitSheetMeta('${uid}', 'keyAttr', this.value)">${ATTR_KEYS.map(a => `<option value="${a.k}" ${s.keyAttr === a.k ? 'selected' : ''}>${a.k}</option>`).join('')}</select>
        </div>
      </div>` : `<p class="hint"><strong>${escapeHtml(s.ancestry)}</strong> · ${escapeHtml(s.className)} · atributo-chave <strong>${s.keyAttr}</strong></p>`;

    const attrCards = ATTR_KEYS.map(a => {
      const val = s.attrs[a.k] || 0;
      const isKey = s.keyAttr === a.k;
      return `
        <div class="attr-box ${isKey ? 'key' : ''}">
          <div class="attr-box-label">${a.k}${isKey ? ' · chave' : ''}</div>
          <div class="attr-box-val" onclick="rollSheetCheck('${uid}', 'Teste de ${a.name} (${a.k})', ${val})" title="Rolar 1d20${signed(val)}">${signed(val)}</div>
          ${editable ? `<div class="attr-stepper"><button onclick="adjustUnitAttr('${uid}', '${a.k}', -1)" aria-label="Diminuir ${a.name}">−</button><button onclick="adjustUnitAttr('${uid}', '${a.k}', 1)" aria-label="Aumentar ${a.name}">+</button></div>` : ''}
        </div>`;
    }).join('');

    body = `${identity}<div class="attr-grid">${attrCards}</div><p class="hint">Toque no valor para rolar 1d20 + modificador.</p>`;
  }

  if (tab === 'tests') {
    const tests = [
      { f: 'perception', n: 'Percepção', v: d.perception },
      { f: 'fort', n: 'Fortitude', v: d.fort, a: 'CON' },
      { f: 'ref', n: 'Reflexos', v: d.ref, a: 'DES' },
      { f: 'will', n: 'Vontade', v: d.will, a: 'SAB' }
    ];
    body = `<div class="save-grid">${tests.map(t => `
      <div class="save-card" onclick="rollSheetCheck('${uid}', '${t.n}${t.a ? ' (' + t.a + ')' : ''}', ${t.v})" title="Rolar 1d20${signed(t.v)}">
        <span class="save-name">${t.n}</span>
        <span class="save-val num">${signed(t.v)}</span>
        <span class="save-foot" onclick="event.stopPropagation()">${profControl(t.f, s.prof[t.f])}</span>
      </div>`).join('')}</div><p class="hint">Toque em um teste para rolar 1d20.</p>`;
  }

  if (tab === 'combat') {
    const shield = shieldBonusOf(unit);
    body = `<div class="stack">
      <div class="stat-line"><div><div class="stat-val num">CA ${unit.ac}</div><div class="stat-lbl">Armadura +${s.armorItemBonus || 0}${unit.shieldRaised ? ` · escudo erguido +${shield}` : ''}</div></div>${profControl('armor', s.prof.armor)}</div>
      <div class="stat-line"><div><div class="stat-val num">Ataque ${signed(d.weaponAtk)}</div><div class="stat-lbl">Dano corpo a corpo ${signed(d.meleeDmgBonus)}</div></div>${profControl('weapon', s.prof.weapon)}</div>
      <div class="stat-line"><div><div class="stat-val num">Magia ${signed(d.spellAtk)}</div><div class="stat-lbl">CD ${d.spellDC} · chave ${s.keyAttr}</div></div>${profControl('spell', s.prof.spell)}</div>
      <div class="stat-line"><div><div class="stat-val num">Escudo ${shield > 0 ? '+' + shield : '—'}</div><div class="stat-lbl">Bônus de CA ao erguer o escudo</div></div></div>
    </div>`;
  }

  if (tab === 'build') {
    const skills = (s.skills || []).map(k => `<span class="skill-chip">${escapeHtml(k)}</span>`).join('') || '<span class="faint">Nenhuma</span>';
    const feats = (s.feats || []).map(f => `<li>${escapeHtml(f)}</li>`).join('') || '<li class="faint">Nenhum</li>';
    body = `<div class="stack-3">
      <div class="stack"><span class="subtle-title">Perícias treinadas</span><div class="chip-row">${skills}</div></div>
      <div class="stack"><span class="subtle-title">Talentos</span><ul class="hint" style="padding-left:18px;display:flex;flex-direction:column;gap:3px">${feats}</ul></div>
    </div>`;
  }

  return `<div class="stack-3">${tabsHTML}${body}</div>`;
}

function setSheetTab(tab) {
  STATE.sheetTab = tab;
  syncCombatUI();
  syncInspectorUI();
}

function rollSheetCheck(unitId, checkName, bonus) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u) return;
  const d20 = Math.floor(Math.random() * 20) + 1;
  const total = d20 + bonus;
  const sign = bonus >= 0 ? `+${bonus}` : `${bonus}`;
  spawnFloatingText(u.col, u.row, `🎲 ${checkName}: ${total}`, '#fde68a');
  addLog(`📜 <strong>${u.name}</strong> rolou <strong>${checkName}</strong> pela Ficha PF2e: <strong style="color:var(--accent)">${total}</strong> [1d20=${d20} ${sign}].`);
}

function adjustUnitAttr(unitId, attrKey, delta) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u || !u.sheet) return;
  u.sheet.attrs[attrKey] = Math.max(-4, Math.min(8, (u.sheet.attrs[attrKey] || 0) + delta));
  recalculateUnitFromSheet(u, false);
  syncCombatUI();
  syncInspectorUI();
  requestRender();
}

function adjustUnitLevel(unitId, delta) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u || !u.sheet) return;
  u.sheet.level = Math.max(1, Math.min(20, (u.sheet.level || 1) + delta));
  recalculateUnitFromSheet(u, true);
  addLog(`📜 Build de <strong>${u.name}</strong> ajustada para <strong>Nível ${u.sheet.level}</strong> (PV Máx: ${u.maxHp}, CA: ${u.ac}, Ataque: +${u.sheet.derived.weaponAtk}).`);
  syncCombatUI();
  syncInspectorUI();
  requestRender();
}

function updateUnitProf(unitId, field, rankVal) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u || !u.sheet) return;
  u.sheet.prof[field] = parseInt(rankVal, 10);
  recalculateUnitFromSheet(u, false);
  syncCombatUI();
  syncInspectorUI();
  requestRender();
}

function updateUnitSheetMeta(unitId, field, val) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u || !u.sheet) return;
  u.sheet[field] = val;
  recalculateUnitFromSheet(u, false);
  syncCombatUI();
  syncInspectorUI();
}

