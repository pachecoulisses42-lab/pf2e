# Prompts para criar novos tokens no estilo do Brigandine

Há dois prompts prontos. Escolha pelo que você tem em mãos:

| Prompt | Para quê | Resultado |
| --- | --- | --- |
| **A. Código SVG** | IA de texto/código (Claude, ChatGPT etc.) | Uma função JavaScript que desenha o token com o kit do app. Fica vetorial, com a base oval, o contorno e a sombra idênticos aos 12 atuais. **É o jeito que mais se parece com os tokens existentes.** |
| **B. Imagem** | IA de imagem (Midjourney, DALL·E, Firefly etc.) | Um PNG transparente do personagem, que você importa pelo app (*Importar imagem*). Serve para variar a arte sem escrever código. |

Como usar: copie **todo** o bloco do prompt (do título até o fim do bloco), troque só os campos marcados `«assim»` e cole na IA.

---

## Prompt A — token em código (SVG)

````
Você é ilustrador e programador. Vai criar UM novo token de peça para o app Brigandine
(tabuleiro tático de RPG, Pathfinder 2e). O token é um personagem CHIBI de corpo inteiro,
desenhado em SVG por meio de um pequeno kit JavaScript que já existe. Responda com UMA função
JavaScript pronta para colar, e nada além do código e 3 linhas de explicação.

═══ O PERSONAGEM ═══
Nome: «ex.: Monge»
Chave (minúsculas, sem acento ou espaço): «ex.: monge»
Facção: «hero» ou «villain»
Cor de destaque (base oval, hex): «ex.: #e0a030»
Descrição visual: «ex.: careca, túnica laranja, faixa na cintura, cajado de madeira, expressão serena»
Cabeça: pele «hex ou use SKIN», olhos «round|angry|happy|narrow|glare|sleepy» cor «hex»,
        boca «smile|cat|frown|open|grin|snarl|none», orelhas «round|pointed|big|none»
Adereços: «arma/cajado/escudo/chapéu etc., e em qual mão»

