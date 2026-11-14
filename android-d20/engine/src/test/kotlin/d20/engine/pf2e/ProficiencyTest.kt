package d20.engine.pf2e

import kotlin.test.Test
import kotlin.test.assertEquals

class ProficiencyTest {
    @Test
    fun `proficiency is level plus 2-4-6-8 and zero when untrained`() {
        assertEquals(0, Rank.UNTRAINED.bonus(level = 12))
        assertEquals(1 + 2, Rank.TRAINED.bonus(1))
        assertEquals(5 + 4, Rank.EXPERT.bonus(5))
        assertEquals(13 + 6, Rank.MASTER.bonus(13))
        assertEquals(20 + 8, Rank.LEGENDARY.bonus(20))
    }

    @Test
    fun `weapon specialization damage by rank, doubled by greater specialization`() {
        assertEquals(0, Rank.UNTRAINED.specializationDamage(false))
        assertEquals(0, Rank.TRAINED.specializationDamage(false))
        assertEquals(2, Rank.EXPERT.specializationDamage(false))
        assertEquals(3, Rank.MASTER.specializationDamage(false))
        assertEquals(4, Rank.LEGENDARY.specializationDamage(false))
        assertEquals(4, Rank.EXPERT.specializationDamage(true))
        assertEquals(6, Rank.MASTER.specializationDamage(true))
        assertEquals(8, Rank.LEGENDARY.specializationDamage(true))
    }
}
