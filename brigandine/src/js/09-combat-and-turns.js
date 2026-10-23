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
    const from = { col: activeUnit.col, row: activeUnit.row };
    activeUnit.col = cell.col;
    activeUnit.row = cell.row;
    startUnitWalk(activeUnit, from.col, from.row);
    activeUnit.actions = Math.max(0, activeUnit.actions - destInfo.actionsNeeded);
    spawnFloatingText(cell.col, cell.row, `🥾 -${destInfo.actionsNeeded}◆ (${destInfo.meters}m)`, '#86efac');
    addLog(`🥾 <strong>${activeUnit.name}</strong> moveu ${destInfo.meters}m para (${cell.col + 1}, ${cell.row + 1}) gastando <strong>${'◆'.repeat(destInfo.actionsNeeded)} (${destInfo.actionsNeeded} ação/ões)</strong>.`);
    applyHazardAt(activeUnit);
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

/**
 * Teste simples por luz (PF2e): CD 5 se o alvo está oculto (penumbra), CD 11 se escondido (escuridão).
 * Falhou: o ataque/efeito não atinge esse alvo. Devolve true se pode seguir.
 */
function passFlatCheck(attacker, target, sight, what) {
  if (!sight.dc) return true;
  const roll = Math.floor(Math.random() * 20) + 1;
  const ok = roll >= sight.dc;
  const why = sight.vis === 'hidden' ? 'escondido na escuridão' : 'oculto na penumbra';
  if (!ok) {
    spawnFloatingText(target.col, target.row, `🌑 ERROU (teste simples ${roll} < ${sight.dc})`, '#94a3b8');
    addLog(`🌑 <strong>${escapeHtml(attacker.name)}</strong> mirou <strong>${escapeHtml(target.name)}</strong> (${why}) com <em>${escapeHtml(what)}</em>: teste simples ${roll} contra CD ${sight.dc} — <strong>falhou, não atinge</strong>.`);
  } else {
    addLog(`🌘 ${escapeHtml(target.name)} está ${why}: teste simples ${roll} contra CD ${sight.dc} — passou.`);
  }
  return ok;
}

/** Golpe com arma: as regras resolvem na hora; a animação (07d) mostra o resultado. */
function executeWeaponAttackAndDamage(attacker, target, weapon) {
  return withAnimation(() => resolveWeaponAttack(attacker, target, weapon));
}

function resolveWeaponAttack(attacker, target, weapon) {
  const anim = (hit, crit) => setAnimSpec({ kind: weaponAnimKind(weapon), family: 'weapon', from: attacker, targets: [{ unit: target, hit }], crit, color: damageAnimColor(weapon.dmgType) });
  faceTowardCell(attacker, target.col, target.row);
  attacker.actions -= 1;
  const mapPenalty = attacker.strikesMade === 0 ? 0 : (attacker.strikesMade === 1 ? -5 : -10);
  attacker.strikesMade += 1;

  // luz e visão (PF2e): alvo oculto/escondido exige teste simples; atacante escondido deixa o alvo desprevenido
  const sight = visibilityBetween(attacker, target);
  if (!passFlatCheck(attacker, target, sight, weapon.name)) { anim(false, false); syncCombatUI(); requestRender(); return; }
  const ac = target.ac - (sight.observerHidden ? 2 : 0);

  const d20 = Math.floor(Math.random() * 20) + 1;
  const atkTotal = d20 + (weapon.atkBonus || 0) + mapPenalty;
  const dmg = rollDamage(weapon);

  const isCrit = d20 === 20 || atkTotal >= ac + 10;
  const isHit = d20 !== 1 && (isCrit || atkTotal >= ac);
  const atkInfo = `Acerto ${atkTotal}</strong> [d20=${d20} ${weapon.atkBonus >= 0 ? '+' : ''}${weapon.atkBonus}${mapPenalty < 0 ? ' ' + mapPenalty : ''} vs CA ${ac}${sight.observerHidden ? ' (desprevenido −2: atacante na escuridão)' : ''}]`;

  anim(isHit, isHit && isCrit);
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
  return withAnimation(raiseShieldNow);
}

function raiseShieldNow() {
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
  setAnimSpec({ kind: 'shield', family: 'item', from: u, targets: [{ unit: u, hit: true }], color: '#9adfff' });
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
  return withAnimation(() => resolveSpellCast(caster, spell, cell, clickedUnit, isFromScroll));
}

