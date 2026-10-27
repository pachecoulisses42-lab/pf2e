package com.d20companion.vm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.d20companion.AppContainer
import com.d20companion.data.CharacterRepository
import d20.engine.core.Degree
import d20.engine.core.RandomRoller
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.play.PlayContext
import d20.engine.play.PlayRunner
import d20.engine.play.RollOutcome
import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardValidator
import d20.engine.schema.ResourceStation
import d20.engine.schema.Station
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
    val currentHp: Int = 0,
    val context: PlayContext = PlayContext(),
    val outcome: RollOutcome? = null,
    /** Validation errors blocking "Salvar & Travar". */
    val errors: List<String> = emptyList(),
    val message: String? = null,
)

/**
 * Unidirectional state for one character sheet (guide §1.2): Setup edits an in-memory draft; "Salvar & Travar"
 * validates, persists and switches to Play, where the panel is frozen and only rolls / HP change.
 */
class SheetViewModel(
    private val id: String,
    private val repo: CharacterRepository,
    private val runner: PlayRunner,
) : ViewModel() {

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
                    it.copy(
                        loading = false, dashboard = loaded.dashboard, currentHp = loaded.currentHp,
                        mode = if (empty) Mode.SETUP else Mode.PLAY,
                    )
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
        val hp = s.currentHp.coerceIn(0, CharacterRepository.maxHp(d))
        viewModelScope.launch {
            repo.save(d, hp)
            _state.update { it.copy(mode = Mode.PLAY, currentHp = hp, errors = emptyList(), outcome = null) }
        }
    }

    fun unlock() {
        _state.update { it.copy(mode = Mode.SETUP, outcome = null) }
    }

    // ---- Play mode --------------------------------------------------------------------------------------------

    fun setMap(step: MapStep) = _state.update { it.copy(context = it.context.copy(map = step)) }

    fun setTarget(dc: Int?) = _state.update { it.copy(context = it.context.copy(targetDc = dc)) }

    fun roll(station: Station) {
        val s = _state.value
        val d = s.dashboard ?: return
        if (s.mode != Mode.PLAY || station is ResourceStation) return
        val outcome = runner.run(d, station, s.context) // side effect (RNG) kept outside the state update
        _state.update { it.copy(outcome = outcome) }
    }

    fun resolveTargetSave(degree: Degree) = _state.update { s ->
        s.copy(outcome = s.outcome?.takeIf { it.pendingSave != null }?.resolveTargetSave(degree) ?: s.outcome)
    }

    fun dismissOutcome() = _state.update { it.copy(outcome = null) }

    fun adjustHp(delta: Int) {
        val s = _state.value
        val d = s.dashboard ?: return
        val hp = (s.currentHp + delta).coerceIn(0, CharacterRepository.maxHp(d))
        _state.update { it.copy(currentHp = hp) }
        viewModelScope.launch { repo.save(d, hp) }
    }

    fun consumeMessage() = _state.update { it.copy(message = null) }

    companion object {
        fun factory(id: String, container: AppContainer) = viewModelFactory {
            initializer {
                SheetViewModel(id, container.repository, PlayRunner(Pf2eEngine(RandomRoller())))
            }
        }
    }
}
