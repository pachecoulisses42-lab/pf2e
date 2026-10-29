/* ============================================================================
   4c. PEÇAS DE FORA — token para peças criadas do zero ou importadas
   Qualquer peça (nova, de JSON antigo ou de um módulo futuro) passa por aqui:
   - um token conhecido (do app ou extra) é mantido;
   - uma imagem data:image/... vira token próprio;
   - senão, o token é sugerido pelo nome, classe e ancestralidade (português ou
     inglês) e, na falta de tudo, pela facção.
   Funções puras (sem DOM) para poderem ser testadas em Node.
   ============================================================================ */

/** Nomes e sinônimos (pt/en) dos tokens do app. Extras usam o próprio nome. */
const TOKEN_ALIASES = {
  guerreiro: ['Guerreiro', 'fighter', 'warrior', 'soldado', 'soldier'],
  paladino: ['Paladino', 'paladin', 'campeao', 'champion'],
  barbaro: ['Bárbaro', 'barbarian', 'berserker'],
  clerigo: ['Clérigo', 'cleric', 'sacerdote', 'priest'],
  bardo: ['Bardo', 'bard', 'menestrel'],
  feiticeiro: ['Feiticeiro', 'sorcerer', 'feiticeira'],
  mago: ['Mago', 'wizard', 'mage', 'maga', 'arcanista'],
  ranger: ['Ranger', 'patrulheiro', 'patrulheira', 'cacador', 'hunter'],
  rogue: ['Ladino', 'rogue', 'ladina', 'gatuno'],
  druida: ['Druida', 'druid'],
  monge: ['Monge', 'monk'],
  alquimista: ['Alquimista', 'alchemist'],
  bruxa: ['Bruxa', 'witch', 'bruxo', 'feiticeira das sombras'],
  espadachim: ['Espadachim', 'swashbuckler', 'duelista', 'duelist'],
  goblin: ['Goblin'],
  lobo: ['Lobo', 'wolf', 'lobo atroz', 'dire wolf', 'warg'],
  bandido: ['Bandido', 'bandit', 'salteador', 'brigand', 'mercenario', 'mercenary', 'thug'],
  esqueleto: ['Esqueleto', 'skeleton'],
  orc: ['Orc', 'orque'],
  cultista: ['Cultista', 'cultist', 'culto'],
  zumbi: ['Zumbi', 'zombie'],
  kobold: ['Kobold']
};

/** Sinônimos em inglês e variações para os extras (além do nome em português). */
const EXTRA_TOKEN_ALIASES = {
  ct_pistoleiro: ['gunslinger', 'pistoleira'],
  ct_invocador: ['summoner', 'invocadora'],
  ct_explorador: ['explorer', 'exploradora'],
  ct_arqueiro: ['archer', 'arqueira'],
  ct_cavaleiro: ['knight', 'cavaleira'],
  ct_cavaleiro_liberdade: ['liberator', 'libertador'],
  ct_ninja: ['ninja', 'shinobi'],
  ct_ranger_batalha: ['battle ranger'],
  ct_kitsune: ['kitsune', 'fox'],
  ct_kappa: ['kappa'],
  ct_tengu: ['tengu'],
  ct_ryu: ['ryu', 'dragonblood', 'sangue de dragao'],
  ct_samurai: ['samurai'],
  vt_goblin_xama: ['goblin shaman', 'goblin xama'],
  vt_goblin_chefe: ['goblin boss', 'goblin chief', 'goblin warchief'],
  vt_goblin_arqueiro: ['goblin archer'],
  vt_goblin_atirador: ['goblin sniper', 'goblin crossbow'],
  vt_goblin_lancador: ['goblin spear', 'goblin thrower'],
  vt_goblin_escudo: ['goblin shield'],
  vt_lobo_alfa: ['alpha wolf', 'lobo alfa'],
  vt_lobo_sombrio: ['shadow wolf'],
  vt_lobo_espectral: ['spectral wolf', 'ghost wolf'],
  vt_lobo_guerra: ['war wolf', 'warg de guerra'],
  vt_assassino: ['assassin', 'assassina'],
  vt_ladrao_comum: ['thief', 'ladrao'],
  vt_ladra: ['ladra', 'ladrona'],
  vt_lider_ladroes: ['thief leader', 'guildmaster', 'lider'],
  vt_ladra_sombria: ['shadow thief']
};

