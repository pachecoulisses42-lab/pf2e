# Importar personagem do Pathbuilder 2e — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIO: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhamento.

**Objetivo:** importar um personagem exportado pelo Pathbuilder 2e (PDF impresso do JSON, arquivo `.json` ou texto colado). O app cria a ficha e transforma cada arma, armadura, perícia, magia, poção e talento num módulo separado. Os módulos ficam numa biblioteca do personagem, e o usuário escolhe quais colocar nas zonas.

**Arquitetura:** a leitura do formato Pathbuilder e o mapeamento para `Dashboard`/`Station` ficam no `:engine` (Kotlin puro, testável com `gradle -PengineOnly=true :engine:test`). O `:app` só converte o arquivo em texto, porque PDF exige PDFBox-Android. Depois chama o engine e mostra uma tela de revisão. Os módulos importados que não estão no painel ficam em `Dashboard.library` e aparecem no "Adicionar módulo".

**Stack:** Kotlin 2.0.21, kotlinx.serialization (JsonElement), Jetpack Compose, `com.tom-roush:pdfbox-android:2.0.27.0` (Apache-2.0, Maven Central, versão verificada em 2026-11-14).

**Especificação:** pedido do usuário de 2026-11-14 ("importar um arquivo de PDF contendo o código json de um personagem […] com as habilidades dele cada uma dentro de um módulo próprio e separado para eu poder selecionar quais eu irei utilizar") e a amostra `pathbuilder2e.com_json1.PDF` (Talon Hawkward, Feiticeiro 8). Fatos verificados na amostra:
- O PDF foi gerado pelo Chromium e tem camada de texto. Cada página começa com a linha `Estilos de formatação`, e essa linha cai no meio do JSON.
- Removendo essas linhas, o texto é JSON válido: `{"success":true,"build":{…}}`.
- O JSON traz só nomes para magias e talentos. Não tem dados, tipo de dano nem resistência do alvo.

## Restrições globais

- Só nome do personagem e nomes de arma, magia ou item são texto livre. Todo o resto continua seleção. Nomes importados passam por `Text.sanitize` (máx. 40 caracteres).
- Sem acesso à rede: a importação usa só o arquivo ou o texto que o usuário fornece. Buscar pelo ID do Pathbuilder fica fora do escopo.
- `minSdk 26`. Nenhuma dependência nova no `:engine`. No `:app`, a única nova é `com.tom-roush:pdfbox-android:2.0.27.0`.
- Personagens já salvos continuam abrindo: campos novos têm valor padrão (`library = emptyList()`).
- O exemplo `docs/example-fighter.json` é regenerado com `UPDATE_EXAMPLE=1 gradle -PengineOnly=true :engine:test` sempre que o schema mudar.
- Commits terminam com as linhas de atribuição da sessão. Branch: `claude/practical-lamport-m42x7t`.

## Foco de revisão

1. **PDF de outro navegador ou idioma:** o cabeçalho pode vir como "Formatting styles" ou "Pretty-print", ou nem vir. A limpeza não pode depender do texto português; ver o teste `drops any non-JSON header line` (Tarefa 2).
2. **Magia repetida em vários níveis** ("Propelling Air Stream" aparece nos níveis 1 a 5 da amostra): deve virar um único módulo por conjurador, no maior nível listado. Ver o teste `same spell listed at several ranks becomes one module` (Tarefa 4).
3. **Personagem sem arma, sem armadura ou com escudo desconhecido** ("Spellguard Shield"): a importação não pode falhar. Ela usa "Sem armadura" ou nenhum escudo e registra um aviso. Ver o teste `missing gear imports with warnings` (Tarefa 4).
4. **Atributos em valor (19), não em modificador:** 19 vira +4 e 8 vira −1 (arredonda para baixo). Ver o teste `ability scores become modifiers` (Tarefa 4).
5. **Texto que não é do Pathbuilder** (outro JSON, PDF sem texto, arquivo vazio): erro claro, nenhum personagem criado. Ver o teste `rejects text that is not a Pathbuilder build` (Tarefa 2) e o estado de erro da Tarefa 5.

---

### Tarefa 1: módulo "Habilidade" e biblioteca do personagem

