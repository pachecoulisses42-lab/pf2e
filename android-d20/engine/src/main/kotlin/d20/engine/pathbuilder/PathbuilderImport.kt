package d20.engine.pathbuilder

import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.ArmorCatalog
import d20.engine.pf2e.ArmorCategory
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.ElementalRune
import d20.engine.pf2e.Pf2eCharacter
import d20.engine.pf2e.Rank
import d20.engine.pf2e.Resistance
import d20.engine.pf2e.ShieldKind
import d20.engine.pf2e.StrikingRune
import d20.engine.pf2e.WeaponSpec
import d20.engine.schema.AbilityCategory
import d20.engine.schema.AbilityStation
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.Dashboard
import d20.engine.schema.GridLayout
import d20.engine.schema.PfClass
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station
import d20.engine.schema.Text
import d20.engine.schema.ZoneConfig
import d20.engine.schema.Zones
import d20.engine.schema.withId

enum class ImportGroup(val ptName: String) {
    ATTACKS("Ataques"), DEFENSE("Defesa"), SAVES("Resistências e percepção"), SKILLS("Perícias e saberes"),
    SPELLS("Magias com dano"), OTHER_SPELLS("Outras magias"), ITEMS("Poções e bombas"), FEATS("Talentos e características"),
}

data class ImportItem(val station: Station, val group: ImportGroup)

/** [dashboard] already has its zones filled and every imported module in its library. */
data class ImportResult(val dashboard: Dashboard, val items: List<ImportItem>, val warnings: List<String>)

/** Turns a Pathbuilder build into a character: one module per weapon, skill, spell, item and feat. */
object PathbuilderImport {
    fun build(pb: PbBuild, characterId: String): ImportResult = Builder(pb).run(characterId)

    /** Keeps only the chosen groups in the library; the panel stays as it is. */
    fun select(r: ImportResult, keep: Set<ImportGroup>): Dashboard =
        r.dashboard.copy(library = r.items.filter { it.group in keep }.map { it.station })

    private val abilityByCode = mapOf("str" to Ability.STR, "dex" to Ability.DEX, "con" to Ability.CON, "int" to Ability.INT, "wis" to Ability.WIS, "cha" to Ability.CHA)
    private val classByName = mapOf(
        "alchemist" to PfClass.ALCHEMIST, "barbarian" to PfClass.BARBARIAN, "bard" to PfClass.BARD, "champion" to PfClass.CHAMPION,
        "cleric" to PfClass.CLERIC, "druid" to PfClass.DRUID, "fighter" to PfClass.FIGHTER, "investigator" to PfClass.INVESTIGATOR,
        "monk" to PfClass.MONK, "ranger" to PfClass.RANGER, "rogue" to PfClass.ROGUE, "sorcerer" to PfClass.SORCERER,
        "swashbuckler" to PfClass.SWASHBUCKLER, "witch" to PfClass.WITCH, "wizard" to PfClass.WIZARD,
    )
    private val skills = listOf(
        CheckKind.ACROBATICS, CheckKind.ARCANA, CheckKind.ATHLETICS, CheckKind.CRAFTING, CheckKind.DECEPTION, CheckKind.DIPLOMACY,
        CheckKind.INTIMIDATION, CheckKind.MEDICINE, CheckKind.NATURE, CheckKind.OCCULTISM, CheckKind.PERFORMANCE, CheckKind.RELIGION,
        CheckKind.SOCIETY, CheckKind.STEALTH, CheckKind.SURVIVAL, CheckKind.THIEVERY,
    )
    private val armorByName = mapOf(
        "explorer's clothing" to "Roupas de explorador", "padded armor" to "Armadura acolchoada", "leather armor" to "Armadura de couro",
        "studded leather armor" to "Couro batido", "chain shirt" to "Camisa de cota de malha", "hide armor" to "Gibão de peles",
        "scale mail" to "Cota de escamas", "chain mail" to "Cota de malha", "breastplate" to "Peitoral", "splint mail" to "Cota de talas",
        "half plate" to "Meia armadura", "full plate" to "Armadura completa",
    )
    private val damageByName = mapOf(
        "fire" to DamageType.FIRE, "cold" to DamageType.COLD, "electricity" to DamageType.ELECTRICITY, "acid" to DamageType.ACID,
        "sonic" to DamageType.SONIC, "poison" to DamageType.POISON, "mental" to DamageType.MENTAL, "force" to DamageType.FORCE,
        "spirit" to DamageType.SPIRIT, "vitality" to DamageType.VITALITY, "void" to DamageType.VOID, "bleed" to DamageType.BLEED,
        "slashing" to DamageType.SLASHING, "piercing" to DamageType.PIERCING, "bludgeoning" to DamageType.BLUDGEONING,
    )
    private val runeByName = mapOf(
        "flaming" to ElementalRune.FLAMING, "frost" to ElementalRune.FROST, "shock" to ElementalRune.SHOCK,
        "corrosive" to ElementalRune.CORROSIVE, "thundering" to ElementalRune.THUNDERING,
    )
    private val itemPattern = Regex("""^(Healing Potion|Alchemist's Fire|Acid Flask|Bottled Lightning|Frost Vial|Blasting Stone) \((Minor|Lesser|Moderate|Greater|Major)\)$""")
    private val itemKinds = mapOf(
        "Healing Potion" to ConsumableKind.HEALING_POTION, "Alchemist's Fire" to ConsumableKind.ALCHEMISTS_FIRE, "Acid Flask" to ConsumableKind.ACID_FLASK,
        "Bottled Lightning" to ConsumableKind.BOTTLED_LIGHTNING, "Frost Vial" to ConsumableKind.FROST_VIAL, "Blasting Stone" to ConsumableKind.BLASTING_STONE,
    )

