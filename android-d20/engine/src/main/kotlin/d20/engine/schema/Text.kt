package d20.engine.schema

/** The only free-text fields in the app are the character name and custom weapon/spell/item names. */
object Text {
    const val MAX_LENGTH = 40

    fun sanitize(raw: String): String =
        raw.filter { !it.isISOControl() || it.isWhitespace() }
            .trim()
            .replace(Regex("\\s+"), " ")
            .take(MAX_LENGTH)

    fun isValid(s: String): Boolean =
        s.isNotBlank() && s.length <= MAX_LENGTH && s.none { it.isISOControl() }
}
