package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.pf2e.SpellMode
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.ModuleLibrary
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station
import d20.engine.schema.StationType
import d20.engine.schema.ZoneKey
import d20.engine.schema.effectiveColor
import d20.engine.schema.type

/** What the add-module sheet hands back: a blank module of a type, or a copy of a basic/saved module. */
class AddModuleActions(
    val onBlank: (StationType) -> Unit,
    val onPick: (Station) -> Unit,
    val onDeleteSaved: (String) -> Unit,
    val onDismiss: () -> Unit,
)

/**
 * Step 1 picks the kind of module; step 2 offers "Criar do zero", the user's saved modules and the basic ones.
 * Picking any of them copies it into the zone and opens the editor, so the original is never changed.
 */
@Composable
fun AddModuleSheet(zone: ZoneKey, saved: List<Station>, actions: AddModuleActions) {
    var type by remember { mutableStateOf<StationType?>(null) }
    val chosen = type
    NeoSheet(
        title = if (chosen == null) "Adicionar módulo · ${zone.ptName}" else chosen.ptName,
        onDismiss = actions.onDismiss,
        footer = {
            if (chosen != null) NeoButton("Voltar", { type = null }, ghost = true, modifier = Modifier.weight(1f))
        },
    ) {
        if (chosen == null) {
            StationType.entries.forEach { t ->
                val options = ModuleLibrary.forType(t).size + saved.count { it.type() == t }
                NeoSurface(
                    Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), shadowOffset = 3.dp,
                    onClick = { if (options == 0) actions.onBlank(t) else type = t },
                ) {
                    Row(Modifier.padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(t.ptName, color = D20.colors.text, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                        Text(if (options == 0) "criar" else "$options opções  ›", color = D20.colors.muted, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                    }
                }
            }
        } else {
            NeoButton("＋ Criar do zero", { actions.onBlank(chosen) }, modifier = Modifier.fillMaxWidth())
            val mine = saved.filter { it.type() == chosen }
            if (mine.isNotEmpty()) {
                SectionTitle("Meus módulos")
                mine.forEach { s -> ModuleRow(s, onClick = { actions.onPick(s) }, onDelete = { actions.onDeleteSaved(s.id) }) }
            }
            ModuleLibrary.forType(chosen).groupBy { it.group }.forEach { (group, templates) ->
                SectionTitle(group)
                templates.forEach { t -> ModuleRow(t.station, onClick = { actions.onPick(t.station) }) }
            }
        }
    }
}

@Composable
private fun ModuleRow(station: Station, onClick: () -> Unit, onDelete: (() -> Unit)? = null) {
    val c = D20.colors
    NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), shadowOffset = 3.dp, onClick = onClick) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(Modifier.size(14.dp).clip(CircleShape).background(station.effectiveColor().fill()).border(2.dp, c.line, CircleShape))
            Column(Modifier.weight(1f)) {
                Text(station.title, color = c.text, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1)
                Text(summary(station), color = c.muted, fontWeight = FontWeight.Medium, fontSize = 11.5.sp, maxLines = 2)
            }
            if (onDelete != null) {
                Box(
                    Modifier.size(28.dp).clip(CircleShape).border(2.dp, c.line, CircleShape).clickableNoRipple(onDelete),
                    contentAlignment = Alignment.Center,
                ) { Text("✕", color = c.text, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
            }
        }
    }
}

/** One-line description of a module for the picker (dice, type, traits, uses). */
private fun summary(s: Station): String = when (s) {
    is ActionStation -> buildList {
        add("${s.weapon.totalDice}${s.weapon.die.label} ${s.weapon.damageType.ptName}")
        add(s.weapon.attackAbility.abbr)
        if (s.weapon.agile) add("ágil")
        s.weapon.traits.forEach { add(it.ptName) }
        if (s.weapon.potency > 0) add("+${s.weapon.potency}")
        s.weapon.elemental.forEach { add(it.ptName) }
    }.joinToString(" · ")
    is SpellStation -> "${s.spell.diceCount}${s.spell.die.label} ${s.spell.damageType.ptName} · " +
        (if (s.spell.mode == SpellMode.ATTACK) "ataque mágico" else "CD · ${s.spell.targetSave.ptName} básico") + " · ${s.spell.castingAbility.abbr}"
    is SkillStation -> buildList {
        add(s.check.kind.ptName)
        s.effects.forEach { add(it.describe()) }
    }.joinToString(" · ")
    is ConsumableStation -> "${s.consumable.kind.ptName} ${s.consumable.grade.ptName} · ×${s.consumable.quantity}" +
        s.consumable.effects.joinToString("") { " · ${it.describe()}" }
    is ResourceStation -> "PV ${s.maxHp}" + (s.shield?.let { " · ${it.ptName}" } ?: "")
    is ConditionsStation -> "Condições, venenos e turnos"
}
