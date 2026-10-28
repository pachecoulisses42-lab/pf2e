package d20.engine.conditions

import d20.engine.core.Modifier
import d20.engine.core.ModType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ShieldBlock
import d20.engine.pf2e.ShieldKind
import d20.engine.schema.Dashboard
import d20.engine.schema.maxHp
import d20.engine.schema.resourceStation
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class ActiveCondition(
    val id: String,
    val kind: ConditionKind,
    val value: Int = 1,
    /** Remaining rounds, counted down at the end of your turn (null = until removed). */
    val roundsLeft: Int? = null,
    /** The affliction that imposed it, so a stage change can replace it. */
    val source: String? = null,
)

@Serializable
data class PersistentDamage(val id: String, val spec: PersistentSpec, val assisted: Boolean = false)

@Serializable
enum class DurationUnit(val ptName: String) { ROUNDS("rodadas"), MINUTES("minutos"), HOURS("horas"), DAYS("dias") }

@Serializable
data class StageDuration(val value: Int, val unit: DurationUnit)

@Serializable
data class StageCondition(val kind: ConditionKind, val value: Int = 1)

@Serializable
data class AfflictionStage(
    val damage: PersistentSpec? = null,
    val conditions: List<StageCondition> = emptyList(),
    val duration: StageDuration,
)

/** A poison (or other affliction): a saving throw that moves you between stages. */
@Serializable
data class Affliction(
    val name: String,
    val save: CheckKind,
    val dc: Int,
    val stages: List<AfflictionStage>,
    /** Maximum duration in rounds, when it is measured in rounds. */
    val maxRounds: Int? = null,
)

@Serializable
data class AfflictionState(val id: String, val affliction: Affliction, val stage: Int, val roundsLeft: Int?, val maxRoundsLeft: Int?)

/** Everything that changes while you play: Hit Points, shield, conditions, persistent damage, afflictions, item uses. */
@Serializable
data class PlayState(
    val hp: Int,
    val shieldHp: Int? = null,
    val shieldRaised: Boolean = false,
    val conditions: List<ActiveCondition> = emptyList(),
    val persistent: List<PersistentDamage> = emptyList(),
    val afflictions: List<AfflictionState> = emptyList(),
    /** Consumables used so far, by station id. */
    val used: Map<String, Int> = emptyMap(),
    val nextId: Int = 1,
) {
    /** The strongest value among entries of this kind (0 if absent). */
    fun valueOf(kind: ConditionKind): Int = conditions.filter { it.kind == kind }.maxOfOrNull { it.value } ?: 0
}

object PlayStateJson {
    private val json = Json { encodeDefaults = true; ignoreUnknownKeys = true }

    fun encode(s: PlayState): String = json.encodeToString(PlayState.serializer(), s)

    /** An empty or unreadable text yields a fresh state with [fallbackHp]. */
    fun decode(text: String, fallbackHp: Int = 0): PlayState =
        if (text.isBlank()) PlayState(hp = fallbackHp)
        else runCatching { json.decodeFromString(PlayState.serializer(), text) }.getOrElse { PlayState(hp = fallbackHp) }
}

/** Status penalties from conditions: they never stack with each other, only the worst applies. */
object StatusPenalties {
    fun modifiers(conditions: List<ActiveCondition>, ability: Ability?): List<Modifier> {
        val worst = conditions.filter { applies(it.kind, ability) }.maxByOrNull { it.value } ?: return emptyList()
        return listOf(Modifier(worst.kind.label(worst.value), ModType.STATUS, -worst.value))
    }

    fun total(conditions: List<ActiveCondition>, ability: Ability?): Int = modifiers(conditions, ability).sumOf { it.value }

    private fun applies(kind: ConditionKind, ability: Ability?): Boolean = when (kind) {
        ConditionKind.FRIGHTENED, ConditionKind.SICKENED -> true
        ConditionKind.CLUMSY -> ability == Ability.DEX
        ConditionKind.ENFEEBLED -> ability == Ability.STR
        ConditionKind.STUPEFIED -> ability == Ability.INT || ability == Ability.WIS || ability == Ability.CHA
        ConditionKind.DRAINED -> ability == Ability.CON
        else -> false
    }
}

/** Pure state transitions used by Play mode and by confirmed turn proposals. */
object PlayRules {
    fun allocId(s: PlayState, prefix: String = "c"): Pair<String, PlayState> = "$prefix${s.nextId}" to s.copy(nextId = s.nextId + 1)

    /** Sets (or, with value <= 0, removes) a condition. Without [source] a removal clears every entry of the kind. */
    fun setCondition(s: PlayState, kind: ConditionKind, value: Int, rounds: Int? = null, source: String? = null): PlayState {
        if (value <= 0) {
            return s.copy(conditions = s.conditions.filterNot { it.kind == kind && (source == null || it.source == source) })
        }
        val existing = s.conditions.firstOrNull { it.kind == kind && it.source == source }
        return if (existing != null) {
            s.copy(conditions = s.conditions.map { if (it === existing) it.copy(value = value, roundsLeft = rounds) else it })
        } else {
            val (id, s2) = allocId(s)
            s2.copy(conditions = s2.conditions + ActiveCondition(id, kind, value, rounds, source))
        }
    }

