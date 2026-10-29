package d20.engine.schema

import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.EffectTarget
import d20.engine.conditions.EffectTrigger
import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.WeaponSpec
import d20.engine.pf2e.WeaponTrait
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/** A ready-made module the user picks when adding a station; it is copied into the panel and can then be edited. */
data class ModuleTemplate(val type: StationType, val group: String, val station: Station) {
    val title: String get() = station.title
}

/** The station type a module belongs to (the add-module sheet groups by it). */
fun Station.type(): StationType = when (this) {
    is ActionStation -> StationType.ACTION
    is SpellStation -> StationType.SPELL
    is SkillStation -> StationType.SKILL
    is ConsumableStation -> StationType.CONSUMABLE
    is ResourceStation -> StationType.RESOURCE
    is ConditionsStation -> StationType.CONDITIONS
}

/** The same module under another id (templates and saved modules are copied, never shared). */
fun Station.withId(id: String): Station = when (this) {
    is ActionStation -> copy(id = id)
    is SpellStation -> copy(id = id)
    is SkillStation -> copy(id = id)
    is ConsumableStation -> copy(id = id)
    is ResourceStation -> copy(id = id)
    is ConditionsStation -> copy(id = id)
}

/**
 * Basic Pathfinder 2e Remaster modules: weapon stats from the Player Core weapon tables, cantrips and spells at
 * the rank they are learned, potions and bombs from the equipment data. Proficiency starts at Trained.
 */
object ModuleLibrary {
    private const val TPL = "tpl"

    private fun weapon(
        name: String, count: Int, die: DieType, type: DamageType, group: String,
        ability: Ability = Ability.STR, agile: Boolean = false, traits: List<WeaponTrait> = emptyList(),
    ) = ModuleTemplate(StationType.ACTION, group, ActionStation(TPL, WeaponSpec(name, ability, Rank.TRAINED, count, die, type, agile = agile, traits = traits)))

    private fun spell(
        name: String, mode: SpellMode, count: Int, die: DieType, type: DamageType, group: String,
        ability: Ability = Ability.INT, save: CheckKind = CheckKind.REFLEX,
    ) = ModuleTemplate(StationType.SPELL, group, SpellStation(TPL, SpellSpec(name, mode, ability, Rank.TRAINED, count, die, type, save, fromClass = true)))

    private fun item(kind: ConsumableKind, grade: ConsumableGrade, group: String, quantity: Int = 2, name: String = "") =
        ModuleTemplate(StationType.CONSUMABLE, group, ConsumableStation(TPL, ConsumableSpec(name, kind, grade, quantity = quantity)))

    private fun skill(kind: CheckKind, group: String, name: String? = null, effects: List<ConditionEffect> = emptyList()) =
        ModuleTemplate(StationType.SKILL, group, SkillStation(TPL, CheckSpec(kind, Rank.TRAINED, customName = name), effects))

    private const val MELEE = "Armas corpo a corpo"
    private const val RANGED = "Armas à distância"
    private const val CANTRIP = "Truques"
    private const val SPELLS = "Magias"
    private const val POTIONS = "Poções"
    private const val BOMBS = "Bombas"
    private const val ACTIONS = "Ações de perícia"
    private const val SAVES = "Resistências e percepção"

