# Brigandine — Motor Tático PF2e (v5)

Tabuleiro tático para Pathfinder 2e Remaster que abre direto no navegador, sem servidor: montagem do mapa e das peças, ficha PF2e por peça e combate por ações (◆), movimento, magias, itens e armas.

> Subprojeto independente: não usa nem altera nada do sistema `pf2e` deste repositório.

## Documentação

- [`docs/GUIA-LAYOUT-E-TOKENS.md`](docs/GUIA-LAYOUT-E-TOKENS.md): como o layout, o design system e os tokens funcionam e como criar novos.
- [`docs/PROMPT-novos-tokens.md`](docs/PROMPT-novos-tokens.md): prompts prontos para colar numa IA e gerar mais tokens no mesmo estilo (em código SVG ou em imagem).
- [`docs/ARQUITETURA-CENAS.md`](docs/ARQUITETURA-CENAS.md): desenho das cenas de combate (requisitos, dados, armazenamento, decisões).
- [`docs/FORMATO-PECAS.md`](docs/FORMATO-PECAS.md): formato para importar peças de outros módulos e como o token é escolhido.
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
    00x-extra-tokens.js   Tokens extras pintados (registro, listas e galeria visual)
    00y-token-styles.js   Estilos de token (chibi, vista de cima) e seleção do ativo
    00z-token-loader.js   Cache de imagens, token com imagem do usuário, pré-visualização (ids de SVG únicos)
    01-catalog.js         Catálogo de magias e itens
    01b-rules.js          Regras puras: dados, tipos de dano, runas, pacote de dano, defesas
    01c-environment.js    Terrenos, objetos, perigos, clima, itens de luz (dados e regras puras)
    02-sheet-engine.js    Cálculo da ficha PF2e (CA, testes, ataque, CD, escudo)
    03-templates.js       22 modelos de peça
    03b-templates-extras.js 34 peças dos tokens pintados (classes novas e vilões)
    03c-piece-import.js   Token de peças novas/importadas (sugestão pelo nome) e normalização de peças de fora
    04-state.js           Estado global
    05-app-mode.js        Inicialização e modos Montagem/Combate
    06-grid-and-ranges.js Geometria hex/quadrada, movimento, alcance, áreas
    06b-shapes-and-light.js Formas de pintura, linha de visão, mapa de luz e escuridão
    07-render.js          Desenho do tabuleiro em canvas
    07b-facing.js         Direção das peças: alça de giro, seta na borda, virar para o alvo
    07c-environment-render.js Texturas de terreno e clima, objetos, perigos, escuridão
    08-input.js           Ponteiro, arrasto, pintura de terreno
    09-combat-and-turns.js Ações, ataques, magias, itens, Erguer Escudo, turnos
    10-sheet-ui.js        Ficha em abas (Atributos, Testes, Combate, Build)
    11-panels.js          Painéis de combate e inspetor, editores de arma e magia
    12-board-and-persistence.js Galeria, câmera, registro, salvar/carregar/exportar
    12b-pieces-ui.js      Criar peça do zero, importar peças, API window.Brigandine
    12c-toolbox.js        Menus exclusivos, caixa de ferramentas, pintura, objetos, transparência
    12d-scenes-model.js   Cenas: modelo puro (captura do tabuleiro, metadados, ordem, importação)
    12e-scene-store.js    Cenas: repositório IndexedDB / localStorage / memória
    13-ui-shell.js        Menus, gaveta de registro, painéis responsivos
    13b-scenes-ui.js      Cenas: janela, abrir/iniciar/continuar, salvar, exportar/importar
    14-unit-tip.js        Tooltip do alvo: defesas e prévia do ataque
