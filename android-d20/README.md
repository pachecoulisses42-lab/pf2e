# D20 Companion (Android)

App Android nativo (Kotlin + Jetpack Compose) em que o jogador monta um painel com o que mais importa do
personagem D20 e, **com 1 toque**, rola acerto + dano, ou resistência + grau de sucesso. O primeiro módulo de
regras é **Pathfinder 2e Remaster**; a arquitetura (viewport modular, engine D20 determinística, schema JSON)
segue os dois documentos-base do projeto. Veja [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Regras de entrada de dados
Só **Nome do personagem** e **nome de arma / magia / habilidade customizada** aceitam texto livre (máx. 40
caracteres, sem caracteres de controle). Todo o resto é seleção: dropdowns, steppers, chips e switches.

## Estrutura
| Módulo | O que é | Precisa de Android SDK? |
|---|---|---|
| `engine/` | Regras PF2e, graus de sucesso, schema JSON, validação, presets, executor de rolagem, editor do painel. Kotlin/JVM puro. | Não |
| `app/` | Telas Compose, Room (vários personagens), háptico/som, exportação JSON. | Sim |

## Como rodar
```bash
# Testes do motor de regras (qualquer JDK >= 17, sem Android SDK)
./gradlew -PengineOnly=true :engine:test

# App: abra android-d20/ no Android Studio (JDK 17+) ou, com o Android SDK 35 instalado:
./gradlew :app:assembleDebug
```

## O que foi verificado (e o que não foi)
- **Verificado por testes (54, todos passando):** `:engine` inteiro: proficiência, empilhamento por tipo, graus de
  sucesso (nat 20/1), dano com runas, crítico, FOR vs DES, magias, CA, schema/validação/JSON, presets, executor
  de rolagem e editor do painel.
- **Verificado só por checagem de tipos/compilação** (contra Compose Multiplatform + stubs): `ui/*` (exceto
  `App.kt`), `vm/*` e `data/CharacterRepository.kt`. Isso pega erros de assinatura, não de comportamento.
- **Não verificado:** compilação com o AGP/Android SDK de verdade, `App.kt` (navegação), `Database.kt` (Room/KSP),
  `Feedback.kt` (vibração/som), `MainActivity`/`D20Application`, e qualquer execução em aparelho ou emulador.
  O ambiente em que o código foi escrito não alcança o Google Maven nem instala o SDK. **O primeiro
  `assembleDebug` pode apontar ajustes de build; nenhum teste de tela/aparelho foi feito.**

## Limitações conhecidas (v0.1)
- Som é um bipe curto sintetizado (`ToneGenerator`), não um efeito de dados gravado.
- Sem ícone de launcher próprio; textos em português fixos no código (sem `strings.xml`).
- Sem importação de JSON (só exportação, via Storage Access Framework).
- Sem contadores de recurso além de PV/CA (espaços de magia, pontos de foco), sem dano de precisão (ataque
  furtivo), sem cura.
- Runas elementais aplicam só o +1d6 do tipo; efeitos de crítico das runas não são calculados.
