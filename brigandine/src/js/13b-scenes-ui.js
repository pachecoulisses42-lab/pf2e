/* ============================================================================
   19b. CENAS — interface
   Janela "Cenas" (cabeçalho): criar, abrir, iniciar, continuar, salvar, duplicar,
   ordenar, anotar, excluir, exportar e importar cenas de combate. A cena aberta
   aparece no cabeçalho com um ponto quando há alterações não salvas.
   ============================================================================ */

const SCENES = {
  store: null,       // repositório (IndexedDB, localStorage ou memória)
  metas: [],         // lista leve
  activeId: null,    // cena aberta no tabuleiro
  savedPrint: null,  // impressão digital do último salvamento/abertura
  builtinIds: null,  // ids dos modelos que vêm com o app (não vão para a biblioteca)
  libraryPrint: null,
  query: '',
  campaigns: [],     // pastas: { id, name, notes, order }
  folder: 'all'      // pasta aberta: 'all', 'none' ou id da campanha
};

/* ---------------- Início ---------------- */

async function initScenes() {
  SCENES.builtinIds = new Set(UNIT_TEMPLATES.map(t => t.id));
  SCENES.store = await openSceneStore();
  try {
    const lib = await SCENES.store.getKV('library');
    if (Array.isArray(lib)) mergeLibrary(lib);
    SCENES.metas = await SCENES.store.listMeta();
    SCENES.campaigns = ((await SCENES.store.getKV('campaigns')) || []).map(normalizeCampaign).filter(Boolean);
    const lastFolder = readPrefs().sceneFolder;
    if (lastFolder === CAMPAIGN_NONE || SCENES.campaigns.some(c => c.id === lastFolder)) SCENES.folder = lastFolder;
  } catch (e) {
    addLog(`⚠️ Não foi possível ler as cenas salvas: ${escapeHtml(e.message)}.`);
  }
  SCENES.libraryPrint = libraryFingerprint();
  markBoardSaved();
  updateSceneHeader();
  if (SCENES.metas.length) addLog(`🎬 ${SCENES.metas.length} cena(s) de combate salvas. Abra em <strong>Cenas</strong>, no topo.`);
  if (SCENES.store.kind !== 'indexeddb') {
    addLog(SCENES.store.kind === 'memory'
      ? '⚠️ Este navegador não deixa guardar cenas: elas valem só até fechar a página. Use <strong>Exportar</strong> nas Cenas.'
      : 'ℹ️ Cenas guardadas no armazenamento simples do navegador (≈5 MB). Mapas de fundo grandes podem não caber: exporte uma cópia.');
  }
  window.addEventListener('beforeunload', (e) => {
    if (SCENES.activeId && isBoardDirty()) { e.preventDefault(); e.returnValue = ''; }
  });
}

/* ---------------- Biblioteca de modelos (galeria) ---------------- */

function customTemplates() {
  return UNIT_TEMPLATES.filter(t => !SCENES.builtinIds || !SCENES.builtinIds.has(t.id));
}

function libraryFingerprint() {
  return hashString(JSON.stringify(customTemplates()));
}

/** Acrescenta modelos guardados que ainda não estão na galeria (ids novos). */
function mergeLibrary(list) {
  const have = new Set(UNIT_TEMPLATES.map(t => t.id));
  let added = 0;
  for (const t of list) {
    if (!t || typeof t !== 'object' || !t.sheet || have.has(t.id)) continue;
    repairPieceToken(t);
    UNIT_TEMPLATES.push(t);
    have.add(t.id);
    added++;
  }
  if (added) renderPieceGallery();
  return added;
}

let librarySaveTimer = null;
/** Guarda os modelos do usuário quando a galeria muda (com atraso para juntar mudanças). */
function scheduleLibrarySave() {
  if (!SCENES.store) return;
  clearTimeout(librarySaveTimer);
  librarySaveTimer = setTimeout(async () => {
    const print = libraryFingerprint();
    if (print === SCENES.libraryPrint) return;
    try {
      await SCENES.store.setKV('library', customTemplates());
      SCENES.libraryPrint = print;
    } catch (e) {
      addLog(`⚠️ Não foi possível guardar os modelos: ${escapeHtml(e.message)}.`);
    }
  }, 600);
}

/* ---------------- Alterações não salvas ---------------- */

function currentBoardPrint() {
  return boardFingerprint(captureBoard(STATE));
}

function markBoardSaved() {
  SCENES.savedPrint = currentBoardPrint();
  updateSceneHeader();
}

function isBoardDirty() {
  return SCENES.savedPrint !== null && currentBoardPrint() !== SCENES.savedPrint;
}

