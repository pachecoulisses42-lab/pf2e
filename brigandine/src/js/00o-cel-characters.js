/* ============================================================================
   1o. CEL-SHADED — um boneco para cada token do projeto
   app_* = os 22 personagens do app; pt_* = figuras pintadas dos heróis (ct_/cr_);
   pv_* = figuras pintadas dos vilões (vt_/vr_); t3_* = os bonecos 3D. Os pares de
   uma mesma figura (vista de cima / retrato) usam o mesmo boneco.
   ============================================================================ */

const CEL_SKIN = { light: '#f2c29b', tan: '#d9a07a', dark: '#a86f4c', goblin: '#84cc16', orc: '#65a30d' };
const CEL_GOBLIN = { skin: CEL_SKIN.goblin, ears: 'goblin', headScale: 1.45, brow: '#3f6212' };

const CEL_CHARS = {
  /* ------------------------------- do app ------------------------------- */
  app_guerreiro: { name: 'Guerreiro', attack: 'sword', skin: CEL_SKIN.light, hair: '#5b3a1e', hairStyle: 'short', helm: 'knight', helmColor: '#aeb6bf', crest: '#dc2626',
    top: '#7b8794', armor: '#c0c7cf', vest: '#64748b', cape: '#b91c1c', pants: '#4b5563', boots: '#3f2a1e', belt: '#5b3a1e', buckle: '#d4a017', gloves: '#6b7280',
    right: { kind: 'sword' }, left: { kind: 'shield', rot: [0, 0, 0] }, shieldColor: '#1d4ed8', shieldBoss: '#d4a017' },
  app_paladino: { name: 'Paladino', attack: 'sword', skin: CEL_SKIN.light, hair: '#7c4a1e', hairStyle: 'short', top: '#d1d5db', armor: '#e5e7eb', vest: '#2563eb',
    robe: '#f8fafc', robeLen: 0.45, robe2: '#2563eb', cape: '#f8fafc', pants: '#9ca3af', boots: '#6b7280', belt: '#d4a017', gloves: '#9ca3af',
    right: { kind: 'spear', rot: [0, 0, 0] }, left: { kind: 'kite', rot: [0, 0, 0] }, shieldColor: '#1d4ed8', shieldMark: '#facc15' },
  app_barbaro: { name: 'Bárbaro', attack: 'sword', skin: CEL_SKIN.tan, hair: '#1f1611', hairStyle: 'long', beard: 'long', helm: 'horned', helmColor: '#9ca3af',
    top: CEL_SKIN.tan, vest: '#7c4a1e', straps: '#5b3a1e', pants: '#5b3a1e', boots: '#3f2a1e', bracers: '#6b4423', belt: '#3f2a1e', buckle: '#9ca3af',
    right: { kind: 'greataxe' } },
  app_clerigo: { name: 'Clérigo', attack: 'staff', skin: CEL_SKIN.light, hair: '#f5d77a', hairStyle: 'long', top: '#f8f1dc', sleeve: 'wide', scarf: '#d4a017',
    robe: '#f8f1dc', robeLen: 0.8, robe2: '#d4a017', belt: '#8b5a2b', cross: '#d4a017', boots: '#8b5a2b', gloves: CEL_SKIN.light,
    right: { kind: 'staff', rot: [0, 0, 0] }, staffTop: 'star', wood: '#8b5a2b' },
  app_bardo: { name: 'Bardo', attack: 'sword', skin: CEL_SKIN.light, hair: '#f5d77a', hairStyle: 'long', helm: 'feather', helmColor: '#8b5a2b', feather: '#f5f5f4',
    top: '#86c06c', vest: '#5b8a3c', pants: '#5b3a1e', boots: '#5b3a1e', belt: '#3f2a1e', buckle: '#d4a017',
    right: { kind: 'sword' }, blade: '#e5e7eb', left: { kind: 'lute', rot: [0.4, 0, 0.6] }, wood: '#b0713a' },
  app_feiticeiro: { name: 'Feiticeiro', attack: 'fist', skin: CEL_SKIN.light, hair: '#5b3a1e', hairStyle: 'short', hat: 'wizard', hatColor: '#2563eb', hatBand: '#d4a017',
    top: '#1e3a8a', sleeve: 'wide', robe: '#1e3a8a', robeLen: 0.78, robe2: '#facc15', belt: '#d4a017', boots: '#1f2937', gloves: CEL_SKIN.light,
    flameHand: 'always', right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#22d3ee' },
  app_mago: { name: 'Mago', attack: 'fist', skin: CEL_SKIN.light, hair: '#60a5fa', hairStyle: 'long', beard: 'long', beardColor: '#60a5fa', hat: 'wizard', hatColor: '#1e40af', hatBand: '#d4a017',
    top: '#1e40af', sleeve: 'wide', robe: '#1e40af', robeLen: 0.8, robe2: '#3b82f6', belt: '#d4a017', boots: '#1f2937', gloves: CEL_SKIN.light,
    right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#bae6fd' },
  app_ranger: { name: 'Patrulheiro', attack: 'bow', skin: CEL_SKIN.light, hair: '#e7e5e4', hairStyle: 'short', ears: 'elf', eyes: '#16a34a', hat: 'hood', hatColor: '#f1f5f9',
    top: '#5b8a3c', vest: '#3f6212', cape: '#e7e5e4', pants: '#5b3a1e', boots: '#5b3a1e', belt: '#3f2a1e', gloves: '#5b3a1e',
    quiver: '#7c4a1e', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#b0713a' },
  app_rogue: { name: 'Ladino', attack: 'dagger', skin: CEL_SKIN.light, hat: 'hood', hatColor: '#374151', mask: '#1f2937', eyes: '#22d3ee',
    top: '#374151', vest: '#4b5563', straps: '#1f2937', pants: '#1f2937', boots: '#111827', belt: '#3f2a1e', gloves: '#1f2937',
    right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  app_goblin: { name: 'Goblin', attack: 'sword', ...CEL_GOBLIN, helm: 'cap', helmColor: '#7c4a1e',
    top: '#7c4a1e', vest: '#5b3a1e', pants: '#5b3a1e', boots: '#3f2a1e', belt: '#3f2a1e', right: { kind: 'sword' }, blade: '#9ca3af' },
  app_lobo: { kind: 'quad', name: 'Lobo Atroz', fur: '#8b929c', belly: '#e5e7eb', muzzle: '#d1d5db', scar: '#dc2626', eyes: '#facc15' },
  app_bandido: { name: 'Bandido', attack: 'sword', skin: CEL_SKIN.tan, hat: 'hood', hatColor: '#7f1d1d', mask: '#dc2626',
    top: '#5b3a1e', vest: '#3f2a1e', pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', buckle: '#9ca3af', right: { kind: 'sword' } },
  app_druida: { name: 'Druida', attack: 'staff', skin: CEL_SKIN.light, hair: '#a16207', hairStyle: 'short', ears: 'elf', hat: 'hood', hatColor: '#3f6212',
    top: '#4d7c0f', sleeve: 'wide', robe: '#3f6212', robeLen: 0.75, robe2: '#65a30d', robeJag: 0.14, belt: '#7c4a1e', boots: '#5b3a1e', gloves: CEL_SKIN.light,
    right: { kind: 'staff', rot: [0, 0, 0] }, wood: '#7c4a1e' },
  app_monge: { name: 'Monge', attack: 'fist', skin: CEL_SKIN.light, hairStyle: 'bald', helm: 'band', helmColor: '#dc2626', brow: '#3f2a1e',
    top: '#fb923c', sleeve: 'wide', pants: '#fb923c', boots: '#7c4a1e', wraps: '#f8fafc', belt: '#f8fafc', gloves: '#fde68a' },
  app_alquimista: { name: 'Alquimista', attack: 'dagger', skin: CEL_SKIN.light, hair: '#7c4a1e', hairStyle: 'short', helm: 'goggles', helmColor: '#7c4a1e',
    top: '#f5f5f4', vest: '#7c4a1e', robe: '#7c4a1e', robeLen: 0.6, robe2: '#a16207', belt: '#3f2a1e', bag: '#5b3a1e', boots: '#3f2a1e', gloves: '#5b3a1e',
    right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#84cc16' },
  app_bruxa: { name: 'Bruxa', attack: 'staff', skin: CEL_SKIN.light, hair: '#1f1611', hairStyle: 'long', hat: 'wizard', hatColor: '#6d28d9', hatBand: '#d4a017',
    top: '#4c1d95', sleeve: 'wide', robe: '#4c1d95', robeLen: 0.8, robe2: '#7c3aed', belt: '#d4a017', boots: '#1f1611', gloves: CEL_SKIN.light,
    right: { kind: 'staff', rot: [0, 0, 0] }, wood: '#5b3a1e' },
  app_espadachim: { name: 'Espadachim', attack: 'sword', skin: CEL_SKIN.light, hair: '#5b3a1e', hairStyle: 'long', beard: 'short', helm: 'feather', helmColor: '#1e3a8a', feather: '#f5f5f4', hatBand: '#d4a017',
    top: '#1e3a8a', vest: '#dc2626', scarf: '#f5f5f4', pants: '#f5f5f4', boots: '#1f2937', belt: '#1f1611', buckle: '#d4a017', right: { kind: 'sword' } },
  app_esqueleto: { name: 'Esqueleto', attack: 'sword', skin: '#e7e5e4', hairStyle: 'bald', skull: true, helm: 'cap', helmColor: '#78716c',
    top: '#e7e5e4', vest: '#d6d3d1', pants: '#e7e5e4', boots: '#a8a29e', gloves: '#e7e5e4', belt: '#57534e',
    right: { kind: 'sword' }, blade: '#a8a29e', left: { kind: 'shield', rot: [0, 0, 0] }, shieldColor: '#7c4a1e' },
  app_orc: { name: 'Orc', attack: 'sword', skin: CEL_SKIN.orc, ears: 'goblin', hair: '#1f1611', hairStyle: 'short', brow: '#1a2e05',
    top: '#5b3a1e', armor: '#78716c', vest: '#3f2a1e', pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', buckle: '#a8a29e', right: { kind: 'greataxe' } },
  app_cultista: { name: 'Cultista', attack: 'dagger', skin: '#e7e5e4', hat: 'hood', hatColor: '#7f1d1d', eyes: '#dc2626',
    top: '#7f1d1d', sleeve: 'wide', robe: '#7f1d1d', robeLen: 0.82, robe2: '#450a0a', cross: '#d4a017', belt: '#450a0a', boots: '#1f1611', gloves: '#e7e5e4',
    right: { kind: 'dagger' } },
  app_zumbi: { name: 'Zumbi', attack: 'fist', skin: '#84a98c', hair: '#3f3f46', hairStyle: 'short', brow: '#14532d',
    top: '#3b5b8a', pants: '#3f3f46', boots: '#3f3f46', gloves: '#84a98c', belt: '#1f1611' },
  app_kobold: { name: 'Kobold', attack: 'dagger', skin: '#ea580c', ears: 'goblin', headScale: 1.4, brow: '#7c2d12',
    top: '#7c4a1e', pants: '#5b3a1e', boots: '#7c2d12', gloves: '#ea580c', belt: '#3f2a1e', tail: { color: '#ea580c', len: 0.5, r: 0.07, tipR: 0.02 },
    right: { kind: 'spear', rot: [0, 0, 0] }, left: { kind: 'shield', rot: [0, 0, 0] }, shieldColor: '#7c4a1e' },

  /* ---------------------- figuras pintadas: heróis ---------------------- */
  pt_arqueiro: { name: 'Arqueiro', attack: 'bow', skin: CEL_SKIN.light, hair: '#7c4a1e', hairStyle: 'long', ears: 'elf', scarf: '#3f6212', cape: '#3f6212',
    top: '#5b3a1e', vest: '#6b4423', pants: '#3f2a1e', boots: '#3f2a1e', belt: '#3f2a1e', gloves: '#5b3a1e', bracers: '#6b4423',
    quiver: '#7c4a1e', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#8b5a2b' },
  pt_barbaro: { name: 'Bárbaro', attack: 'sword', skin: CEL_SKIN.tan, hair: '#1f1611', hairStyle: 'long', beard: 'short', scarf: '#e7e5e4', armor: '#d6d3d1',
    top: '#6b4423', straps: '#3f2a1e', pants: '#3f2a1e', boots: '#1f1611', bracers: '#5b3a1e', belt: '#1f1611', buckle: '#a8a29e', right: { kind: 'axe' }, left: { kind: 'axe' } },
  pt_bardo: { name: 'Bardo', attack: 'sword', skin: CEL_SKIN.light, hair: '#7c4a1e', hairStyle: 'short', scarf: '#7c3aed', cape: '#6d28d9',
    top: '#6b4423', vest: '#4b5563', pants: '#3f2a1e', boots: '#3f2a1e', belt: '#3f2a1e', buckle: '#d4a017',
    right: { kind: 'sword' }, left: { kind: 'lute', rot: [0.4, 0, 0.6] }, wood: '#b0713a' },
  pt_bruxo: { name: 'Bruxo', attack: 'fist', skin: CEL_SKIN.light, hair: '#1f1611', hairStyle: 'long', scarf: '#166534',
    top: '#14532d', sleeve: 'wide', robe: '#1f2937', robeLen: 0.72, robe2: '#166534', belt: '#3f2a1e', boots: '#1f1611', gloves: '#1f2937',
    right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#4ade80' },
  pt_cavaleiro: { name: 'Cavaleiro', attack: 'sword', skin: CEL_SKIN.light, hair: '#f5d77a', hairStyle: 'long', armor: '#cbd5e1', top: '#9ca3af', vest: '#1e3a8a',
    cape: '#1e3a8a', pants: '#9ca3af', boots: '#6b7280', belt: '#3f2a1e', buckle: '#d4a017', gloves: '#9ca3af', bracers: '#cbd5e1',
    right: { kind: 'sword' }, left: { kind: 'kite', rot: [0, 0, 0] }, shieldColor: '#1e3a8a', shieldMark: '#e5e7eb' },
  pt_cavaleiro_liberdade: { name: 'Cavaleiro da Liberdade', attack: 'sword', skin: CEL_SKIN.light, hair: '#3f2a1e', hairStyle: 'long', armor: '#9ca3af', top: '#6b7280',
    vest: '#1e40af', cross: '#d4a017', cape: '#1e40af', pants: '#4b5563', boots: '#3f2a1e', belt: '#3f2a1e', gloves: '#6b7280', right: { kind: 'sword' } },
  pt_clerigo: { name: 'Clérigo', attack: 'staff', skin: CEL_SKIN.light, hair: '#3f2a1e', hairStyle: 'short', beard: 'short', top: '#f8fafc', sleeve: 'wide', scarf: '#1e3a8a',
    robe: '#f8fafc', robeLen: 0.8, robe2: '#1e3a8a', cross: '#d4a017', belt: '#1e3a8a', buckle: '#d4a017', boots: '#3f2a1e', gloves: CEL_SKIN.light,
    right: { kind: 'staff', rot: [0, 0, 0] }, wood: '#7c4a1e' },
  pt_druida: { name: 'Druida', attack: 'staff', skin: CEL_SKIN.light, hair: '#a16207', hairStyle: 'long', ears: 'elf', top: '#3f6212', sleeve: 'wide',
    robe: '#4d7c0f', robeLen: 0.78, robe2: '#7c2d12', robeJag: 0.15, cape: '#14532d', belt: '#5b3a1e', boots: '#3f2a1e', gloves: CEL_SKIN.light,
    right: { kind: 'staff', rot: [0, 0, 0] }, wood: '#7c4a1e' },
  pt_explorador: { name: 'Explorador', attack: 'bow', skin: CEL_SKIN.tan, beard: 'short', beardColor: '#57534e', hat: 'hood', hatColor: '#3f6212', cape: '#365314',
    top: '#4d7c0f', vest: '#5b3a1e', pants: '#3f2a1e', boots: '#3f2a1e', belt: '#3f2a1e', gloves: '#3f2a1e',
    quiver: '#7c4a1e', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#8b5a2b' },
  pt_feiticeiro: { name: 'Feiticeiro', attack: 'fist', skin: CEL_SKIN.light, hair: '#7c2d12', hairStyle: 'long', ears: 'elf', top: '#991b1b', sleeve: 'wide',
    robe: '#7f1d1d', robeLen: 0.8, robe2: '#d4a017', scarf: '#d4a017', belt: '#d4a017', boots: '#450a0a', gloves: CEL_SKIN.light,
    right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#c084fc' },
  pt_guerreiro: { name: 'Guerreiro', attack: 'sword', skin: CEL_SKIN.tan, hair: '#1f1611', hairStyle: 'long', beard: 'short', scarf: '#1e40af', armor: '#9ca3af',
    top: '#6b7280', vest: '#4b5563', pants: '#3f3f46', boots: '#1f1611', belt: '#3f2a1e', buckle: '#a8a29e', gloves: '#4b5563', right: { kind: 'greatsword' } },
  pt_invocador: { name: 'Invocador', attack: 'fist', skin: CEL_SKIN.light, hair: '#1f1611', hairStyle: 'long', top: '#5b21b6', sleeve: 'wide', scarf: '#7c3aed',
    robe: '#4c1d95', robeLen: 0.8, robe2: '#7c3aed', belt: '#d4a017', boots: '#1f1611', gloves: CEL_SKIN.light, right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#c084fc' },
  pt_kappa: { name: 'Kappa', attack: 'sword', skin: '#4d7c0f', hairStyle: 'bald', helm: 'kasa', helmColor: '#a16207', brow: '#1a2e05', cape: '#3f6212',
    top: '#155e75', vest: '#7c4a1e', pants: '#155e75', boots: '#3f2a1e', belt: '#3f2a1e', gloves: '#4d7c0f', right: { kind: 'sword' } },
  pt_kitsune: { name: 'Kitsune', attack: 'sword', skin: CEL_SKIN.light, hair: '#c2410c', hairStyle: 'long', ears: 'fox', earColor: '#c2410c',
    tail: { color: '#c2410c', tip: '#fafaf9', len: 0.55, r: 0.08, tipR: 0.15 }, top: '#fafaf9', sleeve: 'wide', robe: '#fafaf9', robeLen: 0.7, robe2: '#b91c1c',
    sash: '#b91c1c', belt: '#b91c1c', boots: '#1f1611', gloves: CEL_SKIN.light, right: { kind: 'sword' } },
  pt_ladino: { name: 'Ladino', attack: 'dagger', skin: CEL_SKIN.light, hat: 'hood', hatColor: '#1f1f1f', top: '#262626', vest: '#3f2a1e', straps: '#1f1611',
    pants: '#1f1f1f', boots: '#1f1611', belt: '#3f2a1e', gloves: '#1f1611', right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  pt_mago: { name: 'Mago', attack: 'fist', skin: CEL_SKIN.light, hair: '#e5e7eb', hairStyle: 'long', ears: 'elf', top: '#1e3a8a', sleeve: 'wide', scarf: '#a16207',
    robe: '#312e81', robeLen: 0.8, robe2: '#a16207', belt: '#a16207', boots: '#1f1611', gloves: CEL_SKIN.light, right: { kind: 'orb', rot: [0, 0, 0] }, glowColor: '#38bdf8' },
  pt_monge: { name: 'Monge', attack: 'fist', skin: CEL_SKIN.tan, hair: '#1f1611', hairStyle: 'short', top: '#1f2937', sleeveColor: CEL_SKIN.tan,
    pants: '#1f2937', boots: '#3f2a1e', belt: '#a16207', bracers: '#6b4423', gloves: '#3f2a1e' },
  pt_ninja: { name: 'Ninja', attack: 'sword', skin: CEL_SKIN.light, hat: 'hood', hatColor: '#111827', mask: '#111827', top: '#111827', pants: '#111827',
    boots: '#1f2937', wraps: '#374151', belt: '#374151', gloves: '#111827', right: { kind: 'katana' } },
  pt_paladino: { name: 'Paladino', attack: 'sword', skin: CEL_SKIN.light, hair: '#e0b25c', hairStyle: 'long', armor: '#e5e7eb', top: '#cbd5e1', vest: '#f8fafc', cross: '#d4a017',
    pants: '#cbd5e1', boots: '#9ca3af', belt: '#d4a017', gloves: '#cbd5e1', right: { kind: 'mace' }, grip: '#d4a017', left: { kind: 'kite', rot: [0, 0, 0] }, shieldColor: '#1e40af', shieldMark: '#facc15' },
  pt_pistoleiro: { name: 'Pistoleiro', attack: 'shoot', skin: CEL_SKIN.tan, beard: 'short', beardColor: '#3f2a1e', hair: '#3f2a1e', hairStyle: 'short', helm: 'cowboy', helmColor: '#5b3a1e', hatBand: '#1f1611',
    scarf: '#991b1b', top: '#7c2d12', robe: '#5b3a1e', robeLen: 0.7, robe2: '#3f2a1e', pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', buckle: '#9ca3af', right: { kind: 'pistol' } },
  pt_ranger_batalha: { name: 'Patrulheiro de Batalha', attack: 'sword', skin: CEL_SKIN.tan, hair: '#7c4a1e', hairStyle: 'long', beard: 'short', scarf: '#14532d', armor: '#78716c',
    top: '#4d7c0f', vest: '#5b3a1e', pants: '#3f2a1e', boots: '#3f2a1e', belt: '#3f2a1e', quiver: '#7c4a1e', right: { kind: 'sword' }, left: { kind: 'dagger' } },
  pt_ryu: { name: 'Ryu', attack: 'sword', skin: CEL_SKIN.tan, hair: '#111827', hairStyle: 'pony', beard: 'short', armor: '#991b1b', top: '#7f1d1d', vest: '#111827',
    robe: '#7f1d1d', robeLen: 0.5, robe2: '#111827', pants: '#111827', boots: '#1f1611', belt: '#d4a017', right: { kind: 'katana' } },
  pt_samurai: { name: 'Samurai', attack: 'sword', skin: CEL_SKIN.tan, beard: 'short', beardColor: '#111827', helm: 'kabuto', helmColor: '#7f1d1d', crest: '#d4a017',
    armor: '#991b1b', top: '#7f1d1d', vest: '#450a0a', robe: '#7f1d1d', robeLen: 0.5, robe2: '#450a0a', pants: '#1f1611', boots: '#1f1611', belt: '#d4a017', right: { kind: 'katana' } },
  pt_tengu: { name: 'Tengu', attack: 'sword', skin: '#dc2626', hair: '#b91c1c', hairStyle: 'long', beak: '#f59e0b', brow: '#450a0a', cape: '#b91c1c',
    top: '#1e3a8a', vest: '#b45309', pants: '#1e3a8a', boots: '#1f1611', belt: '#b45309', gloves: '#dc2626', right: { kind: 'sword' } },

  /* ---------------------- figuras pintadas: vilões ---------------------- */
  pv_assassino: { name: 'Assassino', attack: 'dagger', skin: CEL_SKIN.tan, hat: 'hood', hatColor: '#1f2937', mask: '#111827', eyes: '#f59e0b',
    top: '#1f2937', vest: '#262626', straps: '#111827', pants: '#1f2937', boots: '#111827', belt: '#262626', gloves: '#111827', right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  pv_goblin_arqueiro: { name: 'Goblin Arqueiro', attack: 'bow', ...CEL_GOBLIN, hat: 'hood', hatColor: '#3f3f46', top: '#5b3a1e', vest: '#3f2a1e', pants: '#3f2a1e', boots: '#1f1611',
    belt: '#1f1611', quiver: '#7c4a1e', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#8b5a2b' },
  pv_goblin_atirador: { name: 'Goblin Atirador', attack: 'shoot', ...CEL_GOBLIN, hat: 'hood', hatColor: '#3f3f46', helm: 'goggles', helmColor: '#1f2937',
    top: '#3f3f46', vest: '#5b3a1e', pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', right: { kind: 'crossbow' }, wood: '#7c4a1e' },
  pv_goblin_chefe: { name: 'Goblin Chefe', attack: 'sword', ...CEL_GOBLIN, hair: '#dc2626', hairStyle: 'pony', helm: 'crown', helmColor: '#e7e5e4', armor: '#57534e',
    top: '#3f2a1e', vest: '#5b3a1e', cross: '#e7e5e4', pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', buckle: '#e7e5e4', right: { kind: 'greataxe' } },
  pv_goblin_comum: { name: 'Goblin', attack: 'sword', ...CEL_GOBLIN, hair: '#1f1611', hairStyle: 'short', top: '#7c2d12', vest: '#5b3a1e', pants: '#3f2a1e', boots: '#1f1611',
    belt: '#1f1611', right: { kind: 'sword' }, blade: '#9ca3af' },
  pv_goblin_escudo: { name: 'Goblin de Escudo', attack: 'sword', ...CEL_GOBLIN, helm: 'knight', helmColor: '#78716c', armor: '#57534e', top: '#3f3f46', vest: '#5b3a1e',
    pants: '#3f2a1e', boots: '#1f1611', belt: '#1f1611', right: { kind: 'sword' }, left: { kind: 'shield', rot: [0, 0, 0] }, shieldColor: '#7c4a1e', shieldBoss: '#a8a29e' },
  pv_goblin_lancador: { name: 'Goblin Lanceiro', attack: 'dagger', ...CEL_GOBLIN, hair: '#111827', hairStyle: 'short', top: '#3f6212', vest: '#5b3a1e', pants: '#3f2a1e',
    boots: '#1f1611', belt: '#1f1611', right: { kind: 'spear', rot: [0, 0, 0] } },
  pv_goblin_xama: { name: 'Goblin Xamã', attack: 'staff', ...CEL_GOBLIN, helm: 'crown', helmColor: '#e7e5e4', top: '#57534e', sleeve: 'wide', scarf: '#e7e5e4',
    robe: '#3f3f46', robeLen: 0.6, robe2: '#7f1d1d', belt: '#1f1611', boots: '#1f1611', right: { kind: 'staff', rot: [0, 0, 0] }, wood: '#5b3a1e' },
  pv_ladra: { name: 'Ladra', attack: 'dagger', skin: CEL_SKIN.light, hair: '#1f1611', hairStyle: 'long', mask: '#1f2937', top: '#3f2a1e', vest: '#5b3a1e', straps: '#1f1611',
    pants: '#262626', boots: '#1f1611', belt: '#1f1611', gloves: '#1f1611', right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  pv_ladra_sombria: { name: 'Ladra Sombria', attack: 'dagger', skin: CEL_SKIN.light, hat: 'hood', hatColor: '#4c1d95', mask: '#1f1f1f', top: '#2e1065', robe: '#3b0764',
    robeLen: 0.6, robe2: '#1f1f1f', pants: '#1f1f1f', boots: '#111827', belt: '#1f1f1f', right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  pv_ladrao_adaga: { name: 'Ladrão da Adaga', attack: 'dagger', skin: CEL_SKIN.tan, hat: 'hood', hatColor: '#991b1b', mask: '#111827', top: '#3f2a1e', vest: '#7f1d1d',
    pants: '#262626', boots: '#1f1611', belt: '#1f1611', right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  pv_ladrao_arco: { name: 'Ladrão Arqueiro', attack: 'bow', skin: CEL_SKIN.light, hat: 'hood', hatColor: '#14532d', cape: '#14532d', top: '#3f2a1e', vest: '#5b3a1e',
    pants: '#262626', boots: '#1f1611', belt: '#1f1611', quiver: '#7c4a1e', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#8b5a2b' },
  pv_ladrao_comum: { name: 'Ladrão', attack: 'dagger', skin: CEL_SKIN.tan, hat: 'hood', hatColor: '#262626', mask: '#3f3f46', top: '#262626', vest: '#3f2a1e',
    pants: '#262626', boots: '#1f1611', belt: '#1f1611', right: { kind: 'dagger' } },
  pv_lider_ladroes: { name: 'Líder dos Ladrões', attack: 'sword', skin: CEL_SKIN.tan, hair: '#1f1611', hairStyle: 'short', beard: 'short', scarf: '#991b1b', armor: '#e7e5e4',
    top: '#1f1f1f', vest: '#262626', pants: '#1f1f1f', boots: '#111827', belt: '#3f2a1e', buckle: '#9ca3af', right: { kind: 'sword' } },
  pv_lobo_alfa: { kind: 'quad', name: 'Lobo Alfa', fur: '#3f3f46', belly: '#a8a29e', muzzle: '#a8a29e', mane: '#27272a', eyes: '#facc15' },
  pv_lobo_comum: { kind: 'quad', name: 'Lobo', fur: '#6b7280', belly: '#d6d3d1', muzzle: '#d6d3d1', eyes: '#f59e0b' },
  pv_lobo_espectral: { kind: 'quad', name: 'Lobo Espectral', fur: '#7dd3fc', belly: '#e0f2fe', muzzle: '#bae6fd', glow: true, eyeGlow: '#f0f9ff' },
  pv_lobo_feroz: { kind: 'quad', name: 'Lobo Feroz', fur: '#57534e', belly: '#a8a29e', muzzle: '#a8a29e', scar: '#dc2626', eyes: '#facc15' },
  pv_lobo_guerra: { kind: 'quad', name: 'Lobo de Guerra', fur: '#3f3f46', belly: '#78716c', muzzle: '#78716c', armor: '#1f2937', armorTrim: '#b91c1c', eyes: '#ef4444' },
  pv_lobo_matilha: { kind: 'quad', name: 'Lobo da Matilha', fur: '#78716c', belly: '#d6d3d1', muzzle: '#d6d3d1', armor: '#7c4a1e', eyes: '#f59e0b' },
  pv_lobo_sombrio: { kind: 'quad', name: 'Lobo Sombrio', fur: '#1e1b2e', belly: '#3b2f4a', muzzle: '#3b2f4a', eyeGlow: '#c084fc' }
};

/** Boneco cel-shaded de um token (app, pintado em qualquer versão ou 3D); null se não houver. */
function celCharKey(tokenKey) {
  if (typeof tokenKey !== 'string') return null;
  if (typeof T3D_TOKENS !== 'undefined' && T3D_TOKENS[tokenKey]) return tokenKey;
  const m = tokenKey.match(/^(c|v)(t|r)_(.+)$/);
  if (m) {
    const k = `${m[1] === 'c' ? 'pt' : 'pv'}_${m[3]}`;
    return CEL_CHARS[k] ? k : null;
  }
  return CEL_CHARS[`app_${tokenKey}`] ? `app_${tokenKey}` : null;
}

function celCharConfig(key) {
  return CEL_CHARS[key] || (typeof T3D_TOKENS !== 'undefined' ? T3D_TOKENS[key] : null) || null;
}

const CEL_MODEL_CACHE = {};
function celModel(key) {
  if (!CEL_MODEL_CACHE[key]) {
    const cfg = celCharConfig(key);
    CEL_MODEL_CACHE[key] = cfg.kind === 'quad' ? t3dQuadruped(cfg) : t3dHumanoid(cfg);
  }
  return CEL_MODEL_CACHE[key];
}
