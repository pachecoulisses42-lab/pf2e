package d20.engine.play

import d20.engine.core.Degree

/** Which result sound a roll plays once its animation ends. */
enum class Cue { SUCCESS, CRITICAL, FAILURE, CRITICAL_FAILURE }

/** The degree of success decides; without a target only a natural 20/1 or healing are worth a sound. */
fun RollOutcome.cue(): Cue? = when (degree) {
    Degree.CRITICAL_SUCCESS -> Cue.CRITICAL
    Degree.SUCCESS -> Cue.SUCCESS
    Degree.FAILURE -> Cue.FAILURE
    Degree.CRITICAL_FAILURE -> Cue.CRITICAL_FAILURE
    null -> when {
        tone == Tone.CRITICAL -> Cue.CRITICAL
        tone == Tone.FAILURE -> Cue.CRITICAL_FAILURE
        heal != null -> Cue.SUCCESS
        else -> null
    }
}
