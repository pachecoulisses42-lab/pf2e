# Prancheta de Fases do Reino — redesenho por primeiros princípios

> Gerenciador KM (Kingmaker PF2e) · proposta para depois da v62.1 · 31/10/2026
> Protótipo clicável: `kingmaker/prototipo-prancheta.html` (abre direto no navegador, celular ou PC, sem rede).

---

## 0. O que foi medido (v62, reino-modelo "Folha de Patra", turno 7)

| Medida | Celular 390×844 | PC 1366×768 |
|---|---|---|
| Altura da Prancheta | **3.811 px ≈ 4,5 telas** | 3.101 px ≈ 4 telas |
| Cartão "Agora" | 523 px **com rolagem própria** dentro da página que também rola | 688 px, coluna esquerda |
| Lista do turno | 3.271 px empilhados **embaixo** do cartão | 3.101 px na coluna direita |
| Botões dentro da Prancheta | **95** | 95 |
| Progresso do turno visível | só "Fase agora 0/4 passos" (a fase, não o turno) | idem |

O que a medição mostra:

1. **Duas rolagens uma dentro da outra.** No celular, o cartão é `position:sticky` com `max-height` e `overflow-y:auto`. O dedo que rola o cartão não rola a página, e o que rola a página não alcança a lista sem sair do cartão. Nas capturas, quatro gestos seguidos de rolagem mostram sempre a mesma tela.
2. **Duas formas de andar pelo turno disputando a mesma tela.** O cartão tem "Próxima ação →". A lista tem 15 passos com "Pular", ▲▼, ✕, "+ Atividade" e o texto inteiro da Região predileta. As duas ficam sempre à mostra e nenhuma diz quanto do turno já foi feito.
3. **O padrão aparece como se fosse uma decisão.** O Recesso mostra 8 seletores "Sim, passou" (um por função). Quase sempre ninguém muda nada, mas o usuário precisa rolar por cima deles em todo turno.
4. **O progresso existe nos dados e não aparece na tela.** `p.turno.feitos`, `p.plano.pulados`, `RR_PASSOS` (15 passos), os testes rolados e `ptAvisosFim` permitem calcular tudo o que o usuário pergunta ("onde estou, quanto falta, o que ficou pendente"). Hoje só a fase é resumida.

---

## 1. Decomposição atômica: os pilares

Tirei as suposições herdadas: que a lista do turno precisa estar sempre à vista; que o cartão e a lista são telas iguais; que celular e PC são o mesmo layout encolhido; que mostrar tudo é ser transparente. Sobraram cinco fatos:

**P1. O turno é finito e todo conhecido.** São 4 fases e 15 passos fixos (`RR_PASSOS`), mais N atividades planejadas (`plano`). Dá para calcular o andamento a qualquer momento a partir dos dados: passos feitos ou pulados, atividades roladas, efeitos que faltam aplicar. Por isso, "não saber em que altura está" é um problema de **apresentação**, não de dados.

**P2. A cada instante só existe uma ação útil.** Uma linha do turno sempre passa por três estados: **Preparar** (quem, perícia, modificador contra a CD), **Rolar** e **Aplicar** (efeitos do grau, com ↶). Cada cartão de passo (Desordem, Recursos, Consumo, XP…) cabe nesse mesmo ciclo, só sem a rolagem. A unidade de atenção é **uma ação**, não a página.

**P3. A tela é um orçamento.** No celular sobram cerca de 600 px úteis entre o Painel do Reino (56 px) e a barra de abas (~60 px). Cada pixel ocupado por algo que não é a ação de agora é tirado dela. No PC sobra largura, e hoje ela é gasta com uma lista do tamanho da página.

**P4. O app é usado na mesa, no meio de interrupções.** O mestre olha o app entre uma fala e outra. Precisa **retomar com uma olhada**: onde estou, o que faço, quanto falta. O turno também tem dois momentos diferentes: **planejar** (antes da sessão ou na conversa dos jogadores: quem faz o quê, em que ordem) e **jogar** (rolar e aplicar, um item depois do outro).

