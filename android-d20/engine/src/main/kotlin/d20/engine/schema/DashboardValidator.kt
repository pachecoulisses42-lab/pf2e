package d20.engine.schema

import d20.engine.pf2e.Ability
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.WeaponSpec

/** Structural validation run before a dashboard is frozen ("Salvar & Travar") or imported/exported. */
object DashboardValidator {
    fun validate(d: Dashboard): List<String> {
        val errors = mutableListOf<String>()
        if (d.schemaVersion != Dashboard.SCHEMA_VERSION) errors += "Versão de schema não suportada: ${d.schemaVersion}"
        if (d.ruleSystem != Dashboard.RULE_SYSTEM_PF2E) errors += "Sistema de regras desconhecido: ${d.ruleSystem}"
        if (d.characterId.isBlank()) errors += "characterId vazio"
        if (!Text.isValid(d.name)) errors += "Nome do personagem inválido (1 a ${Text.MAX_LENGTH} caracteres, sem controle)"

        if (d.character.level !in 1..20) errors += "O nível deve estar entre 1 e 20"
        for (a in Ability.entries) {
            val m = d.character.abilityMods[a]
            if (m == null) errors += "Falta o modificador de ${a.ptName}"
            else if (m !in -5..10) errors += "Modificador de ${a.ptName} fora de -5..+10"
        }

        val ids = mutableSetOf<String>()
        for ((key, zone) in d.zones.all()) {
            if (zone.stations.size > zone.layout.slots) {
                errors += "$key: ${zone.stations.size} estações excedem os ${zone.layout.slots} slots de ${zone.layout}"
            }
            for (s in zone.stations) {
                if (s.id.isBlank() || !ids.add(s.id)) errors += "$key: id de estação vazio ou duplicado (${s.id})"
                errors += when (s) {
                    is ActionStation -> weapon(key, s.weapon)
                    is SpellStation -> spell(key, s.spell)
                    is SkillStation -> check(key, s.check) + effects(key, s.effects)
                    is ConsumableStation -> consumable(key, s.consumable)
                    is ConditionsStation -> emptyList()
                    is ResourceStation -> resource(key, s)
                }
            }
        }
        return errors
    }

    private fun weapon(key: String, w: WeaponSpec) = buildList {
        if (!Text.isValid(w.name)) add("$key: nome da arma inválido")
        if (w.diceCount !in 1..4) add("$key: quantidade de dados da arma deve ser 1..4")
        if (w.potency !in 0..3) add("$key: runa de potência deve ser +0..+3")
        if (w.elemental.size > 3) add("$key: no máximo 3 runas elementais")
        if (w.elemental.distinct().size != w.elemental.size) add("$key: runa elemental repetida")
        if (w.traits.count { it.deadly != null } > 1) add("$key: só um traço Mortal por arma")
        if (w.traits.count { it.fatal != null } > 1) add("$key: só um traço Fatal por arma")
        if (w.traits.distinct().size != w.traits.size) add("$key: traço repetido")
    }

    private fun spell(key: String, s: SpellSpec) = buildList {
        if (!Text.isValid(s.name)) add("$key: nome da magia inválido")
        if (s.diceCount !in 1..12) add("$key: quantidade de dados da magia deve ser 1..12")
        if (s.extras.size > 6) add("$key: no máximo 6 danos extras")
        s.extras.forEachIndexed { i, e ->
            val n = "$key: dano extra ${i + 1}"
            if (e.diceCount !in 0..10) add("$n: dados devem ser 0..10")
            if (e.flat !in -10..30) add("$n: valor fixo deve ser −10..+30")
            if (e.diceCount == 0 && e.flat == 0) add("$n: informe dados ou valor fixo")
        }
    }

    private fun check(key: String, c: CheckSpec) = buildList {
        if (c.itemBonus !in 0..4) add("$key: bônus de item deve ser +0..+4")
        c.customName?.let { if (it.isNotEmpty() && !Text.isValid(it)) add("$key: nome customizado inválido") }
    }

    private fun effects(key: String, list: List<d20.engine.conditions.ConditionEffect>) = buildList {
        if (list.size > 3) add("$key: no máximo 3 efeitos de condição")
        for (e in list) {
            if (e.condition.valued && e.value !in 1..4) add("$key: valor de ${e.condition.ptName} deve ser 1..4")
            if (e.rounds != null && e.rounds !in 1..10) add("$key: duração deve ser 1..10 rodadas")
        }
    }

    private fun consumable(key: String, c: d20.engine.pf2e.ConsumableSpec) = buildList {
        if (c.name.isNotEmpty() && !Text.isValid(c.name)) add("$key: nome do item inválido")
        if (c.grade !in d20.engine.pf2e.ConsumableTables.grades(c.kind)) add("$key: ${c.kind.ptName} não existe no grau ${c.grade.ptName}")
        if (c.quantity !in 0..99) add("$key: quantidade deve ser 0..99")
        addAll(effects(key, c.effects))
    }

    private fun resource(key: String, r: ResourceStation) = buildList {
        if (r.maxHp !in 1..999) add("$key: PV máximo deve ser 1..999")
        val a: ArmorSpec = r.armor
        if (a.name.isNotEmpty() && !Text.isValid(a.name)) add("$key: nome da armadura inválido")
        if (a.itemBonus !in 0..6) add("$key: bônus de CA da armadura deve ser +0..+6")
        if (a.dexCap !in 0..6) add("$key: limite de Destreza deve ser 0..6")
        if (a.checkPenalty !in 0..5) add("$key: penalidade de armadura deve ser 0..−5")
        if (a.speedPenalty !in 0..20) add("$key: penalidade de deslocamento deve ser 0..20 pés")
        if (a.strength != null && a.strength !in -1..6) add("$key: Força exigida deve ser −1..+6")
        if (a.potency !in 0..3) add("$key: runa de potência deve ser +0..+3")
        if (a.resilient !in 0..3) add("$key: runa de resiliência deve ser +0..+3")
        if (a.skillRunes.size > 4) add("$key: no máximo 4 runas de perícia")
        if (a.skillRunes.any { it.bonus !in 1..3 }) add("$key: runa de perícia deve dar +1..+3")
        if (a.resistances.size > 5) add("$key: no máximo 5 resistências")
        if (a.resistances.any { it.value !in 1..30 }) add("$key: resistência deve ser 1..30")
        if (a.resistances.map { it.type }.distinct().size != a.resistances.size) add("$key: resistência repetida")
    }
}
