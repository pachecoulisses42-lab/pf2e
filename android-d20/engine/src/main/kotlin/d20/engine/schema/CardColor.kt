package d20.engine.schema

import kotlinx.serialization.Serializable

/** The card fill palette (taken from the app's visual reference); selectable per station. */
@Serializable
enum class CardColor(val ptName: String) {
    MOSTARDA("Mostarda"), VERDE("Verde"), CORAL("Coral"), AZUL("Azul"), VIOLETA("Violeta"), ROSA("Rosa"),
}

/** The user's choice, or a default by module type. */
fun Station.effectiveColor(): CardColor = color ?: when (this) {
    is ActionStation -> CardColor.MOSTARDA
    is SpellStation -> CardColor.AZUL
    is SkillStation -> CardColor.VERDE
    is ConsumableStation -> CardColor.CORAL
    is ResourceStation -> CardColor.VIOLETA
    is ConditionsStation -> CardColor.ROSA
}

/** Single Hit Point pool: the first resource station's maximum. */
fun Dashboard.maxHp(): Int =
    zones.all().flatMap { it.second.stations }.filterIsInstance<ResourceStation>().firstOrNull()?.maxHp ?: 0

fun Dashboard.resourceStation(): ResourceStation? =
    zones.all().flatMap { it.second.stations }.filterIsInstance<ResourceStation>().firstOrNull()