**P5. As regras do motor não mudam.** "Nada muda sozinho", ↶ e registro em cada toque, "abrir não é editar", migração sem perda. O redesenho mexe **só na camada de apresentação** (`pu*`, CSS). O motor (`rr`, `tr`, `pv2`, `pa`, `pt`, `pn`) e a forma do estado ficam como estão, e `SCHEMA_V` continua 37.

---

## 2. Tensões e conflitos

| # | Forças em conflito | Como estão hoje | Como resolver |
|---|---|---|---|
| T1 | **Ver o todo** (onde estou) × **foco** (o que fazer agora) | As duas coisas aparecem inteiras ao mesmo tempo e uma come a outra | O todo vira **uma linha fixa** (trilho com x/15 e as fases). O mapa completo só aparece quando pedido |
| T2 | **Planejar** (montar e reordenar a lista) × **jogar** (rolar e aplicar) | Controles de edição em toda linha, o tempo todo | **Dois modos** explícitos. Em "Jogar", a lista só serve para navegar; em "Planejar", ela é editável |
| T3 | **Profundidade de regra** (motivos, limites, predileta, Guia p.) × **legibilidade** | Todo texto de regra aparece por extenso | **Revelação progressiva**: mostrar só o que **foge do padrão** (bloqueio, penalidade, vaga extra). A explicação fica atrás de ⓘ |
| T4 | **Controle** ("nada muda sozinho") × **velocidade** | Um "Aplicar" por efeito, espalhados pelo cartão | Mantém o toque explícito, mas junta os efeitos num único bloco "Aplicar efeitos (3)" no fim do estágio, sempre com ↶ |
| T5 | **Ordem do Guia** × **liberdade da mesa** (pular, voltar, fazer fora de ordem) | "Próxima ação", "Pular" em cada passo e toque na lista: três caminhos | O padrão é seguir em frente (botão principal). Para saltar, usa o mapa. "Pular" fica no menu ⋯ do passo |
| T6 | **Mesmo app nos dois aparelhos** × **aproveitar cada tela** | Celular: tudo empilhado. PC: duas colunas e muito vazio | Mesmos componentes em arranjos diferentes, decididos por *container query* no `#prnV2` (não pela largura da janela, porque a barra lateral do PC muda a largura útil) |
| T7 | **Prancheta** × **resto do app** (Painel, Considerações, Eventos, Histórico) | A Prancheta vive dentro de "Assistente de Turno", com Considerações abaixo e o Painel em cima repetindo dados | O Painel vira o trilho quando a aba Gestão está aberta. Considerações passam para o fechamento do turno. Eventos alimentam o passo evento‑2 |

---

## 3. Construção modular, de baixo para cima

Cada módulo sai de um pilar e pode ser feito e testado sozinho.

### M1. Progresso do turno: puro, novo `src/prancheta-progresso.js`, prefixo `pg` (P1, P5)
```
pgProgresso(p, ctx) → {
  total: 15, concluidos: n, pct: 0..100,
  atual: { fase, passoId, linhaId, iFase, nFase, iGeral },
  fases: [{ id, nome, concluidos, total,
            passos: [{ id, nome, estado: 'feito'|'pulado'|'atual'|'aberto'|'bloqueado',
                       linhas: { total, roladas, pendentes } }] }],
  pendencias: ptAvisosFim(p)   // efeitos não aplicados, custos não registrados…
}
```
- Calculado só de `feitos`, `pulados`, `turno.testes`, `turno.registro` e `RR_PASSOS`. Não grava nada (R20).
- Um passo de atividades conta como **concluído** quando está marcado como feito ou quando todas as linhas estão roladas e sem efeito pendente.
- Testes unitários (`tests/unit-progresso.test.js`): turno vazio, passos pulados, linha rolada com efeito pendente, migração v1.

### M2. Trilho: a resposta a "onde estou e quanto falta" (P1, P3, P4)
- Uma linha fixa sob o Painel do Reino, com 48 px de altura:
  `Turno 7 · Passo 6 de 15 · Mercantil 2/4   ▰▰▰▰▱▱▱▱▱▱▱▱▱▱▱   ⚠ 2`
- Os segmentos são coloridos por fase: o passo feito fica cheio, o pulado tracejado, o atual com anel.
- Um toque abre o **Mapa** (M4). O "⚠ 2" abre direto as pendências.
- Substitui a pílula "Fase agora 0/4 passos" do Painel.

