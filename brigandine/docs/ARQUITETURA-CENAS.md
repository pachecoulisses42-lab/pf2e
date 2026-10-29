# Cenas de combate — arquitetura

Documento de desenho da funcionalidade **Cenas**: montar vários cenários de combate com antecedência,
guardar, organizar e abrir cada um quando for usar na mesa. Inclui também a volta do **registro de dados e
ações** ao painel de combate.

## 1. Requisitos

### Funcionais
1. Criar uma cena a partir do tabuleiro atual, em branco ou duplicando outra.
2. Cada cena guarda **tudo do tabuleiro**: grade, mapa de fundo, terreno, objetos, perigos, clima,
   transparências e as peças com ficha, armas, magias, itens, direção e token.
3. Organizar: nome, anotações do mestre, ordem (subir/descer), miniatura, data da última alteração.
4. Abrir uma cena para editar (montagem) ou **iniciar** direto em combate (rola iniciativa).
5. Uma cena preparada pode ser usada várias vezes sem estragar o original: o combate em andamento fica
   num **progresso** separado, que pode ser continuado ou descartado.
6. Salvar alterações na cena aberta; avisar antes de trocar de cena com alterações não salvas.
7. Excluir (com confirmação), exportar uma cena ou todas (arquivo de campanha) e importar.
8. Funciona offline, no arquivo único, no computador e no celular.
9. Registro de dados e ações visível no combate, abaixo de *Encerrar combate*, recolhível; a escolha
   (aberto/fechado) é lembrada.

### Não funcionais
- **Volume:** dezenas de cenas. Uma cena sem mapa de fundo tem ~30–150 KB de JSON; com mapa de fundo
  importado, 0,5–5 MB (imagem em data URL); imagens próprias de token, até ~60 KB cada.
- **Latência:** abrir/salvar uma cena < 200 ms na prática; a lista abre sem carregar as cenas inteiras.
- **Confiabilidade:** nada se perde por falta de espaço sem aviso; sempre existe a saída "exportar".
- **Compatibilidade:** arquivos JSON antigos (v4/v5) continuam abrindo; cenas têm `version`.

### Restrições
- Sem servidor e sem dependências: tudo no navegador, código concatenado num único HTML.
- `localStorage` tem ~5 MB por origem e é síncrono; não comporta várias cenas com mapa de fundo.

## 2. Desenho geral

```
┌──────────────────────── Interface ────────────────────────┐
│ Cabeçalho: [Cenas ▾] "Cena: Emboscada na ponte •"          │
│ Janela Cenas: cartões (miniatura, nome, notas, data)       │
│   Abrir · Iniciar · Continuar · Duplicar · ↑↓ · Excluir    │
│   Nova (do tabuleiro / em branco) · Exportar · Importar    │
└───────────────┬──────────────────────────────┬────────────┘
                │ ações                         │ lista (só metadados)
┌───────────────▼──────────┐       ┌────────────▼────────────┐
│ Modelo de cena (puro)     │       │ Repositório de cenas     │
│ snapshot ⇄ STATE          │──────▶│ IndexedDB (principal)    │
│ normalizar, versão, hash  │       │ localStorage (reserva)   │
│ duplicar, nome único      │       │ memória (último recurso) │
└───────────────────────────┘       └─────────────────────────┘
```

| Módulo | Responsabilidade |
| --- | --- |
| `12d-scenes-model.js` | Funções puras: capturar o tabuleiro num *snapshot*, metadados, nomes únicos, ordem, impressão digital para "alterado?", normalização/versão de cenas importadas. Testável em Node. |
| `12e-scene-store.js` | Repositório assíncrono com a mesma interface sobre IndexedDB, `localStorage` ou memória. Guarda cenas, a biblioteca de modelos e a cena ativa. |
| `13b-scenes-ui.js` | Janela de cenas, indicador no cabeçalho, confirmações, miniatura, exportar/importar, ligação com montagem e combate. |

## 3. Modelo de dados

```js
Scene = {
  id: 'sc_…', version: 1,
  name: 'Emboscada na ponte', notes: 'Goblins atacam ao amanhecer…',
  order: 3,                          // posição na lista
  createdAt, updatedAt,              // ms
  thumb: 'data:image/jpeg;base64,…', // 240 px, ~10–20 KB
  stats: { heroes: 4, villains: 6 }, // para o cartão, sem abrir a cena
  snapshot: Board,                   // cena preparada (o "original")
  progress: Board | null             // combate em andamento (opcional)
}

Board = {
  grid, terrainMap, objects, effects, effectZones, layers, units,
  combat: { round, activeUnitId, mode }   // só em progress
}
```

- **Modelos (galeria de peças) ficam fora das cenas**: são uma biblioteca única (`library`), porque o
  mesmo goblin serve a várias cenas. As peças dentro da cena são cópias completas (ficha própria), então a
  cena não depende da biblioteca para abrir.
- **Lista leve:** o repositório separa `meta` (tudo menos `snapshot`/`progress`) de `body`
  (`snapshot`/`progress`). Abrir a janela lê só os metadados.

### Armazenamento (IndexedDB `brigandine`, versão 1)