/** minúsculas, sem acento, só letras/números separados por espaço. */
function normalizeSearchText(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function appTokenKeys() {
  return typeof CHIBI_SVGS !== 'undefined' ? Object.keys(CHIBI_SVGS) : Object.keys(TOKEN_ALIASES);
}

function extraTokenMap() {
  return typeof EXTRA_TOKENS !== 'undefined' ? EXTRA_TOKENS : {};
}

/** O token existe (do app ou extra)? */
function isKnownTokenKey(key) {
  return typeof key === 'string' && (appTokenKeys().includes(key) || Object.prototype.hasOwnProperty.call(extraTokenMap(), key) ||
    (typeof T3D_TOKENS !== 'undefined' && Object.prototype.hasOwnProperty.call(T3D_TOKENS, key)));
}

/** Facção natural do token (para desempate da sugestão). */
function tokenFaction(key) {
  const extra = extraTokenMap()[key];
  if (extra) return extra.faction;
  return typeof VILLAIN_SCULPTS !== 'undefined' && VILLAIN_SCULPTS.has(key) ? 'villain' : 'hero';
}

/** Índice [key, alias normalizado] de todos os tokens. */
function tokenAliasIndex() {
  const out = [];
  for (const key of appTokenKeys()) for (const a of (TOKEN_ALIASES[key] || [key])) out.push([key, normalizeSearchText(a), false]);
  for (const [key, t] of Object.entries(extraTokenMap())) {
    for (const a of [t.name, ...(EXTRA_TOKEN_ALIASES[key] || [])]) out.push([key, normalizeSearchText(a), true]);
  }
  return out.filter(([, a]) => a);
}

/**
 * Token cujo nome/sinônimo aparece na peça, ou null. O campo decide primeiro (nome > classe >
 * ancestralidade/tipo > origem); no mesmo campo, alias mais longo ganha; empate prefere a facção
 * da peça e depois o token do app.
 */
function matchTokenKey(piece = {}) {
  const sheet = piece.sheet || {};
  const faction = normalizeFaction(piece.faction ?? piece.alliance ?? piece.disposition);
  const fields = [
    [piece.name, 4],
    [piece.className ?? piece.class ?? sheet.className, 3],
    [piece.ancestry ?? sheet.ancestry, 2],
    [Array.isArray(piece.traits) ? piece.traits.join(' ') : piece.traits, 2],
    [piece.type ?? piece.creatureType, 2],
    [sheet.background, 1]
  ].map(([t, w]) => [` ${normalizeSearchText(t)} `, w]).filter(([t]) => t.trim());
  let best = null;
  for (const [key, alias, extra] of tokenAliasIndex()) {
    for (const [text, w] of fields) {
      if (!text.includes(` ${alias} `)) continue;
      const score = w * 10000 + alias.length * 10 + (tokenFaction(key) === faction ? 3 : 0) + (extra ? 0 : 1);
      if (!best || score > best.score) best = { key, score };
    }
  }
  return best ? best.key : null;
}

/** Como matchTokenKey, mas sempre devolve um token: sem pista, cai no padrão da facção. */
function suggestTokenKey(piece = {}) {
  return matchTokenKey(piece) || (normalizeFaction(piece.faction ?? piece.alliance ?? piece.disposition) === 'villain' ? 'bandido' : 'guerreiro');
}

/** Aceita hero/villain e sinônimos comuns (pt/en, Foundry: -1 hostil). */
function normalizeFaction(f) {
  if (f === -1) return 'villain';
  const s = normalizeSearchText(f);
  return /^(villain|vilao|inimigo|enemy|hostile|hostil|monster|monstro|npc hostil)$/.test(s) ? 'villain' : 'hero';
}

const TOKEN_IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,]/i;

