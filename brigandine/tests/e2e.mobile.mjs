/**
 * Teste no celular (390×780, toque).  npm run test:e2e:mobile
 * Garante que os comandos do combate são encontráveis e usáveis com o dedo.
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + join(root, 'dist/brigandine_pf2e_tatico_v5.html'));
await page.waitForFunction(() => typeof STATE !== 'undefined' && STATE.units.length > 0);

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ', e.message); }
}

/** Posição (em pixels da página) do centro de uma célula do tabuleiro. */
const cellPoint = (col, row) => page.evaluate(([c, r]) => {
  const p = getCellPixelCenter(c, r);
  const rect = document.getElementById('battleCanvas').getBoundingClientRect();
  return { x: rect.left + p.x, y: rect.top + p.y };
}, [col, row]);

/** Arrasta com um dedo usando eventos de toque reais (CDP). */
async function swipe(from, to, steps = 8) {
  const cdp = await ctx.newCDPSession(page);
  const pt = (x, y) => [{ x, y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from.x, from.y) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(from.x + (to.x - from.x) * i / steps, from.y + (to.y - from.y) * i / steps) });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

await page.evaluate(() => setAppMode('combat'));

await check('a tela não rola na horizontal e o cabeçalho cabe', async () => {
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  assert.equal(w.sw, w.cw);
  const box = await page.locator('#btnModeCombat').boundingBox();
  assert.ok(box && box.x + box.width <= 390, 'botão Combate visível');
});

await check('os 5 comandos e Encerrar turno estão visíveis sem abrir nada', async () => {
  for (const id of ['btnCmd1Attack', 'btnCmd2Move', 'btnCmd3Magic', 'btnCmd4Items', 'btnCmd5Sheet']) {
    const b = await page.locator('#' + id).boundingBox();
    assert.ok(b && b.x >= 0 && b.x + b.width <= 390 && b.y + b.height <= 780 && b.height >= 40, `${id} dentro da tela e com área de toque`);
  }
  const end = await page.locator('.sheet-endturn').boundingBox();
  assert.ok(end && end.x + end.width <= 390, 'Encerrar turno visível');
  const react = await page.locator('#pipReaction').boundingBox();
  assert.ok(react && react.x + react.width <= 390, 'Reação não fica cortada');
});

await check('tocar em Ação abre a gaveta com as armas; tocar em Mover recolhe', async () => {
  await page.tap('#btnCmd1Attack');
  assert.equal(await page.evaluate(() => document.getElementById('sidebarRight').classList.contains('open')), true);
  const weapon = await page.locator('#combatWeaponList .option-card').first().boundingBox();
  assert.ok(weapon && weapon.y + weapon.height <= 780, 'primeira arma visível');
  const shield = await page.locator('#btnRaiseShield').boundingBox();
  assert.ok(shield, 'botão Erguer escudo existe');
  await page.tap('#btnCmd2Move');
  assert.equal(await page.evaluate(() => document.getElementById('sidebarRight').classList.contains('open')), false);
});

await check('tocar numa célula verde move a peça e gasta ações', async () => {
  const r = await page.evaluate(() => {
    const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
    u.actions = 3;
    const reach = computeReachableCells(u);
    const key = Object.keys(reach).find(k => reach[k].canAfford && reach[k].actionsNeeded === 1 && !STATE.units.some(o => `${o.col},${o.row}` === k));
    const [col, row] = key.split(',').map(Number);
    return { id: u.id, col, row, from: { col: u.col, row: u.row } };
  });
  const p = await cellPoint(r.col, r.row);
  await page.touchscreen.tap(p.x, p.y);
  const after = await page.evaluate((id) => { const u = STATE.units.find(x => x.id === id); return { col: u.col, row: u.row, actions: u.actions }; }, r.id);
  assert.deepEqual([after.col, after.row], [r.col, r.row]);
  assert.equal(after.actions, 2);
});

