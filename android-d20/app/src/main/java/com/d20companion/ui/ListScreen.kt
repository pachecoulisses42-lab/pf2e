package com.d20companion.ui

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.d20companion.data.CharacterSummary
import com.d20companion.vm.ListViewModel
import d20.engine.schema.PfClass
import kotlinx.coroutines.launch

@Composable
fun ListScreen(vm: ListViewModel, characters: List<CharacterSummary>, nav: NavActions, onOpen: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val c = D20.colors
    var creating by remember { mutableStateOf(false) }
    var deleting by remember { mutableStateOf<CharacterSummary?>(null) }
    // JSON waiting for the user to pick a destination file (Storage Access Framework).
    var pendingExport by remember { mutableStateOf<String?>(null) }

    val saveLauncher = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        val text = pendingExport
        pendingExport = null
        if (uri != null && text != null) {
            val ok = runCatching {
                context.contentResolver.openOutputStream(uri)?.use { it.write(text.toByteArray(Charsets.UTF_8)) } != null
            }.getOrDefault(false)
            Toast.makeText(context, if (ok) "JSON exportado" else "Falha ao exportar", Toast.LENGTH_SHORT).show()
        }
    }

    val items = listOf(
        NavItem("Personagens", Icons.Default.Menu),
        NavItem("Painel", Icons.Default.Home),
        NavItem("Condições", Icons.Default.Warning),
        NavItem("Ajustes", Icons.Default.Settings),
    )
    Scaffold(
        containerColor = c.bg,
        bottomBar = {
            NeoBottomBar(items, selected = 0, onSelect = {
                when (it) {
                    1 -> nav.toPanel()
                    2 -> nav.toConditions()
                    3 -> nav.toSettings()
                }
            })
        },
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().padding(start = 16.dp, end = 11.dp, top = 10.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.fillMaxWidth().padding(end = 5.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Column(Modifier.weight(1f)) {
                    Text("Meus personagens", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
                    Text("Pathfinder 2e Remaster", color = c.muted, fontSize = 11.5.sp, fontWeight = FontWeight.Medium)
                }
                NeoButton("+ Novo", { creating = true })
            }
            if (characters.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Nenhum personagem ainda.\nToque em + Novo para criar o primeiro.", color = c.muted, fontWeight = FontWeight.Medium)
                }
            } else {
                LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(bottom = 16.dp)) {
                    items(characters, key = { it.id }) { ch ->
                        val fill = ch.characterClass.cardColor().fill()
                        NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp), fill = fill, onClick = { onOpen(ch.id) }) {
                            Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Avatar(ch.name.firstOrNull()?.uppercase() ?: "?", c.surface)
                                Column(Modifier.weight(1f)) {
                                    Text(ch.name, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp, maxLines = 1)
                                    Text("${ch.characterClass.ptName} · nível ${ch.level}", color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                    Text("PV ${ch.hp}/${ch.maxHp} · CA ${ch.armorClass}", color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                                var menu by remember { mutableStateOf(false) }
                                Box {
                                    Pill("⋮", false, { menu = true })
                                    DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                        DropdownMenuItem(text = { Text("Duplicar") }, onClick = { menu = false; vm.duplicate(ch.id) })
                                        DropdownMenuItem(text = { Text("Exportar JSON") }, onClick = {
                                            menu = false
                                            scope.launch {
                                                val export = vm.export(ch.id)
                                                if (export != null) {
                                                    pendingExport = export.second
                                                    saveLauncher.launch("${export.first.ifBlank { "personagem" }}.json")
                                                }
                                            }
                                        })
                                        DropdownMenuItem(text = { Text("Excluir") }, onClick = { menu = false; deleting = ch })
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (creating) {
        var name by remember { mutableStateOf("") }
        var cls by remember { mutableStateOf(PfClass.FIGHTER) }
        NeoSheet(
            title = "Novo personagem", onDismiss = { creating = false },
            footer = {
                NeoButton("Cancelar", { creating = false }, ghost = true, modifier = Modifier.weight(1f))
                NeoButton("Criar personagem", { creating = false; vm.create(name, cls, onOpen) }, enabled = name.isNotBlank(), modifier = Modifier.weight(2f))
            },
        ) {
            NameField("Nome do personagem (texto livre)", name) { name = it }
            Dropdown("Classe (carrega um painel inicial)", PfClass.entries, cls, { it.ptName }, { cls = it })
        }
    }
    deleting?.let { ch ->
        NeoSheet(
            title = "Excluir ${ch.name}?", onDismiss = { deleting = null },
            footer = {
                NeoButton("Cancelar", { deleting = null }, ghost = true, modifier = Modifier.weight(1f))
                NeoButton("Excluir", { vm.delete(ch.id); deleting = null }, fill = ResultColors.Failure, modifier = Modifier.weight(1f))
            },
        ) {
            Text("Isso remove o personagem e o painel salvo. Exporte o JSON antes se quiser guardar uma cópia.", color = c.text, fontSize = 13.sp)
        }
    }
}