═══ ESTILO (OBRIGATÓRIO, idêntico aos tokens existentes) ═══
- Chibi: cabeça grande (quase metade da altura), corpo curto, mãos e pés pequenos, adereços grandes.
- Contorno marrom-escuro grosso (#2b1b17), cor chapada com UM tom de sombra. O kit já aplica
  contorno externo e sombreamento automáticos; você só precisa desenhar formas com traço 3.5–4.5.
- Sem gradientes (cores chapadas). Brilhos só com traços curtos brancos (helper shine).
- Expressão forte e legível em 55 px: olhos grandes com 2 reflexos, sobrancelhas grossas.
- O personagem fica em pé sobre uma base oval na cor de destaque (o kit desenha a base).
- Silhueta clara: o adereço principal deve se destacar do corpo (afastado ou de cor contrastante).
- Heróis: olhar aberto, cores limpas. Vilões: sobrancelha baixa, dentes, tons mais sujos.

═══ O KIT (já existe; use SOMENTE estas funções) ═══
No arquivo já estão disponíveis (desestruturadas de CB):
  cb(d, fill, sw=4.5)                 // path com contorno: d = atributo "d" do SVG
  ce(cx, cy, rx, ry, fill, sw=4, rot) // elipse com contorno
  cc(cx, cy, r, fill, sw=4)           // círculo com contorno
  ccap(x1,y1,x2,y2, w, fill)          // cápsula com contorno (cabos, membros, hastes)
  csh(d, opacidade=0.55)              // traço branco de brilho (sem preenchimento)
  clegs({pants, boot, stance=0, bootStyle='round'|'tall'})   // pernas + botas
  ctorso({fill, y=138, w=58})         // tronco
  carm(lado, mãoX, mãoY, manga, pele, w=17)  // braço; lado: -1 esquerda da peça, +1 direita
  chead(id, {skin, eyes, eyeColor, mouth, brow, browTilt, blush, ears, nose, cy=96, rx=50, ry=46})
        // retorna { back, head }: back = orelhas (desenhe ANTES do cabelo/chapéu de trás),
        // head = cabeça + rosto (olhos, sobrancelhas, nariz, boca)
  CI = '#2b1b17' (cor do contorno), SKIN = '#f3c29b' (pele padrão)
  CB.frame(id, { faction, accent, art })  // moldura final (base oval, filtros)

Sua função deve ter exatamente este formato:

CHIBI_SVGS.«chave» = () => CB.frame('c_«chave»', {
  faction: '«hero|villain»', accent: '«#hex»',
  art: (id) => {
    const h = chead(id, { /* opções da cabeça */ });
    return { body: `
      ... camadas em ordem, de trás para frente ...
      ${h.back}${h.head}
      ... chapéu, cabelo, elmo (por cima da cabeça) ...
    ` };
  }
});

═══ GEOMETRIA (viewBox 0 0 256 256) ═══
- Cabeça: centro (128, 96), raio 50×46 → topo y≈50, base y≈142.
- Tronco: y 138–184, largura 58 (x 99–157). Cinto em y≈176–186.
- Pernas: y 184–217; botas centradas em y≈225. Base oval em y≈233 (rx 72).
- Ombros/braços: ombro esquerdo (100,150), direito (156,150). A mão é o ponto final do braço.
- Chapéu/cabelo podem subir até y≈6. Adereços ficam entre x≈20 e x≈236. Nada passa de y=244.
- Capa/manto: path ATRÁS do tronco, de y≈146 a y≈216, largura 80–100 em torno de x=128.
- Elmo/chapéu: desenhe DEPOIS da cabeça; cubra a testa mas deixe olhos (y≈104) visíveis.

═══ ORDEM DAS CAMADAS (de trás para frente) ═══
1 capa/manto e coisas atrás do corpo · 2 pernas (clegs) · 3 tronco (ctorso) · 4 peitoral, cinto,
detalhes · 5 adereços que ficam ATRÁS dos braços (cabo de arma, arco, cajado) · 6 braços (carm)
· 7 adereços que ficam NA FRENTE da mão (lâmina, escudo) · 8 ${h.back}${h.head} · 9 cabelo, chapéu,
elmo, barba (por cima da cabeça).

═══ ARMADILHAS A EVITAR ═══
- A mão deve tocar o PUNHO/CABO do objeto (um arco é segurado pelo punho, nunca pela corda).
- Cores: use #hex, nunca nomes de cor. Não use <image>, <text>, fontes nem filtros próprios.
- Ids: se criar gradiente/clip, use o parâmetro `id` como prefixo (ex.: `g_${id}`).
- Não referencie funções que não estão na lista do kit. Não altere a moldura.
- Evite detalhes menores que ~3 unidades: o token aparece com 55 px no tabuleiro.

═══ EXEMPLO COMPLETO (siga este nível de detalhe e este estilo de código) ═══
CHIBI_SVGS.druida = () => CB.frame('c_druida', {
  faction: 'hero', accent: '#5fae6a',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'round', eyeColor: '#4a9a50', mouth: 'smile', brow: '#5a3a1e', ears: 'pointed' });
    return { body: `
      ${cb('M90 146 Q70 194 84 216 L172 216 Q186 194 166 146Z', '#3f7a46')}
      ${clegs({ pants: '#6a4a30', boot: '#4a3426' })}
      ${ctorso({ fill: '#5fae6a' })}
      ${cb('M108 148 L148 148 L146 196 Q128 204 110 196Z', '#8bcf86')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#6a4a2a')}${cc(128, 184, 5, '#f0c84a', 3)}
      ${ccap(206, 224, 206, 52, 8, '#8a6038')}${cb('M206 28 C190 30 186 52 206 62 C226 52 222 30 206 28Z', '#7fd070')}${csh('M198 38 C198 46 202 52 206 55', 0.7)}
      ${carm(1, 206, 152, '#5fae6a', SKIN)}
      ${carm(-1, 84, 176, '#5fae6a', SKIN)}
      ${h.back}${h.head}
      ${cb('M80 92 C76 50 100 34 128 34 C156 34 180 50 176 92 C166 76 150 66 128 66 C106 66 90 76 80 92Z', '#3f7a46')}
      ${cb('M104 44 L92 14 L112 34Z M152 44 L164 14 L144 34Z', '#c9a86a', 4)}
      ${cb('M84 80 Q128 66 172 80 L172 88 Q128 74 84 88Z', '#f0c84a', 3.5)}
      ${csh('M96 54 Q108 44 126 42', 0.6)}` };
  }
});