let sceneHeaderTimer = null;
/** O ponto de "não salvo" no cabeçalho é recalculado sem pressa depois das mudanças. */
function scheduleSceneHeaderUpdate() {
  if (!SCENES.store) return;
  clearTimeout(sceneHeaderTimer);
  sceneHeaderTimer = setTimeout(updateSceneHeader, 700);
}

/* ---------------- Campanhas (pastas) ---------------- */

function campaignById(id) {
  return SCENES.campaigns.find(c => c.id === id) || null;
}

/** Campanha onde entram as cenas novas: a pasta aberta, se for uma campanha. */
function folderCampaignId() {
  return campaignById(SCENES.folder) ? SCENES.folder : null;
}

async function saveCampaigns() {
  try { await SCENES.store.setKV('campaigns', SCENES.campaigns); }
  catch (e) { addLog(`⚠️ Não foi possível guardar as campanhas: ${escapeHtml(e.message)}.`); }
}

function setSceneFolder(folder) {
  SCENES.folder = folder === CAMPAIGN_NONE || campaignById(folder) ? folder : CAMPAIGN_ALL;
  SCENES.query = '';
  const search = document.getElementById('scenesSearch');
  if (search) search.value = '';
  savePrefs({ sceneFolder: SCENES.folder });
  renderScenesDialog();
}

async function createCampaign() {
  const c = makeCampaign({ name: uniqueSceneName('Nova campanha', SCENES.campaigns.map(x => x.name)), order: SCENES.campaigns.length });
  SCENES.campaigns.push(c);
  await saveCampaigns();
  SCENES.folder = c.id;
  savePrefs({ sceneFolder: c.id });
  renderScenesDialog();
  const input = document.getElementById('campaignNameInput');
  if (input) { input.focus(); input.select(); }
  return c.id;
}

function updateCampaign(id, patch) {
  return queueSceneWrite(async () => {
    const c = campaignById(id);
    if (!c) return;
    if ('name' in patch) c.name = uniqueSceneName(patch.name, SCENES.campaigns.filter(x => x.id !== id).map(x => x.name));
    if ('notes' in patch) c.notes = cleanText(patch.notes);
    c.updatedAt = Date.now();
    await saveCampaigns();
    updateSceneHeader();
    // só a barra muda (nome no chip); o campo que a pessoa está editando fica como está
    if ('name' in patch) {
      const input = document.getElementById('campaignNameInput');
      if (input && input.value !== c.name) input.value = c.name;
      renderCampaignChips();
    }
  });
}

