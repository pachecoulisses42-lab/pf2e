package d20.engine.play

import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.EffectAction
import d20.engine.conditions.EffectTarget
import d20.engine.conditions.EffectTrigger
import d20.engine.conditions.PersistentSpec
import d20.engine.core.Degree
import d20.engine.pf2e.AttackResult
import d20.engine.pf2e.BombResult
import d20.engine.pf2e.CheckResult
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.DamagePart
import d20.engine.pf2e.DamageRoll
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSaveResult
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.Dashboard
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station

/** Visual tone of a result (guide §6.1): green success, red failure, gold critical. */
enum class Tone { SUCCESS, FAILURE, CRITICAL, NEUTRAL }

/** Play-mode inputs chosen by selection only: multiple attack step and the target's AC / DC (optional). */
data class PlayContext(
    val map: MapStep = MapStep.FIRST,
    val targetDc: Int? = null,
    /** Your active conditions: their status penalties apply to the roll. */
    val conditions: List<d20.engine.conditions.ActiveCondition> = emptyList(),
)

/** What to apply when no target AC was set: a normal hit, a critical (x2 plus trait dice) or a x3 effect. */
enum class DamageChoice { NORMAL, CRITICAL, TRIPLE }

/** One line per damage type, kept typed so the UI can colour each element. */
data class DamageLine(val type: DamageType, val text: String)

data class DamageSummary(
    val normalLines: List<DamageLine>,
    val criticalLines: List<DamageLine>,
    val tripleLines: List<DamageLine>,
    val normal: Int,
    val criticalTotal: Int,
    val tripleTotal: Int,
    /** Null while the outcome is unknown (no target AC chosen yet) or awaiting a target's save. */
    val choice: DamageChoice?,
    /** Save spells: the damage after the target's save, overriding [choice]. */
    val overrideApplied: Int? = null,
    /** Extra damage left out by the stacking rule, shown so the user knows why it is missing. */
    val notes: List<String> = emptyList(),
) {
    val lines: List<DamageLine>
        get() = when (choice) {
            DamageChoice.CRITICAL -> criticalLines
            DamageChoice.TRIPLE -> tripleLines
            else -> normalLines
        }

    val applied: Int?
        get() = overrideApplied ?: when (choice) {
            null -> null
            DamageChoice.NORMAL -> normal
            DamageChoice.CRITICAL -> criticalTotal
            DamageChoice.TRIPLE -> tripleTotal
        }

    val critical: Boolean? get() = choice?.let { it == DamageChoice.CRITICAL }
}

/**
 * Something the user must remember or apply after a roll: a condition imposed on the enemy, one applied to
 * themselves (applicable via the conditions module), or plain information. [active] is null while the degree of
 * success is unknown (no target chosen), meaning "applies if the trigger happens".
 */
