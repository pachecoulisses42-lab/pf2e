/* ============================================================================
   2. SPELL & ITEM CATALOGS
   ============================================================================ */
const SPELL_CATALOG = {
  relampago: {
    id: 'relampago', dmgType: 'elétrico', name: 'Relâmpago', cost: 2, range: 9,
    areaType: 'line', areaSize: 9, atkBonus: 9, dmgDie: '4d12', dmgBonus: 0,
    desc: 'Linha de 9m ancorada na peça'
  },
  bola_de_fogo: {
    id: 'bola_de_fogo', dmgType: 'fogo', name: 'Bola de Fogo', cost: 2, range: 18,
    areaType: 'burst', areaSize: 9, atkBonus: 9, dmgDie: '6d6', dmgBonus: 0,
    desc: 'Explosão em Raio de 9m (Alcance 18m)'
  },
  acorde_dissonante: {
    id: 'acorde_dissonante', dmgType: 'sônico', name: 'Acorde Dissonante', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d6', dmgBonus: 4,
    desc: 'Vibração Sonora de Bardo (Alcance 18m)'
  },
  chama_cristalina: {
    id: 'chama_cristalina', dmgType: 'fogo', name: 'Chama Cristalina', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '4d6', dmgBonus: 4,
    desc: 'Fogo Rubro de Feiticeiro (Alcance 18m)'
  },
  julgamento_divino: {
    id: 'julgamento_divino', dmgType: 'espiritual', name: 'Julgamento Radiante', cost: 2, range: 9,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d8', dmgBonus: 4,
    desc: 'Luz Sagrada de Paladino (Alcance 9m)'
  },
  toque_chocante: {
    id: 'toque_chocante', dmgType: 'elétrico', name: 'Toque Chocante', cost: 2, range: 1.5,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '2d12', dmgBonus: 3,
    desc: 'Sem alcance (Toque Adjacente 1,5m)'
  },
  raio_arcano: {
    id: 'raio_arcano', dmgType: 'força', name: 'Raio Arcano', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d6', dmgBonus: 4,
    desc: 'Ataque Mágico à Distância (18m)'
  },
  espinhos_vivos: {
    id: 'espinhos_vivos', dmgType: 'perfurante', name: 'Espinhos Vivos', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d6', dmgBonus: 4,
    desc: 'Espinhos brotam do chão (18m)'
  },
  vento_cortante: {
    id: 'vento_cortante', dmgType: 'cortante', name: 'Vento Cortante', cost: 2, range: 9,
    areaType: 'line', areaSize: 9, atkBonus: 9, dmgDie: '3d8', dmgBonus: 0,
    desc: 'Rajada afiada em linha de 9m'
  },
  estilhacos_de_gelo: {
    id: 'estilhacos_de_gelo', dmgType: 'gélido', name: 'Estilhaços de Gelo', cost: 2, range: 18,
    areaType: 'burst', areaSize: 4.5, atkBonus: 9, dmgDie: '4d6', dmgBonus: 0,
    desc: 'Explosão de gelo, raio 4,5m (alcance 18m)'
  },
  maldicao_sombria: {
    id: 'maldicao_sombria', dmgType: 'mental', name: 'Maldição Sombria', cost: 2, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d6', dmgBonus: 4,
    desc: 'Pesadelo que corrói a mente (18m)'
  },
  rajada_de_ki: {
    id: 'rajada_de_ki', dmgType: 'força', name: 'Rajada de Ki', cost: 1, range: 9,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '2d6', dmgBonus: 3,
    desc: 'Energia do punho (9m | ◆ 1 Ação)'
  },
  toque_sombrio: {
    id: 'toque_sombrio', dmgType: 'espiritual', name: 'Toque Sombrio', cost: 2, range: 1.5,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '3d8', dmgBonus: 3,
    desc: 'Toque profano (adjacente 1,5m)'
  },
  lanca_divina: {
    id: 'lanca_divina', dmgType: 'espiritual', name: 'Lança Divina', cost: 1, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '2d4', dmgBonus: 3,
    desc: 'Lança de luz sagrada (18m | ◆ 1 Ação)'
  },
  fogo_de_raposa: {
    id: 'fogo_de_raposa', dmgType: 'fogo', name: 'Fogo de Raposa', cost: 1, range: 9,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '2d4', dmgBonus: 3,
    desc: 'Chama espiritual da kitsune (9m | ◆ 1 Ação)'
  },
  jato_de_agua: {
    id: 'jato_de_agua', dmgType: 'contundente', name: 'Jato d\'Água', cost: 2, range: 9,
    areaType: 'line', areaSize: 9, atkBonus: 9, dmgDie: '3d6', dmgBonus: 0,
    desc: 'Jorro de água em linha de 9m'
  },
  sopro_draconico: {
    id: 'sopro_draconico', dmgType: 'fogo', name: 'Sopro Dracônico', cost: 2, range: 9,
    areaType: 'burst', areaSize: 4.5, atkBonus: 9, dmgDie: '3d6', dmgBonus: 0,
    desc: 'Chamas do sangue de dragão, raio 4,5m (alcance 9m)'
  },
  investida_eidolon: {
    id: 'investida_eidolon', dmgType: 'força', name: 'Investida do Eidolon', cost: 2, range: 9,
    areaType: 'single', areaSize: 0, atkBonus: 9, dmgDie: '2d8', dmgBonus: 4,
    desc: 'O eidolon vinculado golpeia o alvo (9m)'
  },
  fogueira_goblin: {
    id: 'fogueira_goblin', dmgType: 'fogo', name: 'Fogueira Goblin', cost: 2, range: 18,
    areaType: 'burst', areaSize: 3, atkBonus: 8, dmgDie: '2d6', dmgBonus: 0,
    desc: 'Labaredas tribais, raio 3m (alcance 18m)'
  },
  uivo_espectral: {
    id: 'uivo_espectral', dmgType: 'mental', name: 'Uivo Espectral', cost: 2, range: 1.5,
    areaType: 'burst', areaSize: 4.5, atkBonus: 8, dmgDie: '2d6', dmgBonus: 0,
    desc: 'Uivo que gela a alma ao redor (raio 4,5m)'
  },
  misseis_magicos: {
    id: 'misseis_magicos', dmgType: 'força', name: 'Mísseis Mágicos', cost: 1, range: 18,
    areaType: 'single', areaSize: 0, atkBonus: 10, dmgDie: '2d4', dmgBonus: 2,
    desc: 'Disparo Rápido (18m | Gasta ◆ 1 Ação)'
  }
};

