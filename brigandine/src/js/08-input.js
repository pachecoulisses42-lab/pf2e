/* ============================================================================
   12. CANVAS POINTER INTERACTION
   ============================================================================ */
function initCanvasEvents() {
  canvas.addEventListener('pointerdown', onCanvasPointerDown);
  canvas.addEventListener('pointermove', onCanvasPointerMove);
  window.addEventListener('pointerup', onCanvasPointerUp);
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
  const pt = getCanvasRelativeCoords(e);
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

  if (STATE.mode === 'setup') {
    if (STATE.setupTool === 'terrain') {
      STATE.interaction.paintingTerrain = true;
      paintCellTerrain(cell.col, cell.row);
      return;
    }
    if (clickedUnit) {
      STATE.selectedUnitId = clickedUnit.id;
      STATE.interaction.draggingUnitId = clickedUnit.id;
      syncInspectorUI();
      requestRender();
    } else {
      spawnUnitFromTemplate(STATE.selectedTemplateId, cell.col, cell.row);
    }
  } else {
    handleCombatBoardClick(cell, clickedUnit);
  }
}

function onCanvasPointerMove(e) {
  const pt = getCanvasRelativeCoords(e);
  if (STATE.interaction.isPanning) {
    STATE.camera.x = pt.x - STATE.interaction.panStart.x;
    STATE.camera.y = pt.y - STATE.interaction.panStart.y;
    requestRender();
    return;
  }

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

  if (STATE.ruler.active && STATE.ruler.startCell && cell) {
    STATE.ruler.endCell = cell;
    requestRender();
    return;
  }

  if (STATE.mode === 'setup') {
    if (STATE.interaction.paintingTerrain && cell) {
      paintCellTerrain(cell.col, cell.row);
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

function onCanvasPointerUp() {
  STATE.interaction.isPanning = false;
  STATE.interaction.draggingUnitId = null;
  STATE.interaction.paintingTerrain = false;
}