async function moveCampaign(id, dir) {
  const list = sortCampaigns(SCENES.campaigns);
  const i = list.findIndex(c => c.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  SCENES.campaigns = list.map((c, k) => ({ ...c, order: k }));
  await saveCampaigns();
  renderScenesDialog();
}

/** Excluir campanha: as cenas vão para "Sem campanha" ou são excluídas junto. */
async function deleteCampaign(id) {
  const c = campaignById(id);
  if (!c) return;
  const inside = SCENES.metas.filter(m => m.campaignId === id);
  const choice = await askChoice(
    `Excluir a campanha <strong>${escapeHtml(c.name)}</strong>${inside.length ? ` (${inside.length} cena${inside.length > 1 ? 's' : ''})` : ''}?`,
    [
      ...(inside.length ? [{ label: 'Excluir e mover as cenas para Sem campanha', value: 'move', kind: 'btn-primary' },
        { label: 'Excluir a campanha e as cenas', value: 'all', kind: 'btn-danger' }]
        : [{ label: 'Excluir', value: 'move', kind: 'btn-danger' }]),
      { label: 'Cancelar', value: null, kind: 'btn-ghost' }
    ]);
  if (!choice) return;
  if (choice === 'all') {
    for (const m of inside) await SCENES.store.remove(m.id);
    SCENES.metas = SCENES.metas.filter(m => m.campaignId !== id);
    if (inside.some(m => m.id === SCENES.activeId)) SCENES.activeId = null;
  } else if (inside.length) {
    const base = scenesInFolder(SCENES.metas, CAMPAIGN_NONE, SCENES.campaigns).length;
    const moved = inside.map((m, k) => ({ ...m, campaignId: null, order: base + k }));
    await SCENES.store.putMetas(moved);
    SCENES.metas = SCENES.metas.map(m => moved.find(x => x.id === m.id) || m);
  }
  SCENES.campaigns = SCENES.campaigns.filter(x => x.id !== id);
  await saveCampaigns();
  addLog(`🗂️ Campanha <strong>${escapeHtml(c.name)}</strong> excluída${choice === 'all' ? ' com as cenas' : ''}.`);
  setSceneFolder(CAMPAIGN_ALL);
  updateSceneHeader();
}

/** Muda a cena de pasta (só os metadados; o tabuleiro não é regravado). */
function setSceneCampaign(sceneId, campaignId) {
  return queueSceneWrite(() => setSceneCampaignNow(sceneId, campaignId));
}

async function setSceneCampaignNow(sceneId, campaignId) {
  const meta = SCENES.metas.find(m => m.id === sceneId);
  if (!meta) return;
  const target = campaignById(campaignId) ? campaignId : null;
  const order = scenesInFolder(SCENES.metas, target || CAMPAIGN_NONE, SCENES.campaigns).length;
  const updated = { ...meta, campaignId: target, order, updatedAt: Date.now() };
  try { await SCENES.store.putMetas([updated]); } catch (e) { addLog(`⚠️ ${escapeHtml(e.message)}`); return; }
  SCENES.metas = SCENES.metas.map(m => (m.id === sceneId ? updated : m));
  updateSceneHeader();
  renderScenesDialog();
}

async function exportCampaign(id) {
  const c = campaignById(id);
  if (!c) return;
  const scenes = [];
  for (const m of scenesInFolder(SCENES.metas, id, SCENES.campaigns)) { const s = await SCENES.store.get(m.id); if (s) scenes.push(s); }
  downloadJSON(buildCampaignFile(scenes, customTemplates(), [c]), `brigandine_campanha_${fileSafe(c.name)}.json`);
  addLog(`📦 Campanha <strong>${escapeHtml(c.name)}</strong> exportada (${scenes.length} cena(s)).`);
}

function activeMeta() {
  return SCENES.metas.find(m => m.id === SCENES.activeId) || null;
}

function updateSceneHeader() {
  const label = document.getElementById('sceneHeaderLabel');
  if (!label) return;
  const meta = activeMeta();
  const dirty = isBoardDirty();
  label.textContent = meta ? meta.name : 'Sem cena';
  document.getElementById('sceneHeaderBtn').classList.toggle('dirty', dirty);
  const camp = meta && campaignById(meta.campaignId);
  document.getElementById('sceneHeaderBtn').title = meta
    ? `Cena aberta: ${camp ? `${camp.name} › ` : ''}${meta.name}${dirty ? ' (alterações não salvas)' : ''}`
    : 'Cenas de combate';
}

/* ---------------- Escolha com botões (Salvar / Descartar / Cancelar…) ---------------- */

/** Mostra uma pergunta com botões e devolve o valor escolhido (ou null ao cancelar/fechar). */
function askChoice(message, options) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('choiceDialog');
    document.getElementById('choiceMessage').innerHTML = message;
    const box = document.getElementById('choiceButtons');
    box.innerHTML = '';
    const finish = (v) => { dlg.close(); resolve(v); };
    for (const o of options) {
      const b = document.createElement('button');
      b.className = `btn ${o.kind || ''}`;
      b.textContent = o.label;
      b.onclick = () => finish(o.value);
      box.appendChild(b);
    }
    dlg.onclose = () => resolve(null);
    dlg.onclick = (e) => { if (e.target === dlg) finish(null); };
    dlg.showModal();
  });
}

/** Antes de trocar o tabuleiro: salvar, descartar ou cancelar. Devolve true se pode seguir. */
async function confirmLeaveBoard(actionLabel) {
  if (!isBoardDirty()) return true;
  const meta = activeMeta();
  const choice = await askChoice(
    meta ? `A cena <strong>${escapeHtml(meta.name)}</strong> tem alterações não salvas. ${escapeHtml(actionLabel)} mesmo assim?`
      : `O tabuleiro atual não está salvo em nenhuma cena. ${escapeHtml(actionLabel)} mesmo assim?`,
    [
      { label: meta ? 'Salvar e seguir' : 'Salvar como cena e seguir', value: 'save', kind: 'btn-primary' },
      { label: 'Descartar alterações', value: 'discard', kind: 'btn-danger' },
      { label: 'Cancelar', value: null, kind: 'btn-ghost' }
    ]);
  if (choice === 'save') return (await saveActiveScene()) !== null;
  return choice === 'discard';
}

/* ---------------- Miniatura ---------------- */

/** Foto pequena do tabuleiro (JPEG 240 px), recortada na área da grade. */
function sceneThumbnail() {
  try {
    renderBoard();
    const s = STATE.camera.basePx * STATE.camera.zoom;
    const a = getCellPixelCenter(0, 0), b = getCellPixelCenter(STATE.grid.cols - 1, STATE.grid.rows - 1);
    const dpr = canvas.width / Math.max(1, canvas.clientWidth);
    const x = Math.max(0, (a.x - s * 0.6) * dpr), y = Math.max(0, (a.y - s * 0.6) * dpr);
    const w = Math.min(canvas.width - x, (b.x - a.x + s * 1.2) * dpr), h = Math.min(canvas.height - y, (b.y - a.y + s * 1.2) * dpr);
    if (w < 10 || h < 10) return '';
    const out = document.createElement('canvas');
    out.width = 240;
    out.height = Math.max(60, Math.round(240 * h / w));
    out.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, out.width, out.height);
    return out.toDataURL('image/jpeg', 0.72);
  } catch (e) {
    return '';
  }
}