═══ ENTREGA ═══
1. O código da função (um único bloco).
2. Em 3 linhas: onde cada parte da descrição foi desenhada e qualquer limitação.
Antes de responder, confira mentalmente: mão segurando o objeto pelo lugar certo, olhos visíveis,
silhueta legível, nenhuma função fora do kit.
````

**Depois de receber o código**, siga o passo a passo da seção "Como adicionar um token novo" do
[guia](GUIA-LAYOUT-E-TOKENS.md#8-como-adicionar-um-token-novo). Em resumo: cole a função em
`src/js/00e-chibi-heroes.js` (ou `00f-chibi-villains.js`), registre a chave nos dois `<select>`
de `src/index.html`, crie a peça (modelo) equipada em `src/js/03-templates.js`, marque o vilão em `VILLAIN_SCULPTS`, desenhe a versão
vista de cima em `src/js/00j-topdown-tokens.js` (guia, seção 7.5) e rode `npm run check`.

---

## Prompt B — token em imagem (para importar)

````
Create a single full-body CHIBI RPG character token, front view, standing, on a fully
transparent background (PNG with alpha). Style reference: cute fantasy chibi sticker art,
like a premium tabletop-RPG class bundle.

CHARACTER: «ex.: a serene human monk, bald, orange robe with a white sash, wooden staff»
FACTION MOOD: «hero: friendly, open eyes, clean bright colors | villain: angry brows, fangs, dirtier tones»
ACCENT COLOR: «e.g. warm gold»

STYLE RULES (must follow):
- Chibi proportions: head about 45% of total height, short body, tiny hands and feet,
  oversized signature prop (weapon/staff/shield/hat) that reads clearly as a silhouette.
- Thick dark-brown outline (#2b1b17) of uniform weight around the whole character and
  around major inner shapes. No black outline, no thin sketchy lines.
- Flat colors with exactly ONE shadow tone per color (cel shading, hard-edged shadow on the
  lower-right, small white highlight strokes on metal and hair). No gradients, no
  airbrush, no textures, no realistic rendering.
- Big expressive eyes with two white highlights; thick eyebrows; small simple mouth;
  rosy cheeks for friendly characters.
- Slightly desaturated, warm palette; steel = cool gray-blue, gold = #f0c84a-like yellow,
  leather = warm brown.
- Composition: ONE character only, centered, full body visible with margin, feet on a small
  flat oval ground base in the accent color with a dashed light ring. Square canvas 1024x1024.
- NO text, NO watermark, NO background scenery, NO cast shadow outside the oval base.

NEGATIVE: realistic, 3D render, photo, gradient shading, thin line art, multiple characters,
cropped limbs, text, logo, busy background.
````

**Como importar a imagem no app**

1. Salve como PNG com fundo transparente (lado maior até 1024 px; o app reduz para 384 px).
2. Abra a peça no modo Montagem → aba **Base** → **Importar imagem**.
3. Desmarque **Recortar em círculo com moldura** (a imagem já traz a base oval).
4. Para várias imagens de uma vez: **Peças → Importar imagens como modelos**.

Dica de consistência: gere todo o grupo na mesma sessão, reutilizando o mesmo prompt e trocando só a linha `CHARACTER`.
