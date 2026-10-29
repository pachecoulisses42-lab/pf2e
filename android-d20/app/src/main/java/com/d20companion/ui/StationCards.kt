package com.d20companion.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import d20.engine.conditions.PlayRules
import d20.engine.conditions.PlayState
import d20.engine.conditions.StatusPenalties
import d20.engine.pf2e.Ability
import d20.engine.pf2e.ConsumableKind
import d20.engine.pf2e.ConsumableTables
import d20.engine.pf2e.Formulas
import d20.engine.pf2e.Pf2eEngine
import d20.engine.pf2e.SpellMode
import d20.engine.play.PlayRunner
import d20.engine.schema.ActionStation
import d20.engine.schema.ConditionsStation
import d20.engine.schema.ConsumableStation
import d20.engine.schema.Dashboard
import d20.engine.schema.ResourceStation
import d20.engine.schema.resourceStation
import d20.engine.schema.SkillStation
import d20.engine.schema.SpellStation
import d20.engine.schema.Station
import d20.engine.schema.effectiveColor

class CardActions(val onHp: (Int) -> Unit, val onToggleShield: () -> Unit, val onBlock: () -> Unit)

/**
 * One station module as a coloured card with a hard shadow. In Play a tap rolls (resource cards hold their own
 * buttons); in Setup a tap edits. Numbers include the status penalties of your active conditions.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StationCard(
    station: Station,
    dashboard: Dashboard,
    play: PlayState,
    setup: Boolean,
    compact: Boolean,
    onTap: () -> Unit,
    actions: CardActions,
    modifier: Modifier = Modifier,
) {
    val color = station.effectiveColor()
    val on = color.onFill()
    val c = dashboard.character
    val conds = play.conditions
    val tappable = setup || station !is ResourceStation
    NeoSurface(modifier = modifier, fill = color.fill(), onClick = if (tappable) onTap else null) {
        Box(Modifier.fillMaxSize().padding(10.dp)) {
            when (station) {
                is ActionStation -> {
                    val w = station.weapon
                    val pen = StatusPenalties.modifiers(conds, w.attackAbility).firstOrNull()
                    CardFace(station.title, signed(Formulas.attackBonus(c, w) + (pen?.value ?: 0)),
                        "Dano " + Formulas.damage(c, w) + penaltyNote(pen?.label, pen?.value), on, compact, setup) {
                        TagRow(w.traits.map { it.ptName }, on)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            w.elemental.forEach { ElementChip(it.damageType, label = it.ptName) }
                        }
                    }
                }
                is SpellStation -> {
                    val s = station.spell
                    val pen = StatusPenalties.modifiers(conds, s.castingAbility).firstOrNull()
                    if (s.mode == SpellMode.SAVE) {
                        CardFace(station.title, "CD " + Pf2eEngine.spellDc(c, s, conds), Formulas.spellDamage(s) + " " + s.damageType.ptName + penaltyNote(pen?.label, pen?.value), on, compact, setup)
                    } else {
                        CardFace(station.title, signed(Formulas.spellAttackBonus(c, s) + (pen?.value ?: 0)), "Dano " + Formulas.spellDamage(s) + " " + s.damageType.ptName + penaltyNote(pen?.label, pen?.value), on, compact, setup)
                    }
                }
                is SkillStation -> {
                    val k = station.check
                    val ability = k.abilityOverride ?: k.kind.defaultAbility
                    val pen = StatusPenalties.modifiers(conds, ability).firstOrNull()
                    CardFace(station.title, signed(Formulas.checkBonus(c, k, dashboard.resourceStation()?.armor) + (pen?.value ?: 0)),
                        ability.abbr + " · " + k.rank.ptName + penaltyNote(pen?.label, pen?.value), on, compact, setup) {
                        TagRow(station.effects.take(2).map { it.condition.ptName }, on)
                    }
                }
                is ConsumableStation -> {
                    val spec = station.consumable
                    val left = PlayRules.remaining(play, station.id, spec)
                    val uses = "$left restante" + if (left == 1) "" else "s"
                    val (big, sub) = if (spec.kind == ConsumableKind.HEALING_POTION) {
                        (Formulas.consumable(c, spec)?.first ?: "") to "${spec.grade.ptName} · $uses"
                    } else if (spec.kind.isBomb) {
                        val pen = StatusPenalties.modifiers(conds, Ability.DEX).firstOrNull()
                        val st = ConsumableTables.bomb(spec.kind, spec.grade)
                        signed(Formulas.bombBonus(c, spec) + (pen?.value ?: 0)) to "${if (st.die != null) "${st.diceCount}${st.die!!.label}" else "${st.directFlat}"} ${st.type.ptName} · $uses"
                    } else "—" to "${spec.grade.ptName} · $uses"
                    Box(Modifier.alpha(if (left == 0 && !setup) 0.5f else 1f)) {
                        CardFace(station.title, big, sub, on, compact, setup) { TagRow(listOf(spec.kind.ptName), on) }
                    }
                }
                is ConditionsStation -> {
                    val count = play.conditions.map { it.kind }.distinct().size + play.persistent.size + play.afflictions.size
                    val names = (play.conditions.groupBy { it.kind }.map { (k, v) -> k.label(v.maxOf { it.value }) } +
                        play.persistent.map { "Persistente " + it.spec.type.ptName } + play.afflictions.map { it.affliction.name }).take(3)
                    CardFace("Condições", "$count", if (names.isEmpty()) "Nenhuma ativa" else names.joinToString(" · "), on, compact, setup)
                }
                is ResourceStation -> ResourceFace(station, dashboard, play, setup, actions, on)
            }
            if (setup) {
                Text("✎", color = on.copy(alpha = 0.8f), fontSize = 14.sp, modifier = Modifier.align(Alignment.TopEnd))
            }
        }
    }
}

private fun penaltyNote(label: String?, value: Int?): String = if (label == null || value == null) "" else " · ${value} $label"

@Composable
private fun CardFace(
    label: String, big: String, sub: String, on: Color, compact: Boolean, setup: Boolean,
    extras: @Composable () -> Unit = {},
) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(1.dp)) {
        Text(
            label.uppercase(), color = on, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.3.sp,
            maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(end = if (setup) 18.dp else 0.dp),
        )
        Text(big, color = on, fontSize = if (compact) 26.sp else 32.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
        Text(sub, color = on.copy(alpha = 0.9f), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
        extras()
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun TagRow(tags: List<String>, on: Color) {
    if (tags.isEmpty()) return
    FlowRow(Modifier.padding(top = 3.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
        tags.forEach { t ->
            NeoSurface(fill = Color.White.copy(alpha = 0.55f), border = Ink, radius = 8.dp, borderWidth = 2.dp, shadowOffset = 0.dp) {
                Text(t, color = Ink, fontSize = 9.5.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 5.dp))
            }
        }
    }
}

@Composable
private fun ResourceFace(r: ResourceStation, d: Dashboard, play: PlayState, setup: Boolean, actions: CardActions, on: Color) {
    val baseAc = PlayRunner.armorClass(d, r, shieldRaised = false, conditions = play.conditions)
    val raisedAc = PlayRunner.armorClass(d, r, shieldRaised = true, conditions = play.conditions)
    val shield = r.shield
    val acText = if (shield != null && play.shieldRaised) "CA $raisedAc (escudo erguido)" else if (shield != null) "CA $baseAc ($raisedAc com escudo)" else "CA $baseAc"
    val fraction = if (r.maxHp > 0) (play.hp.toFloat() / r.maxHp).coerceIn(0f, 1f) else 0f
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text("PV · $acText".uppercase(), color = on, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.3.sp, maxLines = 2, modifier = Modifier.padding(end = if (setup) 18.dp else 0.dp))
        Text(if (setup) "máx ${r.maxHp}" else "${play.hp} / ${r.maxHp}", color = on, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
        Row(Modifier.fillMaxWidth().height(15.dp), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            val filled = Math.round(fraction * 10)
            repeat(10) { i ->
                NeoSurface(Modifier.weight(1f).fillMaxSize(), fill = if (setup || i < filled) Ink else Color.White.copy(alpha = 0.45f), border = Ink, radius = 4.dp, borderWidth = 2.dp, shadowOffset = 0.dp) {}
            }
        }
        if (!setup) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (delta in listOf(-5, -1, +1, +5)) {
                    SmallBtn(if (delta > 0) "+$delta" else "−${-delta}", Modifier.weight(1f)) { actions.onHp(delta) }
                }
            }
        }
        val armor = r.armor
        val gear = buildList {
            add(armor.name.ifBlank { armor.category.ptName })
            armor.effectiveSpeedPenalty(d.character).takeIf { it > 0 }?.let { add("−$it pés") }
            armor.resistances.forEach { add("Resist. ${it.type.ptName} ${it.value}") }
        }
        Text(gear.joinToString(" · "), color = on, fontSize = 10.5.sp, fontWeight = FontWeight.SemiBold, maxLines = 2)
        if (shield != null) {
            val hp = play.shieldHp ?: shield.maxHp
            val broken = hp <= shield.brokenThreshold
            NeoSurface(Modifier.fillMaxWidth(), fill = Color.White.copy(alpha = 0.55f), border = Ink, radius = 10.dp, borderWidth = 2.5.dp, shadowOffset = 0.dp) {
                Column(Modifier.padding(horizontal = 8.dp, vertical = 5.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("${shield.ptName} · Dureza ${shield.hardness} · PV $hp/${shield.maxHp}" + if (broken) " · quebrado" else "", color = Ink, fontSize = 10.5.sp, fontWeight = FontWeight.Bold)
                    if (!setup) {
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            SmallBtn(if (play.shieldRaised) "Baixar" else "Erguer", Modifier.weight(1f), enabled = play.shieldRaised || !broken) { actions.onToggleShield() }
                            SmallBtn("Bloquear", Modifier.weight(1f), enabled = !broken) { actions.onBlock() }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SmallBtn(text: String, modifier: Modifier, enabled: Boolean = true, onClick: () -> Unit) {
    NeoSurface(
        modifier.alpha(if (enabled) 1f else 0.4f), fill = Color.White.copy(alpha = 0.75f), border = Ink, radius = 10.dp, borderWidth = 2.5.dp,
        shadowOffset = 0.dp, contentAlignment = Alignment.Center, onClick = if (enabled) onClick else null,
    ) { Text(text, color = Ink, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1, modifier = Modifier.padding(vertical = 3.dp)) }
}
