package d20.engine.pf2e

import d20.engine.core.DieType
import kotlinx.serialization.Serializable

@Serializable
enum class Ability(val ptName: String, val abbr: String) {
    STR("Força", "FOR"), DEX("Destreza", "DES"), CON("Constituição", "CON"),
    INT("Inteligência", "INT"), WIS("Sabedoria", "SAB"), CHA("Carisma", "CAR"),
}

/** T/E/M/L proficiency ranks (+ untrained). [tier] is the bonus added to the character level. */
@Serializable
enum class Rank(val ptName: String, val abbr: String, private val tier: Int, private val specialization: Int) {
    UNTRAINED("Destreinado", "D", 0, 0),
    TRAINED("Treinado", "T", 2, 0),
    EXPERT("Perito", "E", 4, 2),
    MASTER("Mestre", "M", 6, 3),
    LEGENDARY("Lendário", "L", 8, 4);

    /** Proficiency bonus: level + 2/4/6/8, or 0 when untrained. */
    fun bonus(level: Int): Int = if (this == UNTRAINED) 0 else level + tier

    /** Weapon Specialization damage (E +2, M +3, L +4); Greater Specialization doubles it. */
    fun specializationDamage(greater: Boolean): Int = specialization * if (greater) 2 else 1
}

@Serializable
enum class DamageType(val ptName: String) {
    SLASHING("Cortante"), BLUDGEONING("Impactante"), PIERCING("Perfurante"),
    FIRE("Fogo"), COLD("Gelo"), ELECTRICITY("Eletricidade"), ACID("Ácido"), SONIC("Sônico"),
    BLEED("Sangramento"), POISON("Veneno"), MENTAL("Mental"), FORCE("Energia"),
    SPIRIT("Espírito"), VITALITY("Vitalidade"), VOID("Vazio");

    val isPhysical: Boolean get() = this == SLASHING || this == BLUDGEONING || this == PIERCING
}

/** Elemental property runes: each adds 1d6 of its own damage type, in its own field. */
@Serializable
enum class ElementalRune(val ptName: String, val damageType: DamageType) {
    FLAMING("Flamejante", DamageType.FIRE),
    FROST("Gélida", DamageType.COLD),
    SHOCK("Elétrica", DamageType.ELECTRICITY),
    CORROSIVE("Corrosiva", DamageType.ACID),
    THUNDERING("Trovejante", DamageType.SONIC),
}

/** Striking runes (the "impacto" rune): extra weapon damage dice. */
@Serializable
enum class StrikingRune(val ptName: String, val extraDice: Int) {
    NONE("Nenhuma", 0), STRIKING("Impacto", 1), GREATER("Impacto maior", 2), MAJOR("Impacto superior", 3),
}

/** Multiple attack penalty step; agile weapons take −4/−8 instead of −5/−10. */
enum class MapStep(val ptName: String, private val normal: Int, private val agile: Int) {
    FIRST("1º ataque", 0, 0), SECOND("2º ataque", -5, -4), THIRD("3º ataque", -10, -8);

    fun penalty(agileWeapon: Boolean): Int = if (agileWeapon) agile else normal
}

/** Weapon traits that change critical hits. Deadly adds dice after doubling; Fatal resizes the dice and adds one. */
@Serializable
enum class WeaponTrait(val ptName: String, val deadly: DieType?, val fatal: DieType?) {
    DEADLY_D6("Mortal d6", DieType.D6, null), DEADLY_D8("Mortal d8", DieType.D8, null), DEADLY_D10("Mortal d10", DieType.D10, null),
    FATAL_D8("Fatal d8", null, DieType.D8), FATAL_D10("Fatal d10", null, DieType.D10), FATAL_D12("Fatal d12", null, DieType.D12),
}

/** Base shields with Hardness, Hit Points and AC bonus taken from the Pathfinder equipment data. */
@Serializable
enum class ShieldKind(val ptName: String, val hardness: Int, val maxHp: Int, val acBonus: Int) {
    BUCKLER("Broquel", 3, 6, 1),
    WOODEN("Escudo de madeira", 3, 12, 2),
    STEEL("Escudo de aço", 5, 20, 2),
    TOWER("Escudo de torre", 5, 20, 2),
    FORTRESS("Escudo de fortaleza", 6, 24, 3);

    /** The shield is broken at half its Hit Points. */
    val brokenThreshold: Int get() = maxHp / 2
}

