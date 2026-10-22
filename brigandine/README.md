# Brigandine — Motor Tático PF2e (v5)

Tabuleiro tático para Pathfinder 2e Remaster que abre direto no navegador, sem servidor: montagem do mapa e das peças, ficha PF2e por peça e combate por ações (◆), movimento, magias, itens e armas.

> Subprojeto independente: não usa nem altera nada do sistema `pf2e` deste repositório.

## Usar

Abra `dist/brigandine_pf2e_tatico_v5.html` no navegador. Para a documentação visual do design system, abra `dist/design-system.html`.

## Desenvolver

```bash
cd brigandine
npm run build      # gera dist/ a partir de src/
npm test           # testes das regras puras (node:test, sem dependências)
npm run test:e2e   # teste de fumaça no navegador (precisa de Playwright + Chromium)
npm run check      # build + testes
```

Sem dependências de runtime nem de build além do Node 20+. O build só concatena arquivos; não há transpilação.

### Estrutura

```
src/
  index.html              Estrutura da tela (marcadores /*@css*/, /*@js*/, <!--@icons-->)
  icons.svg               Sprite de ícones (traço 1.8, cor herdada)
  styles/
    tokens.css            Cores, tipografia, espaço, raio, elevação, movimento
    base.css              Reset, foco, utilitários
    components.css        Botões, segmentado, chips, campos, acordeão, cartões, pips, abas…
    layout.css            Casca do app, painéis, HUD do tabuleiro, gaveta de registro
  js/                     Concatenados em ordem alfabética
    00a-token-kit.js      Kit de ilustração dos tokens (filtros de quadrinhos, rosto, pauldron, moldura)
    00b-tokens-heroes.js  9 heróis
    00c-tokens-villains.js 3 vilões
    00z-token-loader.js   Cache de imagens, token com imagem do usuário, pré-visualização (ids de SVG únicos)
    01-catalog.js         Catálogo de magias e itens
    01b-rules.js          Regras puras: dados, tipos de dano, runas, pacote de dano, defesas
    02-sheet-engine.js    Cálculo da ficha PF2e (CA, testes, ataque, CD, escudo)
    03-templates.js       12 modelos de peça
    04-state.js           Estado global
    05-app-mode.js        Inicialização e modos Montagem/Combate
    06-grid-and-ranges.js Geometria hex/quadrada, movimento, alcance, áreas
    07-render.js          Desenho do tabuleiro em canvas
    08-input.js           Ponteiro, arrasto, pintura de terreno
    09-combat-and-turns.js Ações, ataques, magias, itens, Erguer Escudo, turnos
    10-sheet-ui.js        Ficha em abas (Atributos, Testes, Combate, Build)
    11-panels.js          Painéis de combate e inspetor, editores de arma e magia
    12-board-and-persistence.js Galeria, câmera, registro, salvar/carregar/exportar
    13-ui-shell.js        Menus, gaveta de registro, painéis responsivos
    14-unit-tip.js        Tooltip do alvo: defesas e prévia do ataque
scripts/build.mjs         Monta dist/
tests/                    rules.test.mjs (unidade) e e2e.smoke.mjs (navegador)
docs/design-system.src.html
dist/                     Saída versionada: app, CSS do design system, documentação
```

## Funcionalidades

