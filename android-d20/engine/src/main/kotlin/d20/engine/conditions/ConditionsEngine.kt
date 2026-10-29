package d20.engine.conditions

import d20.engine.core.Degree
import d20.engine.core.Roller
import d20.engine.pf2e.Pf2eCharacter
import d20.engine.play.degreeName

enum class TurnPhase { START, END, STAGE }

/** A change a turn proposal wants to make. Nothing is applied until the user confirms the item. */
sealed interface ProposalEffect {
    data class Hp(val delta: Int) : ProposalEffect
    /** value <= 0 removes it. */
    data class SetCondition(val kind: ConditionKind, val value: Int, val rounds: Int? = null, val source: String? = null) : ProposalEffect
    data class RemoveSource(val source: String) : ProposalEffect
    data class RemovePersistent(val id: String) : ProposalEffect
    /** stage <= 0 ends the affliction. */
    data class SetAffliction(val id: String, val stage: Int, val roundsLeft: Int?, val maxRoundsLeft: Int?) : ProposalEffect
    data class DecrementCondition(val kind: ConditionKind) : ProposalEffect
    /** Counts down every condition that has a duration in rounds (those imposed by an affliction follow its stage). */
    data object TickRounds : ProposalEffect
}

data class ProposalItem(val id: String, val title: String, val detail: String, val roll: String?, val effects: List<ProposalEffect>)

data class TurnProposal(val phase: TurnPhase, val items: List<ProposalItem>)

data class ApplyResult(val state: PlayState, val messages: List<String>)

/**
 * Rolls everything a turn needs automatically (recovery checks, persistent damage, flat checks, poison saves) and
 * returns it as a proposal the user confirms item by item. Own character only; time advances at the start and end of
 * your own turn.
 */
class ConditionsEngine(private val roller: Roller) {

    fun startTurn(state: PlayState, c: Pf2eCharacter): TurnProposal {
        val items = mutableListOf<ProposalItem>()
        val dying = state.valueOf(ConditionKind.DYING)
        if (dying > 0) items += recovery(state, dying)

        val cannotAct = listOf(ConditionKind.UNCONSCIOUS, ConditionKind.PARALYZED, ConditionKind.PETRIFIED).filter { state.valueOf(it) > 0 }
        val stunned = state.valueOf(ConditionKind.STUNNED)
        val slowed = state.valueOf(ConditionKind.SLOWED)
        if (cannotAct.isNotEmpty()) {
            items += ProposalItem("cannot-act", "Você não pode agir", cannotAct.joinToString(", ") { it.ptName }, null, emptyList())
        } else if (stunned > 0) {
            val lost = minOf(stunned, 3)
            val left = 3 - lost
            items += ProposalItem(
                "stunned", "Atordoado $stunned",
                "Você perde $lost ações neste turno e o valor cai para ${stunned - lost}. Restam $left ações.",
                null, listOf(ProposalEffect.SetCondition(ConditionKind.STUNNED, stunned - lost)),
            )
        } else if (slowed > 0) {
            items += ProposalItem("slowed", "Lento $slowed", "Você perde $slowed ações neste turno. Restam ${(3 - slowed).coerceAtLeast(0)}.", null, emptyList())
        }
        return TurnProposal(TurnPhase.START, items)
    }