**Arquivos:**
- Modificar: `engine/src/main/kotlin/d20/engine/schema/Dashboard.kt` (nova `AbilityStation`, `AbilityCategory`, campo `Dashboard.library`)
- Modificar: `engine/src/main/kotlin/d20/engine/schema/DashboardEditor.kt` (`StationType.ABILITY`, `newStation`)
- Modificar: `engine/src/main/kotlin/d20/engine/schema/ModuleLibrary.kt` (`type()`, `withId()`)
- Modificar: `engine/src/main/kotlin/d20/engine/schema/CardColor.kt` (cor padrão de `AbilityStation`: `ROSA`)
- Modificar: `engine/src/main/kotlin/d20/engine/schema/DashboardValidator.kt` (valida `AbilityStation` e as estações de `library`)
- Modificar: `engine/src/main/kotlin/d20/engine/play/PlayRunner.kt` (toque em `AbilityStation`)
- Teste: `engine/src/test/kotlin/d20/engine/schema/AbilityStationTest.kt`

**Interfaces:**
- Produz:
  - `enum class AbilityCategory(val ptName: String)` com `CLASS_FEAT("Talento de classe")`, `ANCESTRY_FEAT("Talento de ancestralidade")`, `SKILL_FEAT("Talento de perícia")`, `GENERAL_FEAT("Talento geral")`, `ARCHETYPE_FEAT("Talento de arquétipo")`, `CLASS_FEATURE("Característica de classe")`, `SPELL("Magia")`, `FOCUS_SPELL("Magia de foco")`, `OTHER("Outra")`.
  - `@SerialName("ABILITY") data class AbilityStation(override val id: String, val name: String, val category: AbilityCategory, val level: Int = 0, val effects: List<ConditionEffect> = emptyList(), override val color: CardColor? = null) : Station`, com `title = name`.
  - `Dashboard.library: List<Station> = emptyList()`.
  - `StationType.ABILITY("Habilidade / talento")`.
- `PlayRunner.run` para `AbilityStation` devolve `RollOutcome(title = name, subtitle = "${category.ptName} · nível $level", natural = null, total = null, …, tone = NEUTRAL, notices = effectNotices(effects, null))`.

- [ ] **Passo 1: escrever os testes que falham.** Em `AbilityStationTest`:
  - `ability station round-trips through dashboard JSON`: um `Dashboard` com uma `AbilityStation` na zona 1 e outra em `library` sobrevive a `DashboardJson.encode`/`decode` sem mudança.
  - `tapping an ability shows its effects as notices`: `AbilityStation(…, effects = listOf(ConditionEffect(ConditionKind.FRIGHTENED, 1)))` → `outcome.notices.size == 1`, `outcome.total == null`.
  - `library stations are validated`: uma `AbilityStation` com `name = ""` em `library` gera erro contendo `"biblioteca"`.
  - `old dashboards without library still decode`: JSON sem a chave `library` → `library == emptyList()`.
- [ ] **Passo 2:** `gradle -PengineOnly=true :engine:test --tests '*AbilityStationTest*'` → FALHA (classe inexistente).
- [ ] **Passo 3: implementar.** Também é preciso cobrir os `when` exaustivos sobre `Station` que o compilador apontar no `:engine`. No validator, as chaves de erro de `library` usam o prefixo `"biblioteca[i]"`. A validação de nível é `level in 0..20`.
- [ ] **Passo 4:** `UPDATE_EXAMPLE=1 gradle -PengineOnly=true :engine:test` e depois `gradle -PengineOnly=true :engine:test` → todos os testes passam.
- [ ] **Passo 5: commit** `feat(android-d20): ability module and per-character module library`.

---

### Tarefa 2: extrair e ler o JSON do Pathbuilder

