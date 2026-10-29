package d20.engine.pf2e

import d20.engine.core.DieType

/** Level-5 character: FOR +4, DES +2, INT +4. */
val hero = Pf2eCharacter(
    level = 5,
    abilityMods = mapOf(
        Ability.STR to 4, Ability.DEX to 2, Ability.CON to 1,
        Ability.INT to 4, Ability.WIS to 0, Ability.CHA to -1,
    ),
)

/** Expert longsword +1 striking flaming: 2d8 slashing + 1d6 fire. */
val flamingLongsword = WeaponSpec(
    name = "Espada Rubra",
    attackAbility = Ability.STR,
    rank = Rank.EXPERT,
    diceCount = 1,
    die = DieType.D8,
    damageType = DamageType.SLASHING,
    potency = 1,
    striking = StrikingRune.STRIKING,
    elemental = listOf(ElementalRune.FLAMING),
)
