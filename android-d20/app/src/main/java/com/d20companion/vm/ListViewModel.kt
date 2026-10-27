package com.d20companion.vm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.d20companion.AppContainer
import com.d20companion.data.CharacterRepository
import com.d20companion.data.CharacterSummary
import d20.engine.schema.PfClass
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class ListViewModel(private val repo: CharacterRepository) : ViewModel() {
    val characters: StateFlow<List<CharacterSummary>> =
        repo.summaries.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun create(name: String, cls: PfClass, onCreated: (String) -> Unit) {
        viewModelScope.launch { onCreated(repo.create(name, cls)) }
    }

    fun duplicate(id: String) {
        viewModelScope.launch { repo.duplicate(id) }
    }

    fun delete(id: String) {
        viewModelScope.launch { repo.delete(id) }
    }

    /** Returns (character name, JSON text) ready to be written to a user-chosen file. */
    suspend fun export(id: String): Pair<String, String>? = repo.exportJson(id)

    companion object {
        fun factory(container: AppContainer) = viewModelFactory {
            initializer { ListViewModel(container.repository) }
        }
    }
}
