package d20.engine.core

import kotlin.test.Test
import kotlin.test.assertEquals

class DegreeTest {
    private fun d(total: Int, nat: Int, dc: Int) = Degree.of(total, nat, dc)

    @Test
    fun `thresholds around the DC`() {
        assertEquals(Degree.CRITICAL_SUCCESS, d(25, 10, 15))
        assertEquals(Degree.SUCCESS, d(24, 10, 15))
        assertEquals(Degree.SUCCESS, d(15, 10, 15))
        assertEquals(Degree.FAILURE, d(14, 10, 15))
        assertEquals(Degree.FAILURE, d(6, 10, 15))
        assertEquals(Degree.CRITICAL_FAILURE, d(5, 10, 15))
    }

    @Test
    fun `natural 20 improves the degree by one step`() {
        assertEquals(Degree.SUCCESS, d(14, 20, 15)) // failure -> success
        assertEquals(Degree.CRITICAL_SUCCESS, d(15, 20, 15)) // success -> critical success
        assertEquals(Degree.FAILURE, d(5, 20, 15)) // critical failure -> failure
    }

    @Test
    fun `natural 1 worsens the degree by one step`() {
        assertEquals(Degree.FAILURE, d(15, 1, 15)) // success -> failure
        assertEquals(Degree.SUCCESS, d(25, 1, 15)) // critical success -> success
        assertEquals(Degree.CRITICAL_FAILURE, d(14, 1, 15)) // failure -> critical failure
    }

    @Test
    fun `steps are clamped at the ends`() {
        assertEquals(Degree.CRITICAL_SUCCESS, d(40, 20, 15))
        assertEquals(Degree.CRITICAL_FAILURE, d(-5, 1, 15))
    }

    @Test
    fun `basic save multipliers`() {
        assertEquals(0, Degree.CRITICAL_SUCCESS.basicSaveDamage(11))
        assertEquals(5, Degree.SUCCESS.basicSaveDamage(11))
        assertEquals(11, Degree.FAILURE.basicSaveDamage(11))
        assertEquals(22, Degree.CRITICAL_FAILURE.basicSaveDamage(11))
    }
}