/** Pede a animação da magia: linha vai até a última casa; explosão usa centro e raio da área. */
function spellAnimSpec(caster, spell, cell, areaCells, targets, crit, fromScroll = false) {
  const kind = spellAnimKind(spell);
  const spec = { kind, family: 'spell', from: caster, targets, crit, color: damageAnimColor(spell.dmgType), areaCells, scroll: fromScroll };
  if (spell.areaType === 'line') {
    const far = areaCells.reduce((best, c) => (cellDistanceMeters(caster.col, caster.row, c.col, c.row) > cellDistanceMeters(caster.col, caster.row, best.col, best.row) ? c : best), cell);
    spec.endCell = { col: far.col, row: far.row };
  } else if (spell.areaType === 'burst') {
    spec.endCell = { col: cell.col, row: cell.row };
    spec.areaCenter = { col: cell.col, row: cell.row };
    spec.areaRadius = (spell.areaSize || 0) / (STATE.grid.cellScale || 1.5);
  }
  setAnimSpec(spec);
}

function resolveSpellCast(caster, spell, cell, clickedUnit, isFromScroll) {
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
  let areaCells = [cell];
  if (spell.areaType === 'line') {
    const lineRes = computeLineCells(caster.col, caster.row, cell.col, cell.row, spell.areaSize);
    areaCells = lineRes.affected;
    const set = new Set(lineRes.affected.map(c => `${c.col},${c.row}`));
    targetUnits = STATE.units.filter(u => u.hp > 0 && u.id !== caster.id && set.has(`${u.col},${u.row}`));
  } else if (spell.areaType === 'burst') {
    const burstCells = computeBurstCells(cell.col, cell.row, spell.areaSize);
    areaCells = burstCells;
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
  const isArea = spell.areaType === 'line' || spell.areaType === 'burst';
  const darkMap = computeDarknessMap();
  // alvo único em penumbra/escuridão: teste simples (áreas não fazem)
  if (!isArea) {
    const sight = visibilityBetween(caster, targetUnits[0], darkMap);
    if (!passFlatCheck(caster, targetUnits[0], sight, spell.name)) {
      spellAnimSpec(caster, spell, cell, areaCells, [{ unit: targetUnits[0], hit: false }], false, isFromScroll);
      addSpellFlash(spell, areaCells);
      syncCombatUI();
      requestRender();
      return true;
    }
  }
  const dmg = rollDamage(spell);
  const hitSummaries = [];
  const animTargets = [];
  let anyCrit = false;

  for (const t of targetUnits) {
    const offGuard = visibilityBetween(caster, t, darkMap).observerHidden;
    const ac = t.ac - (offGuard ? 2 : 0);
    const d20 = Math.floor(Math.random() * 20) + 1;
    const atkTotal = d20 + (spell.atkBonus || 8);
    const isCrit = d20 === 20 || atkTotal >= ac + 10;
    const isHit = d20 !== 1 && (isCrit || atkTotal >= ac);

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
    animTargets.push({ unit: t, hit: multiplier > 0 });
    if (isCrit) anyCrit = true;
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

    hitSummaries.push(`<strong>${t.name}</strong> [Acerto ${atkTotal} vs CA ${ac}${offGuard ? ' desprevenido' : ''}: ${statusLbl} → -${dealt} PV${defenseNote ? ` (${defenseNote})` : ''}${t.hp === 0 ? ' 💀MORTO' : ''}]`);
  }

  spellAnimSpec(caster, spell, cell, areaCells, animTargets, anyCrit, isFromScroll);
  addLog(`✨ <strong>${caster.name}</strong> lançou <strong>${spell.name}</strong> (${'◆'.repeat(cost)}) · dano base ${dmg.total} = ${formatDamageParts(dmg.parts)}: ${hitSummaries.join(' | ')}.`);
  if (spell.flash) {
    addSpellFlash(spell, areaCells);
    addLog(`💥 O clarão de <em>${escapeHtml(spell.name)}</em> ilumina a área até o fim da rodada.`);
  }
  syncCombatUI();
  requestRender();
  return true;
}

/**
 * Acende (gasta ◆ no combate) ou apaga (sem custo) um item de luz da peça. Fica aceso
 * até o usuário apagar; a luz segue a peça e, na lanterna, a direção dela.
 */
function toggleLightItem(unit, idx, inCombat) {
  return withAnimation(() => toggleLightItemNow(unit, idx, inCombat));
}

function toggleLightItemNow(unit, idx, inCombat) {
  const item = unit && unit.items[idx];
  const light = itemLight(item);
  if (!light) return false;
  if (item.lit) {
    item.lit = false;
    addLog(`🕯️ <strong>${escapeHtml(unit.name)}</strong> apagou <em>${escapeHtml(item.name)}</em>.`);
  } else {
    const cost = item.cost || 1;
    if (inCombat) {
      if (unit.actions < cost) {
        addLog(`⚠️ <strong>${escapeHtml(unit.name)}</strong> precisa de ${'◆'.repeat(cost)} para acender <em>${escapeHtml(item.name)}</em>.`);
        return false;
      }
      unit.actions -= cost;
    }
    item.lit = true;
    setAnimSpec({ kind: 'light', family: 'item', from: unit, targets: [{ unit, hit: true }], color: '#fbbf24' });
    const shape = light.shape === 'cone' ? `cone de ${String(light.bright).replace('.', ',')} m para onde a peça olha` : `${String(light.bright).replace('.', ',')} m ao redor`;
    addLog(`🔥 <strong>${escapeHtml(unit.name)}</strong> acendeu <em>${escapeHtml(item.name)}</em>${inCombat ? ` (${'◆'.repeat(cost)})` : ''}: luz plena ${shape}, penumbra até ${String(light.dim).replace('.', ',')} m. Fica acesa até ser apagada.`);
  }
  if (STATE.mode === 'combat') syncCombatUI(); else syncInspectorUI();
  requestRender();
  return true;
}

/** Perigo na casa onde a peça terminou o movimento: rola o dano (com defesas). */
function applyHazardAt(unit) {
  return withAnimation(() => applyHazardAtNow(unit));
}

function applyHazardAtNow(unit) {
  const hz = (STATE.objects || []).find(o => o.col === unit.col && o.row === unit.row && HAZARD_TYPES[o.type]);
  if (!hz || unit.hp <= 0) return;
  const def = envHazardDamage(hz);
  const dmg = rollDamage({ name: def.label, dmgDie: def.dmgDie, dmgType: def.dmgType });
  const applied = applyDefenses(dmg.parts, 1, unit);
  unit.hp = Math.max(0, unit.hp - applied.total);
  setAnimSpec({ kind: 'hazard', family: 'item', from: unit, targets: [{ unit, hit: applied.total > 0 }], color: damageAnimColor(def.dmgType) });
  const note = describeDefenseEffects(applied.lines);
  spawnFloatingText(unit.col, unit.row, applied.total ? `⚠️ -${applied.total} PV` : '🛡️ RESISTIU', applied.total ? '#fca5a5' : '#94a3b8');
  addLog(`⚠️ <strong>${escapeHtml(unit.name)}</strong> parou em <em>${escapeHtml(def.label)}</em> e sofreu <strong style="color:var(--strike)">${applied.total}</strong> de dano (${formatDamageParts(dmg.parts, 1)})${note ? ` <em>(${note})</em>` : ''}.${unit.hp === 0 ? ` 💀 <strong style="color:var(--strike)">${escapeHtml(unit.name)} MORTO!</strong>` : ` (PV: ${unit.hp}/${unit.maxHp})`}`);
}

function executeItemUseOnCell(user, item, cell, clickedUnit) {
  return withAnimation(() => useItemOnCellNow(user, item, cell, clickedUnit));
}

function useItemOnCellNow(user, item, cell, clickedUnit) {
  if (item.kind === 'light') {
    toggleLightItem(user, user.items.indexOf(item), true);
    return;
  }
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
    setAnimSpec({ kind: 'heal', family: 'item', from: user, targets: [{ unit: target, hit: true }], color: '#4ade80' });
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
  if (item.kind === 'light') {
    toggleLightItem(activeUnit, STATE.combat.selectedItemIdx, true);
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
  const darkMap = computeDarknessMap();
  const blinded = [];
  for (const u of STATE.units) {
    recalculateUnitFromSheet(u, false);
    const percBonus = u.sheet?.derived?.perception ?? (u.faction === 'hero' ? 7 : 5);
    const d20 = Math.floor(Math.random() * 20) + 1;
    // cego na escuridão: −4 de estado em Percepção (iniciativa usa Percepção)
    const blind = u.hp > 0 && isBlindedBy(cellLightLevel(u.col, u.row, darkMap), unitVision(u));
    if (blind) blinded.push(u.name);
    u.initiative = d20 + percBonus - (blind ? 4 : 0);
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
  if (blinded.length) addLog(`🌑 Cegos na escuridão (−4 na iniciativa): ${blinded.map(escapeHtml).join(', ')}.`);
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
    expireSpellFlashes(STATE.combat.round);
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

