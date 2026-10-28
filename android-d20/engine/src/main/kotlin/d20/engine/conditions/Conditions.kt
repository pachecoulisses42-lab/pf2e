package d20.engine.conditions

import d20.engine.core.Degree
import d20.engine.core.DieType
import d20.engine.pf2e.DamageType
import kotlinx.serialization.Serializable

/** Conditions from the Pathfinder data. [valued] ones carry a number (Frightened 2). */
@Serializable
enum class ConditionKind(val ptName: String, val valued: Boolean) {
    BLINDED("Cego", false), CLUMSY("Desajeitado", true), CONCEALED("Oculto", false), CONFUSED("Confuso", false),
    DAZZLED("Ofuscado", false), DEAFENED("Surdo", false), DOOMED("Condenado", true), DRAINED("Drenado", true),
    DYING("Morrendo", true), ENFEEBLED("Debilitado", true), FASCINATED("Fascinado", false), FATIGUED("Fatigado", false),
    FLEEING("Fugindo", false), FRIGHTENED("Apavorado", true), GRABBED("Agarrado", false), HIDDEN("Escondido", false),
    IMMOBILIZED("Imobilizado", false), INVISIBLE("Invisível", false), OFF_GUARD("Desprevenido", false),
    PARALYZED("Paralisado", false), PETRIFIED("Petrificado", false), PRONE("Caído", false), QUICKENED("Acelerado", false),
    RESTRAINED("Contido", false), SICKENED("Enjoado", true), SLOWED("Lento", true), STUNNED("Atordoado", true),
    STUPEFIED("Estupefato", true), UNCONSCIOUS("Inconsciente", false), WOUNDED("Ferido", true);

    fun label(value: Int): String = if (valued) "$ptName $value" else ptName
}

/** Persistent damage description (dice or flat) used by bombs and by the conditions module. */
@Serializable
data class PersistentSpec(val diceCount: Int, val die: DieType?, val flat: Int, val type: DamageType) {
    /** "1d6" or "2". */
    val notation: String get() = if (die != null && diceCount > 0) "$diceCount${die.label}" else "$flat"

    /** A critical hit doubles persistent damage. */
    fun doubled() = copy(diceCount = diceCount * 2, flat = flat * 2)
}

@Serializable
enum class EffectTarget(val ptName: String) { SELF("Em mim"), ENEMY("No inimigo") }

@Serializable
enum class EffectAction(val ptName: String) { IMPOSE("Impõe"), REMOVE("Remove") }

/** Which result of the roll triggers the effect. [ALWAYS] suits potions, which have no roll. */
@Serializable
enum class EffectTrigger(val ptName: String) {
    ALWAYS("Sempre"), ANY_SUCCESS("Sucesso ou crítico"), SUCCESS("Sucesso"), CRITICAL_SUCCESS("Sucesso crítico"),
    ANY_FAILURE("Falha ou falha crítica"), FAILURE("Falha"), CRITICAL_FAILURE("Falha crítica");

    /** True/false once the degree is known, null while no target DC was chosen (the effect is conditional). */
    fun matches(degree: Degree?): Boolean? {
        if (this == ALWAYS) return true
        degree ?: return null
        return when (this) {
            ALWAYS -> true
            ANY_SUCCESS -> degree == Degree.SUCCESS || degree == Degree.CRITICAL_SUCCESS
            SUCCESS -> degree == Degree.SUCCESS
            CRITICAL_SUCCESS -> degree == Degree.CRITICAL_SUCCESS
            ANY_FAILURE -> degree == Degree.FAILURE || degree == Degree.CRITICAL_FAILURE
            FAILURE -> degree == Degree.FAILURE
            CRITICAL_FAILURE -> degree == Degree.CRITICAL_FAILURE
        }
    }
}

/** A condition a potion, bomb or skill imposes or removes, on the enemy or on yourself. */
@Serializable
data class ConditionEffect(
    val condition: ConditionKind,
    val value: Int = 1,
    val target: EffectTarget = EffectTarget.ENEMY,
    val action: EffectAction = EffectAction.IMPOSE,
    val trigger: EffectTrigger = EffectTrigger.ANY_SUCCESS,
    /** Duration in rounds when applied to yourself (null = until removed). */
    val rounds: Int? = null,
    val note: String? = null,
) {
    fun describe(): String {
        val who = if (target == EffectTarget.SELF) "em mim" else "no inimigo"
        // Removing takes the whole condition away, so only imposing shows the value.
        val what = if (action == EffectAction.REMOVE) condition.ptName else condition.label(value)
        val base = "${action.ptName} $what $who"
        return if (note.isNullOrBlank()) base else "$base ($note)"
    }
}
