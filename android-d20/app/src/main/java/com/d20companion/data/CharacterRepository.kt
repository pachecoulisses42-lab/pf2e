package com.d20companion.data

import d20.engine.conditions.PlayRules
import d20.engine.conditions.PlayState
import d20.engine.conditions.PlayStateJson
import d20.engine.play.PlayRunner
import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardJson
import d20.engine.schema.PfClass
import d20.engine.schema.Presets
import d20.engine.schema.Text
import d20.engine.schema.maxHp
import d20.engine.schema.resourceStation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

data class CharacterSummary(
    val id: String,
    val name: String,
    val characterClass: PfClass,
    val level: Int,
    val hp: Int,
    val maxHp: Int,
    val armorClass: Int?,
)

data class LoadedCharacter(val dashboard: Dashboard, val play: PlayState)

class CharacterRepository(private val dao: CharacterDao) {

    val summaries: Flow<List<CharacterSummary>> = dao.observeAll().map { rows ->
        rows.mapNotNull { row ->
            val d = DashboardJson.decode(row.dashboardJson).getOrNull() ?: return@mapNotNull null
            val play = PlayRules.reconcile(d, PlayStateJson.decode(row.playStateJson, row.currentHp))
            val ac = d.resourceStation()?.let { PlayRunner.armorClass(d, it, play.shieldRaised, play.conditions) }
            CharacterSummary(row.id, d.name, d.characterClass, d.character.level, play.hp, d.maxHp(), ac)
        }
    }

    /** Creates a character from the class preset (or a blank panel for classes without one). */
    suspend fun create(name: String, cls: PfClass): String {
        val id = UUID.randomUUID().toString()
        val dashboard = Presets.forClass(cls, id, Text.sanitize(name))
        save(dashboard, PlayRules.initialFor(dashboard))
        return id
    }

    suspend fun load(id: String): LoadedCharacter? {
        val row = dao.find(id) ?: return null
        val dashboard = DashboardJson.decode(row.dashboardJson).getOrThrow()
        return LoadedCharacter(dashboard, PlayRules.reconcile(dashboard, PlayStateJson.decode(row.playStateJson, row.currentHp)))
    }

    suspend fun save(dashboard: Dashboard, play: PlayState) {
        dao.upsert(
            CharacterEntity(
                id = dashboard.characterId,
                name = dashboard.name,
                characterClass = dashboard.characterClass.name,
                dashboardJson = DashboardJson.encode(dashboard),
                currentHp = play.hp,
                updatedAt = System.currentTimeMillis(),
                playStateJson = PlayStateJson.encode(play),
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
        save(copy, loaded.play)
        return newId
    }

    suspend fun delete(id: String) = dao.delete(id)

    suspend fun exportJson(id: String): Pair<String, String>? {
        val row = dao.find(id) ?: return null
        val dashboard = DashboardJson.decode(row.dashboardJson).getOrThrow()
        return dashboard.name to DashboardJson.encode(dashboard)
    }
}
