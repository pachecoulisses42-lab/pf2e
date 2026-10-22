/* ============================================================================
   12. CANVAS POINTER INTERACTION
   ============================================================================ */
/**
 * Gestos de toque: toque simples age ao soltar (não ao pousar o dedo), arrastar com um dedo
 * move a câmera e o pinça com dois dedos dá zoom. Mouse mantém o comportamento imediato.
 */
const touchState = { pointers: new Map(), pending: null, pinchDist: 0 };
const TOUCH_MOVE_THRESHOLD = 10;

function touchPinchDistance() {
  const [a, b] = Array.from(touchState.pointers.values());
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function initCanvasEvents() {
  canvas.addEventListener('pointerdown', onCanvasPointerDown);
  canvas.addEventListener('pointermove', onCanvasPointerMove);
  canvas.addEventListener('pointerleave', hideUnitTip);
  // Arrastar uma imagem sobre uma peça a transforma em token daquela peça.
  canvas.addEventListener('dragover', (e) => {
    if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault();
  });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const pt = getCanvasRelativeCoords(e);
    const cell = pixelToCell(pt.x, pt.y);
    const unit = cell && STATE.units.find(u => u.col === cell.col && u.row === cell.row);
    if (!unit) { addLog('⚠️ Solte a imagem sobre uma peça para usá-la como token.'); return; }
    STATE.selectedUnitId = unit.id;
    applyTokenFile(unit, file);
  });
  window.addEventListener('pointerup', onCanvasPointerUp);
  window.addEventListener('pointercancel', onCanvasPointerUp);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomBoard(e.deltaY < 0 ? 1.1 : 0.91);
  }, { passive: false });
}

function getCanvasRelativeCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function onCanvasPointerDown(e) {
  const isTouch = e.pointerType === 'touch';
  if (isTouch) {
    touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchState.pointers.size === 2) {
      touchState.pending = null;
      STATE.interaction.isPanning = false;
      STATE.interaction.draggingUnitId = null;
      STATE.interaction.paintingTerrain = false;
      STATE.interaction.rotatingUnitId = null;
      STATE.interaction.rotateStart = null;
      touchState.pinchDist = touchPinchDistance();
      return;
    }
  }
  const pt = getCanvasRelativeCoords(e);
  // a alça de giro fica na borda da peça e pode estar fora da grade: vem antes de tudo
  if (e.button === 0 && startFacingDrag(pt, isTouch)) return;
  const cell = pixelToCell(pt.x, pt.y);

  if (e.button === 1 || e.button === 2 || !cell) {
    STATE.interaction.isPanning = true;
    STATE.interaction.panStart = { x: pt.x - STATE.camera.x, y: pt.y - STATE.camera.y };
    return;
  }

  if (STATE.ruler.active) {
    STATE.ruler.startCell = cell;
    STATE.ruler.endCell = cell;
    requestRender();
    return;
  }

  const clickedUnit = STATE.units.find(u => u.col === cell.col && u.row === cell.row && u.hp > 0) ||
                      STATE.units.find(u => u.col === cell.col && u.row === cell.row);

  // toque: adia a ação até soltar o dedo, para permitir arrastar o tabuleiro
  const tool = STATE.mode === 'setup' ? currentBoardTool() : null;
  const paints = tool === 'terrain' || tool === 'effect';
  const deferrable = isTouch && (STATE.mode === 'combat' || (!paints && (!clickedUnit || tool === 'object' || tool === 'hazard')));
  if (deferrable) {
    touchState.pending = {
      pointerId: e.pointerId, cell, clickedUnit, mode: STATE.mode,
      startPt: pt, camStart: { x: STATE.camera.x, y: STATE.camera.y }
    };
    return;
  }

  if (STATE.mode === 'setup') {
    setupPointerDown(cell, clickedUnit);
  } else {
    handleCombatBoardClick(cell, clickedUnit);
  }
}

