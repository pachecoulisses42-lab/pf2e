# Guia do layout e dos tokens do Brigandine

Este documento explica **como o app é montado**, **como o visual funciona** e **como criar novos
tokens**. Serve para quem vai mexer no código, para quem vai pedir a uma IA que mexa e para
quem só quer entender as decisões.

Sumário
1. [Visão geral e comandos](#1-visão-geral-e-comandos)
2. [Estrutura de arquivos](#2-estrutura-de-arquivos)
3. [Layout do app](#3-layout-do-app)
4. [Sistema de design](#4-sistema-de-design)
5. [Tema Pergaminho: receitas](#5-tema-pergaminho-receitas)
6. [Componentes](#6-componentes)
7. [Tokens de peça](#7-tokens-de-peça)
8. [Como adicionar um token novo](#8-como-adicionar-um-token-novo)
9. [Imagens próprias como token](#9-imagens-próprias-como-token)
10. [Regras que valem para qualquer mudança](#10-regras-que-valem-para-qualquer-mudança)

---

## 1. Visão geral e comandos

Brigandine é um tabuleiro tático para Pathfinder 2e Remaster que roda **direto no navegador**,
sem servidor. O resultado final é **um único arquivo HTML** (`dist/brigandine_pf2e_tatico_v5.html`)
com todo o CSS, JavaScript e ícones dentro.

```bash
cd brigandine
npm run build        # gera dist/ a partir de src/
npm test             # testes das regras (sem dependências, Node 20+)
npm run test:e2e     # teste no navegador (precisa de Playwright e Chromium)
npm run test:e2e:mobile   # o mesmo, simulando celular com toque
npm run check        # build + testes
```

Para ver o design system funcionando: abra `dist/design-system.html` (alterna entre os dois temas e
mostra todos os componentes e os dois estilos de token).

Há **dois modos** de uso:

| Modo | Para quê | Cor de acento (Pergaminho) |
| --- | --- | --- |
| **Montagem** | Montar o tabuleiro, posicionar peças, editar ficha, armas, magias, itens e defesas | verde |
| **Combate** | Iniciativa, turnos, movimento, ataques, magias, itens, Erguer Escudo | vermelho |

---

## 2. Estrutura de arquivos

```
brigandine/
  src/
    index.html                 Estrutura da tela (marcadores /*@css*/, /*@js*/, <!--@icons-->)
    icons.svg                  Sprite de ícones (traço, cor herdada)
    styles/
      tokens.css               Cores, tipografia, espaço, raio, sombras (tema Moderno)
      base.css                 Reset, foco, rolagem, utilitários
      components.css           Botões, campos, abas, cartas, pips, tooltip…
      layout.css               Casca do app, painéis, HUD, gaveta de registro, celular
      theme-parchment.css      Tema Pergaminho (sobrepõe tudo em body.theme-parchment)
    js/                        Concatenados em ordem alfabética
      00a-token-kit.js         Kit do estilo "medalhão"
      00b/00c-tokens-*.js      12 tokens no estilo medalhão
      00d-chibi-kit.js         Kit do estilo "chibi" (o padrão)
      00e-chibi-heroes.js      9 heróis chibi
      00f-chibi-villains.js    3 vilões chibi
      00y-token-styles.js      Estilos de token e seleção do ativo
      00z-token-loader.js      Cache de imagens, tokens com imagem do usuário
      01…14-*.js               Regras, ficha, estado, tabuleiro, combate, painéis, tooltip
  scripts/build.mjs            Monta dist/
  tests/                       Testes unitários e de navegador
  docs/                        Este guia e o prompt de novos tokens
  dist/                        Saída versionada
```

A ordem dos arquivos de `src/js/` importa: o build os junta em ordem alfabética, e um arquivo só
pode usar o que os anteriores definiram.

---

## 3. Layout do app

### 3.1 Desktop (largura > 960 px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [≡] ⬢ [BRIGANDINE]        ( Montagem | Combate )                 [Arquivo ▾] │  cabeçalho (56 px, madeira)
├──────────────┬───────────────────────────────────────────┬───────────────────┤
│ Painel       │ ┌─HUD──────────┐          ┌──ferramentas─┐│ Painel direito    │
│ esquerdo     │ │ modo célula  │          │ régua zoom ◎ ││ (372 px)          │
│ (320 px)     │ └──────────────┘          └──────────────┘│                   │
│              │                                           │ Montagem:         │
│ Montagem:    │            T A B U L E I R O              │  inspetor da peça │
│  ▸ Tabuleiro │            (canvas, hex/quadrado)         │  (Ficha/Base/     │
│  ▸ Mapa      │                                           │   Armas/Magias/   │
│  ▾ Peças     │                                           │   Itens)          │
│              │                                           │                   │
│ Combate:     │            ┌ dica ──────────┐             │ Combate:          │
│  Rodada      │            │ Registro ▴     │             │  peça ativa, PV,  │
│  Encerrar    │            └────────────────┘             │  CA, ações,       │
│  iniciativa  │                                           │  5 comandos       │
└──────────────┴───────────────────────────────────────────┴───────────────────┘
```

- **Cabeçalho:** marca, troca de modo (`Montagem | Combate`) e menu **Arquivo** (salvar, carregar,
  exportar, importar, tema).
- **Painel esquerdo:** na Montagem, três acordeões (*Tabuleiro*, *Mapa de fundo*, *Peças*);
  no Combate, número da rodada, **Encerrar turno**, lista de iniciativa, legenda e **Encerrar combate**.
- **Palco:** o `<canvas id="battleCanvas">` ocupa tudo; o HUD, a dica e o registro flutuam sobre ele.
- **Painel direito:** na Montagem é o inspetor da peça selecionada; no Combate é o painel de comandos.
- **Registro:** gaveta no rodapé do palco. Fechada mostra só a última linha; aberta lista tudo.
- **Tooltip do alvo:** aparece ao passar o cursor sobre uma peça (PV, CA, defesas e, no combate,
  a prévia do ataque selecionado).

### 3.2 Painel de combate (direito)

```
┌───────────────────────────────┐
│ [token]  Nome            HERÓI│  cabeçalho da peça
│          Nível 3 · Mov. 9 m   │
│ 44 / 44 PV            [CA 20] │  vitais
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  barra de vida
│ ◆  ◆  ◆                [Reação]│  economia de ações
├───────────────────────────────┤
│ [Ação][Mover][Magias][Itens][Ficha] │ 5 comandos (só um ativo)
│ ATACAR                  MAP 0 │
│ ┌─ARMA────┐ ┌─ARMA────┐       │  cartas (arma/magia/item)
│ │  ícone  │ │  ícone  │       │
│ │ 1d8+4   │ │ 1d6+2   │       │
│ └──(1)────┘ └──(1)────┘       │  selo de custo em ◆
│ Erguer escudo ◆      [Erguer] │  só no comando Ação
└───────────────────────────────┘
```

Regra de ouro: **um comando por vez**. Só o subpainel do comando ativo aparece; o resto fica
escondido. O mesmo vale para os acordeões da Montagem (só um aberto) e para o inspetor (uma aba por vez).

### 3.3 Celular e tablet em pé (largura ≤ 960 px)

```
┌────────────────────────────┐
│ [≡] ⬢  (Montagem|Combate) 📁│  cabeçalho compacto
├────────────────────────────┤
│ HUD enxuto      ferramentas │
│                            │
│        TABULEIRO           │
│                            │
│ Registro ▴                 │
├────────────────────────────┤
│ ── Comandos · Nome  [▶ Encerrar turno] │  alça da gaveta (sempre visível)
│ [token] Nome            HERÓI│
│ ◆ ◆ ◆            [Reação]  │
│ [Ação][Mover][Magias][Itens][Ficha] │  5 comandos SEMPRE visíveis
└────────────────────────────┘
```

- O painel direito vira **gaveta inferior**. Recolhida mostra a peça, as ações e os 5 comandos;
  aberta (64% da altura) mostra as opções do comando.
- Tocar em **Mover** mantém a gaveta recolhida (o tabuleiro fica livre para o toque na célula);
  **Ação, Magias, Itens e Ficha** abrem a gaveta.
- A lista de iniciativa e o painel de montagem ficam na **gaveta lateral esquerda** (ícone no canto).
- **Gestos:** toque simples age ao soltar o dedo; arrastar com um dedo move o tabuleiro; pinça dá zoom.
- Em telas estreitas as dicas por cursor e a dica do tabuleiro são ocultadas.

### 3.4 O que cada cor significa no jogo

| Cor | Significado | Onde aparece |
| --- | --- | --- |
| Vermelho | Ataque, alcance, perigo | Células de alcance, cartas de arma, botão de risco |
| Verde | Movimento | Células de movimento (3 tons: 50%, 25%, 10%), ações disponíveis |
| Roxo | Magia e reação | Cartas de magia, botão de reação |
| Âmbar | Itens | Cartas de item |
| Azul-gelo | Defesa e escudo | CA elevada, botão Erguer escudo |

Essas cores **nunca** são decoração: não as use para outra coisa.

---

## 4. Sistema de design

Tudo parte de **tokens** (variáveis CSS). Nenhum componente usa valor cru.

### 4.1 Tokens principais (`src/styles/tokens.css`)

| Grupo | Variáveis | Observação |
| --- | --- | --- |
| Tipografia | `--font-display`, `--font-ui`, `--text-2xs … --text-2xl` | 11, 12, 13, 15, 18, 24, 32 px no tema Moderno |
| Superfícies | `--ink-1000 … --ink-600` | Do mais fundo ao mais elevado |
| Texto | `--text`, `--text-2`, `--text-3` | Conteúdo, rótulo, desativado |
| Linhas | `--line`, `--line-strong` | Divisores sutis e fortes |
| Acento | `--accent`, `--accent-soft`, `--accent-ink` | Muda com o modo |
| Cores de jogo | `--strike`, `--move`, `--arcane`, `--supply`, `--ward` (+ `-soft`) | Ver 3.4 |
| Espaço | `--s-1 … --s-6` | 4, 8, 12, 16, 24, 32 px |
| Raio | `--r-xs … --r-pill` | 6, 8, 12, 16 px e pílula |
| Elevação | `--shadow-float`, `--shadow-pop`, `--ring` | Sombra e anel de foco |
| Movimento | `--ease`, `--dur-fast`, `--dur` | Zerados com `prefers-reduced-motion` |

### 4.2 Dois temas

O tema é a classe `theme-parchment` no `<body>`. **Sem ela vale o tema Moderno.** A escolha é
guardada no navegador (`brigandine_prefs_v1`) e muda em *Arquivo → Tema*.

| | **Pergaminho** (padrão) | **Moderno** |
| --- | --- | --- |
| Clima | Interface de RPG: papel, madeira, contorno grosso | Grafite frio, vidro, linhas finas |
| Fundo | Madeira escura | Grafite `#0b0e12` |
| Painéis | Papel `#dcc9a0` com textura e contorno `#3b2a1c` | `#10141a` |
| Fontes | Cinzel (títulos) + Patrick Hand (texto) | Bricolage Grotesque + Figtree |
| Acento | Verde `#3f7a2f` (Montagem), vermelho `#b2382d` (Combate) | Latão `#e6b95f`, gelo `#5ccbff` |

O tema Pergaminho **não duplica** componentes: ele redefine os tokens e acrescenta formas
(contorno, sombra deslocada, textura). Por isso todo componente novo deve nascer com tokens.

### 4.3 Paleta do Pergaminho

| Papel | Valor |
| --- | --- |
| Contorno de tudo | `#3b2a1c` |
| Papel (painel) | `#dcc9a0` · mais claro `#e9dab4` · campo `#efe2c0` |
| Madeira | `#2a1d14 … #8a6238` (gradiente com tábuas verticais) |
| Texto | `#3a2a1c` · rótulo `#5e4630` · desativado `#8a7152` |
| Botão verde | `#5c9a44` · vermelho `#b8453a` · madeira `#c9ad78` |
| Dica (tooltip) | `#2a2a30` com borda `#14141a` e texto `#f0e6d0` |

---

## 5. Tema Pergaminho: receitas

Para criar um componente novo que combine, use estas receitas (já estão em `theme-parchment.css`).

**Painel de papel**
```css
background: var(--paper), var(--ink-850);   /* textura + cor */
border: 3px solid var(--outline);           /* contorno marrom grosso */
border-radius: var(--hand);                 /* cantos levemente irregulares */
box-shadow: 2px 3px 0 rgba(59, 42, 28, 0.4);/* sombra DESLOCADA, sem desfoque */
```

**Botão grosso:** contorno 3 px, `box-shadow: 0 3px 0 var(--outline)` e, ao pressionar,
`transform: translateY(3px)` com a sombra zerada. Cores: verde (ação principal), vermelho (risco),
madeira (neutro). Texto claro com `text-shadow` fino nos coloridos.

**Faixa de madeira com pregos (títulos de seção):** fundo `var(--wood)`, contorno `#1d140c`,
título em Cinzel maiúsculo, dois pontos de prego (`::before`/`::after`) nas pontas.

**Carta (arma, magia, item)**
```
┌────────────────────┐
│▓▓ NOME EM FAIXA ▓▓▓│  faixa colorida (--card), texto Cinzel claro
│       ícone        │  na cor da carta
│      1d8+4         │  dano
│ alcance · +acerto  │
└────────(1)─────────┘  selo redondo de custo, metade fora da carta
```
Cor da carta: arma = vermelho, magia = roxo, item = âmbar (`--card`). Selecionada: anel dourado `#f0c84a`.

**Dica escura (tooltip):** fundo `#2a2a30`, borda `#14141a`, texto `#f0e6d0`; **é a única superfície escura** dentro do
Pergaminho, para se destacar sobre o papel.

**Regras do estilo**
- Sombras são sempre **duras e deslocadas** (`2px 3px 0`), nunca desfocadas.
- Contorno: 3 px em controles, 5 px nas bordas dos painéis grandes.
- Nada de gradiente decorativo em botões; o relevo vem da sombra e de `inset` de 3 px.
- Texto sobre papel é marrom escuro; sobre madeira, creme `#f6e8c0`.

---

## 6. Componentes

Classes principais (todas em `components.css`; o JS só alterna estados):

| Componente | Classes | Estados |
| --- | --- | --- |
| Botão | `.btn`, `.btn-primary`, `.btn-danger`, `.btn-ward`, `.btn-ghost`, `.btn-icon`, `.btn-sm`, `.btn-block` | `.active`, `disabled` |
| Controle segmentado | `.seg`, `.seg-btn`, `.seg-4` | `.active` |
| Chip, tag, badge | `.chip`, `.tag` (+ `tag-fire/cold/elec/acid/sonic/holy/unholy/phys`), `.badge` (+ `badge-hero/villain/accent/dead`) | `.active` |
| Campo | `.field`, `.field-label`, `select`, `input`, `.stepper`, `.check` | — |
| Acordeão | `.acc` (`<details>`), `.acc-body`, `.more` | `open` |
| Cartão | `.card`, `.card-flat`, `.option-card`, `.editor-card`, `.tag-list-item`, `.rune-row` | `.selected-attack/-magic/-item` |
| Vida | `.hp-bar-outer`, `.hp-bar-inner[data-level=high|mid|low]` | — |
| Ações | `.action-pip`, `.reaction-pip` | `.available` |
| Comandos | `.cmd-nav`, `.cmd[data-cmd=attack|move|magic|items|sheet]` | `.active` |
| Abas | `.tabs`, `.tab` | `.active` |
| Ficha | `.attr-grid`, `.attr-box`, `.save-grid`, `.save-card`, `.stat-line`, `.prof-pill` | `.key` |
| Tabuleiro | `.hud-pill`, `.hint-pill`, `.log-dock`, `.unit-tip` | `.open`, `.hidden` |
| Vazio | `.empty` | — |

Ícones: sprite em `src/icons.svg`, usados com
`<svg class="icon"><use href="#i-nome"/></svg>`. Traço 1,8; a cor vem do texto (`currentColor`).
Para um ícone novo, adicione um `<symbol id="i-nome" viewBox="0 0 24 24">` ao sprite.

Textos da interface: português, frases curtas, verbo no infinitivo nos botões
(“Erguer escudo”, “Encerrar turno”), a mesma palavra para a mesma ação em todo o app.

---

## 7. Tokens de peça

Um **token** é a figura da peça no tabuleiro (≈ 55 px) e nos painéis (46–64 px). Existem **dois estilos**,
trocáveis em *Peças → Estilo dos tokens* (escolha guardada no navegador):

- **Chibi (padrão):** personagem de corpo inteiro sobre base oval.
- **Medalhão:** retrato em aro metálico (ouro para heróis, ferro para vilões).

Os 22 personagens existem nos dois estilos, com as mesmas chaves (os novos só têm arte chibi; no estilo
medalhão o app recorta o chibi dentro do aro automaticamente):

| Facção | Chaves |
| --- | --- |
| Heróis (14) | `guerreiro, paladino, barbaro, clerigo, bardo, feiticeiro, mago, ranger, rogue, druida, monge, alquimista, bruxa, espadachim` |
| Vilões (8) | `goblin, lobo, bandido, esqueleto, orc, cultista, zumbi, kobold` |

Cada token tem uma **peça** (modelo) equipada conforme a classe, em `src/js/03-templates.js`. Um teste
(`tests/templates.test.mjs`) garante que nenhum token fica sem peça.

### 7.1 Anatomia do estilo chibi

Tela de **256 × 256** (`viewBox="0 0 256 256"`), personagem de frente.

```
 y=6   ┌── chapéus e penachos podem chegar aqui
 y=50  │      ╭──────╮      topo da cabeça
       │     │ ◉  ◉ │      cabeça: centro (128, 96), 50 × 46
 y=142 │      ╰──────╯      base da cabeça
 y=138 │     ┌────────┐     tronco: y 138–184, largura 58
 y=176 │     ├─cinto──┤
 y=184 │      ▌▌  ▌▌        pernas até y≈217
 y=225 │      ●●  ●●        botas
 y=233 │   ═══════════════  base oval (cor da classe), rx 72
```

- **Cabeça grande** (quase metade da altura do personagem) e corpo curto: é isso que faz o chibi.
- **Mãos e pés pequenos**, **adereço grande** (arma, cajado, escudo, chapéu).
- **Contorno** marrom-escuro `#2b1b17`, grosso: 3,5 a 4,5 nos desenhos; o filtro do kit
  acrescenta um contorno externo contínuo de ≈ 3 px.
- **Cores chapadas** com **um tom de sombra** (o kit sombreia automaticamente o lado
  inferior-direito) e **um brilho** (traços brancos curtos em metal, cabelo e gemas).
- **Base oval** na cor de destaque da classe, com anel tracejado claro (heróis) ou vermelho (vilões).
  É ela que identifica a classe e a facção na lista de peças.

### 7.2 Cores de destaque (base oval)

| Chave | Destaque | Chave | Destaque |
| --- | --- | --- | --- |
| guerreiro | `#4fa3e0` | ranger | `#6fc45a` |
| paladino | `#f4d36a` | rogue | `#5fd0b4` |
| barbaro | `#e0703a` | goblin | `#d8402e` |
| clerigo | `#f0c64a` | lobo | `#f0a020` |
| bardo | `#d85fb0` | bandido | `#d8283e` |
| feiticeiro | `#f0587f` | mago | `#8d76e8` |
| druida | `#5fae6a` | esqueleto | `#9a9a7a` |
| monge | `#e0a030` | orc | `#c85a2a` |
| alquimista | `#9ccf3a` | cultista | `#8a2a4a` |
| bruxa | `#9a5ad8` | zumbi | `#7a9a5a` |
| espadachim | `#e8503a` | kobold | `#d8742a` |

Pele padrão: `#f3c29b`. Contorno: `#2b1b17`. Metal: `#9aa5b4` (claro `#aab4c2`, escuro `#7d8898`).
Ouro: `#f0c84a`. Couro: `#6b4a2a` a `#8a5a30`. Para pele verde (goblin) `#7fb04a`.

### 7.3 O kit (`src/js/00d-chibi-kit.js`)

Dentro dos arquivos de personagem estas funções já estão disponíveis (veja o início de `00e-chibi-heroes.js`):

| Função | O que desenha |
| --- | --- |
| `cb(d, fill, sw=4.5)` | Forma qualquer (`d` é o caminho SVG) com contorno |
| `ce(cx, cy, rx, ry, fill, sw=4, rot)` | Elipse com contorno |
| `cc(cx, cy, r, fill, sw=4)` | Círculo com contorno |
| `ccap(x1, y1, x2, y2, w, fill)` | Cápsula (cabos, hastes, braços) |
| `csh(d, opacidade=0.55)` | Brilho: traço branco sem preenchimento |
| `clegs({ pants, boot, stance, bootStyle })` | Pernas e botas |
| `ctorso({ fill, y, w })` | Tronco |
| `carm(lado, mãoX, mãoY, manga, pele, w)` | Braço (lado −1 esquerda, +1 direita) e mão |
| `chead(id, opções)` | Cabeça e rosto; devolve `{ back, head }` |
| `CB.frame(id, { faction, accent, art })` | Moldura final: base oval e filtros |

**Opções do rosto (`chead`)**

| Opção | Valores |
| --- | --- |
| `eyes` | `round` (padrão), `angry`, `happy`, `narrow`, `glare` (olho de goblin), `sleepy` |
| `mouth` | `smile`, `cat`, `frown`, `open`, `grin`, `snarl`, `none` |
| `ears` | `round`, `pointed` (elfo), `big` (goblin), `none` |
| `browTilt` | −1 a 1: positivo é bravo (ponta interna baixa), negativo é triste |
| `skin`, `eyeColor`, `brow` | cores `#hex` |
| `blush`, `nose` | `true` ou `false` |
| `cy`, `rx`, `ry` | posição e tamanho da cabeça (raramente mude) |

**Ordem das camadas** (de trás para frente) — é a regra que mais evita erro:
capa e coisas atrás do corpo → pernas → tronco → peitoral e cinto → cabo ou haste de adereço →
**braços** → lâmina, escudo ou o que fica na frente da mão → `h.back` + `h.head` →
cabelo, chapéu, elmo, barba.

**Como o filtro funciona:** o `frame` envolve o corpo num filtro que (1) desenha o contorno externo,
(2) pinta uma sombra dura no lado inferior-direito e (3) um brilho no superior-esquerdo. Por isso você
**não precisa** desenhar sombras; só as formas e as cores base.

### 7.4 Expressões que combinam com cada papel

| Papel | Olhos | Boca | Sobrancelha |
| --- | --- | --- | --- |
| Guerreiro, bárbaro, bandido | `angry` | `open` / `none` | `browTilt: 1` |
| Paladino, clérigo, ranger | `round` | `smile` | `browTilt` ≈ 0 a 0,4 |
| Bardo | `happy` | `open` | negativo |
| Rogue | `narrow` | `none` | `browTilt: 1` |
| Goblin | `glare` | `grin` | `browTilt: 1`, orelhas `big` |

### 7.5 Estilo medalhão (resumo)

Retrato de busto dentro de um aro metálico, com contorno de nanquim, sombra dura (cel shading),
luz de recorte na cor do personagem, retícula no fundo e brilhos. Vem de `00a-token-kit.js`
(`TK.frame`, `TK.face`, filtros `comic_`/`cel_`). Ele continua disponível, mas **novos tokens devem
ser feitos em chibi**: é o estilo padrão.

---

## 8. Como adicionar um token novo

Exemplo completo pronto para colar em `docs/exemplo-token-druida.js`. Para gerar um novo com IA, use
[`PROMPT-novos-tokens.md`](PROMPT-novos-tokens.md).

1. **Desenhe.** Escreva `CHIBI_SVGS.<chave> = () => CB.frame(...)` em `src/js/00e-chibi-heroes.js`
   (heróis) ou `00f-chibi-villains.js` (vilões). Chave em minúsculas, sem acento ou espaço.
2. **Registre a chave nas listas de escolha** de `src/index.html`: o `<select id="inspTokenSelect">`
   (aba Base) e o `<select id="newPieceSculpt">` (salvar peça como modelo). Exemplo:
   `<option value="druida">Druida</option>`.
3. **Crie a peça (modelo)** em `src/js/03-templates.js`: copie um modelo parecido e troque
   `id` (`t_druida`), `name`, `sculpt: 'druida'`, `faction`, PV, CA, ficha, armas e magias.
   **Equipe conforme a classe:** armas com `dmgType` (cortante, perfurante, contundente, fogo…), runas ou dano
   extra em `extra`, magias do `SPELL_CATALOG`, itens do `ITEM_CATALOG`, `shieldBonus` (0 sem escudo, 1 a 3 com)
   e, para mortos-vivos e criaturas, `resistances`, `weaknesses` e `immunities`.
   Marque `manual: true` nas armas com valores próprios (por exemplo, bombas) para que a ficha não os sobrescreva.
   Marque o vilão em `VILLAIN_SCULPTS` (`src/js/00y-token-styles.js`).
4. **Nome na documentação** (opcional): acrescente a chave em `NAMES` em `scripts/build.mjs`.
5. **Teste.** No `tests/e2e.smoke.mjs` a verificação “todos os tokens renderizam” conta as chaves
   (hoje 22); atualize o número. `tests/templates.test.mjs` confere sozinho que o token tem peça, que a facção
   bate, que armas, magias e itens são válidos e que o seletor da interface lista a chave. Depois rode `npm run check` e os testes de navegador.
6. **Confira visualmente** no `dist/design-system.html` e no tabuleiro (55 px), nos dois temas.
7. **Estilo medalhão (opcional):** se não houver versão medalhão da chave, o app recorta o chibi dentro do aro
   automaticamente. Para ter uma arte de retrato própria, acrescente `MEDALLION_SVGS.<chave>` em `00b`/`00c`.

**Checklist de qualidade do token**
- [ ] A mão segura o objeto pelo lugar certo (arco pelo punho, cajado pelo cabo).
- [ ] Os olhos aparecem (chapéu ou capuz não cobrem a linha y≈104).
- [ ] A silhueta lê bem em 55 px: o adereço principal se destaca do corpo.
- [ ] Cores chapadas, sem gradiente; contorno 3,5–4,5.
- [ ] Nada passa de x 20–236 nem de y 244.
- [ ] Cor de destaque diferente das outras da mesma facção.
- [ ] Facção legível: herói de olhar aberto, vilão de sobrancelha baixa e dentes.

---

## 9. Imagens próprias como token

O app aceita imagens do usuário sem código:

| Onde | O que faz |
| --- | --- |
| Peça → aba **Base** → *Importar imagem* | Troca o token **daquela peça** |
| Arrastar o arquivo **sobre uma peça** no tabuleiro | Mesmo efeito |
| **Peças → Importar imagens como modelos** | Cria **um modelo por imagem** (nome = arquivo), herdando ficha, armas e magias do modelo selecionado |
| *Usar padrão* | Volta à ilustração do app |

- **Formatos:** PNG, JPG, WebP, GIF ou SVG, até 10 MB. Imagens raster são reduzidas para o lado maior de 384 px.
- **Moldura:** por padrão a imagem é **recortada em círculo** dentro do aro (ouro para heróis, ferro para vilões).
  Para PNG com **fundo transparente** (personagem inteiro, como os chibi), **desmarque** *Recortar em círculo com moldura*.
- **Proporção ideal:** quadrada, personagem centralizado com margem. Imagens retangulares são centralizadas (sem moldura)
  ou cortadas (com moldura).
- A imagem vai junto no **salvamento do navegador**, no **JSON exportado** e nos modelos da galeria.
- Use apenas imagens que você tem direito de usar. O app não envia nada para fora: tudo fica no seu navegador.

---

## 10. Regras que valem para qualquer mudança

1. **Tokens primeiro.** Cor, espaço, raio e sombra vêm de variáveis. Sem valor cru em componente.
2. **Um conceito, uma cor.** As cores de jogo (3.4) têm um significado fixo.
3. **Mostre uma coisa por vez.** Acordeões, abas e gavetas; o tabuleiro é sempre o foco.
4. **Toque primeiro no celular.** Alvos de toque ≥ 44 px, sem rolagem horizontal, comandos principais sempre visíveis.
5. **Tema duplo.** Todo componente novo precisa ficar bom no Pergaminho **e** no Moderno.
6. **Texto do usuário nunca vai direto ao HTML:** use `escapeHtml` (atributos e conteúdo) e `cleanText` (nomes).
7. **Regras de jogo ficam em `01b-rules.js`** (sem DOM) e têm teste. A interface só chama.
8. **Antes de entregar:** `npm run check`, os dois testes de navegador e uma olhada no
   `dist/design-system.html` e no tabuleiro em desktop e celular.

### Onde mexer para…

| Quero… | Arquivo |
| --- | --- |
| Mudar uma cor ou fonte | `tokens.css` (Moderno) ou o topo de `theme-parchment.css` |
| Mudar o aspecto de um componente | `components.css` e, para o Pergaminho, `theme-parchment.css` |
| Mudar a disposição dos painéis | `layout.css` e `src/index.html` |
| Criar/alterar um token | `00d…00f-chibi-*.js` |
| Mudar uma regra de combate | `01b-rules.js`, `09-combat-and-turns.js` |
| Mudar o que o painel de combate mostra | `11-panels.js` |
| Mudar a ficha | `10-sheet-ui.js` |
| Mudar o desenho do tabuleiro | `07-render.js` |
