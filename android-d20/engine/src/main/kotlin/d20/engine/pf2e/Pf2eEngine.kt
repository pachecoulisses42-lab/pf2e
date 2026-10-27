package d20.engine.pf2e

import d20.engine.core.DieType
import d20.engine.core.ModType
import d20.engine.core.Modifier
import d20.engine.core.ModifierStack
import d20.engine.core.Roller

/**
 * Deterministic PF2e (Remaster) resolution pipeline. All randomness comes from the injected [roller];
 * draw order is: d20, weapon/spell dice, then each elemental rune in listed order.
 */
class Pf2eEngine(private val roller: Roller) {

    fun weaponAttack(c: Pf2eCharacter, w: WeaponSpec, map: MapStep, targetAc: Int?): AttackResult {
        val mods = buildList {
            add(Modifier(w.attackAbility.abbr, ModType.ABILITY, c.mod(w.attackAbility)))
            add(Modifier("Prof. ${w.rank.abbr}", ModType.PROFICIENCY, w.rank.bonus(c.level)))
            if (w.potency != 0) add(Modifier("Potência +${w.potency}", ModType.ITEM, w.potency))
            val penalty = map.penalty(w.agile)
            if (penalty != 0) add(Modifier("Ataque múltiplo", ModType.UNTYPED, penalty))
        }
        val check = CheckResult(roller.roll(20), ModifierStack.resolve(mods), targetAc)
        if (check.degree?.let { it <= d20.engine.core.Degree.FAILURE } == true) return AttackResult(check, null)
        return AttackResult(check, rollWeaponDamage(c, w))
    }

    fun check(c: Pf2eCharacter, spec: CheckSpec, dc: Int?): CheckResult {
        val ability = spec.abilityOverride ?: spec.kind.defaultAbility
        val mods = buildList {
            add(Modifier(ability.abbr, ModType.ABILITY, c.mod(ability)))
            add(Modifier("Prof. ${spec.rank.abbr}", ModType.PROFICIENCY, spec.rank.bonus(c.level)))
            if (spec.itemBonus != 0) add(Modifier("Item", ModType.ITEM, spec.itemBonus))
        }
        return CheckResult(roller.roll(20), ModifierStack.resolve(mods), dc)
    }

    fun spellAttack(c: Pf2eCharacter, s: SpellSpec, targetAc: Int?): AttackResult {
        val mods = listOf(
            Modifier(s.castingAbility.abbr, ModType.ABILITY, c.mod(s.castingAbility)),
            Modifier("Prof. ${s.rank.abbr}", ModType.PROFICIENCY, s.rank.bonus(c.level)),
        )
        val check = CheckResult(roller.roll(20), ModifierStack.resolve(mods), targetAc)
        if (check.degree?.let { it <= d20.engine.core.Degree.FAILURE } == true) return AttackResult(check, null)
        return AttackResult(check, DamageRoll(listOf(rollPart(s.name, s.damageType, s.diceCount, s.die, 0))))
    }

    fun spellSave(c: Pf2eCharacter, s: SpellSpec): SpellSaveResult {
        val dc = spellDc(c, s)
        val damage = DamageRoll(listOf(rollPart(s.name, s.damageType, s.diceCount, s.die, 0)))
        return SpellSaveResult(dc, s.targetSave, damage)
    }

    private fun rollWeaponDamage(c: Pf2eCharacter, w: WeaponSpec): DamageRoll {
        val strBonus = if (w.attackAbility == Ability.STR) c.mod(Ability.STR) else 0
        val flat = strBonus + w.rank.specializationDamage(w.greaterSpecialization)
        val parts = mutableListOf(rollPart(w.name, w.damageType, w.totalDice, w.die, flat))
        for (rune in w.elemental) {
            parts += rollPart(rune.ptName, rune.damageType, 1, DieType.D6, 0)
        }
        return DamageRoll(parts)
    }

    private fun rollPart(label: String, type: DamageType, count: Int, die: DieType, flat: Int): DamagePart {
        val dice = List(count) { roller.roll(die.sides) }
        return DamagePart(label, type, "${count}${die.label}", dice, flat)
    }

    companion object {
        /** Spell DC = 10 + casting ability + proficiency. */
        fun spellDc(c: Pf2eCharacter, s: SpellSpec): Int =
            10 + c.mod(s.castingAbility) + s.rank.bonus(c.level)
    }
}
