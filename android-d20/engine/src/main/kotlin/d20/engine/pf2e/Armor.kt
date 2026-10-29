package d20.engine.pf2e

import kotlinx.serialization.Serializable

@Serializable
enum class ArmorCategory(val ptName: String) { UNARMORED("Sem armadura"), LIGHT("Leve"), MEDIUM("Média"), HEAVY("Pesada") }

/** Property rune that gives an item bonus to one skill, save or Lore (e.g. Shadow: Stealth). */
@Serializable
data class SkillRune(val skill: CheckKind, val bonus: Int = 1)

/** Resistance to a damage type, e.g. an energy-resistant rune (5) or its greater version (10). */
@Serializable
data class Resistance(val type: DamageType, val value: Int = 5)

/** Basic armors from the Pathfinder 2e Remaster Player Core armor table. */
object ArmorCatalog {
    private fun armor(name: String, cat: ArmorCategory, ac: Int, dexCap: Int, check: Int = 0, speed: Int = 0, str: Int? = null) =
        ArmorSpec(Rank.TRAINED, ac, dexCap, name, cat, check, speed, str)

    val basics: List<ArmorSpec> = listOf(
        armor("Sem armadura", ArmorCategory.UNARMORED, 0, 6),
        armor("Roupas de explorador", ArmorCategory.UNARMORED, 0, 5),
        armor("Armadura acolchoada", ArmorCategory.LIGHT, 1, 3, str = 0),
        armor("Armadura de couro", ArmorCategory.LIGHT, 1, 4, check = 1, str = 0),
        armor("Couro batido", ArmorCategory.LIGHT, 2, 3, check = 1, str = 1),
        armor("Camisa de cota de malha", ArmorCategory.LIGHT, 2, 3, check = 1, str = 1),
        armor("Gibão de peles", ArmorCategory.MEDIUM, 3, 2, check = 2, speed = 5, str = 2),
        armor("Cota de escamas", ArmorCategory.MEDIUM, 3, 2, check = 2, speed = 5, str = 2),
        armor("Cota de malha", ArmorCategory.MEDIUM, 4, 1, check = 2, speed = 5, str = 3),
        armor("Peitoral", ArmorCategory.MEDIUM, 4, 1, check = 2, speed = 5, str = 3),
        armor("Cota de talas", ArmorCategory.HEAVY, 5, 1, check = 3, speed = 10, str = 3),
        armor("Meia armadura", ArmorCategory.HEAVY, 5, 1, check = 3, speed = 10, str = 3),
        armor("Armadura completa", ArmorCategory.HEAVY, 6, 0, check = 3, speed = 10, str = 4),
    )

    /** Swaps the armor's base stats for a catalog entry, keeping the proficiency and every rune. */
    fun apply(current: ArmorSpec, base: ArmorSpec): ArmorSpec = base.copy(
        rank = current.rank, potency = current.potency, resilient = current.resilient,
        skillRunes = current.skillRunes, resistances = current.resistances,
    )
}
