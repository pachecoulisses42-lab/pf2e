/**
 * Cenas de combate no navegador (Playwright): criar, organizar, iniciar sem estragar o
 * original, salvar progresso, continuar, encerrar, exportar/importar e sobreviver a recarregar.
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const url = 'file://' + join(root, 'dist/brigandine_pf2e_tatico_v5.html');
await page.goto(url);
await page.waitForFunction(() => typeof SCENES !== 'undefined' && SCENES.store && STATE.units.length > 0);

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ', e.message); }
}
/** Responde a próxima pergunta (Salvar/Descartar/…) clicando no botão com esse texto. */
async function answer(label) {
  await page.waitForSelector('#choiceDialog[open]');
  await page.click(`#choiceButtons button:has-text("${label}")`);
}

await check('registro no painel de combate, abaixo de Encerrar combate, recolhível e lembrado', async () => {
  const r = await page.evaluate(() => {
    setAppMode('combat');
    addLog('teste-registro');
    const panel = document.getElementById('combatLogPanel');
    const endBtn = Array.from(document.querySelectorAll('#combatLeftPanel button')).find(b => /Encerrar combate/.test(b.textContent));
    const below = endBtn.getBoundingClientRect().bottom <= panel.getBoundingClientRect().top;
    const first = document.getElementById('combatPanelLog').firstElementChild.textContent;
    const dockHidden = getComputedStyle(document.getElementById('logDock')).display === 'none';
    return { below, first, dockHidden, open: panel.open };
  });
  assert.deepEqual(r, { below: true, first: 'teste-registro', dockHidden: true, open: true });
  await page.click('#combatLogPanel > summary');
  await page.waitForTimeout(50);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('brigandine_prefs_v1')).combatLogOpen), false);
  await page.click('#combatLogPanel > summary');
  await page.evaluate(() => setAppMode('setup'));
});

await check('criar cena do tabuleiro, renomear e anotar; o cabeçalho mostra a cena', async () => {
  await page.click('#sceneHeaderBtn');
  await page.click('button:has-text("Nova a partir do tabuleiro")');
  await page.waitForFunction(() => SCENES.metas.length === 1);
  const name = page.locator('.scene-card .scene-name');
  await name.fill('Emboscada na ponte');
  await name.dispatchEvent('change');
  const notes = page.locator('.scene-card .scene-notes');
  await notes.fill('Goblins atacam ao amanhecer');
  await notes.dispatchEvent('change');
  await page.waitForFunction(() => SCENES.metas[0].notes === 'Goblins atacam ao amanhecer' && SCENES.metas[0].name === 'Emboscada na ponte');
  const r = await page.evaluate(() => ({ store: SCENES.store.kind, header: document.getElementById('sceneHeaderLabel').textContent, thumb: SCENES.metas[0].thumb.slice(0, 15), stats: SCENES.metas[0].stats }));
  assert.equal(r.store, 'indexeddb');
  assert.equal(r.header, 'Emboscada na ponte');
  assert.equal(r.thumb, 'data:image/jpeg');
  assert.deepEqual(r.stats, { heroes: 9, villains: 6, cols: 14, rows: 10 });
});

await check('alteração não salva: ponto no cabeçalho e pergunta antes de trocar de cena', async () => {
  await page.evaluate(() => { STATE.units[0].hp = 1; requestRender(); });
  await page.waitForFunction(() => document.getElementById('sceneHeaderBtn').classList.contains('dirty'));
  // segunda cena em branco: pergunta; Descartar segue
  const p = page.evaluate(() => createSceneFromBoard(true));
  await answer('Descartar alterações');
  await p;
  const r = await page.evaluate(() => ({ n: SCENES.metas.length, units: STATE.units.length, active: activeMeta().name }));
  assert.deepEqual(r, { n: 2, units: 0, active: 'Cena em branco' });
});

await check('iniciar combate usa uma cópia: a cena preparada continua intacta; salvar no combate guarda progresso', async () => {
  const id = await page.evaluate(() => SCENES.metas.find(m => m.name === 'Emboscada na ponte').id);
  await page.evaluate(() => openScenesDialog());
  await page.click(`.scene-card[data-id="${id}"] button:has-text("Iniciar combate")`);
  await page.waitForFunction(() => STATE.mode === 'combat');
  const r1 = await page.evaluate(async (id) => {
    const u = STATE.units[0];
    const hp0 = u.hp;
    u.hp = 3; STATE.combat.round = 4;
    await saveActiveScene();
    const scene = await SCENES.store.get(id);
    const byId = (list) => list.find(x => x.id === u.id).hp;
    return { hp0, prepared: byId(scene.snapshot.units), progressHp: byId(scene.progress.units), round: scene.progress.combat.round, has: SCENES.metas.find(m => m.id === id).hasProgress };
  }, id);
  assert.equal(r1.prepared, r1.hp0, 'o preparado não perdeu PV');
  assert.equal(r1.hp0 > 3, true, 'a cena preparada tinha PV cheio (a alteração anterior foi descartada)');
  assert.deepEqual([r1.progressHp, r1.round, r1.has], [3, 4, true]);
});

