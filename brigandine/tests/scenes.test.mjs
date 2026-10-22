import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console });
for (const f of ['00z-token-loader.js', '01b-rules.js', '12d-scenes-model.js', '12e-scene-store.js']) {
  vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
}
const plain = (v) => JSON.parse(JSON.stringify(v));
const S = (code) => vm.runInContext(code, ctx);

const STATE = {
  grid: { type: 'hex', cols: 10, rows: 8, cellScale: 1.5, bgImageData: null },
  terrainMap: { '1,1': 'lama' }, objects: [{ id: 'o', type: 'pedra', col: 2, row: 2 }],
  effects: { escuridao: { '3,3': 1 } }, effectZones: [], layers: { terrain: 50, effects: 50, map: 0 },
  units: [{ id: 'u1', name: 'Kyra', faction: 'hero', hp: 30 }, { id: 'u2', name: 'Goblin', faction: 'villain', hp: 15 }],
  combat: { round: 3, activeUnitId: 'u2' }, flashLights: [], camera: { x: 1 }
};
ctx.TEST_STATE = STATE;

test('captura do tabuleiro: cópia independente, combate só quando pedido', () => {
  const b = plain(S('captureBoard(TEST_STATE)'));
  assert.equal(b.units.length, 2);
  assert.equal(b.combat, undefined);
  assert.equal(b.camera, undefined, 'câmera não faz parte da cena');
  const c = plain(S('captureBoard(TEST_STATE, true)'));
  assert.deepEqual(c.combat, { round: 3, activeUnitId: 'u2', mode: 'combat', flashLights: [] });
  S('const __b = captureBoard(TEST_STATE); __b.units[0].hp = 1;');
  assert.equal(STATE.units[0].hp, 30, 'alterar a cópia não mexe no tabuleiro');
});

test('impressão digital muda com o tabuleiro e ignora o estado de combate', () => {
  const a = S('boardFingerprint(captureBoard(TEST_STATE))');
  const withCombat = S('boardFingerprint(captureBoard(TEST_STATE, true))');
  assert.equal(a, withCombat);
  STATE.units[0].hp = 29;
  assert.notEqual(S('boardFingerprint(captureBoard(TEST_STATE))'), a);
  STATE.units[0].hp = 30;
});

test('nomes únicos, ordem e mover', () => {
  assert.equal(S("uniqueSceneName('Ponte', ['Taverna'])"), 'Ponte');
  assert.equal(S("uniqueSceneName('Ponte', ['ponte', 'Ponte (2)'])"), 'Ponte (3)');
  assert.equal(S("uniqueSceneName('Ponte (2)', ['Ponte (2)'])"), 'Ponte (3)');
  assert.equal(S("uniqueSceneName('  ', [])"), 'Cena');
  const metas = [{ id: 'a', order: 0, createdAt: 1 }, { id: 'b', order: 1, createdAt: 2 }, { id: 'c', order: 2, createdAt: 3 }];
  ctx.TEST_METAS = metas;
  assert.deepEqual(plain(S("moveScene(TEST_METAS, 'c', -1)")).map(m => m.id), ['a', 'c', 'b']);
  assert.deepEqual(plain(S("moveScene(TEST_METAS, 'a', -1)")).map(m => m.id), ['a', 'b', 'c'], 'topo não sobe');
});

test('cena: separar metadados e corpo, e juntar de volta', () => {
  const scene = plain(S("makeScene({ name: '<b>Ponte</b>', notes: 'Goblins', board: captureBoard(TEST_STATE), order: 2, now: 5 })"));
  assert.ok(scene.id.startsWith('sc_'));
  assert.ok(!/[<>]/.test(scene.name));
  assert.deepEqual(scene.stats, { heroes: 1, villains: 1, cols: 10, rows: 8 });
  ctx.TEST_SCENE = scene;
  const { meta, body } = plain(S('splitScene(TEST_SCENE)'));
  assert.equal(meta.snapshot, undefined);
  assert.equal(meta.hasProgress, false);
  assert.equal(body.snapshot.units.length, 2);
  const joined = plain(S('joinScene(splitScene(TEST_SCENE).meta, splitScene(TEST_SCENE).body)'));
  assert.deepEqual(joined, scene);
});

test('importar: campanha, cena única, tabuleiro comum; descarta lixo', () => {
  ctx.TEST_FILE = { kind: 'brigandine-campaign', scenes: [plain(S("makeScene({ name: 'A', board: captureBoard(TEST_STATE) })")), { name: 'lixo' }], library: [{ id: 't_x' }] };
  const camp = plain(S('parseScenesFile(TEST_FILE)'));
  assert.equal(camp.scenes.length, 1);
  assert.equal(camp.library.length, 1);
  ctx.TEST_FILE = { grid: STATE.grid, units: STATE.units, templates: [{ id: 't_y' }] };
  const board = plain(S('parseScenesFile(TEST_FILE)'));
  assert.equal(board.scenes.length, 1);
  assert.equal(board.scenes[0].name, 'Cena importada');
  assert.equal(board.library.length, 1);
  ctx.TEST_FILE = { kind: 'brigandine-scene', scene: { name: 'B', snapshot: { units: [] }, thumb: 'javascript:alert(1)' } };
  const one = plain(S('parseScenesFile(TEST_FILE)'));
  assert.equal(one.scenes[0].thumb, '', 'miniatura que não é imagem é descartada');
});

test('repositório de reserva (localStorage/memória): salvar, listar, abrir, ordenar, excluir, biblioteca', async () => {
  const store = S("makeKeyValueBackend(memoryStorage(), 'memory')");
  const scene = S("makeScene({ name: 'Ponte', board: captureBoard(TEST_STATE) })");
  await store.put(scene);
  scene.progress = S('captureBoard(TEST_STATE, true)');
  await store.put(scene);
  const metas = plain(await store.listMeta());
  assert.equal(metas.length, 1);
  assert.equal(metas[0].hasProgress, true);
  const got = plain(await store.get(scene.id));
  assert.equal(got.progress.combat.round, 3);
  await store.putMetas([{ ...metas[0], order: 7 }]);
  assert.equal(plain(await store.listMeta())[0].order, 7);
  await store.setKV('library', [{ id: 't_custom' }]);
  assert.deepEqual(plain(await store.getKV('library')), [{ id: 't_custom' }]);
  await store.remove(scene.id);
  assert.equal((await store.listMeta()).length, 0);
  assert.equal(await store.get(scene.id), null);
});
