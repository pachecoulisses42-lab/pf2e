/* ============================================================================
   3. PF2E REMASTER CHARACTER SHEET & BUILD CALCULATOR ENGINE
   ============================================================================ */
const PROF_LABELS = { 0: 'Destreinado (+0)', 2: 'Treinado (Nív+2)', 4: 'Especialista (Nív+4)', 6: 'Mestre (Nív+6)', 8: 'Lendário (Nív+8)' };
const PROF_SHORT = { 0: 'D', 2: 'T', 4: 'E', 6: 'M', 8: 'L' };

function calcProfBonus(rank, level) {
  return rank > 0 ? level + rank : 0;
}

function recalculateUnitFromSheet(unit, healFull = false) {
  if (!unit || !unit.sheet) return;
  const s = unit.sheet;
  const lvl = Math.max(1, Math.min(20, parseInt(s.level, 10) || 1));
  s.level = lvl;

  // Max HP = Ancestry HP + (Class HP + CON) * Level
  const prevMax = unit.maxHp || 1;
  const computedMaxHp = Math.max(6, (s.ancestryHp || 8) + ((s.classHp || 8) + s.attrs.CON) * lvl);
  unit.maxHp = computedMaxHp;
  if (healFull || unit.hp > unit.maxHp) {
    unit.hp = unit.maxHp;
  } else if (unit.hp > 0 && computedMaxHp > prevMax) {
    unit.hp += (computedMaxHp - prevMax);
  }

  // AC = 10 + Armor Prof + Armor Item Bonus + min(DES, DexCap)
  const armorProfBonus = calcProfBonus(s.prof.armor, lvl);
  const dexModCapped = Math.min(s.attrs.DES, s.dexCap !== undefined ? s.dexCap : 5);
  unit.baseAc = 10 + armorProfBonus + (s.armorItemBonus || 0) + dexModCapped;
  // Erguer Escudo: bônus de circunstância até o início do próximo turno da peça
  unit.ac = unit.baseAc + (unit.shieldRaised ? shieldBonusOf(unit) : 0);

  // Derived Saves & Perception
  s.derived = {
    perception: calcProfBonus(s.prof.perception, lvl) + s.attrs.SAB,
    fort: calcProfBonus(s.prof.fort, lvl) + s.attrs.CON,
    ref: calcProfBonus(s.prof.ref, lvl) + s.attrs.DES,
    will: calcProfBonus(s.prof.will, lvl) + s.attrs.SAB,
    weaponAtk: calcProfBonus(s.prof.weapon, lvl) + Math.max(s.attrs.FOR, s.attrs.DES) + (lvl >= 2 ? 1 : 0),
    meleeDmgBonus: Math.max(0, s.attrs.FOR + (lvl >= 4 ? 2 : 0)),
    rangedDmgBonus: Math.max(0, Math.floor(s.attrs.FOR / 2) + (lvl >= 4 ? 2 : 1)),
    spellAtk: calcProfBonus(s.prof.spell, lvl) + (s.attrs[s.keyAttr] || 0),
    spellDC: 10 + calcProfBonus(s.prof.spell, lvl) + (s.attrs[s.keyAttr] || 0),
    classDC: 10 + calcProfBonus(s.prof.weapon, lvl) + (s.attrs[s.keyAttr] || s.attrs.FOR)
  };

  // Sync Weapons with the Character's PF2e Build
  if (unit.weapons && unit.weapons.length > 0) {
    unit.weapons.forEach(w => {
      if (w.manual) return;
      w.atkBonus = s.derived.weaponAtk;
      w.dmgBonus = w.reach > 3 ? s.derived.rangedDmgBonus : s.derived.meleeDmgBonus;
    });
  }

  // Sync Spells with the Character's PF2e Build
  if (unit.spells && unit.spells.length > 0) {
    unit.spells.forEach(sp => {
      if (sp.manual) return;
      sp.atkBonus = s.derived.spellAtk;
      if (sp.dmgBonus !== undefined && sp.dmgBonus > 0) {
        sp.dmgBonus = Math.max(2, s.attrs[s.keyAttr] || 3);
      }
    });
  }
}

