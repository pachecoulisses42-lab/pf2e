package d20.engine.conditions

import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ShieldKind
import d20.engine.schema.ActionStation
import d20.engine.schema.CardColor
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.effectiveColor
import d20.engine.schema.maxHp
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.Rank
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PlayRulesExtrasTest {
    private fun dashWithShield(kind: ShieldKind?) = Presets.forClass(PfClass.FIGHTER, "id", "Duncan").let { d ->
        d.copy(zones = d.zones.copy(zone3 = d.zones.zone3.copy(stations = listOf(ResourceStation("r", 20, ArmorSpec(Rank.TRAINED, 2, 1), kind)))))
    }

    @Test
    fun `initial state starts at full Hit Points and a full shield`() {
        val s = PlayRules.initialFor(dashWithShield(ShieldKind.WOODEN))
        assertEquals(20, s.hp)
        assertEquals(12, s.shieldHp)
        assertEquals(false, s.shieldRaised)
        assertNull(PlayRules.initialFor(dashWithShield(null)).shieldHp)
        assertEquals(20, dashWithShield(null).maxHp())
    }

    @Test
    fun `raising a shield needs an unbroken shield`() {
        val d = dashWithShield(ShieldKind.WOODEN)
        val s = PlayRules.initialFor(d)
        assertTrue(PlayRules.setShieldRaised(s, ShieldKind.WOODEN, true).shieldRaised)
        val broken = s.copy(shieldHp = 6) // at the broken threshold
        assertEquals(false, PlayRules.setShieldRaised(broken, ShieldKind.WOODEN, true).shieldRaised)
    }

    @Test
    fun `blocking takes the shield hardness off, hurts both, and breaking lowers the shield`() {
        val s = PlayRules.initialFor(dashWithShield(ShieldKind.WOODEN)).copy(shieldRaised = true, hp = 20)
        val (after, msg) = PlayRules.applyBlock(s, ShieldKind.WOODEN, incomingDamage = 10, maxHp = 20)
        assertEquals(13, after.hp) // 10 - hardness 3 = 7 to you
        assertEquals(5, after.shieldHp) // 12 - 7
        assertEquals(false, after.shieldRaised) // broken at 5 <= 6
        assertTrue(msg.contains("quebrado", ignoreCase = true))
    }

    @Test
    fun `consumable uses are counted per station`() {
        val spec = ConsumableSpec("", ConsumableKind.HEALING_POTION, ConsumableGrade.LESSER, quantity = 3)
        var s = PlayRules.initialFor(dashWithShield(null))
        assertEquals(3, PlayRules.remaining(s, "c1", spec))
        s = PlayRules.useItem(s, "c1")
        s = PlayRules.useItem(s, "c1")
        assertEquals(1, PlayRules.remaining(s, "c1", spec))
        s = PlayRules.useItem(PlayRules.useItem(s, "c1"), "c1") // cannot go below zero
        assertEquals(0, PlayRules.remaining(s, "c1", spec))
    }

    @Test
    fun `every station has a default colour, overridable`() {
        val spec = ConsumableSpec("", ConsumableKind.HEALING_POTION, ConsumableGrade.LESSER)
        assertEquals(CardColor.MOSTARDA, ActionStation("a", d20.engine.pf2e.flamingLongsword).effectiveColor())
        assertEquals(CardColor.VERDE, SkillStation("s", d20.engine.pf2e.CheckSpec(d20.engine.pf2e.CheckKind.ATHLETICS, Rank.TRAINED)).effectiveColor())
        assertEquals(CardColor.CORAL, ConsumableStation("c", spec).effectiveColor())
        assertEquals(CardColor.ROSA, ConditionsStation("x").effectiveColor())
        assertEquals(CardColor.AZUL, ConsumableStation("c", spec, CardColor.AZUL).effectiveColor())
        assertEquals(CardColor.VIOLETA, ResourceStation("r", 10, ArmorSpec(Rank.TRAINED, 0, 0)).effectiveColor())
    }

    @Test
    fun `reconcile clamps HP and follows the shield that was chosen`() {
        val d = dashWithShield(ShieldKind.WOODEN)
        val old = PlayState(hp = 99, shieldHp = null, shieldRaised = true)
        val r = PlayRules.reconcile(d, old)
        assertEquals(20, r.hp)
        assertEquals(12, r.shieldHp)
        assertTrue(r.shieldRaised)
        val none = PlayRules.reconcile(dashWithShield(null), r)
        assertNull(none.shieldHp)
        assertEquals(false, none.shieldRaised)
        val broken = PlayRules.reconcile(d, PlayState(hp = 5, shieldHp = 4, shieldRaised = true))
        assertEquals(false, broken.shieldRaised)
    }
}
