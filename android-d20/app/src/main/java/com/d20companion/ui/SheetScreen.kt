package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.d20companion.feedback.Feedback
import com.d20companion.vm.Mode
import com.d20companion.vm.SheetState
import com.d20companion.vm.SheetViewModel
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.MapStep
import d20.engine.pf2e.Rank
import d20.engine.pf2e.ShieldBlock
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.Dashboard
import d20.engine.schema.DashboardEditor
import d20.engine.schema.GridLayout
import d20.engine.schema.PfClass
import d20.engine.schema.ResourceStation
import d20.engine.schema.Station
import d20.engine.schema.ZoneConfig
import d20.engine.schema.ZoneKey
import d20.engine.schema.resourceStation

@Composable
fun SheetScreen(vm: SheetViewModel, state: SheetState, soundOn: Boolean, nav: NavActions, openConditions: Boolean) {
    val context = LocalContext.current
    val c = D20.colors
    val snackbar = remember { SnackbarHostState() }
    val saved by vm.savedModules.collectAsState()
    var showCharacter by remember { mutableStateOf(false) }
    var editing by remember { mutableStateOf<Station?>(null) }
    var addingTo by remember { mutableStateOf<ZoneKey?>(null) }
    var openedFromNav by remember { mutableStateOf(false) }

    LaunchedEffect(state.message) {
        state.message?.let {
            snackbar.showSnackbar(it)
            vm.consumeMessage()
        }
    }
    LaunchedEffect(openConditions, state.dashboard != null) {
        if (openConditions && state.dashboard != null && !openedFromNav) {
            openedFromNav = true
            vm.openConditions()
        }
    }

    val d = state.dashboard
    val badge = state.play.conditions.map { it.kind }.distinct().size + state.play.persistent.size + state.play.afflictions.size
    Scaffold(
        containerColor = c.bg,
        snackbarHost = { SnackbarHost(snackbar) },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            if (d == null) {
                Text(if (state.loading) "Carregando…" else "Personagem não encontrado", color = c.muted, modifier = Modifier.align(Alignment.Center))
            } else {
                SheetBody(d, state, vm, soundOn, menu = listOf(
                    MenuEntry("Personagens", nav.toList),
                    MenuEntry("Condições", vm::openConditions, badge),
                    MenuEntry("Ajustes", nav.toSettings),
                ), onCharacter = { showCharacter = true }, onEdit = { editing = it }, onAdd = { addingTo = it }, context = context)
            }
        }
    }

    if (d != null) {
        state.outcome?.let { outcome ->
            RollOverlay(
                outcome = outcome, rollId = state.rollId, stationFill = state.outcomeColor.fill(),
                healApplied = state.healApplied, appliedNotices = state.appliedNotices,
                actions = OverlayActions(vm::chooseDamage, vm::resolveTargetSave, vm::applyHeal, vm::applyNotice, vm::dismissOutcome),
            )
        }
        if (state.conditionsOpen) {
            ConditionsSheet(
                play = state.play, proposal = state.proposal, selected = state.selected, messages = state.applyMessages,
                actions = ConditionsActions(
                    onClose = vm::closeConditions, onStartTurn = vm::startTurn, onEndTurn = vm::endTurn,
                    onToggleItem = vm::toggleItem, onApply = vm::applyProposal, onDiscard = vm::discardProposal,
                    onRemoveCondition = vm::removeCondition, onRemovePersistent = vm::removePersistent, onToggleAssist = vm::toggleAssist,
                    onEndStage = vm::endStage, onRemoveAffliction = vm::removeAffliction,
                    onAddCondition = vm::addCondition, onAddPersistent = vm::addPersistent, onAddAffliction = vm::addAffliction,
                ),
            )
        }
        editing?.let { station ->
            StationEditorSheet(
                station = station,
                onSave = { updated -> vm.edit { DashboardEditor.replaceStation(it, updated) }; editing = null },
                onDelete = { vm.edit { DashboardEditor.removeStation(it, station.id) }; editing = null },
                onDismiss = { editing = null },
                onSaveToLibrary = vm::saveModule,
            )
        }
        addingTo?.let { key ->
            AddModuleSheet(
                zone = key, saved = saved,
                actions = AddModuleActions(
                    onBlank = { type -> editing = vm.addBlank(key, type); addingTo = null },
                    onPick = { module -> editing = vm.addModule(key, module); addingTo = null },
                    onDeleteSaved = vm::deleteSavedModule,
                    onDismiss = { addingTo = null },
                ),
            )
        }
        if (showCharacter) CharacterSheet(d, vm) { showCharacter = false }
        if (state.blockOpen) BlockSheet(d, state, vm)
    }
}

