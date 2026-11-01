# v62.3 · Planejamento compartilhado, rolagem oculta e Atenção Focada vinculada — Spec

> Pedido do Ulisses (01/11/2026). Decisões dele: R38–R41 (registro da Etapa 2). Esta versão passa à frente das ondas M3–M8 do redesenho (R38).

## 1. O que muda para a mesa
1. **Planejamento num arquivo próprio.** Um painel "📋 Planejamento" monta o plano do turno (Mercantil, Liderança, Região, Cívicas) num documento que se salva como `.json` à parte e passa de mão em mão. Cada jogador abre o arquivo no mesmo Gerenciador (mesmo sem ter o reino), escolhe "quem sou eu" e preenche as linhas do seu líder; salva e manda adiante. O mestre importa o arquivo de volta e o aplica ao turno.
2. **Rolar tudo, oculto.** Na prancheta principal, "🎲 Rolar tudo (oculto)" rola o d20 de todos os testes planejados e não mostra nada. Em cada teste, o jogador escolhe: **usar o d20 já rolado** (só então ele aparece) ou **informar o d20 da mesa** (o oculto é descartado sem ser mostrado, R40). O total, a CD e o grau são calculados na hora da escolha, com o estado daquele momento.
3. **Atenção Focada vinculada.** Cada Atenção Focada do plano se vincula a **um teste à frente** de outro líder (Liderança abaixo dela ou Região). A perícia da Atenção Focada passa a ser a do teste vinculado (Guia L877-879: a perícia escolhida é a do teste ajudado). No sucesso, o +2 (+3 com Cooperativa) vale **só naquele teste**. O vínculo aparece na Atenção Focada ("→ Hashirama · Construir Estrada · Engenharia") e no teste ajudado ("← Atenção Focada de Linda").
4. **Pergunta ao salvar.** Ao salvar o arquivo (ou encerrar), o app volta em cada Atenção Focada sem vínculo e pergunta a qual teste à frente ela se vincula. Sem teste à frente ainda, salva e lembra no próximo salvamento; "Encerrar planejamento" exige todas vinculadas (R41).

## 2. O documento de planejamento (`.json`)
```
{ tipo: 'km-planejamento', v: 1,
  reino: {id, nome}, turno: n, criadoEm, atualizadoEm, encerrado: false,
  retrato: <o ctx do motor (pnCtx): líderes, perícias, atributos, Ruína, efeitos, limites, assentamentos, config> + funcoes nomes,
  plano: { mercantil, lideranca[], regiao[], civicas[] },     // a mesma forma de state.turno.prancheta.plano
  edicoes: [{quem, nome, em}] }                                // por onde o arquivo passou
```
- O retrato é só leitura (R39): com ele, quem não tem o reino vê as mesmas atividades permitidas, limites e modificadores (`pv2Permitidas`, `trMontar`).
- Linha de Liderança ganha `vinculo` (texto: o `id` da linha ajudada; '' sem vínculo). Campo novo opcional; a normalização da v2 guarda chaves desconhecidas; o `SCHEMA_V` não muda.
- Validação na abertura (falha fechada): tipo, versão, listas; linha mal formada sai com aviso; nada do reino é tocado ao abrir.

## 3. Quem edita o quê (R39)
- "Quem sou eu": **Mestre** (edita tudo) ou um líder PJ do retrato.
- Linha de Liderança é do líder da `funcao`; de Região, do `quem`. Mercantil e Cívicas são livres.
- Jogador só cria linhas para si (Liderança/Região com a própria função) e Cívicas; não apaga nem muda linha de outro.

## 4. Vínculo da Atenção Focada
- Alvos possíveis de uma Atenção Focada na posição i da Liderança: linhas de Liderança j > i e todas as de Região, com atividade que tem teste, de **outro** líder (função ≠ a da Atenção Focada), que não sejam Nova Liderança, e com perícia escolhida.
- Vincular grava `vinculo` e copia a perícia do alvo para a Atenção Focada; perícia do alvo mudou → acompanha; alvo apagado ou movido para antes → vínculo quebrado (pendente).
- No motor: o auxílio vinculado tem alvo `auxilio:<funcao>:<pericia>:<linhaId>` e só bate com o teste daquela linha (`trAlvoBate`); sem o 4º pedaço, o comportamento da v62.1 continua (Atenção Focada sem vínculo, escolhida na hora).
- Na prancheta principal, a Atenção Focada vinculada não pergunta líder e perícia ao aplicar: usa o vínculo. O cartão também deixa trocar o vínculo.

## 5. Rolagem oculta (R40)
- `turno.ocultos: { <testeId>: {d20} }` (zera no fim do turno, com o resto do `turno`). Rolar tudo é um toque explícito (grava), não mexe na Ficha nem no registro.
- Linhas que entram: Mercantil com "fazer" e atividade; Liderança, Região e Cívicas com atividade com teste; sem teste já rolado e sem oculto.
- O cartão mostra "🎲 Usar o d20 já rolado" e "d20 da mesa"; a lista marca "🎲 oculto". Usado ou trocado pela mesa, o oculto sai. O valor oculto nunca é desenhado na tela.

## 6. Entradas
- Prancheta: botão "📋 Planejamento" (abre o painel com o plano atual) e "🎲 Rolar tudo (oculto)".
- Meus Reinos e o importar do v60: um `.json` com `tipo: 'km-planejamento'` abre o painel de planejamento em vez de virar reino.
- O painel guarda um rascunho no aparelho (localStorage), para não perder o que foi preenchido se a página fechar.

## 7. Fora desta versão
Eventos no plano; vínculo para Cívicas (sem líder); edição simultânea (o arquivo passa de mão em mão, um por vez).