function onCanvasPointerMove(e) {
  const pt = getCanvasRelativeCoords(e);
  if (e.pointerType === 'touch' && touchState.pointers.has(e.pointerId)) {
    touchState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchState.pointers.size === 2) {
      const dist = touchPinchDistance();
      if (touchState.pinchDist > 0) zoomBoard(dist / touchState.pinchDist);
      touchState.pinchDist = dist;
      return;
    }
  }
  if (STATE.interaction.rotatingUnitId) {
    updateFacingDrag(pt, e.shiftKey);
    return;
  }
  if (e.pointerType === 'touch' && touchState.pointers.has(e.pointerId)) {
    const pend = touchState.pending;
    if (pend && pend.pointerId === e.pointerId) {
      if (Math.hypot(pt.x - pend.startPt.x, pt.y - pend.startPt.y) < TOUCH_MOVE_THRESHOLD) return;
      STATE.interaction.isPanning = true;
      STATE.interaction.panStart = { x: pend.startPt.x - pend.camStart.x, y: pend.startPt.y - pend.camStart.y };
      touchState.pending = null;
    }
  }
  if (STATE.interaction.isPanning) {
    hideUnitTip();
    STATE.camera.x = pt.x - STATE.interaction.panStart.x;
    STATE.camera.y = pt.y - STATE.interaction.panStart.y;
    requestRender();
    return;
  }

  const overHandle = e.pointerType !== 'touch' && hitFacingHandle(pt, false);
  canvas.style.cursor = overHandle ? 'grab' : '';
  if (overHandle) { hideUnitTip(); return; }

  const cell = pixelToCell(pt.x, pt.y);
  STATE.interaction.hoverCell = cell;

  if (cell) {
    document.getElementById('hudHoverCell').textContent = `Célula ${cell.col + 1}, ${cell.row + 1}`;
    const refUnit = STATE.units.find(u => u.id === (STATE.mode === 'combat' ? STATE.combat.activeUnitId : STATE.selectedUnitId));
    if (refUnit) {
      const dm = cellDistanceMeters(refUnit.col, refUnit.row, cell.col, cell.row);
      document.getElementById('hudDistanceMeasure').textContent = `${dm} m de ${refUnit.name}`;
    }
  }

  updateUnitTip(e, cell);

  if (STATE.ruler.active && STATE.ruler.startCell && cell) {
    STATE.ruler.endCell = cell;
    hideUnitTip();
    requestRender();
    return;
  }

  if (STATE.mode === 'setup') {
    if ((STATE.interaction.paintingTerrain || STATE.paint.start) && cell) {
      paintDragTo(cell);
    } else if (STATE.interaction.draggingUnitId && cell) {
      const dragged = STATE.units.find(u => u.id === STATE.interaction.draggingUnitId);
      const occupied = STATE.units.find(u => u.id !== dragged.id && u.col === cell.col && u.row === cell.row);
      if (dragged && !occupied) {
        dragged.col = cell.col;
        dragged.row = cell.row;
      }
    }
  }

  requestRender();
}

function onCanvasPointerUp(e) {
  if (e && e.pointerType === 'touch') {
    touchState.pointers.delete(e.pointerId);
    if (touchState.pointers.size < 2) touchState.pinchDist = 0;
    const pend = touchState.pending;
    if (pend && pend.pointerId === e.pointerId) {
      touchState.pending = null;
      if (e.type === 'pointerup') {
        if (pend.mode === 'combat') handleCombatBoardClick(pend.cell, pend.clickedUnit);
        else if (STATE.mode === 'setup') setupTap(pend.cell, pend.clickedUnit);
      }
    }
  }
  if (STATE.interaction.rotatingUnitId && (!e || e.type === 'pointerup')) endFacingDrag();
  STATE.interaction.rotatingUnitId = null;
  STATE.interaction.rotateStart = null;
  if (STATE.paint.start || STATE.interaction.paintingTerrain) {
    if (!e || e.type === 'pointerup') finishPaint();
    else { STATE.paint.start = null; STATE.paint.preview = null; requestRender(); }
  }
  STATE.interaction.isPanning = false;
  STATE.interaction.draggingUnitId = null;
  STATE.interaction.paintingTerrain = false;
}

