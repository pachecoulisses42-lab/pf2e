package d20.engine.pf2e

import d20.engine.core.Degree
import d20.engine.core.DieType
import d20.engine.core.ScriptedRoller
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import d20.engine.schema.DashboardValidator
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.SpellStation
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ExtraDamageTest {
    private val fireball = SpellSpec("Bola de Fogo", SpellMode.SAVE, Ability.INT, Rank.TRAINED, 2, DieType.D6, DamageType.FIRE)
    private val sorcery = ExtraDamage(ExtraSource.DANGEROUS_SORCERY, ExtraKind.STATUS, flat = 3)
    private val zone = ExtraDamage(ExtraSource.ELEMENTAL_ZONE, ExtraKind.STATUS, flat = 2)
    private val weakness = ExtraDamage(ExtraSource.WEAKNESS, ExtraKind.UNTYPED, flat = 5)

    @Test
    fun `same bonus type keeps only the largest while untyped stacks`() {
        val extra = ExtraDamage(ExtraSource.FEAT, ExtraKind.UNTYPED, diceCount = 1, die = DieType.D4)
        val r = ExtraDamageStack.resolve(listOf(zone, sorcery, extra, extra.copy(flat = 1)))
        assertEquals(listOf(sorcery, extra, extra.copy(flat = 1)), r.applied)
        assertEquals(listOf(zone), r.ignored)
    }

    @Test
    fun `status bonus is part of the basic save while weakness is added after halving or doubling`() {
        val s = fireball.copy(extras = listOf(sorcery, zone, weakness))
        val r = Pf2eEngine(ScriptedRoller(4, 5)).spellSave(hero, s)
        assertEquals(9 + 3, r.damage.baseTotal)
        assertEquals(12 + 5, r.damage.total)
        assertEquals(6 + 5, r.damageFor(Degree.SUCCESS))
        assertEquals(24 + 5, r.damageFor(Degree.CRITICAL_FAILURE))
        assertEquals(0, r.damageFor(Degree.CRITICAL_SUCCESS)) // sem dano, a fraqueza não se aplica
        assertEquals(listOf(zone.label), r.damage.ignored)
    }

    @Test
    fun `extra dice of another type are rolled and doubled on a critical spell attack`() {
        val ray = fireball.copy(mode = SpellMode.ATTACK, extras = listOf(ExtraDamage(ExtraSource.SPELL_EFFECT, ExtraKind.UNTYPED, 1, DieType.D6, 0, DamageType.COLD)))
        val r = Pf2eEngine(ScriptedRoller(20, 3, 3, 2)).spellAttack(hero, ray, targetAc = 15)
        assertEquals(Degree.CRITICAL_SUCCESS, r.check.degree)
        assertEquals(DamageType.COLD, r.damage!!.parts[1].type)
        assertEquals((6 + 2) * 2, r.damageToApply)
    }

    @Test
    fun `summary names each source and explains what did not stack`() {
        val d = Presets.blank("id", "Ezren", PfClass.SORCERER)
        val st = SpellStation("st-01", fireball.copy(extras = listOf(sorcery, zone, weakness)))
        val o = PlayRunner(Pf2eEngine(ScriptedRoller(4, 5))).run(d, st, PlayContext())
        val lines = o.damage!!.normalLines.map { it.text }
        assertTrue(lines.any { "Feitiçaria Perigosa (Estado) +3" in it }, lines.toString())
        assertTrue(lines.any { "Fraqueza do alvo (Sem tipo) 5 (após multiplicar)" in it }, lines.toString())
        assertEquals(listOf("Zona elemental (Estado) não acumula com outro do mesmo tipo"), o.damage!!.notes)
        assertEquals("2d6 + 3 + 5", Formulas.spellDamage(st.spell))
    }

    @Test
    fun `validator rejects empty or oversized extras`() {
        val d = Presets.blank("id", "Ezren", PfClass.SORCERER)
        val bad = fireball.copy(extras = listOf(ExtraDamage(ExtraSource.OTHER)))
        val withSpell = d.copy(zones = d.zones.copy(zone1 = d.zones.zone1.copy(stations = listOf(SpellStation("st-01", bad)))))
        assertTrue(DashboardValidator.validate(withSpell).any { "informe dados ou valor fixo" in it })
    }
}
