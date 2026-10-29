/* ============================================================================
   4f. PEÇAS DE PACOTES LOCAIS — só existem no build local (npm run build:local)
   Pacotes com licença que proíbe redistribuição (ex.: Abyssal Corsair Heroes) ficam
   fora do repositório: as imagens vão em src/tokens-local/ e as fichas vêm da receita
   em scripts/tokens-locais/. No build normal LOCAL_PIECES não existe e nada muda.
   ============================================================================ */
(() => {
  if (typeof LOCAL_PIECES === 'undefined') return;
  for (const p of LOCAL_PIECES) {
    if (!isKnownTokenKey(p.sculpt)) continue; // imagem não importada: a peça não entra
    const t = {
      id: p.id, name: p.name, sculpt: p.sculpt, faction: p.faction || 'hero', moveSpeed: p.moveSpeed || 9,
      maxHp: 1, ac: 10,
      sheet: { level: 3, shieldBonus: 0, dexCap: 5, armorItemBonus: 0, skills: [], feats: [], ...p.sheet },
      weapons: p.weapons || [],
      spells: (p.spells || []).filter(k => SPELL_CATALOG[k]).map(k => ({ ...SPELL_CATALOG[k] })),
      items: (p.items || []).filter(([k]) => ITEM_CATALOG[k]).map(([k, qty]) => ({ ...ITEM_CATALOG[k], ...(qty ? { qty } : {}) }))
    };
    const probe = JSON.parse(JSON.stringify(t));
    recalculateUnitFromSheet(probe, true);
    t.maxHp = probe.maxHp;
    t.ac = probe.ac;
    UNIT_TEMPLATES.push(t);
  }
})();
