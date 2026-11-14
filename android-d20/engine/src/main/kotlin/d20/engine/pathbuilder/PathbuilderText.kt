package d20.engine.pathbuilder

/**
 * Recovers the JSON from a Pathbuilder export that was printed to PDF and read back as text. The browser adds a
 * header line on every page ("Estilos de formatação", "Formatting styles", ...), which lands in the middle of the
 * JSON; any line that cannot start a JSON token is dropped, whatever its language.
 */
object PathbuilderText {
    private const val JSON_START = "{}[]\",-0123456789tfn"

    fun extractJson(text: String): String {
        val kept = text.lineSequence()
            .map { it.replace("\u000C", "") }
            .filter { line -> line.isBlank() || line.trimStart().first() in JSON_START }
            .joinToString("\n")
        val start = kept.indexOf('{')
        val end = kept.lastIndexOf('}')
        require(start >= 0 && end > start) { "Nenhum JSON encontrado" }
        return kept.substring(start, end + 1)
    }
}
