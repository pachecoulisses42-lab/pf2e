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
  terrainBrush: null,     // terreno escolhido ('normal' = apagar)
  selectedTemplateId: 't_guerreiro',

  terrainMap: {},
  objects: [],            // objetos e perigos: { id, type, col, row }
  effects: { nevoa: {}, escuridao: {}, chuva: {}, nevasca: {}, fumaca: {} }, // clima pintado: tipo -> { "c,r": 1 }
  effectZones: [],        // emanações presas a peças: { id, type, unitId, radius }
  flashLights: [],        // clarões de magia: { keys, round } — luz plena até o fim da rodada
  layers: { terrain: 50, effects: 50, map: 0 }, // transparência (%) de cada menu
  openMenu: null,         // 'board' | 'map' | 'tools' | null — só o menu aberto age no tabuleiro
  toolTab: 'piece',       // aba da caixa de ferramentas
  objectBrush: null,      // objeto ou perigo escolhido (ou 'erase')
  effectBrush: null,      // clima escolhido (ou 'erase')
  paint: { shape: 'cell', size: 4.5, start: null, preview: null },
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
    paintingTerrain: false,
    rotatingUnitId: null,   // peça sendo girada pela alça
    rotateStart: null,
    facingHandle: null      // posição da alça desenhada no último quadro
  }
};

let bgImageObj = null;
const canvas = document.getElementById('battleCanvas');
const ctx = canvas.getContext('2d');

