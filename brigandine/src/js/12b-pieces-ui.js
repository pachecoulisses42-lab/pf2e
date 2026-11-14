/* ============================================================================
   15b. PEÇAS NOVAS E IMPORTADAS — criar do zero, importar lista, API de módulos
   ============================================================================ */

/** Rascunho do formulário "Criar peça do zero". manual = o usuário escolheu o token. */
const newPieceDraft = { sculpt: 'guerreiro', manual: false };

function syncNewPieceForm() {
  const lvl = document.getElementById('npLevel');
  if (lvl && !lvl.options.length) {
    for (let i = 1; i <= 20; i++) lvl.add(new Option(`Nível ${i}`, String(i)));
    lvl.value = '1';
  }
  const draft = readNewPieceForm();
  if (!newPieceDraft.manual) newPieceDraft.sculpt = suggestTokenKey(draft);
  const hint = document.getElementById('npTokenHint');
  if (hint) hint.textContent = `${tokenDisplayName(newPieceDraft.sculpt)} · ${newPieceDraft.manual ? 'escolhido por você' : (matchTokenKey(draft) ? 'sugerido pelo nome' : 'padrão da facção')}`;
  const prev = document.getElementById('npTokenPreview');
  if (prev) prev.innerHTML = getTokenPreviewHTML(newPieceDraft.sculpt, null, { faction: draft.faction });
  renderTokenPicker('np');
}

function readNewPieceForm() {
  return {
    name: document.getElementById('npName').value,
    className: document.getElementById('npClass').value,
    faction: document.getElementById('npFaction').value,
    level: parseInt(document.getElementById('npLevel').value, 10) || 1
  };
}

function pickNewPieceToken(key) {
  newPieceDraft.sculpt = key;
  newPieceDraft.manual = true;
  syncNewPieceForm();
}

function resetNewPieceToken() {
  newPieceDraft.manual = false;
  syncNewPieceForm();
}

/** Cria um modelo com ficha básica do nível escolhido e o token do rascunho. */
function createPieceFromScratch() {
  const draft = readNewPieceForm();
  if (!cleanText(draft.name)) {
    addLog('⚠️ Dê um nome à peça antes de criar.');
    document.getElementById('npName').focus();
    return;
  }
  const { template } = normalizePieceTemplate({
    ...draft, sculpt: newPieceDraft.sculpt,
    sheet: { level: draft.level, classHp: 8, attrs: { FOR: 2, DES: 2, CON: 1, INT: 0, SAB: 1, CAR: 0 }, prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 2, will: 2 } },
    weapons: [{ name: 'Espada Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }]
  }, new Set(UNIT_TEMPLATES.map(t => t.id)));
  UNIT_TEMPLATES.push(template);
  STATE.selectedTemplateId = template.id;
  setSetupTool('piece');
  renderPieceGallery();
  addLog(`✨ Peça <strong>${escapeHtml(template.name)}</strong> criada com o token ${escapeHtml(tokenDisplayName(template.sculpt))}. Clique no tabuleiro para posicionar; ficha, armas e token se editam no inspetor.`);
  document.getElementById('npName').value = '';
  document.getElementById('npClass').value = '';
  newPieceDraft.manual = false;
  syncNewPieceForm();
}

/**
 * Acrescenta peças de fora à galeria. Aceita lista, { pieces } ou { templates } (sem tabuleiro).
 * Devolve { added, suggested } — suggested = peças cujo token o app escolheu.
 */
function importPieces(data) {
  const list = extractPieceList(data);
  if (!list) throw new Error('formato não reconhecido: esperado uma lista de peças ou { "pieces": [...] }');
  const used = new Set(UNIT_TEMPLATES.map(t => t.id));
  let added = 0, suggested = 0;
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const { template, tokenSource } = normalizePieceTemplate(raw, used);
    UNIT_TEMPLATES.push(template);
    added++;
    if (tokenSource === 'sugestão') suggested++;
  }
  if (added) {
    STATE.selectedTemplateId = UNIT_TEMPLATES[UNIT_TEMPLATES.length - 1].id;
    renderPieceGallery();
  }
  return { added, suggested };
}

function importPiecesFile(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const r = importPieces(JSON.parse(e.target.result));
      addLog(`⬆️ ${r.added} peça(s) importada(s) para a galeria${r.suggested ? ` (${r.suggested} com token escolhido pelo nome/classe — troque na aba Base se quiser)` : ''}.`);
    } catch (err) {
      addLog(`⚠️ ${escapeHtml(file.name)}: ${escapeHtml(err.message)}`);
    }
  };
  reader.readAsText(file);
}

/**
 * Garante token válido em peças/modelos carregados (arquivos antigos ou de outros módulos):
 * chave desconhecida vira sugestão pelo nome; imagem própria é mantida.
 */
function repairPieceToken(p) {
  if (!p || typeof p !== 'object') return false;
  p.name = cleanText(p.name) || 'Peça';
  const hasImage = typeof p.customTokenDataUrl === 'string' && TOKEN_IMAGE_DATA_URL.test(p.customTokenDataUrl);
  if (!hasImage) p.customTokenDataUrl = null;
  if (isKnownTokenKey(p.sculpt)) return false;
  const r = resolvePieceToken(p);
  p.sculpt = r.sculpt;
  if (r.customTokenDataUrl) p.customTokenDataUrl = r.customTokenDataUrl;
  return true;
}

/* API para módulos futuros (outra aba, extensão ou script colado no console). */
window.Brigandine = Object.freeze({
  /** Acrescenta peças à galeria; mesmo formato do arquivo (docs/FORMATO-PECAS.md). */
  importPieces,
  /** Registra um grupo de imagens de token: { id, label, kind: 'topo'|'retrato', faction, items: [{ key, name, src }] }. */
  registerTokenGroup: (group) => { const n = registerTokenGroup(group); renderPieceGallery(); return n; },
  /** Chave de token sugerida para uma peça ({ name, className, ancestry, faction }). */
  suggestToken: (piece) => suggestTokenKey(piece),
  /** Todas as chaves de token disponíveis, com nome e origem. */
  listTokens: () => [
    ...appTokenList().map(([key, name]) => ({ key, name, source: 'app' })),
    ...Object.values(EXTRA_TOKENS).map(t => ({ key: t.key, name: t.name, source: t.kind }))
  ]
});
