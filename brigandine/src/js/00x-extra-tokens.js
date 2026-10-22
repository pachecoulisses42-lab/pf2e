/* ============================================================================
   1f. TOKENS EXTRAS — imagens pintadas (vista de cima e retratos)
   As imagens ficam em src/tokens-extra/ e o build as embute em EXTRA_TOKEN_GROUPS
   (data URLs). Valem para qualquer estilo: escolher um extra numa peça troca só
   aquela peça. Vista de cima gira com a direção da peça; retrato ganha o aro.
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

/** SVG do token extra: vista de cima inteira (sem moldura) ou retrato dentro do aro. */
function extraTokenSVG(key, faction) {
  const t = EXTRA_TOKENS[key];
  return buildCustomTokenSVG(t.src, { faction: faction || t.faction, framed: t.kind === 'retrato' });
}

/** Nome de qualquer token (do app ou extra) para listas e dicas. */
function tokenDisplayName(key) {
  if (isExtraToken(key)) return EXTRA_TOKENS[key].name;
  const opt = document.querySelector(`#inspTokenSelect option[value="${key}"]`);
  return opt ? opt.textContent : key;
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
}

/* ---------------- Galeria visual (aba Base) ---------------- */

let tokenPickerTab = 'app';

function tokenPickerTabs() {
  return [{ id: 'app', label: 'Do app' }, { id: 'topo', label: 'Vista de cima' }, { id: 'retrato', label: 'Retratos' }];
}

/** Desenha a grade de miniaturas da aba atual, marcando o token da peça selecionada. */
function renderTokenPicker() {
  const box = document.getElementById('tokenPicker');
  if (!box) return;
  const u = STATE.units.find(x => x.id === STATE.selectedUnitId);
  const current = u && !u.customTokenDataUrl ? u.sculpt : null;
  const tabs = tokenPickerTabs().map(t =>
    `<button type="button" class="seg-btn${t.id === tokenPickerTab ? ' active' : ''}" onclick="setTokenPickerTab('${t.id}')">${t.label}</button>`).join('');
  const cell = (key, name, inner) =>
    `<button type="button" class="token-pick${key === current ? ' active' : ''}" title="${escapeHtml(name)}" aria-label="${escapeHtml(name)}" onclick="changeSelectedUnitToken('${key}')">${inner}</button>`;
  let body = '';
  if (tokenPickerTab === 'app') {
    const opts = Array.from(document.querySelectorAll('#inspTokenSelect optgroup:first-child option, #inspTokenSelect > option'));
    body = `<div class="token-pick-grid">${opts.map(o => cell(o.value, o.textContent, getTokenPreviewHTML(o.value))).join('')}</div>`;
  } else {
    body = EXTRA_TOKEN_GROUP_LIST.filter(g => g.kind === tokenPickerTab).map(g =>
      `<div class="token-pick-label">${escapeHtml(g.label)}</div><div class="token-pick-grid">${g.items.map(it =>
        cell(it.key, it.name, `<img src="${it.src}" alt="" loading="lazy" draggable="false">`)).join('')}</div>`).join('');
  }
  box.innerHTML = `<div class="seg seg-sm">${tabs}</div>${body}`;
}

function setTokenPickerTab(id) {
  tokenPickerTab = id;
  renderTokenPicker();
}

/** Abre a galeria já na aba do token atual. */
function syncTokenPickerTab(key) {
  tokenPickerTab = isExtraToken(key) ? EXTRA_TOKENS[key].kind : 'app';
}
