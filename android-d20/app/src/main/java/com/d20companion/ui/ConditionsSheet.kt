package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.conditions.ActiveCondition
import d20.engine.conditions.Affliction
import d20.engine.conditions.AfflictionCatalog
import d20.engine.conditions.AfflictionStage
import d20.engine.conditions.AfflictionState
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.DurationUnit
import d20.engine.conditions.PersistentDamage
import d20.engine.conditions.PersistentSpec
import d20.engine.conditions.PlayState
import d20.engine.conditions.StageCondition
import d20.engine.conditions.StageDuration
import d20.engine.conditions.TurnPhase
import d20.engine.conditions.TurnProposal
import d20.engine.core.DieType
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.DamageType
import d20.engine.schema.CardColor
import d20.engine.schema.Text as SchemaText

class ConditionsActions(
    val onClose: () -> Unit,
    val onStartTurn: () -> Unit,
    val onEndTurn: () -> Unit,
    val onToggleItem: (String) -> Unit,
    val onApply: () -> Unit,
    val onDiscard: () -> Unit,
    val onRemoveCondition: (String) -> Unit,
    val onRemovePersistent: (String) -> Unit,
    val onToggleAssist: (String) -> Unit,
    val onEndStage: (String) -> Unit,
    val onRemoveAffliction: (String) -> Unit,
    val onAddCondition: (ConditionKind, Int, Int?) -> Unit,
    val onAddPersistent: (PersistentSpec, Boolean) -> Unit,
    val onAddAffliction: (Affliction, Int) -> Unit,
)

