package d20.engine.pf2e

import d20.engine.core.DieType
import kotlinx.serialization.Serializable

/** Bonus type of an extra damage source. Typed sources keep only the largest per type; untyped always stack. */
@Serializable
enum class ExtraKind(val ptName: String) {
    CIRCUMSTANCE("Circunstância"), STATUS("Estado"), MAGIC("Mágico"), ITEM("Item"), UNTYPED("Sem tipo"),
}

/** Where the extra damage comes from (a selection, never free text). [afterMultipliers]: added after ×2 and saves. */
@Serializable
enum class ExtraSource(val ptName: String, val afterMultipliers: Boolean = false) {
    DANGEROUS_SORCERY("Feitiçaria Perigosa"),
    ELEMENTAL_ZONE("Zona elemental"),
    WEAKNESS("Fraqueza do alvo", afterMultipliers = true),
    SPELL_EFFECT("Efeito mágico"),
    FEAT("Talento ou habilidade"),
    ITEM_EFFECT("Item ou runa"),
    OTHER("Outra fonte"),
}

/**
 * Extra damage added to a spell: dice and/or a flat amount of [damageType] (null = the spell's own type).
 * Dangerous Sorcery is a status bonus equal to the spell rank; weakness is untyped and applied after multipliers.
 */
@Serializable
data class ExtraDamage(
    val source: ExtraSource,
    val kind: ExtraKind = ExtraKind.UNTYPED,
    val diceCount: Int = 0,
    val die: DieType = DieType.D6,
    val flat: Int = 0,
    val damageType: DamageType? = null,
) {
    val label: String get() = "${source.ptName} (${kind.ptName})"

    /** "1d6+2", "2" or "1d6". */
    val notation: String
        get() = when {
            diceCount > 0 && flat != 0 -> "$diceCount${die.label}${if (flat > 0) "+" else ""}$flat"
            diceCount > 0 -> "$diceCount${die.label}"
            else -> "$flat"
        }

    /** Expected value, used to keep the larger of two same-type sources. */
    val average: Double get() = diceCount * (die.sides + 1) / 2.0 + flat
}

data class ResolvedExtras(val applied: List<ExtraDamage>, val ignored: List<ExtraDamage>)

object ExtraDamageStack {
    /** Same stacking rule as modifiers: per bonus type only the largest applies; "Sem tipo" always stacks. */
    fun resolve(extras: List<ExtraDamage>): ResolvedExtras {
        val (untyped, typed) = extras.partition { it.kind == ExtraKind.UNTYPED }
        val best = typed.groupBy { it.kind }.values.map { group -> group.maxBy { it.average } }
        val applied = extras.filter { e -> e in untyped || best.any { it === e } }
        return ResolvedExtras(applied, extras.filterNot { e -> applied.any { it === e } })
    }
}
