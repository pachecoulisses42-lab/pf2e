/* ============================================================================
   4b. PEÇAS DOS TOKENS EXTRAS — classes novas e variações de vilões
   Cada peça usa o token pintado visto de cima (ct_/vt_); o retrato (cr_/vr_)
   fica na Galeria de tokens. PV e CA saem da ficha (recalculados abaixo).
   Classes que já existiam (Bárbaro, Bardo, Mago…) não ganham peça repetida:
   o token pintado delas pode ser aplicado às peças existentes.
   ============================================================================ */
(() => {
  /** Monta a peça a partir do essencial; o resto vem de padrões coerentes com a ficha. */
  const piece = ({ id, name, sculpt, faction = 'hero', moveSpeed = 9, sheet, weapons, spells = [], items = [], resistances, weaknesses, immunities }) => {
    const t = {
      id, name, sculpt, faction, moveSpeed, maxHp: 1, ac: 10,
      ...(/^t_lobo_/.test(id) ? { category: 'animal' } : {}),
      sheet: { level: 3, shieldBonus: 0, dexCap: 5, armorItemBonus: 0, skills: [], feats: [], ...sheet },
      weapons, spells, items
    };
    if (resistances) t.resistances = resistances;
    if (weaknesses) t.weaknesses = weaknesses;
    if (immunities) t.immunities = immunities;
    const probe = JSON.parse(JSON.stringify(t));
    recalculateUnitFromSheet(probe, true);
    t.maxHp = probe.maxHp;
    t.ac = probe.ac;
    return t;
  };
  const attrs = (FOR, DES, CON, INT, SAB, CAR) => ({ FOR, DES, CON, INT, SAB, CAR });
  const prof = (armor, weapon, spell, perception, fort, ref, will) => ({ armor, weapon, spell, perception, fort, ref, will });
  const S = (key) => ({ ...SPELL_CATALOG[key] });
  const I = (key, qty) => ({ ...ITEM_CATALOG[key], ...(qty ? { qty } : {}) });

  UNIT_TEMPLATES.push(
    /* ------------------------------ CLASSES ------------------------------ */
    piece({
      id: 't_explorador', name: 'Explorador', sculpt: 'ct_explorador',
      sheet: { ancestry: 'Meio-elfo', background: 'Batedor de Fronteira', className: 'Patrulheiro (Companheiro Animal)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3, attrs: attrs(1, 4, 2, 0, 2, 0), prof: prof(2, 4, 0, 4, 4, 4, 2),
        skills: ['Sobrevivência (E)', 'Natureza (T)', 'Furtividade (T)'], feats: ['Caçar Presa (◆)', 'Companheiro Animal (Falcão)', 'Rastreador'] },
      weapons: [
        { name: 'Arco Curto', dmgDie: '1d6', reach: 18, dmgType: 'perfurante' },
        { name: 'Machadinha', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' },
        { name: 'Garras do Falcão', dmgDie: '1d4', reach: 1.5, dmgType: 'cortante', manual: true, atkBonus: 8, dmgBonus: 0 }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_arqueiro', name: 'Arqueiro', sculpt: 'ct_arqueiro',
      sheet: { ancestry: 'Elfo', background: 'Caçador', className: 'Guerreiro (Arqueiro)', keyAttr: 'DES',
        ancestryHp: 6, classHp: 10, armorItemBonus: 2, dexCap: 3, attrs: attrs(1, 4, 2, 0, 2, 0), prof: prof(2, 4, 0, 4, 4, 4, 2),
        skills: ['Acrobacia (T)', 'Sobrevivência (T)'], feats: ['Tiro Duplo (◆◆)', 'Ponto Cego', 'Disparo Preciso'] },
      weapons: [
        { name: 'Arco Longo Élfico', dmgDie: '1d8', reach: 30, dmgType: 'perfurante' },
        { name: 'Espada Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_cavaleiro', name: 'Cavaleiro', sculpt: 'ct_cavaleiro',
      sheet: { ancestry: 'Humano', background: 'Escudeiro', className: 'Guerreiro (Cavaleiro)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 6, dexCap: 0, shieldBonus: 2, attrs: attrs(4, 0, 3, 0, 1, 1), prof: prof(4, 4, 0, 2, 4, 2, 2),
        skills: ['Atletismo (E)', 'Diplomacia (T)', 'Sociedade (T)'], feats: ['Bloqueio com Escudo', 'Investida Montada', 'Golpe Poderoso'] },
      weapons: [
        { name: 'Espada Longa', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' },
        { name: 'Lança de Cavalaria', dmgDie: '1d8', reach: 3, dmgType: 'perfurante' }
      ],
      items: [I('pocao_moderada', 1)]
    }),
    piece({
      id: 't_cavaleiro_liberdade', name: 'Cavaleiro da Liberdade', sculpt: 'ct_cavaleiro_liberdade',
      sheet: { ancestry: 'Humano', background: 'Libertador', className: 'Campeão (Libertador)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 5, dexCap: 1, shieldBonus: 0, attrs: attrs(4, 1, 2, 0, 1, 2), prof: prof(4, 2, 2, 2, 4, 2, 4),
        skills: ['Religião (T)', 'Atletismo (T)', 'Diplomacia (T)'], feats: ['Libertar (Reação)', 'Imposição de Mãos', 'Aura da Coragem'] },
      weapons: [
        { name: 'Espada Bastarda', dmgDie: '1d12', reach: 1.5, dmgType: 'cortante', extra: [{ ...RUNE_PRESETS.sagrada }] },
        { name: 'Adaga de Cinto', dmgDie: '1d4', reach: 3, dmgType: 'perfurante' }
      ],
      spells: [S('lanca_divina')],
      items: [I('pocao_menor', 1), I('perg_cura', 1)]
    }),
    piece({
      id: 't_ninja', name: 'Ninja', sculpt: 'ct_ninja',
      sheet: { ancestry: 'Humano (Tian)', background: 'Clã das Sombras', className: 'Ladino (Ninja)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 4, 1, 1, 2, 0), prof: prof(2, 2, 0, 4, 2, 4, 4),
        skills: ['Furtividade (E)', 'Acrobacia (E)', 'Enganação (T)'], feats: ['Ataque Furtivo (+1d6)', 'Desaparecer na Fumaça', 'Passo Esquivo'] },
      weapons: [
        { name: 'Wakizashi', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante', extra: [{ ...RUNE_PRESETS.furtivo }] },
        { name: 'Shuriken', dmgDie: '1d4', reach: 6, dmgType: 'perfurante' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_pistoleiro', name: 'Pistoleiro', sculpt: 'ct_pistoleiro',
      sheet: { ancestry: 'Humano', background: 'Caçador de Recompensas', className: 'Pistoleiro (Duelista)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 3, attrs: attrs(1, 4, 2, 0, 2, 1), prof: prof(2, 4, 0, 4, 4, 4, 2),
        skills: ['Acrobacia (T)', 'Intimidação (T)', 'Manufatura (T)'], feats: ['Saque Rápido', 'Tiro de Dois Canos', 'Recarga Ágil'] },
      weapons: [
        { name: 'Pistola de Pederneira', dmgDie: '1d6', reach: 12, dmgType: 'perfurante' },
        { name: 'Pistola Gêmea', dmgDie: '1d6', reach: 12, dmgType: 'perfurante' },
        { name: 'Coronhada', dmgDie: '1d4', reach: 1.5, dmgType: 'contundente' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_ranger_batalha', name: 'Ranger de Batalha', sculpt: 'ct_ranger_batalha',
      sheet: { ancestry: 'Humano', background: 'Veterano de Guerra', className: 'Patrulheiro (Lâmina Dupla)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 10, armorItemBonus: 3, dexCap: 2, attrs: attrs(2, 4, 2, 0, 2, -1), prof: prof(2, 4, 0, 4, 4, 4, 2),
        skills: ['Sobrevivência (E)', 'Atletismo (T)', 'Natureza (T)'], feats: ['Caçar Presa (◆)', 'Golpe Gêmeo (◆)', 'Precisão do Caçador'] },
      weapons: [
        { name: 'Espada Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' },
        { name: 'Arco Curto', dmgDie: '1d6', reach: 18, dmgType: 'perfurante' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_invocador', name: 'Invocador', sculpt: 'ct_invocador',
      sheet: { ancestry: 'Humano', background: 'Vinculado', className: 'Invocador (Eidolon Dracônico)', keyAttr: 'CAR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 1, dexCap: 3, attrs: attrs(0, 2, 2, 1, 1, 4), prof: prof(2, 2, 2, 2, 4, 2, 4),
        skills: ['Arcanismo (E)', 'Natureza (T)', 'Intimidação (T)'], feats: ['Eidolon Vinculado', 'Agir Juntos (◆)', 'Vínculo Compartilhado'] },
      weapons: [{ name: 'Cajado do Vínculo', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      spells: [S('investida_eidolon'), S('raio_arcano')],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_kitsune', name: 'Kitsune', sculpt: 'ct_kitsune',
      sheet: { ancestry: 'Kitsune', background: 'Sacerdotisa do Santuário', className: 'Feiticeira (Linhagem Feérica)', keyAttr: 'CAR',
        ancestryHp: 8, classHp: 6, armorItemBonus: 0, dexCap: 5, attrs: attrs(0, 3, 1, 1, 1, 4), prof: prof(2, 2, 2, 2, 2, 2, 4),
        skills: ['Enganação (E)', 'Ocultismo (T)', 'Diplomacia (T)'], feats: ['Fogo de Raposa', 'Mudança de Forma', 'Truque Encantador'] },
      weapons: [{ name: 'Tantō', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }],
      spells: [S('fogo_de_raposa'), S('chama_cristalina')],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_kappa', name: 'Kappa', sculpt: 'ct_kappa',
      sheet: { ancestry: 'Kappa', background: 'Guardião do Rio', className: 'Monge (Correnteza)', keyAttr: 'SAB',
        ancestryHp: 8, classHp: 10, armorItemBonus: 0, dexCap: 5, attrs: attrs(3, 3, 3, 0, 3, 0), prof: prof(2, 4, 2, 4, 4, 4, 4),
        skills: ['Atletismo (E)', 'Natureza (T)', 'Acrobacia (T)'], feats: ['Fluxo de Golpes (◆◆)', 'Nado Veloz', 'Postura da Correnteza'] },
      weapons: [
        { name: 'Bastão Kappa', dmgDie: '1d8', reach: 3, dmgType: 'contundente' },
        { name: 'Punhos', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }
      ],
      spells: [S('jato_de_agua')],
      items: [I('pocao_menor', 2)],
      resistances: [{ type: 'fogo', value: 3 }]
    }),
    piece({
      id: 't_tengu', name: 'Tengu', sculpt: 'ct_tengu',
      sheet: { ancestry: 'Tengu', background: 'Andarilho da Montanha', className: 'Espadachim (Lâmina Ventosa)', keyAttr: 'DES',
        ancestryHp: 6, classHp: 10, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 4, 2, 0, 1, 2), prof: prof(2, 4, 0, 2, 2, 4, 2),
        skills: ['Acrobacia (E)', 'Atletismo (T)', 'Intimidação (T)'], feats: ['Bico Afiado', 'Ousadia (◆)', 'Planar'] },
      weapons: [
        { name: 'Katana Tengu', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' },
        { name: 'Bico', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }
      ],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_ryu', name: 'Ryu', sculpt: 'ct_ryu',
      sheet: { ancestry: 'Sangue de Dragão', background: 'Herdeiro do Dragão', className: 'Guerreiro (Samurai Dracônico)', keyAttr: 'FOR',
        ancestryHp: 10, classHp: 10, armorItemBonus: 4, dexCap: 1, attrs: attrs(4, 1, 3, 0, 1, 1), prof: prof(2, 4, 0, 4, 4, 2, 2),
        skills: ['Atletismo (E)', 'Intimidação (T)'], feats: ['Golpe Duplo', 'Sopro Dracônico', 'Escamas'] },
      weapons: [
        { name: 'Katana Dupla', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante', extra: [{ ...RUNE_PRESETS.flamejante }] },
        { name: 'Wakizashi', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }
      ],
      spells: [S('sopro_draconico')],
      items: [I('pocao_menor', 1)],
      resistances: [{ type: 'fogo', value: 3 }]
    }),
    piece({
      id: 't_samurai', name: 'Samurai', sculpt: 'ct_samurai',
      sheet: { ancestry: 'Humano (Tian)', background: 'Vassalo', className: 'Guerreiro (Samurai)', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 5, dexCap: 1, attrs: attrs(4, 1, 2, 0, 2, 0), prof: prof(4, 4, 0, 4, 4, 2, 2),
        skills: ['Atletismo (E)', 'Sociedade (T)'], feats: ['Golpe Preciso', 'Postura do Guerreiro', 'Ataque de Oportunidade'] },
      weapons: [
        { name: 'Katana', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' },
        { name: 'Daikyu', dmgDie: '1d8', reach: 24, dmgType: 'perfurante' }
      ],
      items: [I('pocao_moderada', 1)]
    }),

    /* ------------------------------ GOBLINS ------------------------------ */
    piece({
      id: 't_goblin_comum', name: 'Goblin Comum', sculpt: 'vt_goblin_comum', faction: 'villain',
      sheet: { level: 1, ancestry: 'Goblin', background: 'Saqueador', className: 'Guerreiro Goblin', keyAttr: 'DES',
        ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 3, 1, 0, 0, 1), prof: prof(2, 2, 0, 2, 2, 4, 2),
        skills: ['Furtividade (T)', 'Acrobacia (T)'], feats: ['Deslocamento Goblin'] },
      weapons: [{ name: 'Cimitarra Goblin', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }, { name: 'Escudo de Tábuas', dmgDie: '1d4', reach: 1.5, dmgType: 'contundente' }]
    }),
    piece({
      id: 't_goblin_atirador', name: 'Goblin Atirador', sculpt: 'vt_goblin_atirador', faction: 'villain',
      sheet: { level: 1, ancestry: 'Goblin', background: 'Franco-atirador', className: 'Atirador Goblin', keyAttr: 'DES',
        ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(0, 4, 1, 0, 1, 0), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Furtividade (E)'], feats: ['Tiro Furtivo'] },
      weapons: [{ name: 'Besta Leve', dmgDie: '1d8', reach: 18, dmgType: 'perfurante' }, { name: 'Faca', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_goblin_lancador', name: 'Goblin Lançador', sculpt: 'vt_goblin_lancador', faction: 'villain',
      sheet: { level: 1, ancestry: 'Goblin', background: 'Caçador da Tribo', className: 'Lanceiro Goblin', keyAttr: 'DES',
        ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(2, 3, 1, 0, 0, 0), prof: prof(2, 2, 0, 2, 2, 4, 2),
        skills: ['Atletismo (T)'], feats: ['Arremesso Rápido'] },
      weapons: [{ name: 'Azagaia', dmgDie: '1d6', reach: 9, dmgType: 'perfurante' }, { name: 'Lança Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_goblin_xama', name: 'Goblin Xamã', sculpt: 'vt_goblin_xama', faction: 'villain',
      sheet: { level: 2, ancestry: 'Goblin', background: 'Vidente da Tribo', className: 'Xamã Goblin (Bruxo)', keyAttr: 'SAB',
        ancestryHp: 6, classHp: 6, armorItemBonus: 0, dexCap: 5, attrs: attrs(0, 2, 1, 1, 4, 1), prof: prof(2, 2, 2, 2, 2, 2, 4),
        skills: ['Ocultismo (T)', 'Natureza (T)'], feats: ['Patrono Sombrio', 'Fetiche de Ossos'] },
      weapons: [{ name: 'Cajado de Ossos', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      spells: [S('fogueira_goblin'), S('maldicao_sombria')],
      items: [I('pocao_menor', 1)]
    }),
    piece({
      id: 't_goblin_chefe', name: 'Goblin Chefe', sculpt: 'vt_goblin_chefe', faction: 'villain',
      sheet: { level: 3, ancestry: 'Goblin', background: 'Chefe de Guerra', className: 'Chefe Goblin', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 10, armorItemBonus: 3, dexCap: 2, attrs: attrs(3, 3, 2, 0, 1, 2), prof: prof(2, 4, 0, 2, 4, 2, 2),
        skills: ['Intimidação (E)', 'Atletismo (T)'], feats: ['Grito de Guerra', 'Golpe Brutal'] },
      weapons: [{ name: 'Machado do Chefe', dmgDie: '1d8', reach: 1.5, dmgType: 'cortante' }, { name: 'Cajado de Caveiras', dmgDie: '1d6', reach: 1.5, dmgType: 'contundente' }],
      items: [I('pocao_menor', 2)]
    }),
    piece({
      id: 't_goblin_arqueiro', name: 'Goblin Arqueiro', sculpt: 'vt_goblin_arqueiro', faction: 'villain',
      sheet: { level: 1, ancestry: 'Goblin', background: 'Batedor', className: 'Arqueiro Goblin', keyAttr: 'DES',
        ancestryHp: 6, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(0, 4, 1, 0, 1, 0), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Furtividade (T)', 'Sobrevivência (T)'], feats: ['Disparo Rápido'] },
      weapons: [{ name: 'Arco Curto Goblin', dmgDie: '1d6', reach: 18, dmgType: 'perfurante' }, { name: 'Faca', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_goblin_escudo', name: 'Goblin com Escudo', sculpt: 'vt_goblin_escudo', faction: 'villain',
      sheet: { level: 2, ancestry: 'Goblin', background: 'Muralha da Tribo', className: 'Defensor Goblin', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 10, armorItemBonus: 3, dexCap: 2, shieldBonus: 2, attrs: attrs(2, 2, 2, 0, 0, 0), prof: prof(2, 2, 0, 2, 4, 2, 2),
        skills: ['Atletismo (T)'], feats: ['Bloqueio com Escudo'] },
      weapons: [{ name: 'Lança Curta', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }, { name: 'Pancada de Escudo', dmgDie: '1d4', reach: 1.5, dmgType: 'contundente' }]
    }),

    /* ------------------------------ LOBOS ------------------------------ */
    piece({
      id: 't_lobo_comum', name: 'Lobo Comum', sculpt: 'vt_lobo_comum', faction: 'villain', moveSpeed: 12,
      sheet: { level: 1, ancestry: 'Fera', background: 'Alcateia', className: 'Lobo', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 8, armorItemBonus: 2, dexCap: 4, attrs: attrs(2, 3, 2, -4, 1, -2), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Sobrevivência (T)'], feats: ['Derrubar', 'Faro Aguçado'] },
      weapons: [{ name: 'Mandíbulas', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_lobo_alfa', name: 'Lobo Alfa', sculpt: 'vt_lobo_alfa', faction: 'villain', moveSpeed: 12,
      sheet: { level: 3, ancestry: 'Fera', background: 'Líder da Alcateia', className: 'Lobo Alfa', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 2, dexCap: 3, attrs: attrs(4, 3, 3, -4, 2, 0), prof: prof(2, 4, 0, 4, 4, 4, 2),
        skills: ['Atletismo (E)', 'Sobrevivência (E)'], feats: ['Uivo do Alfa', 'Derrubar da Alcateia'] },
      weapons: [{ name: 'Mandíbulas do Alfa', dmgDie: '1d8', reach: 1.5, dmgType: 'perfurante' }, { name: 'Garras', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante' }]
    }),
    piece({
      id: 't_lobo_feroz', name: 'Lobo Feroz', sculpt: 'vt_lobo_feroz', faction: 'villain', moveSpeed: 12,
      sheet: { level: 2, ancestry: 'Fera', background: 'Sedento de Sangue', className: 'Lobo Feroz', keyAttr: 'FOR',
        ancestryHp: 8, classHp: 10, armorItemBonus: 1, dexCap: 4, attrs: attrs(3, 3, 2, -4, 1, -2), prof: prof(2, 2, 0, 4, 4, 4, 2),
        skills: ['Atletismo (T)'], feats: ['Fúria Bestial'] },
      weapons: [{ name: 'Mandíbulas Rasgadoras', dmgDie: '1d8', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_lobo_sombrio', name: 'Lobo Sombrio', sculpt: 'vt_lobo_sombrio', faction: 'villain', moveSpeed: 12,
      sheet: { level: 3, ancestry: 'Fera das Sombras', background: 'Caçador Noturno', className: 'Lobo Sombrio', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 4, attrs: attrs(2, 4, 2, -3, 2, 0), prof: prof(2, 2, 0, 4, 2, 4, 4),
        skills: ['Furtividade (E)'], feats: ['Mesclar-se às Sombras', 'Visão no Escuro'] },
      weapons: [{ name: 'Mordida das Sombras', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante', extra: [{ name: 'Sombra', die: '1d4', bonus: 0, type: 'mental' }] }],
      weaknesses: [{ type: 'espiritual', value: 3 }]
    }),
    piece({
      id: 't_lobo_matilha', name: 'Lobo da Matilha', sculpt: 'vt_lobo_matilha', faction: 'villain', moveSpeed: 12,
      sheet: { level: 1, ancestry: 'Fera', background: 'Matilha', className: 'Lobo de Matilha', keyAttr: 'FOR',
        ancestryHp: 6, classHp: 6, armorItemBonus: 1, dexCap: 4, attrs: attrs(2, 3, 1, -4, 1, -2), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Sobrevivência (T)'], feats: ['Tática de Matilha'] },
      weapons: [{ name: 'Mandíbulas', dmgDie: '1d6', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_lobo_espectral', name: 'Lobo Espectral', sculpt: 'vt_lobo_espectral', faction: 'villain', moveSpeed: 12,
      sheet: { level: 3, ancestry: 'Espírito', background: 'Alma Errante', className: 'Lobo Espectral', keyAttr: 'SAB',
        ancestryHp: 6, classHp: 8, armorItemBonus: 0, dexCap: 5, attrs: attrs(1, 4, 1, -2, 3, 1), prof: prof(2, 2, 2, 4, 2, 4, 4),
        skills: ['Furtividade (E)'], feats: ['Incorpóreo', 'Toque Gélido'] },
      weapons: [{ name: 'Mordida Espectral', dmgDie: '1d6', reach: 1.5, dmgType: 'gélido' }],
      spells: [S('uivo_espectral')],
      resistances: [{ type: 'físico', value: 5 }],
      weaknesses: [{ type: 'vital', value: 5 }],
      immunities: ['veneno']
    }),
    piece({
      id: 't_lobo_guerra', name: 'Lobo de Guerra', sculpt: 'vt_lobo_guerra', faction: 'villain', moveSpeed: 9,
      sheet: { level: 3, ancestry: 'Fera', background: 'Montaria de Guerra', className: 'Lobo de Guerra Blindado', keyAttr: 'FOR',
        ancestryHp: 10, classHp: 10, armorItemBonus: 4, dexCap: 1, attrs: attrs(4, 1, 3, -4, 1, -2), prof: prof(2, 4, 0, 4, 4, 2, 2),
        skills: ['Atletismo (E)'], feats: ['Couraça com Espinhos', 'Investida'] },
      weapons: [{ name: 'Mandíbulas', dmgDie: '1d8', reach: 1.5, dmgType: 'perfurante' }, { name: 'Espinhos da Couraça', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }]
    }),

    /* ------------------------------ LADRÕES ------------------------------ */
    piece({
      id: 't_ladrao_comum', name: 'Ladrão Comum', sculpt: 'vt_ladrao_comum', faction: 'villain',
      sheet: { level: 1, ancestry: 'Humano', background: 'Batedor de Carteiras', className: 'Ladino (Ladrão)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 3, 1, 0, 1, 1), prof: prof(2, 2, 0, 2, 2, 4, 2),
        skills: ['Ladroagem (E)', 'Furtividade (T)'], feats: ['Ataque Furtivo (+1d6)'] },
      weapons: [{ name: 'Adaga', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante', extra: [{ ...RUNE_PRESETS.furtivo }] }, { name: 'Adaga Arremessada', dmgDie: '1d4', reach: 3, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_ladrao_arco', name: 'Ladrão com Arco', sculpt: 'vt_ladrao_arco', faction: 'villain',
      sheet: { level: 2, ancestry: 'Meio-elfo', background: 'Salteador', className: 'Ladino (Atirador)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(0, 4, 1, 0, 2, 0), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Furtividade (E)', 'Sobrevivência (T)'], feats: ['Tiro Furtivo'] },
      weapons: [{ name: 'Arco Curto', dmgDie: '1d6', reach: 18, dmgType: 'perfurante' }, { name: 'Faca', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_ladrao_adaga', name: 'Ladrão com Adaga', sculpt: 'vt_ladrao_adaga', faction: 'villain',
      sheet: { level: 2, ancestry: 'Humano', background: 'Degolador', className: 'Ladino (Lâminas Gêmeas)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(1, 4, 1, 0, 1, 0), prof: prof(2, 2, 0, 2, 2, 4, 2),
        skills: ['Acrobacia (T)', 'Furtividade (T)'], feats: ['Ataque Furtivo (+1d6)', 'Golpe Gêmeo'] },
      weapons: [{ name: 'Adagas Gêmeas', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante', extra: [{ ...RUNE_PRESETS.furtivo }] }]
    }),
    piece({
      id: 't_ladra', name: 'Ladrona', sculpt: 'vt_ladra', faction: 'villain',
      sheet: { level: 2, ancestry: 'Humana', background: 'Trapaceira', className: 'Ladina (Trapaceira)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(0, 4, 1, 1, 1, 2), prof: prof(2, 2, 0, 4, 2, 4, 2),
        skills: ['Enganação (E)', 'Ladroagem (T)'], feats: ['Ataque Furtivo (+1d6)', 'Finta Rápida'] },
      weapons: [{ name: 'Facas Curvas', dmgDie: '1d4', reach: 1.5, dmgType: 'cortante', extra: [{ ...RUNE_PRESETS.furtivo }] }, { name: 'Faca de Arremesso', dmgDie: '1d4', reach: 6, dmgType: 'perfurante' }]
    }),
    piece({
      id: 't_lider_ladroes', name: 'Líder de Ladrões', sculpt: 'vt_lider_ladroes', faction: 'villain',
      sheet: { level: 4, ancestry: 'Humano', background: 'Chefe da Guilda', className: 'Ladino (Mestre da Guilda)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 3, attrs: attrs(2, 4, 2, 1, 1, 3), prof: prof(2, 4, 0, 4, 2, 4, 4),
        skills: ['Intimidação (E)', 'Enganação (E)', 'Furtividade (T)'], feats: ['Ataque Furtivo (+2d6)', 'Comandar o Bando', 'Esquiva Oportuna'] },
      weapons: [{ name: 'Sabre do Líder', dmgDie: '1d6', reach: 1.5, dmgType: 'cortante', extra: [{ name: 'Ataque furtivo', die: '2d6', bonus: 0, type: 'precisão' }] }, { name: 'Besta de Mão', dmgDie: '1d6', reach: 9, dmgType: 'perfurante' }],
      items: [I('pocao_moderada', 1)]
    }),
    piece({
      id: 't_ladra_sombria', name: 'Ladra Sombria', sculpt: 'vt_ladra_sombria', faction: 'villain',
      sheet: { level: 3, ancestry: 'Humana', background: 'Irmandade da Noite', className: 'Ladina (Arcana das Sombras)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 1, dexCap: 4, attrs: attrs(0, 4, 1, 2, 1, 2), prof: prof(2, 2, 2, 4, 2, 4, 2),
        skills: ['Furtividade (E)', 'Ocultismo (T)'], feats: ['Ataque Furtivo (+1d6)', 'Truque Sombrio'] },
      weapons: [{ name: 'Adaga Sombria', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante', extra: [{ ...RUNE_PRESETS.furtivo }] }],
      spells: [S('maldicao_sombria')]
    }),
    piece({
      id: 't_assassino', name: 'Assassino', sculpt: 'vt_assassino', faction: 'villain',
      sheet: { level: 4, ancestry: 'Humano', background: 'Lâmina Contratada', className: 'Ladino (Assassino)', keyAttr: 'DES',
        ancestryHp: 8, classHp: 8, armorItemBonus: 2, dexCap: 4, attrs: attrs(1, 4, 2, 1, 2, 0), prof: prof(2, 4, 0, 4, 2, 4, 4),
        skills: ['Furtividade (L)', 'Medicina (T)'], feats: ['Ataque Furtivo (+2d6)', 'Lâmina Envenenada', 'Golpe Mortal'] },
      weapons: [
        { name: 'Adagas Envenenadas', dmgDie: '1d4', reach: 1.5, dmgType: 'perfurante', extra: [{ name: 'Ataque furtivo', die: '2d6', bonus: 0, type: 'precisão' }, { name: 'Veneno', die: '1d6', bonus: 0, type: 'veneno' }] },
        { name: 'Zarabatana', dmgDie: '1d4', reach: 6, dmgType: 'perfurante', extra: [{ name: 'Veneno', die: '1d4', bonus: 0, type: 'veneno' }] }
      ]
    })
  );
})();