@Composable
private fun SheetBody(
    d: Dashboard, state: SheetState, vm: SheetViewModel, soundOn: Boolean, menu: List<MenuEntry>,
    onCharacter: () -> Unit, onEdit: (Station) -> Unit, onAdd: (ZoneKey) -> Unit, context: android.content.Context,
) {
    val setup = state.mode == Mode.SETUP
    val expanded = remember { mutableStateMapOf<ZoneKey, Boolean>() }
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(start = 16.dp, end = 11.dp, top = 10.dp, bottom = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Header(d, setup, vm, menu, onCharacter)
        if (state.errors.isNotEmpty()) ErrorBanner(state.errors)
        if (!setup) PlayControls(state, vm)
        val actions = CardActions(onHp = vm::adjustHp, onToggleShield = vm::toggleShield, onBlock = vm::openBlock)
        ZoneKey.entries.forEach { key ->
            val zone = key.of(d)
            if (!setup && zone.stations.isEmpty()) return@forEach
            val open = expanded[key] ?: true
            SectionHeader(
                title = key.ptName, count = zone.stations.size, expanded = open, onToggle = { expanded[key] = !open },
                trailing = { if (setup) LayoutPicker(zone.layout) { l -> vm.tryEdit { DashboardEditor.setLayout(it, key, l) } } },
            )
            if (open) {
                ZoneGrid(zone, setup, cardHeight(zone, setup, d), onAdd = { onAdd(key) }) { station, modifier ->
                    StationCard(
                        station = station, dashboard = d, play = state.play, setup = setup, compact = zone.layout == GridLayout.GRID_2X2,
                        onTap = {
                            when {
                                setup -> onEdit(station)
                                station is ConditionsStation -> vm.openConditions()
                                station !is ResourceStation -> {
                                    Feedback.haptic(context)
                                    if (soundOn) Feedback.sound()
                                    vm.roll(station)
                                }
                            }
                        },
                        actions = actions, modifier = modifier,
                    )
                }
            }
        }
    }
}

@Composable
private fun Header(d: Dashboard, setup: Boolean, vm: SheetViewModel, menu: List<MenuEntry>, onCharacter: () -> Unit) {
    val c = D20.colors
    Row(Modifier.fillMaxWidth().padding(end = 5.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Avatar(d.name.firstOrNull()?.uppercase() ?: "?", d.characterClass.cardColor().fill())
        Column(Modifier.weight(1f)) {
            Text(if (setup) d.name else "Olá, ${d.name}!", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 19.sp, maxLines = 1)
            Text("${d.characterClass.ptName} · nível ${d.character.level}", color = c.muted, fontSize = 11.5.sp, fontWeight = FontWeight.Medium)
        }
        if (setup) {
            NeoButton("Ficha", onCharacter, ghost = true)
            NeoButton("Salvar", vm::lockAndSave)
        } else {
            NeoButton("Editar", vm::unlock)
        }
        NavMenu(menu)
    }
}

@Composable
private fun ErrorBanner(errors: List<String>) {
    NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp), fill = ResultColors.Failure, shadowOffset = 3.dp) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text("Corrija antes de salvar:", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
            errors.take(5).forEach { Text("• $it", color = Ink, fontSize = 11.sp, fontWeight = FontWeight.SemiBold) }
        }
    }
}

/** Play-mode context: multiple attack step and optional target AC/DC, both selection-only. */
@Composable
private fun PlayControls(state: SheetState, vm: SheetViewModel) {
    val c = D20.colors
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.padding(end = 5.dp)) {
        MapStep.entries.forEach { step -> Pill(step.ptName, state.context.map == step, { vm.setMap(step) }) }
    }
    val target = state.context.targetDc
    NeoSurface(Modifier.padding(end = 5.dp), fill = c.surface, radius = 22.dp, borderWidth = 2.5.dp, shadowOffset = 3.dp) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("CA/CD do alvo", color = c.text, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            Text("−", color = if (target != null) c.text else c.muted, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp,
                modifier = Modifier.padding(horizontal = 6.dp).let { m -> if (target != null) m.clickableNoRipple { vm.setTarget((target - 1).takeIf { it >= 5 }) } else m })
            Text(target?.toString() ?: "sem alvo", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 15.sp)
            Text("+", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp,
                modifier = Modifier.padding(horizontal = 6.dp).clickableNoRipple { vm.setTarget(((target ?: 14) + 1).coerceAtMost(60)) })
        }
    }
}

@Composable
private fun LayoutPicker(current: GridLayout, onPick: (GridLayout) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        Pill(current.name.removePrefix("GRID_") + " ▾", selected = false, onClick = { open = true })
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            GridLayout.entries.forEach { l -> DropdownMenuItem(text = { Text(l.ptName) }, onClick = { onPick(l); open = false }) }
        }
    }
}

