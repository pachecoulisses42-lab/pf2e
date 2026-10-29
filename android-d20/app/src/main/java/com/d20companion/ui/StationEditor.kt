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
import d20.engine.pf2e.ArmorCatalog
import d20.engine.pf2e.ArmorCategory
import d20.engine.pf2e.ArmorSpec
import d20.engine.pf2e.CheckKind
import d20.engine.pf2e.CheckSpec
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableSpec
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.DamageType
import d20.engine.pf2e.ElementalRune
import d20.engine.pf2e.ExtraDamage
import d20.engine.pf2e.ExtraKind
import d20.engine.pf2e.ExtraSource
import d20.engine.pf2e.Rank
import d20.engine.pf2e.Resistance
import d20.engine.pf2e.ShieldKind
import d20.engine.pf2e.SkillRune
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
import d20.engine.schema.Text as SchemaText
import d20.engine.schema.effectiveColor

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
fun StationEditorSheet(
    station: Station,
    onSave: (Station) -> Unit,
    onDelete: () -> Unit,
    onDismiss: () -> Unit,
    onSaveToLibrary: ((Station) -> Unit)? = null,
) {
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
        if (onSaveToLibrary != null && draft !is ResourceStation && draft !is ConditionsStation) {
            NeoButton(
                "Salvar em Meus módulos", { onSaveToLibrary(sanitized(draft)) }, ghost = true,
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp, end = 3.dp, bottom = 3.dp),
            )
            Text(
                "Guarda uma cópia desta versão para usar em qualquer personagem. Um módulo salvo com o mesmo nome é substituído.",
                color = c.muted, fontSize = 11.sp, fontWeight = FontWeight.Medium,
            )
        }
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
        Dropdown(
            "Proficiência", listOf<Rank?>(null) + Rank.entries, if (s.fromClass) null else s.rank,
            { it?.let { r -> "${r.abbr} · ${r.ptName}" } ?: "Da classe (Ficha)" },
            { r -> onChange(if (r == null) s.copy(fromClass = true) else s.copy(fromClass = false, rank = r)) }, Modifier.weight(1f),
        )
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Dados de dano", s.diceCount, 1..12, { onChange(s.copy(diceCount = it)) }, Modifier.weight(1f))
        Dropdown("Tipo de dado", DieType.entries, s.die, { it.label }, { onChange(s.copy(die = it)) }, Modifier.weight(1f))
    }
    Dropdown("Tipo de dano", DamageType.entries, s.damageType, { it.ptName }, { onChange(s.copy(damageType = it)) })
    if (s.mode == SpellMode.SAVE) {
        Dropdown("Resistência do alvo", saveKinds, s.targetSave, { it.ptName }, { onChange(s.copy(targetSave = it)) })
    }
    SectionTitle("Danos extras")
    ExtrasEditor(s.extras) { onChange(s.copy(extras = it)) }
}

/**
 * Extra damage from other sources. Typed sources (Circunstância, Estado, Mágico, Item) keep only the largest of each
 * type; "Sem tipo" always stacks. Weakness is added after doubling or halving.
 */
