package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.ElementalRune
import d20.engine.pf2e.Rank
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.StrikingRune
import d20.engine.pf2e.WeaponSpec
import d20.engine.schema.ActionStation
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station
import d20.engine.schema.Text as SchemaText

private val physicalTypes = listOf(DamageType.SLASHING, DamageType.BLUDGEONING, DamageType.PIERCING)
private val saveKinds = listOf(CheckKind.FORTITUDE, CheckKind.REFLEX, CheckKind.WILL)

/** Setup-mode editor for one station. Every field is a selection except the optional custom name. */
@Composable
fun StationEditorDialog(
    station: Station,
    onSave: (Station) -> Unit,
    onDelete: () -> Unit,
    onDismiss: () -> Unit,
) {
    var draft by remember(station.id) { mutableStateOf(station) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(titleFor(draft)) },
        text = {
            Column(
                Modifier.heightIn(max = 460.dp).verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                when (val s = draft) {
                    is ActionStation -> WeaponForm(s.weapon) { draft = s.copy(weapon = it) }
                    is SpellStation -> SpellForm(s.spell) { draft = s.copy(spell = it) }
                    is SkillStation -> CheckForm(s.check) { draft = s.copy(check = it) }
                    is ResourceStation -> ResourceForm(s) { draft = it }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(sanitized(draft)) }) { Text("Aplicar") }
        },
        dismissButton = {
            Row {
                TextButton(onClick = onDelete) { Text("Remover", color = MaterialTheme.colorScheme.error) }
                TextButton(onClick = onDismiss) { Text("Cancelar") }
            }
        },
    )
}

private fun titleFor(s: Station) = when (s) {
    is ActionStation -> "Ataque com arma"
    is SpellStation -> "Magia"
    is SkillStation -> "Perícia / Resistência"
    is ResourceStation -> "Vida & Defesa"
}

/** Free-text names get a final clean-up (and fall back to a default if emptied). */
private fun sanitized(s: Station): Station = when (s) {
    is ActionStation -> s.copy(weapon = s.weapon.copy(name = SchemaText.sanitize(s.weapon.name).ifBlank { "Arma" }))
    is SpellStation -> s.copy(spell = s.spell.copy(name = SchemaText.sanitize(s.spell.name).ifBlank { "Magia" }))
    is SkillStation -> s.copy(check = s.check.copy(customName = s.check.customName?.let(SchemaText::sanitize)?.ifBlank { null }))
    is ResourceStation -> s
}

@Composable
private fun WeaponForm(w: WeaponSpec, onChange: (WeaponSpec) -> Unit) {
    NameField("Nome da arma (texto livre)", w.name) { onChange(w.copy(name = it)) }
    Dropdown("Atributo primário (FOR: acerto + dano · outros: só acerto)", Ability.entries, w.attackAbility, { "${it.abbr} · ${it.ptName}" }, { onChange(w.copy(attackAbility = it)) })
    Dropdown("Proficiência (T/E/M/L)", Rank.entries, w.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(w.copy(rank = it)) })
    SectionTitle("Dano base")
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        Stepper("Quantidade de dados", w.diceCount, 1..4, { onChange(w.copy(diceCount = it)) }, Modifier.weight(1f))
        Dropdown("Tipo de dado", DieType.entries, w.die, { it.label }, { onChange(w.copy(die = it)) }, Modifier.weight(1f))
    }
    Dropdown("Tipo de dano", physicalTypes, w.damageType, { it.ptName }, { onChange(w.copy(damageType = it)) })
    SectionTitle("Runas")
    Stepper("Runa de potência (acerto)", w.potency, 0..3, { onChange(w.copy(potency = it)) }, display = { if (it == 0) "—" else "+$it" })
    Dropdown("Runa de impacto (dados extras)", StrikingRune.entries, w.striking, { it.ptName }, { onChange(w.copy(striking = it)) })
    for (slot in 0 until 3) {
        val current: ElementalRune? = w.elemental.getOrNull(slot)
        Dropdown(
            label = "Runa elemental ${slot + 1} (+1d6)",
            options = listOf<ElementalRune?>(null) + ElementalRune.entries,
            selected = current,
            labelOf = { it?.let { r -> "${r.ptName} (${r.damageType.ptName})" } ?: "Nenhuma" },
            onSelect = { picked ->
                // Rebuild the list slot by slot so each rune keeps its own field and none repeats.
                val slots = List(3) { i -> if (i == slot) picked else w.elemental.getOrNull(i) }
                onChange(w.copy(elemental = slots.filterNotNull().distinct()))
            },
        )
    }
    SectionTitle("Especialização")
    SwitchRow("Especialização maior (dobra o dano por T/E/M/L)", w.greaterSpecialization) { onChange(w.copy(greaterSpecialization = it)) }
    SwitchRow("Arma ágil (ataque múltiplo −4/−8)", w.agile) { onChange(w.copy(agile = it)) }
}