    fun endTurn(state: PlayState, c: Pf2eCharacter): TurnProposal {
        val items = mutableListOf<ProposalItem>()

        for (p in state.persistent) {
            val dice = if (p.spec.die != null) List(p.spec.diceCount) { roller.roll(p.spec.die.sides) } else emptyList()
            val damage = dice.sum() + p.spec.flat
            val label = "${p.spec.notation} de ${p.spec.type.ptName}"
            items += ProposalItem(
                "persist-${p.id}-dmg", "Dano persistente: $label",
                "Você sofre $damage de dano" + if (dice.isNotEmpty()) " (dados $dice)" else "", null,
                listOf(ProposalEffect.Hp(-damage)),
            )
            val dc = if (p.assisted) 10 else 15
            val nat = roller.roll(20)
            val degree = Degree.of(nat, nat, dc)
            val ends = degree == Degree.SUCCESS || degree == Degree.CRITICAL_SUCCESS
            items += ProposalItem(
                "persist-${p.id}-end", "Teste simples CD $dc ($label)",
                if (ends) "O dano persistente termina." else "O dano persistente continua.",
                "d20 $nat → ${degreeName(degree)}",
                if (ends) listOf(ProposalEffect.RemovePersistent(p.id)) else emptyList(),
            )
        }

        for (a in state.afflictions) items += afflictionTick(state, c, a)

        if (state.valueOf(ConditionKind.FRIGHTENED) > 0) {
            val v = state.valueOf(ConditionKind.FRIGHTENED)
            items += ProposalItem("frightened", "Apavorado $v", "O valor cai de $v para ${v - 1} no fim do seu turno.", null,
                listOf(ProposalEffect.DecrementCondition(ConditionKind.FRIGHTENED)))
        }

        val timed = state.conditions.filter { it.roundsLeft != null && it.source == null }
        if (timed.isNotEmpty()) {
            val detail = timed.joinToString("; ") {
                val left = it.roundsLeft!! - 1
                if (left <= 0) "${it.kind.label(it.value)} termina" else "${it.kind.label(it.value)}: $left rodadas restantes"
            }
            items += ProposalItem("durations", "Durações", detail, null, listOf(ProposalEffect.TickRounds))
        }
        return TurnProposal(TurnPhase.END, items)
    }

    /** Ends an affliction's current stage on demand (stages measured in minutes, hours or days). */
    fun endAfflictionStage(state: PlayState, c: Pf2eCharacter, afflictionId: String): TurnProposal {
        val a = state.afflictions.first { it.id == afflictionId }
        return TurnProposal(TurnPhase.STAGE, stageEnd(state, c, a, a.maxRoundsLeft))
    }

    private fun recovery(state: PlayState, dying: Int): ProposalItem {
        val dc = 10 + dying
        val nat = roller.roll(20)
        val degree = Degree.of(nat, nat, dc)
        val delta = when (degree) {
            Degree.CRITICAL_SUCCESS -> -2
            Degree.SUCCESS -> -1
            Degree.FAILURE -> 1
            Degree.CRITICAL_FAILURE -> 2
        }
        val newValue = dying + delta
        val effects = mutableListOf<ProposalEffect>(ProposalEffect.SetCondition(ConditionKind.DYING, newValue.coerceAtLeast(0)))
        val detail = if (newValue <= 0) {
            effects += ProposalEffect.SetCondition(ConditionKind.WOUNDED, state.valueOf(ConditionKind.WOUNDED) + 1)
            "Você deixa de estar morrendo (continua inconsciente com 0 PV) e fica Ferido ${state.valueOf(ConditionKind.WOUNDED) + 1}."
        } else "Morrendo $dying → $newValue."
        return ProposalItem("dying", "Teste de recuperação", detail, "d20 $nat vs CD $dc → ${degreeName(degree)}", effects)
    }

    private fun afflictionTick(state: PlayState, c: Pf2eCharacter, a: AfflictionState): List<ProposalItem> {
        val newLeft = a.roundsLeft?.minus(1)
        val newMax = a.maxRoundsLeft?.minus(1)
        val name = a.affliction.name
        return when {
            newMax != null && newMax <= 0 -> listOf(
                ProposalItem("aff-${a.id}-end", "$name: duração máxima termina", "O efeito acaba sem novo teste.", null,
                    listOf(ProposalEffect.SetAffliction(a.id, 0, null, null), ProposalEffect.RemoveSource(a.id))),
            )
            newLeft != null && newLeft <= 0 -> stageEnd(state, c, a, newMax)
            newLeft != null || newMax != null -> listOf(
                ProposalItem("aff-${a.id}-tick", "$name: estágio ${a.stage}", "Contagem: ${newLeft ?: "—"} rodadas até o próximo teste.", null,
                    listOf(ProposalEffect.SetAffliction(a.id, a.stage, newLeft, newMax))),
            )
            else -> emptyList()
        }
    }

