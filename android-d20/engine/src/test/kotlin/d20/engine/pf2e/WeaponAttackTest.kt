package d20.engine.pf2e

import d20.engine.core.DieType
import d20.engine.core.Degree
import d20.engine.core.ScriptedRoller
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class WeaponAttackTest {
    // attack mods: FOR 4 + expert@5 = 9 + potência 1 = 14.  damage flat: FOR 4 + especialização 2 = 6.

    @Test
    fun `strength weapon adds ability to attack and damage, with separate rune parts`() {
        val engine = Pf2eEngine(ScriptedRoller(12, 5, 3, 4)) // d20, 2×d8, d6 fogo
        val r = engine.weaponAttack(hero, flamingLongsword, MapStep.FIRST, targetAc = 20)

        assertEquals(12, r.check.natural)
        assertEquals(26, r.check.total)
        assertEquals(Degree.SUCCESS, r.check.degree) // 26 < 20+10
        val dmg = assertNotNull(r.damage)
        assertEquals(2, dmg.parts.size)
        assertEquals(listOf(5, 3), dmg.parts[0].dice)
        assertEquals(6, dmg.parts[0].flat)
        assertEquals(DamageType.SLASHING, dmg.parts[0].type)
        assertEquals(14, dmg.parts[0].subtotal)
        assertEquals(DamageType.FIRE, dmg.parts[1].type)
        assertEquals(4, dmg.parts[1].subtotal)
        assertEquals(18, dmg.total)
        assertEquals(36, dmg.criticalTotal)
        assertEquals(false, r.criticalApplied)
        assertEquals(18, r.damageToApply)
    }

    @Test
    fun `critical success doubles all damage`() {
        val engine = Pf2eEngine(ScriptedRoller(12, 5, 3, 4))
        val r = engine.weaponAttack(hero, flamingLongsword, MapStep.FIRST, targetAc = 15) // 26 >= 25
        assertEquals(Degree.CRITICAL_SUCCESS, r.check.degree)
        assertEquals(true, r.criticalApplied)
        assertEquals(36, r.damageToApply)
    }

    @Test
    fun `dexterity weapon adds ability to attack only`() {
        val dexSword = flamingLongsword.copy(attackAbility = Ability.DEX, elemental = emptyList())
        val engine = Pf2eEngine(ScriptedRoller(10, 1, 1))
        val r = engine.weaponAttack(hero, dexSword, MapStep.FIRST, targetAc = null)
        assertEquals(10 + 2 + 9 + 1, r.check.total) // DES 2 no acerto
        val dmg = assertNotNull(r.damage)
        assertEquals(2, dmg.parts.single().flat) // só especialização, sem DES
    }

    @Test
    fun `a miss rolls no damage and consumes no damage dice`() {
        val engine = Pf2eEngine(ScriptedRoller(12)) // roller exhausted if damage were rolled
        val r = engine.weaponAttack(hero, flamingLongsword, MapStep.FIRST, targetAc = 40)
        assertEquals(Degree.CRITICAL_FAILURE, r.check.degree)
        assertNull(r.damage)
        assertNull(r.damageToApply)
    }

    @Test
    fun `without a target both normal and critical totals are offered and crit is unknown`() {
        val engine = Pf2eEngine(ScriptedRoller(20, 5, 3, 4))
        val r = engine.weaponAttack(hero, flamingLongsword, MapStep.FIRST, targetAc = null)
        assertNull(r.check.degree)
        assertNull(r.criticalApplied)
        assertNull(r.damageToApply)
        assertEquals(18, r.damage!!.total)
        assertEquals(36, r.damage!!.criticalTotal)
    }

    @Test
    fun `multiple attack penalty is untyped and agile reduces it`() {
        val plain = Pf2eEngine(ScriptedRoller(10, 1, 1, 1)).weaponAttack(
            hero, flamingLongsword, MapStep.SECOND, null,
        )
        assertEquals(10 + 14 - 5, plain.check.total)

        val agile = flamingLongsword.copy(agile = true)
        val r3 = Pf2eEngine(ScriptedRoller(10, 1, 1, 1)).weaponAttack(hero, agile, MapStep.THIRD, null)
        assertEquals(10 + 14 - 8, r3.check.total)
    }

    @Test
    fun `striking runes add dice and greater specialization adds flat damage`() {
        val w = WeaponSpec(
            name = "Maça",
            attackAbility = Ability.STR,
            rank = Rank.MASTER,
            diceCount = 1,
            die = DieType.D6,
            damageType = DamageType.BLUDGEONING,
            striking = StrikingRune.GREATER, // 3 dados
            greaterSpecialization = true, // mestre: 3 × 2 = 6
        )
        assertEquals(3, w.totalDice)
        val r = Pf2eEngine(ScriptedRoller(15, 2, 2, 2)).weaponAttack(hero, w, MapStep.FIRST, null)
        val part = r.damage!!.parts.single()
        assertEquals(10, part.flat) // FOR 4 + 6
        assertEquals(16, part.subtotal)
    }

    @Test
    fun `untrained adds no proficiency and damage is never below 1`() {
        val weak = hero.copy(abilityMods = hero.abilityMods + (Ability.STR to -3))
        val w = WeaponSpec("Adaga", Ability.STR, Rank.UNTRAINED, 1, DieType.D4, DamageType.PIERCING)
        val r = Pf2eEngine(ScriptedRoller(10, 1)).weaponAttack(weak, w, MapStep.FIRST, null)
        assertEquals(10 - 3, r.check.total)
        assertEquals(1, r.damage!!.total) // 1 − 3 → mínimo 1
    }
}
