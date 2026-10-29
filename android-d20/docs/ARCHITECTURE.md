# Arquitetura

Mapeia cada requisito dos documentos-base ("Guia de Implementação: Arquitetura Modular de UI e Engine D20" e
o deck "Arquitetura Modular para RPGs Mobile") para o código.

## 1. Viewport e grid (guia §1.1)
| Requisito | Onde |
|---|---|
| 3 zonas empilhadas (topo / centro / base) | `ui/SheetScreen.kt` → `Viewport` (`ZoneKey` em `schema/DashboardEditor.kt`) |
| Layouts `GRID_1X1` / `GRID_1X2` / `GRID_2X2` (1-2-4 estações) | `schema/Dashboard.kt` → `GridLayout.slots`; desenho em `ui/ZoneGrid.kt` |
| Tipos de módulo `ACTION` / `SPELL` / `SKILL` / `RESOURCE` | `schema/Dashboard.kt` → `sealed interface Station`; cartões em `ui/StationCards.kt` |

## 2. Ciclo de vida: Setup vs Play (guia §1.2)
- Estado unidirecional em `vm/SheetViewModel.kt` (`SheetState` + funções que o alteram).
- **Setup**: edição do rascunho com `schema/DashboardEditor.kt` (funções puras e testadas). Seleção de layout,
  atribuição de módulos e configuração de payload (`ui/StationEditor.kt`, só seleções).
- **Adicionar módulo** (`ui/AddModuleSheet.kt`): escolhe o tipo, depois "Criar do zero", **Meus módulos** ou um
  módulo básico de `schema/ModuleLibrary.kt` (armas, truques/magias, poções, bombas, ações de perícia). O escolhido é
  **copiado** com id novo (`DashboardEditor.addCopy`) e abre no editor; o original nunca muda. "Salvar em Meus
  módulos" guarda a versão editada (`SavedModules`, JSON em `data/Prefs.kt` via `data/ModuleStore.kt`), compartilhada
  por todos os personagens.
- **Danos extras em magias** (`pf2e/ExtraDamage.kt`): fonte (Feitiçaria Perigosa, Zona elemental, Fraqueza do alvo…),
  tipo de bônus (Circunstância, Estado, Mágico, Item, Sem tipo), dados/valor fixo e tipo de dano. Do mesmo tipo só vale o
  maior (`ExtraDamageStack`); "Sem tipo" soma. Fraqueza entra depois de dobrar/reduzir à metade e só se houver dano.
- **Tela inicial** (`ui/HomeScreen.kt`, destino inicial): Novo personagem, Carregar personagem, Ajustes e "Continuar com" o último aberto.
- **Navegação**: menu "⋮" no topo (`NavMenu` em `ui/Neo.kt`) com Início / Personagens / Painel / Condições / Ajustes.
- **Salvar & Travar**: `lockAndSave()` valida com `DashboardValidator`, persiste (Room) e vai para Play.
- **Play**: painel congelado; toque → `PlayRunner.run` → `RollOverlay`. Botões de edição ficam ocultos.

## 3. Engine D20 (guia §2)
| Requisito | Onde |
|---|---|
| Bônus/penalidade tipados, prevalece o maior por tipo | `core/Modifiers.kt` → `ModifierStack` |
| Exceção PF2e: bônus sem tipo somam | idem (desvio do pseudocódigo do guia, documentado nos testes) |
| Pipeline determinístico, RNG injetável | `pf2e/Pf2eEngine.kt` (`Roller`); ordem de sorteio: d20, dados, runas |
| Acerto crítico / graus de sucesso | `core/Degree.kt` (±10 da CD, nat 20/1 mudam um grau) |
| Tipagem de dano por parcela | `pf2e/Results.kt` → `DamagePart` (uma linha por tipo) |

### Regras PF2e Remaster implementadas
- Proficiência = nível + 2/4/6/8 (T/E/M/L); destreinado = 0.
- Acerto = d20 + atributo primário + proficiência + runa de **potência** − ataque múltiplo (ágil: −4/−8).
- Atributo primário **FOR** soma em acerto **e** dano; **DES** (e demais) só no acerto.
- Dano = (dados base + dados da runa de **impacto**) + FOR (se FOR) + **especialização** (E +2 / M +3 / L +4,
  dobrada com "especialização maior") + **runas elementais** (+1d6 cada, em campos separados). Crítico dobra tudo.
  Dano mínimo 1.
- Magia: ataque (d20 + atributo + prof.) ou CD (10 + atributo + prof.); o usuário toca o resultado da resistência
  do alvo e o app aplica a resistência básica (0 / metade / total / dobro).
- CA = 10 + DES (limitada pela armadura) + proficiência + bônus de item.

## 4. Catálogo de estações (guia §3) e schema (guia §4)
- `schema/Dashboard.kt` implementa o contrato `RPGMobileDashboard` (`characterId`, `characterClass`, `zones.zone1..3`
  com `layout` + `stations`). Exemplo real: [example-fighter.json](example-fighter.json) (um teste garante que ele
  não fica defasado).
- **Desvio deliberado do guia:** o payload de cada estação é *estruturado* (campos selecionáveis), não uma string
  `diceFormula` digitada. É a única forma de cumprir "só seleção". O export inclui `diceFormula` e
  `secondaryDiceFormula` derivados (`pf2e/Formulas.kt`), só para leitura; são ignorados na importação.
- `schemaVersion` permite migrações futuras.

## 5. Presets (guia §5)
`schema/Presets.kt`: Guerreiro, Ladino, Mago e Clérigo (zona 1: 2 ataques/magias, zona 2: 4 perícias, zona 3: PV/CA).
Demais classes começam com painel em branco.

## 6. UI/UX (guia §6)
| Requisito | Onde |
|---|---|
| Animação de dados ≤ 800 ms | `ui/RollOverlay.kt` (600 ms; o resultado real já vem do engine) |
| Háptico 50 ms no toque | `feedback/Feedback.kt` |
| Som no acionamento | `feedback/Feedback.kt` (bipe sintetizado, ver limitações) |
| `border-radius` 12 dp, sombra suave, glow por `characterClass` | `ui/Theme.kt` (`CardShape`, `PfClass.glow`), `ui/Components.kt` (`GlowCard`) |
| Verde `#2ECC71` / Vermelho `#E74C3C` / Dourado `#F1C40F` | `ui/Theme.kt` (`ResultColors`); mapeamento em `play/PlayRunner.kt` (`Tone`) |
| Sem WebView, só primitivas nativas | Compose puro |
| Cartão secundário com dano/efeito | `ui/RollOverlay.kt` → `DamageDrawer` |

## 7. Persistência e exportação
Room guarda uma linha por personagem (`data/Database.kt`): JSON validado do painel + PV atual (estado de jogo,
fora do painel travado). Exportação: menu do personagem → "Exportar JSON" (Storage Access Framework).

## Estendendo para outro sistema D20
O motor de PF2e vive em `engine/.../pf2e`. Outro sistema (ex.: D&D 5e) entraria como um pacote irmão com seu próprio
`*Engine` e modelos, reutilizando `core/` (dados, modificadores, graus) e a UI por estações. Hoje `Dashboard.ruleSystem`
só aceita `pf2e-remaster`; abstrair um `RuleSystem` só vale a pena quando existir o segundo sistema.
