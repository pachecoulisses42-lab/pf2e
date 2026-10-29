package d20.engine.conditions

import d20.engine.core.DieType
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.DamageType

/** Poisons taken from the Pathfinder equipment data (save, DC, stages, durations). */
object AfflictionCatalog {
    private fun poison(n: Int, die: DieType) = PersistentSpec(n, die, 0, DamageType.POISON)
    private fun rounds(n: Int = 1) = StageDuration(n, DurationUnit.ROUNDS)
    private fun minutes(n: Int) = StageDuration(n, DurationUnit.MINUTES)
    private fun c(kind: ConditionKind, v: Int = 1) = StageCondition(kind, v)

    val arsenic = Affliction("Arsênico", CheckKind.FORTITUDE, 18, listOf(
        AfflictionStage(poison(1, DieType.D4), listOf(c(ConditionKind.SICKENED, 1)), minutes(1)),
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.SICKENED, 2)), minutes(1)),
        AfflictionStage(poison(1, DieType.D8), listOf(c(ConditionKind.SICKENED, 3)), minutes(1)),
    ))

    val blackAdderVenom = Affliction("Veneno de víbora negra", CheckKind.FORTITUDE, 18, listOf(
        AfflictionStage(poison(1, DieType.D4), emptyList(), rounds()),
        AfflictionStage(poison(1, DieType.D6), emptyList(), rounds()),
        AfflictionStage(poison(1, DieType.D8), emptyList(), rounds()),
    ), maxRounds = 3)

    val blackSmearPoison = Affliction("Veneno de graxa negra", CheckKind.FORTITUDE, 16, listOf(
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 1)), rounds()),
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 1)), rounds()),
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 2)), rounds()),
    ), maxRounds = 6)

    val belladonna = Affliction("Beladona", CheckKind.FORTITUDE, 19, listOf(
        AfflictionStage(null, listOf(c(ConditionKind.DAZZLED)), minutes(10)),
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.SICKENED, 1)), minutes(10)),
        AfflictionStage(poison(1, DieType.D6), listOf(c(ConditionKind.CONFUSED), c(ConditionKind.SICKENED, 1)), minutes(1)),
    ))

    val giantScorpionVenom = Affliction("Veneno de escorpião-gigante", CheckKind.FORTITUDE, 22, listOf(
        AfflictionStage(poison(2, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 1)), rounds()),
        AfflictionStage(poison(2, DieType.D8), listOf(c(ConditionKind.ENFEEBLED, 1)), rounds()),
        AfflictionStage(poison(2, DieType.D10), listOf(c(ConditionKind.ENFEEBLED, 2)), rounds()),
    ), maxRounds = 6)

    val spiderVenom = Affliction("Veneno de aranha", CheckKind.FORTITUDE, 22, listOf(
        AfflictionStage(poison(1, DieType.D10), listOf(c(ConditionKind.SICKENED, 1)), rounds()),
        AfflictionStage(poison(1, DieType.D12), listOf(c(ConditionKind.CLUMSY, 1), c(ConditionKind.SICKENED, 2)), rounds()),
        AfflictionStage(poison(2, DieType.D6), listOf(c(ConditionKind.CLUMSY, 2), c(ConditionKind.SICKENED, 3)), rounds()),
    ), maxRounds = 6)

    val hemlock = Affliction("Cicuta", CheckKind.FORTITUDE, 38, listOf(
        AfflictionStage(poison(16, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 2)), minutes(10)),
        AfflictionStage(poison(17, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 3)), minutes(10)),
        AfflictionStage(poison(18, DieType.D6), listOf(c(ConditionKind.ENFEEBLED, 4)), minutes(10)),
    ))

    val nightmareVapor = Affliction("Vapor de pesadelo", CheckKind.FORTITUDE, 36, listOf(
        AfflictionStage(null, listOf(c(ConditionKind.CONFUSED)), rounds()),
        AfflictionStage(null, listOf(c(ConditionKind.CONFUSED), c(ConditionKind.OFF_GUARD)), rounds()),
        AfflictionStage(null, listOf(c(ConditionKind.CONFUSED), c(ConditionKind.OFF_GUARD), c(ConditionKind.STUPEFIED, 2)), rounds()),
    ), maxRounds = 6)

    val all: List<Affliction> = listOf(
        arsenic, blackAdderVenom, blackSmearPoison, belladonna, giantScorpionVenom, spiderVenom, hemlock, nightmareVapor,
    )
}
