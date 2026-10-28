package com.d20companion.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.conditions.ConditionEffect
import d20.engine.conditions.ConditionKind
import d20.engine.conditions.EffectAction
import d20.engine.conditions.EffectTarget
import d20.engine.conditions.EffectTrigger
import d20.engine.core.DieType
import d20.engine.pf2e.Ability
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.ElementalRune
import d20.engine.pf2e.Rank
import d20.engine.pf2e.ShieldKind
import d20.engine.pf2e.SpellMode
import d20.engine.pf2e.SpellSpec
import d20.engine.pf2e.StrikingRune
import d20.engine.pf2e.WeaponSpec
import d20.engine.pf2e.WeaponTrait
import d20.engine.schema.ActionStation
import d20.engine.schema.CardColor
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.ResourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station
import d20.engine.schema.effectiveColor
import d20.engine.schema.Text as SchemaText

private val physicalTypes = listOf(DamageType.SLASHING, DamageType.BLUDGEONING, DamageType.PIERCING)
private val saveKinds = listOf(CheckKind.FORTITUDE, CheckKind.REFLEX, CheckKind.WILL)

/** A bottom sheet in the app's style: title row with a close button, scrolling body and a pinned action bar. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NeoSheet(
    title: String,
    onDismiss: () -> Unit,
    footer: @Composable RowScope.() -> Unit = {},
    content: @Composable () -> Unit,
) {
    val c = D20.colors
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = c.bg,
        shape = RoundedCornerShape(topStart = 22.dp, topEnd = 22.dp),
        dragHandle = null,
    ) {
        Row(
            Modifier.fillMaxWidth().background(c.surface).padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(title, color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 17.sp, modifier = Modifier.weight(1f))
            Box(
                Modifier.size(30.dp).clip(CircleShape).border(2.5.dp, c.line, CircleShape).clickable(onClick = onDismiss),
                contentAlignment = Alignment.Center,
            ) { Text("✕", color = c.text, fontSize = 13.sp, fontWeight = FontWeight.Bold) }
        }
        Box(Modifier.fillMaxWidth().size(3.dp).background(c.line))
        Column(
            Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) { content() }
        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
            footer()
        }
    }
}

/** Setup-mode editor for one station. Every field is a selection except the optional custom names. */
@Composable
fun StationEditorSheet(station: Station, onSave: (Station) -> Unit, onDelete: () -> Unit, onDismiss: () -> Unit) {
    var draft by remember(station.id) { mutableStateOf(station) }
    val c = D20.colors
    NeoSheet(
        title = titleFor(draft), onDismiss = onDismiss,
        footer = {
            NeoButton("Remover", onDelete, ghost = true, fill = null, modifier = Modifier.weight(1f))
            NeoButton("Aplicar", { onSave(sanitized(draft)) }, modifier = Modifier.weight(2f))
        },
    ) {
        when (val s = draft) {
            is ActionStation -> WeaponForm(s.weapon) { draft = s.copy(weapon = it) }
            is SpellStation -> SpellForm(s.spell) { draft = s.copy(spell = it) }
            is SkillStation -> {
                CheckForm(s.check) { draft = s.copy(check = it) }
                SectionTitle("Condições que esta rolagem impõe ou remove")
                EffectsEditor(s.effects, defaultTrigger = EffectTrigger.SUCCESS) { draft = s.copy(effects = it) }
            }
            is ConsumableStation -> ConsumableForm(s.consumable) { draft = s.copy(consumable = it) }
            is ResourceStation -> ResourceForm(s) { draft = it }
            is ConditionsStation -> Text(
                "Este módulo abre o painel de condições: condições ativas, dano persistente, venenos e a passagem de turno.",
                color = c.muted, fontSize = 12.sp, fontWeight = FontWeight.Medium,
            )
        }
        SectionTitle("Cor do cartão")
        ColorPicker(draft.color, draft.effectiveColor()) { draft = withColor(draft, it) }
    }
}

private fun titleFor(s: Station) = when (s) {
    is ActionStation -> "Ataque com arma"
    is SpellStation -> "Magia"
    is SkillStation -> "Perícia / Resistência"
    is ConsumableStation -> "Poção ou bomba"
    is ResourceStation -> "Vida, escudo & defesa"
    is ConditionsStation -> "Condições"
}

