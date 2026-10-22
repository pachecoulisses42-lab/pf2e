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

await check('resistência e fraqueza por tipo alteram o dano real do ataque e aparecem no registro', async () => {
  const r = await page.evaluate(() => {
    const [att, tgt] = STATE.units;
    const run = () => {
      att.actions = 3; att.strikesMade = 0; tgt.hp = tgt.maxHp = 500; tgt.ac = 1;
      const logs = []; const origLog = addLog; addLog = (m) => logs.push(m);
      const orig = Math.random; Math.random = () => 0.999; // d20=20 (crítico), dados no máximo
      executeWeaponAttackAndDamage(att, tgt, att.weapons[0]);
      Math.random = orig; addLog = origLog;
      return { lost: 500 - tgt.hp, log: logs.join(' ') };
    };
    att.weapons[0] = normalizeWeapon({ name: 'Rúnica', dmgDie: '1d4', dmgBonus: 0, dmgType: 'cortante', manual: true, atkBonus: 100,
      extra: [{ name: 'Flamejante', die: '1d6', bonus: 0, type: 'fogo' }] });
    tgt.resistances = []; tgt.weaknesses = []; tgt.immunities = [];
    const plain = run();                                   // (4 + 6) x2 = 20
    tgt.resistances = [{ type: 'fogo', value: 5 }];
    const resisted = run();                                // cortante 8 + (12 - 5) = 15
    tgt.weaknesses = [{ type: 'cortante', value: 3 }];
    const weak = run();                                    // (8 + 3) + 7 = 18
    tgt.immunities = ['fogo'];
    const immune = run();                                  // (8 + 3) + 0 = 11
    return { plain: plain.lost, resisted: resisted.lost, weak: weak.lost, immune: immune.lost, log: immune.log };
  });
  assert.equal(r.plain, 20);
  assert.equal(r.resisted, 15);
  assert.equal(r.weak, 18);
  assert.equal(r.immune, 11);
  assert.match(r.log, /fogo: imune/);
  assert.match(r.log, /cortante: fraqueza \+3/);
});

await check('magia em área aplica defesas por alvo e a interface adiciona/remove defesas', async () => {
  const r = await page.evaluate(() => {
    setAppMode('setup');
    const u = STATE.units[1];
    u.resistances = []; u.weaknesses = []; u.immunities = [];
    STATE.selectedUnitId = u.id;
    syncInspectorUI();
    document.getElementById('defenseKind').value = 'resistances';
    document.getElementById('defenseType').value = 'físico';
    document.getElementById('defenseValue').value = '4';
    addDefenseToSelectedUnit();
    document.getElementById('defenseKind').value = 'immunities';
    document.getElementById('defenseType').value = 'veneno';
    addDefenseToSelectedUnit();
    const added = { res: JSON.parse(JSON.stringify(u.resistances)), imm: [...u.immunities], rows: document.querySelectorAll('#defenseList .rune-row').length };
    removeDefense('immunities', 0);
    const after = { imm: [...u.immunities], rows: document.querySelectorAll('#defenseList .rune-row').length };

    const [caster, , other] = STATE.units;
    caster.col = 0; caster.row = 0; caster.actions = 3;
    const sp = normalizeSpell({ name: 'Brasas', cost: 2, range: 18, areaType: 'burst', areaSize: 9, dmgDie: '1d6', dmgType: 'fogo', manual: true, atkBonus: 100 });
    caster.spells.push(sp);
    other.col = 2; other.row = 0; other.hp = other.maxHp = 500; other.ac = 1; other.immunities = ['fogo']; other.resistances = []; other.weaknesses = [];
    const orig = Math.random; Math.random = () => 0.999;
    executeSpellCastOnCell(caster, sp, { col: 2, row: 0 }, other, false);
    Math.random = orig;
    return { added, after, immuneLost: 500 - other.hp };
  });
  assert.deepEqual(r.added.res, [{ type: 'físico', value: 4 }]);
  assert.deepEqual(r.added.imm, ['veneno']);
  assert.equal(r.added.rows, 2);
  assert.deepEqual(r.after.imm, []);
  assert.equal(r.after.rows, 1);
  assert.equal(r.immuneLost, 0, 'alvo imune a fogo não sofre dano da magia de fogo');
});