/* ---------------- Salvar / criar ---------------- */

async function persistScene(scene) {
  try {
    await SCENES.store.put(scene);
    const { meta } = splitScene(scene);
    SCENES.metas = [...SCENES.metas.filter(m => m.id !== scene.id), meta];
    scheduleLibrarySave();
    return true;
  } catch (e) {
    const quota = /quota/i.test(e.name + e.message);
    addLog(`⚠️ Não foi possível salvar a cena${quota ? ': o espaço do navegador acabou' : ''} (${escapeHtml(e.message)}). Use <strong>Exportar</strong> para guardar em arquivo.`);
    return false;
  }
}

/**
 * Salva o tabuleiro na cena aberta: na montagem grava a cena preparada; no combate grava o
 * progresso (a cena preparada fica intacta). Sem cena aberta, cria uma nova. Devolve o id ou null.
 */
async function saveActiveScene() {
  if (!SCENES.activeId) return createSceneFromBoard();
  const scene = await SCENES.store.get(SCENES.activeId);
  if (!scene) return createSceneFromBoard();
  const inCombat = STATE.mode === 'combat';
  if (inCombat) scene.progress = captureBoard(STATE, true);
  else { scene.snapshot = captureBoard(STATE); scene.thumb = sceneThumbnail() || scene.thumb; scene.stats = sceneStats(scene.snapshot); }
  scene.updatedAt = Date.now();
  if (!(await persistScene(scene))) return null;
  markBoardSaved();
  addLog(inCombat
    ? `💾 Progresso do combate salvo em <strong>${escapeHtml(scene.name)}</strong> (rodada ${STATE.combat.round}). A cena preparada continua intacta.`
    : `💾 Cena <strong>${escapeHtml(scene.name)}</strong> salva.`);
  renderScenesDialog();
  return scene.id;
}

/** Nova cena com o tabuleiro atual (ou vazio). Vira a cena aberta. */
async function createSceneFromBoard(blank = false) {
  if (blank && !(await confirmLeaveBoard('Começar uma cena em branco'))) return null;
  if (blank) {
    STATE.units = []; STATE.terrainMap = {}; STATE.objects = [];
    for (const t of Object.keys(STATE.effects)) STATE.effects[t] = {};
    STATE.effectZones = []; STATE.flashLights = [];
    clearBackgroundMap();
    setAppMode('setup');
    syncInspectorUI();
  }
  const name = uniqueSceneName(blank ? 'Cena em branco' : `Cena ${SCENES.metas.length + 1}`, SCENES.metas.map(m => m.name));
  const campaignId = folderCampaignId();
  const order = scenesInFolder(SCENES.metas, campaignId || CAMPAIGN_NONE, SCENES.campaigns).length;
  const scene = makeScene({ name, board: captureBoard(STATE), order, thumb: sceneThumbnail(), campaignId });
  if (STATE.mode === 'combat') scene.progress = captureBoard(STATE, true);
  if (!(await persistScene(scene))) return null;
  SCENES.activeId = scene.id;
  markBoardSaved();
  addLog(`🎬 Cena <strong>${escapeHtml(scene.name)}</strong> criada. Dê um nome e anotações na janela Cenas.`);
  renderScenesDialog(scene.id);
  return scene.id;
}

/* ---------------- Abrir / iniciar / continuar ---------------- */

/** Coloca um tabuleiro salvo no tabuleiro (mesmo caminho do Importar JSON). */
function applyBoard(board) {
  applyLoadedPayload(JSON.parse(JSON.stringify(board)));
  STATE.flashLights = [];
  resetCamera();
}

/**
 * mode: 'open' (montagem), 'start' (combate novo com iniciativa) ou 'resume' (continua o progresso).
 */
