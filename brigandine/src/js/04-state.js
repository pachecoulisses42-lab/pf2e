/* ============================================================================
   5. GLOBAL APPLICATION STATE
   ============================================================================ */
const STATE = {
  mode: 'setup',
  editTab: 'sheet', // Default to Ficha/Build tab in editor
  sheetTab: 'attrs', // 'attrs' | 'tests' | 'combat' | 'build'
  editingWeapon: null, // índice da arma aberta no editor
  editingSpell: null,  // índice da magia aberta no editor
  grid: {
    type: 'hex',
    cols: 14,
    rows: 10,
    cellScale: 1.5,
    alpha: 0.65,
    proceduralTheme: 'parchment',
    bgImageData: null
  },
  camera: {
    x: 55,
    y: 45,
    zoom: 1.0,
    basePx: 60
  },
  setupTool: 'piece',
  terrainBrush: 'normal',
  selectedTemplateId: 't_guerreiro',

  terrainMap: {},
  units: [],
  selectedUnitId: null,

  combat: {
    round: 1,
    activeUnitId: null,
    mainMenu: 'move', // 'attack' | 'move' | 'magic' | 'items' | 'sheet'
    selectedWeaponIdx: 0,
    selectedSpellIdx: 0,
    selectedItemIdx: 0
  },
  ruler: {
    active: false,
    startCell: null,
    endCell: null
  },
  floatingTexts: [],
  interaction: {
    hoverCell: null,
    draggingUnitId: null,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    paintingTerrain: false
  }
};

let bgImageObj = null;
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

