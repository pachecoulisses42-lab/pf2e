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
                    is SkillStation -> check(key, s.check)
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
    }

    private fun check(key: String, c: CheckSpec) = buildList {
        if (c.itemBonus !in 0..4) add("$key: bônus de item deve ser +0..+4")
        c.customName?.let { if (it.isNotEmpty() && !Text.isValid(it)) add("$key: nome customizado inválido") }
    }

    private fun resource(key: String, r: ResourceStation) = buildList {
        if (r.maxHp !in 1..999) add("$key: PV máximo deve ser 1..999")
        val a: ArmorSpec = r.armor
        if (a.itemBonus !in 0..4) add("$key: bônus de item da armadura deve ser +0..+4")
        if (a.dexCap !in 0..5) add("$key: limite de Destreza deve ser 0..5")
    }
}