private fun withColor(s: Station, color: CardColor?): Station = when (s) {
    is ActionStation -> s.copy(color = color)
    is SpellStation -> s.copy(color = color)
    is SkillStation -> s.copy(color = color)
    is ConsumableStation -> s.copy(color = color)
    is ResourceStation -> s.copy(color = color)
    is ConditionsStation -> s.copy(color = color)
}

/** Free-text names get a final clean-up (and fall back to a default if emptied). */
private fun sanitized(s: Station): Station = when (s) {
    is ActionStation -> s.copy(weapon = s.weapon.copy(name = SchemaText.sanitize(s.weapon.name).ifBlank { "Arma" }))
    is SpellStation -> s.copy(spell = s.spell.copy(name = SchemaText.sanitize(s.spell.name).ifBlank { "Magia" }))
    is SkillStation -> s.copy(check = s.check.copy(customName = s.check.customName?.let(SchemaText::sanitize)?.ifBlank { null }))
    is ConsumableStation -> s.copy(consumable = s.consumable.copy(name = SchemaText.sanitize(s.consumable.name)))
    is ResourceStation, is ConditionsStation -> s
}

@Composable
fun ColorPicker(selected: CardColor?, effective: CardColor, onSelect: (CardColor?) -> Unit) {
    val c = D20.colors
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
        CardColor.entries.forEach { color ->
            val on = color == effective
            Box(
                Modifier.size(34.dp).clip(CircleShape).then(if (on) Modifier.border(3.dp, c.line, CircleShape).padding(4.dp) else Modifier)
                    .clip(CircleShape).background(color.fill(), CircleShape).border(3.dp, c.line, CircleShape)
                    .clickable { onSelect(if (selected == color) null else color) },
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun WeaponForm(w: WeaponSpec, onChange: (WeaponSpec) -> Unit) {
    NameField("Nome da arma (texto livre)", w.name) { onChange(w.copy(name = it)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Dropdown("Atributo primário", Ability.entries, w.attackAbility, { "${it.abbr} · ${it.ptName}" }, { onChange(w.copy(attackAbility = it)) }, Modifier.weight(1f))
        Dropdown("Proficiência", Rank.entries, w.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(w.copy(rank = it)) }, Modifier.weight(1f))
    }
    Text("FOR soma no acerto e no dano; os outros atributos, só no acerto.", color = D20.colors.muted, fontSize = 10.5.sp)
    SectionTitle("Dano base")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Dados", w.diceCount, 1..4, { onChange(w.copy(diceCount = it)) }, Modifier.weight(1f))
        Dropdown("Tipo de dado", DieType.entries, w.die, { it.label }, { onChange(w.copy(die = it)) }, Modifier.weight(1f))
    }
    Dropdown("Tipo de dano", physicalTypes, w.damageType, { it.ptName }, { onChange(w.copy(damageType = it)) })
    SectionTitle("Runas")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Potência (acerto)", w.potency, 0..3, { onChange(w.copy(potency = it)) }, Modifier.weight(1f), display = { if (it == 0) "—" else "+$it" })
        Dropdown("Impacto (dados extras)", StrikingRune.entries, w.striking, { it.ptName }, { onChange(w.copy(striking = it)) }, Modifier.weight(1f))
    }
    FieldLabel("Runas elementais (+1d6 cada, até 3)")
    FlowRow(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        ElementalRune.entries.forEach { rune ->
            val on = rune in w.elemental
            ElementChip(
                rune.damageType, label = rune.ptName + if (on) " ✓" else "",
                modifier = Modifier.alpha(if (on) 1f else 0.45f).clickable {
                    onChange(w.copy(elemental = if (on) w.elemental - rune else (w.elemental + rune).take(3)))
                },
            )
        }
    }
    SectionTitle("Traços")
    FlowRow(horizontalArrangement = Arrangement.spacedBy(7.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
        WeaponTrait.entries.forEach { t ->
            val on = t in w.traits
            NeoChip(t.ptName, fill = if (on) D20.colors.brand else D20.colors.surface, textColor = if (on) D20.colors.onBrand else D20.colors.text, onClick = {
                // at most one Deadly and one Fatal
                val others = w.traits.filter { (it.deadly != null) != (t.deadly != null) }
                onChange(w.copy(traits = if (on) w.traits - t else others + t))
            })
        }
    }
    Text("Mortal: no crítico soma dados depois de dobrar. Fatal: no crítico os dados viram o tamanho indicado, +1 dado, e tudo dobra.", color = D20.colors.muted, fontSize = 10.5.sp)
    SectionTitle("Especialização")
    SwitchRow("Especialização maior (dobra o dano por T/E/M/L)", w.greaterSpecialization) { onChange(w.copy(greaterSpecialization = it)) }
    SwitchRow("Arma ágil (ataque múltiplo −4/−8)", w.agile) { onChange(w.copy(agile = it)) }
}

@Composable
private fun SpellForm(s: SpellSpec, onChange: (SpellSpec) -> Unit) {
    NameField("Nome da magia (texto livre)", s.name) { onChange(s.copy(name = it)) }
    Dropdown("Tipo", SpellMode.entries, s.mode, { it.ptName }, { onChange(s.copy(mode = it)) })
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Dropdown("Atributo", Ability.entries, s.castingAbility, { "${it.abbr} · ${it.ptName}" }, { onChange(s.copy(castingAbility = it)) }, Modifier.weight(1f))
        Dropdown("Proficiência", Rank.entries, s.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(s.copy(rank = it)) }, Modifier.weight(1f))
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Dados de dano", s.diceCount, 1..12, { onChange(s.copy(diceCount = it)) }, Modifier.weight(1f))
        Dropdown("Tipo de dado", DieType.entries, s.die, { it.label }, { onChange(s.copy(die = it)) }, Modifier.weight(1f))
    }
    Dropdown("Tipo de dano", DamageType.entries, s.damageType, { it.ptName }, { onChange(s.copy(damageType = it)) })
    if (s.mode == SpellMode.SAVE) {
        Dropdown("Resistência do alvo", saveKinds, s.targetSave, { it.ptName }, { onChange(s.copy(targetSave = it)) })
    }
}

