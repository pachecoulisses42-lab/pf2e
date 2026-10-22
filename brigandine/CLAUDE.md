# Brigandine — orientações para o assistente

Tabuleiro tático PF2e em arquivo único (`dist/brigandine_pf2e_tatico_v5.html`), montado por `npm run build`
a partir de `src/`. Interface e textos em português.

## Regras do dono do projeto

- **Escuridão e luz:** sempre que criar ou alterar um item, magia, objeto, perigo ou efeito, confira se ele
  pode interagir com a escuridão (gerar luz, apagar luz, criar escuridão, depender de visão). Se a interação
  for óbvia (fogo contínuo ilumina, tocha, lanterna), implemente seguindo o padrão de `01c-environment.js`
  (`light: { shape: 'emanation' | 'cone', bright, dim }`). **Se não souber como deve funcionar, pergunte ao
  usuário antes de decidir** e registre a decisão em `docs/GUIA-LAYOUT-E-TOKENS.md` (seção Ambiente).
- Itens de luz carregados pelas peças: acender custa a ação do item (◆); ficam acesos até o usuário apagar;
  apagar não custa ação. Tocha = emanação; lanterna = cone na direção da peça.
- Só um menu da montagem aberto por vez; só o menu aberto age no tabuleiro; fechar um menu desfaz a escolha
  feita nele. Cada menu termina com a própria transparência (0 % a 90 %).

## Verificação antes de entregar

```bash
npm run check                      # build + testes de unidade
PLAYWRIGHT_REQUIRE_FROM=/usr/lib/node_modules/ CHROMIUM_PATH=<chrome> node tests/e2e.smoke.mjs
PLAYWRIGHT_REQUIRE_FROM=/usr/lib/node_modules/ CHROMIUM_PATH=<chrome> node tests/e2e.mobile.mjs
```

Módulos JS são concatenados em ordem alfabética num único script: nomes globais não podem se repetir
(há um teste que compila o pacote inteiro).