**Arquivos:**
- Criar: `engine/src/main/kotlin/d20/engine/pathbuilder/PathbuilderText.kt`
- Criar: `engine/src/main/kotlin/d20/engine/pathbuilder/PathbuilderBuild.kt`
- Teste: `engine/src/test/kotlin/d20/engine/pathbuilder/PathbuilderTextTest.kt`
- Fixture: `engine/src/test/resources/pathbuilder/ezren-pdf.txt` (formato da amostra, com o cabeçalho de página repetido 3 vezes no meio do JSON) e `engine/src/test/resources/pathbuilder/ezren.json`. As duas são fixtures sintéticas: um Mago 5 com 1 arma, armadura, escudo de madeira, 2 conjuradores, magia repetida em vários níveis, 4 talentos, 2 saberes, `mods` com bônus de item e de circunstância, 1 poção de cura. Os dados reais do usuário não vão para o repositório.

**Interfaces:**
- Produz:
  - `object PathbuilderText { fun extractJson(text: String): String }`: descarta toda linha cujo primeiro caractere não-espaço não seja `{ } [ ] " , - 0-9 t f n`, depois corta do primeiro `{` ao último `}`. Lança `IllegalArgumentException("Nenhum JSON encontrado")` se não houver `{`.
  - `object PathbuilderParser { fun parse(json: String): PbBuild }`: aceita tanto `{"success":…,"build":{…}}` quanto o objeto `build` direto. Lança `IllegalArgumentException("Não é um personagem do Pathbuilder")` se faltar `name`, `class` ou `level`.
  - `data class PbBuild(name: String, className: String, level: Int, keyAbility: String?, scores: Map<String, Int>, ancestryHp: Int, classHp: Int, bonusHp: Int, bonusHpPerLevel: Int, speed: Int, profs: Map<String, Int>, itemBonuses: Map<String, Int>, lores: List<Pair<String, Int>>, feats: List<PbFeat>, specials: List<String>, weapons: List<PbWeapon>, armor: List<PbArmor>, resistances: List<String>, casters: List<PbCaster>, focus: List<PbFocus>, equipment: List<Pair<String, Int>>)`.
  - `PbFeat(name: String, type: String, level: Int)`
  - `PbWeapon(name, prof, die, pot: Int, striking: String, damageType: String, attack: Int, runes: List<String>)`
  - `PbArmor(name, prof, pot: Int, resilient: String, worn: Boolean, runes: List<String>)`
  - `PbCaster(name, tradition, ability: String, proficiency: Int, spells: List<Pair<Int, List<String>>>)`
  - `PbFocus(ability: String, proficiency: Int, spells: List<String>)`
  - `itemBonuses` guarda só as entradas `"Item Bonus"` de `mods`. As de circunstância são ignoradas.
  - Use `Json.parseToJsonElement` e leia os campos com tolerância: campo ausente → valor padrão. Assim mudanças pequenas no formato do Pathbuilder não quebram a importação.

- [ ] **Passo 1: testes que falham** em `PathbuilderTextTest`:
  - `extracts JSON from printed PDF text`: `PathbuilderParser.parse(PathbuilderText.extractJson(fixture("ezren-pdf.txt"))).name == "Ezren"`.
  - `drops any non-JSON header line`: o mesmo texto com `Estilos de formatação` trocado por `Formatting styles` faz o parse dar o mesmo `PbBuild`.
  - `accepts the bare build object`: `parse` de `ezren.json` sem o envelope `success/build` é igual ao parse com envelope.
  - `rejects text that is not a Pathbuilder build`: `extractJson("olá")` lança exceção, e `parse("{\"a\":1}")` lança exceção com `"Não é um personagem do Pathbuilder"`.
  - `reads feats, casters and item bonuses`: confere `feats.size == 4`, `casters[0].spells` e `itemBonuses["Diplomacy"] == 1`, e que o bônus de circunstância de `Reflex` ficou fora.
- [ ] **Passo 2:** rodar `--tests '*PathbuilderTextTest*'` → FALHA.
- [ ] **Passo 3: implementar** os dois arquivos.
- [ ] **Passo 4:** rodar → PASSA.
- [ ] **Passo 5: commit** `feat(android-d20): read Pathbuilder JSON from printed PDF text`.

---

### Tarefa 3: catálogo de magias com dano

**Arquivos:**
- Criar: `engine/src/main/kotlin/d20/engine/pathbuilder/SpellCatalog.kt`
- Teste: `engine/src/test/kotlin/d20/engine/pathbuilder/SpellCatalogTest.kt`

