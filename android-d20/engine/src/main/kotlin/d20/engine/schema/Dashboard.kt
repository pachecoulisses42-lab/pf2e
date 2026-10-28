package d20.engine.schema

import d20.engine.pf2e.ArmorSpec
import d20.engine.conditions.ConditionEffect
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.Pf2eCharacter
import d20.engine.pf2e.ShieldKind
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.WeaponSpec
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Zone subdivision law (guide §1.1): 1, 2 or 4 stations. */
@Serializable
enum class GridLayout(val slots: Int, val ptName: String) {
    GRID_1X1(1, "1 estação (largura total)"),
    GRID_1X2(2, "2 estações (meia largura)"),
    GRID_2X2(4, "4 estações (grade 2×2)"),
}

/** Drives the card glow colour (guide §6.1: glow follows `characterClass`). */
@Serializable
enum class PfClass(val ptName: String) {
    ALCHEMIST("Alquimista"), BARBARIAN("Bárbaro"), BARD("Bardo"), CHAMPION("Campeão"), CLERIC("Clérigo"),
    DRUID("Druida"), FIGHTER("Guerreiro"), INVESTIGATOR("Investigador"), MONK("Monge"), RANGER("Patrulheiro"),
    ROGUE("Ladino"), SORCERER("Feiticeiro"), SWASHBUCKLER("Espadachim"), WITCH("Bruxo"), WIZARD("Mago"),
}

/** A module that snaps into a zone slot. Types mirror the guide: ACTION | SPELL | SKILL | RESOURCE. */
@Serializable
sealed interface Station {
    val id: String

    /** Card fill chosen by the user; null falls back to a default by module type. */
    val color: CardColor?

    /** Display title: the user's custom name when the station has one, else a default label. */
    val title: String
}

@Serializable
@SerialName("ACTION")
data class ActionStation(override val id: String, val weapon: WeaponSpec, override val color: CardColor? = null) : Station {
    override val title: String get() = weapon.name
}

@Serializable
@SerialName("SPELL")
data class SpellStation(override val id: String, val spell: SpellSpec, override val color: CardColor? = null) : Station {
    override val title: String get() = spell.name
}

@Serializable
@SerialName("SKILL")
data class SkillStation(
    override val id: String,
    val check: CheckSpec,
    /** Conditions this check can impose or remove (Demoralize, Trip, ...). */
    val effects: List<ConditionEffect> = emptyList(),
    override val color: CardColor? = null,
) : Station {
    override val title: String get() = check.customName?.takeIf { it.isNotBlank() } ?: check.kind.ptName
}

/** Potion or bomb: one tap uses one item, rolls its dice and lists the conditions it imposes. */
@Serializable
@SerialName("CONSUMABLE")
data class ConsumableStation(override val id: String, val consumable: ConsumableSpec, override val color: CardColor? = null) : Station {
    override val title: String
        get() = consumable.name.ifBlank { "${consumable.kind.ptName} (${consumable.grade.ptName})" }
}

/** Opens the conditions module: shows active conditions and processes turns. Holds no configuration. */
@Serializable
@SerialName("CONDITIONS")
data class ConditionsStation(override val id: String, override val color: CardColor? = null) : Station {
    override val title: String get() = "Condições"
}

/** HP and AC tracker. Current HP is play-state and lives outside the locked dashboard. */
@Serializable
@SerialName("RESOURCE")
data class ResourceStation(
    override val id: String,
    val maxHp: Int,
    val armor: ArmorSpec,
    /** Optional shield; Hardness, HP and AC bonus come from [ShieldKind]. */
    val shield: ShieldKind? = null,
    override val color: CardColor? = null,
) : Station {
    override val title: String get() = "Vida & Defesa"
}

@Serializable
data class ZoneConfig(val layout: GridLayout, val stations: List<Station>)

@Serializable
data class Zones(val zone1: ZoneConfig, val zone2: ZoneConfig, val zone3: ZoneConfig) {
    fun all(): List<Pair<String, ZoneConfig>> = listOf("zone1" to zone1, "zone2" to zone2, "zone3" to zone3)
}

@Serializable
data class Dashboard(
    val schemaVersion: Int = SCHEMA_VERSION,
    val ruleSystem: String = RULE_SYSTEM_PF2E,
    val characterId: String,
    /** Free text: the character's name. */
    val name: String,
    val characterClass: PfClass,
    val character: Pf2eCharacter,
    val zones: Zones,
) {
    companion object {
        const val SCHEMA_VERSION = 1
        const val RULE_SYSTEM_PF2E = "pf2e-remaster"
    }
}
