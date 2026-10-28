package com.d20companion.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import d20.engine.schema.Text as SchemaText

/** Card with the guide's 12dp radius, soft elevation and a class-coloured glow border. */
@Composable
fun GlowCard(
    glow: Color,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    val base = modifier.shadow(6.dp, CardShape, ambientColor = glow, spotColor = glow).clip(CardShape)
    Surface(
        modifier = if (onClick != null) base.clickable(onClick = onClick) else base,
        shape = CardShape,
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, glow.copy(alpha = 0.65f)),
        content = content,
    )
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
    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box {
            OutlinedButton(onClick = { expanded = true }, modifier = Modifier.fillMaxWidth()) {
                Text(labelOf(selected), maxLines = 1)
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                options.forEach { option ->
                    DropdownMenuItem(
                        text = { Text(labelOf(option)) },
                        onClick = {
                            onSelect(option)
                            expanded = false
                        },
                    )
                }
            }
        }
    }
}

/**
 * − / + stepper bounded to [range]; [display] lets callers format the value (e.g. "+3").
 * Buttons share the width (weight) with no inner padding so both always fit, even in a half-width column.
 */
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
    Column(modifier) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = { onChange((value - step).coerceIn(range)) },
                enabled = value > range.first,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.weight(1f),
            ) { Text("−") }
            Text(
                display(value),
                style = MaterialTheme.typography.titleMedium,
                textAlign = TextAlign.Center,
                maxLines = 1,
                modifier = Modifier.weight(1.2f),
            )
            OutlinedButton(
                onClick = { onChange((value + step).coerceIn(range)) },
                enabled = value < range.last,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.weight(1f),
            ) { Text("+") }
        }
    }
}

@Composable
fun SwitchRow(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
        Text(label)
        Switch(checked = checked, onCheckedChange = onChange)
    }
}

/** The only free-text input in the app. Input is sanitized and capped at 40 characters on every keystroke. */
@Composable
fun NameField(label: String, value: String, modifier: Modifier = Modifier, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { onChange(it.take(SchemaText.MAX_LENGTH).filter { c -> !c.isISOControl() }) },
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = KeyboardOptions.Default,
        modifier = modifier.fillMaxWidth(),
    )
}

fun signed(n: Int) = if (n >= 0) "+$n" else "$n"

@Composable
fun SectionTitle(text: String) {
    Text(text, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 8.dp))
}
