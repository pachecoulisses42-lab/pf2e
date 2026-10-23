/* ============================================================================
   1f. TOKENS EXTRAS — imagens pintadas (vista de cima e retratos)
   As imagens ficam em src/tokens-extra/ e o build as embute em EXTRA_TOKEN_GROUPS
   (data URLs). Escolher um extra numa peça troca só aquela peça. Vista de cima gira
   com a direção da peça; retrato ganha o aro.
   Pares: a mesma figura em vista de cima e em retrato (ct_x ↔ cr_x, vt_x ↔ vr_x, ou
   `pair` explícito) acompanha o estilo dos tokens — Vista de cima mostra a versão de
   cima; Chibi mostra o retrato frontal.
   ============================================================================ */
const EXTRA_TOKEN_GROUP_LIST = typeof EXTRA_TOKEN_GROUPS !== 'undefined' ? EXTRA_TOKEN_GROUPS : [];

/** key -> { key, name, src, kind: 'topo' | 'retrato', faction, group } */
const EXTRA_TOKENS = {};
for (const g of EXTRA_TOKEN_GROUP_LIST) {
  for (const it of g.items) EXTRA_TOKENS[it.key] = { ...it, kind: g.kind, faction: g.faction, group: g.id };
}

function isExtraToken(key) {
  return Object.prototype.hasOwnProperty.call(EXTRA_TOKENS, key);
}

/** Liga as duas versões da mesma figura: `pair` explícito ou prefixo trocado (ct_↔cr_, vt_↔vr_). */
function linkExtraTokenPairs() {
  for (const t of Object.values(EXTRA_TOKENS)) {
    if (t.pair && isExtraToken(t.pair)) continue;
    const m = t.key.match(/^([a-z]+)(t|r)_(.+)$/);
    const other = m && EXTRA_TOKENS[`${m[1]}${m[2] === 't' ? 'r' : 't'}_${m[3]}`];
    t.pair = other && other.kind !== t.kind ? other.key : null;
  }
  for (const t of Object.values(EXTRA_TOKENS)) if (t.pair) EXTRA_TOKENS[t.pair].pair = t.key;
}
linkExtraTokenPairs();

/**
 * Token que aparece de fato: para um extra com par, a versão do estilo ativo
 * (vista de cima no estilo "topo", retrato nos demais). Outros tokens: a própria chave.
 */
function effectiveTokenKey(key) {
  const t = isExtraToken(key) && EXTRA_TOKENS[key];
  if (!t || !t.pair) return key;
  const want = typeof activeTokenStyle !== 'undefined' && (activeTokenStyle === 'topo' || activeTokenStyle === 'celtopo') ? 'topo' : 'retrato';
  return t.kind === want ? key : t.pair;
}

/** As duas chaves representam a mesma figura? */
function sameTokenFigure(a, b) {
  return a === b || (isExtraToken(a) && EXTRA_TOKENS[a].pair === b);
}

/** SVG do token extra: vista de cima inteira (sem moldura) ou retrato dentro do aro. */
function extraTokenSVG(key, faction) {
  const t = EXTRA_TOKENS[key];
  return buildCustomTokenSVG(t.src, { faction: faction || t.faction, framed: t.kind === 'retrato' });
}

/** Nome de qualquer token (do app ou extra) para listas e dicas. */
function tokenDisplayName(key) {
  if (isExtraToken(key)) return EXTRA_TOKENS[key].name;
  if (is3DToken(key)) return T3D_TOKENS[key].name;
  return (TOKEN_ALIASES[key] || [key])[0];
}

/** Acrescenta os extras, em grupos, a um <select> de token que já lista os do app. */
function appendExtraTokenOptions(select) {
  if (!select || select.dataset.extras) return;
  select.dataset.extras = '1';
  const base = document.createElement('optgroup');
  base.label = 'Do app (segue o estilo)';
  while (select.firstChild) base.appendChild(select.firstChild);
  select.appendChild(base);
  for (const g of EXTRA_TOKEN_GROUP_LIST) {
    const og = document.createElement('optgroup');
    og.label = g.label;
    for (const it of g.items) {
      const o = document.createElement('option');
      o.value = it.key;
      o.textContent = it.name;
      og.appendChild(o);
    }
    select.appendChild(og);
  }
  const og3 = document.createElement('optgroup');
  og3.label = 'Tokens 3D (animados)';
  for (const [key, t] of Object.entries(T3D_TOKENS)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = t.name;
    og3.appendChild(o);
  }
  select.appendChild(og3);
}

/* ---------------- Galeria visual de tokens ----------------
   Usada em dois lugares: aba Base (token da peça selecionada) e "Criar peça do zero"
   (token do rascunho). Cada galeria lembra a própria aba. */

