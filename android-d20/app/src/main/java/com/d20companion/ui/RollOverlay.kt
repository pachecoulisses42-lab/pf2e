package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import d20.engine.core.Degree
import d20.engine.play.DamageChoice
import d20.engine.play.DamageSummary
import d20.engine.play.RollOutcome
import d20.engine.play.Tone
import d20.engine.play.degreeName
import kotlinx.coroutines.delay

/** The cosmetic dice animation; the guide caps it at 800 ms, the real roll is already resolved by the engine. */
private const val ANIMATION_MS = 600L
private const val FRAME_MS = 50L

class OverlayActions(
    val onChoose: (DamageChoice) -> Unit,
    val onResolveTarget: (Degree) -> Unit,
    val onApplyHeal: () -> Unit,
    val onApplyNotice: (Int) -> Unit,
    val onDismiss: () -> Unit,
)

/**
 * One-tap result: a short dice animation, then the coloured result (always with a glyph and a word) and a drawer
 * with typed damage lines, the x2/x3 choice when no target was set, notices about conditions, healing and saves.
 */
@Composable
fun RollOverlay(
    outcome: RollOutcome,
    rollId: Int,
    stationFill: Color,
    healApplied: Boolean,
    appliedNotices: Set<Int>,
    actions: OverlayActions,
) {
    val c = D20.colors
    var animating by remember(rollId) { mutableStateOf(true) }
    var shown by remember(rollId) { mutableIntStateOf(20) }
    LaunchedEffect(rollId) {
        animating = true
        var elapsed = 0L
        while (elapsed < ANIMATION_MS) {
            shown = (1..20).random()
            delay(FRAME_MS)
            elapsed += FRAME_MS
        }
        animating = false
    }

    Dialog(onDismissRequest = actions.onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        // Equal side margins; the hard shadow (7 dp) fits inside the right margin.
        Box(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 24.dp), contentAlignment = Alignment.Center) {
            RollCard(outcome, animating, shown, stationFill, healApplied, appliedNotices, actions)
        }
    }
}

