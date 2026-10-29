/**
 * Explicações em português das ações de perícia do PF2e (Remaster).
 * `acao` é o slug em `game.pf2e.actions`; quando existir, a janela oferece um botão para usá-la.
 * `custo`: 1, 2, 3, "reacao", "livre", "exploracao" ou "tempo livre".
 * `treinado`: exige pelo menos treinado na perícia.
 */

const conhecimento = {
    nome: "Recordar Conhecimento",
    acao: "recall-knowledge",
    custo: 1,
    texto: "Lembre informações sobre criaturas, lugares, itens ou tradições ligados a esta perícia. Ótimo para descobrir fraquezas, resistências e habilidades de um inimigo.",
};

const decifrar = {
    nome: "Decifrar Escrita",
    acao: "decipher-writing",
    custo: "exploracao",
    treinado: true,
    texto: "Entenda textos cifrados, arcaicos ou muito técnicos relacionados ao tema da perícia.",
};

const identificarMagia = {
    nome: "Identificar Magia",
    acao: "identify-magic",
    custo: "exploracao",
    treinado: true,
    texto: "Descubra as propriedades de um item mágico, efeito ou local encantado da sua tradição (10 minutos).",
};

const aprenderMagia = {
    nome: "Aprender Magia",
    acao: "learn-a-spell",
    custo: "exploracao",
    treinado: true,
    texto: "Adicione uma nova magia da sua tradição ao grimório ou repertório, pagando os materiais (1 hora).",
};

const subsistir = {
    nome: "Subsistir",
    acao: "subsist",
    custo: "tempo livre",
    texto: "Encontre comida e abrigo para você (e talvez outros) sem gastar dinheiro.",
};

