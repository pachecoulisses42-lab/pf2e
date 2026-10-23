/* ============================================================================
   4e. PEÇAS EM PIXEL ART (categoria 'pixel') — protótipo "Pixel Tokens v2"
   Os 4 personagens que vieram inteiros no pacote. Fichas PF2e Remaster de nível 3;
   PV e CA saem da ficha. Ficam na seção "Pixel art" da gaveta Personagens.
   ============================================================================ */
(() => {
  const piece = ({ id, name, sculpt, faction = 'hero', moveSpeed = 9, sheet, weapons, spells = [], items = [] }) => {
    const t = {
      id, name, sculpt, faction, moveSpeed, maxHp: 1, ac: 10, category: 'pixel',
      sheet: { level: 3, shieldBonus: 0, dexCap: 5, armorItemBonus: 0, skills: [], feats: [], ...sheet },
      weapons, spells, items
    };
    const probe = JSON.parse(JSON.stringify(t));
    recalculateUnitFromSheet(probe, true);
    t.maxHp = probe.maxHp;
    t.ac = probe.ac;
    return t;
  };
  const attrs = (FOR, DES, CON, INT, SAB, CAR) => ({ FOR, DES, CON, INT, SAB, CAR });
  const prof = (armor, weapon, spell, perception, fort, ref, will) => ({ armor, weapon, spell, perception, fort, ref, will });
  const I = (key, qty) => ({ ...ITEM_CATALOG[key], ...(qty ? { qty } : {}) });

  UNIT_TEMPLATES.push(
    piece({
      id: 'tpx_aventureiro', name: 'Aventureiro', sculpt: 'px_aventureiro', moveSpeed: 12,
      sheet: { ancestry: 'Humano', background: 'Andarilho', className: 'Monge (Punhos)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, attrs: attrs(4, 3, 2, 0, 1, 0), prof: prof(4, 4, 0, 4, 4, 4, 4),
        skills: ['Atletismo (T)', 'Acrobacia (T)', 'Sobrevivência (T)'], feats: ['Rajada de Golpes (◆)', 'Postura do Lobo', 'Movimento Rápido'] },
      weapons: [{ name: 'Punhos Enfaixados', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 'tpx_cavaleiro_negro', name: 'Cavaleiro Negro', sculpt: 'px_cavaleiro_negro',
      sheet: { ancestry: 'Humano', background: 'Cavaleiro', className: 'Campeão (Obediência)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 6, dexCap: 0, shieldBonus: 0, attrs: attrs(4, 0, 2, 0, 1, 2), prof: prof(4, 2, 2, 2, 4, 2, 4),
        skills: ['Religião (T)', 'Intimidação (T)', 'Atletismo (T)'], feats: ['Golpe Retributivo', 'Aura de Coragem', 'Devoção'] },
      weapons: [{ name: 'Espada Longa Negra', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' }],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 'tpx_guardiao_dourado', name: 'Guardião Dourado', sculpt: 'px_guardiao_dourado', moveSpeed: 7.5,
      sheet: { ancestry: 'Anão', background: 'Guarda', className: 'Guardião (Guardian)', keyAttr: 'FOR',
        ancestryHp: 10, classHp: 12, armorItemBonus: 6, dexCap: 0, attrs: attrs(4, 0, 3, 0, 1, 0), prof: prof(4, 2, 0, 2, 4, 2, 4),
        skills: ['Atletismo (T)', 'Intimidação (T)', 'Medicina (T)'], feats: ['Interceptar Golpe', 'Provocar', 'Armadura Robusta'] },
      weapons: [{ name: 'Martelo de Guerra', dmgDie: '1d8', reach: 1.5, dmgType: 'contundente' }],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 'tpx_guardiao_verde', name: 'Guardião Verde', sculpt: 'px_guardiao_verde', moveSpeed: 7.5,
      sheet: { ancestry: 'Elfo', background: 'Sentinela', className: 'Guardião (Guardian)', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 12, armorItemBonus: 6, dexCap: 0, attrs: attrs(4, 1, 2, 0, 2, 0), prof: prof(4, 2, 0, 4, 4, 2, 4),
        skills: ['Atletismo (T)', 'Natureza (T)', 'Percepção (E)'], feats: ['Interceptar Golpe', 'Provocar', 'Muralha Viva'] },
      weapons: [{ name: 'Lança', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }],
      items: [I('pocao_menor', 1)]
    })
  );
})();