await check('tooltip do alvo mostra defesas e prévia do ataque com números corretos', async () => {
  const pos = await page.evaluate(() => {
    const att = STATE.units[0], gob = STATE.units[1];
    gob.resistances = [{ type: 'físico', value: 3 }]; gob.weaknesses = [{ type: 'fogo', value: 5 }]; gob.immunities = ['veneno']; gob.hp = gob.maxHp = 40;
    recalculateUnitFromSheet(gob, false); gob.sheet.armorItemBonus += 17 - gob.ac; recalculateUnitFromSheet(gob, false);
    att.weapons[0] = normalizeWeapon({ name: 'Espada Flamejante', dmgDie: '1d8', dmgBonus: 4, dmgType: 'cortante', manual: true, atkBonus: 12,
      extra: [{ name: 'Flamejante', die: '1d6', type: 'fogo' }] });
    att.strikesMade = 0; att.hp = att.maxHp;
    setAppMode('combat'); selectActiveTurnUnit(att.id); selectCombatMainMenu('attack');
    const c = getCellPixelCenter(gob.col, gob.row);
    const r = document.getElementById('battleCanvas').getBoundingClientRect();
    return { x: r.left + c.x, y: r.top + c.y };
  });
  await page.mouse.move(pos.x - 30, pos.y);
  await page.mouse.move(pos.x, pos.y);
  const text = await page.evaluate(() => document.getElementById('unitTip').innerText);
  assert.match(text, /res\. físico 3/);
  assert.match(text, /fraq\. fogo 5/);
  assert.match(text, /imune a veneno/);
  assert.match(text, /Acerto\s+80%/);
  assert.match(text, /Crítico\s+30%/);
  assert.match(text, /Dano médio\s+15/);
  await page.mouse.move(10, 10); // sai do tabuleiro
  const hidden = await page.evaluate(() => document.getElementById('unitTip').classList.contains('hidden'));
  assert.equal(hidden, true);
});

await check('importar imagem como token: reduz, recorta, alterna moldura e volta ao padrão', async () => {
  // gera um PNG grande (1200x800) no próprio navegador
  const b64 = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 800;
    const x = c.getContext('2d'); x.fillStyle = '#d33'; x.fillRect(0, 0, 1200, 800); x.fillStyle = '#fc0'; x.fillRect(400, 200, 400, 400);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.evaluate(() => { setAppMode('setup'); STATE.selectedUnitId = STATE.units[2].id; syncInspectorUI(); switchEditTab('base'); });
  await page.setInputFiles('#editTabBase input[type=file]', { name: 'arte.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') });
  await page.waitForFunction(() => selectedUnit().customTokenDataUrl);
  const r = await page.evaluate(async () => {
    const u = selectedUnit();
    const img = new Image(); img.src = u.customTokenDataUrl; await img.decode();
    const preview = document.getElementById('inspSculptPreview').innerHTML;
    const framed = preview.includes('clip-path') && preview.includes('<image');
    const label = document.getElementById('tokenSourceLabel').textContent;
    setCustomTokenFrame(false);
    const unframed = !document.getElementById('inspSculptPreview').innerHTML.includes('clip-path');
    const canvasImg = getUnitTokenImage(u.sculpt, u.customTokenDataUrl, customTokenOptions(u));
    removeCustomToken();
    return { w: img.naturalWidth, h: img.naturalHeight, framed, unframed, label, back: u.customTokenDataUrl, cachedKey: !!canvasImg,
      btnHidden: document.getElementById('btnRemoveToken').classList.contains('hidden'), after: document.getElementById('tokenSourceLabel').textContent };
  });
  assert.equal(Math.max(r.w, r.h), 384, 'lado maior reduzido para 384');
  assert.equal(r.w / r.h, 1.5, 'proporção preservada');
  assert.equal(r.framed, true);
  assert.equal(r.unframed, true);
  assert.equal(r.label, 'Imagem personalizada');
  assert.equal(r.back, null);
  assert.equal(r.btnHidden, true);
  assert.equal(r.after, 'Ilustração padrão');
});

await check('arquivo que não é imagem é recusado com aviso e sem alterar a peça', async () => {
  await page.evaluate(() => { STATE.selectedUnitId = STATE.units[2].id; syncInspectorUI(); });
  await page.setInputFiles('#editTabBase input[type=file]', { name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') });
  await page.waitForTimeout(200);
  const r = await page.evaluate(() => ({ custom: selectedUnit().customTokenDataUrl, log: document.getElementById('logPeek').textContent }));
  assert.equal(r.custom, null);
  assert.match(r.log, /não é uma imagem/);
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