    /** Pathbuilder stores proficiency as 0/2/4/6/8. */
    private fun rank(value: Int?): Rank = when (value) { 2 -> Rank.TRAINED; 4 -> Rank.EXPERT; 6 -> Rank.MASTER; 8 -> Rank.LEGENDARY; else -> Rank.UNTRAINED }

    private fun name(raw: String, fallback: String) = Text.sanitize(raw).ifBlank { fallback }

    private class Builder(val pb: PbBuild) {
        val warnings = mutableListOf<String>()
        val items = mutableListOf<ImportItem>()
        val mods = abilityByCode.entries.associate { (code, a) -> a to Math.floorDiv((pb.scores[code] ?: 10) - 10, 2) }
        val character = Pf2eCharacter(
            level = pb.level.coerceIn(1, 20),
            abilityMods = mods.mapValues { it.value.coerceIn(-5, 10) },
            saves = mapOf(CheckKind.FORTITUDE to rank(pb.profs["fortitude"]), CheckKind.REFLEX to rank(pb.profs["reflex"]), CheckKind.WILL to rank(pb.profs["will"])),
            classRank = rank(pb.profs["classDC"]).takeIf { it != Rank.UNTRAINED } ?: Rank.TRAINED,
            keyAbility = pb.keyAbility?.let { abilityByCode[it.lowercase()] },
        )

        fun add(group: ImportGroup, station: Station) {
            items += ImportItem(station.withId("lib-%03d".format(items.size + 1)), group)
        }

        fun run(characterId: String): ImportResult {
            val cls = classByName[pb.className.trim().lowercase()] ?: PfClass.FIGHTER.also { warnings += "Classe ${pb.className} não suportada: usando Guerreiro" }
            pb.weapons.forEach { add(ImportGroup.ATTACKS, weapon(it)) }
            add(ImportGroup.DEFENSE, resource())
            add(ImportGroup.SAVES, check(CheckKind.PERCEPTION, pb.profs["perception"], "Perception"))
            add(ImportGroup.SAVES, check(CheckKind.FORTITUDE, pb.profs["fortitude"], "Fortitude"))
            add(ImportGroup.SAVES, check(CheckKind.REFLEX, pb.profs["reflex"], "Reflex"))
            add(ImportGroup.SAVES, check(CheckKind.WILL, pb.profs["will"], "Will"))
            skills.forEach { k ->
                val key = k.name.lowercase()
                if ((pb.profs[key] ?: 0) > 0) add(ImportGroup.SKILLS, check(k, pb.profs[key], key.replaceFirstChar { it.uppercase() }))
            }
            pb.lores.forEach { (lore, prof) ->
                add(ImportGroup.SKILLS, check(CheckKind.LORE, prof, "Lore: $lore", custom = name("Saber: $lore", "Saber")))
            }
            spells()
            items()
            feats()

            val lib = items.map { it.station }
            var n = 0
            fun place(s: Station) = s.withId("st-%02d".format(++n))
            val attacks = items.filter { it.group == ImportGroup.ATTACKS }.map { it.station as ActionStation }.sortedByDescending { pb.weapons.firstOrNull { w -> name(w.name, "Arma") == it.weapon.name }?.attack ?: 0 }
            val firstSpell = items.firstOrNull { it.group == ImportGroup.SPELLS }?.station
            val top = listOfNotNull(attacks.firstOrNull(), firstSpell ?: attacks.getOrNull(1))
            val saves = items.filter { it.group == ImportGroup.SAVES }.map { it.station }
            val resource = items.first { it.group == ImportGroup.DEFENSE }.station
            val zones = Zones(
                ZoneConfig(GridLayout.GRID_1X2, top.map(::place)),
                ZoneConfig(GridLayout.GRID_2X2, saves.map(::place)),
                ZoneConfig(GridLayout.GRID_1X2, listOf(place(resource), ConditionsStation("st-%02d".format(++n)))),
            )
            val d = Dashboard(characterId = characterId, name = name(pb.name, "Personagem"), characterClass = cls, character = character, zones = zones, library = lib)
            return ImportResult(d, items.toList(), warnings.toList())
        }

