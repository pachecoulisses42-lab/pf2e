package d20.engine.schema

import d20.engine.pf2e.Ability
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
enum class PfClass(val ptName: String, val keyAbility: Ability) {
    ALCHEMIST("Alquimista", Ability.INT), BARBARIAN("Bárbaro", Ability.STR), BARD("Bardo", Ability.CHA),
    CHAMPION("Campeão", Ability.STR), CLERIC("Clérigo", Ability.WIS), DRUID("Druida", Ability.WIS),
    FIGHTER("Guerreiro", Ability.STR), INVESTIGATOR("Investigador", Ability.INT), MONK("Monge", Ability.STR),
    RANGER("Patrulheiro", Ability.STR), ROGUE("Ladino", Ability.DEX), SORCERER("Feiticeiro", Ability.CHA),
    SWASHBUCKLER("Espadachim", Ability.DEX), WITCH("Bruxo", Ability.INT), WIZARD("Mago", Ability.INT),
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

/** Kind of an ability module: imported talents, class features and spells without dice. */
@Serializable
enum class AbilityCategory(val ptName: String) {
    CLASS_FEAT("Talento de classe"), ANCESTRY_FEAT("Talento de ancestralidade"), SKILL_FEAT("Talento de perícia"),
    GENERAL_FEAT("Talento geral"), ARCHETYPE_FEAT("Talento de arquétipo"), CLASS_FEATURE("Característica de classe"),
    SPELL("Magia"), FOCUS_SPELL("Magia de foco"), OTHER("Outra"),
}

/** A talent, class feature or spell without dice: tapping it lists the conditions it imposes or removes. */
@Serializable
@SerialName("ABILITY")
data class AbilityStation(
    override val id: String,
    /** Free text: the ability's name. */
    val name: String,
    val category: AbilityCategory,
    val level: Int = 0,
    val effects: List<ConditionEffect> = emptyList(),
    override val color: CardColor? = null,
) : Station {
    override val title: String get() = name
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

/** The class DC's key attribute: the one chosen in the Ficha, else the class's usual one. */
fun Dashboard.keyAbility(): Ability = character.keyAbility ?: characterClass.keyAbility

/** Class DC = 10 + key attribute + class proficiency (level + 2/4/6/8). */
fun Dashboard.classDc(): Int = 10 + character.mod(keyAbility()) + character.classRank.bonus(character.level)

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
    /** Modules kept for this character but not on the panel (e.g. everything imported from Pathbuilder). */
    val library: List<Station> = emptyList(),
) {
    companion object {
        const val SCHEMA_VERSION = 1
        const val RULE_SYSTEM_PF2E = "pf2e-remaster"
    }
}