@Composable
private fun ExtrasEditor(extras: List<ExtraDamage>, onChange: (List<ExtraDamage>) -> Unit) {
    val c = D20.colors
    extras.forEachIndexed { i, e ->
        fun set(n: ExtraDamage) = onChange(extras.mapIndexed { j, old -> if (j == i) n else old })
        NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = c.surface, shadowOffset = 3.dp) {
            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Dropdown("Fonte", ExtraSource.entries, e.source, { it.ptName }, { src ->
                    set(e.copy(source = src, kind = defaultKind(src, e.kind)))
                })
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Dropdown("Tipo de bônus", ExtraKind.entries, e.kind, { it.ptName }, { set(e.copy(kind = it)) }, Modifier.weight(1f))
                    Dropdown(
                        "Tipo de dano", listOf<DamageType?>(null) + DamageType.entries, e.damageType,
                        { it?.ptName ?: "Igual à magia" }, { set(e.copy(damageType = it)) }, Modifier.weight(1f),
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Stepper("Dados", e.diceCount, 0..10, { set(e.copy(diceCount = it)) }, Modifier.weight(1f), display = { if (it == 0) "—" else "$it" })
                    Dropdown("Dado", DieType.entries, e.die, { it.label }, { set(e.copy(die = it)) }, Modifier.weight(1f))
                }
                Stepper("Valor fixo", e.flat, -10..30, { set(e.copy(flat = it)) }, display = ::signed)
                if (e.source.afterMultipliers) {
                    Text("Somada depois de dobrar ou reduzir à metade, e só se o alvo sofrer dano.", color = c.muted, fontSize = 10.5.sp)
                }
                NeoButton("Remover dano extra", { onChange(extras.filterIndexed { j, _ -> j != i }) }, ghost = true)
            }
        }
    }
    if (extras.size < 6) {
        NeoButton("+ Adicionar dano extra", {
            onChange(extras + ExtraDamage(ExtraSource.DANGEROUS_SORCERY, ExtraKind.STATUS, flat = 1))
        }, ghost = true)
    }
    if (extras.size > 1) {
        Text("Do mesmo tipo de bônus só vale o maior; \"Sem tipo\" sempre soma.", color = c.muted, fontSize = 10.5.sp)
    }
}

/** Sensible bonus type when the source changes: Dangerous Sorcery is a status bonus, weakness is untyped. */
private fun defaultKind(source: ExtraSource, current: ExtraKind): ExtraKind = when (source) {
    ExtraSource.DANGEROUS_SORCERY -> ExtraKind.STATUS
    ExtraSource.WEAKNESS -> ExtraKind.UNTYPED
    else -> current
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
    ArmorEditor(r.armor) { onChange(r.copy(armor = it)) }
    SectionTitle("Escudo")
    ShieldOption("Sem escudo", null, r.shield == null) { onChange(r.copy(shield = null)) }
    ShieldKind.entries.forEach { k ->
        ShieldOption(k.ptName, "Dureza ${k.hardness} · PV ${k.maxHp} · CA +${k.acBonus}", r.shield == k) { onChange(r.copy(shield = k)) }
    }
}