| Store | Chave | Conteúdo |
| --- | --- | --- |
| `sceneMeta` | `id` | metadados da cena |
| `sceneBody` | `id` | `{ id, snapshot, progress }` |
| `kv` | `key` | `library` (modelos do usuário), `activeSceneId` |

Reserva em `localStorage` (chaves `brigandine_scene_meta_v1`, `brigandine_scene_<id>`, `brigandine_kv_<k>`)
quando o IndexedDB não existe (alguns navegadores em `file://` ou modo privado). Se até isso falhar, a
memória segura a sessão e a interface avisa para exportar.

## 4. Fluxos

- **Salvar cena:** captura `snapshot` do tabuleiro (montagem) ou `progress` (combate), gera miniatura,
  grava `meta` + `body` numa transação, atualiza a impressão digital de "salvo".
- **Abrir:** se o tabuleiro atual tem alterações não salvas → perguntar (Salvar / Descartar / Cancelar).
  Aplica `snapshot` pelo mesmo caminho do "Importar JSON" (`applyLoadedPayload`), já testado e com
  normalização de arquivos antigos.
- **Iniciar:** abre o `snapshot`, entra em combate e rola iniciativa. O original nunca é alterado pelo
  combate; *Salvar* durante o combate grava em `progress`.
- **Continuar:** abre `progress` com rodada, peça da vez e modo.
- **Encerrar combate** numa cena: pergunta se descarta o progresso (o original continua intacto).
- **Alterado?:** impressão digital (`hashString` de um JSON canônico do Board) comparada com a do último
  salvamento — sem observar cada mudança espalhada pelo código.

## 5. Escala e confiabilidade

- IndexedDB comporta centenas de MB; 50 cenas com mapa de 2 MB ≈ 100 MB, dentro da cota típica.
- Erros de cota (`QuotaExceededError`) viram aviso no registro, sem perder o tabuleiro aberto.
- Exportar campanha (`brigandine_campanha.json`) = backup completo (cenas + biblioteca). Importar mescla
  e troca ids repetidos.
- `version` em cada cena permite migrar formatos depois.

## 6. Decisões e alternativas

| Decisão | Alternativa | Por quê |
| --- | --- | --- |
| IndexedDB com reserva em `localStorage` | Só `localStorage` | 5 MB não cabe várias cenas com mapa de fundo; a reserva mantém o app funcionando onde IndexedDB falha. Custo: código assíncrono. |
| `snapshot` + `progress` separados | Cena única que o combate altera | Prepara uma vez, usa várias; continuar uma sessão interrompida. Custo: até 2× o tamanho por cena. |
| Biblioteca de modelos global | Modelos por cena | Evita duplicar e desatualizar; cenas continuam autossuficientes porque as peças são cópias. |
| Impressão digital para "alterado?" | Marcar "sujo" em cada ação | Uma função em vez de dezenas de pontos de mudança; custo de serializar ao checar (apenas ao trocar de cena/salvar). |
| Janela modal de cenas no cabeçalho | Mais um menu na barra lateral | Cenas valem para montagem **e** combate; a barra lateral muda conforme o modo e já tem a regra de um menu por vez. |
| Miniatura JPEG 240 px | Sem miniatura | Achar a cena certa na mesa é visual; ~15 KB por cena. |

## 6b. Campanhas (pastas)

- `Campaign = { id: 'cp_…', name, notes, order, createdAt, updatedAt }`, guardadas no `kv` como
  `campaigns` (lista pequena, lida inteira ao abrir a janela).
- Cada cena ganha `campaignId` (ou `null` = *Sem campanha*). Mover uma cena de pasta é só trocar esse campo
  nos metadados — o tabuleiro não é regravado.
- A janela mostra uma barra de pastas: **Todas**, **Sem campanha** e cada campanha, com contagem. Dentro da
  pasta escolhida vale a lista única de antes (ordem ↑↓, busca por nome/anotação). Em *Todas* a busca
  procura em tudo e o cartão mostra a campanha; reordenar fica desligado ali.
- Cena nova entra na pasta aberta. Excluir campanha pergunta: mover as cenas para *Sem campanha* ou
  excluí-las junto.
- Exportar campanha = arquivo com a campanha e as cenas dela; o arquivo de "todas" leva também a lista de
  campanhas. Importar recria as campanhas (ids repetidos trocados) e liga as cenas a elas.
- Trade-off: pastas de um só nível. Subpastas (arcos dentro da campanha) ficariam para depois; a busca e
  as anotações cobrem bem dezenas de cenas por campanha.

## 7. O que revisar se crescer

- Subpastas dentro da campanha (arcos/capítulos) e etiquetas.
- Compartilhar cenas entre aparelhos (precisa de nuvem ou arquivo sincronizado).
- Guardar o registro de combate dentro do `progress`.
- Desfazer/histórico de versões da cena.

## 8. Registro no combate

O registro (antes só na gaveta inferior do tabuleiro) aparece no painel de combate, logo abaixo de
*Encerrar combate*, num bloco recolhível. Um único `addLog` escreve nos dois lugares; a gaveta inferior
fica só na montagem para não duplicar na tela. Aberto/fechado é guardado nas preferências.
