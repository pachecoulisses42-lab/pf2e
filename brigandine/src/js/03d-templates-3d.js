/* ============================================================================
   4d. PEÇAS DOS TOKENS 3D — os 9 personagens animados (categoria '3d')
   Fichas PF2e Remaster de nível 3 (o Aprendiz é nível 2). PV e CA saem da ficha.
   O Guerreiro de Miniatura vem do protótipo "Pathfinder 3D Heroes" (00n).
   Ficam na seção "Tokens 3D" da gaveta Personagens.
   ============================================================================ */
(() => {
  const piece = ({ id, name, sculpt, faction = 'hero', moveSpeed = 9, sheet, weapons, spells = [], items = [] }) => {
    const t = {
      id, name, sculpt, faction, moveSpeed, maxHp: 1, ac: 10, category: '3d',
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
  const S = (key) => ({ ...SPELL_CATALOG[key] });
  const I = (key, qty) => ({ ...ITEM_CATALOG[key], ...(qty ? { qty } : {}) });

  UNIT_TEMPLATES.push(
    piece({
      id: 't3d_guerreiro_miniatura', name: 'Guerreiro de Miniatura', sculpt: 't3_guerreiro_miniatura',
      sheet: { ancestry: 'Humano', background: 'Soldado', className: 'Guerreiro (Fighter)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 5, dexCap: 1, shieldBonus: 2, attrs: attrs(4, 1, 2, 0, 1, 1), prof: prof(2, 4, 0, 4, 4, 2, 2),
        skills: ['Atletismo (E)', 'Intimidação (T)', 'Sociedade (T)'], feats: ['Ataque Reativo', 'Bloqueio com Escudo', 'Golpe Rápido'] },
      weapons: [{ name: 'Espada Longa', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' }],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't3d_elfo_chama', name: 'Elfo da Chama', sculpt: 't3_elfo_chama',
      sheet: { ancestry: 'Elfo', background: 'Acadêmico', className: 'Magus (Lâmina Flamejante)', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 8, armorItemBonus: 4, dexCap: 1, attrs: attrs(4, 1, 1, 3, 0, 0), prof: prof(2, 2, 2, 2, 4, 2, 4),
        skills: ['Arcanismo (T)', 'Atletismo (T)', 'Sociedade (T)'], feats: ['Golpe Conjurado (◆◆)', 'Arsenal Arcano', 'Lâmina Flamejante'] },
      weapons: [
        { name: 'Espada Flamejante', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante', extra: [{ name: 'Chama', die: '1d4', bonus: 0, type: 'fogo' }] },
        { name: 'Montante nas Costas', dmgDie: '1d12', reach: 1.5, dmgType: 'cortante' }
      ],
      spells: [S('chama_cristalina'), S('toque_chocante')],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't3d_ladina', name: 'Ladina Encapuzada', sculpt: 't3_ladina', moveSpeed: 9,
      sheet: { ancestry: 'Humana', background: 'Criminosa', className: 'Ladino (Ladrão)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 4, 1, 1, 1, 2), prof: prof(2, 2, 0, 4, 2, 4, 4),
        skills: ['Furtividade (E)', 'Ladroagem (E)', 'Acrobacia (T)', 'Enganação (T)'], feats: ['Ataque Furtivo 1d6', 'Mãos Leves', 'Golpe Ágil'] },
      weapons: [
        { name: 'Adaga', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' },
        { name: 'Adaga Arremessada', dmgDie: '1d4', reach: 3, dmgType: 'perfurante' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't3d_monge_laranja', name: 'Monge do Manto Laranja', sculpt: 't3_monge_laranja', moveSpeed: 12,
      sheet: { ancestry: 'Humano', background: 'Acólito', className: 'Monge (Punho de Ferro)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, attrs: attrs(3, 4, 2, 0, 2, 0), prof: prof(4, 4, 2, 4, 4, 4, 4),
        skills: ['Atletismo (T)', 'Acrobacia (T)', 'Religião (T)'], feats: ['Rajada de Golpes (◆)', 'Postura do Tigre', 'Movimento Rápido'] },
      weapons: [{ name: 'Golpe de Punho', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      spells: [S('rajada_de_ki')],
      items: [I('elixir_vida', 1)]
    }),
    piece({
      id: 't3d_sacerdote', name: 'Sacerdote', sculpt: 't3_sacerdote',
      sheet: { ancestry: 'Humano', background: 'Acólito', className: 'Clérigo (Enclausurado)', keyAttr: 'SAB',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 3, attrs: attrs(2, 1, 1, 0, 4, 1), prof: prof(2, 2, 4, 2, 2, 2, 4),
        skills: ['Religião (E)', 'Medicina (T)', 'Diplomacia (T)'], feats: ['Fonte Divina (Cura)', 'Domínio da Verdade', 'Cura Rápida'] },
      weapons: [{ name: 'Maça', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      spells: [S('julgamento_divino'), S('lanca_divina')],
      items: [I('pocao_moderada', 1), I('perg_cura', 1)]
    }),
    piece({
      id: 't3d_mago_branco', name: 'Mago Branco', sculpt: 't3_mago_branco', moveSpeed: 7.5,
      sheet: { ancestry: 'Humano', background: 'Eremita', className: 'Mago (Escola da Ars Grammatica)', keyAttr: 'INT',
        ancestryHp: 8, classHp: 6, armorItemBonus: 0, dexCap: 5, attrs: attrs(0, 2, 1, 4, 2, 0), prof: prof(2, 2, 4, 2, 2, 2, 4),
        skills: ['Arcanismo (E)', 'Ocultismo (T)', 'Natureza (T)'], feats: ['Escudo Arcano', 'Vínculo com o Cajado', 'Magia Ampliada'] },
      weapons: [{ name: 'Cajado da Estrela', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      spells: [S('relampago'), S('raio_arcano'), S('misseis_magicos')],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 't3d_monge_espada', name: 'Monge Espadachim', sculpt: 't3_monge_espada', moveSpeed: 12,
      sheet: { ancestry: 'Humano', background: 'Guerreiro de Templo', className: 'Monge (Armas Monásticas)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, attrs: attrs(4, 3, 2, 0, 2, 0), prof: prof(4, 4, 2, 4, 4, 4, 4),
        skills: ['Atletismo (T)', 'Acrobacia (T)', 'Intimidação (T)'], feats: ['Rajada de Golpes (◆)', 'Arma Monástica (Katana)', 'Postura da Garça'] },
      weapons: [
        { name: 'Katana', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' },
        { name: 'Golpe de Punho', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }
      ],
      spells: [S('rajada_de_ki')],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 't3d_monge_aprendiz', name: 'Monge Aprendiz', sculpt: 't3_monge_aprendiz', moveSpeed: 12,
      sheet: { level: 2, ancestry: 'Humano', background: 'Órfão do Mosteiro', className: 'Monge (Aprendiz)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, attrs: attrs(2, 4, 2, 0, 1, 1), prof: prof(4, 2, 0, 2, 4, 4, 4),
        skills: ['Acrobacia (T)', 'Atletismo (T)', 'Furtividade (T)'], feats: ['Rajada de Golpes (◆)', 'Passo Leve'] },
      weapons: [{ name: 'Golpe de Punho', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't3d_arqueira', name: 'Arqueira Élfica', sculpt: 't3_arqueira', moveSpeed: 9,
      sheet: { ancestry: 'Elfa', background: 'Batedora', className: 'Patrulheiro (Precisão)', keyAttr: 'DES',
        ancestryHp: 6, classHp: 10, armorItemBonus: 2, dexCap: 3, attrs: attrs(1, 4, 1, 1, 2, 0), prof: prof(2, 2, 0, 4, 4, 4, 2),
        skills: ['Sobrevivência (E)', 'Natureza (T)', 'Furtividade (T)'], feats: ['Caçar Presa (◆)', 'Tiro Duplo', 'Olhar Élfico'] },
      weapons: [
        { name: 'Arco Longo', dmgDie: '1d8', reach: 30, dmgType: 'perfurante' },
        { name: 'Espada Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }
      ],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 't3d_mago_cinza', name: 'Mago Cinzento', sculpt: 't3_mago_cinza', moveSpeed: 7.5,
      sheet: { ancestry: 'Elfo', background: 'Acadêmico', className: 'Mago (Evocação)', keyAttr: 'INT',
        ancestryHp: 6, classHp: 6, armorItemBonus: 0, dexCap: 5, attrs: attrs(0, 2, 1, 4, 1, 1), prof: prof(2, 2, 4, 2, 2, 2, 4),
        skills: ['Arcanismo (E)', 'Sociedade (T)', 'Ocultismo (T)'], feats: ['Escudo Arcano', 'Livro de Magias Ampliado', 'Evocação Potente'] },
      weapons: [{ name: 'Adaga', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }],
      spells: [S('bola_de_fogo'), S('estilhacos_de_gelo'), S('misseis_magicos')],
      items: [I('pocao_menor', 1)]
    })
  );
})();
