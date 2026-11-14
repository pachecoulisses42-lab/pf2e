package d20.engine.core

import kotlinx.serialization.Serializable
import java.security.SecureRandom

/** Dice offered by the UI. Selection only: no free-form dice expressions anywhere. */
@Serializable
enum class DieType(val sides: Int) {
    D4(4), D6(6), D8(8), D10(10), D12(12);

    val label: String get() = "d$sides"
}

/** Source of randomness. Injected so every roll in the engine is reproducible in tests. */
interface Roller {
    /** Returns a uniformly distributed integer in 1..[sides]. */
    fun roll(sides: Int): Int
}

class RandomRoller(private val random: java.util.Random = SecureRandom()) : Roller {
    override fun roll(sides: Int): Int {
        require(sides >= 2) { "A die needs at least 2 sides" }
        return random.nextInt(sides) + 1
    }
}

/** Test double: yields the given values in order, validating each against the requested die. */
class ScriptedRoller(vararg values: Int) : Roller {
    private val queue = ArrayDeque(values.toList())

    override fun roll(sides: Int): Int {
        val v = checkNotNull(queue.removeFirstOrNull()) { "ScriptedRoller exhausted" }
        require(v in 1..sides) { "Scripted value $v is not valid for a d$sides" }
        return v
    }
}