async function openScene(id, mode = 'open') {
  if (id !== SCENES.activeId || mode !== 'open') {
    const label = { open: 'Abrir a cena', start: 'Iniciar o combate', resume: 'Continuar o combate' }[mode];
    if (!(await confirmLeaveBoard(label))) return false;
  }
  const scene = await SCENES.store.get(id);
  if (!scene || !scene.snapshot) { addLog('⚠️ Cena não encontrada.'); return false; }
  const board = mode === 'resume' && scene.progress ? scene.progress : scene.snapshot;
  setAppMode('setup');
  applyBoard(board);
  SCENES.activeId = id;
  if (mode === 'resume' && board.combat) {
    setAppMode('combat');
    STATE.combat.round = board.combat.round || 1;
    if (STATE.units.some(u => u.id === board.combat.activeUnitId)) STATE.combat.activeUnitId = board.combat.activeUnitId;
    STATE.flashLights = JSON.parse(JSON.stringify(board.combat.flashLights || []));
    STATE.selectedUnitId = STATE.combat.activeUnitId;
    syncCombatUI();
    addLog(`▶️ Combate de <strong>${escapeHtml(scene.name)}</strong> retomado na rodada ${STATE.combat.round}.`);
  } else if (mode === 'start') {
    setAppMode('combat');
    rollAllInitiatives();
    addLog(`⚔️ Cena <strong>${escapeHtml(scene.name)}</strong> iniciada. A cena preparada não muda; <em>Salvar</em> no combate guarda o progresso.`);
  } else {
    addLog(`🎬 Cena <strong>${escapeHtml(scene.name)}</strong> aberta para montagem.`);
  }
  // a referência do "não salvo" é o que está gravado para este modo
  SCENES.savedPrint = boardFingerprint(captureBoard(STATE));
  updateSceneHeader();
  closeScenesDialog();
  requestRender();
  return true;
}

/** Ao encerrar o combate numa cena: voltar ao preparado ou manter o tabuleiro como ficou. */
async function afterCombatInScene() {
  const meta = activeMeta();
  if (!meta) return;
  const scene = await SCENES.store.get(meta.id);
  if (scene && scene.progress) { scene.progress = null; await persistScene(scene); }
  const choice = await askChoice(
    `Combate de <strong>${escapeHtml(meta.name)}</strong> encerrado. Como deixar o tabuleiro?`,
    [
      { label: 'Voltar à cena preparada', value: 'restore', kind: 'btn-primary' },
      { label: 'Manter como terminou', value: 'keep', kind: 'btn-ghost' }
    ]);
  if (choice === 'restore' && scene) {
    applyBoard(scene.snapshot);
    SCENES.savedPrint = currentBoardPrint();
    addLog(`↩️ Tabuleiro voltou à cena preparada <strong>${escapeHtml(meta.name)}</strong>.`);
  }
  updateSceneHeader();
  renderScenesDialog();
}

/* ---------------- Organizar ---------------- */

let sceneWriteQueue = Promise.resolve();
/** Gravações de metadados uma de cada vez: duas edições seguidas não se sobrescrevem. */
function queueSceneWrite(fn) {
  sceneWriteQueue = sceneWriteQueue.then(fn, fn);
  return sceneWriteQueue;
}

/** Nome/anotações da cena. Não redesenha a lista (não atrapalha quem está digitando no cartão). */
function updateSceneMeta(id, patch) {
  return queueSceneWrite(async () => {
    const scene = await SCENES.store.get(id);
    if (!scene) return;
    if ('name' in patch) scene.name = uniqueSceneName(patch.name, SCENES.metas.filter(m => m.id !== id).map(m => m.name));
    if ('notes' in patch) scene.notes = cleanText(patch.notes);
    scene.updatedAt = Date.now();
    await persistScene(scene);
    const input = document.querySelector(`.scene-card[data-id="${id}"] .scene-name`);
    if (input && 'name' in patch && input.value !== scene.name) input.value = scene.name; // nome repetido ganhou sufixo
    updateSceneHeader();
  });
}

async function duplicateScene(id) {
  const scene = await SCENES.store.get(id);
  if (!scene) return;
  const copy = { ...JSON.parse(JSON.stringify(scene)), id: newSceneId(), progress: null,
    name: uniqueSceneName(`${scene.name} (cópia)`, SCENES.metas.map(m => m.name)),
    order: scenesInFolder(SCENES.metas, sceneCampaignId(scene, SCENES.campaigns) || CAMPAIGN_NONE, SCENES.campaigns).length,
    createdAt: Date.now(), updatedAt: Date.now() };
  if (await persistScene(copy)) addLog(`⧉ Cena duplicada: <strong>${escapeHtml(copy.name)}</strong>.`);
  renderScenesDialog(copy.id);
}

/** Sobe/desce a cena dentro da pasta aberta (cada pasta tem a própria ordem). */
function moveSceneInList(id, dir) {
  return queueSceneWrite(() => moveSceneInListNow(id, dir));
}

async function moveSceneInListNow(id, dir) {
  const meta = SCENES.metas.find(m => m.id === id);
  if (!meta) return;
  const folder = sceneCampaignId(meta, SCENES.campaigns) || CAMPAIGN_NONE;
  const moved = moveScene(scenesInFolder(SCENES.metas, folder, SCENES.campaigns), id, dir);
  try {
    await SCENES.store.putMetas(moved);
    SCENES.metas = SCENES.metas.map(m => moved.find(x => x.id === m.id) || m);
  } catch (e) { addLog(`⚠️ ${escapeHtml(e.message)}`); }
  renderScenesDialog();
}

