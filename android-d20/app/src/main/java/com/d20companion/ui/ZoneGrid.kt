package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import d20.engine.schema.GridLayout
import d20.engine.schema.Station
import d20.engine.schema.ZoneConfig

/**
 * Lays out a zone's stations in the guide's 1-2-4 grid. [card] receives the station and the slot modifier
 * (which already carries the weight/size). Empty slots are invisible in Play and show "+" in Setup.
 */
@Composable
fun ZoneGrid(
    zone: ZoneConfig,
    setup: Boolean,
    onAdd: () -> Unit,
    modifier: Modifier = Modifier,
    card: @Composable (Station, Modifier) -> Unit,
) {
    val columns = if (zone.layout == GridLayout.GRID_1X1) 1 else 2
    val rows = if (zone.layout == GridLayout.GRID_2X2) 2 else 1
    Column(modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        for (r in 0 until rows) {
            Row(Modifier.weight(1f).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (c in 0 until columns) {
                    val index = r * columns + c
                    val slot = Modifier.weight(1f).fillMaxSize()
                    val station = zone.stations.getOrNull(index)
                    when {
                        station != null -> card(station, slot)
                        setup -> OutlinedButton(onClick = onAdd, modifier = slot) {
                            Text("+ Adicionar", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        else -> androidx.compose.foundation.layout.Box(slot, contentAlignment = Alignment.Center) {}
                    }
                }
            }
        }
    }
}
