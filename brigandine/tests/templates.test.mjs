import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplates } from './helpers/load-rules.mjs';

const T = loadTemplates();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plain = (v) => JSON.parse(JSON.stringify(v));
const templates = plain(T.UNIT_TEMPLATES);
const chibiKeys = Object.keys(T.CHIBI_SVGS);
const extraKeys = Object.keys(T.EXTRA_TOKENS);
const tokenFaction = (k) => (T.EXTRA_TOKENS[k] ? T.EXTRA_TOKENS[k].faction : (T.VILLAIN_SCULPTS.has(k) ? 'villain' : 'hero'));

test('todo token chibi tem uma peça (modelo) e toda peça aponta para um token existente', () => {
  const sculptsWithTemplate = new Set(templates.map(t => t.sculpt));
  for (const key of chibiKeys) assert.ok(sculptsWithTemplate.has(key), `token "${key}" está sem peça`);
  for (const t of templates) assert.ok(chibiKeys.includes(t.sculpt) || extraKeys.includes(t.sculpt), `modelo ${t.id} usa token inexistente "${t.sculpt}"`);
});

test('toda classe nova e todo vilão novo dos tokens pintados tem peça equipada', () => {
  // classes que já tinham peça usam o token pintado nas peças existentes
  const existing = ['barbaro', 'bardo', 'clerigo', 'druida', 'guerreiro', 'ladino', 'mago', 'feiticeiro', 'monge', 'paladino', 'bruxo'];
  const sculpts = new Set(templates.map(t => t.sculpt));
  const need = extraKeys.filter(k => /^(ct|vt)_/.test(k) && !existing.includes(k.slice(3)));
  assert.equal(need.length, 34);
  for (const k of need) assert.ok(sculpts.has(k), `token ${k} sem peça`);
});

test('todo token existe também na vista de cima, e vice-versa', () => {
  for (const key of chibiKeys) assert.equal(typeof T.TOPDOWN_SVGS[key], 'function', key);
  assert.deepEqual(Object.keys(T.TOPDOWN_SVGS).sort(), [...chibiKeys].sort());
});

test('o estilo medalhão aposentado cai na vista de cima', () => {
  assert.equal(Object.keys(T.TOKEN_STYLES).sort().join(), 'chibi,topo');
  T.setTokenStyle('medalhao');
  assert.equal(T.activeStyle(), 'topo');
  T.setTokenStyle('chibi');
});

test('os tokens vistos de cima renderizam SVG válido e com ids próprios', () => {
  for (const key of chibiKeys) {
    const svg = T.TOPDOWN_SVGS[key]();
    assert.match(svg, /^<svg viewBox="0 0 256 256"/, key);
    assert.ok(svg.includes(`t_${key}`), `${key}: id t_${key} ausente`);
    assert.ok(!/<(image|text)\b/.test(svg), `${key}: não use <image> nem <text>`);
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(svg.includes(`id="${m[1]}"`), `${key}: gradiente/filtro ${m[1]} sem definição`);
  }
});

test('os tokens renderizam SVG válido e com ids próprios', () => {
  for (const key of chibiKeys) {
    const svg = T.CHIBI_SVGS[key]();
    assert.match(svg, /^<svg viewBox="0 0 256 256"/, key);
    assert.ok(svg.includes(`c_${key}`), `${key}: id c_${key} ausente`);
    assert.ok(!/<(image|text)\b/.test(svg), `${key}: não use <image> nem <text>`);
    // todo url(#x) tem o id correspondente
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(svg.includes(`id="${m[1]}"`), `${key}: gradiente/filtro ${m[1]} sem definição`);
  }
});

test('ids de modelo são únicos e a facção bate com a lista de vilões', () => {
  const ids = templates.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of templates) {
    assert.equal(t.faction, tokenFaction(t.sculpt), `${t.id}: facção diferente da do token`);
  }
});

test('cada peça está equipada: arma válida, magias e itens do catálogo, defesas válidas', () => {
  for (const t of templates) {
    assert.ok(t.weapons.length >= 1, `${t.id} sem arma`);
    for (const w of t.weapons) {
      const n = plain(T.normalizeWeapon(w));
      assert.ok(T.isValidDice(n.dmgDie), `${t.id}/${n.name}: dado`);
      assert.ok(n.dmgType, `${t.id}/${n.name}: sem tipo de dano`);
      for (const x of n.extra) assert.ok(T.DAMAGE_TYPES.includes(x.type), `${t.id}/${n.name}: runa ${x.type}`);
    }
    for (const sp of t.spells) {
      const n = plain(T.normalizeSpell(sp));
      assert.ok(T.isValidDice(n.dmgDie) && n.dmgType, `${t.id}/${n.name}`);
    }
    for (const it of t.items) assert.ok(it.qty > 0 && it.name, `${t.id}: item`);
    const d = plain(T.normalizeDefenses({ resistances: t.resistances, weaknesses: t.weaknesses, immunities: t.immunities }));
    assert.equal(d.resistances.length, (t.resistances || []).length, `${t.id}: resistência inválida`);
    assert.equal(d.weaknesses.length, (t.weaknesses || []).length, `${t.id}: fraqueza inválida`);
    assert.equal(d.immunities.length, (t.immunities || []).length, `${t.id}: imunidade inválida`);
  }
});

