package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsScreen(themeMode: Int, soundOn: Boolean, onTheme: (Int) -> Unit, onSound: (Boolean) -> Unit, nav: NavActions) {
    val c = D20.colors
    val items = listOf(
        NavItem("Personagens", Icons.Default.Menu),
        NavItem("Painel", Icons.Default.Home),
        NavItem("Condições", Icons.Default.Warning),
        NavItem("Ajustes", Icons.Default.Settings),
    )
    Scaffold(
        containerColor = c.bg,
        bottomBar = {
            NeoBottomBar(items, selected = 3, onSelect = {
                when (it) {
                    0 -> nav.toList()
                    1 -> nav.toPanel()
                    2 -> nav.toConditions()
                }
            })
        },
    ) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, end = 16.dp, top = 10.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("Ajustes", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
            SectionTitle("Tema")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(end = 5.dp)) {
                listOf("Sistema", "Claro", "Escuro").forEachIndexed { i, label -> Pill(label, themeMode == i, { onTheme(i) }) }
            }
            SwitchRow("Som ao rolar", soundOn, onSound)
            NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp, bottom = 5.dp), fill = c.surface) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("D20 Companion · Pathfinder 2e Remaster", color = c.text, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text("Fonte Poppins (SIL OFL). Regras: Pathfinder 2e Remaster.", color = c.muted, fontSize = 11.sp)
                }
            }
        }
    }
}
