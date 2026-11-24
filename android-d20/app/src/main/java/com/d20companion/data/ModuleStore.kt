package com.d20companion.data

import d20.engine.schema.SavedModules
import d20.engine.schema.Station
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** The user's own module library ("Meus módulos"), shared by every character and kept in [Prefs]. */
class ModuleStore(private val prefs: Prefs) {
    private val _modules = MutableStateFlow(SavedModules.decode(prefs.savedModules))
    val modules: StateFlow<List<Station>> = _modules.asStateFlow()

    fun save(station: Station) = write(SavedModules.add(_modules.value, station))

    fun delete(id: String) = write(SavedModules.remove(_modules.value, id))

    private fun write(list: List<Station>) {
        _modules.value = list
        prefs.savedModules = SavedModules.encode(list)
    }
}