    val basics: List<ModuleTemplate> = listOf(
        weapon("Adaga", 1, DieType.D4, DamageType.PIERCING, MELEE, agile = true),
        weapon("Espada curta", 1, DieType.D6, DamageType.PIERCING, MELEE, agile = true),
        weapon("Rapieira", 1, DieType.D6, DamageType.PIERCING, MELEE, traits = listOf(WeaponTrait.DEADLY_D8)),
        weapon("Cimitarra", 1, DieType.D6, DamageType.SLASHING, MELEE),
        weapon("Clava", 1, DieType.D6, DamageType.BLUDGEONING, MELEE),
        weapon("Mangual", 1, DieType.D6, DamageType.BLUDGEONING, MELEE),
        weapon("Lança", 1, DieType.D6, DamageType.PIERCING, MELEE),
        weapon("Picareta", 1, DieType.D6, DamageType.PIERCING, MELEE, traits = listOf(WeaponTrait.FATAL_D10)),
        weapon("Espada longa", 1, DieType.D8, DamageType.SLASHING, MELEE),
        weapon("Machado de batalha", 1, DieType.D8, DamageType.SLASHING, MELEE),
        weapon("Martelo de guerra", 1, DieType.D8, DamageType.BLUDGEONING, MELEE),
        weapon("Picareta grande", 1, DieType.D10, DamageType.PIERCING, MELEE, traits = listOf(WeaponTrait.FATAL_D12)),
        weapon("Espada grande", 1, DieType.D12, DamageType.SLASHING, MELEE),
        weapon("Machado grande", 1, DieType.D12, DamageType.SLASHING, MELEE),
        weapon("Punho", 1, DieType.D4, DamageType.BLUDGEONING, MELEE, agile = true),
        weapon("Arco curto", 1, DieType.D6, DamageType.PIERCING, RANGED, Ability.DEX, traits = listOf(WeaponTrait.DEADLY_D10)),
        weapon("Arco longo", 1, DieType.D8, DamageType.PIERCING, RANGED, Ability.DEX, traits = listOf(WeaponTrait.DEADLY_D10)),
        weapon("Besta", 1, DieType.D8, DamageType.PIERCING, RANGED, Ability.DEX),
        weapon("Funda", 1, DieType.D6, DamageType.BLUDGEONING, RANGED, Ability.DEX),

        spell("Arco Elétrico", SpellMode.SAVE, 2, DieType.D4, DamageType.ELECTRICITY, CANTRIP),
        spell("Jato Cáustico", SpellMode.SAVE, 2, DieType.D8, DamageType.ACID, CANTRIP),
        spell("Queimadura de Gelo", SpellMode.SAVE, 2, DieType.D4, DamageType.COLD, CANTRIP, save = CheckKind.FORTITUDE),
        spell("Ignição", SpellMode.ATTACK, 2, DieType.D4, DamageType.FIRE, CANTRIP),
        spell("Projétil Telecinético", SpellMode.ATTACK, 2, DieType.D6, DamageType.BLUDGEONING, CANTRIP),
        spell("Lança Divina", SpellMode.ATTACK, 2, DieType.D4, DamageType.SPIRIT, CANTRIP, Ability.WIS),
        spell("Açoite Vital", SpellMode.SAVE, 2, DieType.D6, DamageType.VITALITY, CANTRIP, Ability.WIS, CheckKind.FORTITUDE),
        spell("Distorção do Vazio", SpellMode.SAVE, 2, DieType.D4, DamageType.VOID, CANTRIP, Ability.WIS, CheckKind.FORTITUDE),
        spell("Atordoar", SpellMode.SAVE, 1, DieType.D6, DamageType.MENTAL, CANTRIP, Ability.CHA, CheckKind.WILL),
        spell("Sopro de Fogo (1º)", SpellMode.SAVE, 2, DieType.D6, DamageType.FIRE, SPELLS),
        spell("Bola de Fogo (3º)", SpellMode.SAVE, 6, DieType.D6, DamageType.FIRE, SPELLS),
        spell("Relâmpago (3º)", SpellMode.SAVE, 4, DieType.D12, DamageType.ELECTRICITY, SPELLS),

        item(ConsumableKind.HEALING_POTION, ConsumableGrade.MINOR, POTIONS, 3),
        item(ConsumableKind.HEALING_POTION, ConsumableGrade.LESSER, POTIONS),
        item(ConsumableKind.HEALING_POTION, ConsumableGrade.MODERATE, POTIONS),
        item(ConsumableKind.HEALING_POTION, ConsumableGrade.GREATER, POTIONS, 1),
        item(ConsumableKind.HEALING_POTION, ConsumableGrade.MAJOR, POTIONS, 1),
        item(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.LESSER, BOMBS, 3),
        item(ConsumableKind.ACID_FLASK, ConsumableGrade.LESSER, BOMBS, 3),
        item(ConsumableKind.BOTTLED_LIGHTNING, ConsumableGrade.LESSER, BOMBS, 3),
        item(ConsumableKind.FROST_VIAL, ConsumableGrade.LESSER, BOMBS, 3),
        item(ConsumableKind.BLASTING_STONE, ConsumableGrade.LESSER, BOMBS, 3),

        skill(CheckKind.INTIMIDATION, ACTIONS, "Desmoralizar", listOf(
            ConditionEffect(ConditionKind.FRIGHTENED, 1, trigger = EffectTrigger.SUCCESS),
            ConditionEffect(ConditionKind.FRIGHTENED, 2, trigger = EffectTrigger.CRITICAL_SUCCESS),
        )),
        skill(CheckKind.ATHLETICS, ACTIONS, "Derrubar", listOf(
            ConditionEffect(ConditionKind.PRONE, trigger = EffectTrigger.ANY_SUCCESS),
            ConditionEffect(ConditionKind.PRONE, target = EffectTarget.SELF, trigger = EffectTrigger.CRITICAL_FAILURE),
        )),
        skill(CheckKind.ATHLETICS, ACTIONS, "Agarrar", listOf(
            ConditionEffect(ConditionKind.GRABBED, trigger = EffectTrigger.SUCCESS),
            ConditionEffect(ConditionKind.RESTRAINED, trigger = EffectTrigger.CRITICAL_SUCCESS),
        )),
        skill(CheckKind.DECEPTION, ACTIONS, "Fintar", listOf(
            ConditionEffect(ConditionKind.OFF_GUARD, trigger = EffectTrigger.ANY_SUCCESS, note = "contra seu próximo ataque corpo a corpo"),
            ConditionEffect(ConditionKind.OFF_GUARD, target = EffectTarget.SELF, trigger = EffectTrigger.CRITICAL_FAILURE, rounds = 1),
        )),
        skill(CheckKind.ATHLETICS, ACTIONS, "Empurrar"),
        skill(CheckKind.STEALTH, ACTIONS, "Esconder-se"),
        skill(CheckKind.MEDICINE, ACTIONS, "Tratar Ferimentos"),
        skill(CheckKind.PERCEPTION, SAVES),
        skill(CheckKind.FORTITUDE, SAVES),
        skill(CheckKind.REFLEX, SAVES),
        skill(CheckKind.WILL, SAVES),
    )

