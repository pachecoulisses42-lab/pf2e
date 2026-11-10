# Prancheta de Fases do Reino — modo foco (v62.16)

Pedido do Ulisses: ao fazer as fases do reino, a tela mostra só a etapa de agora; as outras etapas só aparecem ao navegar (trocar de
fase, avançar, pular, voltar). Dá para sair no meio salvando o progresso e, do lado de fora, retomar, salvar ou excluir e começar de
novo. E o app precisa ficar bom de usar num telefone Android (referência de densidade: Pathbuilder 2e).

## Decisões (R80–R84 no registro de decisões do gerenciador)

- **R80 — modo foco é o padrão.** `km_prancheta_modo`: `foco` | `lista` (o `fichario` guardado conta como foco; o fichário saiu).
  Dentro do foco a classe `km-foco` no `<html>` esconde o resto do app. Fica: topo (✕ Salvar e sair, abas das fases com o andamento,
  ⚠ pendências, 📋 Planejamento, 🎲 Rolar tudo), a trilha das etapas da fase, o cartão da etapa e a barra de baixo (← Voltar, Pular
  etapa / Reabrir etapa, e o botão principal: Próxima atividade, Concluir etapa, Próxima etapa, Concluir as fases do reino).
- **R81 — sair no meio.** "Salvar e sair" grava (com o lugar onde parou) e volta ao cartão de retomada. Não existe "sair sem salvar":
  cada ação da prancheta já grava ao ser feita. O "voltar" do Android faz o mesmo, em vez de fechar o app.
- **R82 — do lado de fora.** Só o cartão de retomada: onde parou, o andamento por fase (toque abre o foco na fase), Continuar de onde
  parei, Salvar o progresso, Excluir e começar de novo (o Reiniciar o turno: pergunta, desfaz os efeitos, volta os passos ao começo).
- **R83 — Fecho.** Quinta aba: resumo das fases, pendências, concluir as fases (R73), Considerações do Turno, anotações e Finalizar
  Turno, tudo sem sair do foco. Mudar de turno ou de reino fecha o foco.
- **R84 — telefone.** Desenhado primeiro para 360–412 px: abas numa faixa que rola de lado e fica presa no alto, células compactas com
  o rótulo em cima do valor, barra de baixo presa (área segura), o cartão rola com a página, alvos de 44 px e campos de 16 px.

## Onde está no código do gerenciador

`src/prancheta-foco.js` e `src/prancheta-foco.css` (novos); `puCartaoHtml(p, {foco:true})`, `puModo`, `puIrFase('fecho')` em
`src/prancheta-desenho.js`; ganchos em `prancheta-acoes.js`, `prancheta-ouvintes.js`, `casca.js`, `eventos-elo.js`. Testes:
`tests/prancheta-foco.test.js` (20 casos: retomada, tela limpa, salvar e sair, excluir, navegação sem gravar, barra, fecho, troca de
turno, "voltar" do aparelho, pendências, 360 e 412 px, modo lista, contraste nos três temas).

## O que não entrou

As outras abas do app (Ficha, Locais, NPCs, Build) não foram redesenhadas nesta versão; já tinham leiaute de telefone e seguem como
estavam. O modo lista da prancheta continua igual, para quem quiser ver o turno inteiro de uma vez.