/** Armor: pick a basic one or build from scratch, then adjust stats and runes. Every number is a selection. */
@Composable
private fun ArmorEditor(a: ArmorSpec, onChange: (ArmorSpec) -> Unit) {
    val c = D20.colors
    var choosing by remember { mutableStateOf(false) }
    ShieldOption(a.name.ifBlank { "Armadura sem nome" }, armorSummary(a), selected = true) { choosing = !choosing }
    NeoButton(if (choosing) "Fechar lista" else "Escolher armadura", { choosing = !choosing }, ghost = true, modifier = Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp))
    if (choosing) {
        ShieldOption("＋ Criar do zero", "Começa sem bônus; ajuste tudo abaixo", false) {
            onChange(ArmorCatalog.apply(a, ArmorSpec(a.rank, 0, 6, "Armadura personalizada", ArmorCategory.LIGHT)))
            choosing = false
        }
        ArmorCatalog.basics.forEach { base ->
            ShieldOption(base.name, armorSummary(base), a.name == base.name && a.itemBonus == base.itemBonus && a.dexCap == base.dexCap) {
                onChange(ArmorCatalog.apply(a, base))
                choosing = false
            }
        }
    }
    Dropdown("Proficiência", Rank.entries, a.rank, { "${it.abbr} · ${it.ptName}" }, { onChange(a.copy(rank = it)) })
    NameField("Nome da armadura (texto livre)", a.name) { onChange(a.copy(name = it)) }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Dropdown("Categoria", ArmorCategory.entries, a.category, { it.ptName }, { onChange(a.copy(category = it)) }, Modifier.weight(1f))
        Stepper("Bônus de CA", a.itemBonus, 0..6, { onChange(a.copy(itemBonus = it)) }, Modifier.weight(1f), display = { if (it == 0) "—" else "+$it" })
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Limite de DES", a.dexCap, 0..6, { onChange(a.copy(dexCap = it)) }, Modifier.weight(1f), display = { "+$it" })
        Stepper("Penalidade", a.checkPenalty, 0..5, { onChange(a.copy(checkPenalty = it)) }, Modifier.weight(1f), display = { if (it == 0) "—" else "−$it" })
    }
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Deslocamento", a.speedPenalty, 0..20, { onChange(a.copy(speedPenalty = it)) }, Modifier.weight(1f), step = 5, display = { if (it == 0) "—" else "−$it pés" })
        Dropdown("Força exigida", listOf<Int?>(null) + (-1..6).toList(), a.strength, { it?.let(::signed) ?: "Nenhuma" }, { onChange(a.copy(strength = it)) }, Modifier.weight(1f))
    }
    Text(
        "A penalidade vale em perícias de FOR e DES; com a Força exigida ela some e o deslocamento perde 5 pés a menos.",
        color = c.muted, fontSize = 10.5.sp,
    )
    SectionTitle("Runas da armadura")
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Stepper("Potência (CA)", a.potency, 0..3, { onChange(a.copy(potency = it)) }, Modifier.weight(1f), display = { if (it == 0) "—" else "+$it" })
        Dropdown("Resiliência", (0..3).toList(), a.resilient, { resilientName(it) }, { onChange(a.copy(resilient = it)) }, Modifier.weight(1f))
    }
    a.skillRunes.forEachIndexed { i, rune ->
        fun set(n: SkillRune) = onChange(a.copy(skillRunes = a.skillRunes.mapIndexed { j, old -> if (j == i) n else old }))
        RuneCard(onRemove = { onChange(a.copy(skillRunes = a.skillRunes.filterIndexed { j, _ -> j != i })) }) {
            Dropdown("Perícia ou saber", runeSkills, rune.skill, { it.ptName }, { set(rune.copy(skill = it)) }, Modifier.weight(1.4f))
            Stepper("Bônus", rune.bonus, 1..3, { set(rune.copy(bonus = it)) }, Modifier.weight(1f), display = { "+$it" })
        }
    }
    if (a.skillRunes.size < 4) {
        NeoButton("+ Runa de perícia", { onChange(a.copy(skillRunes = a.skillRunes + SkillRune(CheckKind.STEALTH, 1))) }, ghost = true)
    }
    a.resistances.forEachIndexed { i, res ->
        fun set(n: Resistance) = onChange(a.copy(resistances = a.resistances.mapIndexed { j, old -> if (j == i) n else old }))
        RuneCard(onRemove = { onChange(a.copy(resistances = a.resistances.filterIndexed { j, _ -> j != i })) }) {
            Dropdown("Resistência a", DamageType.entries, res.type, { it.ptName }, { set(res.copy(type = it)) }, Modifier.weight(1.4f))
            Stepper("Valor", res.value, 1..30, { set(res.copy(value = it)) }, Modifier.weight(1f))
        }
    }
    if (a.resistances.size < 5) {
        val free = DamageType.entries.firstOrNull { t -> a.resistances.none { it.type == t } && !t.isPhysical } ?: DamageType.FIRE
        NeoButton("+ Resistência", { onChange(a.copy(resistances = a.resistances + Resistance(free, 5))) }, ghost = true)
    }
    Text(
        "Com este módulo em uma zona, a CA vem daqui e as runas e penalidades valem nas perícias e resistências dos outros módulos.",
        color = c.muted, fontSize = 10.5.sp,
    )
}

private val runeSkills = CheckKind.entries.filterNot { it.isSave }

private fun resilientName(n: Int) = when (n) { 0 -> "Nenhuma"; 1 -> "Resiliente +1"; 2 -> "Maior +2"; else -> "Superior +3" }

private fun armorSummary(a: ArmorSpec): String = buildList {
    add(a.category.ptName)
    add("CA +${a.itemBonus + a.potency}")
    add("DES máx +${a.dexCap}")
    if (a.checkPenalty > 0) add("−${a.checkPenalty} perícias")
    if (a.speedPenalty > 0) add("−${a.speedPenalty} pés")
    a.strength?.let { add("FOR ${signed(it)}") }
}.joinToString(" · ")

@Composable
private fun RuneCard(onRemove: () -> Unit, content: @Composable RowScope.() -> Unit) {
    NeoSurface(Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp), fill = D20.colors.surface, shadowOffset = 3.dp) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom, content = content)
            NeoButton("Remover", onRemove, ghost = true)
        }
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
