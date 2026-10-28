package d20.engine.schema

import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.WeaponSpec

enum class ZoneKey(val ptName: String) {
    ZONE1("Zona 1 · Topo"), ZONE2("Zona 2 · Centro"), ZONE3("Zona 3 · Base");

    fun of(d: Dashboard): ZoneConfig = when (this) { ZONE1 -> d.zones.zone1; ZONE2 -> d.zones.zone2; ZONE3 -> d.zones.zone3 }

    fun with(d: Dashboard, zone: ZoneConfig): Dashboard = d.copy(
        zones = when (this) {
            ZONE1 -> d.zones.copy(zone1 = zone)
            ZONE2 -> d.zones.copy(zone2 = zone)
            ZONE3 -> d.zones.copy(zone3 = zone)
        },
    )
}

enum class StationType(val ptName: String) {
    ACTION("Ataque com arma"), SPELL("Magia"), SKILL("Perícia / Resistência"), CONSUMABLE("Poção ou bomba"),
    RESOURCE("Vida, escudo & defesa"), CONDITIONS("Condições"),
}

/** Pure, immutable edit operations behind the Setup-mode builder (the UI only calls these). */
object DashboardEditor {
    fun setLayout(d: Dashboard, key: ZoneKey, layout: GridLayout): Result<Dashboard> {
        val zone = key.of(d)
        if (zone.stations.size > layout.slots) {
            return Result.failure(IllegalStateException("Remova estações antes: ${zone.stations.size} > ${layout.slots} slots"))
        }
        return Result.success(key.with(d, zone.copy(layout = layout)))
    }

    fun addStation(d: Dashboard, key: ZoneKey, type: StationType): Result<Dashboard> {
        val zone = key.of(d)
        if (zone.stations.size >= zone.layout.slots) {
            return Result.failure(IllegalStateException("${key.ptName} está cheia (${zone.layout.slots} slots)"))
        }
        val station = newStation(nextId(d), type)
        return Result.success(key.with(d, zone.copy(stations = zone.stations + station)))
    }

    fun removeStation(d: Dashboard, id: String): Dashboard = mapZones(d) { z ->
        z.copy(stations = z.stations.filterNot { it.id == id })
    }

    fun replaceStation(d: Dashboard, station: Station): Dashboard = mapZones(d) { z ->
        z.copy(stations = z.stations.map { if (it.id == station.id) station else it })
    }

    fun rename(d: Dashboard, raw: String) = d.copy(name = Text.sanitize(raw))
    fun setClass(d: Dashboard, cls: PfClass) = d.copy(characterClass = cls)
    fun setLevel(d: Dashboard, level: Int) = d.copy(character = d.character.copy(level = level.coerceIn(1, 20)))
    fun setSaveRank(d: Dashboard, kind: d20.engine.pf2e.CheckKind, rank: Rank) =
        d.copy(character = d.character.copy(saves = d.character.saves + (kind to rank)))

    fun setAbility(d: Dashboard, ability: Ability, mod: Int) =
        d.copy(character = d.character.copy(abilityMods = d.character.abilityMods + (ability to mod.coerceIn(-5, 10))))

    private fun mapZones(d: Dashboard, f: (ZoneConfig) -> ZoneConfig) =
        d.copy(zones = Zones(f(d.zones.zone1), f(d.zones.zone2), f(d.zones.zone3)))

    private fun nextId(d: Dashboard): String {
        val used = d.zones.all().flatMap { it.second.stations }.mapNotNull { Regex("st-(\\d+)").matchEntire(it.id)?.groupValues?.get(1)?.toInt() }
        return "st-%02d".format((used.maxOrNull() ?: 0) + 1)
    }

    private fun newStation(id: String, type: StationType): Station = when (type) {
        StationType.ACTION -> ActionStation(id, WeaponSpec("Nova arma", Ability.STR, Rank.TRAINED, 1, DieType.D8, DamageType.SLASHING))
        StationType.SPELL -> SpellStation(id, SpellSpec("Nova magia", SpellMode.ATTACK, Ability.INT, Rank.TRAINED, 2, DieType.D6, DamageType.FIRE))
        StationType.SKILL -> SkillStation(id, CheckSpec(CheckKind.ATHLETICS, Rank.TRAINED))
        StationType.CONSUMABLE -> ConsumableStation(id, ConsumableSpec("", ConsumableKind.HEALING_POTION, ConsumableGrade.LESSER))
        StationType.RESOURCE -> ResourceStation(id, 10, ArmorSpec(Rank.UNTRAINED, 0, 5))
        StationType.CONDITIONS -> ConditionsStation(id)
    }
}
