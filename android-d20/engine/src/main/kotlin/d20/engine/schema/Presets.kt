package d20.engine.schema

import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Pf2eCharacter
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.WeaponSpec

/** Starting dashboards following the guide's class presets (§5), adapted to PF2e level-1 characters. */
object Presets {
    private fun mods(str: Int, dex: Int, con: Int, int: Int, wis: Int, cha: Int) = mapOf(
        Ability.STR to str, Ability.DEX to dex, Ability.CON to con,
        Ability.INT to int, Ability.WIS to wis, Ability.CHA to cha,
    )

    private fun skill(id: String, kind: CheckKind, rank: Rank) = SkillStation(id, CheckSpec(kind, rank))

    private val empty = ZoneConfig(GridLayout.GRID_1X1, emptyList())

    fun blank(id: String, name: String, cls: PfClass): Dashboard = Dashboard(
        characterId = id, name = name, characterClass = cls,
        character = Pf2eCharacter(1, mods(0, 0, 0, 0, 0, 0)),
        zones = Zones(empty, empty, empty),
    )

    fun forClass(cls: PfClass, id: String, name: String): Dashboard = when (cls) {
        PfClass.FIGHTER -> fighter(id, name)
        PfClass.ROGUE -> rogue(id, name)
        PfClass.WIZARD -> wizard(id, name)
        PfClass.CLERIC -> cleric(id, name)
        else -> blank(id, name, cls)
    }

    private fun fighter(id: String, name: String) = Dashboard(
        characterId = id, name = name, characterClass = PfClass.FIGHTER,
        character = Pf2eCharacter(1, mods(4, 2, 2, 0, 1, 0)),
        zones = Zones(
            zone1 = ZoneConfig(
                GridLayout.GRID_1X2,
                listOf(
                    ActionStation("st-01", WeaponSpec("Espada Longa", Ability.STR, Rank.EXPERT, 1, DieType.D8, DamageType.SLASHING)),
                    ActionStation("st-02", WeaponSpec("Arco Longo", Ability.DEX, Rank.EXPERT, 1, DieType.D8, DamageType.PIERCING)),
                ),
            ),
            zone2 = ZoneConfig(
                GridLayout.GRID_2X2,
                listOf(
                    skill("st-03", CheckKind.ATHLETICS, Rank.TRAINED), skill("st-04", CheckKind.INTIMIDATION, Rank.TRAINED),
                    skill("st-05", CheckKind.FORTITUDE, Rank.EXPERT), skill("st-06", CheckKind.PERCEPTION, Rank.TRAINED),
                ),
            ),
            zone3 = ZoneConfig(GridLayout.GRID_1X2, listOf(ResourceStation("st-07", 20, ArmorSpec(Rank.TRAINED, 2, 1)), ConditionsStation("st-08"))),
        ),
    )

    private fun rogue(id: String, name: String) = Dashboard(
        characterId = id, name = name, characterClass = PfClass.ROGUE,
        character = Pf2eCharacter(1, mods(0, 4, 1, 1, 1, 2)),
        zones = Zones(
            zone1 = ZoneConfig(
                GridLayout.GRID_1X2,
                listOf(
                    ActionStation("st-01", WeaponSpec("Espada Curta", Ability.DEX, Rank.TRAINED, 1, DieType.D6, DamageType.PIERCING, agile = true)),
                    ActionStation("st-02", WeaponSpec("Arco Curto", Ability.DEX, Rank.TRAINED, 1, DieType.D6, DamageType.PIERCING)),
                ),
            ),
            zone2 = ZoneConfig(
                GridLayout.GRID_2X2,
                listOf(
                    skill("st-03", CheckKind.STEALTH, Rank.EXPERT), skill("st-04", CheckKind.THIEVERY, Rank.EXPERT),
                    skill("st-05", CheckKind.ACROBATICS, Rank.TRAINED), skill("st-06", CheckKind.PERCEPTION, Rank.EXPERT),
                ),
            ),
            zone3 = ZoneConfig(GridLayout.GRID_1X2, listOf(ResourceStation("st-07", 16, ArmorSpec(Rank.TRAINED, 1, 4)), ConditionsStation("st-08"))),
        ),
    )

    private fun wizard(id: String, name: String) = Dashboard(
        characterId = id, name = name, characterClass = PfClass.WIZARD,
        character = Pf2eCharacter(1, mods(0, 2, 1, 4, 1, 0)),
        zones = Zones(
            zone1 = ZoneConfig(
                GridLayout.GRID_1X2,
                listOf(
                    SpellStation("st-01", SpellSpec("Raio Gélido", SpellMode.ATTACK, Ability.INT, Rank.TRAINED, 2, DieType.D4, DamageType.COLD)),
                    SpellStation("st-02", SpellSpec("Mãos Flamejantes", SpellMode.SAVE, Ability.INT, Rank.TRAINED, 2, DieType.D6, DamageType.FIRE, CheckKind.REFLEX)),
                ),
            ),
            zone2 = ZoneConfig(
                GridLayout.GRID_2X2,
                listOf(
                    skill("st-03", CheckKind.ARCANA, Rank.TRAINED), skill("st-04", CheckKind.SOCIETY, Rank.TRAINED),
                    skill("st-05", CheckKind.OCCULTISM, Rank.TRAINED), skill("st-06", CheckKind.PERCEPTION, Rank.TRAINED),
                ),
            ),
            zone3 = ZoneConfig(GridLayout.GRID_1X2, listOf(ResourceStation("st-07", 12, ArmorSpec(Rank.UNTRAINED, 0, 5)), ConditionsStation("st-08"))),
        ),
    )

    private fun cleric(id: String, name: String) = Dashboard(
        characterId = id, name = name, characterClass = PfClass.CLERIC,
        character = Pf2eCharacter(1, mods(1, 0, 2, 0, 4, 1)),
        zones = Zones(
            zone1 = ZoneConfig(
                GridLayout.GRID_1X2,
                listOf(
                    SpellStation("st-01", SpellSpec("Lança Divina", SpellMode.ATTACK, Ability.WIS, Rank.TRAINED, 2, DieType.D4, DamageType.FIRE)),
                    ActionStation("st-02", WeaponSpec("Maça", Ability.STR, Rank.TRAINED, 1, DieType.D6, DamageType.BLUDGEONING)),
                ),
            ),
            zone2 = ZoneConfig(
                GridLayout.GRID_2X2,
                listOf(
                    skill("st-03", CheckKind.RELIGION, Rank.TRAINED), skill("st-04", CheckKind.MEDICINE, Rank.TRAINED),
                    skill("st-05", CheckKind.WILL, Rank.EXPERT), skill("st-06", CheckKind.DIPLOMACY, Rank.TRAINED),
                ),
            ),
            zone3 = ZoneConfig(GridLayout.GRID_1X2, listOf(ResourceStation("st-07", 18, ArmorSpec(Rank.TRAINED, 1, 2)), ConditionsStation("st-08"))),
        ),
    )
}
