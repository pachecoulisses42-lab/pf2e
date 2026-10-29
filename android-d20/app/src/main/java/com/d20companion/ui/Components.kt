package com.d20companion.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.schema.Text as SchemaText

@Composable
fun FieldLabel(text: String) {
    Text(text.uppercase(), color = D20.colors.muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp, modifier = Modifier.padding(bottom = 3.dp))
}

/** Sub-heading inside a form: brand colour, uppercase. */
@Composable
fun SectionTitle(text: String) {
    Text(text.uppercase(), color = D20.colors.brand, fontSize = 12.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp, modifier = Modifier.padding(top = 6.dp))
}

/** Selection-only dropdown: the user never types the value. */
@Composable
fun <T> Dropdown(
    label: String,
    options: List<T>,
    selected: T,
    labelOf: (T) -> String,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    var expanded by remember { mutableStateOf(false) }
    val c = D20.colors
    Column(modifier) {
        if (label.isNotEmpty()) FieldLabel(label)
        Column(Modifier.padding(end = 3.dp, bottom = 3.dp)) {
            NeoSurface(Modifier.fillMaxWidth(), fill = c.surface, shadowOffset = 3.dp, onClick = { expanded = true }) {
                Row(Modifier.fillMaxWidth().padding(start = 12.dp, end = 6.dp, top = 8.dp, bottom = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(labelOf(selected), color = c.text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, modifier = Modifier.weight(1f))
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = c.text)
                }
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { option ->
                    DropdownMenuItem(text = { Text(labelOf(option)) }, onClick = { onSelect(option); expanded = false })
                }
            }
        }
    }
}

/** − / + stepper bounded to [range]; both buttons share the row so neither is squeezed in a half-width column. */
@Composable
fun Stepper(
    label: String,
    value: Int,
    range: IntRange,
    onChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    step: Int = 1,
    display: (Int) -> String = { it.toString() },
) {
    val c = D20.colors
    Column(modifier) {
        if (label.isNotEmpty()) FieldLabel(label)
        Row(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            val canDown = value > range.first
            val canUp = value < range.last
            NeoSurface(
                Modifier.weight(1f), fill = c.surface, shadowOffset = 3.dp, contentAlignment = Alignment.Center,
                onClick = if (canDown) ({ onChange((value - step).coerceIn(range)) }) else null,
            ) { Text("−", color = if (canDown) c.text else c.muted, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, modifier = Modifier.padding(vertical = 3.dp)) }
            Text(display(value), color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, textAlign = TextAlign.Center, maxLines = 1, modifier = Modifier.weight(1.2f))
            NeoSurface(
                Modifier.weight(1f), fill = c.surface, shadowOffset = 3.dp, contentAlignment = Alignment.Center,
                onClick = if (canUp) ({ onChange((value + step).coerceIn(range)) }) else null,
            ) { Text("+", color = if (canUp) c.text else c.muted, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, modifier = Modifier.padding(vertical = 3.dp)) }
        }
    }
}

@Composable
fun SwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    val c = D20.colors
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, color = c.text, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
        Switch(
            checked = checked, onCheckedChange = onChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Ink, checkedTrackColor = c.brand, checkedBorderColor = c.line,
                uncheckedThumbColor = c.line, uncheckedTrackColor = c.sunken, uncheckedBorderColor = c.line,
            ),
        )
    }
}

/** The only free-text input in the app. Input is capped at 40 characters and stripped of control characters. */
@Composable
fun NameField(label: String, value: String, modifier: Modifier = Modifier, onChange: (String) -> Unit) {
    val c = D20.colors
    Column(modifier) {
        FieldLabel(label)
        NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.sunken, shadowOffset = 3.dp) {
            BasicTextField(
                value = value,
                onValueChange = { onChange(it.take(SchemaText.MAX_LENGTH).filter { ch -> !ch.isISOControl() }) },
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = c.text, fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                cursorBrush = SolidColor(c.text),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp),
            )
        }
    }
}

fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

/** Clickable without the ripple (for small text controls inside pills). */
@Composable
fun Modifier.clickableNoRipple(onClick: () -> Unit): Modifier =
    this.then(Modifier.clickable(interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }, indication = null, onClick = onClick))