await check('continuar retoma rodada e PV; encerrar combate pode voltar ao preparado e limpa o progresso', async () => {
  const id = await page.evaluate(() => SCENES.metas.find(m => m.name === 'Emboscada na ponte').id);
  await page.evaluate(() => { STATE.units.forEach(u => { u.hp = u.maxHp; }); setAppMode('setup'); markBoardSaved(); });
  await page.evaluate(() => openScenesDialog());
  await page.click(`.scene-card[data-id="${id}"] button:has-text("Continuar")`);
  await page.waitForFunction(() => STATE.mode === 'combat');
  const r = await page.evaluate(() => ({ round: STATE.combat.round, hurt: STATE.units.filter(u => u.hp === 3).length }));
  assert.deepEqual(r, { round: 4, hurt: 1 });
  await page.evaluate(() => endCombatSession());
  await answer('Voltar à cena preparada');
  await page.waitForFunction(() => STATE.units.every(u => u.hp === u.maxHp));
  const after = await page.evaluate(async (id) => ({ mode: STATE.mode, progress: (await SCENES.store.get(id)).progress, dirty: isBoardDirty() }), id);
  assert.deepEqual(after, { mode: 'setup', progress: null, dirty: false });
});

await check('duplicar, reordenar, buscar e excluir com confirmação', async () => {
  const id = await page.evaluate(() => SCENES.metas.find(m => m.name === 'Emboscada na ponte').id);
  await page.evaluate((id) => duplicateScene(id), id);
  await page.waitForFunction(() => SCENES.metas.length === 3);
  const order1 = await page.evaluate(() => sortScenes(SCENES.metas).map(m => m.name));
  assert.deepEqual(order1, ['Emboscada na ponte', 'Cena em branco', 'Emboscada na ponte (cópia)']);
  await page.evaluate(() => moveSceneInList(sortScenes(SCENES.metas)[2].id, -1));
  await page.waitForFunction(() => sortScenes(SCENES.metas)[1].name === 'Emboscada na ponte (cópia)');
  await page.evaluate(() => { openScenesDialog(); setSceneQuery('amanhecer'); });
  assert.equal(await page.locator('.scene-card').count(), 2, 'a busca acha pelas anotações (original e cópia)');
  await page.evaluate(() => setSceneQuery(''));
  const blank = await page.evaluate(() => SCENES.metas.find(m => m.name === 'Cena em branco').id);
  await page.click(`.scene-card[data-id="${blank}"] button[title="Excluir"]`);
  await answer('Excluir');
  await page.waitForFunction(() => SCENES.metas.length === 2);
  await page.evaluate(() => closeScenesDialog());
});

await check('exportar todas e importar: ids e nomes repetidos viram novos; modelos do usuário vêm junto', async () => {
  const r = await page.evaluate(async () => {
    UNIT_TEMPLATES.push({ ...JSON.parse(JSON.stringify(UNIT_TEMPLATES[0])), id: 't_meu_modelo', name: 'Meu Herói' });
    const scenes = [];
    for (const m of SCENES.metas) scenes.push(await SCENES.store.get(m.id));
    const file = JSON.parse(JSON.stringify(buildCampaignFile(scenes, customTemplates())));
    UNIT_TEMPLATES.splice(UNIT_TEMPLATES.findIndex(t => t.id === 't_meu_modelo'), 1);
    const added = await importScenesData(file);
    return { added, n: SCENES.metas.length, ids: new Set(SCENES.metas.map(m => m.id)).size, names: SCENES.metas.map(m => m.name).sort(), lib: UNIT_TEMPLATES.some(t => t.id === 't_meu_modelo') };
  });
  assert.equal(r.added, 2);
  assert.equal(r.n, 4);
  assert.equal(r.ids, 4);
  assert.ok(r.names.includes('Emboscada na ponte (2)'));
  assert.equal(r.lib, true);
});

