package d20.engine.pf2e

import d20.engine.conditions.ActiveCondition
import d20.engine.conditions.StatusPenalties
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

    fun weaponAttack(
        c: Pf2eCharacter, w: WeaponSpec, map: MapStep, targetAc: Int?, conditions: List<ActiveCondition> = emptyList(),
    ): AttackResult {
        val mods = buildList {
            add(Modifier(w.attackAbility.abbr, ModType.ABILITY, c.mod(w.attackAbility)))
            add(Modifier("Prof. ${w.rank.abbr}", ModType.PROFICIENCY, w.rank.bonus(c.level)))
            if (w.potency != 0) add(Modifier("Potência +${w.potency}", ModType.ITEM, w.potency))
            val penalty = map.penalty(w.agile)
            if (penalty != 0) add(Modifier("Ataque múltiplo", ModType.UNTYPED, penalty))
            addAll(StatusPenalties.modifiers(conditions, w.attackAbility))
        }
        val check = CheckResult(roller.roll(20), ModifierStack.resolve(mods), targetAc)
        if (check.degree?.let { it <= d20.engine.core.Degree.FAILURE } == true) return AttackResult(check, null)
        val critPossible = check.degree == null || check.degree == d20.engine.core.Degree.CRITICAL_SUCCESS
        return AttackResult(check, rollWeaponDamage(c, w, critPossible))
    }

    /**
     * Throws a bomb: DES + proficiency + the bomb's item bonus. Splash hits on any result but a critical failure,
     * direct damage only on a hit (or while the result is unknown); neither adds the Strength modifier.
     */
    fun bombAttack(c: Pf2eCharacter, spec: ConsumableSpec, targetAc: Int?, conditions: List<ActiveCondition> = emptyList()): BombResult {
        val stats = ConsumableTables.bomb(spec.kind, spec.grade)
        val mods = buildList {
            add(Modifier(Ability.DEX.abbr, ModType.ABILITY, c.mod(Ability.DEX)))
            add(Modifier("Prof. ${spec.rank.abbr}", ModType.PROFICIENCY, spec.rank.bonus(c.level)))
            if (stats.attackBonus != 0) add(Modifier("Item +${stats.attackBonus}", ModType.ITEM, stats.attackBonus))
            addAll(StatusPenalties.modifiers(conditions, Ability.DEX))
        }
        val check = CheckResult(roller.roll(20), ModifierStack.resolve(mods), targetAc)
        val degree = check.degree
        if (degree == d20.engine.core.Degree.CRITICAL_FAILURE) return BombResult(check, null, null)
        val label = spec.name.ifBlank { spec.kind.ptName }
        val splash = DamagePart("Respingo", stats.type, "${stats.splash}", emptyList(), stats.splash)
        val hitOrUnknown = degree == null || degree == d20.engine.core.Degree.SUCCESS || degree == d20.engine.core.Degree.CRITICAL_SUCCESS
        if (!hitOrUnknown) return BombResult(check, DamageRoll(listOf(splash)), null)
        val direct = if (stats.die != null) rollPart(label, stats.type, stats.diceCount, stats.die, 0)
        else DamagePart(label, stats.type, "${stats.directFlat}", emptyList(), stats.directFlat)
        return BombResult(check, DamageRoll(listOf(direct), splashPart = splash), stats.persistent)
    }

    /** Rolls a healing potion's dice. */
    fun rollHealing(grade: ConsumableGrade): Int {
        val (n, flat) = ConsumableTables.healing(grade)
        return List(n) { roller.roll(8) }.sum() + flat
    }

    /** [armor]: the worn armor of an active "Vida, escudo & defesa" module (runes and check penalty apply). */
    fun check(c: Pf2eCharacter, spec: CheckSpec, dc: Int?, conditions: List<ActiveCondition> = emptyList(), armor: ArmorSpec? = null): CheckResult {
        val ability = spec.abilityOverride ?: spec.kind.defaultAbility
        val mods = checkModifiers(c, spec, armor) + StatusPenalties.modifiers(conditions, ability)
        return CheckResult(roller.roll(20), ModifierStack.resolve(mods), dc)
    }

    fun spellAttack(c: Pf2eCharacter, s: SpellSpec, targetAc: Int?, conditions: List<ActiveCondition> = emptyList()): AttackResult {
        val mods = listOf(
            Modifier(s.castingAbility.abbr, ModType.ABILITY, c.mod(s.castingAbility)),
            Modifier("Prof. ${s.rankFor(c).abbr}", ModType.PROFICIENCY, s.rankFor(c).bonus(c.level)),
        ) + StatusPenalties.modifiers(conditions, s.castingAbility)
        val check = CheckResult(roller.roll(20), ModifierStack.resolve(mods), targetAc)
        if (check.degree?.let { it <= d20.engine.core.Degree.FAILURE } == true) return AttackResult(check, null)
        return AttackResult(check, rollSpellDamage(s))
    }

    fun spellSave(c: Pf2eCharacter, s: SpellSpec, conditions: List<ActiveCondition> = emptyList()): SpellSaveResult {
        val dc = spellDc(c, s, conditions)
        return SpellSaveResult(dc, s.targetSave, rollSpellDamage(s))
    }

    private fun rollWeaponDamage(c: Pf2eCharacter, w: WeaponSpec, critPossible: Boolean): DamageRoll {
        val strBonus = if (w.attackAbility == Ability.STR) c.mod(Ability.STR) else 0
        val flat = strBonus + w.rank.specializationDamage(w.greaterSpecialization)
        val parts = mutableListOf(rollPart(w.name, w.damageType, w.totalDice, w.die, flat))
        for (rune in w.elemental) {
            parts += rollPart(rune.ptName, rune.damageType, 1, DieType.D6, 0)
        }
        // Critical-only dice are rolled up front (after everything else) so a later "critical" choice needs no new roll.
        val fatal = if (critPossible) w.fatalDie?.let { rollPart(w.name, w.damageType, w.totalDice + 1, it, flat) } else null
        val deadly = if (critPossible) w.deadlyDie?.let { rollPart("Mortal", w.damageType, deadlyDice(w), it, 0) } else null
        return DamageRoll(parts, fatal, deadly)
    }

    /** The spell's dice plus its extra damage, after the stacking rule; weakness-like sources go after multipliers. */
    private fun rollSpellDamage(s: SpellSpec): DamageRoll {
        val resolved = ExtraDamageStack.resolve(s.extras)
        val (post, pre) = resolved.applied.partition { it.source.afterMultipliers }
        fun part(e: ExtraDamage) = rollPart(e.label, e.damageType ?: s.damageType, e.diceCount, e.die, e.flat)
        return DamageRoll(
            parts = listOf(rollPart(s.name, s.damageType, s.diceCount, s.die, 0)) + pre.map(::part),
            postParts = post.map(::part),
            ignored = resolved.ignored.map { it.label },
        )
    }

    private fun rollPart(label: String, type: DamageType, count: Int, die: DieType, flat: Int): DamagePart {
        val dice = List(count) { roller.roll(die.sides) }
        return DamagePart(label, type, "${count}${die.label}", dice, flat)
    }

    companion object {
        /** Deadly adds 1 die, 2 with a greater striking rune and 3 with a major striking rune. */
        fun deadlyDice(w: WeaponSpec): Int = when (w.striking) {
            StrikingRune.GREATER -> 2
            StrikingRune.MAJOR -> 3
            else -> 1
        }

        /** Spell DC = 10 + casting ability + proficiency. */
        fun spellDc(c: Pf2eCharacter, s: SpellSpec, conditions: List<ActiveCondition> = emptyList()): Int =
            10 + c.mod(s.castingAbility) + s.rankFor(c).bonus(c.level) + StatusPenalties.total(conditions, s.castingAbility)

        /** Ability, proficiency, item bonus and armor effects of a check (no status penalties). */
        fun checkModifiers(c: Pf2eCharacter, spec: CheckSpec, armor: ArmorSpec? = null): List<Modifier> {
            val ability = spec.abilityOverride ?: spec.kind.defaultAbility
            return buildList {
                add(Modifier(ability.abbr, ModType.ABILITY, c.mod(ability)))
                add(Modifier("Prof. ${spec.rank.abbr}", ModType.PROFICIENCY, spec.rank.bonus(c.level)))
                if (spec.itemBonus != 0) add(Modifier("Item", ModType.ITEM, spec.itemBonus))
                armor?.let { addAll(it.checkModifiers(c, spec.kind, ability)) }
            }
        }
    }
}