/**
 * The conditions module: what affects your character, the Start/End-turn buttons, and the confirmable list of
 * everything the app rolled for you. Nothing changes until you tick items and apply them.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ConditionsSheet(play: PlayState, proposal: TurnProposal?, selected: Set<String>, messages: List<String>, actions: ConditionsActions) {
    val c = D20.colors
    NeoSheet(title = "Condições", onDismiss = actions.onClose) {
        // ---- what is active ----
        val empty = play.conditions.isEmpty() && play.persistent.isEmpty() && play.afflictions.isEmpty()
        if (empty) Text("Nenhuma condição ativa.", color = c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
            play.conditions.forEach { cond ->
                val rounds = cond.roundsLeft?.let { " · $it rod." } ?: ""
                NeoChip(cond.kind.label(cond.value) + rounds + "  ✕", fill = CardColor.ROSA.fill(), textColor = Ink, onClick = { actions.onRemoveCondition(cond.id) })
            }
            play.persistent.forEach { p ->
                NeoChip("Persistente ${p.spec.notation} ${p.spec.type.ptName}" + (if (p.assisted) " (ajuda)" else "") + "  ✕", fill = p.spec.type.chipColor(), textColor = Ink, onClick = { actions.onRemovePersistent(p.id) })
            }
        }
        play.persistent.forEach { p ->
            SwitchRow("Ajuda para estancar (${p.spec.type.ptName}, teste CD 10)", p.assisted) { actions.onToggleAssist(p.id) }
        }
        play.afflictions.forEach { a -> AfflictionCard(a, actions) }

        // ---- turn buttons ----
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            NeoButton("Início do turno", actions.onStartTurn, ghost = true, modifier = Modifier.weight(1f))
            NeoButton("Fim do turno", actions.onEndTurn, modifier = Modifier.weight(1f))
        }

        // ---- proposal ----
        if (proposal != null) {
            SectionTitle(if (proposal.phase == TurnPhase.START) "Início do turno · confirme" else if (proposal.phase == TurnPhase.END) "Fim do turno · confirme" else "Fim do estágio · confirme")
            if (proposal.items.isEmpty()) {
                Text("Nada a processar agora.", color = c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            }
            proposal.items.forEach { item ->
                val on = item.id in selected
                NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.surface, shadowOffset = 3.dp, onClick = { actions.onToggleItem(item.id) }) {
                    Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        NeoSurface(Modifier.size(22.dp), fill = if (on) c.brand else c.surface, radius = 6.dp, shadowOffset = 0.dp, contentAlignment = Alignment.Center) {
                            if (on) Text("✓", color = c.onBrand, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                        }
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
                            Text(item.title, color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 12.5.sp)
                            Text(item.detail, color = c.muted, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            item.roll?.let { Text(it, color = c.brand, fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                        }
                    }
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                NeoButton("Descartar", actions.onDiscard, ghost = true, modifier = Modifier.weight(1f))
                NeoButton("Aplicar ${selected.size} selecionados", actions.onApply, enabled = proposal.items.isNotEmpty(), modifier = Modifier.weight(2f))
            }
        }
        messages.forEach { m ->
            NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = CardColor.MOSTARDA.fill(), shadowOffset = 3.dp) {
                Text(m, color = Ink, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(10.dp))
            }
        }

        // ---- adding things ----
        SectionTitle("Adicionar")
        AddForms(actions)
    }
}

@Composable
private fun AfflictionCard(a: AfflictionState, actions: ConditionsActions) {
    val c = D20.colors
    val aff = a.affliction
    NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = CardColor.VIOLETA.fill(), shadowOffset = 3.dp) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Text("${aff.name} · estágio ${a.stage}/${aff.stages.size}", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
            val dur = aff.stages[(a.stage - 1).coerceIn(0, aff.stages.lastIndex)].duration
            val timing = if (a.roundsLeft != null) "${a.roundsLeft} rodadas até o próximo teste" else "estágio dura ${dur.value} ${dur.unit.ptName}: toque em \"Fim do estágio\" quando passar"
            Text("Teste de ${aff.save.ptName} CD ${aff.dc} · $timing" + (a.maxRoundsLeft?.let { " · máx. $it rod." } ?: ""), color = Ink, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (a.roundsLeft == null) NeoButton("Fim do estágio", { actions.onEndStage(a.id) }, modifier = Modifier.weight(1f))
                NeoButton("Remover", { actions.onRemoveAffliction(a.id) }, ghost = true, modifier = Modifier.weight(1f))
            }
        }
    }
}

private enum class AddKind(val ptName: String) { CONDITION("+ Condição"), PERSISTENT("+ Dano persistente"), POISON("+ Veneno") }

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AddForms(actions: ConditionsActions) {
    var open by remember { mutableStateOf<AddKind?>(null) }
    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        AddKind.entries.forEach { k -> Pill(k.ptName, selected = open == k, onClick = { open = if (open == k) null else k }) }
    }
    when (open) {
        AddKind.CONDITION -> {
            var kind by remember { mutableStateOf(ConditionKind.FRIGHTENED) }
            var value by remember { mutableStateOf(1) }
            var rounds by remember { mutableStateOf(0) }
            Dropdown("Condição", ConditionKind.entries, kind, { it.ptName }, { kind = it })
            if (kind.valued) Stepper("Valor", value, 1..4, { value = it })
            Stepper("Duração (rodadas)", rounds, 0..10, { rounds = it }, display = { if (it == 0) "até remover" else "$it" })
            NeoButton("Adicionar condição", { actions.onAddCondition(kind, value, rounds.takeIf { it > 0 }); open = null })
        }
        AddKind.PERSISTENT -> {
            var dice by remember { mutableStateOf(1) }
            var die by remember { mutableStateOf(DieType.D6) }
            var flat by remember { mutableStateOf(0) }
            var type by remember { mutableStateOf(DamageType.FIRE) }
            var assisted by remember { mutableStateOf(false) }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Stepper("Dados (0 = fixo)", dice, 0..8, { dice = it }, Modifier.weight(1f))
                Dropdown("Tipo de dado", DieType.entries, die, { it.label }, { die = it }, Modifier.weight(1f))
            }
            Stepper("Dano fixo", flat, 0..20, { flat = it })
            Dropdown("Tipo de dano", DamageType.entries, type, { it.ptName }, { type = it })
            SwitchRow("Com ajuda para estancar (CD 10)", assisted) { assisted = it }
            NeoButton("Adicionar dano persistente", {
                val spec = PersistentSpec(dice, if (dice > 0) die else null, flat, type)
                if (dice > 0 || flat > 0) { actions.onAddPersistent(spec, assisted); open = null }
            }, enabled = dice > 0 || flat > 0)
        }
        AddKind.POISON -> PoisonForm(actions)
        null -> Unit
    }
}

private val customLabel = "Veneno personalizado…"

private data class StageDraft(
    val dice: Int = 0, val die: DieType = DieType.D6, val cond: ConditionKind? = null, val condValue: Int = 1,
    val durValue: Int = 1, val unit: DurationUnit = DurationUnit.ROUNDS,
)

@Composable
private fun PoisonForm(actions: ConditionsActions) {
    val options: List<Affliction?> = AfflictionCatalog.all + listOf<Affliction?>(null)
    var picked by remember { mutableStateOf<Affliction?>(AfflictionCatalog.all.first()) }
    var custom by remember { mutableStateOf(false) }
    var stage by remember { mutableStateOf(1) }
    Dropdown("Veneno", options, if (custom) null else picked, { it?.name ?: customLabel }, { o ->
        if (o == null) custom = true else { custom = false; picked = o }
        stage = 1
    })
    if (!custom) {
        val a = picked ?: return
        Text("Teste de ${a.save.ptName} CD ${a.dc} · ${a.stages.size} estágios" + (a.maxRounds?.let { " · máx. $it rodadas" } ?: ""), color = D20.colors.muted, fontSize = 11.sp, fontWeight = FontWeight.Medium)
        Stepper("Estágio inicial (falhou o teste inicial: 1; falha crítica: 2)", stage.coerceAtMost(a.stages.size), 1..a.stages.size, { stage = it })
        NeoButton("Adicionar ${a.name}", { actions.onAddAffliction(a, stage.coerceAtMost(a.stages.size)) })
    } else {
        var name by remember { mutableStateOf("") }
        var save by remember { mutableStateOf(CheckKind.FORTITUDE) }
        var dc by remember { mutableStateOf(20) }
        var drafts by remember { mutableStateOf(listOf(StageDraft(), StageDraft(), StageDraft())) }
        var count by remember { mutableStateOf(3) }
        NameField("Nome do veneno (texto livre)", name) { name = it }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Dropdown("Resistência", listOf(CheckKind.FORTITUDE, CheckKind.REFLEX, CheckKind.WILL), save, { it.ptName }, { save = it }, Modifier.weight(1f))
            Stepper("CD", dc, 10..50, { dc = it }, Modifier.weight(1f))
        }
        Stepper("Quantidade de estágios", count, 1..3, { count = it })
        drafts.take(count).forEachIndexed { i, d ->
            fun set(n: StageDraft) { drafts = drafts.mapIndexed { j, o -> if (j == i) n else o } }
            SectionTitle("Estágio ${i + 1}")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Stepper("Dados de dano (0 = nenhum)", d.dice, 0..20, { set(d.copy(dice = it)) }, Modifier.weight(1f))
                Dropdown("Tipo de dado", DieType.entries, d.die, { it.label }, { set(d.copy(die = it)) }, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Dropdown("Condição", listOf<ConditionKind?>(null) + ConditionKind.entries, d.cond, { it?.ptName ?: "Nenhuma" }, { set(d.copy(cond = it)) }, Modifier.weight(1f))
                if (d.cond?.valued == true) Stepper("Valor", d.condValue, 1..4, { set(d.copy(condValue = it)) }, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Stepper("Duração", d.durValue, 1..10, { set(d.copy(durValue = it)) }, Modifier.weight(1f))
                Dropdown("Unidade", DurationUnit.entries, d.unit, { it.ptName }, { set(d.copy(unit = it)) }, Modifier.weight(1f))
            }
        }
        val ready = SchemaText.isValid(SchemaText.sanitize(name))
        NeoButton("Adicionar veneno personalizado", {
            val stages = drafts.take(count).map { d ->
                AfflictionStage(
                    damage = if (d.dice > 0) PersistentSpec(d.dice, d.die, 0, DamageType.POISON) else null,
                    conditions = d.cond?.let { listOf(StageCondition(it, if (it.valued) d.condValue else 1)) } ?: emptyList(),
                    duration = StageDuration(d.durValue, d.unit),
                )
            }
            actions.onAddAffliction(Affliction(SchemaText.sanitize(name), save, dc, stages), 1)
        }, enabled = ready)
    }
}
