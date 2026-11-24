package d20.engine.play

import d20.engine.core.Degree
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CueTest {
    private fun outcome(degree: Degree?, tone: Tone, heal: Int? = null) = RollOutcome(
        title = "x", subtitle = "", natural = 10, total = 10, breakdown = emptyList(), dc = null,
        degree = degree, tone = tone, damage = null, heal = heal,
    )

    @Test
    fun `degree of success picks the result sound`() {
        assertEquals(Cue.CRITICAL, outcome(Degree.CRITICAL_SUCCESS, Tone.CRITICAL).cue())
        assertEquals(Cue.SUCCESS, outcome(Degree.SUCCESS, Tone.SUCCESS).cue())
        assertEquals(Cue.FAILURE, outcome(Degree.FAILURE, Tone.FAILURE).cue())
        assertEquals(Cue.CRITICAL_FAILURE, outcome(Degree.CRITICAL_FAILURE, Tone.FAILURE).cue())
    }

    @Test
    fun `without a target only natural 20 and 1 and healing make a sound`() {
        assertEquals(Cue.CRITICAL, outcome(null, Tone.CRITICAL).cue())
        assertEquals(Cue.CRITICAL_FAILURE, outcome(null, Tone.FAILURE).cue())
        assertEquals(Cue.SUCCESS, outcome(null, Tone.NEUTRAL, heal = 7).cue())
        assertNull(outcome(null, Tone.NEUTRAL).cue())
    }
}
