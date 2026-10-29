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
    /** Class proficiency (T/E/M/L): sets the class DC and, for spells that use it, the spell DC and attack. */
    val classRank: Rank = Rank.TRAINED,
    /** Key attribute of the class DC; null = the class's usual one. */
    val keyAbility: Ability? = null,
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
    /** Use the character's class proficiency (Ficha) instead of [rank]. */
    val fromClass: Boolean = false,
) {
    fun rankFor(c: Pf2eCharacter): Rank = if (fromClass) c.classRank else rank
}

@Serializable
data class CheckSpec(
    val kind: CheckKind,
    val rank: Rank,
    val itemBonus: Int = 0,
    val abilityOverride: Ability? = null,
    /** Free text: optional custom label (e.g. for Lore). */
    val customName: String? = null,
)

/**
 * Worn armor. [itemBonus] is the armor's own AC item bonus; [potency] (+1..+3) adds to it. [resilient] (+1..+3) is an
 * item bonus to saves, [skillRunes] item bonuses to skills or Lore, [resistances] e.g. an energy-resistant rune.
 * The check penalty hits Strength- and Dexterity-based skills unless your Strength modifier meets [strength];
 * meeting it also cuts the speed penalty by 5 feet.
 */
@Serializable
data class ArmorSpec(
    val rank: Rank,
    val itemBonus: Int,
    val dexCap: Int,
    /** Free text: the armor's name ("" = unnamed). */
    val name: String = "",
    val category: ArmorCategory = ArmorCategory.UNARMORED,
    /** Armor check penalty as a positive number (2 means −2). */
    val checkPenalty: Int = 0,
    /** Speed penalty in feet, as a positive number. */
    val speedPenalty: Int = 0,
    /** Strength modifier that removes the check penalty; null when the armor has none. */
    val strength: Int? = null,
    val potency: Int = 0,
    val resilient: Int = 0,
    val skillRunes: List<SkillRune> = emptyList(),
    val resistances: List<Resistance> = emptyList(),
) {
    /** AC; a raised shield adds its circumstance bonus. */
    fun armorClass(
        c: Pf2eCharacter,
        shield: ShieldKind? = null,
        raised: Boolean = false,
        conditions: List<d20.engine.conditions.ActiveCondition> = emptyList(),
    ): Int =
        10 + minOf(c.mod(Ability.DEX), dexCap) + rank.bonus(c.level) + itemBonus + potency +
            (if (shield != null && raised) shield.acBonus else 0) +
            d20.engine.conditions.StatusPenalties.total(conditions, Ability.DEX)

    fun meetsStrength(c: Pf2eCharacter): Boolean = strength != null && c.mod(Ability.STR) >= strength

    /** Speed penalty actually applied, in feet. */
    fun effectiveSpeedPenalty(c: Pf2eCharacter): Int = if (meetsStrength(c)) (speedPenalty - 5).coerceAtLeast(0) else speedPenalty

    /** What this armor adds to a check: resilient on saves, skill runes, and the check penalty on STR/DEX skills. */
    fun checkModifiers(c: Pf2eCharacter, kind: CheckKind, ability: Ability): List<d20.engine.core.Modifier> = buildList {
        if (kind.isSave && resilient > 0) add(d20.engine.core.Modifier("Resiliente", d20.engine.core.ModType.ITEM, resilient))
        skillRunes.filter { it.skill == kind }.forEach { add(d20.engine.core.Modifier("Runa", d20.engine.core.ModType.ITEM, it.bonus)) }
        val skill = !kind.isSave && kind != CheckKind.PERCEPTION
        if (skill && checkPenalty > 0 && (ability == Ability.STR || ability == Ability.DEX) && !meetsStrength(c)) {
            add(d20.engine.core.Modifier("Armadura", d20.engine.core.ModType.UNTYPED, -checkPenalty))
        }
    }
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