scripts/build.mjs         Monta dist/ (embute src/tokens-extra/*.webp)
scripts/recortar-tokens-extras.py  Recorta folhas de tokens em imagens individuais
src/tokens-extra/         Imagens dos tokens extras + manifest.json
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
- **Cenas de combate** (novo): botão **Cenas** no topo. **Campanhas** funcionam como pastas: barra com *Todas*, cada campanha (com contagem) e *Sem campanha*; criar, renomear, anotar, reordenar, exportar e excluir campanha (as cenas vão para *Sem campanha* ou são excluídas junto); cada cena escolhe sua campanha no cartão; dentro da pasta, lista única com busca e ordem própria. Monte vários encontros com antecedência e abra cada um na hora: *Nova a partir do tabuleiro*, *Nova em branco*, nome, anotações do mestre, miniatura, busca, ordem (↑↓), duplicar, excluir, exportar uma ou todas (arquivo de campanha) e importar. **Abrir** leva à montagem; **Iniciar combate** usa uma cópia (a cena preparada não muda) e rola iniciativa; *Salvar* durante o combate guarda o progresso para **Continuar** depois; ao encerrar o combate dá para voltar à cena preparada. O topo mostra a cena aberta e um ponto quando há alterações não salvas (Ctrl/⌘+S salva); trocar de cena pergunta antes. Fica guardado no navegador (IndexedDB; reserva em localStorage), junto com os modelos criados na galeria. O mapa de fundo agora volta ao carregar.
- **Registro de dados e ações no combate** (novo): no painel esquerdo, abaixo de *Encerrar combate*, recolhível (a escolha é lembrada). Na montagem continua na gaveta inferior.
- **Caixa de ferramentas** (novo; antigo menu Peças): abas **Personagens** (galeria, filtro, criar do zero, importar), **Terreno** (chão, terra, lama, neve, água, abismo, difícil, parede, perigo — com textura desenhada; lama, neve e água custam o dobro, abismo e parede bloqueiam, parede bloqueia a luz), **Objetos** (pedra, cadeira, mesa, barril, baú, árvore, muro e luzes: tocha de parede, braseiro, lampião, cristal de luz), **Animais** (lobos e outros com `category: "animal"`) e **Perigos** (espinhos, fogueira, poça de ácido, armadilha de urso, runa explosiva — no combate, quem termina o movimento no perigo sofre o dano; a fogueira ilumina). Terreno pinta em célula, raio, cone, linha, quadrado ou tudo.
- **Clima e ambiente** (novo, menu Tabuleiro): névoa, escuridão, chuva, nevasca e fumaça, pintados em célula, raio, **emanação** (presa a uma peça, acompanha o movimento), cone, linha, quadrado ou o tabuleiro todo.
- **Luz e escuridão** (novo): a escuridão some onde há luz plena e fica pela metade na penumbra. Luz vem de objetos (tochas de parede, braseiro, lampião, cristal), da fogueira e de itens das peças: **Tocha** (emanação 6 m, penumbra 12 m), **Lanterna Direcional** (cone 18 m para onde a peça olha) e **Lampião** (9 m). No combate, acender custa ◆ (Itens → Acender); fica aceso até você apagar, sem custo. Paredes e muros bloqueiam a luz. Magias de fogo e de luz deixam um **clarão** na área até o fim da rodada. **Regras do PF2e Remaster:** alvo na penumbra fica oculto (teste simples CD 5) e na escuridão fica escondido (CD 11, e quem ataca do escuro deixa o alvo desprevenido −2 CA) para quem não tem a visão certa; quem está no escuro sem visão no escuro fica cego (terreno normal vira difícil, −4 na iniciativa). A visão vem da ancestralidade ou da aba Base → *Visão*. O tooltip mostra escuridão/penumbra e a chance de acerto já com o teste simples.
- **Menus da montagem** (novo): só um aberto por vez (Tabuleiro, Mapa de fundo, Caixa de ferramentas); só o menu aberto age no tabuleiro e fechar um menu desfaz a escolha feita nele. Cada menu termina com **Transparência** (0 % a 90 %): clima (padrão 50 %), mapa de fundo (padrão 0 %) e terreno/perigos (padrão 50 %). O estilo dos tokens agora se chama **Token** / Vista de cima.
- **Celular e tablet em pé** (até 960 px): o painel da direita vira uma gaveta inferior sempre visível. No combate ela mostra a peça, as ações e os 5 comandos (Ação, Mover, Magias, Itens, Ficha) com o botão *Encerrar turno*; tocar em um comando abre as opções (Mover mantém o tabuleiro livre). Na montagem a alça "Editar · peça" abre o inspetor. A lista de iniciativa fica na gaveta lateral (ícone no canto superior esquerdo). Gestos: toque simples age ao soltar o dedo, arrastar com um dedo move o tabuleiro e pinça dá zoom.
- **Tema Pergaminho** (novo, padrão): interface de RPG com papel envelhecido, contorno marrom grosso, plaquinhas de madeira com pregos, botões verde/vermelho, cartas de arma/magia/item com faixa colorida e selo de custo, lista de iniciativa em madeira, dica escura sobre o alvo e mapa de pergaminho. O tema Moderno continua disponível em Arquivo → Tema.
- **Importar vários tokens de uma vez**: Peças → *Importar imagens como modelos* cria um modelo por imagem (nome do arquivo), herdando a ficha do modelo selecionado.
- **22 peças equipadas por classe** (novo): além dos 12 originais, entram Druida, Monge, Alquimista, Bruxa e Espadachim (heróis) e Esqueleto, Orc, Cultista, Zumbi e Kobold (vilões). Cada peça traz ficha, armas com tipo de dano (e runas quando cabe), magias, itens e escudo coerentes com a classe; mortos-vivos têm imunidades, resistências e fraqueza a vital.
- **Tokens** (novo): 22 personagens chibi de corpo inteiro (estilo padrão: cabeça grande, contorno marrom, cores chapadas, base oval na cor da classe); em Peças → Estilo dos tokens há a **vista de cima**, que substituiu o medalhão: personagens vistos do alto, com volumes pintados, grão de tinta e sombra projetada, sem moldura, cada um equipado conforme a classe (prévia em `docs/token-preview/`).
- **Tokens extras pintados** (novo): 90 imagens recortadas das folhas enviadas — 45 vistas de cima (24 classes e 21 vilões: goblins, lobos e ladrões) e 45 retratos com aro. Escolha na aba Base → *Galeria de tokens* (abas Do app, Vista de cima, Retratos) ou na lista *Ilustração*, também ao salvar um modelo. Cada figura existe em par (vista de cima e retrato frontal) e **acompanha o Estilo dos tokens**: em *Vista de cima* a peça mostra a figura de cima (que gira com a direção), em *Chibi* mostra o retrato com o aro da facção. As imagens ficam em `src/tokens-extra/` e o build as embute no app (o arquivo passa de ~0,4 MB para ~2,4 MB).
- **56 peças equipadas** (novo): além das 22, entram 13 classes dos tokens pintados (Explorador, Arqueiro, Cavaleiro, Cavaleiro da Liberdade, Ninja, Pistoleiro, Ranger de Batalha, Invocador, Kitsune, Kappa, Tengu, Ryu, Samurai) e 21 vilões (7 goblins, 7 lobos, 7 ladrões), com ficha, armas, magias e defesas da classe. A galeria tem filtro por nome/classe e facção.
- **Peças do zero e importadas** (novo): *Peças → Criar peça do zero* (nome, classe, facção, nível e token — sugerido pelo nome ou escolhido na galeria) e *Peças → Importar peças (JSON)* para listas de outros módulos, sem apagar o tabuleiro. Peças sem token, com chave desconhecida ou de arquivos antigos recebem um token pelo nome, classe e facção (português ou inglês); imagens `data:image` viram token próprio. Módulos que rodam junto usam `window.Brigandine` (`importPieces`, `registerTokenGroup`, `suggestToken`, `listTokens`). Ver `docs/FORMATO-PECAS.md`.
- **Direção das peças** (novo): a peça selecionada (montagem) ou a peça da vez (combate) mostra uma alça redonda na borda do token, apontando para onde ela está virada. Arraste a alça para girar (passos de 45° no quadriculado e 30° no hexágono; Shift gira livre); um toque/clique na alça gira um passo no sentido horário; Q e E também giram. No estilo vista de cima a arte gira junto; no chibi e em imagens próprias aparece uma seta na borda. Mover, atacar e lançar magia viram a peça para o alvo automaticamente. Heróis começam virados para o leste e vilões para o oeste; a direção vai no salvamento e na exportação.
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
