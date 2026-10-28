package com.d20companion.vm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.d20companion.AppContainer
import com.d20companion.data.CharacterRepository
import d20.engine.conditions.Affliction
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.ConditionsEngine
import d20.engine.conditions.EffectAction
import d20.engine.conditions.EffectTarget
import d20.engine.conditions.PersistentSpec
import d20.engine.conditions.PlayRules
import d20.engine.conditions.PlayState
import d20.engine.conditions.TurnProposal
import d20.engine.core.Degree
import d20.engine.core.RandomRoller
import d20.engine.core.Roller
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.play.DamageChoice
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import d20.engine.play.RollOutcome
import d20.engine.schema.CardColor
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardValidator
import d20.engine.schema.ResourceStation
import d20.engine.schema.Station
import d20.engine.schema.effectiveColor
import d20.engine.schema.maxHp
import d20.engine.schema.resourceStation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class Mode { SETUP, PLAY }

data class SheetState(
    val loading: Boolean = true,
    val dashboard: Dashboard? = null,
    val mode: Mode = Mode.PLAY,
    val play: PlayState = PlayState(hp = 0),
    val context: PlayContext = PlayContext(),
    val outcome: RollOutcome? = null,
    /** Bumped on every new roll so the overlay restarts its dice animation. */
    val rollId: Int = 0,
    val outcomeColor: CardColor = CardColor.MOSTARDA,
    val healApplied: Boolean = false,
    val appliedNotices: Set<Int> = emptySet(),
    /** Validation errors blocking "Salvar & Travar". */
    val errors: List<String> = emptyList(),
    val message: String? = null,
    val conditionsOpen: Boolean = false,
    val proposal: TurnProposal? = null,
    val selected: Set<String> = emptySet(),
    val applyMessages: List<String> = emptyList(),
    val blockOpen: Boolean = false,
)

/**
 * Unidirectional state for one character sheet (guide §1.2): Setup edits an in-memory draft; "Salvar & Travar"
 * validates, persists and switches to Play, where the panel is frozen and only rolls and play state change.
 */