async function deleteScene(id) {
  const meta = SCENES.metas.find(m => m.id === id);
  if (!meta) return;
  const ok = await askChoice(`Excluir a cena <strong>${escapeHtml(meta.name)}</strong>? Isso não pode ser desfeito (exporte antes se quiser guardar).`,
    [{ label: 'Excluir', value: true, kind: 'btn-danger' }, { label: 'Cancelar', value: null, kind: 'btn-ghost' }]);
  if (!ok) return;
  await SCENES.store.remove(id);
  SCENES.metas = SCENES.metas.filter(m => m.id !== id);
  if (SCENES.activeId === id) { SCENES.activeId = null; updateSceneHeader(); }
  addLog(`🗑️ Cena <strong>${escapeHtml(meta.name)}</strong> excluída.`);
  renderScenesDialog();
}

/* ---------------- Exportar / importar ---------------- */

function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const fileSafe = (s) => normalizeSearchText(s).replace(/ /g, '_').slice(0, 40) || 'cena';

async function exportScene(id) {
  const scene = await SCENES.store.get(id);
  if (scene) downloadJSON({ kind: 'brigandine-scene', version: SCENE_VERSION, scene }, `brigandine_cena_${fileSafe(scene.name)}.json`);
}

async function exportAllScenes() {
  const scenes = [];
  for (const m of sortScenes(SCENES.metas)) { const s = await SCENES.store.get(m.id); if (s) scenes.push(s); }
  downloadJSON(buildCampaignFile(scenes, customTemplates(), sortCampaigns(SCENES.campaigns)), 'brigandine_todas_as_cenas.json');
  addLog(`📦 ${SCENES.campaigns.length} campanha(s), ${scenes.length} cena(s) e ${customTemplates().length} modelo(s) exportados em <em>brigandine_todas_as_cenas.json</em>.`);
}

/** Importa campanha, cena única ou tabuleiro comum como cena(s) novas (ids e nomes repetidos são trocados). */
async function importScenesData(data) {
  const parsed = parseScenesFile(data);
  const libAdded = mergeLibrary(parsed.library);
  // campanhas do arquivo entram ao lado das existentes; cena sem campanha vai para a pasta aberta
  const { scenes, campaigns } = remapImport(parsed, SCENES.campaigns, folderCampaignId());
  if (campaigns.length) { SCENES.campaigns.push(...campaigns); await saveCampaigns(); }
  let added = 0;
  for (const s of scenes) {
    if (SCENES.metas.some(m => m.id === s.id)) s.id = newSceneId();
    s.name = uniqueSceneName(s.name, SCENES.metas.map(m => m.name));
    s.order = scenesInFolder(SCENES.metas, s.campaignId || CAMPAIGN_NONE, SCENES.campaigns).length;
    if (await persistScene(s)) added++;
  }
  if (libAdded) scheduleLibrarySave();
  addLog(added || libAdded
    ? `📥 ${added} cena(s) importada(s)${campaigns.length ? ` em ${campaigns.length} campanha(s) nova(s)` : ''}${libAdded ? ` e ${libAdded} modelo(s) na galeria` : ''}.`
    : '⚠️ O arquivo não tem cenas válidas.');
  renderScenesDialog();
  return added;
}

function importScenesFile(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    try { await importScenesData(JSON.parse(e.target.result)); }
    catch (err) { addLog(`⚠️ ${escapeHtml(file.name)}: ${escapeHtml(err.message)}`); }
  };
  reader.readAsText(file);
}

/* ---------------- Janela ---------------- */

function openScenesDialog() {
  closeMenus();
  renderScenesDialog();
  const dlg = document.getElementById('scenesDialog');
  if (!dlg.open) dlg.showModal();
}

function closeScenesDialog() {
  const dlg = document.getElementById('scenesDialog');
  if (dlg && dlg.open) dlg.close();
}

function setSceneQuery(q) {
  SCENES.query = q;
  renderScenesDialog();
}

function formatSceneDate(ms) {
  try { return new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return ''; }
}

