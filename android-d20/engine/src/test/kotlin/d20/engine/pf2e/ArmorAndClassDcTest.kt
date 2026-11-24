package d20.engine.pf2e

import d20.engine.core.ScriptedRoller
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import d20.engine.schema.DashboardEditor
import d20.engine.schema.DashboardValidator
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.classDc
import d20.engine.schema.keyAbility
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ArmorAndClassDcTest {
    private val fullPlate = ArmorCatalog.basics.first { it.name == "Armadura completa" }

    @Test
    fun `armor potency adds to AC on top of the armor's own bonus`() {
        val c = hero.copy(abilityMods = mapOf(Ability.DEX to 2, Ability.STR to 4)) // nível 5
        val armor = fullPlate.copy(potency = 2)
        assertEquals(10 + 0 + (5 + 2) + 6 + 2, armor.armorClass(c))
    }

    @Test
    fun `check penalty hits strength and dexterity skills unless strength is met`() {
        val weak = hero.copy(abilityMods = mapOf(Ability.STR to 2, Ability.DEX to 2))
        val strong = weak.copy(abilityMods = mapOf(Ability.STR to 4, Ability.DEX to 2))
        val athletics = CheckSpec(CheckKind.ATHLETICS, Rank.TRAINED)
        val base = Formulas.checkBonus(weak, athletics)
        assertEquals(base - 3, Formulas.checkBonus(weak, athletics, fullPlate))
        assertEquals(Formulas.checkBonus(strong, athletics), Formulas.checkBonus(strong, athletics, fullPlate))
        val diplomacy = CheckSpec(CheckKind.DIPLOMACY, Rank.TRAINED)
        assertEquals(Formulas.checkBonus(weak, diplomacy), Formulas.checkBonus(weak, diplomacy, fullPlate))
        assertEquals(10, fullPlate.effectiveSpeedPenalty(weak))
        assertEquals(5, fullPlate.effectiveSpeedPenalty(strong))
    }

    @Test
    fun `resilient rune boosts saves and a skill rune stacks with an item bonus by keeping the larger`() {
        val armor = ArmorCatalog.basics.first { it.name == "Armadura de couro" }
            .copy(resilient = 1, skillRunes = listOf(SkillRune(CheckKind.STEALTH, 1), SkillRune(CheckKind.LORE, 2)))
        val reflex = CheckSpec(CheckKind.REFLEX, Rank.EXPERT)
        assertEquals(Formulas.checkBonus(hero, reflex) + 1, Formulas.checkBonus(hero, reflex, armor))
        val stealth = CheckSpec(CheckKind.STEALTH, Rank.TRAINED, itemBonus = 2)
        assertEquals(Formulas.checkBonus(hero, stealth), Formulas.checkBonus(hero, stealth, armor)) // item +2 > runa +1; FOR atende a armadura
        val lore = CheckSpec(CheckKind.LORE, Rank.TRAINED)
        assertEquals(Formulas.checkBonus(hero, lore) + 2, Formulas.checkBonus(hero, lore, armor))
    }

    @Test
    fun `an active resource module applies its armor to skill rolls`() {
        var d = Presets.forClass(PfClass.FIGHTER, "id", "Valeros")
        val res = d.zones.all().flatMap { it.second.stations }.filterIsInstance<ResourceStation>().single()
        d = DashboardEditor.replaceStation(d, res.copy(armor = res.armor.copy(skillRunes = listOf(SkillRune(CheckKind.INTIMIDATION, 2)))))
        val o = PlayRunner(Pf2eEngine(ScriptedRoller(10))).run(d, SkillStation("x", CheckSpec(CheckKind.INTIMIDATION, Rank.TRAINED)), PlayContext())
        assertTrue(o.breakdown.contains("Runa +2"), o.breakdown.toString())
        assertEquals(emptyList(), DashboardValidator.validate(d))
    }

    @Test
    fun `class DC uses the key attribute and class proficiency and feeds class-based spells`() {
        var d = Presets.blank("id", "Ezren", PfClass.WIZARD)
        d = DashboardEditor.setLevel(d, 5)
        d = DashboardEditor.setAbility(d, Ability.INT, 4)
        d = DashboardEditor.setClassRank(d, Rank.EXPERT)
        assertEquals(Ability.INT, d.keyAbility())
        assertEquals(10 + 4 + 5 + 4, d.classDc())
        val spell = SpellSpec("Raio", SpellMode.SAVE, Ability.INT, Rank.TRAINED, 2, d20.engine.core.DieType.D6, DamageType.FIRE, fromClass = true)
        assertEquals(d.classDc(), Pf2eEngine.spellDc(d.character, spell))
        assertEquals(10 + 4 + 5 + 2, Pf2eEngine.spellDc(d.character, spell.copy(fromClass = false)))
        assertEquals(Ability.CHA, DashboardEditor.setKeyAbility(d, Ability.CHA).keyAbility())
    }

    @Test
    fun `every catalog armor is valid and choosing one keeps runes and proficiency`() {
        val runed = fullPlate.copy(rank = Rank.EXPERT, potency = 1, resistances = listOf(Resistance(DamageType.FIRE, 5)))
        val swapped = ArmorCatalog.apply(runed, ArmorCatalog.basics[3])
        assertEquals(Rank.EXPERT, swapped.rank)
        assertEquals(1, swapped.potency)
        assertEquals(ArmorCatalog.basics[3].itemBonus, swapped.itemBonus)
        ArmorCatalog.basics.forEach { a ->
            var d = Presets.forClass(PfClass.FIGHTER, "id", "V")
            val res = d.zones.all().flatMap { it.second.stations }.filterIsInstance<ResourceStation>().single()
            d = DashboardEditor.replaceStation(d, res.copy(armor = a))
            assertEquals(emptyList(), DashboardValidator.validate(d), a.name)
        }
    }
}
