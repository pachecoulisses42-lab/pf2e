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
  perg_cura: {
    id: 'perg_cura', name: 'Pergaminho de Cura Sagrada', kind: 'potion',
    cost: 2, range: 9, dice: '2d8', bonus: 8, qty: 1,
    desc: 'Cura 2d8+8 PV em aliado até 9m'
  }
};