/**
 * Decide o token de uma peça vinda de fora. Campos aceitos, em ordem:
 * sculpt / token / tokenKey (chave ou nome), customTokenDataUrl / img / image (data URL).
 * Devolve { sculpt, customTokenDataUrl, customTokenFrame, source } — source: 'chave' | 'nome' | 'imagem' | 'sugestão'.
 */
function resolvePieceToken(raw = {}) {
  const frame = raw.customTokenFrame !== false && raw.tokenFrame !== false;
  const img = [raw.customTokenDataUrl, raw.img, raw.image, raw.token, raw.prototypeToken?.texture?.src]
    .find((v) => typeof v === 'string' && TOKEN_IMAGE_DATA_URL.test(v));
  const named = [raw.sculpt, raw.tokenKey, raw.token].find((v) => typeof v === 'string' && v && !TOKEN_IMAGE_DATA_URL.test(v));
  if (isKnownTokenKey(named)) {
    return { sculpt: named, customTokenDataUrl: img || null, customTokenFrame: frame, source: img ? 'imagem' : 'chave' };
  }
  // nome de token escrito por extenso ("Goblin Xamã") também vale
  const byName = named && matchTokenKey({ name: named, faction: raw.faction });
  const sculpt = byName || suggestTokenKey(raw);
  return { sculpt, customTokenDataUrl: img || null, customTokenFrame: frame, source: img ? 'imagem' : (byName ? 'nome' : 'sugestão') };
}

const IMPORT_ATTR_KEYS = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'];
const IMPORT_ATTR_ALIASES = { FOR: ['for', 'str', 'strength', 'forca'], DES: ['des', 'dex', 'dexterity', 'destreza'], CON: ['con', 'constitution', 'constituicao'], INT: ['int', 'intelligence', 'inteligencia'], SAB: ['sab', 'wis', 'wisdom', 'sabedoria'], CAR: ['car', 'cha', 'charisma', 'carisma'] };

function readAttrs(src) {
  const out = { FOR: 0, DES: 0, CON: 0, INT: 0, SAB: 0, CAR: 0 };
  if (!src || typeof src !== 'object') return out;
  for (const [k, v] of Object.entries(src)) {
    const nk = normalizeSearchText(k);
    const target = IMPORT_ATTR_KEYS.find((a) => IMPORT_ATTR_ALIASES[a].includes(nk));
    const n = Number(typeof v === 'object' && v ? (v.mod ?? v.value) : v);
    if (target && Number.isFinite(n)) out[target] = Math.max(-5, Math.min(7, Math.round(n)));
  }
  return out;
}

const clampInt = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};

/**
 * Converte uma peça de fora num modelo completo do Brigandine. Só `name` é obrigatório;
 * PV e CA informados são respeitados ajustando a ficha (PV de classe e bônus de armadura).
 */