    /** Adds a condition; the same kind and source merges, keeping the higher value. */
    fun addCondition(s: PlayState, kind: ConditionKind, value: Int = 1, rounds: Int? = null, source: String? = null): PlayState {
        val existing = s.conditions.firstOrNull { it.kind == kind && it.source == source }
        val v = if (kind.valued) value.coerceAtLeast(1) else 1
        if (existing == null) return setCondition(s, kind, v, rounds, source)
        val newRounds = if (existing.roundsLeft != null && rounds != null) maxOf(existing.roundsLeft, rounds) else rounds ?: existing.roundsLeft
        return setCondition(s, kind, maxOf(existing.value, v), newRounds, source)
    }

    fun removeCondition(s: PlayState, kind: ConditionKind): PlayState = setCondition(s, kind, 0)

    fun addPersistent(s: PlayState, spec: PersistentSpec): PlayState {
        val same = s.persistent.firstOrNull { it.spec.type == spec.type }
        if (same != null) {
            return if (strength(spec) > strength(same.spec)) s.copy(persistent = s.persistent.map { if (it === same) it.copy(spec = spec) else it }) else s
        }
        val (id, s2) = allocId(s, "p")
        return s2.copy(persistent = s2.persistent + PersistentDamage(id, spec))
    }

    private fun strength(p: PersistentSpec): Double =
        (p.die?.let { p.diceCount * (it.sides + 1) / 2.0 } ?: 0.0) + p.flat

    /** Starts an affliction at [stage], imposing that stage's conditions. */
    fun addAffliction(s: PlayState, a: Affliction, stage: Int = 1): PlayState {
        val (id, s2) = allocId(s, "a")
        val def = a.stages[(stage - 1).coerceIn(0, a.stages.lastIndex)]
        val rounds = def.duration.takeIf { it.unit == DurationUnit.ROUNDS }?.value
        var out = s2.copy(afflictions = s2.afflictions + AfflictionState(id, a, stage, rounds, a.maxRounds))
        for (c in def.conditions) out = setCondition(out, c.kind, c.value, rounds, source = id)
        return out
    }

    /**
     * Changes Hit Points. Reaching 0 makes you Dying (1, plus Wounded); damage while Dying raises it; regaining
     * Hit Points while Dying clears it and makes you Wounded (or raises Wounded).
     */
    fun changeHp(s: PlayState, delta: Int, maxHp: Int): Pair<PlayState, String?> {
        if (delta < 0) {
            val hp = (s.hp + delta).coerceAtLeast(0)
            var st = s.copy(hp = hp)
            if (hp > 0) return st to null
            val dying = st.valueOf(ConditionKind.DYING)
            return if (s.hp > 0) {
                val v = 1 + st.valueOf(ConditionKind.WOUNDED)
                setCondition(st, ConditionKind.DYING, v) to "Você caiu a 0 PV: Morrendo $v"
            } else if (dying > 0) {
                setCondition(st, ConditionKind.DYING, dying + 1) to "Dano enquanto morrendo: Morrendo ${dying + 1}"
            } else st to null
        }
        val hp = (s.hp + delta).coerceAtMost(maxHp)
        var st = s.copy(hp = hp)
        if (hp > 0 && st.valueOf(ConditionKind.DYING) > 0) {
            val wounded = st.valueOf(ConditionKind.WOUNDED) + 1
            st = setCondition(removeCondition(st, ConditionKind.DYING), ConditionKind.WOUNDED, wounded)
            return st to "Você recuperou PV: não está mais morrendo. Ferido $wounded"
        }
        return st to null
    }

    /** A fresh game state: full Hit Points and, if the character carries one, a full (lowered) shield. */
    fun initialFor(d: Dashboard): PlayState = PlayState(hp = d.maxHp(), shieldHp = d.resourceStation()?.shield?.maxHp)

    /** A broken shield (at or below its broken threshold) cannot be raised. */
    fun setShieldRaised(s: PlayState, kind: ShieldKind, raised: Boolean): PlayState {
        val usable = (s.shieldHp ?: kind.maxHp) > kind.brokenThreshold
        return s.copy(shieldRaised = raised && usable)
    }

    /** Shield Block: Hardness absorbs damage, you and the shield take the rest; a broken shield is lowered. */
    fun applyBlock(s: PlayState, kind: ShieldKind, incomingDamage: Int, maxHp: Int): Pair<PlayState, String> {
        val r = ShieldBlock.resolve(kind, s.shieldHp ?: kind.maxHp, incomingDamage)
        val (hit, hpMsg) = changeHp(s.copy(shieldHp = r.newShieldHp, shieldRaised = s.shieldRaised && !r.broken), -r.damageToYou, maxHp)
        val msg = buildString {
            append("Bloqueio: ${r.blocked} absorvido, você sofre ${r.damageToYou}, o escudo sofre ${r.damageToShield} (PV ${r.newShieldHp}/${kind.maxHp}).")
            if (r.broken) append(" Escudo quebrado.")
            hpMsg?.let { append(" ").append(it) }
        }
        return hit to msg
    }

    fun remaining(s: PlayState, stationId: String, spec: ConsumableSpec): Int = (spec.quantity - (s.used[stationId] ?: 0)).coerceAtLeast(0)

    fun useItem(s: PlayState, stationId: String): PlayState = s.copy(used = s.used + (stationId to (s.used[stationId] ?: 0) + 1))
}
