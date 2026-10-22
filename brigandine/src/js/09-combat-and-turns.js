/* ============================================================================
   13. THE 5 MAIN COMBAT COMMANDS EXECUTION ENGINE
   (Ação, Movimento, Magias, Itens, Ficha)
   ============================================================================ */
function selectCombatMainMenu(menuKey) {
  STATE.combat.mainMenu = menuKey;

  const buttons = { attack: 'btnCmd1Attack', move: 'btnCmd2Move', magic: 'btnCmd3Magic', items: 'btnCmd4Items', sheet: 'btnCmd5Sheet' };
  const panels = { attack: 'subpanelAttack', move: 'subpanelMove', magic: 'subpanelMagic', items: 'subpanelItems', sheet: 'subpanelSheet' };
  for (const key of Object.keys(buttons)) {
    const btn = document.getElementById(buttons[key]);
    btn.classList.toggle('active', key === menuKey);
    btn.setAttribute('aria-selected', String(key === menuKey));
    document.getElementById(panels[key]).classList.toggle('hidden', key !== menuKey);
  }

  syncCombatUI();
  requestRender();
  // celular: Mover mantém o tabuleiro livre; os outros comandos abrem a folha com as opções
  if (isCompactLayout()) toggleSheet(menuKey !== 'move');
}

function handleCombatBoardClick(cell, clickedUnit) {
  const activeUnit = STATE.units.find(u => u.id === STATE.combat.activeUnitId);
  if (!activeUnit || activeUnit.hp <= 0) return;

  const menu = STATE.combat.mainMenu;

  if (menu === 'attack') {
    if (!clickedUnit || clickedUnit.id === activeUnit.id || clickedUnit.hp <= 0) {
      addLog(`⚠️ [Ação]: Movimento bloqueado. Clique sobre uma peça alvo dentro da área em vermelho claro para atacar.`);
      return;
    }
    const weapon = activeUnit.weapons[STATE.combat.selectedWeaponIdx] || activeUnit.weapons[0];
    if (!weapon) return;

    const validCells = computeCellsInReach(activeUnit.col, activeUnit.row, weapon.reach, false);
    const inRange = validCells.some(c => c.col === clickedUnit.col && c.row === clickedUnit.row);

    if (!inRange) {
      addLog(`⚠️ <strong>${clickedUnit.name}</strong> está fora da área de alcance de <em>${weapon.name}</em> (${weapon.reach <= STATE.grid.cellScale ? 'Apenas Adjacente 1,5m' : weapon.reach + 'm'}).`);
      return;
    }

    if (activeUnit.actions < 1) {
      addLog(`⚠️ <strong>${activeUnit.name}</strong> não possui ações (◆) restantes neste turno para atacar.`);
      return;
    }

    executeWeaponAttackAndDamage(activeUnit, clickedUnit, weapon);
    return;
  }

  if (menu === 'move') {
    if (clickedUnit && clickedUnit.hp > 0) return;
    const reachMap = computeReachableCells(activeUnit);
    const destInfo = reachMap[`${cell.col},${cell.row}`];
    if (!destInfo) return;

    if (!destInfo.canAfford) {
      addLog(`⚠️ Movimento até (${cell.col + 1}, ${cell.row + 1}) requer ${destInfo.actionsNeeded} ações, mas ${activeUnit.name} tem apenas ${activeUnit.actions}◆.`);
      return;
    }

    faceTowardCell(activeUnit, cell.col, cell.row);
    activeUnit.col = cell.col;
    activeUnit.row = cell.row;
    activeUnit.actions = Math.max(0, activeUnit.actions - destInfo.actionsNeeded);
    spawnFloatingText(cell.col, cell.row, `🥾 -${destInfo.actionsNeeded}◆ (${destInfo.meters}m)`, '#86efac');
    addLog(`🥾 <strong>${activeUnit.name}</strong> moveu ${destInfo.meters}m para (${cell.col + 1}, ${cell.row + 1}) gastando <strong>${'◆'.repeat(destInfo.actionsNeeded)} (${destInfo.actionsNeeded} ação/ões)</strong>.`);
    syncCombatUI();
    requestRender();
    return;
  }

  if (menu === 'magic') {
    const spell = activeUnit.spells[STATE.combat.selectedSpellIdx] || activeUnit.spells[0];
    if (!spell) {
      addLog(`⚠️ ${activeUnit.name} não possui magias cadastradas.`);
      return;
    }
    faceTowardCell(activeUnit, cell.col, cell.row);
    executeSpellCastOnCell(activeUnit, spell, cell, clickedUnit, false);
    return;
  }

  if (menu === 'items') {
    const item = activeUnit.items[STATE.combat.selectedItemIdx];
    if (!item || item.qty <= 0) {
      addLog(`⚠️ Nenhum item selecionado ou quantidade esgotada.`);
      return;
    }
    executeItemUseOnCell(activeUnit, item, cell, clickedUnit);
    return;
  }

  if (menu === 'sheet') {
    if (clickedUnit) {
      selectActiveTurnUnit(clickedUnit.id);
    }
  }
}

