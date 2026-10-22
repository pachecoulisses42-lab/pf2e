import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Carrega regras, grade e luz com um STATE mínimo (sem DOM). */
function loadEnv(gridType = 'square', cols = 12, rows = 12) {
  const ctx = vm.createContext({ console });
  ctx.STATE = {
    grid: { type: gridType, cols, rows, cellScale: 1.5 },
    camera: { x: 0, y: 0, zoom: 1, basePx: 60 },
    terrainMap: {}, objects: [], units: [], effects: { escuridao: {} }, effectZones: []
  };
  for (const f of ['01-catalog.js', '01b-rules.js', '01c-environment.js', '06-grid-and-ranges.js', '06b-shapes-and-light.js']) {
    vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}
const run = (ctx, code) => JSON.parse(JSON.stringify(vm.runInContext(code, ctx)));
const keys = (cells) => cells.map((c) => `${c.col},${c.row}`).sort();

test('formas: célula, quadrado, cone, linha e tudo', () => {
  const E = loadEnv();
  assert.deepEqual(keys(run(E, "shapeCells('cell', {col:2,row:2}, {col:2,row:2}, 0)")), ['2,2']);
  assert.equal(run(E, "shapeCells('square', {col:1,row:1}, {col:3,row:2}, 0)").length, 6);
  assert.equal(run(E, "shapeCells('all', {col:0,row:0}, {col:0,row:0}, 0)").length, 144);
  // cone de 4,5 m para leste a partir de (5,5): só células à direita, nada atrás
  const cone = run(E, "shapeCells('cone', {col:5,row:5}, {col:9,row:5}, 4.5)");
  assert.ok(cone.length > 3);
  assert.ok(cone.every((c) => c.col > 5), 'cone não vai para trás');
  assert.ok(keys(cone).includes('8,5'));
  const line = run(E, "shapeCells('line', {col:1,row:1}, {col:6,row:1}, 6)");
  assert.ok(keys(line).includes('1,1') && keys(line).includes('5,1') && line.every((c) => c.row === 1));
  const burst = run(E, "shapeCells('burst', {col:5,row:5}, {col:5,row:5}, 1.5)");
  assert.ok(keys(burst).includes('5,5') && burst.length === 9);
});

test('movimento: lama custa o dobro, pedra e abismo bloqueiam', () => {
  const E = loadEnv();
  vm.runInContext(`STATE.units = [{ id: 'u', col: 0, row: 0, hp: 10, moveSpeed: 3, actions: 3 }];
    STATE.terrainMap['1,0'] = 'lama'; STATE.terrainMap['0,1'] = 'abismo'; STATE.objects = [{ type: 'pedra', col: 1, row: 1 }];`, E);
  const reach = run(E, 'computeReachableCells(STATE.units[0])');
  assert.equal(reach['1,0'].meters, 3, 'lama = 2 × 1,5 m');
  assert.equal(reach['0,1'], undefined, 'abismo');
  assert.equal(reach['1,1'], undefined, 'pedra');
});

test('luz: tocha acesa em emanação, lanterna em cone pela direção, parede bloqueia', () => {
  const E = loadEnv();
  vm.runInContext(`STATE.units = [{ id: 'u', col: 5, row: 5, hp: 10, facing: 270, items: [
      { ...ITEM_CATALOG.tocha, lit: false }, { ...ITEM_CATALOG.lanterna, lit: false } ] }];`, E);
  assert.deepEqual(run(E, 'computeLightMap()'), {}, 'nada aceso, nada de luz');
  vm.runInContext('STATE.units[0].items[0].lit = true', E);
  let light = run(E, 'computeLightMap()');
  assert.equal(light['5,5'], 2);
  assert.equal(light['8,5'], 2, '4,5 m: luz plena (até 6 m)');
  assert.equal(light['5,11'], 1, '9 m: penumbra (até 12 m)');
  // parede entre a tocha e (9,5) bloqueia
  vm.runInContext("STATE.terrainMap['7,5'] = 'wall'", E);
  light = run(E, 'computeLightMap()');
  assert.equal(light['8,5'], undefined, 'atrás da parede fica escuro');
  assert.equal(light['7,5'], 2, 'a própria parede recebe luz');
  vm.runInContext("delete STATE.terrainMap['7,5']; STATE.units[0].items[0].lit = false; STATE.units[0].items[1].lit = true", E);
  light = run(E, 'computeLightMap()');
  assert.equal(light['11,5'], 2, 'lanterna para leste (direção 270°) ilumina a frente');
  assert.equal(light['2,5'], undefined, 'e não ilumina as costas');
  vm.runInContext('STATE.units[0].facing = 90', E);
  light = run(E, 'computeLightMap()');
  assert.equal(light['2,5'], 2, 'virou para oeste, a luz acompanha');
  assert.equal(light['9,5'], undefined);
});

test('escuridão: luz plena anula, penumbra reduz pela metade; emanação segue a peça', () => {
  const E = loadEnv();
  vm.runInContext(`for (const c of shapeCells('all', {col:0,row:0}, {col:0,row:0}, 0)) STATE.effects.escuridao[c.col + ',' + c.row] = 1;
    STATE.objects = [{ type: 'braseiro', col: 2, row: 2 }];`, E);
  const dark = run(E, 'computeDarknessMap()');
  assert.equal(dark['2,2'], undefined, 'luz plena: sem escuridão');
  assert.equal(dark['2,9'], 0.5, 'penumbra (10,5 m)');
  assert.equal(dark['11,11'], 1, 'longe: escuro');
  vm.runInContext(`STATE.effects.escuridao = {}; STATE.units = [{ id: 'u', col: 8, row: 8, hp: 5, items: [] }];
    STATE.effectZones = [{ type: 'escuridao', unitId: 'u', radius: 1.5 }];`, E);
  assert.ok(run(E, "[...effectCellSet('escuridao')]").includes('9,9'));
  vm.runInContext('STATE.units[0].col = 3; STATE.units[0].row = 8', E);
  const moved = run(E, "[...effectCellSet('escuridao')]");
  assert.ok(moved.includes('4,8') && !moved.includes('9,9'), 'a emanação foi junto com a peça');
});

test('hexágono: linha de visão em coordenadas cúbicas e luz bloqueada por muro', () => {
  const E = loadEnv('hex');
  const between = run(E, 'cellsBetween({col:0,row:0}, {col:4,row:0})');
  assert.deepEqual(keys(between), ['1,0', '2,0', '3,0']);
  vm.runInContext(`STATE.objects = [{ type: 'lampiao', col: 2, row: 4 }, { type: 'muro', col: 4, row: 4 }]`, E);
  const light = run(E, 'computeLightMap()');
  assert.equal(light['3,4'], 2);
  assert.equal(light['5,4'], undefined, 'atrás do muro');
});
