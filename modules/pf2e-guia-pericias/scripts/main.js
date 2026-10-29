import { ACOES_GERAIS, CONHECIMENTO_LORE, CUSTO, PERICIAS, PROFICIENCIA } from "./dados.js";

const MODULE_ID = "pf2e-guia-pericias";
const COMANDO = /^\/(pericias|perícias|skills)(?:\s+(.*))?$/i;

const { ApplicationV2 } = foundry.applications.api;

class GuiaPericias extends ApplicationV2 {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-janela`,
        classes: [MODULE_ID],
        window: { title: "Guia de Perícias", icon: "fa-solid fa-book-open", resizable: true },
        position: { width: 620, height: 720 },
        actions: {
            rolar: GuiaPericias.#rolar,
            usarAcao: GuiaPericias.#usarAcao,
            alternar: GuiaPericias.#alternar,
        },
    };

    /** @param {{ actor: Actor, filtro?: string }} options */
    constructor(options) {
        super(options);
        this.actor = options.actor;
        this.filtro = options.filtro ?? "";
        this.mostrarDestreinadas = false;
    }

    get title() {
        return `Guia de Perícias — ${this.actor.name}`;
    }

    async _renderHTML() {
        const raiz = document.createElement("div");
        raiz.className = "guia-conteudo";

        const busca = document.createElement("div");
        busca.className = "guia-barra";
        busca.innerHTML = `
            <input type="search" placeholder="Filtrar perícia ou ação..." value="${escapeHTML(this.filtro)}">
            <label><input type="checkbox" data-action="alternar" ${this.mostrarDestreinadas ? "checked" : ""}>
                Mostrar perícias destreinadas</label>`;
        busca.querySelector("input[type=search]").addEventListener("input", (event) => {
            this.filtro = event.currentTarget.value;
            this.#aplicarFiltro(raiz);
        });
        raiz.append(busca);

        const pericias = Object.values(this.actor.skills ?? {}).sort((a, b) => {
            if (!!a.lore !== !!b.lore) return a.lore ? 1 : -1;
            return (b.rank ?? 0) - (a.rank ?? 0) || a.label.localeCompare(b.label);
        });

        for (const pericia of pericias) {
            const rank = pericia.rank ?? 0;
            if (rank === 0 && !this.mostrarDestreinadas) continue;
            raiz.append(this.#cartao(pericia, rank));
        }

        if (raiz.children.length === 1) {
            const vazio = document.createElement("p");
            vazio.className = "guia-vazio";
            vazio.textContent = "Nenhuma perícia treinada encontrada. Marque a opção acima para ver todas.";
            raiz.append(vazio);
        }

        this.#aplicarFiltro(raiz);
        return raiz;
    }

    _replaceHTML(result, content) {
        content.replaceChildren(result);
    }

    #cartao(pericia, rank) {
        const info = pericia.lore ? CONHECIMENTO_LORE : (PERICIAS[pericia.slug] ?? genericas());
        const mod = pericia.mod >= 0 ? `+${pericia.mod}` : `${pericia.mod}`;

        const cartao = document.createElement("section");
        cartao.className = "guia-pericia";
        cartao.dataset.busca = [pericia.label, ...info.acoes.map((a) => a.nome)].join(" ").toLowerCase();

        const acoes = [...info.acoes, ...ACOES_GERAIS]
            .map((acao) => {
                const bloqueada = acao.treinado && rank < 1;
                const disponivel = acao.acao && game.pf2e?.actions?.has?.(acao.acao);
                const botao = bloqueada
                    ? ""
                    : `<button type="button" data-action="${disponivel ? "usarAcao" : "rolar"}"
                        data-pericia="${pericia.slug}" data-acao="${acao.acao ?? ""}"
                        title="${disponivel ? "Usar esta ação" : "Rolar a perícia"}">
                        <i class="fa-solid fa-dice-d20"></i></button>`;
                return `
                    <li class="${bloqueada ? "bloqueada" : ""}">
                        <div class="acao-topo">
                            <strong>${acao.nome}</strong>
                            <span class="custo">${CUSTO[acao.custo] ?? ""}</span>
                            ${acao.treinado ? `<span class="tag">Treinado</span>` : ""}
                            ${botao}
                        </div>
                        <p>${acao.texto}</p>
                        ${bloqueada ? `<p class="aviso">Você precisa ser treinado nesta perícia para usar esta ação.</p>` : ""}
                    </li>`;
            })
            .join("");

        cartao.innerHTML = `
            <header>
                <h2>${escapeHTML(pericia.label)}</h2>
                <span class="rank rank-${rank}">${PROFICIENCIA[rank]}</span>
                <button type="button" class="mod" data-action="rolar" data-pericia="${pericia.slug}"
                    title="Rolar ${escapeHTML(pericia.label)}">${mod}</button>
            </header>
            <p class="resumo">${info.resumo}</p>
            ${info.dicas.length ? `<details><summary>Dicas de uso</summary><ul class="dicas">${info.dicas.map((d) => `<li>${d}</li>`).join("")}</ul></details>` : ""}
            <ul class="acoes">${acoes}</ul>`;
        return cartao;
    }

    #aplicarFiltro(raiz) {
        const termo = this.filtro.trim().toLowerCase();
        for (const cartao of raiz.querySelectorAll(".guia-pericia")) {
            cartao.hidden = !!termo && !cartao.dataset.busca.includes(termo);
        }
    }

    static async #rolar(event, alvo) {
        const pericia = this.actor.skills?.[alvo.dataset.pericia];
        await pericia?.roll({ event });
    }

    static async #usarAcao(event, alvo) {
        const acao = game.pf2e.actions.get(alvo.dataset.acao);
        try {
            await acao.use({ event, actors: [this.actor], statistic: alvo.dataset.pericia });
        } catch (erro) {
            // Algumas ações não aceitam a perícia escolhida; rola a perícia diretamente
            console.warn(`${MODULE_ID} |`, erro);
            await GuiaPericias.#rolar.call(this, event, alvo);
        }
    }

    static #alternar(_event, alvo) {
        this.mostrarDestreinadas = alvo.checked;
        this.render();
    }
}

function genericas() {
    return {
        resumo: "Perícia sem guia específico. Role-a sempre que o Mestre pedir um teste relacionado.",
        dicas: [],
        acoes: [],
    };
}

function escapeHTML(texto) {
    return foundry.utils.escapeHTML?.(String(texto)) ?? String(texto);
}

function encontrarAtor(nome) {
    if (nome) {
        const ator = game.actors.find((a) => a.name.toLowerCase() === nome.toLowerCase());
        if (ator?.testUserPermission(game.user, "OBSERVER")) return ator;
    }
    return canvas.tokens?.controlled[0]?.actor ?? game.user.character ?? null;
}

export function abrirGuia(nome) {
    const actor = encontrarAtor(nome);
    if (!actor?.skills) {
        ui.notifications.warn("Selecione um token ou defina um personagem para o seu usuário antes de usar /pericias.");
        return null;
    }
    const existente = foundry.applications.instances.get(`${MODULE_ID}-janela`);
    if (existente) {
        existente.actor = actor;
        return existente.render({ force: true });
    }
    return new GuiaPericias({ actor }).render({ force: true });
}

Hooks.on("chatMessage", (_chatLog, mensagem) => {
    const match = COMANDO.exec(mensagem.trim());
    if (!match) return true;
    abrirGuia(match[2]?.trim());
    return false;
});

Hooks.once("ready", () => {
    game.modules.get(MODULE_ID).api = { abrirGuia };
});
