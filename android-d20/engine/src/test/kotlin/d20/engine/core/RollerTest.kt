package d20.engine.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class RollerTest {
    @Test
    fun `scripted roller returns values in order and rejects out-of-range`() {
        val r = ScriptedRoller(3, 20)
        assertEquals(3, r.roll(6))
        assertEquals(20, r.roll(20))
        assertFailsWith<IllegalStateException> { r.roll(6) } // exhausted
        assertFailsWith<IllegalArgumentException> { ScriptedRoller(7).roll(6) }
    }

    @Test
    fun `random roller stays inside the die range`() {
        val r = RandomRoller()
        repeat(2000) {
            val v = r.roll(20)
            assertTrue(v in 1..20)
        }
    }

    @Test
    fun `die type exposes sides and label`() {
        assertEquals(8, DieType.D8.sides)
        assertEquals("d12", DieType.D12.label)
    }
}
