package d20.engine.schema

import d20.engine.pf2e.Formulas
import d20.engine.pf2e.Pf2eCharacter
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject

/**
 * JSON import/export of the RPGMobileDashboard contract. Exported stations additionally carry derived,
 * read-only display fields (`title`, `diceFormula`, `secondaryDiceFormula`) that are ignored on import.
 */
object DashboardJson {
    private val json = Json {
        classDiscriminator = "type"
        encodeDefaults = true
        prettyPrint = true
        ignoreUnknownKeys = true
    }

    fun encode(d: Dashboard, validate: Boolean = true): String {
        if (validate) {
            val errors = DashboardValidator.validate(d)
            require(errors.isEmpty()) { "Painel inválido: ${errors.joinToString("; ")}" }
        }
        val tree = json.encodeToJsonElement(Dashboard.serializer(), d).jsonObject
        val zonesTree = tree.getValue("zones").jsonObject
        val enriched = JsonObject(
            zonesTree.mapValues { (key, zoneEl) ->
                val zone = zoneEl.jsonObject
                val stations = d.zones.all().first { it.first == key }.second.stations
                val stationEls = zone.getValue("stations").jsonArray
                JsonObject(
                    zone + ("stations" to JsonArray(
                        stationEls.mapIndexed { i, el -> JsonObject(el.jsonObject + derived(d.character, stations[i])) },
                    )),
                )
            },
        )
        return json.encodeToString(JsonElement.serializer(), JsonObject(tree + ("zones" to enriched)))
    }

    fun decode(text: String): Result<Dashboard> = runCatching {
        val d = json.decodeFromString(Dashboard.serializer(), text)
        val errors = DashboardValidator.validate(d)
        require(errors.isEmpty()) { "Painel inválido: ${errors.joinToString("; ")}" }
        d
    }

    private fun derived(c: Pf2eCharacter, s: Station): Map<String, JsonElement> = buildMap {
        put("title", JsonPrimitive(s.title))
        when (s) {
            is ActionStation -> {
                put("diceFormula", JsonPrimitive(Formulas.attack(c, s.weapon)))
                put("secondaryDiceFormula", JsonPrimitive(Formulas.damage(c, s.weapon)))
            }
            is SpellStation -> {
                put("diceFormula", JsonPrimitive(Formulas.spellAttack(c, s.spell)))
                put("secondaryDiceFormula", JsonPrimitive(Formulas.spellDamage(s.spell)))
            }
            is SkillStation -> put("diceFormula", JsonPrimitive(Formulas.check(c, s.check)))
            is ConsumableStation -> Formulas.consumable(c, s.consumable)?.let { (main, second) ->
                put("diceFormula", JsonPrimitive(main))
                second?.let { put("secondaryDiceFormula", JsonPrimitive(it)) }
            }
            is ResourceStation, is ConditionsStation -> Unit
        }
    }
}
