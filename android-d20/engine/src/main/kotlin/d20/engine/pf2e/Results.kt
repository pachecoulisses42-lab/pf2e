package d20.engine.pf2e

import d20.engine.core.Degree
import d20.engine.core.ResolvedModifiers

data class CheckResult(
    val natural: Int,
    val modifiers: ResolvedModifiers,
    val dc: Int?,
) {
    val total: Int get() = natural + modifiers.total
    val degree: Degree? get() = dc?.let { Degree.of(total, natural, it) }
}

/** One damage type's contribution: rolled [dice] plus [flat] bonus. */
data class DamagePart(
    val label: String,
    val type: DamageType,
    val diceNotation: String,
    val dice: List<Int>,
    val flat: Int,
) {
    val subtotal: Int get() = dice.sum() + flat
}

data class DamageRoll(
    val parts: List<DamagePart>,
    /** Fatal: the weapon dice rolled at the fatal size (+1 die); replaces the first part's dice on a critical. */
    val fatalPart: DamagePart? = null,
    /** Deadly: extra dice added after doubling, so they are not doubled. */
    val deadlyPart: DamagePart? = null,
    /** Splash damage: added to the target's damage but never multiplied. */
    val splashPart: DamagePart? = null,
    /** Added after every multiplier (the target's weakness), and only when some damage is dealt. */
    val postParts: List<DamagePart> = emptyList(),
    /** Extra damage left out by the stacking rule, e.g. "Zona elemental (Estado)". */
    val ignored: List<String> = emptyList(),
) {
    private val splash: Int get() = splashPart?.subtotal ?: 0
    private val raw: Int get() = parts.sumOf { it.subtotal }
    private val post: Int get() = postParts.sumOf { it.subtotal }

    /** Adds the after-multiplier parts to an already multiplied (or halved) amount. */
    fun afterMultipliers(amount: Int): Int = if (amount > 0) amount + post else amount

    /** Damage on a normal hit before the after-multiplier parts (minimum 1). */
    val baseTotal: Int get() = maxOf(1, raw + splash)

    /** Damage on a normal hit (minimum 1). */
    val total: Int get() = afterMultipliers(baseTotal)

    /** A critical hit doubles every die and bonus (Fatal included); Deadly dice and splash are added afterwards. */
    val criticalTotal: Int
        get() {
            val base = (fatalPart ?: parts.first()).subtotal + parts.drop(1).sumOf { it.subtotal }
            return afterMultipliers(maxOf(1, base * 2 + (deadlyPart?.dice?.sum() ?: 0) + splash))
        }

    /** Effects that triple damage (the user picks this after a roll without a target). */
    val tripleTotal: Int get() = afterMultipliers(maxOf(1, raw * 3 + splash))
}

data class AttackResult(val check: CheckResult, val damage: DamageRoll?) {
    /** True/false when a target AC was chosen; null when the crit outcome is unknown. */
    val criticalApplied: Boolean?
        get() = check.degree?.let { it == Degree.CRITICAL_SUCCESS }

    /** Damage to apply, or null when it cannot be decided (miss, or no target AC). */
    val damageToApply: Int?
        get() {
            val crit = criticalApplied ?: return null
            val d = damage ?: return null
            return if (crit) d.criticalTotal else d.total
        }
}

data class SpellSaveResult(
    val dc: Int,
    val targetSave: CheckKind,
    val damage: DamageRoll,
) {
    /** Basic saving throw: crit success 0, success half, failure full, crit failure double. */
    fun damageFor(targetDegree: Degree): Int = damage.afterMultipliers(targetDegree.basicSaveDamage(damage.baseTotal))
}

/** A thrown bomb: the attack, its damage (null on a critical failure) and persistent damage on a hit. */
data class BombResult(val check: CheckResult, val damage: DamageRoll?, val persistent: d20.engine.conditions.PersistentSpec?)
