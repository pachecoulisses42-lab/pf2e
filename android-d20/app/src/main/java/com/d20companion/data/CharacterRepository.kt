package com.d20companion.data

import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardJson
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.ResourceStation
import d20.engine.schema.Text
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

data class CharacterSummary(val id: String, val name: String, val characterClass: PfClass)

data class LoadedCharacter(val dashboard: Dashboard, val currentHp: Int)

class CharacterRepository(private val dao: CharacterDao) {

    val summaries: Flow<List<CharacterSummary>> = dao.observeAll().map { rows ->
        rows.map { CharacterSummary(it.id, it.name, PfClass.valueOf(it.characterClass)) }
    }

    /** Creates a character from the class preset (or a blank panel for classes without one). */
    suspend fun create(name: String, cls: PfClass): String {
        val id = UUID.randomUUID().toString()
        val dashboard = Presets.forClass(cls, id, Text.sanitize(name))
        save(dashboard, maxHp(dashboard))
        return id
    }

    suspend fun load(id: String): LoadedCharacter? {
        val row = dao.find(id) ?: return null
        val dashboard = DashboardJson.decode(row.dashboardJson).getOrThrow()
        return LoadedCharacter(dashboard, row.currentHp)
    }

    suspend fun save(dashboard: Dashboard, currentHp: Int) {
        dao.upsert(
            CharacterEntity(
                id = dashboard.characterId,
                name = dashboard.name,
                characterClass = dashboard.characterClass.name,
                dashboardJson = DashboardJson.encode(dashboard),
                currentHp = currentHp,
                updatedAt = System.currentTimeMillis(),
            ),
        )
    }

    suspend fun duplicate(id: String): String? {
        val loaded = load(id) ?: return null
        val newId = UUID.randomUUID().toString()
        val copy = loaded.dashboard.copy(
            characterId = newId,
            name = Text.sanitize("${loaded.dashboard.name} (cópia)"),
        )
        save(copy, loaded.currentHp)
        return newId
    }

    suspend fun delete(id: String) = dao.delete(id)

    suspend fun exportJson(id: String): Pair<String, String>? {
        val row = dao.find(id) ?: return null
        val dashboard = DashboardJson.decode(row.dashboardJson).getOrThrow()
        return dashboard.name to DashboardJson.encode(dashboard)
    }

    companion object {
        /** Single HP pool: the first resource station's maximum. */
        fun maxHp(d: Dashboard): Int =
            d.zones.all().flatMap { it.second.stations }.filterIsInstance<ResourceStation>().firstOrNull()?.maxHp ?: 0
    }
}
