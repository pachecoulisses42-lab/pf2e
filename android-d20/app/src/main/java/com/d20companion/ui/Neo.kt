package com.d20companion.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.pf2e.DamageType

/**
 * The building block of the visual style: a filled, outlined shape with a hard (zero-blur) offset shadow.
 * The shadow is drawn outside the bounds, so callers leave [shadowOffset] of free space to the right and below.
 */
@Composable
fun NeoSurface(
    modifier: Modifier = Modifier,
    fill: Color = D20.colors.surface,
    border: Color = D20.colors.line,
    shadow: Color = D20.colors.shadow,
    radius: Dp = 12.dp,
    borderWidth: Dp = 3.dp,
    shadowOffset: Dp = 4.dp,
    dashed: Boolean = false,
    contentAlignment: Alignment = Alignment.TopStart,
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(radius)
    var m = modifier
    if (shadowOffset > 0.dp && !dashed) {
        m = m.drawBehind {
            drawRoundRect(
                color = shadow, topLeft = Offset(shadowOffset.toPx(), shadowOffset.toPx()), size = size,
                cornerRadius = CornerRadius(radius.toPx()),
            )
        }
    }
    m = m.clip(shape).background(if (dashed) Color.Transparent else fill, shape)
    m = if (dashed) {
        m.drawBehind {
            drawRoundRect(
                color = border, cornerRadius = CornerRadius(radius.toPx()),
                style = Stroke(width = borderWidth.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(18f, 12f))),
            )
        }
    } else m.border(borderWidth, border, shape)
    if (onClick != null) m = m.clickable(onClick = onClick)
    Box(m, contentAlignment = contentAlignment, content = content)
}

@Composable
fun NeoButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    ghost: Boolean = false,
    fill: Color? = null,
) {
    val c = D20.colors
    NeoSurface(
        modifier = modifier.alpha(if (enabled) 1f else 0.45f),
        fill = fill ?: if (ghost) c.surface else c.brand,
        shadowOffset = 3.dp,
        contentAlignment = Alignment.Center,
        onClick = if (enabled) onClick else null,
    ) {
        Text(
            text, color = if (ghost || fill != null && fill == c.surface) c.text else c.onBrand,
            fontWeight = FontWeight.Bold, fontSize = 13.sp, textAlign = TextAlign.Center, maxLines = 1,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
        )
    }
}

/** Rounded pill with the double outline (outline + offset copy) of the reference; filled when selected. */
@Composable
fun Pill(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
    val c = D20.colors
    NeoSurface(
        modifier = modifier, fill = if (selected) c.brand else c.surface, radius = 22.dp, borderWidth = 2.5.dp,
        shadowOffset = 3.dp, contentAlignment = Alignment.Center, onClick = onClick,
    ) {
        Text(
            text, color = if (selected) c.onBrand else c.text, fontWeight = FontWeight.Bold, fontSize = 12.sp, maxLines = 1,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
        )
    }
}

/** Small tag/chip without shadow. */
@Composable
fun NeoChip(
    text: String,
    modifier: Modifier = Modifier,
    fill: Color = D20.colors.surface,
    textColor: Color = D20.colors.text,
    onClick: (() -> Unit)? = null,
) {
    NeoSurface(
        modifier = modifier, fill = fill, border = if (fill == D20.colors.surface) D20.colors.line else Ink,
        radius = 18.dp, borderWidth = 2.5.dp, shadowOffset = 0.dp, contentAlignment = Alignment.Center, onClick = onClick,
    ) {
        Text(text, color = textColor, fontWeight = FontWeight.Bold, fontSize = 11.5.sp, maxLines = 1, modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp))
    }
}

/** Damage-type chip: coloured by element, always labelled with the type's name. */
@Composable
fun ElementChip(type: DamageType, modifier: Modifier = Modifier, label: String = type.ptName) {
    NeoSurface(
        modifier = modifier, fill = type.chipColor(), border = Ink, radius = 10.dp, borderWidth = 2.5.dp, shadowOffset = 0.dp,
        contentAlignment = Alignment.Center,
    ) {
        Text(label, color = Ink, fontWeight = FontWeight.Bold, fontSize = 11.sp, maxLines = 1, modifier = Modifier.padding(horizontal = 8.dp, vertical = 1.dp))
    }
}

@Composable
fun Avatar(initial: String, fill: Color, modifier: Modifier = Modifier, size: Dp = 44.dp) {
    Box(
        modifier.size(size).clip(CircleShape).background(fill, CircleShape).border(3.dp, D20.colors.line, CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(initial, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = (size.value * 0.4f).sp)
    }
}

@Composable
fun CountBadge(n: Int) {
    val c = D20.colors
    Box(Modifier.size(21.dp).clip(CircleShape).background(c.text, CircleShape), contentAlignment = Alignment.Center) {
        Text("$n", color = c.bg, fontWeight = FontWeight.Bold, fontSize = 11.sp)
    }
}

/** "Topo (2) ⌃": a collapsible section title with a count badge. */
@Composable
fun SectionHeader(title: String, count: Int, expanded: Boolean, onToggle: () -> Unit, trailing: @Composable () -> Unit = {}) {
    val c = D20.colors
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onToggle).padding(top = 4.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, color = c.text)
        CountBadge(count)
        Spacer(Modifier.weight(1f))
        trailing()
        Icon(if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown, contentDescription = null, tint = c.muted)
    }
}

data class NavItem(val label: String, val icon: ImageVector, val badge: Int = 0)

@Composable
fun NeoBottomBar(items: List<NavItem>, selected: Int, onSelect: (Int) -> Unit) {
    val c = D20.colors
    Row(
        Modifier.fillMaxWidth().background(c.surface).drawBehind {
            drawLine(c.line, Offset(0f, 0f), Offset(size.width, 0f), strokeWidth = 3.dp.toPx())
        }.padding(top = 3.dp),
    ) {
        items.forEachIndexed { i, item ->
            val tint = if (i == selected) c.brand else c.muted
            Column(
                Modifier.weight(1f).clickable { onSelect(i) }.padding(vertical = 7.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box {
                    Icon(item.icon, contentDescription = item.label, tint = tint)
                    if (item.badge > 0) {
                        Box(
                            Modifier.align(Alignment.TopEnd).padding(start = 16.dp).clip(CircleShape).background(ResultColors.Failure),
                            contentAlignment = Alignment.Center,
                        ) { Text("${item.badge}", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 5.dp)) }
                    }
                }
                Text(item.label, color = tint, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
        }
    }
}
