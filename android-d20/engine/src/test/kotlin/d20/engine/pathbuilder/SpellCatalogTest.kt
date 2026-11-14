package d20.engine.pathbuilder

import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class SpellCatalogTest {
    private fun spell(name: String, rank: Int) = assertNotNull(SpellCatalog.lookup(name, rank, Ability.CHA, Rank.EXPERT))

    @Test
    fun `fireball at rank 3 is 6d6 basic reflex`() {
        val s = spell("Fireball", 3)
        assertEquals(6, s.diceCount)
        assertEquals(DieType.D6, s.die)
        assertEquals(DamageType.FIRE, s.damageType)
        assertEquals(SpellMode.SAVE, s.mode)
        assertEquals(CheckKind.REFLEX, s.targetSave)
        assertEquals(Ability.CHA, s.castingAbility)
        assertEquals(Rank.EXPERT, s.rank)
    }

    @Test
    fun `heightened fireball at rank 5 is 10d6`() = assertEquals(10, spell("Fireball", 5).diceCount)

    @Test
    fun `electric arc at rank 4 is 5d4`() {
        val s = spell("Electric Arc", 4)
        assertEquals(5, s.diceCount)
        assertEquals(DieType.D4, s.die)
    }

    @Test
    fun `caustic blast heightens every 2 ranks`() = assertEquals(3, spell("Caustic Blast", 4).diceCount)

    @Test
    fun `unknown or utility spells return null`() {
        assertNull(SpellCatalog.lookup("Invisibility", 2, Ability.CHA, Rank.TRAINED))
        assertNull(SpellCatalog.lookup("Gust of Wind", 1, Ability.CHA, Rank.TRAINED))
    }

    @Test
    fun `lookup ignores case`() = assertEquals(spell("Fireball", 3), spell("fIrEbAlL", 3))

    @Test
    fun `known spells get the Portuguese library name and attack spells use spell attack`() {
        assertEquals("Bola de Fogo (3º)", spell("Fireball", 3).name)
        assertEquals(SpellMode.ATTACK, spell("Ignition", 1).mode)
        assertEquals(CheckKind.FORTITUDE, spell("Frostbite", 1).targetSave)
    }

    @Test
    fun `high-rank fireball keeps all its dice and passes validation`() {
        val s = spell("Fireball", 9)
        assertEquals(18, s.diceCount)
        val d = d20.engine.schema.Presets.blank("id", "Ezren", d20.engine.schema.PfClass.WIZARD)
        val withSpell = d.copy(library = listOf(d20.engine.schema.SpellStation("lib-001", s)))
        assertEquals(emptyList(), d20.engine.schema.DashboardValidator.validate(withSpell))
    }
}
