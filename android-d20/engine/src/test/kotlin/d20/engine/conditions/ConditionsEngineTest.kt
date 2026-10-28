package d20.engine.conditions

import d20.engine.core.DieType
import d20.engine.core.ScriptedRoller
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.Rank
import d20.engine.pf2e.flamingLongsword
import d20.engine.pf2e.hero
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ConditionsEngineTest {
    // hero: level 5, CON +1 -> Fortitude (trained) +8, DES +2 -> Reflexes +9
    private fun engine(vararg rolls: Int) = ConditionsEngine(ScriptedRoller(*rolls))
    private fun state(hp: Int = 10, vararg conds: ActiveCondition) = PlayState(hp = hp, conditions = conds.toList(), nextId = 100)
    private fun cond(kind: ConditionKind, value: Int = 1, rounds: Int? = null, source: String? = null, id: String = "c-${kind.name}") =
        ActiveCondition(id, kind, value, rounds, source)

    private fun applyAll(s: PlayState, p: TurnProposal, maxHp: Int = 20) =
        ConditionsEngine.apply(s, maxHp, p, p.items.map { it.id }.toSet())

    // ---- dying / recovery -----------------------------------------------------------------------------

    @Test
    fun `recovery check at the start of the turn lowers dying on a success`() {
        val s = state(0, cond(ConditionKind.DYING, 2))
        val p = engine(15).startTurn(s, hero) // DC 10 + 2 = 12; 15 is a success
        val item = p.items.single { it.id == "dying" }
        assertTrue(item.roll!!.contains("CD 12"))
        assertEquals(1, applyAll(s, p).state.valueOf(ConditionKind.DYING))
    }

    @Test
    fun `a failed recovery raises dying and dying 4 means death, less with doomed`() {
        val s = state(0, cond(ConditionKind.DYING, 2))
        assertEquals(3, applyAll(s, engine(8).startTurn(s, hero)).state.valueOf(ConditionKind.DYING))
        val doomed = state(0, cond(ConditionKind.DYING, 2), cond(ConditionKind.DOOMED, 1))
        val r = applyAll(doomed, engine(8).startTurn(doomed, hero)) // dying 3 with doomed 1 -> dead
        assertTrue(r.messages.any { it.contains("morre", ignoreCase = true) })
        val crit = applyAll(s, engine(2).startTurn(s, hero)) // critical failure: +2 -> 4
        assertTrue(crit.messages.any { it.contains("morre", ignoreCase = true) })
    }

    @Test
    fun `losing dying makes you wounded, stacking on an existing wounded`() {
        val s = state(0, cond(ConditionKind.DYING, 1))
        val r = applyAll(s, engine(14).startTurn(s, hero))
        assertEquals(0, r.state.valueOf(ConditionKind.DYING))
        assertEquals(1, r.state.valueOf(ConditionKind.WOUNDED))
        val w = state(0, cond(ConditionKind.DYING, 2), cond(ConditionKind.WOUNDED, 1))
        val r2 = applyAll(w, engine(20).startTurn(w, hero)) // natural 20 improves to a critical success: -2
        assertEquals(0, r2.state.valueOf(ConditionKind.DYING))
        assertEquals(2, r2.state.valueOf(ConditionKind.WOUNDED))
    }

    // ---- stunned ----------------------------------------------------------------------------------------

    @Test
    fun `stunned costs actions and its value drops by the actions lost`() {
        val s = state(10, cond(ConditionKind.STUNNED, 2))
        val p = engine().startTurn(s, hero)
        assertTrue(p.items.single { it.id == "stunned" }.detail.contains("2 ações"))
        assertEquals(0, applyAll(s, p).state.valueOf(ConditionKind.STUNNED))
        val big = state(10, cond(ConditionKind.STUNNED, 4))
        assertEquals(1, applyAll(big, engine().startTurn(big, hero)).state.valueOf(ConditionKind.STUNNED))
    }

    // ---- persistent damage ------------------------------------------------------------------------------

    private val burn = PersistentDamage("p1", PersistentSpec(1, DieType.D6, 0, DamageType.FIRE))

    @Test
    fun `persistent damage is rolled at the end of the turn and the user confirms each part`() {
        val s = PlayState(hp = 10, persistent = listOf(burn), nextId = 100)
        val p = engine(4, 17).endTurn(s, hero) // d6 = 4, flat check d20 = 17 vs DC 15
        assertTrue(p.items.any { it.id == "persist-p1-dmg" })
        assertTrue(p.items.any { it.id == "persist-p1-end" })
        val both = applyAll(s, p).state
        assertEquals(6, both.hp)
        assertTrue(both.persistent.isEmpty())
        val onlyDamage = ConditionsEngine.apply(s, 20, p, setOf("persist-p1-dmg")).state
        assertEquals(6, onlyDamage.hp)
        assertEquals(1, onlyDamage.persistent.size)
        val none = ConditionsEngine.apply(s, 20, p, emptySet()).state
        assertEquals(s, none)
    }

    @Test
    fun `the flat check is DC 15, or DC 10 when assisted`() {
        val s = PlayState(hp = 10, persistent = listOf(burn), nextId = 100)
        assertEquals(1, applyAll(s, engine(4, 14).endTurn(s, hero)).state.persistent.size) // 14 < 15
        val helped = PlayState(hp = 10, persistent = listOf(burn.copy(assisted = true)), nextId = 100)
        assertEquals(0, applyAll(helped, engine(4, 12).endTurn(helped, hero)).state.persistent.size) // 12 >= 10
    }

    @Test
    fun `flat persistent damage rolls only the flat check`() {
        val flat = PersistentDamage("p2", PersistentSpec(0, null, 2, DamageType.BLEED))
        val s = PlayState(hp = 10, persistent = listOf(flat), nextId = 100)
        val r = applyAll(s, engine(16).endTurn(s, hero)) // roller has only the d20
        assertEquals(8, r.state.hp)
        assertTrue(r.state.persistent.isEmpty())
    }

    @Test
    fun `damage that reaches 0 Hit Points makes you dying and wounded raises it`() {
        val s = PlayState(hp = 3, persistent = listOf(burn), conditions = listOf(cond(ConditionKind.WOUNDED, 1)), nextId = 100)
        val r = applyAll(s, engine(4, 3).endTurn(s, hero))
        assertEquals(0, r.state.hp)
        assertEquals(2, r.state.valueOf(ConditionKind.DYING)) // 1 + wounded 1
        assertTrue(r.messages.any { it.contains("Morrendo") })
    }

    // ---- value and duration decay --------------------------------------------------------------------------

    @Test
    fun `frightened drops by one at the end of the turn`() {
        val s = state(10, cond(ConditionKind.FRIGHTENED, 2))
        assertEquals(1, applyAll(s, engine().endTurn(s, hero)).state.valueOf(ConditionKind.FRIGHTENED))
        val one = state(10, cond(ConditionKind.FRIGHTENED, 1))
        assertEquals(0, applyAll(one, engine().endTurn(one, hero)).state.valueOf(ConditionKind.FRIGHTENED))
    }

    @Test
    fun `conditions with a duration in rounds count down and expire`() {
        val s = state(10, cond(ConditionKind.QUICKENED, rounds = 1), cond(ConditionKind.ENFEEBLED, rounds = 3))
        val r = applyAll(s, engine().endTurn(s, hero)).state
        assertEquals(0, r.valueOf(ConditionKind.QUICKENED))
        assertEquals(3, r.conditions.single().let { assertEquals(2, it.roundsLeft); 3 })
    }

    // ---- afflictions (poison) ------------------------------------------------------------------------------

    private fun affliction(a: Affliction, stage: Int = 1, left: Int? = 1, max: Int? = a.maxRounds, id: String = "a1") =
        AfflictionState(id, a, stage, left, max)

    @Test
    fun `a failed poison save advances the stage and the stage damage is proposed`() {
        val s = PlayState(hp = 10, afflictions = listOf(affliction(AfflictionCatalog.blackAdderVenom)), nextId = 100)
        val p = engine(5, 4).endTurn(s, hero) // Fort +8: 5 + 8 = 13 vs DC 18 = failure; then 1d6 = 4
        val r = applyAll(s, p).state
        val a = r.afflictions.single()
        assertEquals(2, a.stage)
        assertEquals(1, a.roundsLeft)
        assertEquals(2, a.maxRoundsLeft)
        assertEquals(6, r.hp)
    }

    @Test
    fun `a successful poison save lowers the stage and recovering removes the stage conditions`() {
        val smear = affliction(AfflictionCatalog.blackSmearPoison)
        val s = PlayState(hp = 10, afflictions = listOf(smear), conditions = listOf(cond(ConditionKind.ENFEEBLED, 1, 1, source = "a1")), nextId = 100)
        val r = applyAll(s, engine(18).endTurn(s, hero)).state // 18 + 8 = 26 vs DC 16: success -> stage 0
        assertTrue(r.afflictions.isEmpty())
        assertEquals(0, r.valueOf(ConditionKind.ENFEEBLED))
    }

    @Test
    fun `entering a stage replaces the previous stage conditions`() {
        val spider = affliction(AfflictionCatalog.spiderVenom)
        val s = PlayState(hp = 20, afflictions = listOf(spider), conditions = listOf(cond(ConditionKind.SICKENED, 1, 1, source = "a1", id = "old")), nextId = 100)
        val r = applyAll(s, engine(8, 7).endTurn(s, hero)).state // 8 + 8 = 16 vs DC 22: failure -> stage 2, 1d12 = 7
        assertEquals(13, r.hp)
        assertEquals(1, r.valueOf(ConditionKind.CLUMSY))
        assertEquals(2, r.valueOf(ConditionKind.SICKENED))
        assertEquals(2, r.conditions.size)
        assertTrue(r.conditions.all { it.source == "a1" && it.roundsLeft == 1 })
    }

    @Test
    fun `an affliction ends when its maximum duration runs out, without a save`() {
        val s = PlayState(hp = 10, afflictions = listOf(affliction(AfflictionCatalog.blackAdderVenom, stage = 2, left = 1, max = 1)), nextId = 100)
        val p = engine().endTurn(s, hero) // no dice
        assertTrue(p.items.any { it.id == "aff-a1-end" })
        assertTrue(applyAll(s, p).state.afflictions.isEmpty())
    }

    @Test
    fun `afflictions measured in minutes advance when the user ends the stage`() {
        val arsenic = affliction(AfflictionCatalog.arsenic, stage = 1, left = null, max = null)
        val s = PlayState(hp = 20, afflictions = listOf(arsenic), nextId = 100)
        val p = engine(4, 3).endAfflictionStage(s, hero, "a1") // 4 + 8 = 12 vs DC 18: failure; 1d6 = 3
        val r = applyAll(s, p).state
        assertEquals(2, r.afflictions.single().stage)
        assertNull(r.afflictions.single().roundsLeft)
        assertEquals(17, r.hp)
        assertEquals(2, r.valueOf(ConditionKind.SICKENED))
        assertNull(r.conditions.single().roundsLeft)
    }

    @Test
    fun `the catalog holds real poisons with stages`() {
        assertTrue(AfflictionCatalog.all.size >= 8)
        for (a in AfflictionCatalog.all) {
            assertTrue(a.name.isNotBlank() && a.stages.size >= 3 && a.dc in 10..45, a.name)
            assertTrue(a.stages.all { it.duration.value > 0 }, a.name)
        }
        assertEquals(18, AfflictionCatalog.blackAdderVenom.dc)
        assertEquals(3, AfflictionCatalog.blackAdderVenom.maxRounds)
    }

    // ---- hit points ----------------------------------------------------------------------------------------

    @Test
    fun `hit point changes drive dying and healing clears it`() {
        val (down, msg) = PlayRules.changeHp(PlayState(hp = 3), -5, 20)
        assertEquals(0, down.hp)
        assertEquals(1, down.valueOf(ConditionKind.DYING))
        assertTrue(msg!!.contains("Morrendo 1"))
        val (hit, _) = PlayRules.changeHp(down, -2, 20) // damage while dying
        assertEquals(2, hit.valueOf(ConditionKind.DYING))
        val (healed, hmsg) = PlayRules.changeHp(hit, 4, 20)
        assertEquals(4, healed.hp)
        assertEquals(0, healed.valueOf(ConditionKind.DYING))
        assertEquals(1, healed.valueOf(ConditionKind.WOUNDED))
        assertTrue(hmsg!!.contains("Ferido"))
        assertEquals(20, PlayRules.changeHp(PlayState(hp = 18), 9, 20).first.hp) // capped at max
    }

    @Test
    fun `adding conditions merges by kind keeping the higher value`() {
        var s = PlayState(hp = 10)
        s = PlayRules.addCondition(s, ConditionKind.FRIGHTENED, 1)
        s = PlayRules.addCondition(s, ConditionKind.FRIGHTENED, 2)
        s = PlayRules.addCondition(s, ConditionKind.FRIGHTENED, 1)
        assertEquals(2, s.valueOf(ConditionKind.FRIGHTENED))
        assertEquals(1, s.conditions.size)
        s = PlayRules.addCondition(s, ConditionKind.PRONE, 1)
        s = PlayRules.addCondition(s, ConditionKind.PRONE, 1)
        assertEquals(2, s.conditions.size)
        s = PlayRules.removeCondition(s, ConditionKind.FRIGHTENED)
        assertEquals(0, s.valueOf(ConditionKind.FRIGHTENED))
    }

    @Test
    fun `persistent damage of the same type keeps only the stronger`() {
        var s = PlayRules.addPersistent(PlayState(hp = 10), PersistentSpec(1, DieType.D6, 0, DamageType.FIRE))
        s = PlayRules.addPersistent(s, PersistentSpec(2, DieType.D6, 0, DamageType.FIRE))
        s = PlayRules.addPersistent(s, PersistentSpec(0, null, 1, DamageType.FIRE))
        assertEquals(1, s.persistent.size)
        assertEquals(2, s.persistent.single().spec.diceCount)
        s = PlayRules.addPersistent(s, PersistentSpec(0, null, 3, DamageType.BLEED))
        assertEquals(2, s.persistent.size)
    }

    @Test
    fun `play state survives a JSON round trip`() {
        val s = PlayState(
            hp = 7, shieldHp = 5, shieldRaised = true,
            conditions = listOf(cond(ConditionKind.SLOWED, 1, 2)),
            persistent = listOf(burn),
            afflictions = listOf(affliction(AfflictionCatalog.spiderVenom)),
            used = mapOf("st-1" to 2), nextId = 9,
        )
        assertEquals(s, PlayStateJson.decode(PlayStateJson.encode(s)))
        assertEquals(PlayState(hp = 4), PlayStateJson.decode("", fallbackHp = 4))
    }

    // ---- status penalties on rolls -------------------------------------------------------------------------

    @Test
    fun `frightened and sickened do not stack, the worst status penalty applies`() {
        val c = listOf(cond(ConditionKind.FRIGHTENED, 2), cond(ConditionKind.SICKENED, 1))
        val r = Pf2eEngine(ScriptedRoller(10, 1, 1, 1)).weaponAttack(hero, flamingLongsword, MapStep.FIRST, null, c)
        assertEquals(10 + 14 - 2, r.check.total)
        assertTrue(r.check.modifiers.applied.any { it.label.contains("Apavorado") })
    }

    @Test
    fun `clumsy hits dexterity rolls, enfeebled strength, stupefied mental ones`() {
        fun total(kind: ConditionKind, value: Int, check: CheckSpec): Int =
            Pf2eEngine(ScriptedRoller(10)).check(hero, check, null, listOf(cond(kind, value))).total
        val acrobatics = CheckSpec(CheckKind.ACROBATICS, Rank.TRAINED) // DES +2, trained +7
        assertEquals(10 + 2 + 7 - 3, total(ConditionKind.CLUMSY, 3, acrobatics))
        assertEquals(10 + 2 + 7, total(ConditionKind.ENFEEBLED, 3, acrobatics)) // not strength-based
        val athletics = CheckSpec(CheckKind.ATHLETICS, Rank.TRAINED) // FOR +4
        assertEquals(10 + 4 + 7 - 1, total(ConditionKind.ENFEEBLED, 1, athletics))
        val arcana = CheckSpec(CheckKind.ARCANA, Rank.TRAINED) // INT +4
        assertEquals(10 + 4 + 7 - 2, total(ConditionKind.STUPEFIED, 2, arcana))
        assertEquals(10 + 4 + 7, total(ConditionKind.CLUMSY, 2, arcana))
    }

    @Test
    fun `status penalties also lower armor class and spell DCs`() {
        val armor = d20.engine.pf2e.ArmorSpec(Rank.TRAINED, 1, 2)
        assertEquals(20 - 1, armor.armorClass(hero, conditions = listOf(cond(ConditionKind.FRIGHTENED, 1))))
        assertEquals(20 - 2, armor.armorClass(hero, conditions = listOf(cond(ConditionKind.CLUMSY, 2))))
        assertEquals(20, armor.armorClass(hero, conditions = listOf(cond(ConditionKind.STUPEFIED, 2))))
        val spell = d20.engine.pf2e.SpellSpec("Bola", d20.engine.pf2e.SpellMode.SAVE, Ability.INT, Rank.EXPERT, 6, DieType.D6, DamageType.FIRE)
        assertEquals(23, Pf2eEngine.spellDc(hero, spell))
        assertEquals(21, Pf2eEngine.spellDc(hero, spell, listOf(cond(ConditionKind.STUPEFIED, 2))))
    }
}