### M3. Cartão "Agora" em três estágios, sem rolagem própria (P2, P3)
- O cartão volta a rolar com a página: sai o `overflow-y:auto` e o `max-height`.
- O cabeçalho fica compacto: `Mercantil · Coletar Impostos` e o nome de quem faz.
- Um mini-indicador de estágio: **Preparar → Rolar → Aplicar**. Nos passos sem teste, só "Aplicar".
- **Barra de ação fixa no polegar**, logo acima da barra de abas: `‹ Voltar` · **[ação principal do estágio]** · `⋯`.
  A ação principal muda conforme o estágio: *Escolher atividade* → *Rolar (+7 contra CD 18)* → *Aplicar efeitos (3)* → *Próximo passo →*.
- O `⋯` reúne o que é raro: Pular este passo, Nota, Guia p., Detalhes do cálculo.

### M4. Mapa do turno: a lista vira algo que se abre quando preciso (P1, P4)
- **Celular**: folha que sobe de baixo, aberta pelo trilho ou pelo botão ☰. Mostra só a fase atual aberta; as outras ficam recolhidas, com um resumo como "Manutenção ✓ 4/4".
- **PC (≥ 1024 px de contêiner)**: coluna fixa à esquerda, com 260 px.
- Cada linha mostra estado, nome, quem e o grau (CS/S/F/FC). Um toque leva até ela.
- Sem controles de edição no modo Jogar.

### M5. Modo Planejar × Jogar (P4, T2)
- Um botão de dois estados no Mapa.
- **Planejar** liga ▲▼, ✕, "+ Atividade", "Pular passo" e a Região predileta. Os limites aparecem como contador (`Liderança: Linda 2/3 · Talon 1/3`).
- **Jogar** é o padrão: o mapa só navega.
- O `plano` já persiste entre turnos. Então o modo Planejar serve para preparar a sessão inteira de uma vez, no PC, antes da mesa.

### M6. Exceção primeiro (P3, T3)
- **Recesso**: `✓ Todos os líderes passaram o recesso`, com o botão *Alguém não passou?*. Os 8 seletores só aparecem depois desse toque.
- **"Chegou neste turno"**: uma linha só, com *Aplicar tudo* e o detalhe ao abrir.
- **Motivos e limites**: aparecem só quando há bloqueio, penalidade ou vaga extra. O resto vai para ⓘ, que abre uma folha de ajuda com o texto do Guia (Lnnn).

### M7. Fechamento do turno (P1, T7)
- Depois do passo 15, o cartão "Fim do turno" reúne: o resumo (o que mudou na Ficha, a partir do registro), as pendências (`ptAvisosFim`) com link para cada uma, as **Considerações do Turno** (saem do rodapé da página e vêm para cá) e o fim de turno em dois tempos, que já existe.

### M8. Arranjo responsivo por contêiner (P3, T6)
| Largura do `#prnV2` | Arranjo |
|---|---|
| < 600 px | Trilho, cartão e barra de ação. O Mapa é uma folha |
| 600–1023 px | Trilho e cartão com até 680 px. O Mapa é um painel lateral que abre e fecha |
| ≥ 1024 px | Três colunas: **Mapa** (260) · **Cartão** (fluido, até 720) · **Reino agora** (300: Desordem, PR, materiais, Fama e o *Registro do turno* com ↶) |

A terceira coluna resolve o "restrito" do PC. O que hoje obriga a trocar de aba para conferir (a Ficha) fica ao lado da ação que a altera.

---

## 4. Especificação executiva

### O protocolo integrado
```
         ┌──────────── Trilho (M2) ← pgProgresso (M1) ─────────────┐
         │ Turno 7 · Passo 6/15 · Mercantil 2/4  ▰▰▰▰▰▱▱…  ⚠2      │──toque──▶ Mapa (M4/M5)
         └───────────────────────────────────────────────────────────┘
 Mapa (M4)          Cartão Agora (M3)                    Reino agora (M8, ≥1024)
 fases→passos→      Preparar → Rolar → Aplicar           Desordem · PR · Materiais
 linhas             (exceção primeiro, M6)               Registro do turno (↶)
                    ┌─────────────────────────────┐
                    │ ‹  [ Rolar +7 vs CD 18 ]  ⋯ │  ← barra de ação no polegar
                    └─────────────────────────────┘
 … passo 15 → Fim do turno (M7): resumo + pendências + Considerações + 2 tempos
```