/** Equal card height inside a zone, from the tallest content it holds. No intrinsic measuring needed. */
private fun cardHeight(zone: ZoneConfig, setup: Boolean, d: Dashboard): Dp {
    val base = when (zone.layout) { GridLayout.GRID_1X1 -> 124; GridLayout.GRID_1X2 -> 140; GridLayout.GRID_2X2 -> 104 }
    val tallest = zone.stations.maxOfOrNull { s ->
        when (s) {
            is ResourceStation -> if (setup) 130 else base + 28 + (if (s.shield != null) 74 else 0)
            is ActionStation -> base + (if (s.weapon.traits.isNotEmpty()) 22 else 0) + (if (s.weapon.elemental.isNotEmpty()) 24 else 0)
            else -> base
        }
    } ?: base
    return tallest.dp
}

/** Lays a zone's stations in the guide's 1-2-4 grid. Empty slots are invisible in Play and dashed in Setup. */
@Composable
private fun ZoneGrid(zone: ZoneConfig, setup: Boolean, cardHeight: Dp, onAdd: () -> Unit, card: @Composable (Station, Modifier) -> Unit) {
    val columns = if (zone.layout == GridLayout.GRID_1X1) 1 else 2
    val rows = if (zone.layout == GridLayout.GRID_2X2) 2 else 1
    Column(Modifier.fillMaxWidth().padding(end = 5.dp, bottom = 5.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        for (r in 0 until rows) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                for (col in 0 until columns) {
                    val slot = Modifier.weight(1f).height(cardHeight)
                    val station = zone.stations.getOrNull(r * columns + col)
                    when {
                        station != null -> card(station, slot)
                        setup -> NeoSurface(slot, dashed = true, shadowOffset = 0.dp, contentAlignment = Alignment.Center, onClick = onAdd) {
                            Text("+ ADICIONAR", color = D20.colors.muted, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                        else -> Box(slot)
                    }
                }
            }
        }
    }
}

@Composable
private fun CharacterSheet(d: Dashboard, vm: SheetViewModel, onDismiss: () -> Unit) {
    NeoSheet(
        title = "Ficha do personagem", onDismiss = onDismiss,
        footer = { NeoButton("Ok", onDismiss, modifier = Modifier.weight(1f)) },
    ) {
        NameField("Nome do personagem (texto livre)", d.name) { name -> vm.edit { DashboardEditor.rename(it, name) } }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Dropdown("Classe", PfClass.entries, d.characterClass, { it.ptName }, { cls -> vm.edit { DashboardEditor.setClass(it, cls) } }, Modifier.weight(1f))
            Stepper("Nível", d.character.level, 1..20, { l -> vm.edit { DashboardEditor.setLevel(it, l) } }, Modifier.weight(1f))
        }
        SectionTitle("Modificadores de atributo")
        Ability.entries.chunked(2).forEach { pair ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                pair.forEach { a ->
                    Stepper(a.ptName, d.character.mod(a), -5..10, { m -> vm.edit { DashboardEditor.setAbility(it, a, m) } }, Modifier.weight(1f), display = ::signed)
                }
            }
        }
        SectionTitle("Proficiência nas resistências")
        listOf(CheckKind.FORTITUDE, CheckKind.REFLEX, CheckKind.WILL).forEach { k ->
            Dropdown(k.ptName, Rank.entries, d.character.saveRank(k), { "${it.abbr} · ${it.ptName}" }, { r -> vm.edit { DashboardEditor.setSaveRank(it, k, r) } })
        }
    }
}

@Composable
private fun BlockSheet(d: Dashboard, state: SheetState, vm: SheetViewModel) {
    val shield = d.resourceStation()?.shield
    var damage by remember { mutableStateOf(8) }
    NeoSheet(
        title = "Bloquear com o escudo", onDismiss = vm::closeBlock,
        footer = {
            NeoButton("Cancelar", vm::closeBlock, ghost = true, modifier = Modifier.weight(1f))
            NeoButton("Aplicar bloqueio", { vm.confirmBlock(damage) }, enabled = shield != null, modifier = Modifier.weight(2f))
        },
    ) {
        if (shield == null) {
            Text("Você não tem escudo.", color = D20.colors.muted)
        } else {
            Stepper("Dano que você receberia", damage, 1..100, { damage = it })
            val r = ShieldBlock.resolve(shield, state.play.shieldHp ?: shield.maxHp, damage)
            NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = CardColor_MOSTARDA, shadowOffset = 3.dp) {
                Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("Dureza ${shield.hardness} absorve ${r.blocked}", color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 13.sp)
                    Text("Você sofre ${r.damageToYou}. O escudo sofre ${r.damageToShield} (PV ${r.newShieldHp}/${shield.maxHp})" + if (r.broken) " e quebra." else ".", color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

private val CardColor_MOSTARDA = d20.engine.schema.CardColor.MOSTARDA.fill()