**Interfaces:**
- Produz: `object SpellCatalog { fun lookup(englishName: String, rank: Int, castingAbility: Ability, rankFromCaster: Rank): SpellSpec? }`. Devolve `null` para magia desconhecida ou sem dano. O nome da `SpellSpec` é o nome em português do `ModuleLibrary`, quando houver, senão o nome em inglês. A comparação de nomes ignora maiúsculas.
- Entradas: o dado base vale no nível base; cada nível acima soma o incremento.

| Inglês | Nível base | Dados base | Incremento por nível acima | Tipo | Modo / resistência do alvo |
|---|---|---|---|---|---|
| Electric Arc | 1 | 2d4 | +1d4 | Eletricidade | CD / Reflexos |
| Caustic Blast | 1 | 2d8 | +1d8 a cada 2 | Ácido | CD / Reflexos |
| Frostbite | 1 | 2d4 | +1d4 | Gelo | CD / Fortitude |
| Ignition | 1 | 2d4 | +1d4 | Fogo | Ataque |
| Telekinetic Projectile | 1 | 2d6 | +1d6 | Impactante | Ataque |
| Divine Lance | 1 | 2d4 | +1d4 | Espírito | Ataque |
| Vitality Lash | 1 | 2d6 | +1d6 | Vitalidade | CD / Fortitude |
| Void Warp | 1 | 2d4 | +1d4 | Vazio | CD / Fortitude |
| Daze | 1 | 1d6 | +1d6 a cada 2 | Mental | CD / Vontade |
| Needle Darts | 1 | 3d4 | +1d4 | Perfurante | Ataque |
| Breathe Fire | 1 | 2d6 | +2d6 | Fogo | CD / Reflexos |
| Fireball | 3 | 6d6 | +2d6 | Fogo | CD / Reflexos |
| Lightning Bolt | 3 | 4d12 | +1d12 | Eletricidade | CD / Reflexos |

- Truques (os de nível base 1 desta tabela, exceto Breathe Fire) já chegam com o nível de magia que o importador passa (Tarefa 4: metade do nível do personagem, arredondado para cima).
- Incremento "a cada 2" soma 1 dado a cada 2 níveis acima do base: `(rank - base) / 2`.

- [ ] **Passo 1: testes que falham:**
  - `fireball at rank 3 is 6d6 basic reflex`.
  - `heightened fireball at rank 5 is 10d6`.
  - `electric arc at rank 4 is 5d4`.
  - `caustic blast heightens every 2 ranks`: rank 4 → 3d8.
  - `unknown or utility spells return null`: `lookup("Invisibility", 2, …) == null`.
  - `lookup ignores case`.
- [ ] **Passo 2:** rodar → FALHA.
- [ ] **Passo 3: implementar** a tabela como `listOf(Entry(…))`.
- [ ] **Passo 4:** rodar → PASSA.
- [ ] **Passo 5: commit** `feat(android-d20): spell catalog for imported damage spells`.

---

### Tarefa 4: mapear PbBuild → painel + biblioteca

**Arquivos:**
- Criar: `engine/src/main/kotlin/d20/engine/pathbuilder/PathbuilderImport.kt`
- Teste: `engine/src/test/kotlin/d20/engine/pathbuilder/PathbuilderImportTest.kt`

**Interfaces:**
- Consome: `PbBuild` (Tarefa 2), `SpellCatalog.lookup` (Tarefa 3), `AbilityStation`/`Dashboard.library` (Tarefa 1), `ArmorCatalog`, `ShieldKind`, `ConsumableKind`.
- Produz:
  - `enum class ImportGroup(val ptName: String) { ATTACKS("Ataques"), DEFENSE("Defesa"), SAVES("Resistências e percepção"), SKILLS("Perícias e saberes"), SPELLS("Magias com dano"), OTHER_SPELLS("Outras magias"), ITEMS("Poções e bombas"), FEATS("Talentos e características") }`
  - `data class ImportItem(val station: Station, val group: ImportGroup)`
  - `data class ImportResult(val dashboard: Dashboard, val items: List<ImportItem>, val warnings: List<String>)`. O `dashboard` já vem com zonas preenchidas e todos os itens em `library`.
  - `object PathbuilderImport { fun build(pb: PbBuild, characterId: String): ImportResult; fun select(r: ImportResult, keep: Set<ImportGroup>): Dashboard }`. `select` tira de `library` os grupos desmarcados. As zonas não mudam.