const TOKEN_PICKERS = {
  insp: {
    box: 'tokenPicker', tab: 'app',
    current: () => { const u = STATE.units.find(x => x.id === STATE.selectedUnitId); return u && !u.customTokenDataUrl ? u.sculpt : null; },
    pick: (key) => changeSelectedUnitToken(key)
  },
  np: {
    box: 'npTokenPicker', tab: 'app',
    current: () => newPieceDraft.sculpt,
    pick: (key) => pickNewPieceToken(key)
  }
};

function tokenPickerTabs() {
  return [{ id: 'app', label: 'Do app' }, { id: '3d', label: 'Tokens 3D' }, { id: 'topo', label: 'Vista de cima' }, { id: 'retrato', label: 'Retratos' }];
}

/** Lista [key, nome] dos tokens do app (os que seguem o estilo ativo). */
function appTokenList() {
  return Object.keys(SCULPT_SVGS).map(k => [k, (TOKEN_ALIASES[k] || [k])[0]]);
}

/** Desenha a grade de miniaturas da aba atual, marcando o token em uso. */
function renderTokenPicker(id = 'insp') {
  const cfg = TOKEN_PICKERS[id];
  const box = cfg && document.getElementById(cfg.box);
  if (!box) return;
  const current = cfg.current();
  const tabs = tokenPickerTabs().map(t =>
    `<button type="button" class="seg-btn${t.id === cfg.tab ? ' active' : ''}" onclick="setTokenPickerTab('${t.id}', '${id}')">${t.label}</button>`).join('');
  const cell = (key, name, inner) =>
    `<button type="button" class="token-pick${current && sameTokenFigure(key, current) ? ' active' : ''}" title="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" onclick="TOKEN_PICKERS['${id}'].pick('${key}')">${inner}</button>`;
  let body = '';
  if (cfg.tab === 'app') {
    body = `<div class="token-pick-grid">${appTokenList().map(([k, name]) => cell(k, name, getTokenPreviewHTML(k))).join('')}</div>`;
  } else if (cfg.tab === '3d') {
    body = `<div class="token-pick-grid">${Object.entries(T3D_TOKENS).map(([k, t]) => cell(k, t.name, getTokenPreviewHTML(k))).join('')}</div>`;
  } else {
    body = EXTRA_TOKEN_GROUP_LIST.filter(g => g.kind === cfg.tab).map(g =>
      `<div class="token-pick-label">${escapeHtml(g.label)}</div><div class="token-pick-grid">${g.items.map(it =>
        cell(it.key, it.name, `<img src="${it.src}" alt="" loading="lazy" draggable="false">`)).join('')}</div>`).join('');
  }
  const note = cfg.tab === 'app' ? '' : cfg.tab === '3d' ? '<p class="hint">Bonecos 3D animados: respiram parados, andam ao mover e fazem o gesto de ataque, magia e item. Giram com a direção da peça.</p>' : '<p class="hint">Cada figura tem vista de cima e retrato: a peça mostra a versão que combina com o Estilo dos tokens.</p>';
  box.innerHTML = `<div class="seg seg-sm">${tabs}</div>${note}${body}`;
}

function setTokenPickerTab(tab, id = 'insp') {
  TOKEN_PICKERS[id].tab = tab;
  renderTokenPicker(id);
}

/** Abre a galeria na aba do token atual. */
function syncTokenPickerTab(key, id = 'insp') {
  TOKEN_PICKERS[id].tab = isExtraToken(key) ? EXTRA_TOKENS[key].kind : is3DToken(key) ? '3d' : 'app';
}

/**
 * Acrescenta um grupo de tokens em tempo de execução (para módulos futuros).
 * group = { id, label, kind: 'topo' | 'retrato', faction, items: [{ key, name, src }] } com src data:image/...
 */
function registerTokenGroup(group) {
  if (!group || !Array.isArray(group.items) || !['topo', 'retrato'].includes(group.kind)) throw new Error('grupo de tokens inválido');
  const items = group.items.filter(it => it && /^[a-z][a-z0-9_]*$/.test(it.key) && !isKnownTokenKey(it.key) && /^data:image\//.test(it.src))
    .map(it => ({ key: it.key, name: cleanText(it.name) || it.key, src: it.src, ...(typeof it.pair === 'string' ? { pair: it.pair } : {}) }));
  const g = { id: String(group.id || `grupo_${EXTRA_TOKEN_GROUP_LIST.length + 1}`), label: cleanText(group.label) || 'Tokens de módulo', kind: group.kind, faction: group.faction === 'villain' ? 'villain' : 'hero', items };
  EXTRA_TOKEN_GROUP_LIST.push(g);
  for (const it of items) EXTRA_TOKENS[it.key] = { ...it, kind: g.kind, faction: g.faction, group: g.id };
  linkExtraTokenPairs();
  for (const sel of ['inspTokenSelect', 'newPieceSculpt']) {
    const el = document.getElementById(sel);
    if (!el) continue;
    const og = document.createElement('optgroup');
    og.label = g.label;
    for (const it of items) { const o = document.createElement('option'); o.value = it.key; o.textContent = it.name; og.appendChild(o); }
    el.appendChild(og);
  }
  return items.length;
}