@Serializable
enum class CheckKind(val ptName: String, val defaultAbility: Ability) {
    PERCEPTION("Percepção", Ability.WIS),
    FORTITUDE("Fortitude", Ability.CON), REFLEX("Reflexos", Ability.DEX), WILL("Vontade", Ability.WIS),
    ACROBATICS("Acrobacia", Ability.DEX), ARCANA("Arcanismo", Ability.INT), ATHLETICS("Atletismo", Ability.STR),
    CRAFTING("Ofícios", Ability.INT), DECEPTION("Enganação", Ability.CHA), DIPLOMACY("Diplomacia", Ability.CHA),
    INTIMIDATION("Intimidação", Ability.CHA), LORE("Conhecimento", Ability.INT), MEDICINE("Medicina", Ability.WIS),
    NATURE("Natureza", Ability.WIS), OCCULTISM("Ocultismo", Ability.INT), PERFORMANCE("Atuação", Ability.CHA),
    RELIGION("Religião", Ability.WIS), SOCIETY("Sociedade", Ability.INT), STEALTH("Furtividade", Ability.DEX),
    SURVIVAL("Sobrevivência", Ability.WIS), THIEVERY("Ladinagem", Ability.DEX);

    val isSave: Boolean get() = this == FORTITUDE || this == REFLEX || this == WILL
}

/** Level and the six ability *modifiers* (picked from a list in the UI, never typed). */
@Serializable
data class Pf2eCharacter(
    val level: Int,
    val abilityMods: Map<Ability, Int>,
    /** Saving throw proficiency; a missing entry counts as Trained. */
    val saves: Map<CheckKind, Rank> = emptyMap(),
) {
    fun mod(ability: Ability): Int = abilityMods[ability] ?: 0
    fun saveRank(kind: CheckKind): Rank = saves[kind] ?: Rank.TRAINED
}

@Serializable
data class WeaponSpec(
    /** Free text: the weapon's custom name. */
    val name: String,
    /** "Primary attribute": STR adds to attack *and* damage, any other adds to attack only. */
    val attackAbility: Ability,
    val rank: Rank,
    val diceCount: Int,
    val die: DieType,
    val damageType: DamageType,
    /** Potency rune: +0..+3 to attack rolls (item bonus). */
    val potency: Int = 0,
    val striking: StrikingRune = StrikingRune.NONE,
    /** Up to 3 elemental property runes, each its own field. */
    val elemental: List<ElementalRune> = emptyList(),
    val greaterSpecialization: Boolean = false,
    val agile: Boolean = false,
    /** At most one Deadly and one Fatal. */
    val traits: List<WeaponTrait> = emptyList(),
) {
    val totalDice: Int get() = diceCount + striking.extraDice
    val deadlyDie: DieType? get() = traits.firstNotNullOfOrNull { it.deadly }
    val fatalDie: DieType? get() = traits.firstNotNullOfOrNull { it.fatal }
}

@Serializable
enum class SpellMode(val ptName: String) { ATTACK("Ataque mágico"), SAVE("Teste de resistência (CD)") }

@Serializable
data class SpellSpec(
    /** Free text: the spell's custom name. */
    val name: String,
    val mode: SpellMode,
    val castingAbility: Ability,
    val rank: Rank,
    val diceCount: Int,
    val die: DieType,
    val damageType: DamageType,
    /** Which save the target rolls (only relevant to [SpellMode.SAVE]). */
    val targetSave: CheckKind = CheckKind.REFLEX,
    /** Extra damage from other sources (Dangerous Sorcery, elemental zone, the target's weakness, ...). */
    val extras: List<ExtraDamage> = emptyList(),
)

@Serializable
data class CheckSpec(
    val kind: CheckKind,
    val rank: Rank,
    val itemBonus: Int = 0,
    val abilityOverride: Ability? = null,
    /** Free text: optional custom label (e.g. for Lore). */
    val customName: String? = null,
)

@Serializable
data class ArmorSpec(val rank: Rank, val itemBonus: Int, val dexCap: Int) {
    /** AC; a raised shield adds its circumstance bonus. */
    fun armorClass(
        c: Pf2eCharacter,
        shield: ShieldKind? = null,
        raised: Boolean = false,
        conditions: List<d20.engine.conditions.ActiveCondition> = emptyList(),
    ): Int =
        10 + minOf(c.mod(Ability.DEX), dexCap) + rank.bonus(c.level) + itemBonus +
            (if (shield != null && raised) shield.acBonus else 0) +
            d20.engine.conditions.StatusPenalties.total(conditions, Ability.DEX)
}

data class BlockResult(val blocked: Int, val damageToYou: Int, val damageToShield: Int, val newShieldHp: Int, val broken: Boolean)

object ShieldBlock {
    /** Shield Block reaction: the shield's Hardness absorbs damage; you and the shield each take the rest. */
    fun resolve(kind: ShieldKind, shieldHp: Int, incomingDamage: Int): BlockResult {
        val blocked = minOf(kind.hardness, incomingDamage)
        val rest = incomingDamage - blocked
        val newHp = (shieldHp - rest).coerceAtLeast(0)
        return BlockResult(blocked, rest, rest, newHp, newHp <= kind.brokenThreshold)
    }
}