function executeWeaponAttackAndDamage(attacker, target, weapon) {
  faceTowardCell(attacker, target.col, target.row);
  attacker.actions -= 1;
  const mapPenalty = attacker.strikesMade === 0 ? 0 : (attacker.strikesMade === 1 ? -5 : -10);
  attacker.strikesMade += 1;

  const d20 = Math.floor(Math.random() * 20) + 1;
  const atkTotal = d20 + (weapon.atkBonus || 0) + mapPenalty;
  const dmg = rollDamage(weapon);

  const isCrit = d20 === 20 || atkTotal >= target.ac + 10;
  const isHit = d20 !== 1 && (isCrit || atkTotal >= target.ac);
  const atkInfo = `Acerto ${atkTotal}</strong> [d20=${d20} ${weapon.atkBonus >= 0 ? '+' : ''}${weapon.atkBonus}${mapPenalty < 0 ? ' ' + mapPenalty : ''} vs CA ${target.ac}]`;

  if (isHit) {
    const mult = isCrit ? 2 : 1;
    const applied = applyDefenses(dmg.parts, mult, target);
    const finalDmg = applied.total;
    const defenseNote = describeDefenseEffects(applied.lines);
    target.hp = Math.max(0, target.hp - finalDmg);
    const critTag = isCrit ? 'CRÍTICO 2x! ' : 'ACERTOU! ';
    spawnFloatingText(target.col, target.row, finalDmg === 0 ? (applied.lines.every(l => l.immune) ? '🛡️ IMUNE' : '🛡️ RESISTIU') : `⚔️ ${critTag}-${finalDmg} PV`, finalDmg === 0 ? '#94a3b8' : (isCrit ? '#facc15' : '#fca5a5'));

    const deadText = target.hp === 0 ? ` 💀 <strong style="color:var(--strike)">${target.name} MORTO!</strong>` : ` (PV: ${target.hp}/${target.maxHp})`;
    addLog(`⚔️ <strong>${attacker.name}</strong> atacou <strong>${target.name}</strong> com <em>${weapon.name}</em> (◆): <strong>${atkInfo} → <strong style="color:var(--ok)">${isCrit ? 'CRÍTICO!' : 'ACERTOU!'}</strong> Dano <strong style="color:var(--strike)">${finalDmg}</strong> = ${formatDamageParts(dmg.parts, mult)}${defenseNote ? ` <em>(${defenseNote})</em>` : ''}.${deadText}`);
  } else {
    spawnFloatingText(target.col, target.row, `🛡️ ERROU (${atkTotal} vs CA ${target.ac})`, '#94a3b8');
    addLog(`⚔️ <strong>${attacker.name}</strong> atacou <strong>${target.name}</strong> com <em>${weapon.name}</em> (◆): <strong>${atkInfo} → <strong style="color:var(--text-3)">ERROU!</strong>`);
  }

  syncCombatUI();
  requestRender();
}