@Composable
private fun SpellForm(s: SpellSpec, onChange: (SpellSpec) -> Unit) {
    NameField("Nome da magia (texto livre)", s.name) { onChange(s.copy(name = it)) }
    Dropdown("Tipo", SpellMode.entries, s.mode, { it.ptName }, { onChange(s.copy(mode = it)) })
    Dropdown("Atributo de conjuração", Ability.entries, s.castingAbility, { "${it.abbr} · ${it.ptName}" }, { onChange(s.copy(castingAbility = it)) })
    Dropdown("Proficiência (T/E/M/L)", Rank.entries, s.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(s.copy(rank = it)) })
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        Stepper("Dados de dano", s.diceCount, 1..12, { onChange(s.copy(diceCount = it)) }, Modifier.weight(1f))
        Dropdown("Tipo de dado", DieType.entries, s.die, { it.label }, { onChange(s.copy(die = it)) }, Modifier.weight(1f))
    }
    Dropdown("Tipo de dano", DamageType.entries, s.damageType, { it.ptName }, { onChange(s.copy(damageType = it)) })
    if (s.mode == SpellMode.SAVE) {
        Dropdown("Resistência do alvo", saveKinds, s.targetSave, { it.ptName }, { onChange(s.copy(targetSave = it)) })
    }
}

@Composable
private fun CheckForm(c: CheckSpec, onChange: (CheckSpec) -> Unit) {
    Dropdown("Perícia / resistência", CheckKind.entries, c.kind, { it.ptName }, { onChange(c.copy(kind = it)) })
    Dropdown("Proficiência (T/E/M/L)", Rank.entries, c.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(c.copy(rank = it)) })
    Dropdown(
        "Atributo", listOf<Ability?>(null) + Ability.entries, c.abilityOverride,
        { it?.let { a -> "${a.abbr} · ${a.ptName}" } ?: "Padrão (${c.kind.defaultAbility.abbr})" },
        { onChange(c.copy(abilityOverride = it)) },
    )
    Stepper("Bônus de item", c.itemBonus, 0..4, { onChange(c.copy(itemBonus = it)) }, display = { if (it == 0) "—" else "+$it" })
    NameField("Nome customizado (opcional, texto livre)", c.customName.orEmpty()) { onChange(c.copy(customName = it)) }
}

@Composable
private fun ResourceForm(r: ResourceStation, onChange: (ResourceStation) -> Unit) {
    Stepper("PV máximos", r.maxHp, 1..999, { onChange(r.copy(maxHp = it)) }, step = 1)
    Stepper("PV máximos (±10)", r.maxHp, 1..999, { onChange(r.copy(maxHp = it)) }, step = 10)
    SectionTitle("Armadura")
    Dropdown("Proficiência na armadura", Rank.entries, r.armor.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(r.copy(armor = r.armor.copy(rank = it))) })
    Stepper("Bônus de item da armadura", r.armor.itemBonus, 0..4, { onChange(r.copy(armor = r.armor.copy(itemBonus = it))) }, display = { if (it == 0) "—" else "+$it" })
    Stepper("Limite de Destreza", r.armor.dexCap, 0..5, { onChange(r.copy(armor = r.armor.copy(dexCap = it))) })
}
