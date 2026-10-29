package d20.engine.pf2e

import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.PersistentSpec
import d20.engine.core.DieType
import kotlinx.serialization.Serializable

@Serializable
enum class ConsumableKind(val ptName: String, val isBomb: Boolean) {
    HEALING_POTION("Poção de cura", false),
    ALCHEMISTS_FIRE("Fogo alquímico", true),
    ACID_FLASK("Frasco de ácido", true),
    BOTTLED_LIGHTNING("Relâmpago engarrafado", true),
    FROST_VIAL("Frasco de gelo", true),
    BLASTING_STONE("Pedra explosiva", true),
    CUSTOM("Poção ou elixir (só efeitos)", false),
}

@Serializable
enum class ConsumableGrade(val ptName: String) {
    MINOR("Menor"), LESSER("Inferior"), MODERATE("Moderado"), GREATER("Maior"), MAJOR("Superior");
}

@Serializable
data class ConsumableSpec(
    /** Free text: optional custom item name. */
    val name: String,
    val kind: ConsumableKind,
    val grade: ConsumableGrade,
    /** Proficiency used to throw bombs. */
    val rank: Rank = Rank.TRAINED,
    val effects: List<ConditionEffect> = emptyList(),
    /** How many you carry; Play mode counts uses down. */
    val quantity: Int = 1,
)

/** Bomb numbers taken from the Pathfinder equipment data (lesser 1 → major 4 dice). */
data class BombStats(
    val diceCount: Int, val die: DieType?, val directFlat: Int, val type: DamageType,
    val persistent: PersistentSpec?, val splash: Int, val attackBonus: Int,
    val speedPenaltyFeet: Int?, val deafenDc: Int?,
)

object ConsumableTables {
    /** Healing potion: (dice of d8, flat bonus). */
    fun healing(grade: ConsumableGrade): Pair<Int, Int> = when (grade) {
        ConsumableGrade.MINOR -> 1 to 0
        ConsumableGrade.LESSER -> 2 to 5
        ConsumableGrade.MODERATE -> 3 to 10
        ConsumableGrade.GREATER -> 6 to 20
        ConsumableGrade.MAJOR -> 8 to 30
    }

    /** Grades a kind exists in. */
    fun grades(kind: ConsumableKind): List<ConsumableGrade> = when {
        kind == ConsumableKind.HEALING_POTION -> ConsumableGrade.entries
        kind.isBomb -> ConsumableGrade.entries.drop(1)
        else -> ConsumableGrade.entries
    }

    fun bomb(kind: ConsumableKind, grade: ConsumableGrade): BombStats {
        require(kind.isBomb && grade != ConsumableGrade.MINOR) { "Bomba inexistente: $kind $grade" }
        val n = grade.ordinal // lesser 1 .. major 4
        return when (kind) {
            ConsumableKind.ALCHEMISTS_FIRE -> BombStats(n, DieType.D8, 0, DamageType.FIRE, PersistentSpec(0, null, n, DamageType.FIRE), n, n - 1, null, null)
            ConsumableKind.ACID_FLASK -> BombStats(0, null, 1, DamageType.ACID, PersistentSpec(n, DieType.D6, 0, DamageType.ACID), n, n - 1, null, null)
            ConsumableKind.BOTTLED_LIGHTNING -> BombStats(n, DieType.D6, 0, DamageType.ELECTRICITY, null, n, n - 1, null, null)
            ConsumableKind.FROST_VIAL -> BombStats(n, DieType.D6, 0, DamageType.COLD, null, n, n - 1, listOf(5, 10, 10, 15)[n - 1], null)
            ConsumableKind.BLASTING_STONE -> BombStats(n, DieType.D4, 0, DamageType.SONIC, null, n, n - 1, null, listOf(17, 20, 28, 36)[n - 1])
            else -> error("Não é uma bomba: $kind")
        }
    }
}
