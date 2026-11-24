package d20.engine.schema

import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.ConditionKind
import d20.engine.core.ScriptedRoller
import d20.engine.pf2e.Pf2eEngine
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import kotlinx.serialization.json.jsonObject
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class AbilityStationTest {
    private val base = Presets.forClass(PfClass.WIZARD, "id", "Ezren")
    private val talent = AbilityStation("lib-001", "Explosão de Poder", AbilityCategory.CLASS_FEAT, 8)

    @Test
    fun `ability station round-trips through dashboard JSON`() {
        val placed = AbilityStation("st-09", "Sorte do Halfling", AbilityCategory.ANCESTRY_FEAT, 1)
        val d = base.copy(
            zones = base.zones.copy(zone1 = base.zones.zone1.copy(layout = GridLayout.GRID_2X2, stations = base.zones.zone1.stations + placed)),
            library = listOf(talent),
        )
        assertEquals(d, DashboardJson.decode(DashboardJson.encode(d)).getOrThrow())
    }

    @Test
    fun `tapping an ability shows its effects as notices`() {
        val s = talent.copy(effects = listOf(ConditionEffect(ConditionKind.FRIGHTENED, 1)))
        val o = PlayRunner(Pf2eEngine(ScriptedRoller())).run(base, s, PlayContext())
        assertEquals(1, o.notices.size)
        assertNull(o.total)
        assertEquals("Explosão de Poder", o.title)
    }

    @Test
    fun `library stations are validated`() {
        val d = base.copy(library = listOf(talent.copy(name = "")))
        assertTrue(DashboardValidator.validate(d).any { "biblioteca" in it }, DashboardValidator.validate(d).toString())
    }

    @Test
    fun `old dashboards without library still decode`() {
        val tree = kotlinx.serialization.json.Json.parseToJsonElement(DashboardJson.encode(base)).jsonObject
        assertTrue("library" in tree)
        val json = kotlinx.serialization.json.JsonObject(tree - "library").toString()
        assertEquals(emptyList(), DashboardJson.decode(json).getOrThrow().library)
    }
}
