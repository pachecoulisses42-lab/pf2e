package d20.engine.schema

import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals

/**
 * Keeps docs/example-fighter.json honest: it must equal what the exporter produces today.
 * Regenerate with `UPDATE_EXAMPLE=1 gradle -PengineOnly=true :engine:test`.
 */
class ExampleExportTest {
    private val file = File("../docs/example-fighter.json")

    @Test
    fun `documented example matches the exporter output`() {
        val actual = DashboardJson.encode(Presets.forClass(PfClass.FIGHTER, "char-8832", "Valeros")) + "\n"
        if (System.getenv("UPDATE_EXAMPLE") == "1") file.writeText(actual)
        assertEquals(file.readText(), actual, "docs/example-fighter.json is stale")
    }
}