/** Desenha a lista. focusId: cena cujo nome recebe o foco (acabou de ser criada). */
function renderScenesDialog(focusId = null) {
  const list = document.getElementById('scenesList');
  if (!list) return;
  const active = activeMeta();
  const dirty = isBoardDirty();
  document.getElementById('scenesSaveBtn').textContent = active
    ? (STATE.mode === 'combat' ? `Salvar progresso em “${active.name}”` : `Salvar “${active.name}”`)
    : 'Salvar tabuleiro como cena nova';
  document.getElementById('scenesStorageInfo').textContent =
    { indexeddb: 'Guardadas neste navegador.', localstorage: 'Guardadas no armazenamento simples do navegador (≈5 MB).', memory: 'Atenção: só até fechar a página — exporte.' }[SCENES.store?.kind] || '';
  renderCampaignBar();
  const q = normalizeSearchText(SCENES.query);
  const inAll = SCENES.folder === CAMPAIGN_ALL;
  const folderMetas = scenesInFolder(SCENES.metas, SCENES.folder, SCENES.campaigns);
  // em "Todas": agrupa pela ordem das campanhas; dentro de cada pasta, a ordem da pasta
  const campOrder = new Map(sortCampaigns(SCENES.campaigns).map((c, k) => [c.id, k]));
  const rank = (m) => { const c = sceneCampaignId(m, SCENES.campaigns); return c ? campOrder.get(c) : -1; };
  const ordered = inAll ? [...folderMetas].sort((a, b) => (rank(a) - rank(b)) || (a.order - b.order) || (a.createdAt - b.createdAt)) : folderMetas;
  const metas = ordered.filter(m => !q || normalizeSearchText(`${m.name} ${m.notes} ${campaignById(m.campaignId)?.name || ''}`).includes(q));
  if (!SCENES.metas.length) {
    list.innerHTML = `<div class="empty"><svg class="icon"><use href="#i-folder"/></svg><strong>Nenhuma cena ainda</strong><span>Monte o tabuleiro e use <em>Salvar tabuleiro como cena nova</em>, ou comece uma <em>cena em branco</em>.</span></div>`;
    return;
  }
  if (!folderMetas.length) {
    list.innerHTML = `<div class="empty"><svg class="icon"><use href="#i-folder"/></svg><strong>Pasta vazia</strong><span>Cenas novas entram na pasta aberta. Para trazer uma cena existente, abra <em>Todas</em> e escolha a campanha no cartão dela.</span></div>`;
    return;
  }
  if (!metas.length) { list.innerHTML = '<p class="hint">Nenhuma cena com esse nome nesta pasta.</p>'; return; }
  const campaignOptions = (sel) => `<option value="">Sem campanha</option>${sortCampaigns(SCENES.campaigns).map(c =>
    `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}`;
  list.innerHTML = metas.map((m, i) => {
    const isActive = m.id === SCENES.activeId;
    const st = m.stats || {};
    const campId = sceneCampaignId(m, SCENES.campaigns);
    return `<article class="scene-card${isActive ? ' active' : ''}" data-id="${m.id}">
      <div class="scene-thumb">${m.thumb ? `<img src="${m.thumb}" alt="">` : '<svg class="icon"><use href="#i-hex"/></svg>'}</div>
      <div class="scene-body">
        <input type="text" class="scene-name" value="${escapeHtml(m.name)}" aria-label="Nome da cena" onchange="updateSceneMeta('${m.id}', { name: this.value })">
        <div class="scene-meta">
          <span>${st.heroes || 0} heróis · ${st.villains || 0} vilões · ${st.cols || 0}×${st.rows || 0}</span>
          <span>${formatSceneDate(m.updatedAt)}</span>
          <label class="scene-camp"><svg class="icon"><use href="#i-folder"/></svg><select aria-label="Campanha da cena" onchange="setSceneCampaign('${m.id}', this.value)">${campaignOptions(campId)}</select></label>
          ${isActive ? `<span class="badge badge-accent">Aberta${dirty ? ' · não salva' : ''}</span>` : ''}
          ${m.hasProgress ? '<span class="badge">Combate em andamento</span>' : ''}
        </div>
        <textarea class="scene-notes" rows="2" placeholder="Anotações do mestre (objetivo, gatilhos, tesouro…)" aria-label="Anotações" onchange="updateSceneMeta('${m.id}', { notes: this.value })">${escapeHtml(m.notes || '')}</textarea>
        <div class="scene-actions">
          <button class="btn btn-sm" onclick="openScene('${m.id}', 'open')"><svg class="icon"><use href="#i-wrench"/></svg>Abrir</button>
          <button class="btn btn-sm btn-primary" onclick="openScene('${m.id}', 'start')"><svg class="icon"><use href="#i-swords"/></svg>Iniciar combate</button>
          ${m.hasProgress ? `<button class="btn btn-sm" onclick="openScene('${m.id}', 'resume')"><svg class="icon"><use href="#i-play"/></svg>Continuar</button>` : ''}
          <span class="grow"></span>
          <button class="btn btn-sm btn-ghost btn-icon" title="Subir" aria-label="Subir" ${i === 0 || q || inAll ? 'disabled' : ''} onclick="moveSceneInList('${m.id}', -1)"><svg class="icon"><use href="#i-chevron-up"/></svg></button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Descer" aria-label="Descer" ${i === metas.length - 1 || q || inAll ? 'disabled' : ''} onclick="moveSceneInList('${m.id}', 1)"><svg class="icon"><use href="#i-chevron"/></svg></button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Duplicar" aria-label="Duplicar" onclick="duplicateScene('${m.id}')"><svg class="icon"><use href="#i-copy"/></svg></button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Exportar" aria-label="Exportar" onclick="exportScene('${m.id}')"><svg class="icon"><use href="#i-download"/></svg></button>
          <button class="btn btn-sm btn-ghost btn-icon" title="Excluir" aria-label="Excluir" onclick="deleteScene('${m.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
        </div>
      </div>
    </article>`;
  }).join('');
  if (focusId) {
    const input = list.querySelector(`.scene-card[data-id="${focusId}"] .scene-name`);
    if (input && document.getElementById('scenesDialog').open) { input.focus(); input.select(); }
  }
}

/** Barra de pastas (Todas, Sem campanha, campanhas) e o cabeçalho da campanha aberta. */
function renderCampaignChips() {
  const bar = document.getElementById('campaignBar');
  if (!bar) return;
  const count = (folder) => scenesInFolder(SCENES.metas, folder, SCENES.campaigns).length;
  const chip = (folder, label, icon) =>
    `<button type="button" class="camp-chip${SCENES.folder === folder ? ' active' : ''}" onclick="setSceneFolder('${folder}')">` +
    `<svg class="icon"><use href="#i-${icon}"/></svg><span>${escapeHtml(label)}</span><b class="num">${count(folder)}</b></button>`;
  bar.innerHTML = chip(CAMPAIGN_ALL, 'Todas', 'list') +
    sortCampaigns(SCENES.campaigns).map(c => chip(c.id, c.name, 'folder')).join('') +
    chip(CAMPAIGN_NONE, 'Sem campanha', 'hex') +
    `<button type="button" class="camp-chip camp-new" onclick="createCampaign()"><svg class="icon"><use href="#i-plus"/></svg><span>Nova campanha</span></button>`;
}

function renderCampaignBar() {
  const head = document.getElementById('campaignHeader');
  if (!head) return;
  renderCampaignChips();
  const c = campaignById(SCENES.folder);
  if (!c) {
    head.innerHTML = '';
    head.classList.add('hidden');
  } else {
    const sorted = sortCampaigns(SCENES.campaigns);
    const idx = sorted.findIndex(x => x.id === c.id);
    head.classList.remove('hidden');
    head.innerHTML = `
      <div class="camp-head-row">
        <svg class="icon"><use href="#i-folder"/></svg>
        <input id="campaignNameInput" type="text" class="scene-name" value="${escapeHtml(c.name)}" aria-label="Nome da campanha" onchange="updateCampaign('${c.id}', { name: this.value })">
        <button class="btn btn-sm btn-ghost btn-icon" title="Mover campanha para a esquerda" aria-label="Mover campanha para a esquerda" ${idx === 0 ? 'disabled' : ''} onclick="moveCampaign('${c.id}', -1)"><svg class="icon"><use href="#i-chevron-up"/></svg></button>
        <button class="btn btn-sm btn-ghost btn-icon" title="Mover campanha para a direita" aria-label="Mover campanha para a direita" ${idx === sorted.length - 1 ? 'disabled' : ''} onclick="moveCampaign('${c.id}', 1)"><svg class="icon"><use href="#i-chevron"/></svg></button>
        <button class="btn btn-sm btn-ghost btn-icon" title="Exportar campanha" aria-label="Exportar campanha" onclick="exportCampaign('${c.id}')"><svg class="icon"><use href="#i-download"/></svg></button>
        <button class="btn btn-sm btn-ghost btn-icon" title="Excluir campanha" aria-label="Excluir campanha" onclick="deleteCampaign('${c.id}')"><svg class="icon"><use href="#i-trash"/></svg></button>
      </div>
      <textarea class="scene-notes" rows="1" placeholder="Anotações da campanha (grupo, nível, próxima sessão…)" aria-label="Anotações da campanha" onchange="updateCampaign('${c.id}', { notes: this.value })">${escapeHtml(c.notes || '')}</textarea>`;
  }
  const search = document.getElementById('scenesSearch');
  if (search) search.placeholder = c ? `Buscar em “${c.name}”` : SCENES.folder === CAMPAIGN_NONE ? 'Buscar nas cenas sem campanha' : 'Buscar em todas as cenas (nome, anotação ou campanha)';
}