/** Erguer Escudo (◆): bônus de CA até o início do próximo turno da peça. */
function raiseShield() {
  const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
  if (!u || u.hp <= 0) return;
  const bonus = shieldBonusOf(u);
  if (bonus <= 0) {
    addLog(`⚠️ <strong>${u.name}</strong> não tem escudo. Defina o bônus do escudo na aba Base da montagem.`);
    return;
  }
  if (u.shieldRaised) {
    addLog(`🛡️ <strong>${u.name}</strong> já está com o escudo erguido.`);
    return;
  }
  if (u.actions < 1) {
    addLog(`⚠️ <strong>${u.name}</strong> não tem ações (◆) para erguer o escudo.`);
    return;
  }
  u.actions -= 1;
  u.shieldRaised = true;
  recalculateUnitFromSheet(u, false);
  spawnFloatingText(u.col, u.row, `🛡️ Escudo +${bonus} CA`, '#9adfff');
  addLog(`🛡️ <strong>${u.name}</strong> ergueu o escudo (◆): <strong style="color:var(--ward)">CA ${u.baseAc} → ${u.ac}</strong> até o início do próximo turno.`);
  syncCombatUI();
  requestRender();
}

function lowerShield(unit) {
  if (!unit || !unit.shieldRaised) return;
  unit.shieldRaised = false;
  recalculateUnitFromSheet(unit, false);
}

function executeSpellCastOnCell(caster, spell, cell, clickedUnit, isFromScroll) {
  const cost = isFromScroll ? 2 : (spell.cost || 2);
  if (caster.actions < cost) {
    addLog(`⚠️ <strong>${caster.name}</strong> precisa de ${cost} ações (${'◆'.repeat(cost)}) para lançar <em>${spell.name}</em>, mas só tem ${caster.actions}◆.`);
    return;
  }

  const validReach = computeCellsInReach(caster.col, caster.row, spell.range, false);
  const inRange = validReach.some(c => c.col === cell.col && c.row === cell.row);
  if (!inRange) {
    addLog(`⚠️ Célula/alvo fora do alcance de <em>${spell.name}</em> (${spell.range <= STATE.grid.cellScale ? 'Toque Adjacente 1,5m' : spell.range + 'm'}). Clique dentro da área vermelha clara.`);
    return;
  }

  let targetUnits = [];
  if (spell.areaType === 'line') {
    const lineRes = computeLineCells(caster.col, caster.row, cell.col, cell.row, spell.areaSize);
    const set = new Set(lineRes.affected.map(c => `${c.col},${c.row}`));
    targetUnits = STATE.units.filter(u => u.hp > 0 && u.id !== caster.id && set.has(`${u.col},${u.row}`));
  } else if (spell.areaType === 'burst') {
    const burstCells = computeBurstCells(cell.col, cell.row, spell.areaSize);
    const set = new Set(burstCells.map(c => `${c.col},${c.row}`));
    targetUnits = STATE.units.filter(u => u.hp > 0 && set.has(`${u.col},${u.row}`));
  } else {
    if (!clickedUnit || clickedUnit.hp <= 0 || clickedUnit.id === caster.id) {
      addLog(`⚠️ Selecione uma peça inimiga válida dentro do alcance em vermelho claro para atacar com <em>${spell.name}</em>.`);
      return;
    }
    targetUnits = [clickedUnit];
  }

  if (targetUnits.length === 0) {
    addLog(`⚠️ Nenhuma peça viva está dentro da área atingida por <em>${spell.name}</em>.`);
    return;
  }

  caster.actions -= cost;
  const dmg = rollDamage(spell);
  const hitSummaries = [];

  for (const t of targetUnits) {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const atkTotal = d20 + (spell.atkBonus || 8);
    const isCrit = d20 === 20 || atkTotal >= t.ac + 10;
    const isHit = d20 !== 1 && (isCrit || atkTotal >= t.ac);

    let multiplier = 0;
    let statusLbl = '';
    if (isCrit) {
      multiplier = 2;
      statusLbl = 'CRÍTICO 2x';
    } else if (isHit) {
      multiplier = 1;
      statusLbl = 'ACERTOU';
    } else if (spell.areaType === 'line' || spell.areaType === 'burst') {
      multiplier = 0.5;
      statusLbl = 'METADE';
    } else {
      statusLbl = 'ERROU';
    }
    const applied = multiplier > 0 ? applyDefenses(dmg.parts, multiplier, t) : { total: 0, lines: [] };
    const dealt = applied.total;
    const defenseNote = describeDefenseEffects(applied.lines);
    if (multiplier > 0 && dealt === 0) statusLbl = applied.lines.every(l => l.immune) ? 'IMUNE' : 'RESISTIU';

    if (dealt > 0) {
      t.hp = Math.max(0, t.hp - dealt);
      spawnFloatingText(t.col, t.row, `✨ ${statusLbl} -${dealt} PV`, '#e9d5ff');
    } else {
      spawnFloatingText(t.col, t.row, multiplier > 0 ? `🛡️ ${statusLbl}` : '🛡️ ERROU', '#94a3b8');
    }

    hitSummaries.push(`<strong>${t.name}</strong> [Acerto ${atkTotal} vs CA ${t.ac}: ${statusLbl} → -${dealt} PV${defenseNote ? ` (${defenseNote})` : ''}${t.hp === 0 ? ' 💀MORTO' : ''}]`);
  }

  addLog(`✨ <strong>${caster.name}</strong> lançou <strong>${spell.name}</strong> (${'◆'.repeat(cost)}) · dano base ${dmg.total} = ${formatDamageParts(dmg.parts)}: ${hitSummaries.join(' | ')}.`);
  syncCombatUI();
  requestRender();
  return true;
}

