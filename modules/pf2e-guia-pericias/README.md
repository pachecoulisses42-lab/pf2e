# PF2e: Guia de Perícias (PT-BR)

Módulo para Foundry VTT (sistema Pathfinder 2e) que abre uma janela com explicações em português de
como usar as perícias que o seu personagem possui.

## Como usar

1. Selecione o token do seu personagem (ou defina um personagem para o seu usuário em **Configurar Jogador**).
2. Digite no chat:
   - `/pericias` — abre o guia do token selecionado ou do seu personagem;
   - `/pericias Nome do Personagem` — abre o guia de um ator específico que você pode ver.
   (`/perícias` e `/skills` também funcionam.)

A janela mostra, para cada perícia treinada (ou todas, marcando a opção no topo):

- grau de proficiência e modificador (clique no modificador para rolar);
- um resumo da perícia e dicas táticas;
- as ações de perícia com custo em ações, se exigem treinamento e um botão para usar a ação
  (ou rolar a perícia, quando a ação não tem automação no sistema).

Também é possível abrir o guia por macro:

```js
game.modules.get("pf2e-guia-pericias").api.abrirGuia();
```

## Instalação

Copie a pasta `pf2e-guia-pericias` para `Data/modules/` do seu Foundry e ative o módulo no mundo.