**Regras de mapeamento (valores que o implementador não deve inventar):**

- **Classe:** nome em inglês → `PfClass`. Alchemist, Barbarian, Bard, Champion, Cleric, Druid, Fighter, Investigator, Monk, Ranger, Rogue, Sorcerer, Swashbuckler, Witch, Wizard. Desconhecida → `FIGHTER` mais o aviso `"Classe <x> não suportada: usando Guerreiro"`.
- **Modificador:** `floorDiv(score - 10, 2)`.
- **Atributo-chave:** `keyAbility` (`str…cha`) vira `Pf2eCharacter.keyAbility`.
- **Proficiências:** valor 0/2/4/6/8 → `UNTRAINED/TRAINED/EXPERT/MASTER/LEGENDARY`. `classDC` vira `classRank`. `fortitude`/`reflex`/`will` viram `saves`.
- **PV máximos:** `ancestryHp + bonusHp + level * (classHp + bonusHpPerLevel + mod(CON))`. Na amostra Talon isso dá 8 + 0 + 8 × (6 + 1 + 2) = 80.
- **Perícias** (`acrobatics…thievery` com prof > 0):
  - Viram `SkillStation(CheckSpec(kind, rank, itemBonus = itemBonuses[nome em inglês] ?: 0))`.
  - Percepção e as 3 resistências entram sempre, no grupo `SAVES`.
  - Cada saber vira `CheckKind.LORE` com `customName = "Saber: <nome>"` e item bonus vindo de `"Lore: <nome>"`.
- **Armas:**
  - Dado `"d4".."d12"` → `DieType`.
  - `striking`: `""` → `NONE`, `"striking"` → `STRIKING`, `"greaterStriking"` → `GREATER`, `"majorStriking"` → `MAJOR`.
  - `damageType`: `P/S/B` → `PIERCING/SLASHING/BLUDGEONING`.
  - Proficiência = `profs[prof]` (`simple`, `martial`, `advanced`, `unarmed`).
  - Atributo de ataque: `STR` se `mod(STR) + profBonus + pot == attack`, senão `DEX` se o mesmo cálculo com DES bater, senão `STR` mais o aviso `"<arma>: atributo de ataque não identificado"`.
  - Runas `flaming/frost/shock/corrosive/thundering` → `ElementalRune`. Outras runas → aviso.
- **Armadura:**
  - Primeira com `worn && prof != "shield"`, procurada por nome em `ArmorCatalog`. Mapa inglês → catálogo: Explorer's Clothing, Padded Armor, Leather Armor, Studded Leather Armor, Chain Shirt, Hide Armor, Scale Mail, Chain Mail, Breastplate, Splint Mail, Half Plate, Full Plate.
  - Sem armadura vestida → "Sem armadura". Nome desconhecido → mesma categoria do `prof` mais aviso.
  - `pot` → `potency`. `res`: `"resilient"` → 1, `"greaterResilient"` → 2, `"majorResilient"` → 3.
  - Proficiência = `profs[prof]`.
  - `resistances` no formato `"Fire 5"` → `Resistance(FIRE, 5)`. Tipos desconhecidos geram aviso.
- **Escudo:** o primeiro com `worn && prof == "shield"`, por nome contendo `Buckler/Wooden/Steel/Tower/Fortress` → `ShieldKind`. Outro nome → nenhum escudo mais o aviso `"Escudo <x> não reconhecido: escolha um no módulo Vida, escudo & defesa"`.
- **Magias:**
  - Para cada conjurador, cada nome vira um módulo só, no maior `spellLevel` listado.
  - Nível 0 (truque) → nível de magia `ceil(level / 2)`.
  - A proficiência de cada conjurador = `profs` do valor `proficiency`. Use `fromClass = (proficiency == profs["classDC"])`.
  - `SpellCatalog.lookup` não nulo → `SpellStation` no grupo `SPELLS`. Nulo → `AbilityStation(category = SPELL, level = nível)` no grupo `OTHER_SPELLS`.
  - Magias de foco → `AbilityStation(category = FOCUS_SPELL)`, salvo se estiverem no catálogo.