test('a ficha de cada peça calcula PV e CA coerentes e declara o escudo', () => {
  for (const t of templates) {
    assert.ok(Number.isFinite(t.sheet.shieldBonus), `${t.id}: shieldBonus não definido`);
    const unit = plain({ ...t, hp: 1, maxHp: 1, ac: 0 });
    T.recalculateUnitFromSheet(unit, true);
    assert.ok(unit.maxHp >= 6 && unit.hp === unit.maxHp, `${t.id}: PV`);
    assert.ok(unit.ac >= 10 && unit.ac <= 30, `${t.id}: CA ${unit.ac}`);
    assert.ok(Object.keys(unit.sheet.attrs).length === 6, `${t.id}: atributos`);
  }
});

test('classes só usam magias coerentes: sem magia arcana em marcial e sem magia em marcial puro', () => {
  const noSpells = ['t_guerreiro', 't_barbaro', 't_ranger', 't_rogue', 't_espadachim', 't_orc', 't_esqueleto', 't_zumbi', 't_kobold', 't_goblin', 't_lobo', 't_bandido'];
  for (const id of noSpells) assert.equal(templates.find(t => t.id === id).spells.length, 0, `${id} não deveria ter magias`);
  const casters = { t_druida: 'espinhos_vivos', t_bruxa: 'maldicao_sombria', t_cultista: 'toque_sombrio', t_monge: 'rajada_de_ki', t_clerigo: 'lanca_divina' };
  for (const [id, spell] of Object.entries(casters)) {
    assert.ok(templates.find(t => t.id === id).spells.some(s => s.id === spell), `${id} sem ${spell}`);
  }
});

test('mortos-vivos têm as defesas de morto-vivo', () => {
  for (const id of ['t_esqueleto', 't_zumbi']) {
    const t = templates.find(x => x.id === id);
    assert.ok(t.immunities.includes('veneno') && t.immunities.includes('mental'), `${id}: imunidades`);
    assert.ok(t.weaknesses.some(w => w.type === 'vital'), `${id}: fraqueza a vital`);
  }
});

