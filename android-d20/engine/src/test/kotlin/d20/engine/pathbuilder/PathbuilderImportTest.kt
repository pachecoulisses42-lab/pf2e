package d20.engine.pathbuilder

import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.ConsumableGrade
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.Rank
import d20.engine.pf2e.Resistance
import d20.engine.pf2e.ShieldKind
import d20.engine.schema.AbilityCategory
import d20.engine.schema.AbilityStation
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.DashboardValidator
import d20.engine.schema.PfClass
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.classDc
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class PathbuilderImportTest {
    private val pb = PathbuilderParser.parse(fixture("ezren.json"))
    private val r = PathbuilderImport.build(pb, "char-1")
    private val d = r.dashboard
    private inline fun <reified T> lib() = d.library.filterIsInstance<T>()

    @Test
    fun `ability scores become modifiers`() {
        assertEquals(4, d.character.mod(Ability.INT))
        assertEquals(-1, d.character.mod(Ability.CHA))
        assertEquals(0, d.character.mod(Ability.STR))
        assertEquals(2, d.character.mod(Ability.DEX))
    }

    @Test
    fun `class rank, saves and HP come from the build`() {
        assertEquals(PfClass.WIZARD, d.characterClass)
        assertEquals(5, d.character.level)
        assertEquals(Rank.TRAINED, d.character.classRank)
        assertEquals(Ability.INT, d.character.keyAbility)
        assertEquals(10 + 4 + 7, d.classDc())
        assertEquals(Rank.EXPERT, d.character.saveRank(CheckKind.WILL))
        assertEquals(Rank.TRAINED, d.character.saveRank(CheckKind.FORTITUDE))
        assertEquals(8 + 0 + 5 * (6 + 0 + 1), lib<ResourceStation>().single().maxHp)
    }

    @Test
    fun `weapon attack ability is inferred from the attack total`() {
        val staff = lib<ActionStation>().single().weapon
        assertEquals("Staff", staff.name)
        assertEquals(Ability.STR, staff.attackAbility)
        assertEquals(Rank.TRAINED, staff.rank)
        assertEquals(DamageType.BLUDGEONING, staff.damageType)
        val dex = pb.copy(weapons = pb.weapons.map { it.copy(attack = 9) })
        assertEquals(Ability.DEX, PathbuilderImport.build(dex, "c").dashboard.library.filterIsInstance<ActionStation>().single().weapon.attackAbility)
    }

    @Test
    fun `same spell listed at several ranks becomes one module`() {
        val gust = lib<AbilityStation>().filter { it.name == "Gust of Wind" }
        assertEquals(1, gust.size)
        assertEquals(3, gust.single().level)
        assertEquals(AbilityCategory.SPELL, gust.single().category)
    }

    @Test
    fun `known damage spell becomes a spell module, others become abilities`() {
        val spells = lib<SpellStation>().associateBy { it.spell.name }
        assertEquals(4, spells.getValue("Arco Elétrico").spell.diceCount) // truque no nível 3
        assertEquals(6, spells.getValue("Bola de Fogo (3º)").spell.diceCount)
        assertTrue(spells.getValue("Bola de Fogo (3º)").spell.fromClass)
        assertTrue(spells.containsKey("Atordoar"))
        assertTrue(lib<AbilityStation>().any { it.name == "Invisibility" && it.level == 2 })
        assertTrue(lib<AbilityStation>().any { it.name == "Force Bolt" && it.category == AbilityCategory.FOCUS_SPELL })
        assertTrue(r.items.any { it.group == ImportGroup.OTHER_SPELLS })
    }

    @Test
    fun `potions keep their grade and quantity`() {
        val potion = lib<ConsumableStation>().single().consumable
        assertEquals(ConsumableKind.HEALING_POTION, potion.kind)
        assertEquals(ConsumableGrade.LESSER, potion.grade)
        assertEquals(2, potion.quantity)
    }

    @Test
    fun `skills, lores and feats are imported`() {
        val skills = lib<SkillStation>().associateBy { it.title }
        assertEquals(Rank.EXPERT, skills.getValue("Arcanismo").check.rank)
        assertEquals(1, skills.getValue("Diplomacia").check.itemBonus)
        assertEquals(2, skills.getValue("Saber: Academia").check.itemBonus)
        assertEquals(CheckKind.LORE, skills.getValue("Saber: Genie").check.kind)
        assertNull(skills["Atletismo"]) // destreinado não entra
        val feats = lib<AbilityStation>().associateBy { it.name }
        assertEquals(AbilityCategory.CLASS_FEAT, feats.getValue("Reach Spell").category)
        assertEquals(AbilityCategory.SKILL_FEAT, feats.getValue("Assurance (Arcana)").category)
        assertEquals(AbilityCategory.CLASS_FEATURE, feats.getValue("Arcane Bond").category)
    }

    @Test
    fun `armor, shield and resistances go to the resource module`() {
        val res = lib<ResourceStation>().single()
        assertEquals("Roupas de explorador", res.armor.name)
        assertEquals(ShieldKind.WOODEN, res.shield)
        assertEquals(listOf(Resistance(DamageType.FIRE, 5)), res.armor.resistances)
    }

    @Test
    fun `missing gear imports with warnings`() {
        val bare = pb.copy(weapons = emptyList(), armor = listOf(PbArmor("Spellguard Shield", "shield", 0, "", true, emptyList())))
        val out = PathbuilderImport.build(bare, "c")
        val res = out.dashboard.library.filterIsInstance<ResourceStation>().single()
        assertEquals("Sem armadura", res.armor.name)
        assertNull(res.shield)
        assertEquals(1, out.warnings.count { "Spellguard Shield" in it })
        assertEquals(emptyList(), DashboardValidator.validate(out.dashboard))
    }

    @Test
    fun `imported dashboard is valid and fills three zones`() {
        assertEquals(emptyList(), DashboardValidator.validate(d))
        assertEquals(listOf("Staff", "Arco Elétrico"), d.zones.zone1.stations.map { it.title })
        assertEquals(4, d.zones.zone2.stations.size)
        assertTrue(d.zones.zone3.stations[0] is ResourceStation)
        assertTrue(d.zones.zone3.stations[1] is ConditionsStation)
        assertTrue(d.library.all { it.id.startsWith("lib-") })
        assertTrue(d.zones.all().flatMap { it.second.stations }.all { it.id.startsWith("st-") })
    }

    @Test
    fun `deselecting a group removes it from the library only`() {
        val kept = PathbuilderImport.select(r, ImportGroup.entries.toSet() - ImportGroup.FEATS)
        assertTrue(kept.library.none { it is AbilityStation && it.category == AbilityCategory.CLASS_FEAT })
        assertTrue(kept.library.any { it is SpellStation })
        assertEquals(d.zones, kept.zones)
    }

    @Test
    fun `feats with different choices stay separate modules`() {
        val twice = pb.copy(feats = pb.feats + PbFeat("Assurance", "Athletics", "Skill Feat", 4))
        val names = PathbuilderImport.build(twice, "c").dashboard.library.filterIsInstance<AbilityStation>().map { it.name }
        assertTrue("Assurance (Arcana)" in names, names.toString())
        assertTrue("Assurance (Athletics)" in names, names.toString())
    }
}