- **Itens:**
  - `"Healing Potion (<Grade>)"` → `ConsumableStation(HEALING_POTION, grade, quantity = qty)`. Graus: Minor, Lesser, Moderate, Greater, Major.
  - `"Alchemist's Fire|Acid Flask|Bottled Lightning|Frost Vial|Blasting Stone (<Grade>)"` → bomba equivalente.
  - O resto do equipamento é ignorado, sem aviso.
- **Talentos:**
  - `PbFeat.type` → `AbilityCategory`: `"Class Feat"`/`"Witch Feat"` etc. com "Class" ou o nome de uma classe → `CLASS_FEAT`; `"Ancestry Feat"` → `ANCESTRY_FEAT`; `"Skill Feat"` → `SKILL_FEAT`; `"General Feat"` → `GENERAL_FEAT`; `"Archetype Feat"` → `ARCHETYPE_FEAT`; `"Heritage"` → `OTHER`.
  - `specials` → `CLASS_FEATURE`, nível 0.
- **Ids:**
  - `"st-NN"` sequenciais para o painel; `"lib-NNN"` para a biblioteca.
  - Os itens do painel também ficam na biblioteca, com id `lib-`, para o usuário poder recolocá-los.
- **Painel inicial:**
  - Zona 1: `GRID_1X2`, com a arma de maior `attack` e a primeira magia de `SPELLS`. Se não houver magia de dano, entra a segunda arma; se também não houver, o slot fica vazio.
  - Zona 2: `GRID_2X2`, com Percepção, Fortitude, Reflexos e Vontade.
  - Zona 3: `GRID_1X2`, com `ResourceStation` (PV, armadura, escudo) e `ConditionsStation`.
- O `dashboard` gerado precisa passar em `DashboardValidator.validate` sem erros. Nomes passam por `Text.sanitize`.

- [ ] **Passo 1: testes que falham** em `PathbuilderImportTest` (fixture `ezren.json`):
  - `ability scores become modifiers`: 19 → 4, 8 → −1, 10 → 0.
  - `class rank, saves and HP come from the build`: confere `classRank`, os ranks de `saves` e `ResourceStation.maxHp` com a fórmula acima.
  - `weapon attack ability is inferred from the attack total`.
  - `same spell listed at several ranks becomes one module`: na fixture há uma magia nos níveis 1 a 3 → exatamente 1 módulo, nível 3.
  - `known damage spell becomes a spell module, others become abilities`.
  - `potions keep their grade and quantity`.
  - `missing gear imports with warnings`: um build sem `weapons` e sem `armor`, com escudo `"Spellguard Shield"`, importa com armadura "Sem armadura", sem escudo e com 1 aviso de escudo.
  - `imported dashboard is valid and fills three zones`: `DashboardValidator.validate(r.dashboard) == emptyList()` e a zona 2 tem 4 estações.
  - `deselecting a group removes it from the library only`.
- [ ] **Passo 2:** rodar → FALHA.
- [ ] **Passo 3: implementar** `PathbuilderImport`, com uma função privada por regra acima.
- [ ] **Passo 4:** `gradle -PengineOnly=true :engine:test` → todos os testes passam.
- [ ] **Passo 5: commit** `feat(android-d20): map Pathbuilder builds to panel and module library`.

---

### Tarefa 5: tela de importação, leitura de PDF e uso da biblioteca

