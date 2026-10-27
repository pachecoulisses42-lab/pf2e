package d20.engine.core

enum class Degree {
    CRITICAL_FAILURE, FAILURE, SUCCESS, CRITICAL_SUCCESS;

    private fun shifted(steps: Int): Degree =
        entries[(ordinal + steps).coerceIn(0, entries.lastIndex)]

    /** Damage taken after a *basic* saving throw with this degree (half rounds down). */
    fun basicSaveDamage(damage: Int): Int = when (this) {
        CRITICAL_SUCCESS -> 0
        SUCCESS -> damage / 2
        FAILURE -> damage
        CRITICAL_FAILURE -> damage * 2
    }

    companion object {
        /**
         * PF2e degree of success: beating the DC by 10 is a critical success, missing by 10 a critical failure,
         * then a natural 20 improves and a natural 1 worsens the result by one step.
         */
        fun of(total: Int, natural: Int, dc: Int): Degree {
            val base = when {
                total >= dc + 10 -> CRITICAL_SUCCESS
                total >= dc -> SUCCESS
                total <= dc - 10 -> CRITICAL_FAILURE
                else -> FAILURE
            }
            return when (natural) {
                20 -> base.shifted(+1)
                1 -> base.shifted(-1)
                else -> base
            }
        }
    }
}