function normalizePieceTemplate(raw = {}, usedIds = new Set()) {
  const name = cleanText(raw.name) || 'Peça importada';
  const faction = normalizeFaction(raw.faction ?? raw.alliance ?? raw.disposition);
  const src = raw.sheet && typeof raw.sheet === 'object' ? raw.sheet : {};
  const level = clampInt(raw.level ?? src.level, 1, 20, 1);
  const attrs = src.attrs ? readAttrs(src.attrs) : readAttrs(raw.attrs || raw.abilities);
  const prof = { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 2, will: 2, ...(src.prof || {}) };
  const sheet = {
    ancestry: cleanText(raw.ancestry ?? src.ancestry) || (faction === 'villain' ? 'Criatura' : 'Humano'),
    background: cleanText(src.background ?? raw.background) || 'Importado',
    className: cleanText(raw.className ?? raw.class ?? src.className) || 'Aventureiro',
    level, keyAttr: IMPORT_ATTR_KEYS.includes(src.keyAttr) ? src.keyAttr : IMPORT_ATTR_KEYS.reduce((a, b) => (attrs[b] > attrs[a] ? b : a), 'FOR'),
    ancestryHp: clampInt(src.ancestryHp, 0, 20, 8),
    classHp: clampInt(src.classHp, 1, 20, 8),
    armorItemBonus: clampInt(src.armorItemBonus, 0, 10, 1),
    dexCap: clampInt(src.dexCap, 0, 10, 3),
    shieldBonus: clampInt(src.shieldBonus ?? raw.shieldBonus, 0, 5, 0),
    attrs, prof,
    skills: (Array.isArray(src.skills ?? raw.skills) ? (src.skills ?? raw.skills) : []).map(cleanText).filter(Boolean),
    feats: (Array.isArray(src.feats ?? raw.feats) ? (src.feats ?? raw.feats) : []).map(cleanText).filter(Boolean)
  };
  // PV/CA declarados (sem ficha própria): ajusta a ficha para reproduzi-los
  const hp = Number(raw.maxHp ?? raw.hp);
  if (!src.classHp && Number.isFinite(hp) && hp > 0) sheet.classHp = Math.max(1, Math.min(20, Math.round((hp - sheet.ancestryHp) / level - attrs.CON)));
  const ac = Number(raw.ac);
  if (src.armorItemBonus === undefined && Number.isFinite(ac) && ac > 0) {
    sheet.armorItemBonus = Math.max(0, Math.min(10, Math.round(ac - 10 - calcProfBonus(prof.armor, level) - Math.min(attrs.DES, sheet.dexCap))));
  }

  const asList = (v) => (Array.isArray(v) ? v : []);
  let weapons = asList(raw.weapons ?? raw.attacks).filter((w) => w && typeof w === 'object').map(normalizeWeapon);
  if (weapons.length === 0) weapons = [normalizeWeapon({ name: faction === 'villain' ? 'Garras' : 'Punhos', dmgDie: '1d4', reach: 1.5, dmgType: faction === 'villain' ? 'cortante' : 'contundente' })];
  const spells = asList(raw.spells).map((s) => (typeof s === 'string' ? SPELL_CATALOG[s] : s)).filter((s) => s && typeof s === 'object').map((s) => normalizeSpell({ ...s }));
  const items = asList(raw.items).map((it) => (typeof it === 'string' ? ITEM_CATALOG[it] : it))
    .filter((it) => it && typeof it === 'object' && ITEM_CATALOG[it.id]).map((it) => ({ ...ITEM_CATALOG[it.id], qty: clampInt(it.qty, 1, 99, ITEM_CATALOG[it.id].qty) }));

  let id = /^[\w-]{1,60}$/.test(raw.id || '') ? raw.id : `t_imp_${normalizeSearchText(name).replace(/ /g, '_').slice(0, 30) || 'peca'}`;
  if (!id.startsWith('t_')) id = `t_${id}`;
  let n = 2;
  const base = id;
  while (usedIds.has(id)) id = `${base}_${n++}`;
  usedIds.add(id);

  const token = resolvePieceToken({ ...raw, faction });
  const tpl = {
    id, name, faction,
    ...(normalizeSearchText(raw.category) === 'animal' ? { category: 'animal' } : {}),
    ...(normalizeSearchText(raw.category) === '3d' ? { category: '3d' } : {}),
    sculpt: token.sculpt,
    customTokenDataUrl: token.customTokenDataUrl,
    customTokenFrame: token.customTokenFrame,
    moveSpeed: clampInt(raw.moveSpeed ?? raw.speed, 1, 30, 9),
    maxHp: 1, ac: 10, sheet, weapons, spells, items,
    resistances: raw.resistances, weaknesses: raw.weaknesses, immunities: raw.immunities
  };
  normalizeDefenses(tpl);
  const probe = JSON.parse(JSON.stringify(tpl));
  recalculateUnitFromSheet(probe, true);
  tpl.maxHp = probe.maxHp;
  tpl.ac = probe.ac;
  return { template: tpl, tokenSource: token.source };
}

/** Lê o formato de peças: lista, { pieces: [...] } ou { templates: [...] } sem tabuleiro. */
function extractPieceList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.pieces)) return data.pieces;
  if (data && Array.isArray(data.templates) && !data.units && !data.grid) return data.templates;
  return null;
}
