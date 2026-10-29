package com.d20companion.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.d20companion.R
import com.d20companion.data.CharacterSummary
import com.d20companion.vm.ListViewModel
import d20.engine.schema.CardColor

/** Start screen: the app's die on coral, then three big cards — new character, load character, settings. */
@Composable
fun HomeScreen(
    vm: ListViewModel,
    characters: List<CharacterSummary>,
    lastCharacter: CharacterSummary?,
    nav: NavActions,
    onOpen: (String) -> Unit,
) {
    val c = D20.colors
    var creating by remember { mutableStateOf(false) }
    Column(
        Modifier.fillMaxSize().background(c.bg).verticalScroll(rememberScrollState()).padding(start = 20.dp, end = 15.dp, top = 28.dp, bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        NeoSurface(Modifier.size(132.dp), fill = CardColor.CORAL.fill(), radius = 32.dp, shadowOffset = 6.dp, contentAlignment = Alignment.Center) {
            Image(painterResource(R.drawable.ic_launcher_foreground), contentDescription = null, modifier = Modifier.size(132.dp))
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("D20 Companion", color = c.text, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp)
            Text("Pathfinder 2e Remaster", color = c.muted, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
        }
        Spacer(Modifier.height(4.dp))
        HomeCard("Novo personagem", "Escolha nome e classe; o painel inicial já vem montado.", "＋", CardColor.MOSTARDA) { creating = true }
        HomeCard(
            "Carregar personagem",
            when (characters.size) { 0 -> "Nenhum personagem salvo ainda."; 1 -> "1 personagem salvo."; else -> "${characters.size} personagens salvos." },
            "▤", CardColor.VERDE, nav.toList,
        )
        HomeCard("Ajustes", "Tema claro ou escuro, som ao rolar.", "⚙", CardColor.AZUL, nav.toSettings)
        if (lastCharacter != null) {
            NeoButton(
                "Continuar com ${lastCharacter.name}", { onOpen(lastCharacter.id) }, ghost = true,
                modifier = Modifier.fillMaxWidth().padding(end = 3.dp, bottom = 3.dp),
            )
        }
    }
    if (creating) NewCharacterSheet(onDismiss = { creating = false }) { name, cls -> creating = false; vm.create(name, cls, onOpen) }
}

@Composable
private fun HomeCard(title: String, subtitle: String, glyph: String, color: CardColor, onClick: () -> Unit) {
    val text = color.onFill()
    NeoSurface(Modifier.fillMaxWidth().padding(end = 5.dp, bottom = 5.dp), fill = color.fill(), radius = 16.dp, onClick = onClick) {
        Row(Modifier.padding(horizontal = 16.dp, vertical = 18.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            NeoSurface(Modifier.size(48.dp), fill = D20.colors.surface, radius = 24.dp, borderWidth = 2.5.dp, shadowOffset = 0.dp, contentAlignment = Alignment.Center) {
                Text(glyph, color = Ink, fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, textAlign = TextAlign.Center)
            }
            Column(Modifier.weight(1f)) {
                Text(title, color = text, fontWeight = FontWeight.ExtraBold, fontSize = 18.sp)
                Text(subtitle, color = text, fontWeight = FontWeight.Medium, fontSize = 12.sp)
            }
            Text("›", color = text, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp)
        }
    }
}
