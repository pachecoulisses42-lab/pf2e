package d20.engine.pf2e

import d20.engine.core.DieType
import d20.engine.core.ScriptedRoller
import d20.engine.play.DamageChoice
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import d20.engine.schema.ActionStation
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class TraitsAndShieldsTest {
    private val dash = Presets.blank("d", "H", PfClass.FIGHTER).copy(character = hero)

    private fun run(vararg rolls: Int, w: WeaponSpec, dc: Int? = null) =
        PlayRunner(Pf2eEngine(ScriptedRoller(*rolls))).run(dash, ActionStation("a", w), PlayContext(targetDc = dc))

    // hero: DES +2, FOR +4, lvl 5; expert specialization +2.
    private val bow = WeaponSpec("Arco", Ability.DEX, Rank.EXPERT, 1, DieType.D6, DamageType.PIERCING, traits = listOf(WeaponTrait.FATAL_D10))

    @Test
    fun `fatal swaps the die size, adds one die, and the whole thing is doubled`() {
        // d20, 1d6 normal (4), then fatal: 2d10 (7, 9). flat = 2 (specialization, DES adds no damage)
        val out = run(15, 4, 7, 9, w = bow)
        val d = assertNotNull(out.damage)
        assertEquals(4 + 2, d.normal)
        assertEquals(2 * (7 + 9 + 2), d.criticalTotal)
        assertNull(d.choice) // no target: user chooses
    }

    @Test
    fun `deadly dice are added after doubling and are not doubled`() {
        val w = WeaponSpec("Maça", Ability.STR, Rank.EXPERT, 1, DieType.D6, DamageType.BLUDGEONING,
            striking = StrikingRune.GREATER, traits = listOf(WeaponTrait.DEADLY_D8))
        // d20, 3 weapon dice (2,3,4), deadly: 2d8 (greater striking) = 5, 6.   flat = 4 + 2 = 6
        val d = assertNotNull(run(15, 2, 3, 4, 5, 6, w = w).damage)
        assertEquals(9 + 6, d.normal)
        assertEquals(2 * (9 + 6) + 11, d.criticalTotal)
    }

    @Test
    fun `deadly count is 1 for plain or striking and 3 for major striking`() {
        val base = WeaponSpec("Lança", Ability.STR, Rank.TRAINED, 1, DieType.D6, DamageType.PIERCING, traits = listOf(WeaponTrait.DEADLY_D10))
        assertEquals(1, Pf2eEngine.deadlyDice(base))
        assertEquals(1, Pf2eEngine.deadlyDice(base.copy(striking = StrikingRune.STRIKING)))
        assertEquals(2, Pf2eEngine.deadlyDice(base.copy(striking = StrikingRune.GREATER)))
        assertEquals(3, Pf2eEngine.deadlyDice(base.copy(striking = StrikingRune.MAJOR)))
    }

    @Test
    fun `trait dice are only rolled when a critical is possible`() {
        // AC 25: total 15+2+9 = 26... use a non-critical success: d20=10 -> 10+2+9 = 21 vs AC 15 = success, not crit
        val ok = run(10, 4, w = bow, dc = 15) // roller would be exhausted if fatal dice were rolled
        assertEquals(6, ok.damage!!.applied)
        // a critical success against a known AC rolls them and applies the critical total
        val crit = run(20, 4, 7, 9, w = bow, dc = 15)
        assertEquals(true, crit.damage!!.critical)
        assertEquals(2 * (7 + 9 + 2), crit.damage!!.applied)
        // a miss rolls no damage at all
        assertNull(run(2, w = bow, dc = 30).damage)
    }

    @Test
    fun `after a roll without a target the user picks normal, critical or triple`() {
        val out = run(15, 4, 7, 9, w = bow)
        val normal = out.chooseDamage(DamageChoice.NORMAL).damage!!
        assertEquals(6, normal.applied)
        val crit = out.chooseDamage(DamageChoice.CRITICAL).damage!!
        assertEquals(36, crit.applied)
        assertEquals(true, crit.critical)
        val triple = out.chooseDamage(DamageChoice.TRIPLE).damage!!
        assertEquals(18, triple.applied)
        assertEquals(1, triple.lines.size)
        assertTrue(triple.lines[0].text.contains("×3"))
    }

    @Test
    fun `critical lines mention fatal and deadly, typed for colouring`() {
        val w = bow.copy(traits = listOf(WeaponTrait.DEADLY_D8))
        val out = run(15, 4, 7, w = w).chooseDamage(DamageChoice.CRITICAL).damage!!
        assertTrue(out.lines.any { it.text.contains("Mortal") && it.type == DamageType.PIERCING })
    }

    @Test
    fun `elemental runes double with the rest on a critical`() {
        val w = flamingLongsword // 2d8 + 6 slashing, +1d6 fire
        val d = assertNotNull(run(12, 5, 3, 4, w = w).damage)
        assertEquals(36, d.criticalTotal)
        val crit = run(12, 5, 3, 4, w = w).chooseDamage(DamageChoice.CRITICAL).damage!!
        assertEquals(listOf(DamageType.SLASHING, DamageType.FIRE), crit.lines.map { it.type })
    }

    @Test
    fun `shield block reduces damage by hardness and the shield takes the rest`() {
        val r = ShieldBlock.resolve(ShieldKind.WOODEN, shieldHp = 12, incomingDamage = 10)
        assertEquals(3, r.blocked)
        assertEquals(7, r.damageToYou)
        assertEquals(7, r.damageToShield)
        assertEquals(5, r.newShieldHp)
        assertTrue(r.broken) // 5 <= broken threshold 6
    }

    @Test
    fun `a hit weaker than the hardness is fully absorbed`() {
        val r = ShieldBlock.resolve(ShieldKind.STEEL, shieldHp = 20, incomingDamage = 4)
        assertEquals(4, r.blocked)
        assertEquals(0, r.damageToYou)
        assertEquals(20, r.newShieldHp)
        assertEquals(false, r.broken)
    }

    @Test
    fun `shield stats come from the Pathfinder data`() {
        assertEquals(listOf(3, 3, 5, 5, 6), ShieldKind.entries.map { it.hardness })
        assertEquals(listOf(6, 12, 20, 20, 24), ShieldKind.entries.map { it.maxHp })
        assertEquals(listOf(3, 6, 10, 10, 12), ShieldKind.entries.map { it.brokenThreshold })
        assertEquals(listOf(1, 2, 2, 2, 3), ShieldKind.entries.map { it.acBonus })
    }

    @Test
    fun `raised shield adds its circumstance bonus to AC`() {
        val armor = ArmorSpec(Rank.TRAINED, 1, 2)
        assertEquals(20, armor.armorClass(hero))
        assertEquals(22, armor.armorClass(hero, ShieldKind.STEEL, raised = true))
        assertEquals(20, armor.armorClass(hero, ShieldKind.STEEL, raised = false))
    }
}
