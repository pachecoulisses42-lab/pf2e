package d20.engine.core

import kotlin.test.Test
import kotlin.test.assertEquals

class ModifierStackTest {
    @Test
    fun `same-type bonuses do not stack, the highest wins`() {
        val r = ModifierStack.resolve(
            listOf(
                Modifier("Runa +1", ModType.ITEM, 1),
                Modifier("Item +2", ModType.ITEM, 2),
            ),
        )
        assertEquals(2, r.total)
        assertEquals(1, r.ignored.size)
        assertEquals("Runa +1", r.ignored.single().label)
    }

    @Test
    fun `same-type penalties do not stack, the worst wins`() {
        val r = ModifierStack.resolve(
            listOf(
                Modifier("Enfraquecido", ModType.STATUS, -1),
                Modifier("Amedrontado", ModType.STATUS, -2),
            ),
        )
        assertEquals(-2, r.total)
    }

    @Test
    fun `bonus and penalty of the same type both apply`() {
        val r = ModifierStack.resolve(
            listOf(
                Modifier("Bênção", ModType.STATUS, 1),
                Modifier("Amedrontado", ModType.STATUS, -2),
            ),
        )
        assertEquals(-1, r.total)
    }

    @Test
    fun `untyped modifiers always stack`() {
        val r = ModifierStack.resolve(
            listOf(
                Modifier("A", ModType.UNTYPED, 1),
                Modifier("B", ModType.UNTYPED, 2),
                Modifier("MAP", ModType.UNTYPED, -5),
            ),
        )
        assertEquals(-2, r.total)
        assertEquals(0, r.ignored.size)
    }

    @Test
    fun `different types add together`() {
        val r = ModifierStack.resolve(
            listOf(
                Modifier("FOR", ModType.ABILITY, 4),
                Modifier("Prof", ModType.PROFICIENCY, 9),
                Modifier("Potência", ModType.ITEM, 2),
            ),
        )
        assertEquals(15, r.total)
    }

    @Test
    fun `empty list is zero`() {
        assertEquals(0, ModifierStack.resolve(emptyList()).total)
    }
}