function executeItemUseOnCell(user, item, cell, clickedUnit) {
  const cost = item.cost || 2;
  if (user.actions < cost) {
    addLog(`⚠️ <strong>${user.name}</strong> precisa de ${cost} ações (◆◆) para usar <em>${item.name}</em>.`);
    return;
  }

  if (item.kind === 'potion') {
    const target = clickedUnit && clickedUnit.hp > 0 ? clickedUnit : null;
    if (!target) {
      addLog(`⚠️ Clique sobre a própria peça ou um aliado no alcance vermelho claro para usar <em>${item.name}</em>.`);
      return;
    }
    const validReach = computeCellsInReach(user.col, user.row, item.range, true);
    const inRange = validReach.some(c => c.col === target.col && c.row === target.row);
    if (!inRange) {
      addLog(`⚠️ ${target.name} está fora do alcance (${item.range}m) para receber <em>${item.name}</em>.`);
      return;
    }

    user.actions -= cost;
    item.qty -= 1;
    const heal = rollDiceExpression(item.dice, item.bonus);
    target.hp = Math.min(target.maxHp, target.hp + heal.total);
    spawnFloatingText(target.col, target.row, `🧪 +${heal.total} PV`, '#4ade80');
    addLog(`🧪 <strong>${user.name}</strong> usou <strong>${item.name}</strong> em <strong>${target.name}</strong> (gastou ◆◆ 2 Ações), curando <strong style="color:#4ade80">+${heal.total} PV</strong> [${item.dice}+${item.bonus}] (PV atual: ${target.hp}/${target.maxHp}).`);
    syncCombatUI();
    requestRender();
  } else if (item.kind === 'scroll_spell') {
    const spell = SPELL_CATALOG[item.spellKey];
    if (spell) {
      const ok = executeSpellCastOnCell(user, spell, cell, clickedUnit, true);
      if (ok) {
        item.qty -= 1;
        syncCombatUI();
      }
    }
  }
}

function useSelectedItemOnSelf() {
  const activeUnit = STATE.units.find(u => u.id === STATE.combat.activeUnitId);
  if (!activeUnit || activeUnit.hp <= 0) return;
  const item = activeUnit.items[STATE.combat.selectedItemIdx];
  if (!item || item.qty <= 0) {
    addLog(`⚠️ Nenhuma poção/item disponível.`);
    return;
  }
  if (item.kind !== 'potion') {
    addLog(`⚠️ Este pergaminho ofensivo deve ser mirado clicando em um alvo/célula na área vermelha do tabuleiro.`);
    return;
  }
  executeItemUseOnCell(activeUnit, item, { col: activeUnit.col, row: activeUnit.row }, activeUnit);
}

/* ============================================================================
   14. TURN & INITIATIVE MANAGEMENT (USING PF2E PERCEPTION FROM SHEET!)
   ============================================================================ */