data class Notice(val text: String, val effect: ConditionEffect?, val active: Boolean?)

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
    /** Hit Points regained (healing potions); applied by the user. */
    val heal: Int? = null,
    val notices: List<Notice> = emptyList(),
) {
    fun resolveTargetSave(target: Degree): RollOutcome {
        val save = checkNotNull(pendingSave) { "Nenhuma magia de resistência pendente" }
        val dmg = checkNotNull(damage)
        return copy(
            targetDegree = target,
            damage = dmg.copy(overrideApplied = save.damageFor(target)),
            subtitle = "Alvo: ${degreeName(target)}",
        )
    }

    /** After a roll without a target: pick normal, critical or x3. */
    fun chooseDamage(choice: DamageChoice): RollOutcome = copy(damage = damage?.copy(choice = choice))
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
            station.weapon.name, "Ataque • ${ctx.map.ptName}", engine.weaponAttack(d.character, station.weapon, ctx.map, ctx.targetDc, ctx.conditions),
        )
        is SpellStation -> when (station.spell.mode) {
            SpellMode.ATTACK -> attack(
                station.spell.name, "Ataque mágico", engine.spellAttack(d.character, station.spell, ctx.targetDc, ctx.conditions),
            )
            SpellMode.SAVE -> spellSave(station, d, ctx)
        }
        is SkillStation -> check(
            station.title, if (station.check.kind.isSave) "Resistência" else "Teste",
            engine.check(d.character, station.check, ctx.targetDc, ctx.conditions),
        ).let { it.copy(notices = effectNotices(station.effects, it.degree)) }
        is ConsumableStation -> consumable(station, d, ctx)
        is ResourceStation -> throw IllegalArgumentException("Estações de recurso não rolam dados")
        is ConditionsStation -> throw IllegalArgumentException("O módulo de condições não rola dados")
    }

    private fun attack(title: String, subtitle: String, r: AttackResult): RollOutcome = RollOutcome(
        title = title, subtitle = subtitle,
        natural = r.check.natural, total = r.check.total, breakdown = breakdown(r.check),
        dc = r.check.dc, degree = r.check.degree, tone = tone(r.check),
        damage = r.damage?.let { summary(it, r.criticalApplied?.let { crit -> if (crit) DamageChoice.CRITICAL else DamageChoice.NORMAL }) },
    )

    private fun check(title: String, subtitle: String, r: CheckResult): RollOutcome = RollOutcome(
        title = title, subtitle = subtitle,
        natural = r.natural, total = r.total, breakdown = breakdown(r),
        dc = r.dc, degree = r.degree, tone = tone(r), damage = null,
    )

    private fun spellSave(s: SpellStation, d: Dashboard, ctx: PlayContext): RollOutcome {
        val r = engine.spellSave(d.character, s.spell, ctx.conditions)
        return RollOutcome(
            title = s.spell.name, subtitle = "CD de ${r.targetSave.ptName}: toque o resultado do alvo",
            natural = null, total = null, breakdown = emptyList(),
            dc = r.dc, degree = null, tone = Tone.NEUTRAL,
            damage = summary(r.damage, choice = null), pendingSave = r,
        )
    }

    private fun consumable(st: ConsumableStation, d: Dashboard, ctx: PlayContext): RollOutcome {
        val spec = st.consumable
        if (!spec.kind.isBomb) {
            val heal = if (spec.kind == ConsumableKind.HEALING_POTION) engine.rollHealing(spec.grade) else null
            return RollOutcome(
                title = st.title, subtitle = spec.kind.ptName + " · " + spec.grade.ptName,
                natural = null, total = null, breakdown = emptyList(), dc = null, degree = null, tone = Tone.NEUTRAL,
                damage = null, heal = heal, notices = effectNotices(spec.effects, null),
            )
        }
        val r = engine.bombAttack(d.character, spec, ctx.targetDc, ctx.conditions)
        val stats = ConsumableTables.bomb(spec.kind, spec.grade)
        val degree = r.check.degree
        val choice = when (degree) {
            Degree.CRITICAL_SUCCESS -> DamageChoice.CRITICAL
            Degree.SUCCESS, Degree.FAILURE -> DamageChoice.NORMAL
            else -> null
        }
        val built = mutableListOf<Notice>()
        r.persistent?.let { built += persistentNotice(it, degree) }
        when (spec.kind) {
            ConsumableKind.BOTTLED_LIGHTNING -> built += effectNotices(
                listOf(ConditionEffect(ConditionKind.OFF_GUARD, 1, EffectTarget.ENEMY, EffectAction.IMPOSE, EffectTrigger.ANY_SUCCESS, note = "até o início do seu próximo turno")), degree,
            )
            ConsumableKind.FROST_VIAL -> built += Notice(
                "Alvo: −${stats.speedPenaltyFeet} pés de deslocamento até o fim do próximo turno dele", null,
                EffectTrigger.ANY_SUCCESS.matches(degree),
            )
            ConsumableKind.BLASTING_STONE -> built += Notice(
                "Criaturas a 3 m: Fortitude CD ${stats.deafenDc} ou Surdo até o fim do próximo turno",
                null, if (degree == null) null else degree != Degree.CRITICAL_FAILURE,
            )
            else -> Unit
        }
        built += effectNotices(spec.effects, degree)
        return RollOutcome(
            title = st.title, subtitle = "Bomba · ${spec.grade.ptName}",
            natural = r.check.natural, total = r.check.total, breakdown = breakdown(r.check),
            dc = r.check.dc, degree = degree, tone = tone(r.check),
            damage = r.damage?.let { summary(it, choice) }, notices = built,
        )
    }

    private fun persistentNotice(p: PersistentSpec, degree: Degree?): Notice {
        val shown = if (degree == Degree.CRITICAL_SUCCESS) p.doubled() else p
        val extra = if (degree == null) " (dobra no crítico)" else ""
        val text = "Inimigo: ${shown.notation} de dano persistente de ${shown.type.ptName}$extra"
        return Notice(text, null, EffectTrigger.ANY_SUCCESS.matches(degree))
    }

    private fun effectNotices(effects: List<ConditionEffect>, degree: Degree?): List<Notice> =
        effects.map { Notice(it.describe(), it, it.trigger.matches(degree)) }

    private fun tone(r: CheckResult): Tone = when (r.degree) {
        Degree.CRITICAL_SUCCESS -> Tone.CRITICAL
        Degree.SUCCESS -> Tone.SUCCESS
        Degree.FAILURE, Degree.CRITICAL_FAILURE -> Tone.FAILURE
        null -> when (r.natural) { 20 -> Tone.CRITICAL; 1 -> Tone.FAILURE; else -> Tone.NEUTRAL }
    }

    private fun breakdown(r: CheckResult): List<String> =
        listOf("d20 ${r.natural}") + r.modifiers.applied.map { "${it.label} ${signed(it.value)}" }

    private fun summary(roll: DamageRoll, choice: DamageChoice?): DamageSummary {
        val tail = listOfNotNull(roll.splashPart?.let { DamageLine(it.type, "${it.type.ptName}: Respingo ${it.subtotal} (não multiplica)") }) +
            roll.postParts.map { DamageLine(it.type, "${it.type.ptName}: ${it.label} ${it.subtotal} (após multiplicar)") }
        return DamageSummary(
            normalLines = roll.parts.mapIndexed { i, p -> normalLine(p, i > 0) } + tail,
            criticalLines = criticalLines(roll) + tail,
            tripleLines = roll.parts.mapIndexed { i, p -> DamageLine(p.type, "${p.type.ptName}: ${tag(p, i > 0)}×3 de ${p.subtotal} = ${p.subtotal * 3}") } + tail,
            normal = roll.total, criticalTotal = roll.criticalTotal, tripleTotal = roll.tripleTotal, choice = choice,
            notes = roll.ignored.map { "$it não acumula com outro do mesmo tipo" },
        )
    }

    /** Extra parts (runes, extra damage) name their source; the first part is the weapon or spell itself. */
    private fun tag(p: DamagePart, extra: Boolean) = if (extra) "${p.label} " else ""

    private fun normalLine(p: DamagePart, extra: Boolean): DamageLine {
        if (p.dice.isEmpty()) return DamageLine(p.type, "${p.type.ptName}: ${tag(p, extra)}${signed(p.flat)}")
        val flat = if (p.flat != 0) " ${signed(p.flat)}" else ""
        return DamageLine(p.type, "${p.type.ptName}: ${tag(p, extra)}${p.dice}$flat = ${p.subtotal}")
    }

    private fun criticalLines(roll: DamageRoll): List<DamageLine> {
        val lines = mutableListOf<DamageLine>()
        roll.parts.forEachIndexed { i, p ->
            val src = if (i == 0) roll.fatalPart ?: p else p
            val flat = if (src.flat != 0) " ${signed(src.flat)}" else ""
            val mult = if (i == 0 && roll.fatalPart != null) "Fatal ${src.diceNotation}" else "×2"
            val dice = if (src.dice.isEmpty()) "" else " ${src.dice}"
            lines += DamageLine(p.type, "${p.type.ptName}: ${tag(p, i > 0)}$mult$dice$flat → ${src.subtotal * 2}")
        }
        roll.deadlyPart?.let {
            lines += DamageLine(it.type, "${it.type.ptName}: Mortal ${it.dice} = ${it.dice.sum()} (não dobra)")
        }
        return lines
    }

    private fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

    companion object {
        fun armorClass(
            d: Dashboard, r: ResourceStation, shieldRaised: Boolean = false,
            conditions: List<d20.engine.conditions.ActiveCondition> = emptyList(),
        ): Int = r.armor.armorClass(d.character, r.shield, shieldRaised, conditions)
    }
}
