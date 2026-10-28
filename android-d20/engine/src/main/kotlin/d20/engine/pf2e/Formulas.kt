package d20.engine.pf2e

/** Human-readable roll formulas derived from the selections (display / export only, never parsed back). */
object Formulas {
    private fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

    fun attack(c: Pf2eCharacter, w: WeaponSpec): String {
        val total = c.mod(w.attackAbility) + w.rank.bonus(c.level) + w.potency
        return "1d20${signed(total)}"
    }

    fun damage(c: Pf2eCharacter, w: WeaponSpec): String {
        val strBonus = if (w.attackAbility == Ability.STR) c.mod(Ability.STR) else 0
        val flat = strBonus + w.rank.specializationDamage(w.greaterSpecialization)
        val base = "${w.totalDice}${w.die.label}" + if (flat != 0) signed(flat) else ""
        return base + w.elemental.joinToString("") { " +1d6" }
    }

    fun spellAttack(c: Pf2eCharacter, s: SpellSpec): String =
        "1d20${signed(c.mod(s.castingAbility) + s.rank.bonus(c.level))}"

    fun spellDamage(s: SpellSpec): String = "${s.diceCount}${s.die.label}"

    fun check(c: Pf2eCharacter, spec: CheckSpec): String {
        val ability = spec.abilityOverride ?: spec.kind.defaultAbility
        return "1d20${signed(c.mod(ability) + spec.rank.bonus(c.level) + spec.itemBonus)}"
    }

    /** Healing: ("2d8+5", null). Bombs: (attack, damage). Custom items have no formula. */
    fun consumable(c: Pf2eCharacter, spec: ConsumableSpec): Pair<String, String?>? = when {
        spec.kind == ConsumableKind.HEALING_POTION -> {
            val (n, flat) = ConsumableTables.healing(spec.grade)
            ("${n}d8" + if (flat != 0) signed(flat) else "") to null
        }
        spec.kind.isBomb -> {
            val b = ConsumableTables.bomb(spec.kind, spec.grade)
            val direct = if (b.die != null) "${b.diceCount}${b.die.label}" else "${b.directFlat}"
            "1d20${signed(c.mod(Ability.DEX) + spec.rank.bonus(c.level) + b.attackBonus)}" to "$direct +${b.splash} respingo"
        }
        else -> null
    }
}
