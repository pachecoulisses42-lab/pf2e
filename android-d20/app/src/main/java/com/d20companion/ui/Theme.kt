package com.d20companion.ui

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.d20companion.R
import d20.engine.pf2e.DamageType
import d20.engine.play.Tone
import d20.engine.schema.CardColor
import d20.engine.schema.PfClass

/** Ink: text on bright fills and the outline/shadow colour of the light theme. */
val Ink = Color(0xFF141109)

/** Result colours mandated by the guide (§6.1); every result also carries a glyph and a word. */
object ResultColors {
    val Success = Color(0xFF2ECC71)
    val Failure = Color(0xFFE74C3C)
    val Critical = Color(0xFFF1C40F)
}

/** Corner radius mandated by the guide (§6.1). */
val CardShape = RoundedCornerShape(12.dp)

/** Theme-dependent colours. Outline and hard shadow are ink in the light theme and cream in the dark one. */
@Immutable
class D20Colors(
    val dark: Boolean,
    val bg: Color,
    val surface: Color,
    val sunken: Color,
    val line: Color,
    val shadow: Color,
    val text: Color,
    val muted: Color,
    val brand: Color,
    val onBrand: Color,
    val successText: Color,
    val failureText: Color,
    val criticalText: Color,
)

val LightColors = D20Colors(
    dark = false, bg = Color(0xFFF0EADF), surface = Color(0xFFFBF8F1), sunken = Color(0xFFE4DCCB),
    line = Ink, shadow = Ink, text = Ink, muted = Color(0xFF5B5546), brand = Color(0xFF4A93F5), onBrand = Ink,
    successText = Color(0xFF066F38), failureText = Color(0xFFBC1C12), criticalText = Color(0xFF735D05),
)

val DarkColors = D20Colors(
    dark = true, bg = Color(0xFF17130D), surface = Color(0xFF26211A), sunken = Color(0xFF100D08),
    line = Color(0xFFEFE6D2), shadow = Color(0xFFEFE6D2), text = Color(0xFFEFE6D2), muted = Color(0xFFB5AC98),
    brand = Color(0xFF5AA0F7), onBrand = Ink,
    successText = ResultColors.Success, failureText = Color(0xFFF55A48), criticalText = ResultColors.Critical,
)

val LocalD20 = staticCompositionLocalOf { LightColors }

object D20 {
    val colors: D20Colors @Composable get() = LocalD20.current
}

fun CardColor.fill(): Color = when (this) {
    CardColor.MOSTARDA -> Color(0xFFE8B53F)
    CardColor.VERDE -> Color(0xFF1FAE83)
    CardColor.CORAL -> Color(0xFFF4705F)
    CardColor.AZUL -> Color(0xFF3F73A3)
    CardColor.VIOLETA -> Color(0xFF9A7BD9)
    CardColor.ROSA -> Color(0xFFF08CB4)
}

/** Text on a card fill: ink everywhere except the steel blue, which needs white to reach 4.5:1. */
fun CardColor.onFill(): Color = if (this == CardColor.AZUL) Color.White else Ink

/** Class → card colour: martial coral, precision green, arcane blue, primal and devotion mustard. */
fun PfClass.cardColor(): CardColor = when (this) {
    PfClass.FIGHTER, PfClass.BARBARIAN, PfClass.SWASHBUCKLER, PfClass.MONK, PfClass.CHAMPION -> CardColor.CORAL
    PfClass.ROGUE, PfClass.RANGER, PfClass.INVESTIGATOR -> CardColor.VERDE
    PfClass.WIZARD, PfClass.SORCERER, PfClass.WITCH, PfClass.BARD -> CardColor.AZUL
    PfClass.CLERIC, PfClass.DRUID, PfClass.ALCHEMIST -> CardColor.MOSTARDA
}

