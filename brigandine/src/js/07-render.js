/* ============================================================================
   11. CANVAS RENDERING PIPELINE (WITH 50%, 25%, 10% GREEN MOVEMENT OPACITY)
   ============================================================================ */
let renderQueued = false;
function requestRender() {
  if (!renderQueued) {
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderBoard();
    });
  }
}

function drawPolygonCell(col, row) {
  const center = getCellPixelCenter(col, row);
  const s = STATE.camera.basePx * STATE.camera.zoom;
  ctx.beginPath();
  if (STATE.grid.type === 'square') {
    ctx.rect(center.x - s / 2, center.y - s / 2, s, s);
  } else {
    const radius = s * 0.56;
    for (let i = 0; i < 6; i++) {
      const ang = (Math.PI / 180) * (60 * i - 30);
      const vx = center.x + radius * Math.cos(ang);
      const vy = center.y + radius * Math.sin(ang);
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
  }
}

function renderBoard() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const firstCenter = getCellPixelCenter(0, 0);
  const lastCenter = getCellPixelCenter(STATE.grid.cols - 1, STATE.grid.rows - 1);
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const boardX = firstCenter.x - s * 0.6;
  const boardY = firstCenter.y - s * 0.6;
  const boardW = (lastCenter.x - firstCenter.x) + s * 1.2;
  const boardH = (lastCenter.y - firstCenter.y) + s * 1.2;

  // 1. Draw Background Map
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(boardX, boardY, boardW, boardH, 10);
  ctx.clip();
  if (bgImageObj) {
    ctx.drawImage(bgImageObj, boardX, boardY, boardW, boardH);
  } else {
    drawProceduralMap(boardX, boardY, boardW, boardH);
  }
  ctx.restore();
  if (!bgImageObj && STATE.grid.proceduralTheme === 'parchment') {
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#3b2a1c';
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardW, boardH, 10);
    ctx.stroke();
    ctx.restore();
  }

  const activeUnit = STATE.mode === 'combat'
    ? STATE.units.find(u => u.id === STATE.combat.activeUnitId)
    : null;

  // 2. Compute Overlays Based on the 5 Main Combat Buttons
  let reachableMap = {};
  let redRangeSet = new Set();
  let aoePreviewSet = new Set();
  let aoeLineVector = null;

  if (STATE.mode === 'combat' && activeUnit && activeUnit.hp > 0) {
    const menu = STATE.combat.mainMenu;

    if (menu === 'move') {
      reachableMap = computeReachableCells(activeUnit);
    } else if (menu === 'attack') {
      const weapon = activeUnit.weapons[STATE.combat.selectedWeaponIdx] || activeUnit.weapons[0];
      if (weapon) {
        const reachCells = computeCellsInReach(activeUnit.col, activeUnit.row, weapon.reach, false);
        reachCells.forEach(c => redRangeSet.add(`${c.col},${c.row}`));
      }
    } else if (menu === 'magic') {
      const spell = activeUnit.spells[STATE.combat.selectedSpellIdx] || activeUnit.spells[0];
      if (spell) {
        const reachCells = computeCellsInReach(activeUnit.col, activeUnit.row, spell.range, false);
        reachCells.forEach(c => redRangeSet.add(`${c.col},${c.row}`));

        const hc = STATE.interaction.hoverCell;
        if (hc && redRangeSet.has(`${hc.col},${hc.row}`)) {
          if (spell.areaType === 'line') {
            const lineRes = computeLineCells(activeUnit.col, activeUnit.row, hc.col, hc.row, spell.areaSize);
            lineRes.affected.forEach(c => aoePreviewSet.add(`${c.col},${c.row}`));
            aoeLineVector = { angleRad: lineRes.angleRad, lengthMeters: spell.areaSize };
          } else if (spell.areaType === 'burst') {
            const burstCells = computeBurstCells(hc.col, hc.row, spell.areaSize);
            burstCells.forEach(c => aoePreviewSet.add(`${c.col},${c.row}`));
          } else {
            aoePreviewSet.add(`${hc.col},${hc.row}`);
          }
        }
      }
    } else if (menu === 'items') {
      const item = activeUnit.items[STATE.combat.selectedItemIdx];
      if (item && item.qty > 0) {
        if (item.kind === 'potion') {
          const reachCells = computeCellsInReach(activeUnit.col, activeUnit.row, item.range, true);
          reachCells.forEach(c => redRangeSet.add(`${c.col},${c.row}`));
        } else if (item.kind === 'scroll_spell') {
          const spell = SPELL_CATALOG[item.spellKey];
          if (spell) {
            const reachCells = computeCellsInReach(activeUnit.col, activeUnit.row, spell.range, false);
            reachCells.forEach(c => redRangeSet.add(`${c.col},${c.row}`));
            const hc = STATE.interaction.hoverCell;
            if (hc && redRangeSet.has(`${hc.col},${hc.row}`)) {
              if (spell.areaType === 'line') {
                const lineRes = computeLineCells(activeUnit.col, activeUnit.row, hc.col, hc.row, spell.areaSize);
                lineRes.affected.forEach(c => aoePreviewSet.add(`${c.col},${c.row}`));
                aoeLineVector = { angleRad: lineRes.angleRad, lengthMeters: spell.areaSize };
              } else if (spell.areaType === 'burst') {
                const burstCells = computeBurstCells(hc.col, hc.row, spell.areaSize);
                burstCells.forEach(c => aoePreviewSet.add(`${c.col},${c.row}`));
              }
            }
          }
        }
      }
    }
  }

  // 3. Draw Grid Cells
  for (let r = 0; r < STATE.grid.rows; r++) {
    for (let c = 0; c < STATE.grid.cols; c++) {
      const key = `${c},${r}`;
      const terrain = STATE.terrainMap[key];

      drawPolygonCell(c, r);

      if (terrain === 'difficult') {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.36)';
        ctx.fill();
      } else if (terrain === 'wall') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fill();
      } else if (terrain === 'hazard') {
        ctx.fillStyle = 'rgba(220, 38, 38, 0.38)';
        ctx.fill();
      }

      // [MOVIMENTO]: Exact 50%, 25% and 10% translucent green scale requested!
      const reach = reachableMap[key];
      if (reach) {
        if (reach.actionsNeeded === 1) {
          // 1st Movement: Dark Green at 50% opacity (0.50)
          ctx.fillStyle = reach.canAfford ? 'rgba(21, 128, 61, 0.50)' : 'rgba(100, 116, 139, 0.15)';
        } else if (reach.actionsNeeded === 2) {
          // 2nd Movement: Medium Green at 25% opacity (0.25)
          ctx.fillStyle = reach.canAfford ? 'rgba(34, 197, 94, 0.25)' : 'rgba(100, 116, 139, 0.09)';
        } else {
          // 3rd Movement: Light Green at 10% opacity (0.10)
          ctx.fillStyle = reach.canAfford ? 'rgba(134, 239, 172, 0.10)' : 'rgba(100, 116, 139, 0.05)';
        }
        ctx.fill();
      }

      // [AÇÃO, MAGIAS, ITENS]: Light Red Reach Area ("vermelho claro")
      if (redRangeSet.has(key)) {
        ctx.fillStyle = 'rgba(248, 113, 113, 0.30)';
        ctx.fill();
      }

      // AoE Spell Impact Highlight
      if (aoePreviewSet.has(key)) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.56)';
        ctx.fill();
      }

      const onParchment = !bgImageObj && STATE.grid.proceduralTheme === 'parchment';
      ctx.strokeStyle = redRangeSet.has(key)
        ? (onParchment ? 'rgba(178, 58, 48, 0.8)' : 'rgba(252, 165, 165, 0.55)')
        : (onParchment ? `rgba(84, 56, 28, ${STATE.grid.alpha * 0.75})` : `rgba(203, 213, 225, ${STATE.grid.alpha * 0.40})`);
      ctx.lineWidth = aoePreviewSet.has(key) ? 2 : 1;
      ctx.stroke();

      if (reach && STATE.interaction.hoverCell && STATE.interaction.hoverCell.col === c && STATE.interaction.hoverCell.row === r) {
        const center = getCellPixelCenter(c, r);
        ctx.fillStyle = '#090d14';
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(center.x - 28, center.y - 12, 56, 24, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dcfce7';
        ctx.font = 'bold 11px Figtree, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${'◆'.repeat(reach.actionsNeeded)} ${reach.meters}m`, center.x, center.y);
      }
    }
  }

  // Draw Directional Vector Line for Relâmpago (9m Line)
  if (aoeLineVector && activeUnit) {
    const origPx = getCellPixelCenter(activeUnit.col, activeUnit.row);
    const lenPx = (aoeLineVector.lengthMeters / STATE.grid.cellScale) * s;
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(origPx.x, origPx.y);
    ctx.lineTo(origPx.x + Math.cos(aoeLineVector.angleRad) * lenPx, origPx.y + Math.sin(aoeLineVector.angleRad) * lenPx);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Draw Hover Cell Outline
  if (STATE.interaction.hoverCell) {
    drawPolygonCell(STATE.interaction.hoverCell.col, STATE.interaction.hoverCell.row);
    ctx.strokeStyle = STATE.mode === 'setup' ? '#e6b95f' : '#5ccbff';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // 5. Draw 256x256 Tokens on Grid
  const sortedUnits = [...STATE.units].sort((a, b) => (a.hp > 0 ? 1 : 0) - (b.hp > 0 ? 1 : 0));
  for (const unit of sortedUnits) {
    const uKey = `${unit.col},${unit.row}`;
    const isTargetable = STATE.mode === 'combat' &&
      activeUnit &&
      unit.hp > 0 &&
      (redRangeSet.has(uKey) || aoePreviewSet.has(uKey)) &&
      (STATE.combat.mainMenu === 'items' || unit.id !== activeUnit.id);

    drawUnitToken(unit, isTargetable);
  }

  // 6. Draw Free Ruler
  if (STATE.ruler.active && STATE.ruler.startCell && STATE.ruler.endCell) {
    const p1 = getCellPixelCenter(STATE.ruler.startCell.col, STATE.ruler.startCell.row);
    const p2 = getCellPixelCenter(STATE.ruler.endCell.col, STATE.ruler.endCell.row);
    const distM = cellDistanceMeters(STATE.ruler.startCell.col, STATE.ruler.startCell.row, STATE.ruler.endCell.col, STATE.ruler.endCell.row);
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2;
    ctx.setLineDash([]);
    ctx.fillStyle = '#090d14';
    ctx.beginPath();
    ctx.roundRect(mx - 36, my - 13, 72, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px Figtree, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`📏 ${distM}m`, mx, my);
    ctx.restore();
  }

  // 7. Draw Floating Combat Roll Popups
  for (let i = STATE.floatingTexts.length - 1; i >= 0; i--) {
    const ft = STATE.floatingTexts[i];
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = '900 13px Figtree, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function spawnFloatingText(col, row, text, color = '#fca5a5') {
  const center = getCellPixelCenter(col, row);
  const ft = { x: center.x, y: center.y - 18, text, color, alpha: 1.0 };
  STATE.floatingTexts.push(ft);
  const interval = setInterval(() => {
    ft.y -= 1.5;
    ft.alpha -= 0.04;
    requestRender();
    if (ft.alpha <= 0) {
      clearInterval(interval);
      STATE.floatingTexts = STATE.floatingTexts.filter(x => x !== ft);
      requestRender();
    }
  }, 30);
}

function drawProceduralMap(x, y, w, h) {
  const theme = STATE.grid.proceduralTheme;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  if (theme === 'parchment') {
    grad.addColorStop(0, '#e0cb9c');
    grad.addColorStop(0.5, '#d2ba88');
    grad.addColorStop(1, '#c4a870');
  } else if (theme === 'river') {
    grad.addColorStop(0, '#122219');
    grad.addColorStop(0.5, '#192f23');
    grad.addColorStop(1, '#0f2027');
  } else if (theme === 'dungeon') {
    grad.addColorStop(0, '#18181b');
    grad.addColorStop(0.5, '#27272a');
    grad.addColorStop(1, '#09090b');
  } else if (theme === 'throne') {
    grad.addColorStop(0, '#2b1419');
    grad.addColorStop(0.5, '#3b1922');
    grad.addColorStop(1, '#1a1118');
  } else {
    grad.addColorStop(0, '#1a102b');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#090612');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  if (theme === 'parchment') {
    // manchas e bordas queimadas de papel envelhecido
    const stain = ctx.createRadialGradient(x + w * 0.3, y + h * 0.35, 0, x + w * 0.3, y + h * 0.35, Math.max(w, h) * 0.5);
    stain.addColorStop(0, 'rgba(150, 100, 50, 0.14)');
    stain.addColorStop(1, 'rgba(150, 100, 50, 0)');
    ctx.fillStyle = stain;
    ctx.fillRect(x, y, w, h);
    const burn = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    burn.addColorStop(0, 'rgba(90, 55, 20, 0)');
    burn.addColorStop(1, 'rgba(90, 55, 20, 0.45)');
    ctx.fillStyle = burn;
    ctx.fillRect(x, y, w, h);
  }
}

function drawUnitToken(unit, isTargetable) {
  const center = getCellPixelCenter(unit.col, unit.row);
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const tokenR = s * 0.46;
  const isSelected = unit.id === STATE.selectedUnitId;
  const isActiveTurn = STATE.mode === 'combat' && unit.id === STATE.combat.activeUnitId;
  const isDead = unit.hp <= 0;

  ctx.save();

  if (isTargetable && !isDead) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, tokenR + 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (isActiveTurn) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, tokenR + 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#5ccbff';
    ctx.lineWidth = 3.2;
    ctx.stroke();
  } else if (isSelected && STATE.mode === 'setup') {
    ctx.beginPath();
    ctx.arc(center.x, center.y, tokenR + 3.5, 0, Math.PI * 2);
    ctx.strokeStyle = '#e6b95f';
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }

  if (unit.shieldRaised && !isDead) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, tokenR + 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(154, 223, 255, 0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const img = getUnitTokenImage(unit.sculpt, unit.customTokenDataUrl, customTokenOptions(unit));
  if (img && img.complete) {
    if (isDead) ctx.filter = 'grayscale(100%) brightness(38%)';
    ctx.drawImage(img, center.x - tokenR, center.y - tokenR, tokenR * 2, tokenR * 2);
    ctx.filter = 'none';
  }

  if (isDead) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, tokenR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(185, 28, 28, 0.96)';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(center.x - tokenR * 0.92, center.y - 8, tokenR * 1.84, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(9, Math.floor(s * 0.17))}px Figtree, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MORTO', center.x, center.y);
  } else {
    const barW = tokenR * 1.55;
    const barH = 5;
    const barX = center.x - barW / 2;
    const barY = center.y + tokenR - 3;

    ctx.fillStyle = '#090d14';
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = Math.max(0, Math.min(1, unit.hp / unit.maxHp));
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(barX, barY, barW, barH);

    if (STATE.mode === 'combat') {
      const pipStr = '◆'.repeat(unit.actions) + '◇'.repeat(Math.max(0, 3 - unit.actions)) + (unit.reaction ? ' ↺' : '');
      ctx.font = `bold ${Math.max(9, Math.floor(s * 0.16))}px Figtree, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(pipStr, center.x + 1, center.y - tokenR - 4);
      ctx.fillStyle = isActiveTurn ? '#facc15' : '#cbd5e1';
      ctx.fillText(pipStr, center.x, center.y - tokenR - 5);
    }
  }

  if (unit.shieldRaised && !isDead) {
    const bx = center.x + tokenR * 0.78;
    const by = center.y - tokenR * 0.78;
    ctx.fillStyle = '#5ccbff';
    ctx.beginPath();
    ctx.arc(bx, by, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#03141d';
    ctx.font = '800 10px Figtree, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`+${shieldBonusOf(unit)}`, bx, by + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.font = `700 ${Math.max(9, Math.floor(s * 0.15))}px Figtree, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000';
  ctx.fillText(unit.name, center.x + 1, center.y + tokenR + 11);
  ctx.fillStyle = isDead ? '#ef4444' : '#e2e8f0';
  ctx.fillText(unit.name, center.x, center.y + tokenR + 10);

  ctx.restore();
}

