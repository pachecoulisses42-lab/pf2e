/* ============================================================================
   4. 12 ARCHETYPE TEMPLATES WITH FULL PF2E REMASTER SHEETS (BUILDS)
   ============================================================================ */
let UNIT_TEMPLATES = [
  {
    id: 't_guerreiro', name: 'Guerreiro', sculpt: 'guerreiro', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 21,
    sheet: {
      ancestry: 'Humano', background: 'Guarda Real', className: 'Guerreiro (Fighter)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 4, dexCap: 1, shieldBonus: 2,
      attrs: { FOR: 4, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 4, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Atletismo (E)', 'Intimidação (T)', 'Acrobacia (T)'],
      feats: ['Golpe Intimidador', 'Ataque de Oportunidade', 'Escudo Reativo']
    },
    weapons: [
      { name: 'Espada Longa', atkBonus: 12, dmgDie: '1d8', dmgBonus: 4, reach: 1.5, dmgType: 'cortante' },
      { name: 'Lança de Alcance', atkBonus: 12, dmgDie: '1d8', dmgBonus: 4, reach: 3, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor }]
  },
  {
    id: 't_paladino', name: 'Paladino', sculpt: 'paladino', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 21,
    sheet: {
      ancestry: 'Humano', background: 'Acólito Marcial', className: 'Campeão (Paladino)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 5, dexCap: 1, shieldBonus: 2,
      attrs: { FOR: 4, DES: 1, CON: 2, INT: 0, SAB: 1, CAR: 2 },
      prof: { armor: 4, weapon: 2, spell: 2, perception: 2, fort: 4, ref: 2, will: 4 },
      skills: ['Religião (T)', 'Atletismo (T)', 'Diplomacia (T)'],
      feats: ['Golpe Retributivo', 'Imposição de Mãos', 'Devoção Divina']
    },
    weapons: [
      { name: 'Espada Sagrada', atkBonus: 10, dmgDie: '1d8', dmgBonus: 4, reach: 1.5, dmgType: 'cortante' },
      { name: 'Lança Radiante', atkBonus: 10, dmgDie: '1d8', dmgBonus: 4, reach: 3, dmgType: 'perfurante' }
    ],
    spells: [{ ...SPELL_CATALOG.julgamento_divino }, { ...SPELL_CATALOG.toque_chocante }],
    items: [{ ...ITEM_CATALOG.pocao_moderada, qty: 1 }, { ...ITEM_CATALOG.perg_cura, qty: 1 }]
  },
  {
    id: 't_barbaro', name: 'Bárbaro', sculpt: 'barbaro', faction: 'hero', moveSpeed: 9, maxHp: 53, ac: 19,
    sheet: {
      ancestry: 'Orc', background: 'Nômade Feroz', className: 'Bárbaro (Fúria)', level: 3, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 12, armorItemBonus: 3, dexCap: 2, shieldBonus: 0,
      attrs: { FOR: 4, DES: 1, CON: 3, INT: -1, SAB: 1, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 2, will: 4 },
      skills: ['Atletismo (E)', 'Intimidação (T)', 'Sobrevivência (T)'],
      feats: ['Fúria Instintiva', 'Investida Súbita', 'Ferocidade Orc']
    },
    weapons: [
      { name: 'Machado Grande', atkBonus: 10, dmgDie: '1d12', dmgBonus: 6, reach: 1.5, dmgType: 'cortante' },
      { name: 'Azagaia de Arremesso', atkBonus: 10, dmgDie: '1d6', dmgBonus: 3, reach: 9, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_moderada, qty: 1 }]
  },
  {
    id: 't_clerigo', name: 'Clérigo', sculpt: 'clerigo', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 19,
    sheet: {
      ancestry: 'Anão', background: 'Erudito do Templo', className: 'Clérigo de Batalha', level: 3, keyAttr: 'SAB',
      ancestryHp: 10, classHp: 8, armorItemBonus: 3, dexCap: 2, shieldBonus: 0,
      attrs: { FOR: 2, DES: 1, CON: 2, INT: 0, SAB: 4, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 4, ref: 2, will: 4 },
      skills: ['Religião (E)', 'Medicina (E)', 'Diplomacia (T)'],
      feats: ['Fonte de Cura (4x)', 'Canalizar Energia', 'Medicina de Batalha']
    },
    weapons: [{ name: 'Maça Solar', atkBonus: 8, dmgDie: '1d6', dmgBonus: 2, reach: 1.5, dmgType: 'contundente' }],
    spells: [{ ...SPELL_CATALOG.julgamento_divino }, { ...SPELL_CATALOG.lanca_divina }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }, { ...ITEM_CATALOG.perg_cura, qty: 2 }]
  },
  {
    id: 't_bardo', name: 'Bardo', sculpt: 'bardo', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 19,
    sheet: {
      ancestry: 'Elfo', background: 'Menestrel da Corte', className: 'Bardo (Musa Enigma)', level: 3, keyAttr: 'CAR',
      ancestryHp: 6, classHp: 8, armorItemBonus: 2, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 0, DES: 3, CON: 1, INT: 1, SAB: 1, CAR: 4 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 4, fort: 2, ref: 2, will: 4 },
      skills: ['Atuação (E)', 'Ocultismo (E)', 'Enganação (T)'],
      feats: ['Hino de Coragem (+1)', 'Contramúsica', 'Saber Bárdico']
    },
    weapons: [
      { name: 'Rapieira de Bardo', atkBonus: 9, dmgDie: '1d6', dmgBonus: 2, reach: 1.5, dmgType: 'perfurante' },
      { name: 'Nota Cortante (Alaúde)', atkBonus: 9, dmgDie: '1d6', dmgBonus: 2, reach: 9, dmgType: 'sônico' }
    ],
    spells: [{ ...SPELL_CATALOG.acorde_dissonante }, { ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.misseis_magicos }],
    items: [{ ...ITEM_CATALOG.calice_bardo, qty: 2 }, { ...ITEM_CATALOG.perg_cura, qty: 1 }]
  },
  {
    id: 't_feiticeiro', name: 'Feiticeiro', sculpt: 'feiticeiro', faction: 'hero', moveSpeed: 9, maxHp: 29, ac: 18,
    sheet: {
      ancestry: 'Gnomo', background: 'Tocado pelo Abismo', className: 'Feiticeiro Elemental', level: 3, keyAttr: 'CAR',
      ancestryHp: 8, classHp: 6, armorItemBonus: 1, dexCap: 4, shieldBonus: 0,
      attrs: { FOR: 0, DES: 2, CON: 1, INT: 1, SAB: 1, CAR: 4 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Arcanismo (E)', 'Intimidação (E)', 'Natureza (T)'],
      feats: ['Explosão de Linhagem', 'Ampliar Magia', 'Foco Rubro']
    },
    weapons: [
      { name: 'Estilhaço de Cristal', atkBonus: 8, dmgDie: '1d6', dmgBonus: 1, reach: 1.5, dmgType: 'perfurante' },
      { name: 'Disparo Rubro', atkBonus: 8, dmgDie: '1d8', dmgBonus: 2, reach: 9, dmgType: 'fogo' }
    ],
    spells: [{ ...SPELL_CATALOG.chama_cristalina }, { ...SPELL_CATALOG.bola_de_fogo }, { ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.toque_chocante }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }, { ...ITEM_CATALOG.perg_bola_fogo, qty: 1 }]
  },
  {
    id: 't_mago', name: 'Mago', sculpt: 'mago', faction: 'hero', moveSpeed: 9, maxHp: 27, ac: 18,
    sheet: {
      ancestry: 'Elfo', background: 'Sábio Arcano', className: 'Mago (Escola Batalha)', level: 3, keyAttr: 'INT',
      ancestryHp: 6, classHp: 6, armorItemBonus: 1, dexCap: 4, shieldBonus: 0,
      attrs: { FOR: 0, DES: 2, CON: 1, INT: 4, SAB: 2, CAR: 0 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Arcanismo (E)', 'Sociedade (E)', 'Manufatura (T)'],
      feats: ['Drenar Item de Vínculo', 'Alcance de Magia', 'Grimório Expandido']
    },
    weapons: [{ name: 'Cajado Cristalino', atkBonus: 8, dmgDie: '1d6', dmgBonus: 1, reach: 1.5, dmgType: 'contundente' }],
    spells: [{ ...SPELL_CATALOG.relampago }, { ...SPELL_CATALOG.bola_de_fogo }, { ...SPELL_CATALOG.raio_arcano }, { ...SPELL_CATALOG.misseis_magicos }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }, { ...ITEM_CATALOG.perg_bola_fogo, qty: 1 }, { ...ITEM_CATALOG.perg_relampago, qty: 1 }]
  },
  {
    id: 't_ranger', name: 'Ranger', sculpt: 'ranger', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 20,
    sheet: {
      ancestry: 'Humano', background: 'Batedor Fronteiriço', className: 'Patrulheiro (Precisão)', level: 3, keyAttr: 'DES',
      ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 2, DES: 4, CON: 2, INT: 0, SAB: 2, CAR: -1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Sobrevivência (E)', 'Furtividade (E)', 'Natureza (T)'],
      feats: ['Caçar Presa (◆)', 'Disparo dos Caçadores', 'Tiro Distante']
    },
    weapons: [
      { name: 'Arco Longo', atkBonus: 10, dmgDie: '1d8', dmgBonus: 2, reach: 18, dmgType: 'perfurante' },
      { name: 'Espada Curta', atkBonus: 10, dmgDie: '1d6', dmgBonus: 2, reach: 1.5, dmgType: 'cortante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_rogue', name: 'Rogue', sculpt: 'rogue', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 20,
    sheet: {
      ancestry: 'Halfling', background: 'Infiltrador de Guilda', className: 'Ladino (Ladrão)', level: 3, keyAttr: 'DES',
      ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, shieldBonus: 0,
      attrs: { FOR: 1, DES: 4, CON: 1, INT: 1, SAB: 2, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 2, ref: 4, will: 4 },
      skills: ['Furtividade (E)', 'Acrobacia (E)', 'Ladroagem (E)'],
      feats: ['Ataque Furtivo (+1d6)', 'Passo Esquivo', 'Finta Rápida']
    },
    weapons: [
      { name: 'Adagas Gêmeas', atkBonus: 10, dmgDie: '1d6', dmgBonus: 4, reach: 1.5, dmgType: 'perfurante' },
      { name: 'Adaga Arremessada', atkBonus: 10, dmgDie: '1d4', dmgBonus: 2, reach: 3, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }]
  },
  {
    id: 't_goblin', name: 'Goblin', sculpt: 'goblin', faction: 'villain', moveSpeed: 9, maxHp: 21, ac: 17,
    sheet: {
      ancestry: 'Goblin', background: 'Saqueador', className: 'Combatente Goblin', level: 1, keyAttr: 'DES',
      ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, shieldBonus: 0,
      attrs: { FOR: 1, DES: 3, CON: 1, INT: 0, SAB: 0, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 4, will: 2 },
      skills: ['Furtividade (T)', 'Acrobacia (T)'],
      feats: ['Deslocamento Goblin']
    },
    weapons: [
      { name: 'Cimitarra Goblin', atkBonus: 7, dmgDie: '1d6', dmgBonus: 2, reach: 1.5, dmgType: 'cortante' },
      { name: 'Arco Curto Goblin', atkBonus: 7, dmgDie: '1d6', dmgBonus: 1, reach: 9, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_lobo', name: 'Lobo Atroz', sculpt: 'lobo', faction: 'villain', moveSpeed: 12, maxHp: 32, ac: 18,
    sheet: {
      ancestry: 'Fera', background: 'Alcateia', className: 'Predador Lupino', level: 2, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 3, DES: 3, CON: 2, INT: -4, SAB: 2, CAR: -2 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 4, fort: 4, ref: 4, will: 2 },
      skills: ['Atletismo (T)', 'Sobrevivência (E)'],
      feats: ['Derrubar da Alcateia', 'Faro Aguçado']
    },
    weapons: [{ name: 'Mandíbulas Ferozes', atkBonus: 8, dmgDie: '1d6', dmgBonus: 3, reach: 1.5, dmgType: 'perfurante' }],
    spells: [],
    items: []
  },
  {
    id: 't_bandido', name: 'Bandido', sculpt: 'bandido', faction: 'villain', moveSpeed: 9, maxHp: 32, ac: 18,
    sheet: {
      ancestry: 'Humano', background: 'Fora-da-Lei Fluvial', className: 'Mercenário', level: 2, keyAttr: 'FOR',
      ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 2, shieldBonus: 0,
      attrs: { FOR: 3, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 4, ref: 2, will: 2 },
      skills: ['Intimidação (T)', 'Furtividade (T)'],
      feats: ['Emboscada Rápida']
    },
    weapons: [
      { name: 'Sabre de Abordagem', atkBonus: 8, dmgDie: '1d6', dmgBonus: 3, reach: 1.5, dmgType: 'cortante' },
      { name: 'Besta de Mão', atkBonus: 8, dmgDie: '1d8', dmgBonus: 2, reach: 9, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  }
];

/* ----------------------------------------------------------------------------
   2ª leva de modelos: cada peça equipada conforme a classe que representa
   ---------------------------------------------------------------------------- */
UNIT_TEMPLATES.push(
  {
    id: 't_druida', name: 'Druida', sculpt: 'druida', faction: 'hero', moveSpeed: 9, maxHp: 33, ac: 18,
    sheet: {
      ancestry: 'Elfo', background: 'Guardião do Bosque', className: 'Druida (Ordem da Tempestade)', level: 3, keyAttr: 'SAB',
      ancestryHp: 6, classHp: 8, armorItemBonus: 2, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 0, DES: 2, CON: 2, INT: 0, SAB: 4, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 4, fort: 2, ref: 2, will: 4 },
      skills: ['Natureza (E)', 'Sobrevivência (E)', 'Medicina (T)'],
      feats: ['Ordem da Tempestade', 'Forma Selvagem (◆)', 'Companheiro Animal']
    },
    weapons: [
      { name: 'Cajado de Carvalho', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' },
      { name: 'Foice Druídica', dmgDie: '1d4', reach: 1.5, dmgType: 'cortante' }
    ],
    spells: [{ ...SPELL_CATALOG.espinhos_vivos }, { ...SPELL_CATALOG.vento_cortante }, { ...SPELL_CATALOG.relampago }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }]
  },
  {
    id: 't_monge', name: 'Monge', sculpt: 'monge', faction: 'hero', moveSpeed: 12, maxHp: 44, ac: 19,
    sheet: {
      ancestry: 'Humano', background: 'Discípulo do Mosteiro', className: 'Monge (Punho de Ferro)', level: 3, keyAttr: 'SAB',
      ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, shieldBonus: 0,
      attrs: { FOR: 3, DES: 4, CON: 2, INT: 0, SAB: 3, CAR: 0 },
      prof: { armor: 2, weapon: 4, spell: 2, perception: 4, fort: 4, ref: 4, will: 4 },
      skills: ['Atletismo (E)', 'Acrobacia (E)', 'Religião (T)'],
      feats: ['Fluxo de Golpes (◆◆)', 'Punhos de Ferro', 'Postura da Montanha']
    },
    weapons: [
      { name: 'Punhos de Ferro', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' },
      { name: 'Bastão de Combate', dmgDie: '1d8', reach: 3, dmgType: 'contundente' }
    ],
    spells: [{ ...SPELL_CATALOG.rajada_de_ki }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }]
  },
  {
    id: 't_alquimista', name: 'Alquimista', sculpt: 'alquimista', faction: 'hero', moveSpeed: 9, maxHp: 35, ac: 18,
    sheet: {
      ancestry: 'Gnomo', background: 'Boticário', className: 'Alquimista (Bombardeiro)', level: 3, keyAttr: 'INT',
      ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 0, DES: 3, CON: 2, INT: 4, SAB: 1, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 4, ref: 4, will: 2 },
      skills: ['Manufatura (E)', 'Medicina (T)', 'Arcanismo (T)'],
      feats: ['Bombas Químicas', 'Elixires Rápidos', 'Respingo']
    },
    weapons: [
      { name: 'Bomba de Ácido', manual: true, atkBonus: 9, dmgDie: '1d8', dmgBonus: 0, reach: 9, dmgType: 'ácido', extra: [{ name: 'Respingo', die: '1d4', bonus: 0, type: 'ácido' }] },
      { name: 'Bomba de Fogo', manual: true, atkBonus: 9, dmgDie: '1d8', dmgBonus: 0, reach: 9, dmgType: 'fogo', extra: [{ name: 'Respingo', die: '1d4', bonus: 0, type: 'fogo' }] },
      { name: 'Faca de Trabalho', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.elixir_vida, qty: 2 }, { ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_bruxa', name: 'Bruxa', sculpt: 'bruxa', faction: 'hero', moveSpeed: 9, maxHp: 29, ac: 17,
    sheet: {
      ancestry: 'Humana', background: 'Eremita do Pântano', className: 'Bruxa (Pacto do Gato)', level: 3, keyAttr: 'INT',
      ancestryHp: 8, classHp: 6, armorItemBonus: 0, dexCap: 5, shieldBonus: 0,
      attrs: { FOR: -1, DES: 2, CON: 1, INT: 4, SAB: 2, CAR: 1 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Ocultismo (E)', 'Natureza (T)', 'Intimidação (T)'],
      feats: ['Familiar (Gato Negro)', 'Maldição do Pacto', 'Mau-olhado']
    },
    weapons: [{ name: 'Cajado Retorcido', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
    spells: [{ ...SPELL_CATALOG.maldicao_sombria }, { ...SPELL_CATALOG.estilhacos_de_gelo }, { ...SPELL_CATALOG.misseis_magicos }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }, { ...ITEM_CATALOG.perg_relampago, qty: 1 }]
  },
  {
    id: 't_espadachim', name: 'Espadachim', sculpt: 'espadachim', faction: 'hero', moveSpeed: 9, maxHp: 44, ac: 20,
    sheet: {
      ancestry: 'Humano', background: 'Duelista da Corte', className: 'Espadachim (Duelista)', level: 3, keyAttr: 'DES',
      ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3, shieldBonus: 0,
      attrs: { FOR: 1, DES: 4, CON: 2, INT: 0, SAB: 1, CAR: 3 },
      prof: { armor: 2, weapon: 4, spell: 0, perception: 4, fort: 2, ref: 4, will: 4 },
      skills: ['Acrobacia (E)', 'Atletismo (T)', 'Atuação (T)'],
      feats: ['Panache', 'Finta Acrobática', 'Estocada Ágil']
    },
    weapons: [
      { name: 'Rapieira', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' },
      { name: 'Adaga de Parry', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 2 }]
  },
  {
    id: 't_esqueleto', name: 'Esqueleto', sculpt: 'esqueleto', faction: 'villain', moveSpeed: 9, maxHp: 24, ac: 17,
    sheet: {
      ancestry: 'Morto-vivo', background: 'Guarda Ressuscitado', className: 'Guerreiro Esquelético', level: 2, keyAttr: 'FOR',
      ancestryHp: 6, classHp: 8, armorItemBonus: 2, dexCap: 2, shieldBonus: 1,
      attrs: { FOR: 3, DES: 2, CON: 0, INT: -4, SAB: 0, CAR: -4 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 4, will: 2 },
      skills: ['Atletismo (T)'],
      feats: ['Imune a Veneno e Mental', 'Ossos Resistentes']
    },
    weapons: [
      { name: 'Espada Enferrujada', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' },
      { name: 'Garras Ossudas', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [],
    resistances: [{ type: 'cortante', value: 5 }, { type: 'perfurante', value: 5 }],
    weaknesses: [{ type: 'vital', value: 5 }],
    immunities: ['veneno', 'mental']
  },
  {
    id: 't_orc', name: 'Orc', sculpt: 'orc', faction: 'villain', moveSpeed: 9, maxHp: 55, ac: 19,
    sheet: {
      ancestry: 'Orc', background: 'Saqueador de Clã', className: 'Guerreiro Orc', level: 3, keyAttr: 'FOR',
      ancestryHp: 10, classHp: 10, armorItemBonus: 3, dexCap: 1, shieldBonus: 0,
      attrs: { FOR: 4, DES: 1, CON: 3, INT: -1, SAB: 0, CAR: 0 },
      prof: { armor: 2, weapon: 4, spell: 0, perception: 2, fort: 4, ref: 2, will: 2 },
      skills: ['Atletismo (E)', 'Intimidação (T)'],
      feats: ['Ferocidade Orc', 'Golpe Poderoso', 'Visão no Escuro']
    },
    weapons: [
      { name: 'Machado Grande Orc', dmgDie: '1d12', reach: 1.5, dmgType: 'cortante' },
      { name: 'Azagaia', dmgDie: '1d6', reach: 9, dmgType: 'perfurante' }
    ],
    spells: [],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_cultista', name: 'Cultista', sculpt: 'cultista', faction: 'villain', moveSpeed: 9, maxHp: 32, ac: 17,
    sheet: {
      ancestry: 'Humano', background: 'Acólito do Culto Sombrio', className: 'Cultista Profano', level: 3, keyAttr: 'CAR',
      ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, shieldBonus: 0,
      attrs: { FOR: 0, DES: 2, CON: 1, INT: 1, SAB: 2, CAR: 4 },
      prof: { armor: 2, weapon: 2, spell: 2, perception: 2, fort: 2, ref: 2, will: 4 },
      skills: ['Ocultismo (E)', 'Religião (T)', 'Enganação (T)'],
      feats: ['Ritual Profano', 'Pacto de Sangue', 'Escudo Sombrio']
    },
    weapons: [
      { name: 'Adaga Ritual', dmgDie: '1d4', reach: 1.5, dmgType: 'cortante', extra: [{ name: 'Profana', die: '1d4', bonus: 0, type: 'espiritual' }] }
    ],
    spells: [{ ...SPELL_CATALOG.maldicao_sombria }, { ...SPELL_CATALOG.toque_sombrio }],
    items: [{ ...ITEM_CATALOG.pocao_menor, qty: 1 }]
  },
  {
    id: 't_zumbi', name: 'Zumbi', sculpt: 'zumbi', faction: 'villain', moveSpeed: 6, maxHp: 44, ac: 13,
    sheet: {
      ancestry: 'Morto-vivo', background: 'Cadáver Errante', className: 'Zumbi Errante', level: 2, keyAttr: 'FOR',
      ancestryHp: 10, classHp: 10, armorItemBonus: 0, dexCap: 0, shieldBonus: 0,
      attrs: { FOR: 4, DES: -2, CON: 3, INT: -4, SAB: 0, CAR: -4 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 0, fort: 4, ref: 0, will: 2 },
      skills: ['Atletismo (T)'],
      feats: ['Lento e Implacável', 'Imune a Veneno e Mental']
    },
    weapons: [
      { name: 'Pancada Podre', dmgDie: '1d8', reach: 1.5, dmgType: 'contundente' },
      { name: 'Mordida Infecta', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante', extra: [{ name: 'Infecção', die: '1d4', bonus: 0, type: 'veneno' }] }
    ],
    spells: [],
    items: [],
    weaknesses: [{ type: 'vital', value: 5 }],
    immunities: ['veneno', 'mental']
  },
  {
    id: 't_kobold', name: 'Kobold', sculpt: 'kobold', faction: 'villain', moveSpeed: 9, maxHp: 16, ac: 17,
    sheet: {
      ancestry: 'Kobold', background: 'Guarda da Toca', className: 'Lanceiro Kobold', level: 1, keyAttr: 'DES',
      ancestryHp: 6, classHp: 6, armorItemBonus: 1, dexCap: 3, shieldBonus: 1,
      attrs: { FOR: 0, DES: 3, CON: 1, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 2, spell: 0, perception: 2, fort: 2, ref: 4, will: 2 },
      skills: ['Furtividade (T)', 'Ladroagem (T)'],
      feats: ['Armadilha Improvisada', 'Sangue Dracônico']
    },
    weapons: [
      { name: 'Lança Kobold', dmgDie: '1d6', reach: 3, dmgType: 'perfurante' },
      { name: 'Funda', dmgDie: '1d4', reach: 9, dmgType: 'contundente' }
    ],
    spells: [],
    items: []
  }
);
