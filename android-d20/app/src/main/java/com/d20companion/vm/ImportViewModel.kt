package com.d20companion.vm

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.d20companion.AppContainer
import com.d20companion.data.CharacterRepository
import com.d20companion.data.ImportReader
import com.d20companion.data.Prefs
import d20.engine.pathbuilder.ImportGroup
import d20.engine.pathbuilder.ImportResult
import d20.engine.pathbuilder.PathbuilderImport
import d20.engine.pathbuilder.PathbuilderParser
import d20.engine.pathbuilder.PathbuilderText
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class ImportState(
    val loading: Boolean = false,
    val result: ImportResult? = null,
    val keep: Set<ImportGroup> = ImportGroup.entries.toSet(),
    val error: String? = null,
)

/** Pathbuilder import: read the file, map it in the engine, let the user pick groups, then save. */
class ImportViewModel(
    private val reader: ImportReader,
    private val repo: CharacterRepository,
    private val prefs: Prefs,
) : ViewModel() {
    private val _state = MutableStateFlow(ImportState())
    val state: StateFlow<ImportState> = _state.asStateFlow()

    fun load(uri: Uri) = run { reader.readText(uri) }

    fun loadText(text: String) = run { text }

    private fun run(source: suspend () -> String) {
        _state.update { ImportState(loading = true) }
        viewModelScope.launch {
            val result = runCatching {
                val build = PathbuilderParser.parse(PathbuilderText.extractJson(source()))
                PathbuilderImport.build(build, UUID.randomUUID().toString())
            }
            _state.update {
                result.fold(
                    onSuccess = { r -> ImportState(result = r) },
                    onFailure = { e -> ImportState(error = e.message ?: "Não foi possível ler o arquivo") },
                )
            }
        }
    }

    fun toggle(group: ImportGroup) = _state.update { s -> s.copy(keep = if (group in s.keep) s.keep - group else s.keep + group) }

    fun confirm(onCreated: (String) -> Unit) {
        val s = _state.value
        val r = s.result ?: return
        _state.update { it.copy(loading = true) }
        viewModelScope.launch {
            val id = repo.createFrom(PathbuilderImport.select(r, s.keep))
            prefs.lastCharacterId = id
            onCreated(id)
        }
    }

    companion object {
        fun factory(container: AppContainer) = viewModelFactory {
            initializer { ImportViewModel(container.importReader, container.repository, container.prefs) }
        }
    }
}
