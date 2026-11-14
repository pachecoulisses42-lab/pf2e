package d20.engine.pathbuilder

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

internal fun fixture(name: String): String =
    checkNotNull(object {}.javaClass.getResource("/pathbuilder/$name")) { "fixture $name" }.readText()

class PathbuilderTextTest {
    private val fromPdf get() = PathbuilderParser.parse(PathbuilderText.extractJson(fixture("ezren-pdf.txt")))

    @Test
    fun `extracts JSON from printed PDF text`() {
        assertEquals("Ezren", fromPdf.name)
        assertEquals("Wizard", fromPdf.className)
        assertEquals(5, fromPdf.level)
    }

    @Test
    fun `drops any non-JSON header line`() {
        val english = fixture("ezren-pdf.txt").replace("Estilos de formatação", "Formatting styles")
        assertEquals(fromPdf, PathbuilderParser.parse(PathbuilderText.extractJson(english)))
    }

    @Test
    fun `accepts the bare build object`() {
        assertEquals(fromPdf, PathbuilderParser.parse(fixture("ezren.json")))
    }

    @Test
    fun `rejects text that is not a Pathbuilder build`() {
        assertFailsWith<IllegalArgumentException> { PathbuilderText.extractJson("olá") }
        val e = assertFailsWith<IllegalArgumentException> { PathbuilderParser.parse("{\"a\":1}") }
        assertTrue("Não é um personagem do Pathbuilder" in e.message.orEmpty())
    }

    @Test
    fun `reads feats, casters and item bonuses`() {
        val b = fromPdf
        assertEquals(4, b.feats.size)
        assertEquals(PbFeat("Reach Spell", "", "Class Feat", 1), b.feats[1])
        assertEquals("Arcana", b.feats[2].choice)
        assertEquals(listOf("Electric Arc", "Detect Magic"), b.casters[0].spells.first { it.first == 0 }.second)
        assertEquals("int", b.casters[0].ability)
        assertEquals(1, b.itemBonuses["Diplomacy"])
        assertEquals(2, b.itemBonuses["Lore: Academia"])
        assertNull(b.itemBonuses["Reflex"])
        assertEquals(19, b.scores["int"])
        assertEquals(listOf("Academia" to 4, "Genie" to 2), b.lores)
        assertEquals(listOf("Force Bolt"), b.focus.single().spells)
        assertEquals(PbArmor("Wooden Shield", "shield", 0, "", true, emptyList()), b.armor[1])
        assertEquals("Healing Potion (Lesser)" to 2, b.equipment[1])
        assertEquals(7, b.weapons.single().attack)
    }

    @Test
    fun `keeps working with the browser's date, page number and URL lines`() {
        val printed = fixture("ezren-pdf.txt").replace(
            "\u000CEstilos de formatação",
            "\u000C14/11/2026, 21:48 pathbuilder2e.com/json.php\nEstilos de formatação\n1/6\nfile:///C:/Users/x/json.html",
        )
        assertEquals(fromPdf, PathbuilderParser.parse(PathbuilderText.extractJson(printed)))
    }

    @Test
    fun `recovers raw JSON that the browser wrapped across lines`() {
        val raw = kotlinx.serialization.json.Json.parseToJsonElement(PathbuilderText.extractJson(fixture("ezren-pdf.txt"))).toString()
        val wrapped = raw.chunked(90).chunked(20).joinToString("\n") { page ->
            "14/11/2026, 21:48 json.php\n" + page.joinToString("\n") + "\nhttps://pathbuilder2e.com/json.php?id=1 1/3\u000C"
        }
        assertEquals(fromPdf, PathbuilderParser.parse(PathbuilderText.extractJson(wrapped)))
    }

    @Test
    fun `keeps compact array lines that end a value with a bracket`() {
        // Pathbuilder's viewer prints feats and lores as `[ "Name", null, "Type", 1, "Slot", "standardChoice", null],`.
        val text = """
            Estilos de formatação
            {
              "build": {
                "name": "Ezren", "class": "Wizard", "level": 5,
                "feats": [
                  [
                    "Reach Spell",
                    null, "Class Feat",
                    1, "Wizard Feat 1",
                    "standardChoice",
                    null],
            Estilos de formatação
                  [
                    "Toughness",
                    null, "General Feat",
                    3, "General Feat 3",
                    "standardChoice",
                    null]
                ],
                "lores": [
                  [
                    "Academia",
                    6],
                  [
                    "Genie",
                    2]
                ]
              }
            }
        """.trimIndent()
        val b = PathbuilderParser.parse(PathbuilderText.extractJson(text))
        assertEquals(listOf("Reach Spell", "Toughness"), b.feats.map { it.name })
        assertEquals(listOf("Academia" to 6, "Genie" to 2), b.lores)
    }
}