test('os seletores de token da interface listam todos os tokens', () => {
  const html = readFileSync(join(root, 'src/index.html'), 'utf8');
  for (const id of ['inspTokenSelect', 'newPieceSculpt']) {
    const select = html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`))[1];
    for (const key of chibiKeys) assert.ok(select.includes(`value="${key}"`), `${id} sem "${key}"`);
  }
});

test('tokens extras: manifesto válido, arquivos existem e chaves não colidem com as do app', () => {
  const dir = join(root, 'src/tokens-extra');
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
  const seen = new Set(chibiKeys);
  let total = 0;
  for (const g of manifest.groups) {
    assert.ok(['topo', 'retrato'].includes(g.kind), `${g.id}: kind inválido`);
    assert.ok(['hero', 'villain'].includes(g.faction), `${g.id}: facção inválida`);
    for (const it of g.items) {
      assert.match(it.key, /^[a-z][a-z0-9_]*$/, it.key);
      assert.ok(!seen.has(it.key), `chave repetida: ${it.key}`);
      seen.add(it.key);
      assert.ok(it.name && it.name.trim(), `${it.key} sem nome`);
      assert.ok(existsSync(join(dir, it.file)), `${it.key}: arquivo ${it.file} não existe`);
      total++;
    }
  }
  assert.equal(total, 90);
});

test('sugestão de token: nome, classe, inglês, específico vence genérico, facção como desempate', () => {
  const s = (p) => T.suggestTokenKey(p);
  assert.equal(s({ name: 'Goblin Xamã', faction: 'villain' }), 'vt_goblin_xama');
  assert.equal(s({ name: 'Goblin', faction: 'villain' }), 'goblin');
  assert.equal(s({ name: 'Lobo Alfa' }), 'vt_lobo_alfa');
  assert.equal(s({ name: 'Ezren', className: 'Wizard' }), 'mago');
  assert.equal(s({ name: 'Kyra', className: 'Cleric of Sarenrae' }), 'clerigo');
  assert.equal(s({ name: 'Lem', className: 'Bard' }), 'bardo');
  assert.equal(s({ name: 'Fumbus', className: 'Gunslinger' }), 'ct_pistoleiro');
  assert.equal(s({ name: 'Voz', ancestry: 'Kitsune', faction: 'hero' }), 'ct_kitsune');
  assert.equal(s({ name: 'Skeleton Guard', faction: 'enemy' }), 'esqueleto');
  assert.equal(s({ name: 'Ladino' }), 'rogue', 'empate entre app e extra prefere o do app');
  assert.equal(s({ name: 'Xyz' }), 'guerreiro');
  assert.equal(s({ name: 'Xyz', faction: 'villain' }), 'bandido');
  assert.equal(T.matchTokenKey({ name: 'Xyz' }), null);
  // palavra inteira: "orchestra" não é orc
  assert.equal(s({ name: 'Orchestra', faction: 'villain' }), 'bandido');
});

test('token de peça de fora: chave, nome por extenso, imagem e sugestão', () => {
  const plainR = (p) => plain(T.resolvePieceToken(p));
  assert.equal(plainR({ sculpt: 'cr_samurai' }).sculpt, 'cr_samurai');
  assert.equal(plainR({ token: 'Lobo Sombrio' }).sculpt, 'vt_lobo_sombrio');
  assert.equal(plainR({ sculpt: 'nao_existe', name: 'Orc Brutamontes', faction: 'villain' }).sculpt, 'orc');
  const img = 'data:image/png;base64,iVBORw0KGgo=';
  const r = plainR({ name: 'Herói', img });
  assert.equal(r.customTokenDataUrl, img);
  assert.equal(r.source, 'imagem');
  assert.equal(plainR({ name: 'X', img: 'https://exemplo.com/a.png' }).customTokenDataUrl, null, 'URL externa não vira token');
});

test('peça importada vira modelo completo, respeita PV/CA e não repete id', () => {
  const used = new Set(['t_guerreiro']);
  const a = plain(T.normalizePieceTemplate({ id: 'guerreiro', name: '<b>Valeros</b>', className: 'Fighter', level: 3, hp: 47, ac: 21,
    abilities: { str: 4, dex: 2, con: 3, int: 0, wis: 1, cha: 0 }, weapons: [{ name: 'Longsword', dmgDie: '1d8', dmgType: 'cortante' }],
    spells: ['bola_de_fogo', 'nao_existe'], items: ['pocao_menor', { id: 'x' }] }, used).template);
  assert.equal(a.id, 't_guerreiro_2');
  assert.ok(!/[<>]/.test(a.name), 'nome sem HTML');
  assert.equal(a.sculpt, 'guerreiro');
  assert.equal(a.sheet.attrs.FOR, 4);
  const u = { ...a, hp: 1 };
  T.recalculateUnitFromSheet(u, true);
  assert.ok(Math.abs(u.maxHp - 47) <= 3, `PV ${u.maxHp}`);
  assert.equal(u.ac, 21);
  assert.equal(a.spells.length, 1);
  assert.equal(a.items.length, 1);
  const b = plain(T.normalizePieceTemplate({ name: 'Coisa' }, used).template);
  assert.ok(b.weapons.length === 1 && b.sheet.level === 1 && b.faction === 'hero');
  assert.equal(T.extractPieceList([{ name: 'a' }]).length, 1);
  assert.equal(T.extractPieceList({ pieces: [{}] }).length, 1);
  assert.equal(T.extractPieceList({ templates: [{}], units: [] }), null, 'arquivo de tabuleiro não é lista de peças');
});

test('o pacote de JS do app compila (sem nomes globais repetidos entre módulos)', async () => {
  const { readdirSync } = await import('node:fs');
  const vm = await import('node:vm');
  const dir = join(root, 'src/js');
  const js = 'const EXTRA_TOKEN_GROUPS = [];\n' + readdirSync(dir).filter(f => f.endsWith('.js')).sort().map(f => readFileSync(join(dir, f), 'utf8')).join('\n');
  assert.doesNotThrow(() => new vm.Script(js, { filename: 'bundle.js' }));
});

test('tokens pintados em par (vista de cima ↔ retrato) acompanham o estilo dos tokens', () => {
  for (const t of Object.values(T.EXTRA_TOKENS)) {
    assert.ok(t.pair, `${t.key} sem par`);
    assert.equal(T.EXTRA_TOKENS[t.pair].pair, t.key);
    assert.notEqual(T.EXTRA_TOKENS[t.pair].kind, t.kind);
  }
  T.setTokenStyle('topo');
  assert.equal(T.effectiveTokenKey('cr_samurai'), 'ct_samurai');
  assert.equal(T.effectiveTokenKey('vt_lobo_alfa'), 'vt_lobo_alfa');
  assert.equal(T.effectiveTokenKey('guerreiro'), 'guerreiro');
  T.setTokenStyle('chibi');
  assert.equal(T.effectiveTokenKey('ct_samurai'), 'cr_samurai');
  assert.equal(T.effectiveTokenKey('vr_lobo_alfa'), 'vr_lobo_alfa');
  assert.ok(T.sameTokenFigure('ct_ninja', 'cr_ninja') && !T.sameTokenFigure('ct_ninja', 'cr_samurai'));
});
