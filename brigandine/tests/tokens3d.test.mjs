import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console });
for (const f of ['00k-t3d-engine.js', '00l-t3d-humanoid.js', '00m-t3d-tokens.js', '00n-t3d-proto-fighter.js']) {
  vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx);

/** Contexto 2D falso que guarda os polígonos desenhados. */
run(`var FAKE = { n: 0, bad: 0, save(){}, restore(){}, beginPath(){}, closePath(){}, fill(){ this.n++; }, stroke(){},
  moveTo(x, y){ if (!isFinite(x) || !isFinite(y)) this.bad++; }, lineTo(x, y){ if (!isFinite(x) || !isFinite(y)) this.bad++; } };`);

test('10 tokens 3D, cada um com nome e estilo de ataque', () => {
  const keys = run('Object.keys(T3D_TOKENS)');
  assert.equal(keys.length, 10);
  for (const k of keys) {
    assert.match(k, /^t3_[a-z_]+$/);
    assert.ok(run(`T3D_TOKENS.${k}.name`).length > 3);
    assert.ok(['sword', 'bow', 'staff', 'fist', 'dagger', 'proto'].includes(run(`t3dModel('${k}').style`)), k);
  }
});

test('todos os bonecos desenham todas as animações sem coordenadas inválidas', () => {
  for (const k of run('Object.keys(T3D_TOKENS)')) {
    for (const anim of run('T3D_ANIMS')) {
      for (const t of [0, 0.3, 0.7, 1.05, 2.4]) {
        run(`FAKE.n = 0; FAKE.bad = 0;
          var P = t3dPose('${anim}', ${t}, t3dModel('${k}').style);
          var A = t3dDraw(FAKE, t3dModel('${k}'), { x: 100, y: 100, scale: 30, yaw: 0.7, pose: P.pose, rootOffset: P.rootOffset, flags: P.flags });`);
        assert.equal(run('FAKE.bad'), 0, `${k} ${anim} ${t}`);
        assert.ok(run('FAKE.n') > 40, `${k} ${anim} desenhou faces`);
        assert.ok(run('isFinite(A.handL.x) && isFinite(A.handR.y)'), `${k} ${anim} mãos`);
      }
    }
  }
});

test('poses: magia acende as mãos, item mostra o frasco, andar mexe as pernas', () => {
  assert.ok(run("t3dPose('cast', 0.5, 'staff').flags.includes('cast')"));
  assert.ok(run("t3dPose('item', 0.5, 'fist').flags.includes('item')"));
  const a = run("t3dPose('walk', 0.1, 'sword').pose.legL[0]");
  const b = run("t3dPose('walk', 0.5, 'sword').pose.legL[0]");
  assert.notEqual(Math.sign(a), Math.sign(b));
  assert.equal(run("t3dPose('idle', 1, 'sword').pose.legL"), undefined);
});

test('girar o boneco (yaw) muda o desenho; o frasco só aparece no item', () => {
  run(`var pts = []; var REC = Object.assign({}, FAKE, { moveTo(x, y){ pts.push(x); }, lineTo(x){ pts.push(x); } });`);
  run(`pts = []; t3dDraw(REC, t3dModel('t3_arqueira'), { x: 0, y: 0, scale: 10, yaw: 0, ...t3dPose('idle', 0, 'bow') }); var s1 = pts.reduce((a, b) => a + b, 0);`);
  run(`pts = []; t3dDraw(REC, t3dModel('t3_arqueira'), { x: 0, y: 0, scale: 10, yaw: 1.5, ...t3dPose('idle', 0, 'bow') }); var s2 = pts.reduce((a, b) => a + b, 0);`);
  assert.notEqual(run('Math.round(s1)'), run('Math.round(s2)'));
  run(`FAKE.n = 0; t3dDraw(FAKE, t3dModel('t3_sacerdote'), { x: 0, y: 0, scale: 10, ...t3dPose('idle', 0, 'sword') }); var idleN = FAKE.n;`);
  run(`FAKE.n = 0; t3dDraw(FAKE, t3dModel('t3_sacerdote'), { x: 0, y: 0, scale: 10, ...t3dPose('item', 0.5, 'sword') }); var itemN = FAKE.n;`);
  assert.ok(run('itemN > idleN'), 'frasco aparece só no item');
});

test('guerreiro do protótipo: base de miniatura, escudo e espada, e as animações do original', () => {
  assert.equal(run("t3dModel('t3_guerreiro_miniatura').style"), 'proto');
  assert.ok(run("!!t3dFind(t3dModel('t3_guerreiro_miniatura').root, 'shield') && !!t3dFind(t3dModel('t3_guerreiro_miniatura').root, 'sword')"));
  for (const anim of ['idle', 'walk', 'run', 'attack', 'cast', 'item', 'hit', 'dead', 'victory']) {
    run(`FAKE.n = 0; FAKE.bad = 0; var P = t3dPose('${anim}', 0.6, 'proto');
      t3dDraw(FAKE, t3dModel('t3_guerreiro_miniatura'), { x: 0, y: 0, scale: 30, yaw: 0.4, ...P });`);
    assert.equal(run('FAKE.bad'), 0, anim);
    assert.ok(run('FAKE.n') > 40, anim);
  }
  // ataque levanta o braço da espada; morte tomba a figura; andar levanta a figura do chão
  assert.ok(run("t3dPose('attack', 0.55, 'proto').pose.armSword[2]") < -1.5);
  assert.ok(run("t3dPose('dead', 5, 'proto').pose.figure[2]") < -1.3);
  assert.ok(run("t3dPose('walk', 0.2, 'proto').offsets.figure[1]") > 0);
});
