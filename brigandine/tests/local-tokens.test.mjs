import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplates } from './helpers/load-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const recipe = JSON.parse(readFileSync(join(root, 'scripts/tokens-locais/abyssal-corsair.json'), 'utf8'));
const plain = (v) => JSON.parse(JSON.stringify(v));

test('pacote local: sem build local, nenhuma peça nem token do pacote entra no app', () => {
  const T = loadTemplates();
  assert.equal(plain(T.UNIT_TEMPLATES).filter(t => t.id.startsWith('tac_')).length, 0);
  assert.equal(Object.keys(T.EXTRA_TOKENS).filter(k => k.startsWith('ac_')).length, 0);
  // as imagens não ficam no repositório nem no app público
  assert.ok(readFileSync(join(root, '.gitignore'), 'utf8').includes('src/tokens-local/'));
  const dist = join(root, 'dist/brigandine_pf2e_tatico_v5.html');
  if (existsSync(dist)) assert.ok(!readFileSync(dist, 'utf8').includes('"ac_kaelen_'), 'app público sem tokens do pacote');
});

test('pacote local: com as imagens, as 5 peças da receita entram com ficha válida', () => {
  const variants = Object.keys(recipe.variants);
  const items = Object.values(recipe.characters).flatMap(ch => variants.map(v => ({ key: `${ch.key}_${v}`, name: ch.name, file: 'x.webp' })));
  const T = loadTemplates({ extraGroups: [{ ...recipe.group, items }], localPieces: recipe.pieces });
  const pieces = plain(T.UNIT_TEMPLATES).filter(t => t.id.startsWith('tac_'));
  assert.equal(pieces.length, 5);
  for (const p of pieces) {
    assert.ok(T.isKnownTokenKey(p.sculpt), p.sculpt);
    assert.ok(p.maxHp > 20 && p.ac >= 15 && p.weapons.length >= 1, p.id);
    for (const w of p.weapons) assert.ok(T.isValidDice(w.dmgDie), `${p.id} ${w.name}`);
  }
  // peça cujo token não foi importado não entra
  const T2 = loadTemplates({ localPieces: recipe.pieces });
  assert.equal(plain(T2.UNIT_TEMPLATES).filter(t => t.id.startsWith('tac_')).length, 0);
});
