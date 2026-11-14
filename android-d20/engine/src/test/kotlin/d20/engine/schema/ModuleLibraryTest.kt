package d20.engine.schema

import d20.engine.pf2e.Rank
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class ModuleLibraryTest {
    private val blank = DashboardEditor.setLayout(Presets.blank("id", "Novo", PfClass.FIGHTER), ZoneKey.ZONE1, GridLayout.GRID_1X1).getOrThrow()

    @Test
    fun `every basic module is valid once copied into a panel`() {
        ModuleLibrary.basics.forEach { t ->
            val (d, copy) = DashboardEditor.addCopy(blank, ZoneKey.ZONE1, t.station).getOrThrow()
            assertEquals(emptyList(), DashboardValidator.validate(d), t.title)
            assertEquals(t.type, copy.type())
        }
    }

    @Test
    fun `library covers weapons spells potions bombs and skill actions`() {
        listOf(StationType.ACTION, StationType.SPELL, StationType.CONSUMABLE, StationType.SKILL).forEach {
            assertTrue(ModuleLibrary.forType(it).size >= 5, it.name)
        }
        assertEquals(ModuleLibrary.basics.size, ModuleLibrary.basics.map { it.type to it.title }.distinct().size)
    }

    @Test
    fun `a copied template gets a fresh id and editing it never changes the template`() {
        val template = ModuleLibrary.forType(StationType.ACTION).first().station as ActionStation
        val (d, copy) = DashboardEditor.addCopy(blank, ZoneKey.ZONE1, template).getOrThrow()
        assertNotEquals(template.id, copy.id)
        val edited = (copy as ActionStation).copy(weapon = copy.weapon.copy(name = "Minha adaga", rank = Rank.EXPERT))
        val after = DashboardEditor.replaceStation(d, edited)
        assertEquals("Minha adaga", after.zones.zone1.stations.single().title)
        assertEquals(Rank.TRAINED, (ModuleLibrary.forType(StationType.ACTION).first().station as ActionStation).weapon.rank)
        assertTrue(DashboardEditor.addCopy(after, ZoneKey.ZONE1, template).isFailure) // zona cheia
    }

    @Test
    fun `saved modules round-trip through JSON and replace a same-named module of the same type`() {
        val dagger = ModuleLibrary.forType(StationType.ACTION).first().station
        val potion = ModuleLibrary.forType(StationType.CONSUMABLE).first().station
        var lib = SavedModules.add(emptyList(), dagger)
        lib = SavedModules.add(lib, potion)
        lib = SavedModules.add(lib, (dagger as ActionStation).copy(weapon = dagger.weapon.copy(potency = 1)))
        assertEquals(2, lib.size)
        assertEquals(listOf("lib-002", "lib-003"), lib.map { it.id })
        assertEquals(lib, SavedModules.decode(SavedModules.encode(lib)))
        assertEquals(1, SavedModules.remove(lib, "lib-002").size)
        assertEquals(emptyList(), SavedModules.decode("não é json"))
    }
}
