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

data class DamageRoll(val parts: List<DamagePart>) {
    private val raw: Int get() = parts.sumOf { it.subtotal }

    /** Damage on a normal hit (minimum 1). */
    val total: Int get() = maxOf(1, raw)

    /** A critical hit doubles every die and bonus (not just the dice). */
    val criticalTotal: Int get() = maxOf(1, raw * 2)
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
    fun damageFor(targetDegree: Degree): Int = targetDegree.basicSaveDamage(damage.total)
}