function sortInitiativeOrder() {
  STATE.units.sort((a, b) => b.initiative - a.initiative);
}

function rollAllInitiatives() {
  for (const u of STATE.units) {
    recalculateUnitFromSheet(u, false);
    const percBonus = u.sheet?.derived?.perception ?? (u.faction === 'hero' ? 7 : 5);
    const d20 = Math.floor(Math.random() * 20) + 1;
    u.initiative = d20 + percBonus;
    u.actions = 3;
    u.reaction = true;
    u.strikesMade = 0;
    lowerShield(u);
  }
  sortInitiativeOrder();
  const firstAlive = STATE.units.find(u => u.hp > 0);
  STATE.combat.activeUnitId = firstAlive ? firstAlive.id : null;
  STATE.selectedUnitId = STATE.combat.activeUnitId;
  addLog(`🎲 Iniciativas (Percepção PF2e) roladas! Primeiro turno: <strong>${firstAlive ? firstAlive.name : '—'}</strong>.`);
  syncCombatUI();
  requestRender();
}

function nextTurn() {
  const alive = STATE.units.filter(u => u.hp > 0);
  if (alive.length === 0) return;
  const idx = alive.findIndex(u => u.id === STATE.combat.activeUnitId);
  let nextIdx = idx + 1;
  if (nextIdx >= alive.length) {
    nextIdx = 0;
    STATE.combat.round += 1;
    addLog(`🔔 <strong>Início da Rodada ${STATE.combat.round}!</strong>`);
  }
  const nextUnit = alive[nextIdx];
  STATE.combat.activeUnitId = nextUnit.id;
  STATE.selectedUnitId = nextUnit.id;
  nextUnit.actions = 3;
  nextUnit.reaction = true;
  nextUnit.strikesMade = 0;
  lowerShield(nextUnit);
  STATE.combat.selectedWeaponIdx = 0;
  STATE.combat.selectedSpellIdx = 0;
  STATE.combat.selectedItemIdx = 0;

  addLog(`▶️ Turno de <strong>${nextUnit.name}</strong> (◆◆◆ 3 Ações e ↺ 1 Reação).`);
  syncCombatUI();
  requestRender();
}

function resetCombatRound() {
  STATE.combat.round = 1;
  for (const u of STATE.units) {
    u.actions = 3;
    u.reaction = true;
    u.strikesMade = 0;
    lowerShield(u);
  }
  const first = STATE.units.find(u => u.hp > 0);
  STATE.combat.activeUnitId = first ? first.id : null;
  syncCombatUI();
  requestRender();
}

function selectActiveTurnUnit(unitId) {
  const u = STATE.units.find(x => x.id === unitId);
  if (!u) return;
  STATE.combat.activeUnitId = u.id;
  STATE.selectedUnitId = u.id;
  STATE.combat.selectedWeaponIdx = 0;
  STATE.combat.selectedSpellIdx = 0;
  STATE.combat.selectedItemIdx = 0;
  syncCombatUI();
  requestRender();
}

function toggleActionPip(pipIndex) {
  const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
  if (!u) return;
  u.actions = (u.actions >= pipIndex) ? pipIndex - 1 : pipIndex;
  syncCombatUI();
  requestRender();
}

function toggleReactionPip() {
  const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
  if (!u) return;
  u.reaction = !u.reaction;
  syncCombatUI();
  requestRender();
}

function spendSingleAction(label) {
  const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
  if (!u || u.actions < 1) {
    addLog(`⚠️ Sem ações disponíveis para ${label}.`);
    return;
  }
  u.actions -= 1;
  addLog(`◆ <strong>${u.name}</strong> executou <strong>${label}</strong>.`);
  syncCombatUI();
  requestRender();
}

function useReactionAction() {
  const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
  if (!u || !u.reaction) {
    addLog(`⚠️ Reação (↺) já foi gasta nesta rodada.`);
    return;
  }
  u.reaction = false;
  addLog(`↺ <strong>${u.name}</strong> utilizou sua <strong>Reação</strong>!`);
  syncCombatUI();
  requestRender();
}

