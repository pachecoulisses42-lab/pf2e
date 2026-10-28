package d20.engine.pf2e

/** Human-readable roll formulas derived from the selections (display / export only, never parsed back). */
object Formulas {
    private fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

    /** Static attack bonus (no status penalties). */
    fun attackBonus(c: Pf2eCharacter, w: WeaponSpec): Int = c.mod(w.attackAbility) + w.rank.bonus(c.level) + w.potency

    fun spellAttackBonus(c: Pf2eCharacter, s: SpellSpec): Int = c.mod(s.castingAbility) + s.rank.bonus(c.level)

    fun checkBonus(c: Pf2eCharacter, spec: CheckSpec): Int =
        c.mod(spec.abilityOverride ?: spec.kind.defaultAbility) + spec.rank.bonus(c.level) + spec.itemBonus

    fun bombBonus(c: Pf2eCharacter, spec: ConsumableSpec): Int =
        c.mod(Ability.DEX) + spec.rank.bonus(c.level) + ConsumableTables.bomb(spec.kind, spec.grade).attackBonus

    fun attack(c: Pf2eCharacter, w: WeaponSpec): String = "1d20${signed(attackBonus(c, w))}"

    fun damage(c: Pf2eCharacter, w: WeaponSpec): String {
        val strBonus = if (w.attackAbility == Ability.STR) c.mod(Ability.STR) else 0
        val flat = strBonus + w.rank.specializationDamage(w.greaterSpecialization)
        val base = "${w.totalDice}${w.die.label}" + if (flat != 0) signed(flat) else ""
        return base + w.elemental.joinToString("") { " +1d6" }
    }

    fun spellAttack(c: Pf2eCharacter, s: SpellSpec): String = "1d20${signed(spellAttackBonus(c, s))}"

    fun spellDamage(s: SpellSpec): String = "${s.diceCount}${s.die.label}"

    fun check(c: Pf2eCharacter, spec: CheckSpec): String = "1d20${signed(checkBonus(c, spec))}"

    /** Healing: ("2d8+5", null). Bombs: (attack, damage). Custom items have no formula. */
    fun consumable(c: Pf2eCharacter, spec: ConsumableSpec): Pair<String, String?>? = when {
        spec.kind == ConsumableKind.HEALING_POTION -> {
            val (n, flat) = ConsumableTables.healing(spec.grade)
            ("${n}d8" + if (flat != 0) signed(flat) else "") to null
        }
        spec.kind.isBomb -> {
            val b = ConsumableTables.bomb(spec.kind, spec.grade)
            val direct = if (b.die != null) "${b.diceCount}${b.die.label}" else "${b.directFlat}"
            "1d20${signed(bombBonus(c, spec))}" to "$direct +${b.splash} respingo"
        }
        else -> null
    }
}
