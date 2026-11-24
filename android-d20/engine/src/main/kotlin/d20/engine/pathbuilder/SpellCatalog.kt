package d20.engine.pathbuilder

import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec

/**
 * Damage spells the importer can turn into rolling spell modules (Pathbuilder exports only spell names).
 * Heightening: [perStep] extra dice every [step] ranks above [baseRank].
 */
object SpellCatalog {
    private class Entry(
        val english: String, val ptName: String, val cantrip: Boolean, val baseRank: Int, val dice: Int, val die: DieType,
        val perStep: Int, val step: Int, val type: DamageType, val save: CheckKind?,
    )

    private val R = CheckKind.REFLEX
    private val F = CheckKind.FORTITUDE
    private val W = CheckKind.WILL

    private val entries = listOf(
        Entry("Electric Arc", "Arco Elétrico", true, 1, 2, DieType.D4, 1, 1, DamageType.ELECTRICITY, R),
        Entry("Caustic Blast", "Jato Cáustico", true, 1, 2, DieType.D8, 1, 2, DamageType.ACID, R),
        Entry("Frostbite", "Queimadura de Gelo", true, 1, 2, DieType.D4, 1, 1, DamageType.COLD, F),
        Entry("Ignition", "Ignição", true, 1, 2, DieType.D4, 1, 1, DamageType.FIRE, null),
        Entry("Telekinetic Projectile", "Projétil Telecinético", true, 1, 2, DieType.D6, 1, 1, DamageType.BLUDGEONING, null),
        Entry("Divine Lance", "Lança Divina", true, 1, 2, DieType.D4, 1, 1, DamageType.SPIRIT, null),
        Entry("Vitality Lash", "Açoite Vital", true, 1, 2, DieType.D6, 1, 1, DamageType.VITALITY, F),
        Entry("Void Warp", "Distorção do Vazio", true, 1, 2, DieType.D4, 1, 1, DamageType.VOID, F),
        Entry("Daze", "Atordoar", true, 1, 1, DieType.D6, 1, 2, DamageType.MENTAL, W),
        Entry("Needle Darts", "Dardos de Agulha", true, 1, 3, DieType.D4, 1, 1, DamageType.PIERCING, null),
        Entry("Breathe Fire", "Sopro de Fogo", false, 1, 2, DieType.D6, 2, 1, DamageType.FIRE, R),
        Entry("Fireball", "Bola de Fogo", false, 3, 6, DieType.D6, 2, 1, DamageType.FIRE, R),
        Entry("Lightning Bolt", "Relâmpago", false, 3, 4, DieType.D12, 1, 1, DamageType.ELECTRICITY, R),
    ).associateBy { it.english.lowercase() }

    /** A rolling spell at [rank], or null for a spell without known damage. Cantrips arrive already heightened. */
    fun lookup(englishName: String, rank: Int, castingAbility: Ability, rankFromCaster: Rank): SpellSpec? {
        val e = entries[englishName.trim().lowercase()] ?: return null
        val at = maxOf(rank, e.baseRank)
        val dice = e.dice + (at - e.baseRank) / e.step * e.perStep
        val name = if (e.cantrip) e.ptName else "${e.ptName} (${at}º)"
        return SpellSpec(
            name = name, mode = if (e.save == null) SpellMode.ATTACK else SpellMode.SAVE, castingAbility = castingAbility,
            rank = rankFromCaster, diceCount = dice.coerceAtMost(20), die = e.die, damageType = e.type, targetSave = e.save ?: CheckKind.REFLEX,
        )
    }
}
