package d20.engine.play

import d20.engine.core.Degree
import d20.engine.pf2e.AttackResult
import d20.engine.pf2e.CheckResult
import d20.engine.pf2e.DamageRoll
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSaveResult
import d20.engine.schema.ActionStation
import d20.engine.schema.Dashboard
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station

/** Visual tone of a result (guide §6.1): green success, red failure, gold critical. */
enum class Tone { SUCCESS, FAILURE, CRITICAL, NEUTRAL }

/** Play-mode inputs chosen by selection only: multiple attack step and the target's AC / DC (optional). */
data class PlayContext(val map: MapStep = MapStep.FIRST, val targetDc: Int? = null)

data class DamageSummary(
    /** One line per damage type, e.g. "Cortante: [5, 3] +6 = 14". */
    val lines: List<String>,
    val normal: Int,
    val criticalTotal: Int,
    /** The number to apply, or null while the crit/hit outcome is unknown or awaiting the target's save. */
    val applied: Int?,
    val critical: Boolean?,
)

/** UI-neutral result of one tap. The presentation layer only renders this. */
data class RollOutcome(
    val title: String,
    val subtitle: String,
    val natural: Int?,
    val total: Int?,
    val breakdown: List<String>,
    val dc: Int?,
    val degree: Degree?,
    val tone: Tone,
    val damage: DamageSummary?,
    /** Set for save-based spells until the user selects the target's degree of success. */
    val pendingSave: SpellSaveResult? = null,
    val targetDegree: Degree? = null,
) {
    fun resolveTargetSave(target: Degree): RollOutcome {
        val save = checkNotNull(pendingSave) { "Nenhuma magia de resistência pendente" }
        val dmg = checkNotNull(damage)
        return copy(
            targetDegree = target,
            damage = dmg.copy(applied = save.damageFor(target)),
            subtitle = "Alvo: ${degreeName(target)}",
        )
    }
}

fun degreeName(d: Degree): String = when (d) {
    Degree.CRITICAL_SUCCESS -> "Sucesso crítico"
    Degree.SUCCESS -> "Sucesso"
    Degree.FAILURE -> "Falha"
    Degree.CRITICAL_FAILURE -> "Falha crítica"
}

class PlayRunner(private val engine: Pf2eEngine) {

    fun run(d: Dashboard, station: Station, ctx: PlayContext): RollOutcome = when (station) {
        is ActionStation -> attack(
            station.weapon.name, "Ataque • ${ctx.map.ptName}", engine.weaponAttack(d.character, station.weapon, ctx.map, ctx.targetDc),
        )
        is SpellStation -> when (station.spell.mode) {
            SpellMode.ATTACK -> attack(
                station.spell.name, "Ataque mágico", engine.spellAttack(d.character, station.spell, ctx.targetDc),
            )
            SpellMode.SAVE -> spellSave(station, d)
        }
        is SkillStation -> check(station.title, if (station.check.kind.isSave) "Resistência" else "Teste", engine.check(d.character, station.check, ctx.targetDc))
        is ResourceStation -> throw IllegalArgumentException("Estações de recurso não rolam dados")
    }

    private fun attack(title: String, subtitle: String, r: AttackResult): RollOutcome = RollOutcome(
        title = title, subtitle = subtitle,
        natural = r.check.natural, total = r.check.total, breakdown = breakdown(r.check),
        dc = r.check.dc, degree = r.check.degree, tone = tone(r.check),
        damage = r.damage?.let { summary(it, r.damageToApply, r.criticalApplied) },
    )

    private fun check(title: String, subtitle: String, r: CheckResult): RollOutcome = RollOutcome(
        title = title, subtitle = subtitle,
        natural = r.natural, total = r.total, breakdown = breakdown(r),
        dc = r.dc, degree = r.degree, tone = tone(r), damage = null,
    )

    private fun spellSave(s: SpellStation, d: Dashboard): RollOutcome {
        val r = engine.spellSave(d.character, s.spell)
        return RollOutcome(
            title = s.spell.name, subtitle = "CD de ${r.targetSave.ptName}: toque o resultado do alvo",
            natural = null, total = null, breakdown = emptyList(),
            dc = r.dc, degree = null, tone = Tone.NEUTRAL,
            damage = summary(r.damage, applied = null, critical = null), pendingSave = r,
        )
    }

    private fun tone(r: CheckResult): Tone = when (r.degree) {
        Degree.CRITICAL_SUCCESS -> Tone.CRITICAL
        Degree.SUCCESS -> Tone.SUCCESS
        Degree.FAILURE, Degree.CRITICAL_FAILURE -> Tone.FAILURE
        null -> when (r.natural) { 20 -> Tone.CRITICAL; 1 -> Tone.FAILURE; else -> Tone.NEUTRAL }
    }

    private fun breakdown(r: CheckResult): List<String> =
        listOf("d20 ${r.natural}") + r.modifiers.applied.map { "${it.label} ${signed(it.value)}" }

    private fun summary(roll: DamageRoll, applied: Int?, critical: Boolean?) = DamageSummary(
        lines = roll.parts.map { p ->
            val flat = if (p.flat != 0) " ${signed(p.flat)}" else ""
            "${p.type.ptName}: ${p.dice}$flat = ${p.subtotal}"
        },
        normal = roll.total, criticalTotal = roll.criticalTotal, applied = applied, critical = critical,
    )

    private fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

    companion object {
        fun armorClass(d: Dashboard, r: ResourceStation): Int = r.armor.armorClass(d.character)
    }
}
