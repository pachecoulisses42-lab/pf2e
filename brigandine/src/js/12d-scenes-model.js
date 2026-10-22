/* ============================================================================
   15d. CENAS — modelo (funções puras)
   Uma cena guarda o tabuleiro preparado (`snapshot`) e, se houver, o combate em
   andamento (`progress`). Ver docs/ARQUITETURA-CENAS.md.
   ============================================================================ */

const SCENE_VERSION = 1;

/** Copia o tabuleiro (sem a biblioteca de modelos). inCombat inclui rodada, peça da vez e modo. */
function captureBoard(state, inCombat = false) {
  const board = JSON.parse(JSON.stringify({
    grid: state.grid,
    terrainMap: state.terrainMap,
    objects: state.objects,
    effects: state.effects,
    effectZones: state.effectZones,
    layers: state.layers,
    units: state.units
  }));
  if (inCombat) {
    board.combat = {
      round: state.combat.round,
      activeUnitId: state.combat.activeUnitId,
      mode: 'combat',
      flashLights: JSON.parse(JSON.stringify(state.flashLights || []))
    };
  }
  return board;
}

/** Impressão digital do tabuleiro para saber se há alterações não salvas (ignora câmera e seleção). */
function boardFingerprint(board) {
  const b = { ...board };
  delete b.combat;
  return hashString(JSON.stringify(b));
}

function sceneStats(board) {
  const units = (board && board.units) || [];
  return {
    heroes: units.filter(u => u.faction === 'hero').length,
    villains: units.filter(u => u.faction !== 'hero').length,
    cols: board?.grid?.cols || 0,
    rows: board?.grid?.rows || 0
  };
}

/** Nome sem repetir: "Emboscada", "Emboscada (2)", "Emboscada (3)"… */
function uniqueSceneName(base, existingNames) {
  const clean = cleanText(base) || 'Cena';
  const taken = new Set(existingNames.map(n => n.toLowerCase()));
  if (!taken.has(clean.toLowerCase())) return clean;
  const root = clean.replace(/\s*\(\d+\)$/, '');
  for (let i = 2; ; i++) {
    const name = `${root} (${i})`;
    if (!taken.has(name.toLowerCase())) return name;
  }
}

function newSceneId() {
  return `sc_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Cena nova a partir de um tabuleiro. */
function makeScene({ name, notes = '', board, order = 0, thumb = '', now = Date.now() }) {
  return {
    id: newSceneId(), version: SCENE_VERSION,
    name: cleanText(name) || 'Cena', notes: cleanText(notes),
    order, createdAt: now, updatedAt: now, thumb,
    stats: sceneStats(board),
    snapshot: board, progress: null
  };
}

/** Separa metadados (lista leve) do corpo (tabuleiros). */
function splitScene(scene) {
  const { snapshot, progress, ...meta } = scene;
  return { meta: { ...meta, hasProgress: !!progress }, body: { id: scene.id, snapshot, progress: progress || null } };
}

function joinScene(meta, body) {
  const { hasProgress, ...rest } = meta;
  return { ...rest, snapshot: body ? body.snapshot : null, progress: body ? body.progress : null };
}

/** Ordena pela posição e, em empate, pela criação. */
function sortScenes(metas) {
  return [...metas].sort((a, b) => (a.order - b.order) || (a.createdAt - b.createdAt));
}

/** Move uma cena uma posição para cima (-1) ou para baixo (+1). Devolve as metas com `order` refeito. */
function moveScene(metas, id, dir) {
  const list = sortScenes(metas);
  const i = list.findIndex(m => m.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list.map((m, k) => ({ ...m, order: k }));
  [list[i], list[j]] = [list[j], list[i]];
  return list.map((m, k) => ({ ...m, order: k }));
}

/** Valida uma cena vinda de arquivo; devolve null se não servir. Ids e nomes são refeitos fora daqui. */
function normalizeImportedScene(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const board = raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot
    : (raw.grid || raw.units ? raw : null); // aceita também um arquivo de tabuleiro comum
  if (!board || !Array.isArray(board.units)) return null;
  const now = Date.now();
  return {
    id: typeof raw.id === 'string' && /^sc_[\w]+$/.test(raw.id) ? raw.id : newSceneId(),
    version: SCENE_VERSION,
    name: cleanText(raw.name) || 'Cena importada',
    notes: cleanText(raw.notes),
    order: Number.isFinite(raw.order) ? raw.order : 0,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : now,
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : now,
    thumb: typeof raw.thumb === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(raw.thumb) ? raw.thumb : '',
    stats: sceneStats(board),
    snapshot: board,
    progress: raw.progress && Array.isArray(raw.progress.units) ? raw.progress : null
  };
}

/** Arquivo de campanha: todas as cenas + modelos do usuário. */
function buildCampaignFile(scenes, library) {
  return { kind: 'brigandine-campaign', version: SCENE_VERSION, exportedAt: new Date().toISOString(), scenes, library: library || [] };
}

/** Lê arquivo de campanha, de cena única ou de tabuleiro. Devolve { scenes, library }. */
function parseScenesFile(data) {
  if (data && data.kind === 'brigandine-campaign' && Array.isArray(data.scenes)) {
    return { scenes: data.scenes.map(normalizeImportedScene).filter(Boolean), library: Array.isArray(data.library) ? data.library : [] };
  }
  if (data && data.kind === 'brigandine-scene') {
    const s = normalizeImportedScene(data.scene);
    return { scenes: s ? [s] : [], library: [] };
  }
  const s = normalizeImportedScene(data);
  return { scenes: s ? [s] : [], library: Array.isArray(data?.templates) ? data.templates : [] };
}
