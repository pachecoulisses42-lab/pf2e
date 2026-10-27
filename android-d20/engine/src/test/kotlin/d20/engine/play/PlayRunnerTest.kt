package d20.engine.play

import d20.engine.core.Degree
import d20.engine.core.DieType
import d20.engine.core.ScriptedRoller
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.flamingLongsword
import d20.engine.pf2e.hero
import d20.engine.schema.ActionStation
import d20.engine.schema.Dashboard
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PlayRunnerTest {
    private val dash: Dashboard = Presets.blank("d", "Heroi", PfClass.FIGHTER).copy(character = hero)

    private fun runner(vararg rolls: Int) = PlayRunner(Pf2eEngine(ScriptedRoller(*rolls)))

    @Test
    fun `one tap on a weapon rolls attack and damage with a gold critical tone`() {
        val out = runner(12, 5, 3, 4).run(dash, ActionStation("a", flamingLongsword), PlayContext(targetDc = 15))
        assertEquals(26, out.total)
        assertEquals(12, out.natural)
        assertEquals(Degree.CRITICAL_SUCCESS, out.degree)
        assertEquals(Tone.CRITICAL, out.tone)
        val dmg = assertNotNull(out.damage)
        assertEquals(36, dmg.applied)
        assertEquals(true, dmg.critical)
        assertEquals(18, dmg.normal)
        assertEquals(36, dmg.criticalTotal)
        assertEquals(2, dmg.lines.size)
        assertTrue(dmg.lines[0].contains("Cortante"))
        assertTrue(dmg.lines[1].contains("Fogo"))
    }

    @Test
    fun `a miss is red and carries no damage`() {
        val out = runner(3).run(dash, ActionStation("a", flamingLongsword), PlayContext(targetDc = 30))
        assertEquals(Tone.FAILURE, out.tone)
        assertNull(out.damage)
    }

    @Test
    fun `without a target the roll is neutral but a natural 20 shows gold`() {
        val neutral = runner(10, 1, 1, 1).run(dash, ActionStation("a", flamingLongsword), PlayContext())
        assertEquals(Tone.NEUTRAL, neutral.tone)
        assertNull(neutral.degree)
        assertNull(neutral.damage!!.applied)
        val gold = runner(20, 1, 1, 1).run(dash, ActionStation("a", flamingLongsword), PlayContext())
        assertEquals(Tone.CRITICAL, gold.tone)
    }

    @Test
    fun `multiple attack penalty from the context is applied`() {
        val out = runner(10, 1, 1, 1).run(dash, ActionStation("a", flamingLongsword), PlayContext(map = MapStep.THIRD))
        assertEquals(10 + 14 - 10, out.total)
        assertTrue(out.breakdown.any { "Ataque múltiplo" in it })
    }

    @Test
    fun `skill check and save report degree and tone`() {
        val ok = runner(15).run(dash, SkillStation("s", CheckSpec(CheckKind.ATHLETICS, Rank.EXPERT)), PlayContext(targetDc = 20))
        assertEquals(15 + 4 + 9, ok.total)
        assertEquals(Tone.SUCCESS, ok.tone)
        assertNull(ok.damage)
        val bad = runner(2).run(dash, SkillStation("s", CheckSpec(CheckKind.FORTITUDE, Rank.TRAINED)), PlayContext(targetDc = 30))
        assertEquals(Tone.FAILURE, bad.tone)
    }

    @Test
    fun `save spell shows DC and resolves damage from the target degree`() {
        val ball = SpellSpec("Bola", SpellMode.SAVE, Ability.INT, Rank.EXPERT, 6, DieType.D6, DamageType.FIRE)
        val out = runner(6, 6, 6, 6, 1, 1).run(dash, SpellStation("sp", ball), PlayContext())
        assertEquals(23, out.dc)
        assertNull(out.degree)
        val pending = assertNotNull(out.pendingSave)
        assertEquals(26, pending.damage.total)
        assertEquals(13, out.resolveTargetSave(Degree.SUCCESS).damage!!.applied)
        assertEquals(52, out.resolveTargetSave(Degree.CRITICAL_FAILURE).damage!!.applied)
        assertEquals(0, out.resolveTargetSave(Degree.CRITICAL_SUCCESS).damage!!.applied)
    }

    @Test
    fun `resource stations are not rollable`() {
        val res = ResourceStation("r", 20, d20.engine.pf2e.ArmorSpec(Rank.TRAINED, 0, 2))
        assertFailsWith<IllegalArgumentException> { runner().run(dash, res, PlayContext()) }
    }

    @Test
    fun `armor class summary`() {
        val res = ResourceStation("r", 20, d20.engine.pf2e.ArmorSpec(Rank.TRAINED, 1, 2))
        assertEquals(10 + 2 + 6 + 1, PlayRunner.armorClass(dash.copy(character = hero.copy(level = 4)), res))
    }
}