export const PERICIAS = {
    acrobatics: {
        resumo: "Agilidade, equilíbrio e movimentos acrobáticos. Ideal para se mover pelo campo de batalha sem tomar golpes.",
        dicas: [
            "Use Passar Rolando para atravessar o espaço de um inimigo e flanquear com um aliado.",
            "Equilibrar evita ficar desprevenido em superfícies estreitas ou escorregadias.",
            "É comum usar Acrobacia em vez de Atletismo para Escapar de agarrões.",
        ],
        acoes: [
            { nome: "Equilibrar", acao: "balance", custo: 1, texto: "Mova-se por superfícies estreitas, irregulares ou escorregadias sem cair." },
            { nome: "Passar Rolando", acao: "tumble-through", custo: 1, texto: "Atravesse o espaço de um inimigo testando contra a CD de Reflexos dele." },
            { nome: "Escapar", acao: "escape", custo: 1, texto: "Liberte-se de agarrado, imobilizado ou contido usando Acrobacia." },
            { nome: "Manobrar em Voo", acao: "maneuver-in-flight", custo: 1, treinado: true, texto: "Faça manobras difíceis enquanto voa, como curvas fechadas ou pairar com vento forte." },
            { nome: "Espremer-se", acao: "squeeze", custo: "exploracao", treinado: true, texto: "Passe por espaços apertados demais para o seu tamanho." },
        ],
    },
    arcana: {
        resumo: "Conhecimento sobre magia arcana, constructos, dragões e outras criaturas e planos mágicos.",
        dicas: [
            "Use Recordar Conhecimento contra constructos, bestas e dragões.",
            "Magos e outros conjuradores arcanos dependem dela para identificar e aprender magias.",
        ],
        acoes: [
            conhecimento,
            decifrar,
            identificarMagia,
            aprenderMagia,
            { nome: "Emprestar Magia Arcana", acao: "borrow-an-arcane-spell", custo: "exploracao", treinado: true, texto: "Prepare uma magia do grimório de outro conjurador arcano." },
        ],
    },
    athletics: {
        resumo: "Força física aplicada: escalar, nadar, saltar e as manobras de combate corpo a corpo.",
        dicas: [
            "Derrubar deixa o alvo caído (–2 na CA e precisa gastar ação para levantar).",
            "Agarrar deixa o alvo desprevenido e impede que ele se afaste.",
            "Empurrar e Reposicionar jogam inimigos em terreno perigoso ou para longe de aliados.",
            "Manobras têm o traço ataque e sofrem penalidade de ataques múltiplos.",
        ],
        acoes: [
            { nome: "Escalar", acao: "climb", custo: 1, texto: "Suba ou desça paredes, cordas e encostas." },
            { nome: "Forçar Abertura", acao: "force-open", custo: 1, texto: "Arrombe portas, janelas, baús ou correntes usando força bruta." },
            { nome: "Agarrar", acao: "grapple", custo: 1, texto: "Segure um inimigo, deixando-o agarrado ou imobilizado." },
            { nome: "Salto em Altura", acao: "high-jump", custo: 2, texto: "Dê um Passo Largo e salte para cima." },
            { nome: "Salto em Distância", acao: "long-jump", custo: 2, texto: "Dê um Passo Largo e salte por cima de buracos e obstáculos." },
            { nome: "Reposicionar", acao: "reposition", custo: 1, texto: "Mova um inimigo agarrado ou adjacente para outra posição." },
            { nome: "Empurrar", acao: "shove", custo: 1, texto: "Empurre um inimigo para longe de você." },
            { nome: "Nadar", acao: "swim", custo: 1, texto: "Mova-se pela água, enfrentando correntes." },
            { nome: "Derrubar", acao: "trip", custo: 1, texto: "Derrube o inimigo, deixando-o caído." },
            { nome: "Desarmar", acao: "disarm", custo: 1, treinado: true, texto: "Arranque a arma ou item da mão de um inimigo." },
            { nome: "Escapar", acao: "escape", custo: 1, texto: "Liberte-se de um agarrão usando Atletismo." },
        ],
    },
    crafting: {
        resumo: "Fabricar, consertar e entender itens, alquimia e mecanismos.",
        dicas: [
            "Reparar escudos entre combates é uma das melhores formas de mantê-los inteiros.",
            "Recordar Conhecimento com Manufatura funciona contra constructos.",
        ],
        acoes: [
            conhecimento,
            { nome: "Reparar", acao: "repair", custo: "exploracao", texto: "Restaure Pontos de Vida de um item danificado (10 minutos)." },
            { nome: "Fabricar", acao: "craft", custo: "tempo livre", treinado: true, texto: "Crie itens a partir de fórmulas e matéria-prima." },
            { nome: "Identificar Alquimia", acao: "identify-alchemy", custo: "exploracao", treinado: true, texto: "Descubra o que um item alquímico faz (10 minutos)." },
        ],
    },
    deception: {
        resumo: "Enganar, mentir e disfarçar-se.",
        dicas: [
            "Fintar deixa o alvo desprevenido contra seu próximo ataque corpo a corpo — ótimo para ladinos.",
            "Criar uma Distração permite Esconder-se logo em seguida.",
        ],
        acoes: [
            { nome: "Criar uma Distração", acao: "create-a-diversion", custo: 1, texto: "Use um gesto, truque ou fala para que criaturas não percebam você por um momento." },
            { nome: "Personificar", acao: "impersonate", custo: "exploracao", texto: "Disfarce-se como outra pessoa ou tipo de pessoa." },
            { nome: "Mentir", acao: "lie", custo: "exploracao", texto: "Convença alguém de uma mentira." },
            { nome: "Fintar", acao: "feint", custo: 1, treinado: true, texto: "Engane um inimigo adjacente para deixá-lo desprevenido contra você." },
        ],
    },
    diplomacy: {
        resumo: "Negociar, persuadir e obter informações de forma amigável.",
        dicas: [
            "Use Causar Impressão antes de Pedir algo para melhorar a atitude da criatura.",
            "Coletar Informações é a forma mais rápida de descobrir boatos numa cidade.",
        ],
        acoes: [
            { nome: "Coletar Informações", acao: "gather-information", custo: "exploracao", texto: "Circule pela região conversando para descobrir rumores e fatos." },
            { nome: "Causar Impressão", acao: "make-an-impression", custo: "exploracao", texto: "Melhore a atitude de alguém em relação a você." },
            { nome: "Pedir", acao: "request", custo: 1, texto: "Peça um favor a uma criatura amistosa ou prestativa." },
        ],
    },
    intimidation: {
        resumo: "Ameaçar e amedrontar.",
        dicas: [
            "Desmoralizar deixa o alvo amedrontado, penalizando todos os testes e CDs dele.",
            "Cada alvo fica imune ao seu Desmoralizar por 10 minutos após a tentativa.",
        ],
        acoes: [
            { nome: "Desmoralizar", acao: "demoralize", custo: 1, texto: "Assuste um inimigo a até 9 m, deixando-o amedrontado 1 (ou 2 no sucesso crítico)." },
            { nome: "Coagir", acao: "coerce", custo: "exploracao", texto: "Use ameaças para fazer alguém obedecer você por um tempo." },
        ],
    },
    medicine: {
        resumo: "Curar ferimentos, venenos e doenças.",
        dicas: [
            "Tratar Ferimentos entre combates é a principal cura fora de magia (10 minutos).",
            "Prestar Primeiros Socorros estabiliza um aliado morrendo ou para sangramento.",
        ],
        acoes: [
            { nome: "Prestar Primeiros Socorros", acao: "administer-first-aid", custo: 2, texto: "Estabilize um aliado morrendo ou interrompa dano persistente de sangramento." },
            { nome: "Tratar Ferimentos", acao: "treat-wounds", custo: "exploracao", treinado: true, texto: "Cure PV de uma criatura viva (10 minutos)." },
            { nome: "Tratar Doença", acao: "treat-disease", custo: "tempo livre", treinado: true, texto: "Ajude alguém a resistir a uma doença." },
            { nome: "Tratar Veneno", acao: "treat-poison", custo: 1, treinado: true, texto: "Ajude alguém envenenado no próximo teste de resistência." },
        ],
    },
    nature: {
        resumo: "Conhecimento sobre animais, plantas, clima e magia primal.",
        dicas: [
            "Recordar Conhecimento contra animais, fadas, plantas e elementais.",
            "Comandar um Animal é necessário para controlar montarias que não são companheiros.",
        ],
        acoes: [
            conhecimento,
            { nome: "Comandar um Animal", acao: "command-an-animal", custo: 1, texto: "Dê uma ordem a um animal que não seja seu companheiro." },
            identificarMagia,
            aprenderMagia,
        ],
    },
    occultism: {
        resumo: "Mistérios, filosofias esotéricas, aberrações e magia ocultista.",
        dicas: ["Recordar Conhecimento contra aberrações, espíritos e criaturas oníricas."],
        acoes: [conhecimento, decifrar, identificarMagia, aprenderMagia],
    },
    performance: {
        resumo: "Atuar, cantar, dançar e tocar instrumentos.",
        dicas: ["Bardos usam Performance em muitas composições.", "Atuar durante o tempo livre rende dinheiro."],
        acoes: [
            { nome: "Atuar", acao: "perform", custo: 1, texto: "Faça uma apresentação para impressionar o público." },
            { nome: "Ganhar a Vida", acao: "earn-income", custo: "tempo livre", treinado: true, texto: "Ganhe dinheiro se apresentando." },
        ],
    },
    religion: {
        resumo: "Divindades, dogmas, mortos-vivos, celestiais e corruptores.",
        dicas: ["Recordar Conhecimento contra mortos-vivos, celestiais e corruptores."],
        acoes: [conhecimento, decifrar, identificarMagia, aprenderMagia],
    },
    society: {
        resumo: "Culturas, leis, nobreza, história e idiomas.",
        dicas: ["Recordar Conhecimento contra humanoides.", "Útil para entender etiqueta e política."],
        acoes: [
            conhecimento,
            subsistir,
            { nome: "Criar Falsificação", acao: "create-forgery", custo: "tempo livre", treinado: true, texto: "Forje um documento convincente." },
            decifrar,
        ],
    },
    stealth: {
        resumo: "Esconder-se, mover-se em silêncio e ocultar objetos.",
        dicas: [
            "Para atacar sem ser visto: Esconder-se (com cobertura ou camuflagem) e depois Furtividade.",
            "Evitar Ser Notado na exploração permite rolar Furtividade como iniciativa.",
        ],
        acoes: [
            { nome: "Esconder-se", acao: "hide", custo: 1, texto: "Fique oculto enquanto tiver cobertura ou camuflagem." },
            { nome: "Mover-se Furtivamente", acao: "sneak", custo: 1, texto: "Mova-se até metade do deslocamento sem ser percebido." },
            { nome: "Ocultar um Objeto", acao: "conceal-an-object", custo: 1, texto: "Esconda um objeto pequeno no corpo." },
            { nome: "Evitar Ser Notado", acao: "avoid-notice", custo: "exploracao", texto: "Viaje discretamente; você rola Furtividade como iniciativa." },
        ],
    },
    survival: {
        resumo: "Sobreviver na natureza, rastrear e se orientar.",
        dicas: ["Rastrear é essencial para perseguir inimigos em fuga.", "Subsistir economiza rações em viagens longas."],
        acoes: [
            { nome: "Sentir Direção", acao: "sense-direction", custo: "exploracao", texto: "Descubra onde fica o norte e evite se perder." },
            subsistir,
            { nome: "Cobrir Rastros", acao: "cover-tracks", custo: "exploracao", treinado: true, texto: "Esconda os rastros do grupo." },
            { nome: "Rastrear", acao: "track", custo: "exploracao", treinado: true, texto: "Siga as pegadas e sinais de uma criatura." },
        ],
    },
    thievery: {
        resumo: "Furtar, abrir fechaduras e desarmar armadilhas.",
        dicas: [
            "Abrir Fechadura e Desativar Dispositivo costumam exigir ferramentas de ladrão.",
            "Desativar armadilhas antes de entrar em combate evita grandes perigos.",
        ],
        acoes: [
            { nome: "Empalmar Objeto", acao: "palm-an-object", custo: 1, texto: "Pegue um objeto pequeno sem que ninguém perceba." },
            { nome: "Roubar", acao: "steal", custo: 1, texto: "Tire algo de uma criatura sem que ela note." },
            { nome: "Desativar Dispositivo", acao: "disable-device", custo: 2, treinado: true, texto: "Desarme armadilhas ou mecanismos complexos." },
            { nome: "Abrir Fechadura", acao: "pick-a-lock", custo: 2, treinado: true, texto: "Abra uma fechadura sem a chave." },
        ],
    },
};

