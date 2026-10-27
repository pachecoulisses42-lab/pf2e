package d20.engine.schema

import d20.engine.pf2e.Ability
import d20.engine.pf2e.Rank
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs
import kotlin.test.assertTrue

class DashboardEditorTest {
    private val blank = Presets.blank("id", "Novo", PfClass.FIGHTER)

    @Test
    fun `adding stations assigns unique ids and respects the layout capacity`() {
        var d = DashboardEditor.setLayout(blank, ZoneKey.ZONE1, GridLayout.GRID_1X2).getOrThrow()
        d = DashboardEditor.addStation(d, ZoneKey.ZONE1, StationType.ACTION).getOrThrow()
        d = DashboardEditor.addStation(d, ZoneKey.ZONE1, StationType.SPELL).getOrThrow()
        assertEquals(2, d.zones.zone1.stations.size)
        assertEquals(2, d.zones.zone1.stations.map { it.id }.distinct().size)
        assertIs<ActionStation>(d.zones.zone1.stations[0])
        assertTrue(DashboardEditor.addStation(d, ZoneKey.ZONE1, StationType.SKILL).isFailure) // cheio
        assertEquals(emptyList(), DashboardValidator.validate(d))
    }

    @Test
    fun `shrinking a layout below the station count is refused instead of silently dropping stations`() {
        var d = DashboardEditor.setLayout(blank, ZoneKey.ZONE2, GridLayout.GRID_2X2).getOrThrow()
        repeat(3) { d = DashboardEditor.addStation(d, ZoneKey.ZONE2, StationType.SKILL).getOrThrow() }
        assertTrue(DashboardEditor.setLayout(d, ZoneKey.ZONE2, GridLayout.GRID_1X2).isFailure)
        d = DashboardEditor.removeStation(d, d.zones.zone2.stations.last().id)
        d = DashboardEditor.removeStation(d, d.zones.zone2.stations.last().id)
        assertEquals(GridLayout.GRID_1X2, DashboardEditor.setLayout(d, ZoneKey.ZONE2, GridLayout.GRID_1X2).getOrThrow().zones.zone2.layout)
    }

    @Test
    fun `replace keeps position and ids stay unique after remove and add`() {
        var d = DashboardEditor.setLayout(blank, ZoneKey.ZONE3, GridLayout.GRID_1X2).getOrThrow()
        d = DashboardEditor.addStation(d, ZoneKey.ZONE3, StationType.SKILL).getOrThrow()
        d = DashboardEditor.addStation(d, ZoneKey.ZONE3, StationType.RESOURCE).getOrThrow()
        val first = d.zones.zone3.stations[0] as SkillStation
        val edited = first.copy(check = first.check.copy(rank = Rank.MASTER))
        d = DashboardEditor.replaceStation(d, edited)
        assertEquals(Rank.MASTER, (d.zones.zone3.stations[0] as SkillStation).check.rank)
        d = DashboardEditor.removeStation(d, first.id)
        d = DashboardEditor.addStation(d, ZoneKey.ZONE3, StationType.SKILL).getOrThrow()
        assertEquals(2, d.zones.zone3.stations.map { it.id }.distinct().size)
    }

    @Test
    fun `character edits are sanitized and bounded`() {
        var d = DashboardEditor.rename(blank, "  Val\u0007eros   Rubro ")
        assertEquals("Valeros Rubro", d.name)
        d = DashboardEditor.setLevel(d, 99)
        assertEquals(20, d.character.level)
        d = DashboardEditor.setAbility(d, Ability.STR, 40)
        assertEquals(10, d.character.mod(Ability.STR))
        d = DashboardEditor.setClass(d, PfClass.WIZARD)
        assertEquals(PfClass.WIZARD, d.characterClass)
    }
}
