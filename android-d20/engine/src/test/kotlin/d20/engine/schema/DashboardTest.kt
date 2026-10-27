package d20.engine.schema

import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ElementalRune
import d20.engine.pf2e.Rank
import d20.engine.pf2e.flamingLongsword
import d20.engine.pf2e.hero
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class DashboardTest {
    private fun sample() = Dashboard(
        characterId = "char-1",
        name = "Valeros",
        characterClass = PfClass.FIGHTER,
        character = hero,
        zones = Zones(
            zone1 = ZoneConfig(GridLayout.GRID_1X2, listOf(ActionStation("a1", flamingLongsword))),
            zone2 = ZoneConfig(
                GridLayout.GRID_2X2,
                listOf(SkillStation("s1", CheckSpec(CheckKind.ATHLETICS, Rank.EXPERT, itemBonus = 1))),
            ),
            zone3 = ZoneConfig(GridLayout.GRID_1X1, emptyList()),
        ),
    )

    @Test
    fun `layout capacities follow the 1-2-4 grid law`() {
        assertEquals(1, GridLayout.GRID_1X1.slots)
        assertEquals(2, GridLayout.GRID_1X2.slots)
        assertEquals(4, GridLayout.GRID_2X2.slots)
    }

    @Test
    fun `valid dashboard has no errors`() {
        assertEquals(emptyList(), DashboardValidator.validate(sample()))
    }

    @Test
    fun `export then import round-trips`() {
        val text = DashboardJson.encode(sample())
        val back = DashboardJson.decode(text).getOrThrow()
        assertEquals(sample(), back)
    }

    @Test
    fun `export carries guide fields and derived display formulas`() {
        val root = Json.parseToJsonElement(DashboardJson.encode(sample())).jsonObject
        assertEquals("char-1", root["characterId"]!!.jsonPrimitive.content)
        assertEquals("FIGHTER", root["characterClass"]!!.jsonPrimitive.content)
        assertEquals(1, root["schemaVersion"]!!.jsonPrimitive.content.toInt())
        val station = root["zones"]!!.jsonObject["zone1"]!!.jsonObject["stations"]!!.jsonArray[0].jsonObject
        assertEquals("ACTION", station["type"]!!.jsonPrimitive.content)
        assertEquals("Espada Rubra", station["title"]!!.jsonPrimitive.content)
        assertEquals("1d20+14", station["diceFormula"]!!.jsonPrimitive.content)
        assertEquals("2d8+6 +1d6", station["secondaryDiceFormula"]!!.jsonPrimitive.content)
        assertTrue(root["zones"]!!.jsonObject["zone3"]!!.jsonObject["stations"] is JsonArray)
    }

    @Test
    fun `decode refuses invalid dashboards and malformed json`() {
        assertTrue(DashboardJson.decode("{ not json").isFailure)
        val overfull = sample().let {
            it.copy(zones = it.zones.copy(zone3 = ZoneConfig(GridLayout.GRID_1X1, List(2) { i ->
                ActionStation("x$i", flamingLongsword)
            })))
        }
        assertTrue(DashboardJson.decode(DashboardJson.encode(overfull, validate = false)).isFailure)
    }

    @Test
    fun `validator catches overfull zones, duplicate ids and bad ranges`() {
        val base = sample()
        val tooMany = base.copy(zones = base.zones.copy(zone1 = ZoneConfig(GridLayout.GRID_1X1,
            listOf(ActionStation("a1", flamingLongsword), ActionStation("a2", flamingLongsword)))))
        assertTrue(DashboardValidator.validate(tooMany).any { "zone1" in it && "slots" in it })

        val dup = base.copy(zones = base.zones.copy(zone3 = ZoneConfig(GridLayout.GRID_1X1,
            listOf(ActionStation("a1", flamingLongsword)))))
        assertTrue(DashboardValidator.validate(dup).any { "duplicado" in it })

        val badLevel = base.copy(character = base.character.copy(level = 21))
        assertTrue(DashboardValidator.validate(badLevel).any { "nível" in it })

        val badDice = base.copy(zones = base.zones.copy(zone1 = ZoneConfig(GridLayout.GRID_1X2,
            listOf(ActionStation("a1", flamingLongsword.copy(diceCount = 9, potency = 5))))))
        val errs = DashboardValidator.validate(badDice)
        assertTrue(errs.any { "dados" in it })
        assertTrue(errs.any { "potência" in it })

        val dupRune = base.copy(zones = base.zones.copy(zone1 = ZoneConfig(GridLayout.GRID_1X2,
            listOf(ActionStation("a1", flamingLongsword.copy(
                elemental = listOf(ElementalRune.FLAMING, ElementalRune.FLAMING)))))))
        assertTrue(DashboardValidator.validate(dupRune).any { "runa" in it })
    }

    @Test
    fun `free text is limited to the character and custom names and is sanitized`() {
        assertEquals("Espada Rubra", Text.sanitize("  Espada \n  Rubra \u0007 "))
        assertEquals(40, Text.sanitize("x".repeat(100)).length)
        val base = sample()
        val blank = base.copy(name = "   ")
        assertTrue(DashboardValidator.validate(blank).any { "nome" in it.lowercase() })
        val ctrl = base.copy(name = "Val\u0000eros")
        assertFalse(DashboardValidator.validate(ctrl).isEmpty())
    }

    @Test
    fun `every class preset is a valid dashboard`() {
        for (cls in listOf(PfClass.FIGHTER, PfClass.ROGUE, PfClass.WIZARD, PfClass.CLERIC)) {
            val d = Presets.forClass(cls, id = "id-$cls", name = "Teste $cls")
            assertEquals(emptyList(), DashboardValidator.validate(d), "preset $cls")
            assertTrue(d.zones.all().sumOf { it.second.stations.size } >= 4)
        }
    }

    @Test
    fun `blank dashboard is valid and has three empty zones`() {
        val d = Presets.blank("id", "Novo", PfClass.FIGHTER)
        assertEquals(emptyList(), DashboardValidator.validate(d))
        assertEquals(0, d.zones.all().sumOf { it.second.stations.size })
    }

    @Test
    fun `abilities are required and bounded`() {
        val noMods = sample().copy(character = hero.copy(abilityMods = mapOf(Ability.STR to 4)))
        assertTrue(DashboardValidator.validate(noMods).isNotEmpty())
        val tooHigh = sample().copy(character = hero.copy(abilityMods = hero.abilityMods + (Ability.STR to 30)))
        assertTrue(DashboardValidator.validate(tooHigh).isNotEmpty())
    }
}
