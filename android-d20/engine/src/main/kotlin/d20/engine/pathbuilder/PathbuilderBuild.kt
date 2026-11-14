package d20.engine.pathbuilder

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull

/** [choice] is what the feat was taken for (Assurance → "Arcana"), blank when none. */
data class PbFeat(val name: String, val choice: String, val type: String, val level: Int)

data class PbWeapon(
    val name: String, val prof: String, val die: String, val pot: Int, val striking: String,
    val damageType: String, val attack: Int, val runes: List<String>,
)

data class PbArmor(val name: String, val prof: String, val pot: Int, val resilient: String, val worn: Boolean, val runes: List<String>)

/** One spellcaster entry; [spells] holds (spell rank, names) with 0 = cantrips. */
data class PbCaster(val name: String, val tradition: String, val ability: String, val proficiency: Int, val spells: List<Pair<Int, List<String>>>)

data class PbFocus(val ability: String, val proficiency: Int, val spells: List<String>)

/** The parts of a Pathbuilder 2e "Export JSON" build the importer uses. */
data class PbBuild(
    val name: String,
    val className: String,
    val level: Int,
    val keyAbility: String?,
    val scores: Map<String, Int>,
    val ancestryHp: Int,
    val classHp: Int,
    val bonusHp: Int,
    val bonusHpPerLevel: Int,
    val speed: Int,
    val profs: Map<String, Int>,
    /** Only the "Item Bonus" entries of `mods`; circumstance bonuses are situational and left out. */
    val itemBonuses: Map<String, Int>,
    val lores: List<Pair<String, Int>>,
    val feats: List<PbFeat>,
    val specials: List<String>,
    val weapons: List<PbWeapon>,
    val armor: List<PbArmor>,
    val resistances: List<String>,
    val casters: List<PbCaster>,
    val focus: List<PbFocus>,
    val equipment: List<Pair<String, Int>>,
)

/** Tolerant reader: a missing or oddly typed field falls back to a default instead of failing the import. */
object PathbuilderParser {
    fun parse(json: String): PbBuild {
        val root = runCatching { Json.parseToJsonElement(json) }.getOrNull() as? JsonObject
            ?: throw IllegalArgumentException("Não é um personagem do Pathbuilder: JSON inválido")
        val b = root["build"] as? JsonObject ?: root
        val name = b.str("name")
        val className = b.str("class")
        val level = b.int("level")
        require(name.isNotBlank() && className.isNotBlank() && level > 0) {
            "Não é um personagem do Pathbuilder: faltam nome, classe ou nível"
        }
        val abilities = b.obj("abilities")
        val attributes = b.obj("attributes")
        return PbBuild(
            name = name, className = className, level = level,
            keyAbility = b.str("keyability").ifBlank { null },
            scores = listOf("str", "dex", "con", "int", "wis", "cha").associateWith { abilities.int(it, 10) },
            ancestryHp = attributes.int("ancestryhp"), classHp = attributes.int("classhp"),
            bonusHp = attributes.int("bonushp"), bonusHpPerLevel = attributes.int("bonushpPerLevel"),
            speed = attributes.int("speed", 25),
            profs = b.obj("proficiencies").mapValues { (_, v) -> (v as? JsonPrimitive)?.intOrNull ?: 0 },
            itemBonuses = b.obj("mods").mapNotNull { (k, v) -> (v as? JsonObject)?.int("Item Bonus", 0)?.takeIf { it != 0 }?.let { k to it } }.toMap(),
            lores = b.arr("lores").mapNotNull { it as? JsonArray }.map { it.strAt(0) to it.intAt(1) },
            feats = b.arr("feats").mapNotNull { it as? JsonArray }.map { PbFeat(it.strAt(0), it.strAt(1), it.strAt(2), it.intAt(3)) },
            specials = b.arr("specials").map { it.text() },
            weapons = b.arr("weapons").mapNotNull { it as? JsonObject }.map { w ->
                PbWeapon(w.str("name"), w.str("prof"), w.str("die"), w.int("pot"), w.str("str"), w.str("damageType"), w.int("attack"), w.arr("runes").map { it.text() })
            },
            armor = b.arr("armor").mapNotNull { it as? JsonObject }.map { a ->
                PbArmor(a.str("name"), a.str("prof"), a.int("pot"), a.str("res"), (a["worn"] as? JsonPrimitive)?.booleanOrNull ?: false, a.arr("runes").map { it.text() })
            },
            resistances = b.arr("resistances").map { it.text() },
            casters = b.arr("spellCasters").mapNotNull { it as? JsonObject }.map { c ->
                PbCaster(
                    c.str("name"), c.str("magicTradition"), c.str("ability"), c.int("proficiency"),
                    c.arr("spells").mapNotNull { it as? JsonObject }.map { s -> s.int("spellLevel") to s.arr("list").map { it.text() } },
                )
            },
            focus = b.obj("focus").values.mapNotNull { it as? JsonObject }.flatMap { byAbility ->
                byAbility.mapNotNull { (ability, v) ->
                    (v as? JsonObject)?.let { f -> PbFocus(ability, f.int("proficiency"), f.arr("focusCantrips").map { it.text() } + f.arr("focusSpells").map { it.text() }) }
                }
            },
            equipment = b.arr("equipment").mapNotNull { it as? JsonArray }.map { it.strAt(0) to it.intAt(1, 1) },
        )
    }

    private fun JsonElement?.text(): String = (this as? JsonPrimitive)?.takeIf { this !is JsonNull }?.content.orEmpty()
    private fun JsonObject.str(key: String) = this[key].text()
    private fun JsonObject.int(key: String, default: Int = 0) = (this[key] as? JsonPrimitive)?.intOrNull ?: default
    private fun JsonObject.obj(key: String) = this[key] as? JsonObject ?: JsonObject(emptyMap())
    private fun JsonObject.arr(key: String) = this[key] as? JsonArray ?: JsonArray(emptyList())
    private fun JsonArray.strAt(i: Int) = getOrNull(i).text()
    private fun JsonArray.intAt(i: Int, default: Int = 0) = (getOrNull(i) as? JsonPrimitive)?.intOrNull ?: default
}