**Contrato**: os módulos novos só **leem** o estado e chamam as ações que já existem: `pnAplicar`, `puDesfazer`, `ir`, `lista-*`, `rolar:*`, `aplicar:*` no `puMapa`. Nenhuma regra muda, nenhum campo novo entra em `state`, e `SCHEMA_V` segue 37. A única preferência nova, o modo Planejar ou Jogar, fica no `localStorage`, como uma conveniência deste aparelho.

### Por que é melhor que as alternativas de costume
- **Só compactar o CSS** (fontes e margens menores) ganharia algo como 30 % de altura, mas mantém as duas rolagens aninhadas, as duas navegações concorrentes e a falta de progresso. Trata o sintoma, não a causa.
- **Um assistente linear rígido** (tela por passo, só "Avançar") resolve o foco, mas quebra a liberdade da mesa (P4, T5) e o modo de planejar.
- **Abas por fase** escondem o todo justamente onde o usuário se perde: na passagem entre fases.
- **A proposta** separa o *saber* (trilho, que é derivado e sempre visível, custa 48 px) do *fazer* (um cartão, uma ação principal) e do *navegar ou planejar* (mapa sob demanda). Não toca em nenhuma regra.

### Metas de aceitação (medidas com Playwright, no reino-modelo)
| Meta | v62 | Alvo |
|---|---|---|
| Altura da Prancheta no celular, passo típico | 3.811 px | ≤ 1,3 tela (≤ 1.100 px) |
| Botões visíveis no modo Jogar | 95 | ≤ 12 |
| Rolagens aninhadas | 1 | 0 |
| Progresso do turno (x/15) visível | não | sempre, em qualquer rolagem |
| Toques para rolar e aplicar uma atividade planejada | 3 a 5 e rolagem | 2 (Rolar, Aplicar) |
| Contraste e alvos | 4,5:1 · 44 px | sem mudança (tokens do tema) |

### Ordem de entrega
1. **v62.2-a, já: M1 e M2** (progresso puro e trilho). Responde sozinho a "onde estou, quanto falta" e tem risco mínimo, porque só lê dados.
2. **v62.2-b: M3 e M6** (cartão em estágios, barra de ação, exceção primeiro). Fim da rolagem aninhada.
3. **v62.2-c: M4, M5 e M8** (mapa como folha ou coluna, Planejar × Jogar, três colunas no PC).
4. **v62.2-d: M7** (Fim do turno com as Considerações).
Os Exércitos (planejados como v62.2) passam para v62.3. **Essa decisão é do Ulisses.**

### Passo inicial de execução imediata
Com o pacote `km-fonte-v62_1.tar.gz` restaurado (`git clone km61.bundle km61 && python3 build.py`), na branch `prancheta-progresso-v62_2`:
1. Escrever `tests/unit-progresso.test.js`, com os cinco cenários de M1, falhando.
2. Criar `src/prancheta-progresso.js` (só `function`; exporta `pgProgresso`) e incluí-lo em `JS_CEDO`, depois de `prancheta-turno.js`.
3. Em `prancheta-desenho.js`, trocar a pílula "Fase agora" pelo trilho, que lê `pgProgresso`. O toque no trilho abre a lista atual: o Mapa de verdade chega em M4.
4. Medir de novo com o script de Playwright desta proposta (altura, botões, progresso visível) e comparar com a tabela da seção 0.

### Decisões para o Ulisses
- D-a. A ordem de entrega acima, com Exércitos indo para v62.3.
- D-b. O modo Planejar fica guardado por aparelho (`localStorage`, recomendado) ou no reino?
- D-c. As Considerações do Turno passam para o cartão Fim do turno (recomendado) ou ficam também abaixo da Prancheta?
- D-d. No PC, a terceira coluna "Reino agora" mostra o Registro do turno inteiro ou só as últimas 5 linhas, com "ver tudo"?
