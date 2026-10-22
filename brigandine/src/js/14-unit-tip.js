/* ============================================================================
   20. TOOLTIP DO ALVO — defesas e prévia do ataque ao passar o cursor
   ============================================================================ */
const unitTipState = { unitId: null };

function currentAttackSource(activeUnit) {
  if (STATE.combat.mainMenu === 'attack') {
    const w = activeUnit.weapons[STATE.combat.selectedWeaponIdx] || activeUnit.weapons[0];
    return w ? { kind: 'weapon', src: w } : null;
  }
  if (STATE.combat.mainMenu === 'magic') {
    const sp = activeUnit.spells[STATE.combat.selectedSpellIdx] || activeUnit.spells[0];
    return sp ? { kind: 'spell', src: sp } : null;
  }
  return null;
}

/** Linha da prévia: quanto dano médio sobra depois das defesas do alvo. */
function buildAttackPreviewHTML(attacker, target, source) {
  const { kind, src } = source;
  const map = kind === 'weapon' ? (attacker.strikesMade === 0 ? 0 : (attacker.strikesMade === 1 ? -5 : -10)) : 0;
  const toHit = (src.atkBonus || 0) + map;
  const odds = attackOdds(toHit, target.ac);
  const avg = averageDamage(src);
  const normal = applyDefenses(avg.parts, 1, target);
  const crit = applyDefenses(avg.parts, 2, target);
  const notes = describeDefenseEffects(normal.lines);
  const pct = (p) => `${Math.round(p * 100)}%`;
  const verdict = normal.total === 0 ? '<span class="tip-bad">sem dano</span>'
    : normal.total > avg.total ? '<span class="tip-good">dano maior</span>'
      : normal.total < avg.total ? '<span class="tip-warn">dano reduzido</span>' : '';
  return `
    <div class="tip-sep"></div>
    <div class="tip-title">${escapeHtml(src.name)} <span class="faint">${signed(toHit)}${map ? ` (MAP ${map})` : ''}</span></div>
    <div class="tip-grid">
      <span>Acerto</span><b class="num">${pct(odds.hit)}</b>
      <span>Crítico</span><b class="num">${pct(odds.crit)}</b>
      <span>Dano médio</span><b class="num">${normal.total}${normal.total !== avg.total ? ` <small class="faint">de ${avg.total}</small>` : ''}</b>
      <span>No crítico</span><b class="num">${crit.total}</b>
    </div>
    ${notes ? `<div class="tip-note">${escapeHtml(notes)}</div>` : ''}
    ${verdict ? `<div class="tip-note">${verdict}</div>` : ''}
    ${kind === 'spell' && src.areaType !== 'single' ? '<div class="tip-note faint">Em área: metade do dano se errar.</div>' : ''}`;
}

function buildUnitTipHTML(unit) {
  recalculateUnitFromSheet(unit, false);
  const chips = ['resistances', 'weaknesses'].flatMap(k => (unit[k] || []).map(e => defenseChipHTML(k, e)))
    .concat((unit.immunities || []).map(e => defenseChipHTML('immunities', e))).join('');
  const hpPct = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
  const level = hpPct > 50 ? 'high' : (hpPct > 25 ? 'mid' : 'low');

  let preview = '';
  const attacker = STATE.mode === 'combat' ? STATE.units.find(u => u.id === STATE.combat.activeUnitId) : null;
  if (attacker && attacker.id !== unit.id && unit.hp > 0 && attacker.hp > 0) {
    const source = currentAttackSource(attacker);
    if (source) preview = buildAttackPreviewHTML(attacker, unit, source);
  }

  return `
    <div class="tip-head">
      <strong>${escapeHtml(unit.name)}</strong>
      <span class="badge ${unit.faction === 'hero' ? 'badge-hero' : 'badge-villain'}">${unit.faction === 'hero' ? 'HERÓI' : 'VILÃO'}</span>
    </div>
    <div class="tip-stats">
      <span class="num"><b>${unit.hp}</b>/${unit.maxHp} PV</span>
      <span class="ac-shield ${unit.shieldRaised ? 'raised' : ''}"><svg class="icon"><use href="#i-shield"/></svg>CA <span class="num">${unit.ac}</span></span>
    </div>
    <div class="hp-bar-outer"><div class="hp-bar-inner" data-level="${level}" style="width:${hpPct}%"></div></div>
    <div class="chip-row">${chips || '<span class="faint">Sem resistências, fraquezas ou imunidades</span>'}</div>
    ${preview}`;
}

function hideUnitTip() {
  unitTipState.unitId = null;
  const tip = document.getElementById('unitTip');
  if (tip) tip.classList.add('hidden');
}

/** Mostra o tooltip da peça sob o cursor (ou esconde). `e` é o evento de ponteiro do canvas. */
function updateUnitTip(e, cell) {
  const tip = document.getElementById('unitTip');
  if (!tip) return;
  const interacting = STATE.interaction.isPanning || STATE.interaction.draggingUnitId || STATE.interaction.paintingTerrain
    || (STATE.ruler.active && STATE.ruler.startCell);
  const unit = cell && !interacting
    ? (STATE.units.find(u => u.col === cell.col && u.row === cell.row && u.hp > 0) || STATE.units.find(u => u.col === cell.col && u.row === cell.row))
    : null;
  if (!unit) { hideUnitTip(); return; }

  // reconstrói só quando a peça muda ou o contexto de ataque mudou (evita reflow a cada pixel)
  const sig = [unit.id, unit.hp, unit.ac, STATE.mode, STATE.combat.mainMenu, STATE.combat.selectedWeaponIdx, STATE.combat.selectedSpellIdx, STATE.combat.activeUnitId, (STATE.units.find(u => u.id === STATE.combat.activeUnitId) || {}).strikesMade].join('|');
  if (tip.dataset.sig !== sig) {
    tip.innerHTML = buildUnitTipHTML(unit);
    tip.dataset.sig = sig;
  }
  unitTipState.unitId = unit.id;
  tip.classList.remove('hidden');

  const stage = tip.parentElement.getBoundingClientRect();
  const margin = 14;
  let x = e.clientX - stage.left + margin;
  let y = e.clientY - stage.top + margin;
  if (x + tip.offsetWidth > stage.width - 8) x = e.clientX - stage.left - tip.offsetWidth - margin;
  if (y + tip.offsetHeight > stage.height - 8) y = Math.max(8, stage.height - tip.offsetHeight - 8);
  tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
}
