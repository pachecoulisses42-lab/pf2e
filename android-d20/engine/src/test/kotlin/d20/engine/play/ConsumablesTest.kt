package d20.engine.play

import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.EffectAction
import d20.engine.conditions.EffectTarget
import d20.engine.conditions.EffectTrigger
import d20.engine.core.Degree
import d20.engine.core.ScriptedRoller
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.Rank
import d20.engine.pf2e.hero
import d20.engine.schema.ConsumableStation
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.SkillStation
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ConsumablesTest {
    private val dash = Presets.blank("d", "H", PfClass.FIGHTER).copy(character = hero)
    private fun runner(vararg rolls: Int) = PlayRunner(Pf2eEngine(ScriptedRoller(*rolls)))

    private fun bomb(kind: ConsumableKind, grade: ConsumableGrade, effects: List<ConditionEffect> = emptyList()) =
        ConsumableStation("c", ConsumableSpec("", kind, grade, Rank.TRAINED, effects = effects))

    @Test
    fun `healing potion rolls its dice plus the flat bonus`() {
        val st = ConsumableStation("c", ConsumableSpec("", ConsumableKind.HEALING_POTION, ConsumableGrade.LESSER))
        val out = runner(4, 6).run(dash, st, PlayContext())
        assertEquals(15, out.heal) // 2d8 + 5
        assertNull(out.damage)
        assertNull(out.total)
    }

    @Test
    fun `healing potion table follows the Pathfinder data`() {
        assertEquals(listOf(1 to 0, 2 to 5, 3 to 10, 6 to 20, 8 to 30), ConsumableGrade.entries.map { ConsumableTables.healing(it) })
    }

    @Test
    fun `moderate alchemist's fire hit adds splash and reports persistent damage`() {
        // attack: DES 2 + prof 7 + item +1 = 10; d20 12 -> 22 vs AC 15 = success. 2d8 = 5+6
        val out = runner(12, 5, 6).run(dash, bomb(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.MODERATE), PlayContext(targetDc = 15))
        assertEquals(22, out.total)
        val d = assertNotNull(out.damage)
        assertEquals(11 + 2, d.applied) // direct 11 + splash 2
        assertEquals(listOf(DamageType.FIRE, DamageType.FIRE), d.lines.map { it.type })
        assertTrue(d.lines.last().text.contains("Respingo"))
        assertTrue(out.notices.any { it.text.contains("persistente") && it.text.contains("Fogo") })
    }

    @Test
    fun `critical doubles the bomb damage and its persistent damage but not the splash`() {
        val out = runner(12, 5, 6).run(dash, bomb(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.MODERATE), PlayContext(targetDc = 10))
        assertEquals(Degree.CRITICAL_SUCCESS, out.degree)
        assertEquals(2 * 11 + 2, out.damage!!.applied)
        assertTrue(out.notices.any { it.text.contains("4") && it.text.contains("persistente") })
    }

    @Test
    fun `a failure still splashes the target and a critical failure does nothing`() {
        val fail = runner(12).run(dash, bomb(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.MODERATE), PlayContext(targetDc = 25))
        assertEquals(Degree.FAILURE, fail.degree)
        assertEquals(2, fail.damage!!.applied) // roller has only the d20: no direct dice are rolled
        val crit = runner(3).run(dash, bomb(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.MODERATE), PlayContext(targetDc = 40))
        assertEquals(Degree.CRITICAL_FAILURE, crit.degree)
        assertNull(crit.damage)
    }

    @Test
    fun `acid flask deals 1 flat acid plus scaling persistent d6`() {
        val out = runner(15).run(dash, bomb(ConsumableKind.ACID_FLASK, ConsumableGrade.LESSER), PlayContext(targetDc = 15))
        assertEquals(1 + 1, out.damage!!.applied) // 1 acid + 1 splash, no dice rolled
        assertTrue(out.notices.any { it.text.contains("1d6") && it.text.contains("Ácido") })
    }

    @Test
    fun `no target lets the user choose the multiplier like a weapon does`() {
        val out = runner(12, 5, 6).run(dash, bomb(ConsumableKind.ALCHEMISTS_FIRE, ConsumableGrade.MODERATE), PlayContext())
        assertNull(out.damage!!.choice)
        assertEquals(24, out.chooseDamage(DamageChoice.CRITICAL).damage!!.applied)
        assertEquals(35, out.chooseDamage(DamageChoice.TRIPLE).damage!!.applied) // 3*11 + 2
    }

    @Test
    fun `bottled lightning leaves the target off-guard on a hit`() {
        val out = runner(15, 3).run(dash, bomb(ConsumableKind.BOTTLED_LIGHTNING, ConsumableGrade.LESSER), PlayContext(targetDc = 15))
        val n = out.notices.single { it.active == true && it.effect?.condition == ConditionKind.OFF_GUARD }
        assertEquals(EffectTarget.ENEMY, n.effect!!.target)
    }

    @Test
    fun `custom effects are evaluated against the degree of success`() {
        val demoralize = SkillStation(
            "s", CheckSpec(CheckKind.INTIMIDATION, Rank.TRAINED),
            effects = listOf(
                ConditionEffect(ConditionKind.FRIGHTENED, 1, EffectTarget.ENEMY, EffectAction.IMPOSE, EffectTrigger.SUCCESS),
                ConditionEffect(ConditionKind.FRIGHTENED, 2, EffectTarget.ENEMY, EffectAction.IMPOSE, EffectTrigger.CRITICAL_SUCCESS),
            ),
        )
        val ok = runner(10).run(dash, demoralize, PlayContext(targetDc = 15)) // 10 -1(CHA) +7 = 16 -> success
        assertEquals(listOf(1), ok.notices.filter { it.active == true }.map { it.effect!!.value })
        val unknown = runner(10).run(dash, demoralize, PlayContext())
        assertTrue(unknown.notices.all { it.active == null })
        assertEquals(2, unknown.notices.size)
    }

    @Test
    fun `self effects are flagged so the UI can offer to apply them to the character`() {
        val st = ConsumableStation("c", ConsumableSpec("Elixir", ConsumableKind.CUSTOM, ConsumableGrade.LESSER, effects = listOf(
            ConditionEffect(ConditionKind.QUICKENED, 1, EffectTarget.SELF, EffectAction.IMPOSE, EffectTrigger.ALWAYS, rounds = 1),
            ConditionEffect(ConditionKind.SICKENED, 1, EffectTarget.SELF, EffectAction.REMOVE, EffectTrigger.ALWAYS),
        )))
        val out = runner().run(dash, st, PlayContext())
        assertEquals(2, out.notices.size)
        assertTrue(out.notices.all { it.active == true && it.effect!!.target == EffectTarget.SELF })
        assertTrue(out.notices[1].text.contains("Remove"))
    }

    @Test
    fun `effect descriptions are readable`() {
        val e = ConditionEffect(ConditionKind.FRIGHTENED, 2, EffectTarget.ENEMY, EffectAction.IMPOSE, EffectTrigger.CRITICAL_SUCCESS)
        assertEquals("Impõe Apavorado 2 no inimigo", e.describe())
        assertEquals("Remove Enjoado em mim", ConditionEffect(ConditionKind.SICKENED, 1, EffectTarget.SELF, EffectAction.REMOVE, EffectTrigger.ALWAYS).describe())
        assertEquals("Impõe Caído no inimigo", ConditionEffect(ConditionKind.PRONE, 1, EffectTarget.ENEMY, EffectAction.IMPOSE, EffectTrigger.ANY_SUCCESS).describe())
    }
}
