package com.d20companion.ui

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.d20companion.vm.ImportState
import com.d20companion.vm.ImportViewModel
import d20.engine.pathbuilder.ImportGroup
import d20.engine.schema.CardColor
import d20.engine.schema.classDc

/** Import a Pathbuilder 2e character: pick its PDF or JSON (or paste the JSON), review what was found, create it. */
@Composable
fun ImportScreen(vm: ImportViewModel, state: ImportState, nav: NavActions, onCreated: (String) -> Unit) {
    val c = D20.colors
    var pasting by remember { mutableStateOf(false) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let(vm::load) }
    Scaffold(containerColor = c.bg) { padding ->
        Column(
            Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, end = 11.dp, top = 10.dp, bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(Modifier.fillMaxWidth().padding(end = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Importar do Pathbuilder", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                    Text("PDF com o JSON exportado, arquivo .json ou texto colado", color = c.muted, fontSize = 11.5.sp, fontWeight = FontWeight.Medium)
                }
                NavMenu(listOf(MenuEntry("Início", nav.toHome), MenuEntry("Personagens", nav.toList), MenuEntry("Ajustes", nav.toSettings)))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(end = 5.dp)) {
                NeoButton("Escolher PDF ou JSON", { picker.launch(arrayOf("application/pdf", "application/json", "text/plain")) }, modifier = Modifier.weight(1.4f))
                NeoButton("Colar JSON", { pasting = true }, ghost = true, modifier = Modifier.weight(1f))
            }
            when {
                state.loading -> Text("Lendo o personagem…", color = c.muted, fontWeight = FontWeight.SemiBold)
                state.error != null -> NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp), fill = ResultColors.Failure, shadowOffset = 3.dp) {
                    Text("Não foi possível importar: ${state.error}", color = Ink, fontWeight = FontWeight.Bold, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
                }
                state.result != null -> Review(vm, state, onCreated)
                else -> Text(
                    "No Pathbuilder, use Menu → Export → Export JSON. Você pode imprimir a página do JSON como PDF ou salvar o arquivo .json.",
                    color = c.muted, fontSize = 12.sp,
                )
            }
        }
    }
    if (pasting) {
        var text by remember { mutableStateOf("") }
        NeoSheet(
            title = "Colar JSON do Pathbuilder", onDismiss = { pasting = false },
            footer = {
                NeoButton("Cancelar", { pasting = false }, ghost = true, modifier = Modifier.weight(1f))
                NeoButton("Ler", { pasting = false; vm.loadText(text) }, enabled = text.isNotBlank(), modifier = Modifier.weight(2f))
            },
        ) {
            NeoSurface(Modifier.fillMaxWidth().height(220.dp).padding(end = 3.dp, bottom = 3.dp), shadowOffset = 3.dp) {
                BasicTextField(
                    text, { text = it }, textStyle = TextStyle(color = c.text, fontSize = 12.sp), cursorBrush = SolidColor(c.text),
                    modifier = Modifier.fillMaxSize().padding(10.dp),
                )
            }
        }
    }
}

@Composable
private fun Review(vm: ImportViewModel, state: ImportState, onCreated: (String) -> Unit) {
    val c = D20.colors
    val r = state.result ?: return
    val d = r.dashboard
    NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp, bottom = 5.dp), fill = d.characterClass.cardColor().fill()) {
        Column(Modifier.padding(14.dp)) {
            Text(d.name, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
            Text("${d.characterClass.ptName} · nível ${d.character.level} · CD de classe ${d.classDc()}", color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
    SectionTitle("O que importar")
    Text("Cada item vira um módulo próprio na biblioteca do personagem. O painel já vem montado; troque os módulos pelo \"Adicionar módulo\".", color = c.muted, fontSize = 11.sp)
    ImportGroup.entries.forEach { g ->
        val count = r.items.count { it.group == g }
        if (count == 0) return@forEach
        val on = g in state.keep
        NeoSurface(
            Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = if (on) CardColor.VERDE.fill() else c.surface,
            shadowOffset = if (on) 3.dp else 0.dp, onClick = { vm.toggle(g) },
        ) {
            Row(Modifier.padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(if (on) "☑" else "☐", color = if (on) Ink else c.text, fontSize = 18.sp, modifier = Modifier.padding(end = 10.dp))
                Text(g.ptName, color = if (on) Ink else c.text, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Box(contentAlignment = Alignment.Center) { CountBadge(count) }
            }
        }
    }
    if (r.warnings.isNotEmpty()) {
        SectionTitle("Avisos")
        r.warnings.forEach { Text("• $it", color = c.text, fontSize = 11.5.sp, fontWeight = FontWeight.Medium) }
    }
    NeoButton("Criar personagem", { vm.confirm(onCreated) }, enabled = !state.loading, modifier = Modifier.fillMaxWidth().padding(top = 4.dp, end = 3.dp, bottom = 3.dp))
}