        fun check(kind: CheckKind, prof: Int?, modKey: String, custom: String? = null) = SkillStation(
            "tmp", CheckSpec(kind, rank(prof), itemBonus = (pb.itemBonuses[modKey] ?: 0).coerceIn(0, 4), customName = custom),
        )

        fun weapon(w: PbWeapon): ActionStation {
            val nm = name(w.name, "Arma")
            val r = rank(pb.profs[w.prof])
            val pot = w.pot.coerceIn(0, 3)
            val prof = r.bonus(character.level)
            val ability = when (w.attack) {
                character.mod(Ability.STR) + prof + pot -> Ability.STR
                character.mod(Ability.DEX) + prof + pot -> Ability.DEX
                else -> Ability.STR.also { warnings += "$nm: atributo de ataque não identificado" }
            }
            val die = DieType.entries.firstOrNull { it.label == w.die.lowercase() } ?: DieType.D4.also { warnings += "$nm: dado ${w.die} desconhecido" }
            val type = when (w.damageType.uppercase()) {
                "P" -> DamageType.PIERCING; "S" -> DamageType.SLASHING; "B" -> DamageType.BLUDGEONING
                else -> DamageType.BLUDGEONING.also { warnings += "$nm: tipo de dano ${w.damageType} desconhecido" }
            }
            val striking = when (w.striking) {
                "striking" -> StrikingRune.STRIKING; "greaterStriking" -> StrikingRune.GREATER; "majorStriking" -> StrikingRune.MAJOR; else -> StrikingRune.NONE
            }
            val elemental = w.runes.mapNotNull { rune -> runeByName[rune.lowercase()] ?: null.also { warnings += "$nm: runa $rune não importada" } }.distinct().take(3)
            return ActionStation("tmp", WeaponSpec(nm, ability, r, 1, die, type, potency = pot, striking = striking, elemental = elemental))
        }

        fun resource(): ResourceStation {
            val worn = pb.armor.firstOrNull { it.worn && it.prof != "shield" }
            val armor = if (worn == null) ArmorCatalog.basics.first() else {
                val base = armorByName[worn.name.trim().lowercase()]?.let { n -> ArmorCatalog.basics.first { it.name == n } }
                    ?: run {
                        val cat = when (worn.prof) { "light" -> ArmorCategory.LIGHT; "medium" -> ArmorCategory.MEDIUM; "heavy" -> ArmorCategory.HEAVY; else -> ArmorCategory.UNARMORED }
                        warnings += "Armadura ${worn.name} não reconhecida: usando uma da categoria ${cat.ptName}"
                        ArmorCatalog.basics.first { it.category == cat }
                    }
                base.copy(
                    rank = rank(pb.profs[worn.prof]),
                    potency = worn.pot.coerceIn(0, 3),
                    resilient = when (worn.resilient) { "resilient" -> 1; "greaterResilient" -> 2; "majorResilient" -> 3; else -> 0 },
                )
            }.let { a -> if (worn == null) a.copy(rank = rank(pb.profs["unarmored"])) else a }
            val resistances = pb.resistances.mapNotNull { raw ->
                val parts = raw.trim().split(Regex("\\s+"))
                val type = damageByName[parts.first().lowercase()]
                val value = parts.lastOrNull()?.toIntOrNull()
                if (type == null || value == null) null.also { warnings += "Resistência \"$raw\" não importada" } else Resistance(type, value.coerceIn(1, 30))
            }.distinctBy { it.type }.take(5)
            val shieldItem = pb.armor.firstOrNull { it.worn && it.prof == "shield" }
            val shield = shieldItem?.let { s ->
                val n = s.name.lowercase()
                when {
                    "buckler" in n -> ShieldKind.BUCKLER
                    "wooden" in n -> ShieldKind.WOODEN
                    "steel" in n -> ShieldKind.STEEL
                    "tower" in n -> ShieldKind.TOWER
                    "fortress" in n -> ShieldKind.FORTRESS
                    else -> null.also { warnings += "Escudo ${s.name} não reconhecido: escolha um no módulo Vida, escudo & defesa" }
                }
            }
            val hp = pb.ancestryHp + pb.bonusHp + character.level * (pb.classHp + pb.bonusHpPerLevel + character.mod(Ability.CON))
            return ResourceStation("tmp", hp.coerceIn(1, 999), armor.copy(resistances = resistances), shield)
        }