- **Montagem**: grade hexagonal ou quadriculada (5–36 células), escala da célula, mapa de fundo (imagem ou cenário), pintura de terreno (difícil, parede, perigo), galeria de 12 modelos, edição de ficha, base, armas, magias e itens.
- **Combate**: iniciativa por Percepção, 3 ações + reação, movimento em 3 faixas (verde 50 % / 25 % / 10 %), MAP, ataques, magias de alvo, linha e explosão, poções e pergaminhos, régua, zoom.
- **Armas** (novo): criar e editar nome, alcance, dado, bônus, tipo de dano e bônus de ataque; opção de seguir a ficha ou usar valores próprios; **runas e dano adicional** (Flamejante, Gélida, Chocante, Corrosiva, Trovejante, Sagrada, Profana, Ataque furtivo ou dano personalizado). Cada dano extra é rolado à parte, aparece discriminado no registro e dobra no crítico.
- **Magias** (novo): criar e editar custo (◆ a ◆◆◆), alcance, área (alvo único, linha, explosão), tamanho, dado, bônus, tipo de dano e danos adicionais.
- **Erguer Escudo** (novo): dentro do comando **Ação**; gasta ◆, soma o bônus do escudo (padrão +2, configurável na aba Base) à CA e termina no início do próximo turno da peça. O token mostra o bônus.
- **Resistências, fraquezas e imunidades** (novo): por peça, na aba Base. Valem para qualquer tipo de dano e para os grupos *todo físico*, *toda energia* e *todos*. O dano é multiplicado (crítico ×2, metade ×½) antes das defesas; por tipo vale a maior resistência e a maior fraqueza; fraqueza só soma se houve dano daquele tipo; imunidade anula o tipo. Dano de precisão (ataque furtivo) conta como o tipo da arma. O registro mostra o que mudou (`fogo: resistência −5 · cortante: fraqueza +3`) e o painel de combate mostra as defesas do alvo ativo.
- **Tooltip do alvo** (novo): ao passar o cursor sobre uma peça aparecem PV, CA e as defesas dela. No combate, com Ação ou Magias aberto, mostra também a prévia da arma/magia selecionada contra aquele alvo: chance de acerto e de crítico (já com MAP), dano médio depois das defesas, dano no crítico e o que mudou (`cortante: resistência −3 · fogo: fraqueza +5`).
- **Imagem própria como token** (novo): aba Base → *Importar imagem* (PNG, JPG, WebP, GIF ou SVG, até 10 MB), ou arraste a imagem sobre a peça no tabuleiro. Imagens raster são reduzidas para 384 px. Por padrão a imagem é recortada em círculo com a moldura (ouro para heróis, ferro para vilões); desmarque a moldura para usar PNG transparente. *Usar padrão* volta à ilustração. A imagem vai junto no salvamento, na exportação JSON e no modelo salvo na galeria.
- **Tokens** (novo): 12 medalhões em SVG com acabamento de quadrinhos — contorno de nanquim, sombra em cel shading, luz de recorte na cor do personagem, retícula, brilhos de metal e expressões próprias (ver `dist/design-system.html`).
- Salvar no navegador, exportar e importar JSON. Arquivos antigos (v4) são aceitos; armas e magias são normalizadas ao importar.

## Decisões

| Decisão | Motivo |
| --- | --- |
| Arquivo único em `dist/` | Funciona offline, em tablet, sem servidor. |
| JS em módulos concatenados, sem bundler | Mantém o código do v4 reconhecível e o build trivial. |
| Regras puras em `01b-rules.js` com RNG injetável | Testáveis em Node sem DOM. |
| Armas e magias com `manual` | Por padrão seguem a ficha; editar à mão não é sobrescrito por `recalculateUnitFromSheet`. |
| `escapeHtml` / `cleanText` | Nomes e textos do usuário (inclusive de JSON importado) nunca entram em `innerHTML` sem tratamento. |
| ids de SVG únicos por instância | Gradientes dentro de `display:none` não renderizam; o mesmo token aparece em vários painéis. |
| Cores de jogo reservadas | Vermelho = alcance/ataque, verde = movimento, roxo = magia, âmbar = item, gelo = defesa. |

## Mudando o design system

Edite só `src/styles/tokens.css` para trocar cores, tipos e espaços. Componentes novos entram em `components.css` usando tokens, nunca valores crus. Rode `npm run build` e confira `dist/design-system.html`.

## Limitações conhecidas

- As fontes (Bricolage Grotesque e Figtree) vêm do Google Fonts; offline cai para a fonte do sistema.
- O teste de ponta a ponta não roda na CI do repositório; execute-o localmente.
- Dano persistente e tipos especiais (sangramento, "contra mortos-vivos" etc.) não existem; resistências ignoram exceções ("exceto prata").