await check('campanhas: criar pasta, cena nova entra na pasta aberta, mover cena, busca dentro da pasta, ordem por pasta', async () => {
  await page.evaluate(() => openScenesDialog());
  await page.click('.camp-chip.camp-new');
  await page.waitForFunction(() => SCENES.campaigns.length === 1 && SCENES.folder === SCENES.campaigns[0].id);
  const nameInput = page.locator('#campaignNameInput');
  await nameInput.fill('Abomination Vaults');
  await nameInput.dispatchEvent('change');
  await page.waitForFunction(() => SCENES.campaigns[0].name === 'Abomination Vaults');
  const campId = await page.evaluate(() => SCENES.campaigns[0].id);
  // pasta vazia → cena nova entra nela
  assert.match(await page.locator('#scenesList').innerText(), /Pasta vazia/);
  await page.evaluate(() => { markBoardSaved(); });
  await page.click('button:has-text("Nova a partir do tabuleiro")');
  await page.waitForFunction((id) => SCENES.metas.filter(m => m.campaignId === id).length === 1, campId);
  // move duas cenas existentes para a campanha pelo seletor do cartão (na pasta Todas)
  await page.click('.camp-chip:has-text("Todas")');
  for (const name of ['Emboscada na ponte', 'Emboscada na ponte (cópia)']) {
    const id = await page.evaluate((n) => SCENES.metas.find(m => m.name === n).id, name);
    await page.selectOption(`.scene-card[data-id="${id}"] .scene-camp select`, campId);
    await page.waitForFunction(([sid, cid]) => SCENES.metas.find(m => m.id === sid).campaignId === cid, [id, campId]);
  }
  await page.click(`.camp-chip:has-text("Abomination Vaults")`);
  const inFolder = await page.locator('.scene-card').count();
  assert.equal(inFolder, 3, 'a pasta mostra só as cenas dela');
  assert.match(await page.locator('.camp-chip.active').innerText(), /Abomination Vaults\s*3/);
  // busca dentro da pasta
  await page.fill('#scenesSearch', 'cópia');
  assert.equal(await page.locator('.scene-card').count(), 1);
  await page.fill('#scenesSearch', '');
  // reordenar dentro da pasta
  const before = await page.evaluate((cid) => scenesInFolder(SCENES.metas, cid, SCENES.campaigns).map(m => m.name), campId);
  await page.locator('.scene-card').nth(2).locator('button[title="Subir"]').click();
  await page.waitForFunction(([cid, b]) => scenesInFolder(SCENES.metas, cid, SCENES.campaigns)[1].name === b[2], [campId, before]);
  // em Todas o reordenar fica desligado e a busca acha pelo nome da campanha
  await page.click('.camp-chip:has-text("Todas")');
  assert.equal(await page.locator('.scene-card button[title="Subir"]:not([disabled])').count(), 0);
  await page.fill('#scenesSearch', 'abomination');
  assert.equal(await page.locator('.scene-card').count(), 3);
  await page.fill('#scenesSearch', '');
});

await check('campanhas: exportar/importar mantém as pastas; excluir campanha move as cenas para Sem campanha', async () => {
  const r = await page.evaluate(async () => {
    const camp = SCENES.campaigns[0];
    const scenes = [];
    for (const m of scenesInFolder(SCENES.metas, camp.id, SCENES.campaigns)) scenes.push(await SCENES.store.get(m.id));
    const file = JSON.parse(JSON.stringify(buildCampaignFile(scenes, [], [camp])));
    setSceneFolder(CAMPAIGN_ALL);
    await importScenesData(file);
    const copy = SCENES.campaigns.find(c => c.name === 'Abomination Vaults (2)');
    return { camps: SCENES.campaigns.length, copyScenes: copy ? scenesInFolder(SCENES.metas, copy.id, SCENES.campaigns).length : 0, copyId: copy && copy.id };
  });
  assert.deepEqual([r.camps, r.copyScenes], [2, 3]);
  await page.evaluate((id) => setSceneFolder(id), r.copyId);
  await page.click('#campaignHeader button[title="Excluir campanha"]');
  await answer('Excluir e mover as cenas para Sem campanha');
  await page.waitForFunction(() => SCENES.campaigns.length === 1);
  const after = await page.evaluate(() => ({ none: scenesInFolder(SCENES.metas, CAMPAIGN_NONE, SCENES.campaigns).length, total: SCENES.metas.length, folder: SCENES.folder }));
  assert.equal(after.folder, 'all');
  assert.ok(after.none >= 3, `cenas foram para Sem campanha (${after.none})`);
  await page.evaluate(() => closeScenesDialog());
});

await check('recarregar a página: cenas e modelos do usuário continuam lá; mapa de fundo volta a aparecer', async () => {
  const id = await page.evaluate(async () => {
    // mapa de fundo pequeno gerado na hora, salvo na cena aberta
    const c = document.createElement('canvas'); c.width = 8; c.height = 8; c.getContext('2d').fillRect(0, 0, 8, 8);
    STATE.grid.bgImageData = c.toDataURL('image/png');
    await saveActiveScene();
    await new Promise(r => setTimeout(r, 900)); // biblioteca grava com atraso
    return SCENES.activeId;
  });
  await page.reload();
  await page.waitForFunction(() => typeof SCENES !== 'undefined' && SCENES.store && SCENES.metas.length >= 4);
  const r = await page.evaluate(async (id) => {
    const lib = UNIT_TEMPLATES.some(t => t.id === 't_meu_modelo');
    await openScene(id, 'open');
    await new Promise(r => setTimeout(r, 200));
    return { lib, bg: !!bgImageObj, active: SCENES.activeId === id, camps: SCENES.campaigns.map(c => c.name), folder: SCENES.folder };
  }, id);
  assert.deepEqual(r, { lib: true, bg: true, active: true, camps: ['Abomination Vaults'], folder: 'all' });
});

await check('sem erros de JavaScript', async () => { assert.deepEqual(errors, []); });

await browser.close();
if (failed) { console.log(`\n${failed} falha(s)`); process.exit(1); }
console.log('\ntudo certo');
