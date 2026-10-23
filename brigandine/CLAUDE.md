# Brigandine — orientações para o assistente

Tabuleiro tático PF2e em arquivo único (`dist/brigandine_pf2e_tatico_v5.html`), montado por `npm run build`
a partir de `src/`. Interface e textos em português.

## Regras do dono do projeto

- **Escuridão e luz:** sempre que criar ou alterar um item, magia, objeto, perigo ou efeito, confira se ele
  pode interagir com a escuridão (gerar luz, apagar luz, criar escuridão, depender de visão). Se a interação
  for óbvia (fogo contínuo ilumina, tocha, lanterna), implemente seguindo o padrão de `01c-environment.js`
  (`light: { shape: 'emanation' | 'cone', bright, dim }`). **Se não souber como deve funcionar, pergunte ao
  usuário antes de decidir** e registre a decisão em `docs/GUIA-LAYOUT-E-TOKENS.md` (seção Ambiente).
- Decisões já tomadas (clarão de magias até o fim da rodada, magias sombrias sem escuridão, regras de luz
  do PF2e Remaster com teste simples/desprevenido/cego) estão no guia, seção 7.7 — siga-as.
- Itens de luz carregados pelas peças: acender custa a ação do item (◆); ficam acesos até o usuário apagar;
  apagar não custa ação. Tocha = emanação; lanterna = cone na direção da peça.
- Só um menu da montagem aberto por vez; só o menu aberto age no tabuleiro; fechar um menu desfaz a escolha
  feita nele. Cada menu termina com a própria transparência (0 % a 90 %).

## Verificação antes de entregar

```bash
npm run check                      # build + testes de unidade
PLAYWRIGHT_REQUIRE_FROM=/usr/lib/node_modules/ CHROMIUM_PATH=<chrome> node tests/e2e.smoke.mjs
PLAYWRIGHT_REQUIRE_FROM=/usr/lib/node_modules/ CHROMIUM_PATH=<chrome> node tests/e2e.mobile.mjs
PLAYWRIGHT_REQUIRE_FROM=/usr/lib/node_modules/ CHROMIUM_PATH=<chrome> node tests/e2e.scenes.mjs
```

Animações (`01d`, `07d`, `docs/PLANO-ANIMACOES.md`): a regra resolve na hora e chama `setAnimSpec`; a ação
de combate é embrulhada em `withAnimation`. Ação nova (ataque, magia, item) deve pedir a sua animação.
Armas no ritmo normal, magias/efeitos mágicos no cinema; clique pula; tremida em crítico e explosão; sem som.

Tokens 3D (`00k`–`00m`, `07e`, `03d`): bonecos low-poly com chave `t3_*`; personagem novo = configuração em
`T3D_TOKENS` + peça em `03d`. A peça 3D faz o gesto da ação via `ANIM.current` (07d) e anda via `startUnitWalk`.

Cel-shaded (`00n`, `00o`, `07f`): estilos `cel` e `celtopo`. Todo token precisa de boneco em `CEL_CHARS` (há teste);
token novo = configuração do boneco + entrada no mapa `celCharKey`. Atividades: idle, walk, attack, cast, item,
scroll, hit (8 quadros, `T3D_CYCLE`).

Cenas de combate: ver `docs/ARQUITETURA-CENAS.md`. Tudo que entra no tabuleiro precisa estar em
`captureBoard` (12d) e em `applyLoadedPayload` (12) para ser salvo e reaberto nas cenas.

Módulos JS são concatenados em ordem alfabética num único script: nomes globais não podem se repetir
(há um teste que compila o pacote inteiro).
