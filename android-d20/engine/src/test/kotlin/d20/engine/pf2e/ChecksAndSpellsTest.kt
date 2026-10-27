package d20.engine.pf2e

import d20.engine.core.Degree
import d20.engine.core.DieType
import d20.engine.core.ScriptedRoller
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ChecksAndSpellsTest {
    @Test
    fun `skill check uses ability proficiency and item bonus`() {
        val athletics = CheckSpec(CheckKind.ATHLETICS, Rank.EXPERT, itemBonus = 1)
        val r = Pf2eEngine(ScriptedRoller(10)).check(hero, athletics, dc = 20)
        assertEquals(10 + 4 + 9 + 1, r.total)
        assertEquals(Degree.SUCCESS, r.degree)
    }

    @Test
    fun `saving throw reports degree of success`() {
        val reflex = CheckSpec(CheckKind.REFLEX, Rank.TRAINED)
        val r = Pf2eEngine(ScriptedRoller(1)).check(hero, reflex, dc = 15) // 1+2+7=10 → falha, nat 1 → falha crítica
        assertEquals(10, r.total)
        assertEquals(Degree.CRITICAL_FAILURE, r.degree)
    }

    @Test
    fun `ability can be overridden for a check`() {
        val intimidate = CheckSpec(CheckKind.INTIMIDATION, Rank.TRAINED, abilityOverride = Ability.STR)
        val r = Pf2eEngine(ScriptedRoller(10)).check(hero, intimidate, dc = null)
        assertEquals(10 + 4 + 7, r.total)
        assertNull(r.degree)
    }

    @Test
    fun `spell attack uses casting ability and proficiency only`() {
        val ray = SpellSpec(
            name = "Raio Ardente", mode = SpellMode.ATTACK, castingAbility = Ability.INT, rank = Rank.EXPERT,
            diceCount = 2, die = DieType.D6, damageType = DamageType.FIRE,
        )
        val r = Pf2eEngine(ScriptedRoller(11, 3, 4)).spellAttack(hero, ray, targetAc = 20)
        assertEquals(11 + 4 + 9, r.check.total)
        assertEquals(Degree.SUCCESS, r.check.degree)
        assertEquals(7, r.damage!!.total) // sem modificador de atributo no dano de magia
    }

    @Test
    fun `save spell exposes the DC and applies a basic save`() {
        val ball = SpellSpec(
            name = "Bola de Fogo", mode = SpellMode.SAVE, castingAbility = Ability.INT, rank = Rank.EXPERT,
            diceCount = 6, die = DieType.D6, damageType = DamageType.FIRE, targetSave = CheckKind.REFLEX,
        )
        val r = Pf2eEngine(ScriptedRoller(6, 6, 6, 6, 1, 1)).spellSave(hero, ball) // total 26 (6×... = 6+6+6+6+1+1)
        assertEquals(10 + 4 + 9, r.dc)
        assertEquals(26, r.damage.total)
        assertEquals(CheckKind.REFLEX, r.targetSave)
        assertEquals(0, r.damageFor(Degree.CRITICAL_SUCCESS))
        assertEquals(13, r.damageFor(Degree.SUCCESS))
        assertEquals(26, r.damageFor(Degree.FAILURE))
        assertEquals(52, r.damageFor(Degree.CRITICAL_FAILURE))
    }

    @Test
    fun `armor class combines capped dexterity proficiency and item bonus`() {
        val armor = ArmorSpec(rank = Rank.TRAINED, itemBonus = 1, dexCap = 2)
        assertEquals(10 + 2 + 7 + 1, armor.armorClass(hero.copy(abilityMods = hero.abilityMods + (Ability.DEX to 3))))
        assertEquals(10 + 2 + 7 + 1, armor.armorClass(hero)) // DES 2 ≤ limite 2
        assertEquals(10 + 0 + 0 + 0, ArmorSpec(Rank.UNTRAINED, 0, 5).armorClass(hero.copy(abilityMods = emptyMap())))
    }

    @Test
    fun `formulas are derived for display`() {
        assertEquals("1d20+14", Formulas.attack(hero, flamingLongsword))
        assertEquals("2d8+6 +1d6", Formulas.damage(hero, flamingLongsword))
    }
}
