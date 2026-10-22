# Plano — animações de ataques e magias

**É possível?** Sim. O tabuleiro já é desenhado em `<canvas>` quadro a quadro; dá para acrescentar uma
camada de animação desenhada em código (vetores e partículas), sem imagens novas, sem dependências e sem
aumentar o arquivo de forma relevante (estimativa: +30–50 KB). Funciona no computador e no celular.

## Como funcionaria

```
ataque/magia resolvido (regras como hoje)
        │  (dados, dano, defesas, registro — nada muda)
        ▼
fila de animações  ──►  laço de quadros (só enquanto houver animação)
        │                    │
        │                    ├─ peça atacante: avanço/recuo
        │                    ├─ projétil / feixe / explosão / partículas
        │                    └─ no "impacto": número de dano, barra de PV, tremida do alvo
        ▼
fim → tabuleiro volta ao desenho normal
```

- As regras continuam instantâneas e testáveis; a animação só **mostra** o que já foi decidido.
- O número de dano e a barra de PV mudam no momento do impacto, para casar com a animação.
- Opções: **Animações** ligadas/desligadas e velocidade (rápida ≈0,5 s / normal ≈0,9 s / cinema ≈1,4 s).
  Respeita "reduzir movimento" do sistema. Os testes rodam com animação desligada.

## Ataques com arma

O tipo de animação sai do tipo de dano e do nome/alcance da arma; o editor de arma ganha um campo
**Animação** (Automática, Corte, Estocada, Impacto, Flecha, Virote, Arremesso, Tiro) para escolher à mão.

| Arma | Acerto | Erro |
| --- | --- | --- |
| Espada, machado, cimitarra (cortante) | a peça avança um pouco, arco de corte brilhante, alvo pisca e recua | arco corta o ar, alvo esquiva de lado |
| Lança, adaga, rapieira (perfurante corpo a corpo) | estocada em linha reta com rastro | estocada passa raspando |
| Maça, martelo, punhos (contundente) | golpe com onda de impacto e tremida | poeira no chão ao lado |
| Arco e besta | flecha/virote voa girado na direção do alvo e crava por um instante | passa do alvo ou cai antes |
| Azagaia, shuriken, adaga arremessada, funda | projétil em arco (parábola) girando | cai e quica perto |
| Pistola | clarão no cano, traço do tiro, fumaça | traço desvia |
| Crítico | tudo maior, faísca dourada e "CRÍTICO" com destaque | — |

## Magias — uma animação para cada

Cada magia do catálogo ganha a sua; magias criadas no editor escolhem uma da lista ou usam a automática
(pela cor do tipo de dano + forma: alvo único = projétil, linha = feixe, explosão = esfera).

| Magia | Animação |
| --- | --- |
| Relâmpago | raio em zigue-zague ao longo da linha, clarão branco-azulado |
| Bola de Fogo | pequena brasa voa até o ponto e explode em esfera de fogo com fagulhas |
| Acorde Dissonante | ondas sonoras em anéis até o alvo |
| Chama Cristalina | estilhaços de cristal envoltos em chama rubra |
| Julgamento Radiante | coluna de luz dourada desce sobre o alvo |
| Toque Chocante | faíscas saltando da mão para o alvo |
| Raio Arcano | feixe violeta com runas |
| Espinhos Vivos | espinhos brotam do chão sob o alvo |
| Vento Cortante | linhas de vento com lâminas em meia-lua |
| Estilhaços de Gelo | cristais de gelo explodem em leque |
| Maldição Sombria | fumaça escura com glifo sobre o alvo |
| Rajada de Ki | punho de energia azul voa e estoura |
| Toque Sombrio | mão de sombra agarra o alvo |
| Lança Divina | lança de luz arremessada |
| Mísseis Mágicos | três dardos de luz em curva até o alvo |
| Fogo de Raposa | chamas-fátuas azuladas dançando até o alvo |
| Jato d'Água | jato em linha com respingos |
| Sopro Dracônico | baforada de fogo em leque até a área |
| Investida do Eidolon | silhueta espectral de dragão avança e golpeia |
| Fogueira Goblin | colunas de fogo tribal na área |
| Uivo Espectral | anéis azulados frios a partir da criatura |

Extras com a mesma base: poções (brilho verde subindo), acender tocha/lanterna (faísca e chama), perigo
disparando (espinhos saltam, fogueira labareda), Erguer Escudo (brilho no escudo).

**Escuridão (regra do projeto):** o brilho da animação é só visual; quem ilumina de verdade continua
sendo o *clarão* das magias (até o fim da rodada), como já decidido.

## Desempenho e qualidade

- Partículas com limite (≈300 ao mesmo tempo) e reaproveitadas; laço de quadros só roda durante a animação.
- Tudo desenhado com o mesmo estilo dos tokens (contorno escuro, cores do tema).
- Teste de navegador: ligar animações, atacar, conferir que a fila esvazia e que PV/registro batem com as
  regras; teste com animações desligadas continua igual aos atuais.

## Etapas sugeridas

1. Motor de animação + armas corpo a corpo e à distância + opções (ligar/desligar, velocidade).
2. As 21 magias do catálogo + animação automática para magias novas + campo "Animação" nos editores.
3. Extras (poções, luz, perigos, escudo) e ajustes finos.

## Decisões que preciso de você

1. Duração padrão: rápida (0,5 s), normal (0,9 s) ou cinema (1,4 s)?
2. Durante a animação o tabuleiro fica bloqueado (evita cliques no meio) ou pode clicar e pular?
3. Pode tremer levemente a tela em críticos e explosões?
4. Quer sons (espada, flecha, explosão)? Seriam sons sintetizados no navegador, sem arquivos, com volume
   e botão de mudo.