class SheetViewModel(
    private val id: String,
    private val repo: CharacterRepository,
    roller: Roller = RandomRoller(),
) : ViewModel() {

    private val runner = PlayRunner(Pf2eEngine(roller))
    private val conditionsEngine = ConditionsEngine(roller)

    private val _state = MutableStateFlow(SheetState())
    val state: StateFlow<SheetState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            val loaded = runCatching { repo.load(id) }.getOrNull()
            _state.update {
                if (loaded == null) {
                    it.copy(loading = false, message = "Não foi possível abrir este personagem")
                } else {
                    val empty = loaded.dashboard.zones.all().all { z -> z.second.stations.isEmpty() }
                    it.copy(loading = false, dashboard = loaded.dashboard, play = loaded.play, mode = if (empty) Mode.SETUP else Mode.PLAY)
                }
            }
        }
    }

    // ---- Setup mode -------------------------------------------------------------------------------------------

    fun edit(change: (Dashboard) -> Dashboard) {
        _state.update { s -> s.dashboard?.let { s.copy(dashboard = change(it), errors = emptyList()) } ?: s }
    }

    fun tryEdit(change: (Dashboard) -> Result<Dashboard>) {
        _state.update { s ->
            val d = s.dashboard ?: return@update s
            change(d).fold(
                onSuccess = { s.copy(dashboard = it, errors = emptyList()) },
                onFailure = { s.copy(message = it.message) },
            )
        }
    }

    /** "Salvar & Travar": validate the schema, persist, then freeze the panel for Play. */
    fun lockAndSave() {
        val s = _state.value
        val d = s.dashboard ?: return
        val errors = DashboardValidator.validate(d)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(errors = errors) }
            return
        }
        val play = PlayRules.reconcile(d, s.play)
        _state.update { it.copy(mode = Mode.PLAY, play = play, errors = emptyList(), outcome = null) }
        persist(d, play)
    }

    fun unlock() {
        _state.update { it.copy(mode = Mode.SETUP, outcome = null, conditionsOpen = false) }
    }

    // ---- Play mode: rolling -----------------------------------------------------------------------------------

    fun setMap(step: MapStep) = _state.update { it.copy(context = it.context.copy(map = step)) }

    fun setTarget(dc: Int?) = _state.update { it.copy(context = it.context.copy(targetDc = dc)) }

    fun roll(station: Station) {
        val s = _state.value
        val d = s.dashboard ?: return
        if (s.mode != Mode.PLAY) return
        if (station is ConditionsStation) {
            openConditions()
            return
        }
        if (station is ResourceStation) return
        if (station is ConsumableStation && PlayRules.remaining(s.play, station.id, station.consumable) == 0) {
            _state.update { it.copy(message = "Sem unidades de ${station.title}") }
            return
        }
        // The RNG draw is a side effect, kept outside the state update.
        val outcome = runner.run(d, station, s.context.copy(conditions = s.play.conditions))
        val play = if (station is ConsumableStation) PlayRules.useItem(s.play, station.id) else s.play
        _state.update {
            it.copy(
                outcome = outcome, rollId = it.rollId + 1, outcomeColor = station.effectiveColor(),
                healApplied = false, appliedNotices = emptySet(), play = play,
            )
        }
        if (play !== s.play) persist(d, play)
    }

    fun chooseDamage(choice: DamageChoice) = _state.update { s -> s.copy(outcome = s.outcome?.chooseDamage(choice)) }

    fun resolveTargetSave(degree: Degree) = _state.update { s ->
        s.copy(outcome = s.outcome?.takeIf { it.pendingSave != null }?.resolveTargetSave(degree) ?: s.outcome)
    }

    fun dismissOutcome() = _state.update { it.copy(outcome = null) }

    fun applyHeal() {
        val s = _state.value
        val d = s.dashboard ?: return
        val amount = s.outcome?.heal ?: return
        if (s.healApplied) return
        val (play, msg) = PlayRules.changeHp(s.play, amount, d.maxHp())
        _state.update { it.copy(play = play, healApplied = true, message = msg) }
        persist(d, play)
    }

    /** Applies a condition effect aimed at yourself (from a potion, a skill...). */
    fun applyNotice(index: Int) {
        val s = _state.value
        val d = s.dashboard ?: return
        val e = s.outcome?.notices?.getOrNull(index)?.effect ?: return
        if (e.target != EffectTarget.SELF || index in s.appliedNotices) return
        val play = if (e.action == EffectAction.IMPOSE) PlayRules.addCondition(s.play, e.condition, e.value, e.rounds) else PlayRules.removeCondition(s.play, e.condition)
        _state.update { it.copy(play = play, appliedNotices = it.appliedNotices + index) }
        persist(d, play)
    }

    // ---- Play mode: hit points and shield ---------------------------------------------------------------------

    fun adjustHp(delta: Int) {
        val s = _state.value
        val d = s.dashboard ?: return
        val (play, msg) = PlayRules.changeHp(s.play, delta, d.maxHp())
        _state.update { it.copy(play = play, message = msg ?: it.message) }
        persist(d, play)
    }

    fun toggleShield() {
        val s = _state.value
        val d = s.dashboard ?: return
        val kind = d.resourceStation()?.shield ?: return
        val play = PlayRules.setShieldRaised(s.play, kind, !s.play.shieldRaised)
        _state.update { it.copy(play = play) }
        persist(d, play)
    }

    fun openBlock() = _state.update { it.copy(blockOpen = true) }
    fun closeBlock() = _state.update { it.copy(blockOpen = false) }

    fun confirmBlock(incomingDamage: Int) {
        val s = _state.value
        val d = s.dashboard ?: return
        val kind = d.resourceStation()?.shield ?: return
        val (play, msg) = PlayRules.applyBlock(s.play, kind, incomingDamage, d.maxHp())
        _state.update { it.copy(play = play, blockOpen = false, message = msg) }
        persist(d, play)
    }

    // ---- Conditions module ------------------------------------------------------------------------------------

    fun openConditions() = _state.update { it.copy(conditionsOpen = true) }

    fun closeConditions() = _state.update { it.copy(conditionsOpen = false, proposal = null, selected = emptySet(), applyMessages = emptyList()) }

    private fun propose(p: TurnProposal) = _state.update { it.copy(proposal = p, selected = p.items.map { i -> i.id }.toSet(), applyMessages = emptyList()) }

    fun startTurn() {
        val s = _state.value
        val d = s.dashboard ?: return
        propose(conditionsEngine.startTurn(s.play, d.character))
    }

    fun endTurn() {
        val s = _state.value
        val d = s.dashboard ?: return
        propose(conditionsEngine.endTurn(s.play, d.character))
    }

    fun endStage(afflictionId: String) {
        val s = _state.value
        val d = s.dashboard ?: return
        propose(conditionsEngine.endAfflictionStage(s.play, d.character, afflictionId))
    }

    fun toggleItem(itemId: String) = _state.update { it.copy(selected = if (itemId in it.selected) it.selected - itemId else it.selected + itemId) }

    fun discardProposal() = _state.update { it.copy(proposal = null, selected = emptySet()) }

    fun applyProposal() {
        val s = _state.value
        val d = s.dashboard ?: return
        val p = s.proposal ?: return
        val result = ConditionsEngine.apply(s.play, d.maxHp(), p, s.selected)
        _state.update { it.copy(play = result.state, proposal = null, selected = emptySet(), applyMessages = result.messages) }
        persist(d, result.state)
    }

    private fun mutatePlay(change: (PlayState) -> PlayState) {
        val s = _state.value
        val d = s.dashboard ?: return
        val play = change(s.play)
        _state.update { it.copy(play = play) }
        persist(d, play)
    }

    fun addCondition(kind: ConditionKind, value: Int, rounds: Int?) = mutatePlay { PlayRules.addCondition(it, kind, value, rounds) }
    fun removeCondition(id: String) = mutatePlay { it.copy(conditions = it.conditions.filterNot { c -> c.id == id }) }

    fun addPersistent(spec: PersistentSpec, assisted: Boolean) = mutatePlay { s ->
        val added = PlayRules.addPersistent(s, spec)
        if (assisted) added.copy(persistent = added.persistent.map { if (it.spec == spec) it.copy(assisted = true) else it }) else added
    }

    fun removePersistent(id: String) = mutatePlay { it.copy(persistent = it.persistent.filterNot { p -> p.id == id }) }
    fun toggleAssist(id: String) = mutatePlay { s -> s.copy(persistent = s.persistent.map { if (it.id == id) it.copy(assisted = !it.assisted) else it }) }
    fun addAffliction(a: Affliction, stage: Int) = mutatePlay { PlayRules.addAffliction(it, a, stage) }
    fun removeAffliction(id: String) = mutatePlay { s ->
        s.copy(afflictions = s.afflictions.filterNot { it.id == id }, conditions = s.conditions.filterNot { it.source == id })
    }

    fun consumeMessage() = _state.update { it.copy(message = null) }

    private fun persist(d: Dashboard, play: PlayState) {
        viewModelScope.launch { repo.save(d, play) }
    }

    companion object {
        fun factory(id: String, container: AppContainer) = viewModelFactory {
            initializer { SheetViewModel(id, container.repository) }
        }
    }
}
