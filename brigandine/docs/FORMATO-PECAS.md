# Formato de peças para importar no Brigandine

Use este formato para trazer peças de outro módulo, planilha ou ferramenta. O arquivo `.json` entra por
**Peças → Importar peças (JSON)** ou por **Arquivo → Importar JSON** (quando o arquivo é só uma lista de
peças, o tabuleiro atual não é apagado). As peças vão para a galeria; depois é só clicar no tabuleiro.

Aceita três formas: uma lista `[ {...}, {...} ]`, `{ "pieces": [ ... ] }` ou `{ "templates": [ ... ] }`
(sem `grid`/`units`).

## Campos

Só `name` é obrigatório. Todo o resto tem padrão.

| Campo | Exemplo | Observação |
| --- | --- | --- |
| `name` | `"Goblin Xamã"` | Texto puro (HTML é removido). |
| `faction` | `"hero"`, `"villain"` | Também aceita `"enemy"`, `"inimigo"`, `"vilão"`, `"hostile"` e `-1` (Foundry). |
| `level` | `3` | 1 a 20. |
| `className` (ou `class`) | `"Gunslinger"` | Ajuda a escolher o token; vai para a ficha. |
| `ancestry` | `"Kitsune"` | Idem. |
| `hp` (ou `maxHp`), `ac` | `30`, `18` | Sem ficha própria, o app ajusta a ficha para reproduzir esses valores. |
| `abilities` (ou `attrs`) | `{ "str": 4, "dex": 2 }` | Modificadores. Aceita `FOR/DES/CON/INT/SAB/CAR` ou `str/dex/con/int/wis/cha`. |
| `moveSpeed` (ou `speed`) | `9` | Em metros. |
| `weapons` (ou `attacks`) | `[{ "name": "Arco", "dmgDie": "1d8", "dmgType": "perfurante", "reach": 18 }]` | Mesmo formato do editor de armas (runas em `extra`). Sem armas: um ataque desarmado. |
| `spells` | `["bola_de_fogo", { ... }]` | Ids do catálogo ou objetos de magia completos. Ids desconhecidos são ignorados. |
| `items` | `["pocao_menor"]` | Ids do catálogo (`pocao_menor`, `pocao_moderada`, `elixir_vida`, `perg_cura`…). |
| `resistances`, `weaknesses`, `immunities` | `[{ "type": "fogo", "value": 5 }]`, `["veneno"]` | Mesmos tipos da aba Base. |
| `sheet` | ficha completa do Brigandine | Se vier, é usada no lugar dos campos soltos acima. |

## Token

O token é decidido nesta ordem:

1. **Chave de token** em `sculpt`, `token` ou `tokenKey`: qualquer chave do app (`guerreiro`, `goblin`…) ou
   dos extras (`ct_samurai`, `vr_lobo_alfa`…). A lista completa sai de `Brigandine.listTokens()` no console.
2. **Nome do token por extenso** no mesmo campo: `"token": "Lobo de Guerra"`.
3. **Imagem própria** em `img`, `image`, `token` ou `prototypeToken.texture.src`, desde que seja
   `data:image/...` (PNG, JPG, WebP, GIF ou SVG embutidos). Endereços `http(s)://` não são baixados.
4. **Sugestão automática** pelo nome, depois classe, ancestralidade/tipo/traços e origem, em português ou
   inglês (`Wizard` → Mago, `Skeleton` → Esqueleto, `Goblin Shaman` → Goblin Xamã). Sem nenhuma pista:
   Guerreiro para heróis, Bandido para vilões.

Arquivos antigos com uma chave de token que não existe mais passam pela mesma regra. Em qualquer caso o
token pode ser trocado depois na aba **Base → Galeria de tokens** da peça.

## Exemplo

```json
{
  "pieces": [
    { "name": "Amiri", "className": "Barbarian", "level": 2, "hp": 30, "ac": 18,
      "weapons": [{ "name": "Espada Bastarda", "dmgDie": "1d12", "dmgType": "cortante" }] },
    { "name": "Sentinela", "faction": "enemy", "token": "Lobo de Guerra" },
    { "name": "Sacerdotisa", "token": "cr_kitsune", "spells": ["fogo_de_raposa"] }
  ]
}
```

## Para módulos que rodam junto com o app

O app expõe `window.Brigandine`:

```js
Brigandine.importPieces({ pieces: [...] });          // → { added, suggested }
Brigandine.suggestToken({ name: 'Skeleton Archer' }); // → 'esqueleto'
Brigandine.listTokens();                             // → [{ key, name, source }]
Brigandine.registerTokenGroup({                      // novas imagens de token
  id: 'meu_pacote', label: 'Meu pacote', kind: 'topo', faction: 'villain',
  items: [{ key: 'mp_dragao', name: 'Dragão', src: 'data:image/webp;base64,...' }]
});
```

`kind: "topo"` = figura vista de cima (gira com a direção da peça); `"retrato"` = imagem recortada em
círculo com o aro da facção. Chaves que já existem são ignoradas. Para ligar as duas versões da mesma figura
(e fazê-las trocar com o Estilo dos tokens), use prefixos `xt_`/`xr_` iguais no resto da chave ou `"pair": "outra_chave"`.
