package com.d20companion.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import d20.engine.play.Tone
import d20.engine.schema.PfClass

/** Result colours mandated by the guide (§6.1). */
object ResultColors {
    val Success = Color(0xFF2ECC71)
    val Failure = Color(0xFFE74C3C)
    val Critical = Color(0xFFF1C40F)
}

/** Card corner radius mandated by the guide (§6.1). */
val CardShape = RoundedCornerShape(12.dp)

fun Tone.color(neutral: Color): Color = when (this) {
    Tone.SUCCESS -> ResultColors.Success
    Tone.FAILURE -> ResultColors.Failure
    Tone.CRITICAL -> ResultColors.Critical
    Tone.NEUTRAL -> neutral
}

/** Glow colour of a card, derived from the character class. */
fun PfClass.glow(): Color = when (this) {
    PfClass.FIGHTER, PfClass.BARBARIAN, PfClass.SWASHBUCKLER -> Color(0xFFE57373)
    PfClass.ROGUE, PfClass.RANGER, PfClass.DRUID -> Color(0xFF81C784)
    PfClass.WIZARD, PfClass.SORCERER, PfClass.WITCH, PfClass.BARD -> Color(0xFFBA68C8)
    PfClass.CLERIC, PfClass.CHAMPION, PfClass.MONK -> Color(0xFFFFD54F)
    PfClass.ALCHEMIST, PfClass.INVESTIGATOR -> Color(0xFF4DD0E1)
}

@Composable
fun D20Theme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = Color(0xFF8AB4F8),
            onPrimary = Color(0xFF0B1220),
            background = Color(0xFF0F1318),
            surface = Color(0xFF1A2027),
            surfaceVariant = Color(0xFF242C35),
            onBackground = Color(0xFFE8EAED),
            onSurface = Color(0xFFE8EAED),
            onSurfaceVariant = Color(0xFFB0B7C0),
        ),
        shapes = Shapes(
            small = RoundedCornerShape(12.dp),
            medium = RoundedCornerShape(12.dp),
            large = RoundedCornerShape(12.dp),
        ),
        content = content,
    )
}