fun Tone.color(neutral: Color): Color = when (this) {
    Tone.SUCCESS -> ResultColors.Success
    Tone.FAILURE -> ResultColors.Failure
    Tone.CRITICAL -> ResultColors.Critical
    Tone.NEUTRAL -> neutral
}

/** Chip colour per damage type, so each element is recognisable at a glance (the name is always written too). */
fun DamageType.chipColor(): Color = when (this) {
    DamageType.SLASHING, DamageType.BLUDGEONING, DamageType.PIERCING -> Color(0xFFE4DCCB)
    DamageType.FIRE -> Color(0xFFFF8A3D)
    DamageType.COLD -> Color(0xFF6FD3F2)
    DamageType.ELECTRICITY -> Color(0xFFC8A2FF)
    DamageType.ACID -> Color(0xFFA6E34B)
    DamageType.SONIC -> Color(0xFFFF8FC8)
    DamageType.BLEED -> Color(0xFFE0626E)
    DamageType.POISON -> Color(0xFF8EDB8A)
    DamageType.MENTAL -> Color(0xFFB7A6FF)
    DamageType.FORCE -> Color(0xFF8EC5FF)
    DamageType.SPIRIT -> Color(0xFFE8D9A0)
    DamageType.VITALITY -> Color(0xFFFFE9A8)
    DamageType.VOID -> Color(0xFF9A8AB0)
}

val Poppins = FontFamily(
    Font(R.font.poppins_regular, FontWeight.Normal),
    Font(R.font.poppins_medium, FontWeight.Medium),
    Font(R.font.poppins_semibold, FontWeight.SemiBold),
    Font(R.font.poppins_bold, FontWeight.Bold),
    Font(R.font.poppins_extrabold, FontWeight.ExtraBold),
)

private fun poppinsTypography(): Typography {
    val t = Typography()
    return Typography(
        displayLarge = t.displayLarge.copy(fontFamily = Poppins), displayMedium = t.displayMedium.copy(fontFamily = Poppins),
        displaySmall = t.displaySmall.copy(fontFamily = Poppins), headlineLarge = t.headlineLarge.copy(fontFamily = Poppins),
        headlineMedium = t.headlineMedium.copy(fontFamily = Poppins), headlineSmall = t.headlineSmall.copy(fontFamily = Poppins),
        titleLarge = t.titleLarge.copy(fontFamily = Poppins), titleMedium = t.titleMedium.copy(fontFamily = Poppins),
        titleSmall = t.titleSmall.copy(fontFamily = Poppins), bodyLarge = t.bodyLarge.copy(fontFamily = Poppins),
        bodyMedium = t.bodyMedium.copy(fontFamily = Poppins), bodySmall = t.bodySmall.copy(fontFamily = Poppins),
        labelLarge = t.labelLarge.copy(fontFamily = Poppins), labelMedium = t.labelMedium.copy(fontFamily = Poppins),
        labelSmall = t.labelSmall.copy(fontFamily = Poppins),
    )
}

@Composable
fun D20Theme(darkTheme: Boolean, content: @Composable () -> Unit) {
    val c = if (darkTheme) DarkColors else LightColors
    val scheme = if (darkTheme) {
        darkColorScheme(
            primary = c.brand, onPrimary = c.onBrand, background = c.bg, onBackground = c.text, surface = c.surface,
            onSurface = c.text, surfaceVariant = c.sunken, onSurfaceVariant = c.muted, outline = c.line,
        )
    } else {
        lightColorScheme(
            primary = c.brand, onPrimary = c.onBrand, background = c.bg, onBackground = c.text, surface = c.surface,
            onSurface = c.text, surfaceVariant = c.sunken, onSurfaceVariant = c.muted, outline = c.line,
        )
    }
    CompositionLocalProvider(LocalD20 provides c) {
        MaterialTheme(
            colorScheme = scheme,
            typography = poppinsTypography(),
            shapes = Shapes(small = CardShape, medium = CardShape, large = CardShape),
            content = content,
        )
    }
}
