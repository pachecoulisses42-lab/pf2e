package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import d20.engine.core.Degree
import d20.engine.play.RollOutcome
import d20.engine.play.Tone
import d20.engine.play.degreeName
import d20.engine.schema.PfClass
import kotlinx.coroutines.delay

/** Total time the cosmetic dice animation may take. The guide caps it at 800 ms, so we stay well under. */
private const val ANIMATION_MS = 600L
private const val FRAME_MS = 50L

/**
 * 1-tap result: a short dice animation (cosmetic, the real roll is already resolved by the engine), then the
 * coloured result and the secondary "drawer" with damage lines / target-save buttons.
 */
@Composable
fun RollOverlay(outcome: RollOutcome, characterClass: PfClass, onResolveTarget: (Degree) -> Unit, onDismiss: () -> Unit) {
    var animating by remember { mutableStateOf(true) }
    var shown by remember { mutableIntStateOf(20) }
    LaunchedEffect(outcome.title, outcome.natural, outcome.total) {
        animating = true
        var elapsed = 0L
        while (elapsed < ANIMATION_MS) {
            shown = (1..20).random()
            delay(FRAME_MS)
            elapsed += FRAME_MS
        }
        animating = false
    }

    Dialog(onDismissRequest = onDismiss) {
        val toneColor = if (animating) MaterialTheme.colorScheme.onSurface else outcome.tone.color(MaterialTheme.colorScheme.onSurface)
        GlowCard(glow = if (animating) characterClass.glow() else toneColor) {
            Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(outcome.title, style = MaterialTheme.typography.titleMedium)
                Text(outcome.subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)

                if (animating) {
                    Text(if (outcome.total != null) "$shown" else "🎲", fontSize = 64.sp, fontWeight = FontWeight.Bold)
                } else {
                    Headline(outcome, toneColor)
                    outcome.damage?.let { DamageDrawer(outcome, it) }
                    if (outcome.pendingSave != null) TargetSavePicker(outcome, onResolveTarget)
                }
                TextButton(onClick = onDismiss) { Text("Fechar") }
            }
        }
    }
}

@Composable
private fun Headline(o: RollOutcome, color: androidx.compose.ui.graphics.Color) {
    if (o.total != null) {
        Text("${o.total}", fontSize = 72.sp, fontWeight = FontWeight.Bold, color = color)
        val verdict = o.degree?.let(::degreeName) ?: when (o.tone) {
            Tone.CRITICAL -> "20 natural!"
            Tone.FAILURE -> "1 natural"
            else -> null
        }
        verdict?.let { Text(it, style = MaterialTheme.typography.titleMedium, color = color) }
        o.dc?.let { Text("vs CA/CD $it", style = MaterialTheme.typography.labelMedium) }
        Text(o.breakdown.joinToString("  "), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
    } else {
        Text("CD ${o.dc}", fontSize = 56.sp, fontWeight = FontWeight.Bold, color = color)
    }
}

@Composable
private fun DamageDrawer(o: RollOutcome, d: d20.engine.play.DamageSummary) {
    Surface(color = MaterialTheme.colorScheme.surfaceVariant, shape = CardShape, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text("Dano", style = MaterialTheme.typography.labelLarge)
            d.lines.forEach { Text(it, style = MaterialTheme.typography.bodyMedium) }
            when {
                d.applied != null -> Text(
                    (if (d.critical == true) "Crítico: " else "Total: ") + d.applied,
                    fontSize = 24.sp, fontWeight = FontWeight.Bold,
                    color = if (d.critical == true) ResultColors.Critical else MaterialTheme.colorScheme.onSurface,
                )
                o.pendingSave != null -> Text("Total (antes da resistência): ${d.normal}", fontWeight = FontWeight.Bold)
                else -> Text("Normal ${d.normal} · Crítico ${d.criticalTotal}", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun TargetSavePicker(o: RollOutcome, onResolve: (Degree) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Resultado da resistência do alvo:", style = MaterialTheme.typography.labelMedium)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            for (degree in listOf(Degree.CRITICAL_SUCCESS, Degree.SUCCESS, Degree.FAILURE, Degree.CRITICAL_FAILURE)) {
                OutlinedButton(
                    onClick = { onResolve(degree) },
                    modifier = Modifier.weight(1f).size(width = 0.dp, height = 56.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(2.dp),
                ) {
                    Text(
                        degreeName(degree).replace(" ", "\n"),
                        fontSize = 11.sp, textAlign = TextAlign.Center,
                        fontWeight = if (o.targetDegree == degree) FontWeight.Bold else FontWeight.Normal,
                    )
                }
            }
        }
    }
}
