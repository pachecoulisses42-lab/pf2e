package com.d20companion.ui

import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.d20companion.data.CharacterSummary
import com.d20companion.vm.ListViewModel
import d20.engine.schema.PfClass
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ListScreen(vm: ListViewModel, characters: List<CharacterSummary>, onOpen: (String) -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
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

    Scaffold(
        topBar = { TopAppBar(title = { Text("Meus personagens") }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { creating = true }) { Icon(Icons.Default.Add, "Novo personagem") }
        },
    ) { padding ->
        if (characters.isEmpty()) {
            Column(Modifier.padding(padding).fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Nenhum personagem ainda.", style = MaterialTheme.typography.titleMedium)
                Text("Toque em + para criar o primeiro.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(Modifier.padding(padding).fillMaxSize(), contentPadding = androidx.compose.foundation.layout.PaddingValues(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(characters, key = { it.id }) { c ->
                    GlowCard(glow = c.characterClass.glow(), modifier = Modifier.fillMaxWidth(), onClick = { onOpen(c.id) }) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Column(Modifier.weight(1f)) {
                                Text(c.name, style = MaterialTheme.typography.titleMedium, maxLines = 1)
                                Text(c.characterClass.ptName, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            var menu by remember { mutableStateOf(false) }
                            IconButton(onClick = { menu = true }) { Icon(Icons.Default.MoreVert, "Opções") }
                            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                                DropdownMenuItem(text = { Text("Duplicar") }, onClick = { menu = false; vm.duplicate(c.id) })
                                DropdownMenuItem(text = { Text("Exportar JSON") }, onClick = {
                                    menu = false
                                    scope.launch {
                                        val export = vm.export(c.id)
                                        if (export != null) {
                                            pendingExport = export.second
                                            saveLauncher.launch("${export.first.ifBlank { "personagem" }}.json")
                                        }
                                    }
                                })
                                DropdownMenuItem(text = { Text("Excluir") }, onClick = { menu = false; deleting = c })
                            }
                        }
                    }
                }
            }
        }
    }

    if (creating) NewCharacterDialog(onDismiss = { creating = false }) { name, cls ->
        creating = false
        vm.create(name, cls, onOpen)
    }
    deleting?.let { c ->
        AlertDialog(
            onDismissRequest = { deleting = null },
            title = { Text("Excluir ${c.name}?") },
            text = { Text("Isso remove o personagem e o painel salvo. Exporte o JSON antes se quiser guardar uma cópia.") },
            confirmButton = { TextButton(onClick = { vm.delete(c.id); deleting = null }) { Text("Excluir", color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Cancelar") } },
        )
    }
}

@Composable
private fun NewCharacterDialog(onDismiss: () -> Unit, onCreate: (String, PfClass) -> Unit) {
    var name by remember { mutableStateOf("") }
    var cls by remember { mutableStateOf(PfClass.FIGHTER) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Novo personagem") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                NameField("Nome do personagem (texto livre)", name) { name = it }
                Dropdown("Classe (carrega um painel inicial)", PfClass.entries, cls, { it.ptName }, { cls = it })
            }
        },
        confirmButton = {
            TextButton(onClick = { onCreate(name, cls) }, enabled = name.isNotBlank()) { Text("Criar") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar") } },
    )
}