    private fun stageEnd(state: PlayState, c: Pf2eCharacter, a: AfflictionState, newMax: Int?): List<ProposalItem> {
        val aff = a.affliction
        val ability = aff.save.defaultAbility
        val nat = roller.roll(20)
        val mod = c.mod(ability) + c.saveRank(aff.save).bonus(c.level) + StatusPenalties.total(state.conditions, ability)
        val total = nat + mod
        val degree = Degree.of(total, nat, aff.dc)
        val delta = when (degree) {
            Degree.CRITICAL_SUCCESS -> -2
            Degree.SUCCESS -> -1
            Degree.FAILURE -> 1
            Degree.CRITICAL_FAILURE -> 2
        }
        val roll = "d20 $nat ${if (mod >= 0) "+" else ""}$mod = $total vs CD ${aff.dc} → ${degreeName(degree)}"
        val newStage = a.stage + delta
        if (newStage <= 0) {
            return listOf(
                ProposalItem("aff-${a.id}-save", "${aff.name}: teste de ${aff.save.ptName}", "Você se recupera (estágio 0).", roll,
                    listOf(ProposalEffect.SetAffliction(a.id, 0, null, null), ProposalEffect.RemoveSource(a.id))),
            )
        }
        val stage = newStage.coerceAtMost(aff.stages.size)
        val def = aff.stages[stage - 1]
        val rounds = def.duration.takeIf { it.unit == DurationUnit.ROUNDS }?.value
        val effects = mutableListOf<ProposalEffect>(ProposalEffect.SetAffliction(a.id, stage, rounds, newMax), ProposalEffect.RemoveSource(a.id))
        for (cnd in def.conditions) effects += ProposalEffect.SetCondition(cnd.kind, cnd.value, rounds, a.id)
        val items = mutableListOf(
            ProposalItem(
                "aff-${a.id}-save", "${aff.name}: teste de ${aff.save.ptName}",
                "Estágio ${a.stage} → $stage" + if (def.conditions.isNotEmpty()) ". Condições: " + def.conditions.joinToString(", ") { it.kind.label(it.value) } else "",
                roll, effects,
            ),
        )
        def.damage?.let { d ->
            val dice = if (d.die != null) List(d.diceCount) { roller.roll(d.die.sides) } else emptyList()
            val damage = dice.sum() + d.flat
            items += ProposalItem("aff-${a.id}-dmg", "${aff.name}: dano do estágio $stage", "Você sofre $damage de ${d.type.ptName} (${d.notation}).", null, listOf(ProposalEffect.Hp(-damage)))
        }
        return items
    }

    companion object {
        /** Applies the confirmed items. Reaching 0 Hit Points makes you dying; dying 4 (less with doomed) means death. */
        fun apply(state: PlayState, maxHp: Int, proposal: TurnProposal, selected: Set<String>): ApplyResult {
            var s = state
            val messages = mutableListOf<String>()
            for (item in proposal.items) {
                if (item.id !in selected) continue
                for (e in item.effects) {
                    s = when (e) {
                        is ProposalEffect.Hp -> PlayRules.changeHp(s, e.delta, maxHp).let { (ns, msg) -> msg?.let(messages::add); ns }
                        is ProposalEffect.SetCondition -> PlayRules.setCondition(s, e.kind, e.value, e.rounds, e.source)
                        is ProposalEffect.RemoveSource -> s.copy(conditions = s.conditions.filterNot { it.source == e.source })
                        is ProposalEffect.RemovePersistent -> s.copy(persistent = s.persistent.filterNot { it.id == e.id })
                        is ProposalEffect.SetAffliction ->
                            if (e.stage <= 0) s.copy(afflictions = s.afflictions.filterNot { it.id == e.id })
                            else s.copy(afflictions = s.afflictions.map { if (it.id == e.id) it.copy(stage = e.stage, roundsLeft = e.roundsLeft, maxRoundsLeft = e.maxRoundsLeft) else it })
                        is ProposalEffect.DecrementCondition -> s.copy(
                            conditions = s.conditions.mapNotNull { if (it.kind == e.kind) (if (it.value - 1 <= 0) null else it.copy(value = it.value - 1)) else it },
                        )
                        ProposalEffect.TickRounds -> s.copy(
                            conditions = s.conditions.mapNotNull {
                                if (it.roundsLeft != null && it.source == null) (if (it.roundsLeft - 1 <= 0) null else it.copy(roundsLeft = it.roundsLeft - 1)) else it
                            },
                        )
                    }
                }
            }
            val dying = s.valueOf(ConditionKind.DYING)
            if (dying > 0 && dying >= 4 - s.valueOf(ConditionKind.DOOMED)) messages += "Você morre (Morrendo $dying)."
            return ApplyResult(s, messages)
        }
    }
}