@Composable
private fun CheckForm(c: CheckSpec, onChange: (CheckSpec) -> Unit) {
    Dropdown("Perícia / resistência", CheckKind.entries, c.kind, { it.ptName }, { onChange(c.copy(kind = it)) })
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Dropdown("Proficiência", Rank.entries, c.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(c.copy(rank = it)) }, Modifier.weight(1f))
        Dropdown(
            "Atributo", listOf<Ability?>(null) + Ability.entries, c.abilityOverride,
            { it?.let { a -> a.abbr } ?: "Padrão (${c.kind.defaultAbility.abbr})" }, { onChange(c.copy(abilityOverride = it)) }, Modifier.weight(1f),
        )
    }
    Stepper("Bônus de item", c.itemBonus, 0..4, { onChange(c.copy(itemBonus = it)) }, display = { if (it == 0) "—" else "+$it" })
    NameField("Nome customizado (opcional, texto livre)", c.customName.orEmpty()) { onChange(c.copy(customName = it)) }
}

@Composable
private fun ConsumableForm(spec: ConsumableSpec, onChange: (ConsumableSpec) -> Unit) {
    Dropdown("Item", ConsumableKind.entries, spec.kind, { it.ptName }, { k ->
        val grades = ConsumableTables.grades(k)
        onChange(spec.copy(kind = k, grade = if (spec.grade in grades) spec.grade else grades.first()))
    })
    Dropdown("Grau", ConsumableTables.grades(spec.kind), spec.grade, { it.ptName }, { onChange(spec.copy(grade = it)) })
    if (spec.kind.isBomb) {
        Dropdown("Proficiência para arremessar", Rank.entries, spec.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(spec.copy(rank = it)) })
        Text("O acerto usa DES + proficiência + o bônus do item. Respingo vale também na falha e não dobra no crítico.", color = D20.colors.muted, fontSize = 10.5.sp)
    }
    NameField("Nome do item (opcional, texto livre)", spec.name) { onChange(spec.copy(name = it)) }
    Stepper("Quantidade que você carrega", spec.quantity, 0..99, { onChange(spec.copy(quantity = it)) })
    SectionTitle("Condições que o item impõe ou remove")
    EffectsEditor(spec.effects, defaultTrigger = if (spec.kind.isBomb) EffectTrigger.ANY_SUCCESS else EffectTrigger.ALWAYS) { onChange(spec.copy(effects = it)) }
}