    fun forType(type: StationType): List<ModuleTemplate> = basics.filter { it.type == type }
}

/** The user's own saved modules, shared by every character. Stored as one JSON array. */
object SavedModules {
    private val json = Json { classDiscriminator = "type"; encodeDefaults = true; ignoreUnknownKeys = true; explicitNulls = false }
    private val serializer = ListSerializer(Station.serializer())

    fun encode(modules: List<Station>): String = json.encodeToString(serializer, modules)

    /** Unreadable data yields an empty library instead of crashing the app. */
    fun decode(text: String?): List<Station> =
        if (text.isNullOrBlank()) emptyList() else runCatching { json.decodeFromString(serializer, text) }.getOrDefault(emptyList())

    /** Adds [station] as a new saved module (fresh id); a module with the same type and title is replaced. */
    fun add(modules: List<Station>, station: Station): List<Station> {
        val next = (modules.mapNotNull { Regex("lib-(\\d+)").matchEntire(it.id)?.groupValues?.get(1)?.toInt() }.maxOrNull() ?: 0) + 1
        val kept = modules.filterNot { it.type() == station.type() && it.title == station.title }
        return kept + station.withId("lib-%03d".format(next))
    }

    fun remove(modules: List<Station>, id: String): List<Station> = modules.filterNot { it.id == id }
}