/** Usos válidos para qualquer perícia de Conhecimento (Lore). */
export const CONHECIMENTO_LORE = {
    resumo: "Conhecimento especializado em um tema específico (uma cidade, uma profissão, uma criatura...).",
    dicas: [
        "Recordar Conhecimento com um Conhecimento específico costuma ter CD menor que a perícia geral.",
        "Ganhar a Vida com Conhecimento da sua profissão é uma boa fonte de renda no tempo livre.",
    ],
    acoes: [
        conhecimento,
        { nome: "Ganhar a Vida", acao: "earn-income", custo: "tempo livre", treinado: true, texto: "Trabalhe na sua área durante o tempo livre para ganhar dinheiro." },
    ],
};

/** Ações que qualquer perícia pode usar. */
export const ACOES_GERAIS = [
    { nome: "Ajudar", custo: "reacao", texto: "Prepare-se para ajudar um aliado num teste dessa perícia (bônus de circunstância)." },
];

export const PROFICIENCIA = ["Destreinado", "Treinado", "Especialista", "Mestre", "Lendário"];

export const CUSTO = {
    1: "◆",
    2: "◆◆",
    3: "◆◆◆",
    reacao: "⟲ Reação",
    livre: "◇ Livre",
    exploracao: "Exploração",
    "tempo livre": "Tempo livre",
};
