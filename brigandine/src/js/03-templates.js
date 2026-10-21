/* ============================================================================
   4. 12 ARCHETYPE TEMPLATES WITH FULL PF2E REMASTER SHEETS (BUILDS)
   ============================================================================ */
let UNIT_TEMPLATES = [
  {
    id: 't_guerreiro', name: 'Guerreiro', sculpt: 'guerreiro', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 21,
    sheet: {
      ancestry: 'Humano', background: 'Guarda Real', className: 'Guerreiro (Fighter)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 4, dexCap: 1,
      attrs: { FOR: 4, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 4, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Atletismo (E)', 'Intimidação (T)', 'Acrobacia (T)'],
      feats: ['Golpe Intimidador', 'Ataque de Oportunidade', 'Escudo Reativo']
    },
    weapons: [
      { name: 'Espada Longa', atkBonus: 12, dmgDie: '1d8', dmgBonus: 4, reach: 1.5 },
      { name: 'Lança de Alcance', atkBonus: 12, dmgDie: '1d8', dmgBonus: 4, reach: 3 }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor }]
  },
  {
    id: 't_paladino', name: 'Paladino', sculpt: 'paladino', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 21,
    sheet: {
      ancestry: 'Humano', background: 'Acólito Marcial', className: 'Campeão (Paladino)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 5, dexCap: 1,
      attrs: { FOR: 4, DES: 1, CON: 2, INT: 0, SAB: 1, CAR: 2 },
      prof: { armor: 4, weapon: 2, spell: 2, perception: 2, fort: 4, ref: 2, will: 4 },
      skills: ['Religião (T)', 'Atletismo (T)', 'Diplomacia (T)'],
      feats: ['Golpe Retributivo', 'Imposição de Mãos', 'Devoção Divina']
    },
    weapons: [
      { name: 'Espada Sagrada', atkBonus: 10, dmgDie: '1d8', dmgBonus: 4, reach: 1.5 },
      { name: 'Lança Radiante', atkBonus: 10, dmgDie: '1d8', dmgBonus: 4, reach: 3 }
    ],
    spells: [{ ...SPELL_CATALOG.julgamento_divino }, { ...SPELL_CATALOG.toque_chocante }],
    items: [{ ...ITEM_CATALOG.pocao_moderada, qty: 1 }, { ...ITEM_CATALOG.perg_cura, qty: 1 }]
  },
  {
    id: 't_barbaro', name: 'Bárbaro', sculpt: 'barbaro', faction: 'hero', moveSpeed: 9, maxHp: 53, ac: 19,
    sheet: {
      ancestry: 'Orc', background: 'Nômade Feroz', className: 'Bárbaro (Fúria)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 12, armorItemBonus: 3, dexCap: 2,
      attrs: { FOR: 4, DES: 1, CON: 3, INT: -1, SAB: 1, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 2, will: 4 },
      skills: ['Atletismo (E)', 'Intimidação (T)', 'Sobrevivência (T)'],
      feats: ['Fúria Instintiva', 'Investida Súbita', 'Ferocidade Orc']
    },
    weapons: [
      { name: 'Machado Grande', atkBonus: 10, dmgDie: '1d12', dmgBonus: 6, reach: 1.5 },
      { name: 'Azagaia de Arremesso', atkBonus: 10, dmgDie: '1d6', dmgBonus: 3, reach: 9 }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_moderada, qty: 1 }]
  },
  {
    id: 't_clerigo', name: 'Clérigo', sculpt: 'clerigo', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 19,
    sheet: {
      ancestry: 'Anão', background: 'Erudito do Templo', className: 'Clérigo de Batalha', level: 3, keyAttr: 'SAB',
      ancestryHp: 10, classHp: 8, armorItemBonus: 3, dexCap: 2,
      attrs: { FOR: 2, DES: 1, CON: 2, INT: 0, SAB: 4, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 4, ref: 2, will: 4 },
      skills: ['Religião (E)', 'Medicina (E)', 'Diplomacia (T)'],
      feats: ['Fonte de Cura (4x)', 'Canalizar Energia', 'Medicina de Batalha']
    },
    weapons: [{ name: 'Maça Solar', atkBonus: 8, dmgDie: '1d6', dmgBonus: 2, reach: 1.5 }],
    spells: [{ ...SPELL_CATALOG.julgamento_divino }, { ...SPELL_CATALOG.relampago }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }, { ...ITEM_CATALOG.perg_cura, qty: 2 }]
  },
  {
    id: 't_bardo', name: 'Bardo', sculpt: 'bardo', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 19,
    sheet: {
      ancestry: 'Elfo', background: 'Menestrel da Corte', className: 'Bardo (Musa Enigma)', level: 3, keyAttr: 'CAR',
      ancestryHp: 6, classHp: 8, armorItemBonus: 2, dexCap: 3,
      attrs: { FOR: 0, DES: 3, CON: 1, INT: 1, SAB: 1, CAR: 4 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 4, fort: 2, ref: 2, will: 4 },
      skills: ['Atuação (E)', 'Ocultismo (E)', 'Enganação (T)'],
      feats: ['Hino de Coragem (+1)', 'Contramúsica', 'Saber Bárdico']
    },
    weapons: [
      { name: 'Rapieira de Bardo', atkBonus: 9, dmgDie: '1d6', dmgBonus: 2, reach: 1.5 },
      { name: 'Nota Cortante (Alaúde)', atkBonus: 9, dmgDie: '1d6', dmgBonus: 2, reach: 9 }
    ],
    spells: [{ ...SPELL_CATALOG.acorde_dissonante }, { ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.misseis_magicos }],
    items: [{ ...ITEM_CATALOG.calice_bardo, qty: 2 }, { ...ITEM_CATALOG.perg_cura, qty: 1 }]
  },
  {
    id: 't_feiticeiro', name: 'Feiticeiro', sculpt: 'feiticeiro', faction: 'hero', moveSpeed: 9, maxHp: 29, ac: 18,
    sheet: {
      ancestry: 'Gnomo', background: 'Tocado pelo Abismo', className: 'Feiticeiro Elemental', level: 3, keyAttr: 'CAR',
      ancestryHp: 8, classHp: 6, armorItemBonus: 1, dexCap: 4,
      attrs: { FOR: 0, DES: 2, CON: 1, INT: 1, SAB: 1, CAR: 4 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Arcanismo (E)', 'Intimidação (E)', 'Natureza (T)'],
      feats: ['Explosão de Linhagem', 'Ampliar Magia', 'Foco Rubro']
    },
    weapons: [
      { name: 'Estilhaço de Cristal', atkBonus: 8, dmgDie: '1d6', dmgBonus: 1, reach: 1.5 },
      { name: 'Disparo Rubro', atkBonus: 8, dmgDie: '1d8', dmgBonus: 2, reach: 9 }
    ],
    spells: [{ ...SPELL_CATALOG.chama_cristalina }, { ...SPELL_CATALOG.bola_de_fogo }, { ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.toque_chocante }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }, { ...ITEM_CATALOG.perg_bola_fogo, qty: 1 }]
  },
  {
    id: 't_mago', name: 'Mago', sculpt: 'mago', faction: 'hero', moveSpeed: 9, maxHp: 27, ac: 18,
    sheet: {
      ancestry: 'Elfo', background: 'Sábio Arcano', className: 'Mago (Escola Batalha)', level: 3, keyAttr: 'INT',
      ancestryHp: 6, classHp: 6, armorItemBonus: 1, dexCap: 4,
      attrs: { FOR: 0, DES: 2, CON: 1, INT: 4, SAB: 2, CAR: 0 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Arcanismo (E)', 'Sociedade (E)', 'Manufatura (T)'],
      feats: ['Drenar Item de Vínculo', 'Alcance de Magia', 'Grimório Expandido']
    },
    weapons: [{ name: 'Cajado Cristalino', atkBonus: 8, dmgDie: '1d6', dmgBonus: 1, reach: 1.5 }],
    spells: [{ ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.bola_de_fogo }, { ...SPELL_CATALOG.raio_arcano }, { ...SPELL_CATALOG.misseis_magicos }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }, { ...ITEM_CATALOG.perg_bola_fogo, qty: 1 }, { ...ITEM_CATALOG.perg_relampago, qty: 1 }]
  },
  {
    id: 't_ranger', name: 'Ranger', sculpt: 'ranger', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 20,
    sheet: {
      ancestry: 'Humano', background: 'Batedor Fronteiriço', className: 'Patrulheiro (Precisão)', level: 3, keyAttr: 'DES',
      ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3,
      attrs: { FOR: 2, DES: 4, CON: 2, INT: 0, SAB: 2, CAR: -1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Sobrevivência (E)', 'Furtividade (E)', 'Natureza (T)'],
      feats: ['Caçar Presa (◆)', 'Disparo dos Caçadores', 'Tiro Distante']
    },
    weapons: [
      { name: 'Arco Longo', atkBonus: 10, dmgDie: '1d8', dmgBonus: 2, reach: 18 },
      { name: 'Espada Curta', atkBonus: 10, dmgDie: '1d6', dmgBonus: 2, reach: 1.5 }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_rogue', name: 'Rogue', sculpt: 'rogue', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 20,
    sheet: {
      ancestry: 'Halfling', background: 'Infiltrador de Guilda', className: 'Ladino (Ladrão)', level: 3, keyAttr: 'DES',
      ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4,
      attrs: { FOR: 1, DES: 4, CON: 1, INT: 1, SAB: 2, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 2, ref: 4, will: 4 },
      skills: ['Furtividade (E)', 'Acrobacia (E)', 'Ladroagem (E)'],
      feats: ['Ataque Furtivo (+1d6)', 'Passo Esquivo', 'Finta Rápida']
    },
    weapons: [
      { name: 'Adagas Gêmeas', atkBonus: 10, dmgDie: '1d6', dmgBonus: 4, reach: 1.5 },
      { name: 'Adaga Arremessada', atkBonus: 10, dmgDie: '1d4', dmgBonus: 2, reach: 3 }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }]
  },
  {
    id: 't_goblin', name: 'Goblin', sculpt: 'goblin', faction: 'villain', moveSpeed: 9, maxHp: 21, ac: 17,
    sheet: {
      ancestry: 'Goblin', background: 'Saqueador', className: 'Combatente Goblin', level: 1, keyAttr: 'DES',
      ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4,
      attrs: { FOR: 1, DES: 3, CON: 1, INT: 0, SAB: 0, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 4, will: 2 },
      skills: ['Furtividade (T)', 'Acrobacia (T)'],
      feats: ['Deslocamento Goblin']
    },
    weapons: [
      { name: 'Cimitarra Goblin', atkBonus: 7, dmgDie: '1d6', dmgBonus: 2, reach: 1.5 },
      { name: 'Arco Curto Goblin', atkBonus: 7, dmgDie: '1d6', dmgBonus: 1, reach: 9 }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_lobo', name: 'Lobo Atroz', sculpt: 'lobo', faction: 'villain', moveSpeed: 12, maxHp: 32, ac: 18,
    sheet: {
      ancestry: 'Fera', background: 'Alcateia', className: 'Predador Lupino', level: 2, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3,
      attrs: { FOR: 3, DES: 3, CON: 2, INT: -4, SAB: 2, CAR: -2 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Atletismo (T)', 'Sobrevivência (E)'],
      feats: ['Derrubar da Alcateia', 'Faro Aguçado']
    },
    weapons: [{ name: 'Mandíbulas Ferozes', atkBonus: 8, dmgDie: '1d6', dmgBonus: 3, reach: 1.5 }],
    spells: [],
    items: []
  },
  {
    id: 't_bandido', name: 'Bandido', sculpt: 'bandido', faction: 'villain', moveSpeed: 9, maxHp: 32, ac: 18,
    sheet: {
      ancestry: 'Humano', background: 'Fora-da-Lei Fluvial', className: 'Mercenário', level: 2, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 2,
      attrs: { FOR: 3, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 4, ref: 2, will: 2 },
      skills: ['Intimidação (T)', 'Furtividade (T)'],
      feats: ['Emboscada Rápida']
    },
    weapons: [
      { name: 'Sabre de Abordagem', atkBonus: 8, dmgDie: '1d6', dmgBonus: 3, reach: 1.5 },
      { name: 'Besta de Mão', atkBonus: 8, dmgDie: '1d8', dmgBonus: 2, reach: 9 }
    ],
    spells: [{ ...SPELL_CATALOG.bola_de_fogo }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  }
];

