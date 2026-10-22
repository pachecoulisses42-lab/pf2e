# Brigandine — Motor Tático PF2e (v5)

Tabuleiro tático para Pathfinder 2e Remaster que abre direto no navegador, sem servidor: montagem do mapa e das peças, ficha PF2e por peça e combate por ações (◆), movimento, magias, itens e armas.

> Subprojeto independente: não usa nem altera nada do sistema `pf2e` deste repositório.

## Documentação

- [`docs/GUIA-LAYOUT-E-TOKENS.md`](docs/GUIA-LAYOUT-E-TOKENS.md): como o layout, o design system e os tokens funcionam e como criar novos.
- [`docs/PROMPT-novos-tokens.md`](docs/PROMPT-novos-tokens.md): prompts prontos para colar numa IA e gerar mais tokens no mesmo estilo (em código SVG ou em imagem).
- [`docs/exemplo-token-druida.js`](docs/exemplo-token-druida.js): exemplo completo de token novo.
- `dist/design-system.html`: documentação visual (componentes e tokens).

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
    theme-parchment.css   Tema Pergaminho (sobrepõe tokens e componentes em body.theme-parchment)
  js/                     Concatenados em ordem alfabética
    00a-token-kit.js      Utilitários de cor e gradiente dos tokens
    00d-chibi-kit.js      Kit chibi (cabeça, tronco, membros, moldura com base oval)
    00e…00h-chibi-*.js    22 personagens chibi (heróis e vilões)
    00i-topdown-kit.js    Kit da vista de cima (corpo, cabeça, armas, grão, sombra)
    00j-topdown-tokens.js 22 personagens vistos de cima
    00y-token-styles.js   Estilos de token (chibi, vista de cima) e seleção do ativo
    00z-token-loader.js   Cache de imagens, token com imagem do usuário, pré-visualização (ids de SVG únicos)
    01-catalog.js         Catálogo de magias e itens
    01b-rules.js          Regras puras: dados, tipos de dano, runas, pacote de dano, defesas
    02-sheet-engine.js    Cálculo da ficha PF2e (CA, testes, ataque, CD, escudo)
    03-templates.js       22 modelos de peça
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
- **Celular e tablet em pé** (até 960 px): o painel da direita vira uma gaveta inferior sempre visível. No combate ela mostra a peça, as ações e os 5 comandos (Ação, Mover, Magias, Itens, Ficha) com o botão *Encerrar turno*; tocar em um comando abre as opções (Mover mantém o tabuleiro livre). Na montagem a alça "Editar · peça" abre o inspetor. A lista de iniciativa fica na gaveta lateral (ícone no canto superior esquerdo). Gestos: toque simples age ao soltar o dedo, arrastar com um dedo move o tabuleiro e pinça dá zoom.
- **Tema Pergaminho** (novo, padrão): interface de RPG com papel envelhecido, contorno marrom grosso, plaquinhas de madeira com pregos, botões verde/vermelho, cartas de arma/magia/item com faixa colorida e selo de custo, lista de iniciativa em madeira, dica escura sobre o alvo e mapa de pergaminho. O tema Moderno continua disponível em Arquivo → Tema.
- **Importar vários tokens de uma vez**: Peças → *Importar imagens como modelos* cria um modelo por imagem (nome do arquivo), herdando a ficha do modelo selecionado.
- **22 peças equipadas por classe** (novo): além dos 12 originais, entram Druida, Monge, Alquimista, Bruxa e Espadachim (heróis) e Esqueleto, Orc, Cultista, Zumbi e Kobold (vilões). Cada peça traz ficha, armas com tipo de dano (e runas quando cabe), magias, itens e escudo coerentes com a classe; mortos-vivos têm imunidades, resistências e fraqueza a vital.
- **Tokens** (novo): 22 personagens chibi de corpo inteiro (estilo padrão: cabeça grande, contorno marrom, cores chapadas, base oval na cor da classe); em Peças → Estilo dos tokens há a **vista de cima**, que substituiu o medalhão: personagens vistos do alto, com volumes pintados, grão de tinta e sombra projetada, sem moldura, cada um equipado conforme a classe (prévia em `docs/token-preview/`).
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
