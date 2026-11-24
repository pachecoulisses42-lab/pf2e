package d20.engine.pathbuilder

import kotlinx.serialization.json.Json

/**
 * Recovers the JSON from a Pathbuilder export that was printed to PDF and read back as text. Browsers add lines
 * of their own on every page (the JSON viewer's "Estilos de formatação" / "Formatting styles", the date, the page
 * number, the URL), and some print the JSON as one long wrapped line instead of pretty-printed.
 */
object PathbuilderText {
    private const val STRUCTURAL = "{}[]\""

    /** A line that starts with a bare number/true/false/null must continue as JSON: a comma, a closing bracket or nothing. */
    private val scalarLine = Regex("""^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)\s*([,\]}].*)?$""")

    /** Lines the browser prints around the page: date and time, "1/6" page counters, URLs. */
    private val browserLine = listOf(
        Regex("""^\d{1,2}/\d{1,2}/\d{2,4},?\s+\d{1,2}:\d{2}.*"""),
        Regex("""^\d+\s*/\s*\d+$"""),
        Regex("""^[a-z][a-z0-9+.-]*://\S*.*""", RegexOption.IGNORE_CASE),
    )

    fun extractJson(text: String): String {
        val lines = text.replace("\u000C", "\n").lines().map { it.trim() }
        val pretty = slice(lines.filter { it.isEmpty() || it.first() in STRUCTURAL || scalarLine.matches(it) }.joinToString("\n"))
        if (pretty != null && parses(pretty)) return pretty
        // Raw JSON wrapped by the browser: lines break anywhere, so drop the browser's own lines and glue the rest.
        val raw = slice(lines.filterNot { l -> browserLine.any { it.matches(l) } }.joinToString(""))
        if (raw != null && parses(raw)) return raw
        return requireNotNull(pretty ?: raw) { "Nenhum JSON encontrado" }
    }

    private fun slice(s: String): String? {
        val start = s.indexOf('{')
        val end = s.lastIndexOf('}')
        return if (start >= 0 && end > start) s.substring(start, end + 1) else null
    }

    private fun parses(s: String) = runCatching { Json.parseToJsonElement(s) }.isSuccess
}
