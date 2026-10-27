package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.pf2e.Formulas
import d20.engine.pf2e.SpellMode
import d20.engine.schema.ActionStation
import d20.engine.schema.Dashboard
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station

/**
 * One station module snapped into a grid slot. In Play, tapping a rollable card rolls; in Setup, tapping edits.
 * Cards adapt to the space they get (1x1 is roomy, 2x2 is compact).
 */
@Composable
fun StationCard(
    station: Station,
    dashboard: Dashboard,
    currentHp: Int,
    setup: Boolean,
    onTap: () -> Unit,
    onHp: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val glow = dashboard.characterClass.glow()
    // Resource cards hold their own +/- buttons, so the card body is not tappable in Play.
    val tapHandler = if (station is ResourceStation && !setup) null else onTap
    GlowCard(glow = glow, modifier = modifier, onClick = tapHandler) {
        Box(Modifier.fillMaxSize().padding(8.dp)) {
            when (station) {
                is ActionStation -> RollFace(
                    glyph = "⚔️", title = station.title,
                    big = bonus(Formulas.attack(dashboard.character, station.weapon)),
                    small = "Dano " + Formulas.damage(dashboard.character, station.weapon),
                )
                is SpellStation -> {
                    val s = station.spell
                    if (s.mode == SpellMode.SAVE) {
                        RollFace(
                            glyph = "✨", title = station.title,
                            big = "CD " + d20.engine.pf2e.Pf2eEngine.spellDc(dashboard.character, s),
                            small = Formulas.spellDamage(s) + " " + s.damageType.ptName,
                        )
                    } else {
                        RollFace(
                            glyph = "✨", title = station.title,
                            big = bonus(Formulas.spellAttack(dashboard.character, s)),
                            small = "Dano " + Formulas.spellDamage(s) + " " + s.damageType.ptName,
                        )
                    }
                }
                is SkillStation -> RollFace(
                    glyph = "🎲", title = station.title,
                    big = bonus(Formulas.check(dashboard.character, station.check)),
                    small = station.check.kind.defaultAbility.abbr.let { a ->
                        (station.check.abilityOverride?.abbr ?: a) + " · " + station.check.rank.ptName
                    },
                )
                is ResourceStation -> ResourceFace(station, dashboard, currentHp, setup, onHp)
            }
            if (setup) {
                Text("✎", modifier = Modifier.align(Alignment.TopEnd), color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

private fun bonus(formula: String) = formula.removePrefix("1d20")

@Composable
private fun RollFace(glyph: String, title: String, big: String, small: String) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$glyph $title", style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(big, fontSize = 30.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        Text(small, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, textAlign = TextAlign.Center, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun ResourceFace(r: ResourceStation, d: Dashboard, hp: Int, setup: Boolean, onHp: (Int) -> Unit) {
    val ac = r.armor.armorClass(d.character)
    val fraction = if (r.maxHp > 0) (hp.toFloat() / r.maxHp).coerceIn(0f, 1f) else 0f
    val barColor: Color = when {
        fraction > 0.5f -> ResultColors.Success
        fraction > 0.25f -> ResultColors.Critical
        else -> ResultColors.Failure
    }
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("❤️ PV   🛡️ CA $ac", style = MaterialTheme.typography.labelLarge)
        Text(if (setup) "máx ${r.maxHp}" else "$hp / ${r.maxHp}", fontSize = 28.sp, fontWeight = FontWeight.Bold)
        LinearProgressIndicator(progress = { if (setup) 1f else fraction }, color = barColor, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp))
        if (!setup) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                for (delta in listOf(-5, -1, +1, +5)) {
                    OutlinedButton(
                        onClick = { onHp(delta) },
                        contentPadding = PaddingValues(0.dp),
                        modifier = Modifier.weight(1f),
                    ) { Text(if (delta > 0) "+$delta" else "−${-delta}", fontSize = 12.sp, maxLines = 1) }
                }
            }
        }
    }
}