@Composable
private fun ResourceForm(r: ResourceStation, onChange: (ResourceStation) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("PV máximos", r.maxHp, 1..999, { onChange(r.copy(maxHp = it)) }, Modifier.weight(1f))
        Stepper("PV máximos (±10)", r.maxHp, 1..999, { onChange(r.copy(maxHp = it)) }, Modifier.weight(1f), step = 10)
    }
    SectionTitle("Armadura")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Dropdown("Proficiência", Rank.entries, r.armor.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(r.copy(armor = r.armor.copy(rank = it))) }, Modifier.weight(1f))
        Stepper("Bônus de item", r.armor.itemBonus, 0..4, { onChange(r.copy(armor = r.armor.copy(itemBonus = it))) }, Modifier.weight(1f), display = { if (it == 0) "—" else "+$it" })
    }
    Stepper("Limite de Destreza", r.armor.dexCap, 0..5, { onChange(r.copy(armor = r.armor.copy(dexCap = it))) })
    SectionTitle("Escudo")
    ShieldOption("Sem escudo", null, r.shield == null) { onChange(r.copy(shield = null)) }
    ShieldKind.entries.forEach { k ->
        ShieldOption(k.ptName, "Dureza ${k.hardness} · PV ${k.maxHp} · CA +${k.acBonus}", r.shield == k) { onChange(r.copy(shield = k)) }
    }
}

@Composable
private fun ShieldOption(title: String, detail: String?, selected: Boolean, onClick: () -> Unit) {
    val c = D20.colors
    NeoSurface(
        Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = if (selected) CardColor.MOSTARDA.fill() else c.surface,
        shadowOffset = if (selected) 3.dp else 0.dp, onClick = onClick,
    ) {
        Row(Modifier.padding(horizontal = 12.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, color = if (selected) Ink else c.text, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                if (detail != null) Text(detail, color = if (selected) Ink else c.muted, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold)
            }
            if (selected) Text("✓", color = Ink, fontWeight = FontWeight.ExtraBold)
        }
    }
}

/** Up to three effects; every field is a selection. */
@Composable
fun EffectsEditor(effects: List<ConditionEffect>, defaultTrigger: EffectTrigger, onChange: (List<ConditionEffect>) -> Unit) {
    val c = D20.colors
    effects.forEachIndexed { i, e ->
        fun set(n: ConditionEffect) = onChange(effects.mapIndexed { j, old -> if (j == i) n else old })
        NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.surface, shadowOffset = 3.dp) {
            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Dropdown("Ação", EffectAction.entries, e.action, { it.ptName }, { set(e.copy(action = it)) }, Modifier.weight(1f))
                    Dropdown("Em quem", EffectTarget.entries, e.target, { it.ptName }, { set(e.copy(target = it)) }, Modifier.weight(1f))
                }
                Dropdown("Condição", ConditionKind.entries, e.condition, { it.ptName }, { set(e.copy(condition = it, value = if (it.valued) e.value else 1)) })
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (e.condition.valued && e.action == EffectAction.IMPOSE) {
                        Stepper("Valor", e.value, 1..4, { set(e.copy(value = it)) }, Modifier.weight(1f))
                    }
                    Dropdown("Quando", EffectTrigger.entries, e.trigger, { it.ptName }, { set(e.copy(trigger = it)) }, Modifier.weight(1f))
                }
                if (e.target == EffectTarget.SELF && e.action == EffectAction.IMPOSE) {
                    Stepper("Duração em mim (rodadas)", e.rounds ?: 0, 0..10, { set(e.copy(rounds = if (it == 0) null else it)) }, display = { if (it == 0) "até remover" else "$it" })
                }
                NeoButton("Remover efeito", { onChange(effects.filterIndexed { j, _ -> j != i }) }, ghost = true)
            }
        }
    }
    if (effects.size < 3) {
        NeoButton("+ Adicionar efeito", {
            onChange(effects + ConditionEffect(ConditionKind.FRIGHTENED, 1, EffectTarget.ENEMY, EffectAction.IMPOSE, defaultTrigger))
        }, ghost = true)
    }
}