**Arquivos:**
- Modificar: `gradle/libs.versions.toml` e `app/build.gradle.kts` (dependência `com.tom-roush:pdfbox-android:2.0.27.0`)
- Modificar: `app/src/main/java/com/d20companion/D20Application.kt` (`PDFBoxResourceLoader.init(applicationContext)` em `onCreate`)
- Criar: `app/src/main/java/com/d20companion/data/ImportReader.kt`
- Criar: `app/src/main/java/com/d20companion/vm/ImportViewModel.kt`
- Criar: `app/src/main/java/com/d20companion/ui/ImportScreen.kt`
- Modificar: `app/src/main/java/com/d20companion/ui/App.kt` (rota `"import"`), `ui/HomeScreen.kt` (cartão "Importar do Pathbuilder", cor `VIOLETA`, glifo `⇩`), `ui/ListScreen.kt` (item "Importar do Pathbuilder" no menu ⋮)
- Modificar: `app/src/main/java/com/d20companion/data/CharacterRepository.kt` (`suspend fun createFrom(d: Dashboard): String`)
- Modificar: `app/src/main/java/com/d20companion/ui/AddModuleSheet.kt` (seção "Importados deste personagem", com os módulos de `dashboard.library` do tipo escolhido) e `ui/StationCards.kt`/`ui/StationEditor.kt` (cartão e editor de `AbilityStation`: nome, categoria, nível 0..20, `EffectsEditor`)
- Modificar: `app/src/main/java/com/d20companion/vm/SheetViewModel.kt` (`addModule` já copia; nada novo além de passar `dashboard.library` para a folha)

**Interfaces:**
- Consome: `PathbuilderText.extractJson`, `PathbuilderParser.parse`, `PathbuilderImport.build/select` e `ImportGroup` (Tarefas 2 e 4).
- Produz:
  - `class ImportReader(context: Context) { suspend fun readText(uri: Uri): String }`. Usa `PDDocument.load` + `PDFTextStripper` quando o MIME ou o nome terminar em `pdf`, senão lê o texto UTF-8. Roda em `Dispatchers.IO`.
  - `ImportViewModel`, com o estado `ImportState(loading, result: ImportResult?, keep: Set<ImportGroup>, error: String?)` e as funções `load(uri)`, `loadText(text)`, `toggle(group)`, `confirm(onCreated: (String) -> Unit)`. O `confirm` salva via `repository.createFrom(PathbuilderImport.select(result, keep))` e define `prefs.lastCharacterId`.
- **Tela de importação:**
  - Botões "Escolher PDF ou JSON" (`ActivityResultContracts.OpenDocument` com `arrayOf("application/pdf", "application/json", "text/plain")`) e "Colar JSON" (folha com um campo de texto multilinha). O campo não fica no personagem, por isso não quebra a regra de texto livre.
  - Depois de ler, mostra o resumo: nome, classe, nível, CD de classe. Para cada `ImportGroup`, uma linha com contagem e caixa de seleção (todas marcadas por padrão). Depois vem a lista de avisos e o botão "Criar personagem".
  - Em erro, mostra a mensagem da exceção num `ErrorBanner` e não cria nada.

- [ ] **Passo 1:** adicionar a dependência e rodar a verificação local de tipos (o harness em scratchpad) com stubs para `PDDocument`/`PDFTextStripper`/`PDFBoxResourceLoader`. Esperado: compila.
- [ ] **Passo 2: implementar** `ImportReader`, `ImportViewModel`, `ImportScreen`, a rota e os pontos de entrada.
- [ ] **Passo 3: implementar** a seção "Importados deste personagem" no `AddModuleSheet` e o cartão e o editor de `AbilityStation`.
- [ ] **Passo 4:** rodar a verificação local de tipos → BUILD SUCCESSFUL. Depois `gradle -PengineOnly=true :engine:test` → passa.
- [ ] **Passo 5: atualizar a documentação e a versão.** `docs/ARCHITECTURE.md` ganha um parágrafo "Importar do Pathbuilder" e a seção de licenças menciona o PDFBox-Android (Apache-2.0). Em `app/build.gradle.kts`: `versionCode = 8`, `versionName = "0.7.0"`.
- [ ] **Passo 6: commit e push**: `feat(android-d20): import characters from Pathbuilder PDF or JSON`. Depois, conferir o workflow `android-d20.yml` (testes do engine e `assembleDebug`) até ficar verde.
- [ ] **Passo 7: teste manual no aparelho**, com o PDF do usuário:
  - importar e conferir CA 23 (o `acTotal` do Pathbuilder);
  - conferir os PV calculados;
  - conferir que Fireball aparece em "Magias com dano";
  - conferir que "Explosion of Power" aparece em "Talentos e características";
  - colocar uma magia importada numa zona pelo "Adicionar módulo".