const ITEM_CATALOG = {
  pocao_menor: {
    id: 'pocao_menor', name: 'Poção de Cura Menor', kind: 'potion',
    cost: 2, range: 1.5, dice: '1d8', bonus: 4, qty: 2,
    desc: 'Recupera 1d8+4 PV (Si mesmo ou Adjacente)'
  },
  pocao_moderada: {
    id: 'pocao_moderada', name: 'Poção de Cura Moderada', kind: 'potion',
    cost: 2, range: 1.5, dice: '3d8', bonus: 10, qty: 1,
    desc: 'Recupera 3d8+10 PV (Si mesmo ou Adjacente)'
  },
  calice_bardo: {
    id: 'calice_bardo', name: 'Taça Dourada de Néctar', kind: 'potion',
    cost: 2, range: 3, dice: '2d8', bonus: 6, qty: 2,
    desc: 'Cura e inspira +2d8+6 PV (Alcance 3m)'
  },
  perg_relampago: {
    id: 'perg_relampago', name: 'Pergaminho de Relâmpago', kind: 'scroll_spell',
    spellKey: 'relampago', cost: 2, qty: 1,
    desc: 'Conjura Relâmpago (Linha 9m | 4d12)'
  },
  perg_bola_fogo: {
    id: 'perg_bola_fogo', name: 'Pergaminho de Bola de Fogo', kind: 'scroll_spell',
    spellKey: 'bola_de_fogo', cost: 2, qty: 1,
    desc: 'Conjura Bola de Fogo (Raio 9m | 6d6)'
  },
  elixir_vida: {
    id: 'elixir_vida', name: 'Elixir de Vida Menor', kind: 'potion',
    cost: 1, range: 1.5, dice: '2d6', bonus: 6, qty: 2,
    desc: 'Recupera 2d6+6 PV (Si mesmo ou Adjacente | ◆ 1 Ação)'
  },
  perg_cura: {
    id: 'perg_cura', name: 'Pergaminho de Cura Sagrada', kind: 'potion',
    cost: 2, range: 9, dice: '2d8', bonus: 8, qty: 1,
    desc: 'Cura 2d8+8 PV em aliado até 9m'
  }
};

