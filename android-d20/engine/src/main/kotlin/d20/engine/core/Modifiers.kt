package d20.engine.core

import kotlinx.serialization.Serializable

/** PF2e bonus/penalty types. Everything except [UNTYPED] follows "highest bonus / worst penalty per type". */
@Serializable
enum class ModType { ABILITY, PROFICIENCY, ITEM, CIRCUMSTANCE, STATUS, UNTYPED }

@Serializable
data class Modifier(val label: String, val type: ModType, val value: Int)

data class ResolvedModifiers(
    val applied: List<Modifier>,
    val ignored: List<Modifier>,
) {
    val total: Int get() = applied.sumOf { it.value }
}

object ModifierStack {
    /**
     * Consolidates modifiers per the typing rule (guide §2.1): within a type, only the largest bonus and the
     * worst penalty count. Untyped modifiers are the PF2e exception and always stack. Ties keep the first listed.
     */
    fun resolve(modifiers: List<Modifier>): ResolvedModifiers {
        val applied = mutableListOf<Modifier>()
        val ignored = mutableListOf<Modifier>()

        val (untyped, typed) = modifiers.partition { it.type == ModType.UNTYPED }
        applied += untyped

        for ((_, group) in typed.groupBy { it.type }) {
            val bonuses = group.filter { it.value >= 0 }
            val penalties = group.filter { it.value < 0 }
            val bestBonus = bonuses.maxByOrNull { it.value }
            val worstPenalty = penalties.minByOrNull { it.value }
            bestBonus?.let { applied += it }
            worstPenalty?.let { applied += it }
            ignored += group.filter { it !== bestBonus && it !== worstPenalty }
        }
        return ResolvedModifiers(applied, ignored)
    }
}
