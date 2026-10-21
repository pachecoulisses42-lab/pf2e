/**
 * Teste de fumaça no navegador (Playwright).  npm run test:e2e
 * Requer `playwright` resolvível e um Chromium (PLAYWRIGHT_BROWSERS_PATH ou CHROMIUM_PATH).
 */
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const require = createRequire(process.env.PLAYWRIGHT_REQUIRE_FROM || import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('file://' + join(root, 'dist/brigandine_pf2e_tatico_v5.html'));
await page.waitForFunction(() => typeof STATE !== 'undefined' && STATE.units.length > 0);

let failed = 0;
async function check(name, fn) {
  try { await fn(); console.log('ok  ', name); } catch (e) { failed++; console.log('FAIL', name, '\n    ', e.message); }
}

await check('batalha de exemplo monta 15 peças e todos os 12 tokens renderizam', async () => {
  const n = await page.evaluate(() => STATE.units.length);
  assert.equal(n, 15);
  const keys = await page.evaluate(() => Object.keys(SCULPT_SVGS).length);
  assert.equal(keys, 12);
});

await check('Erguer Escudo: gasta 1 ação, sobe a CA e some no início do próximo turno', async () => {
  const r = await page.evaluate(() => {
    setAppMode('combat');
    const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
    const before = { ac: u.ac, actions: u.actions };
    selectCombatMainMenu('attack');
    raiseShield();
    const raised = { ac: u.ac, actions: u.actions, flag: u.shieldRaised, base: u.baseAc };
    raiseShield(); // segunda vez não gasta ação
    const again = u.actions;
    // percorre os turnos até voltar à mesma peça
    const total = STATE.units.filter(x => x.hp > 0).length;
    for (let i = 0; i < total; i++) nextTurn();
    const after = { ac: u.ac, flag: u.shieldRaised, actions: u.actions };
    return { before, raised, again, after };
  });
  assert.equal(r.raised.ac, r.before.ac + 2);
  assert.equal(r.raised.actions, r.before.actions - 1);
  assert.equal(r.again, r.raised.actions);
  assert.equal(r.after.flag, false);
  assert.equal(r.after.ac, r.before.ac);
  assert.equal(r.after.actions, 3);
});

await check('Erguer Escudo não funciona sem ações nem sem escudo', async () => {
  const r = await page.evaluate(() => {
    const u = STATE.units.find(x => x.id === STATE.combat.activeUnitId);
    u.actions = 0; raiseShield();
    const noActions = u.shieldRaised;
    u.actions = 3; u.sheet.shieldBonus = 0; raiseShield();
    return { noActions, noShield: u.shieldRaised, actions: u.actions };
  });
  assert.equal(r.noActions, false);
  assert.equal(r.noShield, false);
  assert.equal(r.actions, 3);
});

await check('ataque com runas soma dano elemental e dobra no crítico', async () => {
  const r = await page.evaluate(() => {
    const [att, tgt] = STATE.units;
    att.actions = 3; att.strikesMade = 0; tgt.hp = tgt.maxHp = 500; tgt.ac = 1;
    att.weapons[0] = normalizeWeapon({ name: 'Lâmina Rúnica', dmgDie: '1d4', dmgBonus: 0, dmgType: 'cortante', manual: true, atkBonus: 100,
      extra: [{ name: 'Flamejante', die: '1d6', bonus: 0, type: 'fogo' }] });
    const log = [];
    const orig = Math.random; Math.random = () => 0.999;
    const origLog = addLog; addLog = (m) => log.push(m);
    executeWeaponAttackAndDamage(att, tgt, att.weapons[0]);
    Math.random = orig; addLog = origLog;
    return { lost: 500 - tgt.hp, log: log.join(' ') };
  });
  // d20=20 => crítico; base 4 + rune 6 = 10, dobrado = 20
  assert.equal(r.lost, 20);
  assert.match(r.log, /8 cortante \+ 12 fogo \(Flamejante\)/);
});

await check('editor de arma: dado inválido é recusado; runa e dano personalizado entram', async () => {
  const r = await page.evaluate(() => {
    setAppMode('setup');
    STATE.selectedUnitId = STATE.units[0].id;
    syncInspectorUI();
    createWeaponOnSelectedUnit();
    const u = selectedUnit(); const idx = u.weapons.length - 1;
    updateWeaponField(idx, 'dmgDie', 'banana');
    const kept = u.weapons[idx].dmgDie;
    updateWeaponField(idx, 'dmgDie', '2d8');
    document.getElementById(`xPreset-weapon-${idx}`).value = 'gelida';
    addPresetExtraDamage('weapon', idx);
    document.getElementById(`xName-weapon-${idx}`).value = 'Veneno de aranha';
    document.getElementById(`xDie-weapon-${idx}`).value = '1d4';
    document.getElementById(`xType-weapon-${idx}`).value = 'veneno';
    addCustomExtraDamage('weapon', idx);
    const w = u.weapons[idx];
    return { kept, die: w.dmgDie, extra: w.extra.map(x => `${x.name}:${x.die}:${x.type}`), desc: describeDamage(w) };
  });
  assert.equal(r.kept, '1d6');
  assert.equal(r.die, '2d8');
  assert.deepEqual(r.extra, ['Gélida:1d6:gélido', 'Veneno de aranha:1d4:veneno']);
  assert.equal(r.desc.includes('1d6 gélido') && r.desc.includes('1d4 veneno'), true);
});

await check('editor de magia: criar, editar área e lançar causa dano com dano adicional', async () => {
  const r = await page.evaluate(() => {
    const [caster, target] = STATE.units;
    createSpellOnSelectedUnit();
    const idx = caster.spells.length - 1;
    updateSpellField(idx, 'name', 'Chuva de Brasas');
    updateSpellField(idx, 'areaType', 'burst');
    updateSpellField(idx, 'areaSize', '4.5');
    updateSpellField(idx, 'manual', true);
    updateSpellField(idx, 'atkBonus', '100');
    updateSpellField(idx, 'dmgDie', '2d6');
    document.getElementById(`xPreset-spell-${idx}`).value = 'chocante';
    addPresetExtraDamage('spell', idx);
    const sp = caster.spells[idx];
    caster.actions = 3; caster.col = 0; caster.row = 0;
    target.col = 1; target.row = 0; target.hp = target.maxHp = 500; target.ac = 1;
    const orig = Math.random; Math.random = () => 0.5; // d20 = 11, dano: 2d6 -> 4+4? (floor(.5*6)+1=4)
    const ok = executeSpellCastOnCell(caster, sp, { col: 1, row: 0 }, target, false);
    Math.random = orig;
    return { ok, name: sp.name, area: sp.areaType, size: sp.areaSize, lost: 500 - target.hp, actions: caster.actions };
  });
  assert.equal(r.ok, true);
  assert.equal(r.name, 'Chuva de Brasas');
  assert.equal(r.area, 'burst');
  assert.equal(r.size, 4.5);
  assert.equal(r.actions, 1);
  assert.ok(r.lost >= 8 + 4, `dano ${r.lost} deveria incluir 2d6 + 1d6 elétrico`);
});

await check('exportar/importar mantém armas com runas', async () => {
  const r = await page.evaluate(() => {
    const u = STATE.units[0];
    u.weapons[0] = normalizeWeapon({ name: 'X', dmgDie: '1d8', extra: [{ name: 'Sagrada', die: '1d4', type: 'espiritual' }] });
    const payload = JSON.parse(JSON.stringify({ grid: STATE.grid, terrainMap: STATE.terrainMap, units: STATE.units, templates: UNIT_TEMPLATES, round: 1 }));
    applyLoadedPayload(payload);
    return STATE.units[0].weapons[0].extra[0].type;
  });
  assert.equal(r, 'espiritual');
});

await check('sem erros de JavaScript durante o fluxo', async () => {
  assert.deepEqual(errors, []);
});

await browser.close();
if (failed) { console.log(`\n${failed} falha(s)`); process.exit(1); }
console.log('\ntudo certo');