        /** Cantrips and focus spells heighten to half the character's level, rounded up. */
        val heightened = (character.level + 1) / 2

        fun spell(english: String, rankLevel: Int, ability: Ability, prof: Int, focus: Boolean) {
            val r = rank(prof)
            val known = SpellCatalog.lookup(english, rankLevel, ability, r)
            if (known != null) {
                add(ImportGroup.SPELLS, SpellStation("tmp", known.copy(fromClass = prof == pb.profs["classDC"])))
            } else {
                add(ImportGroup.OTHER_SPELLS, AbilityStation("tmp", name(english, "Magia"), if (focus) AbilityCategory.FOCUS_SPELL else AbilityCategory.SPELL, rankLevel.coerceIn(0, 20)))
            }
        }

        fun spells() {
            pb.casters.forEach { c ->
                val ability = abilityByCode[c.ability.lowercase()] ?: Ability.CHA
                val best = linkedMapOf<String, Int>()
                c.spells.forEach { (lvl, names) ->
                    val at = if (lvl == 0) heightened else lvl
                    names.forEach { n -> best[n] = maxOf(best[n] ?: 0, at) }
                }
                best.forEach { (n, at) -> spell(n, at, ability, c.proficiency, focus = false) }
            }
            pb.focus.forEach { f ->
                val ability = abilityByCode[f.ability.lowercase()] ?: Ability.CHA
                f.spells.distinct().forEach { n -> spell(n, heightened, ability, f.proficiency, focus = true) }
            }
        }

        fun items() {
            pb.equipment.forEach { (raw, qty) ->
                val m = itemPattern.matchEntire(raw.trim()) ?: return@forEach
                val kind = itemKinds.getValue(m.groupValues[1])
                val grade = ConsumableGrade.valueOf(m.groupValues[2].uppercase())
                if (grade !in ConsumableTables.grades(kind)) {
                    warnings += "$raw: grau não existe no app"
                } else {
                    add(ImportGroup.ITEMS, ConsumableStation("tmp", ConsumableSpec("", kind, grade, quantity = qty.coerceIn(1, 99))))
                }
            }
        }

        fun feats() {
            val seen = mutableSetOf<String>()
            pb.feats.forEach { f ->
                val full = if (f.choice.isBlank()) f.name else "${f.name} (${f.choice})"
                if (seen.add(full.lowercase())) {
                    add(ImportGroup.FEATS, AbilityStation("tmp", name(full, "Talento"), category(f.type), f.level.coerceIn(0, 20)))
                }
            }
            pb.specials.forEach { s ->
                if (seen.add(s.lowercase())) add(ImportGroup.FEATS, AbilityStation("tmp", name(s, "Característica"), AbilityCategory.CLASS_FEATURE, 0))
            }
        }

        fun category(type: String): AbilityCategory {
            val t = type.lowercase()
            return when {
                "ancestry" in t -> AbilityCategory.ANCESTRY_FEAT
                "skill" in t -> AbilityCategory.SKILL_FEAT
                "general" in t -> AbilityCategory.GENERAL_FEAT
                "archetype" in t -> AbilityCategory.ARCHETYPE_FEAT
                "heritage" in t -> AbilityCategory.OTHER
                "class" in t || classByName.keys.any { it in t } -> AbilityCategory.CLASS_FEAT
                else -> AbilityCategory.OTHER
            }
        }
    }
}