/** The result card itself (split from the dialog so it can be laid out and previewed on its own). */
@Composable
fun RollCard(
    outcome: RollOutcome,
    animating: Boolean,
    shown: Int,
    stationFill: Color,
    healApplied: Boolean,
    appliedNotices: Set<Int>,
    actions: OverlayActions,
) {
    val c = D20.colors
    val toneFill = if (animating || outcome.tone == Tone.NEUTRAL) stationFill else outcome.tone.color(stationFill)
    val crit = !animating && outcome.tone == Tone.CRITICAL
    // A critical gets a gold outline on the card itself, so the frame and the shadow stay aligned.
    NeoSurface(
        Modifier.fillMaxWidth().widthIn(max = 460.dp), fill = c.surface,
        border = if (crit) ResultColors.Critical else c.line, borderWidth = if (crit) 5.dp else 4.dp, shadowOffset = 7.dp,
    ) {
        Column {
            Band(outcome, animating, toneFill)
            Column(
                Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(outcome.title.uppercase(), color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, letterSpacing = 0.5.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                Text(outcome.subtitle, color = c.muted, fontSize = 11.5.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                if (animating) {
                    Text(if (outcome.total != null || outcome.heal != null) "$shown" else "d20", color = c.text, fontSize = 64.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
                } else {
                    Result(outcome, healApplied, actions)
                    outcome.damage?.let { Damage(outcome, it, actions) }
                    Notices(outcome, appliedNotices, actions)
                }
                NeoButton("Fechar", actions.onDismiss, ghost = true, modifier = Modifier.fillMaxWidth().padding(top = 2.dp, end = 3.dp, bottom = 3.dp))
            }
        }
    }
}

@Composable
private fun Band(o: RollOutcome, animating: Boolean, fill: Color) {
    val word = if (animating) "Rolando…" else when (o.degree) {
        Degree.CRITICAL_SUCCESS -> "✦  Sucesso crítico"
        Degree.SUCCESS -> "✓  Sucesso"
        Degree.FAILURE -> "✕  Falha"
        Degree.CRITICAL_FAILURE -> "✕✕  Falha crítica"
        null -> when {
            o.heal != null -> "Cura"
            o.pendingSave != null -> "Resistência do alvo"
            o.tone == Tone.CRITICAL -> "✦  20 natural"
            o.tone == Tone.FAILURE -> "✕  1 natural"
            else -> o.title
        }
    }
    NeoSurface(Modifier.fillMaxWidth(), fill = fill, radius = 0.dp, borderWidth = 0.dp, shadowOffset = 0.dp, contentAlignment = Alignment.Center) {
        Text(word.uppercase(), color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp, letterSpacing = 0.6.sp, modifier = Modifier.padding(vertical = 9.dp))
    }
}

@Composable
private fun Result(o: RollOutcome, healApplied: Boolean, a: OverlayActions) {
    val c = D20.colors
    val numberColor = when (o.tone) {
        Tone.SUCCESS -> c.successText
        Tone.FAILURE -> c.failureText
        Tone.CRITICAL -> c.criticalText
        Tone.NEUTRAL -> c.text
    }
    when {
        o.heal != null -> {
            Text("+${o.heal} PV", color = c.successText, fontSize = 56.sp, fontWeight = FontWeight.ExtraBold)
            NeoButton(if (healApplied) "Cura aplicada" else "Aplicar cura", a.onApplyHeal, enabled = !healApplied)
        }
        o.total != null -> {
            Text("${o.total}", color = numberColor, fontSize = 72.sp, fontWeight = FontWeight.ExtraBold, lineHeight = 74.sp, textAlign = TextAlign.Center)
            o.dc?.let { Text("vs CA/CD $it", color = c.muted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
            Text(o.breakdown.joinToString("  ·  "), color = c.muted, fontSize = 10.5.sp, fontWeight = FontWeight.Medium, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
        }
        else -> Text("CD ${o.dc}", color = c.text, fontSize = 52.sp, fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun Damage(o: RollOutcome, d: DamageSummary, a: OverlayActions) {
    val c = D20.colors
    NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.sunken, shadowOffset = 3.dp) {
        Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("DANO", color = c.brand, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.sp)
            d.lines.forEach { line ->
                // Fixed-width chips keep every amount starting in the same column.
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ElementChip(line.type, Modifier.width(96.dp))
                    Text(line.text.substringAfter(": "), color = c.text, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                }
            }
            d.notes.forEach { Text(it, color = c.muted, fontSize = 10.5.sp, fontWeight = FontWeight.Medium) }
            when {
                o.pendingSave != null && d.overrideApplied == null -> TotalRow("Antes da resistência", d.normal, c.text)
                d.applied != null -> TotalRow(
                    if (d.critical == true) "Crítico" else if (d.choice == DamageChoice.TRIPLE) "×3" else "Total",
                    d.applied!!, if (d.critical == true) c.criticalText else c.text,
                )
            }
            if (d.choice == null && o.pendingSave == null) {
                Text("Como aplicar?", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                DamageChoices(d, a, showSelection = false)
            } else if (d.choice != null && o.degree == null) {
                // A roll without a target stays adjustable.
                DamageChoices(d, a, showSelection = true)
            }
            if (o.pendingSave != null) TargetSavePicker(o, a)
        }
    }
}

@Composable
private fun TotalRow(label: String, value: Int, color: Color) {
    Row(Modifier.fillMaxWidth().padding(top = 2.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label.uppercase(), color = color, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp, letterSpacing = 0.5.sp, modifier = Modifier.weight(1f))
        Text("$value", color = color, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp, lineHeight = 28.sp)
    }
}

@Composable
private fun DamageChoices(d: DamageSummary, a: OverlayActions, showSelection: Boolean) {
    EqualRow {
        ChoiceButton("Normal", d.normal, Modifier.weight(1f).fillMaxHeight(), showSelection && d.choice == DamageChoice.NORMAL) { a.onChoose(DamageChoice.NORMAL) }
        ChoiceButton("Crítico ×2", d.criticalTotal, Modifier.weight(1f).fillMaxHeight(), showSelection && d.choice == DamageChoice.CRITICAL) { a.onChoose(DamageChoice.CRITICAL) }
        ChoiceButton("×3", d.tripleTotal, Modifier.weight(1f).fillMaxHeight(), showSelection && d.choice == DamageChoice.TRIPLE) { a.onChoose(DamageChoice.TRIPLE) }
    }
}

/** A row of equally tall buttons, whatever the length of their labels. */
@Composable
private fun EqualRow(content: @Composable RowScope.() -> Unit) {
    Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(6.dp), content = content)
}

@Composable
private fun ChoiceButton(title: String, value: Int, modifier: Modifier, selected: Boolean = false, onClick: () -> Unit) {
    val c = D20.colors
    Box(modifier.padding(end = 3.dp, bottom = 3.dp)) {
        NeoSurface(
            Modifier.fillMaxSize(), fill = if (selected) c.brand else c.surface, shadowOffset = 3.dp,
            contentAlignment = Alignment.Center, onClick = onClick,
        ) {
            Column(Modifier.padding(horizontal = 2.dp, vertical = 6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(title, color = if (selected) c.onBrand else c.text, fontSize = 10.5.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center, lineHeight = 12.sp)
                Text("$value", color = if (selected) c.onBrand else c.text, fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun TargetSavePicker(o: RollOutcome, a: OverlayActions) {
    val c = D20.colors
    val save = o.pendingSave ?: return
    Text("Resultado de ${save.targetSave.ptName} do alvo:", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
    EqualRow {
        for ((degree, glyph) in listOf(Degree.CRITICAL_SUCCESS to "✦", Degree.SUCCESS to "✓", Degree.FAILURE to "✕", Degree.CRITICAL_FAILURE to "✕✕")) {
            ChoiceButton("$glyph\n${degreeName(degree)}", save.damageFor(degree), Modifier.weight(1f).fillMaxHeight(), o.targetDegree == degree) { a.onResolveTarget(degree) }
        }
    }
}

@Composable
private fun Notices(o: RollOutcome, applied: Set<Int>, a: OverlayActions) {
    val c = D20.colors
    val visible = o.notices.withIndex().filter { it.value.active != false }
    if (visible.isEmpty()) return
    NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.surface, shadowOffset = 3.dp) {
        Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("AVISOS", color = c.brand, fontWeight = FontWeight.ExtraBold, fontSize = 11.sp, letterSpacing = 1.sp)
            visible.forEach { (i, n) ->
                val prefix = if (n.active == null && n.effect != null) "Se ${n.effect!!.trigger.ptName.lowercase()}: " else ""
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(prefix + n.text, color = c.text, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                    val e = n.effect
                    if (e != null && e.target == d20.engine.conditions.EffectTarget.SELF) {
                        val done = i in applied
                        NeoButton(if (done) "Aplicado" else "Aplicar em mim", { a.onApplyNotice(i) }, enabled = !done)
                    }
                }
            }
        }
    }
}