await check('arrastar com um dedo move a câmera e NÃO executa nenhuma ação', async () => {
  const before = await page.evaluate(() => { const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId); return { cam: { ...STATE.camera }, actions: u.actions, hp: STATE.units.map(x => x.hp).join() }; });
  const start = await cellPoint(7, 4);
  await swipe(start, { x: start.x - 60, y: start.y - 30 });
  const after = await page.evaluate(() => { const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId); return { cam: { ...STATE.camera }, actions: u.actions, hp: STATE.units.map(x => x.hp).join() }; });
  assert.ok(Math.abs(after.cam.x - before.cam.x) > 40, `câmera deveria mover em x (${before.cam.x} → ${after.cam.x})`);
  assert.equal(after.actions, before.actions);
  assert.equal(after.hp, before.hp);
});

await check('Encerrar turno na barra da gaveta passa a vez', async () => {
  const before = await page.evaluate(() => STATE.combat.activeUnitId);
  await page.tap('.sheet-endturn');
  const after = await page.evaluate(() => STATE.combat.activeUnitId);
  assert.notEqual(after, before);
  assert.match(await page.locator('#sheetHandleLabel').innerText(), /Comandos/);
});

await check('Montagem no celular: tocar numa célula vazia cria a peça, arrastar apenas move a câmera', async () => {
  await page.evaluate(() => { setAppMode('setup'); STATE.setupTool = 'piece'; });
  const empty = await page.evaluate(() => {
    for (let r = 0; r < STATE.grid.rows; r++) for (let c = 0; c < STATE.grid.cols; c++) if (!STATE.units.some(u => u.col === c && u.row === r)) return { c, r };
  });
  const n0 = await page.evaluate(() => STATE.units.length);
  const p = await cellPoint(empty.c, empty.r);
  await swipe(p, { x: p.x + 50, y: p.y + 20 });
  assert.equal(await page.evaluate(() => STATE.units.length), n0, 'arrastar não cria peça');
  const p2 = await cellPoint(empty.c, empty.r);
  await page.touchscreen.tap(p2.x, p2.y);
  assert.equal(await page.evaluate(() => STATE.units.length), n0 + 1, 'tocar cria peça');
  assert.match(await page.locator('#sheetHandleLabel').innerText(), /Editar/);
});

await check('gaveta de edição abre ao tocar na alça e mostra o inspetor', async () => {
  await page.tap('#sheetHandle');
  assert.equal(await page.evaluate(() => document.getElementById('sidebarRight').classList.contains('open')), true);
  const box = await page.locator('#inspNameInput').boundingBox();
  assert.ok(box && box.y + box.height <= 780);
});

await check('celular: arrastar com Terreno pinta casa a casa; com Objetos, toque põe e arrastar só move a câmera', async () => {
  await page.evaluate(() => {
    document.getElementById('sidebarRight').classList.remove('open');
    resetCamera(); STATE.units = [];
    setSetupTool('terrain'); selectTerrainBrush('neve'); setPaintShape('cell'); STATE.terrainMap = {};
  });
  const a = await cellPoint(2, 5), b = await cellPoint(4, 5);
  const cam0 = await page.evaluate(() => ({ ...STATE.camera }));
  await swipe(a, b, 10);
  const painted = await page.evaluate(() => Object.keys(STATE.terrainMap).filter(k => STATE.terrainMap[k] === 'neve').length);
  assert.ok(painted >= 3, `pintou ${painted} casas`);
  assert.deepEqual(await page.evaluate(() => ({ ...STATE.camera })), cam0, 'pintar não move a câmera');
  await page.evaluate(() => { setSetupTool('object'); selectObjectBrush('barril'); STATE.objects = []; });
  const c = await cellPoint(2, 3);
  await swipe(c, { x: c.x + 60, y: c.y + 30 });
  assert.equal(await page.evaluate(() => STATE.objects.length), 0, 'arrastar não põe objeto');
  const c2 = await cellPoint(2, 3);
  await page.touchscreen.tap(c2.x, c2.y);
  assert.deepEqual(await page.evaluate(() => STATE.objects.map(o => [o.type, o.col, o.row])), [['barril', 2, 3]]);
});

await check('sem erros de JavaScript', async () => { assert.deepEqual(errors, []); });

await browser.close();
if (failed) { console.log(`\n${failed} falha(s)`); process.exit(1); }
console.log('\ntudo certo');
