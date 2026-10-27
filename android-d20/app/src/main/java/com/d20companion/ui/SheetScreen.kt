package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.d20companion.feedback.Feedback
import com.d20companion.vm.Mode
import com.d20companion.vm.SheetState
import com.d20companion.vm.SheetViewModel
import d20.engine.pf2e.Ability
import d20.engine.pf2e.MapStep
import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardEditor
import d20.engine.schema.GridLayout
import d20.engine.schema.PfClass
import d20.engine.schema.ResourceStation
import d20.engine.schema.Station
import d20.engine.schema.StationType
import d20.engine.schema.ZoneConfig
import d20.engine.schema.ZoneKey

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SheetScreen(vm: SheetViewModel, state: SheetState, onBack: () -> Unit) {
    val context = LocalContext.current
    val snackbar = remember { SnackbarHostState() }
    var showCharacter by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Station?>(null) }
    var addingTo by remember { mutableStateOf<ZoneKey?>(null) }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            vm.consumeMessage()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = {
            TopAppBar(
                title = { Text(state.dashboard?.name ?: "…", maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Voltar") }
                },
                actions = {
                    if (state.mode == Mode.SETUP) {
                        IconButton(onClick = { showCharacter = true }) { Icon(Icons.Default.Person, "Ficha do personagem") }
                        IconButton(onClick = vm::lockAndSave) { Icon(Icons.Default.Check, "Salvar e travar") }
                    } else {
                        IconButton(onClick = vm::unlock) { Icon(Icons.Default.Edit, "Editar painel") }
                    }
                },
            )
        },
    ) { padding ->
        val dashboard = state.dashboard
        Box(Modifier.padding(padding).fillMaxSize()) {
            if (dashboard != null) {
                Column(Modifier.fillMaxSize()) {
                    if (state.errors.isNotEmpty()) ErrorBanner(state.errors)
                    if (state.mode == Mode.PLAY) PlayControls(state, vm)
                    Viewport(dashboard, state, vm, onEdit = { editing = it }, onAdd = { addingTo = it }, modifier = Modifier.weight(1f))
                }
            }
            val outcome = state.outcome
            if (outcome != null && dashboard != null) {
                RollOverlay(outcome, dashboard.characterClass, vm::resolveTargetSave, vm::dismissOutcome)
            }
        }
    }

    addingTo?.let { key ->
        AlertDialog(
            onDismissRequest = { addingTo = null },
            title = { Text("Adicionar módulo — ${key.ptName}") },
            text = {
                Column {
                    StationType.entries.forEach { type ->
                        TextButton(
                            onClick = {
                                vm.tryEdit { DashboardEditor.addStation(it, key, type) }
                                addingTo = null
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) { Text(type.ptName) }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { addingTo = null }) { Text("Cancelar") } },
        )
    }
    editing?.let { station ->
        StationEditorDialog(
            station = station,
            onSave = { updated ->
                vm.edit { DashboardEditor.replaceStation(it, updated) }
                editing = null
            },
            onDelete = {
                vm.edit { DashboardEditor.removeStation(it, station.id) }
                editing = null
            },
            onDismiss = { editing = null },
        )
    }
    if (showCharacter && state.dashboard != null) {
        CharacterDialog(state.dashboard, vm, onDismiss = { showCharacter = false })
    }
}

@Composable
private fun ErrorBanner(errors: List<String>) {
    Column(Modifier.fillMaxWidth().padding(8.dp)) {
        Text("Corrija antes de travar:", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelLarge)
        errors.take(5).forEach { Text("• $it", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.labelSmall) }
    }
}

/** Play-mode context: multiple attack step and optional target AC/DC, both selection-only. */
@Composable
private fun PlayControls(state: SheetState, vm: SheetViewModel) {
    Column(Modifier.fillMaxWidth().padding(horizontal = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            MapStep.entries.forEach { step ->
                FilterChip(
                    selected = state.context.map == step,
                    onClick = { vm.setMap(step) },
                    label = { Text(step.ptName) },
                )
            }
        }
        val target = state.context.targetDc
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("CA/CD do alvo:", style = MaterialTheme.typography.labelMedium)
            TextButton(onClick = { vm.setTarget(if (target == null) null else (target - 1).takeIf { it >= 5 }) }, enabled = target != null) { Text("−") }
            Text(target?.toString() ?: "sem alvo", style = MaterialTheme.typography.titleSmall)
            TextButton(onClick = { vm.setTarget(((target ?: 14) + 1).coerceAtMost(60)) }) { Text("+") }
            if (target != null) TextButton(onClick = { vm.setTarget(null) }) { Text("limpar") }
        }
    }
}

/** The fixed chassis: three stacked work zones, each with its own 1/2/4 grid (guide §1.1). */
@Composable
private fun Viewport(d: Dashboard, state: SheetState, vm: SheetViewModel, onEdit: (Station) -> Unit, onAdd: (ZoneKey) -> Unit, modifier: Modifier) {
    val context = LocalContext.current
    val setup = state.mode == Mode.SETUP
    Column(modifier.fillMaxWidth().padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        ZoneKey.entries.forEach { key ->
            val zone = key.of(d)
            Column(Modifier.weight(1f).fillMaxWidth()) {
                if (setup) ZoneHeader(key, zone, vm)
                ZoneGrid(
                    zone = zone,
                    setup = setup,
                    onAdd = { onAdd(key) },
                    modifier = Modifier.weight(1f),
                ) { station, cardModifier ->
                    StationCard(
                        station = station, dashboard = d, currentHp = state.currentHp, setup = setup,
                        onTap = {
                            if (setup) onEdit(station) else if (station !is ResourceStation) {
                                Feedback.haptic(context)
                                Feedback.sound()
                                vm.roll(station)
                            }
                        },
                        onHp = vm::adjustHp,
                        modifier = cardModifier,
                    )
                }
            }
        }
    }
}

@Composable
private fun ZoneHeader(key: ZoneKey, zone: ZoneConfig, vm: SheetViewModel) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
        Text(key.ptName, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        Dropdown(
            label = "", options = GridLayout.entries, selected = zone.layout, labelOf = { it.name.removePrefix("GRID_") },
            onSelect = { layout -> vm.tryEdit { DashboardEditor.setLayout(it, key, layout) } },
            modifier = Modifier.padding(end = 4.dp),
        )
    }
}

@Composable
private fun CharacterDialog(d: Dashboard, vm: SheetViewModel, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Ficha do personagem") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                NameField("Nome do personagem (texto livre)", d.name) { name -> vm.edit { DashboardEditor.rename(it, name) } }
                Dropdown("Classe", PfClass.entries, d.characterClass, { it.ptName }, { c -> vm.edit { DashboardEditor.setClass(it, c) } })
                Stepper("Nível", d.character.level, 1..20, { l -> vm.edit { DashboardEditor.setLevel(it, l) } })
                SectionTitle("Modificadores de atributo")
                Ability.entries.forEach { a ->
                    Stepper(a.ptName, d.character.mod(a), -5..10, { m -> vm.edit { DashboardEditor.setAbility(it, a, m) } }, display = ::signed)
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Ok") } },
    )
}
