/* ============================================================================
   1l. TOKENS 3D — boneco base, itens e poses
   Um humanoide configurável (roupas, cabelo, chapéu/capuz, orelhas, armas) e as
   poses de cada animação. Os personagens são só configurações deste boneco.
   ============================================================================ */


/* ---------- itens ---------- */
const T3D_ITEMS = {
  sword: (c) => [
    t3dPrism({ n: 5, y0: -0.12, y1: 0.06, r0: 0.025, r1: 0.025, color: c.grip || '#5b3a1e' }),
    t3dBox({ y: 0.08, w: 0.2, h: 0.035, d: 0.05, color: c.guard || '#9ca3af' }),
    t3dBlade({ y0: 0.1, y1: 0.85, w: 0.09, t: 0.018, color: c.blade || '#d1d5db', tip: 0.14, glow: !!c.glowBlade })
  ],
  greatsword: (c) => [
    t3dPrism({ n: 5, y0: -0.2, y1: 0.06, r0: 0.028, r1: 0.028, color: c.grip || '#5b3a1e' }),
    t3dBox({ y: 0.08, w: 0.26, h: 0.04, d: 0.06, color: '#6b7280' }),
    t3dBlade({ y0: 0.1, y1: 1.05, w: 0.12, t: 0.02, color: c.blade || '#9ca3af', tip: 0.16 })
  ],
  mace: (c) => [
    t3dPrism({ n: 5, y0: -0.12, y1: 0.45, r0: 0.025, r1: 0.025, color: c.grip || '#4a2f1e' }),
    t3dPrism({ n: 6, y0: 0.42, y1: 0.62, r0: 0.08, r1: 0.06, color: '#9ca3af', jag: 0.35 }),
    t3dPrism({ n: 6, y0: 0.62, y1: 0.68, r0: 0.05, r1: 0, color: '#9ca3af' })
  ],
  dagger: (c) => [
    t3dPrism({ n: 5, y0: -0.08, y1: 0.04, r0: 0.022, r1: 0.022, color: '#3f2a17' }),
    t3dBox({ y: 0.05, w: 0.12, h: 0.025, d: 0.04, color: '#9ca3af' }),
    t3dBlade({ y0: 0.06, y1: 0.38, w: 0.06, t: 0.012, color: '#e5e7eb', tip: 0.1 })
  ],
  katana: (c) => [
    t3dPrism({ n: 5, y0: -0.18, y1: 0.04, r0: 0.022, r1: 0.022, color: '#1f2937' }),
    t3dPrism({ n: 6, y0: 0.04, y1: 0.06, r0: 0.05, r1: 0.05, color: '#a16207' }),
    t3dBlade({ y0: 0.06, y1: 0.9, w: 0.05, t: 0.012, color: '#e5e7eb', tip: 0.12 })
  ],
  staff: (c) => [
    t3dPrism({ n: 5, y0: -0.75, y1: 1.0, r0: 0.028, r1: 0.024, color: c.wood || '#6b4423' }),
    ...(c.staffTop === 'star' ? [t3dBox({ y: 1.12, w: 0.12, h: 0.12, d: 0.04, color: '#e5e7eb', taper: 0.2 }), t3dBox({ y: 1.08, w: 0.12, h: 0.1, d: 0.04, color: '#e5e7eb', taper: 1 })]
      : [t3dPrism({ n: 5, y0: 1.0, y1: 1.12, r0: 0.03, r1: 0.06, off: [0.05, 0], color: c.wood || '#6b4423' })])
  ],
  // arco no plano x-y: comprimento em x, barriga para -y (o alvo, ao longo do braço), corda do lado do arqueiro
  bow: (c) => {
    const parts = [];
    const segs = 6;
    let prev = null;
    for (let i = 0; i <= segs; i++) {
      const k = i / segs - 0.5;
      const pt = [k * 1.1, 0.16 - Math.cos(k * Math.PI) * 0.16, 0];
      if (prev) {
        const mid = [(pt[0] + prev[0]) / 2, (pt[1] + prev[1]) / 2, 0];
        const len = Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
        const ang = Math.atan2(pt[1] - prev[1], pt[0] - prev[0]);
        parts.push({ node: t3dNode('bowseg', mid, [t3dBox({ w: 0.04, h: len * 1.08, d: 0.04, color: c.wood || '#b0713a' })], [], [0, 0, ang - Math.PI / 2]) });
      }
      prev = pt;
    }
    parts.push(t3dBox({ y: 0.16, w: 1.08, h: 0.012, d: 0.012, color: '#e5e7eb' }));
    parts.push(t3dBox({ w: 0.08, h: 0.06, d: 0.06, color: '#5c3b22' }));
    return parts;
  },
  flask: () => [
    t3dPrism({ n: 6, y0: -0.06, y1: 0.06, r0: 0.06, r1: 0.06, color: '#dc2626' }),
    t3dPrism({ n: 6, y0: 0.06, y1: 0.14, r0: 0.025, r1: 0.025, color: '#e5e7eb' }),
    t3dPrism({ n: 6, y0: 0.14, y1: 0.17, r0: 0.03, r1: 0.03, color: '#7c4a1e' })
  ],
  flameFist: () => [
    t3dPrism({ n: 5, y0: -0.05, y1: 0.35, r0: 0.11, r1: 0, off: [0.03, 0.02], color: '#f97316', jag: 0.3 }).map(f => ({ ...f, glow: true })),
    t3dPrism({ n: 5, y0: 0, y1: 0.22, r0: 0.06, r1: 0, color: '#fde047', twist: 0.5 }).map(f => ({ ...f, glow: true }))
  ]
};

/** Peças de item e nós filhos (o arco é feito de nós inclinados). */
function t3dItemNode(name, kind, cfg, pos, rot, when = null) {
  const raw = T3D_ITEMS[kind](cfg).flat();
  const parts = raw.filter(p => !p.node);
  const kids = raw.filter(p => p.node).map(p => p.node);
  const n = t3dNode(name, pos, parts, kids, rot, when);
  return n;
}

/* ---------- boneco ---------- */

/**
 * cfg: { skin, hair, hairStyle ('long'|'short'|'bald'|'pony'), beard ('long'|'short'|null), ears ('elf'|null),
 *   hat ('wizard'|'hood'|null), hatColor, hatBand, top, sleeve ('wide'|'tight'), robe (cor da saia, null = calça),
 *   robeLen, robe2 (frente/avental), pants, boots, belt, gloves, armor (cor das ombreiras), sash,
 *   right/left ({ kind, rot }), back ([{ kind, ... }]), bag, books, headScale, faceShadow }
 */
function t3dHumanoid(cfg) {
  const C = cfg;
  const hs = C.headScale || 1.25;
  const sleeveR = C.sleeve === 'wide' ? 0.12 : 0.075;

  // ----- pernas
  const leg = (side) => t3dNode(`leg${side}`, [side === 'L' ? 0.11 : -0.11, 0, 0], [
    t3dPrism({ n: 6, y0: -0.43, y1: 0.02, r0: 0.075, r1: 0.09, color: C.pants || '#374151' })
  ], [
    t3dNode(`shin${side}`, [0, -0.42, 0], [
      t3dPrism({ n: 6, y0: -0.38, y1: 0.02, r0: 0.07, r1: 0.08, color: C.boots || '#4b2e1a' }),
      ...(C.wraps ? [t3dPrism({ n: 6, y0: -0.28, y1: -0.05, r0: 0.078, r1: 0.083, color: C.wraps })] : []),
      t3dBox({ y: -0.36, z: 0.05, w: 0.13, h: 0.07, d: 0.24, color: C.boots || '#4b2e1a' })
    ])
  ]);

  // ----- braços (mão com âncora para brilhos)
  const arm = (side) => {
    const sgn = side === 'L' ? 1 : -1;
    const hold = side === 'L' ? C.left : C.right;
    const handKids = [];
    if (hold) handKids.push(t3dItemNode(`item${side}`, hold.kind, C, hold.pos || [0, -0.05, 0.02], hold.rot || [90 * T3D_DEG, 0, 0], hold.when || null));
    if (side === 'R') handKids.push(t3dItemNode('flaskR', 'flask', C, [0, -0.08, 0.04], [0, 0, 0], 'item'));
    if (C.flameHand && side === 'L') handKids.push(t3dItemNode('flameL', 'flameFist', C, [0, -0.1, 0.05], [180 * T3D_DEG, 0, 0], C.flameHand === 'always' ? null : 'cast'));
    const hand = t3dNode(`hand${side}`, [0, -0.3, 0], [
      t3dBox({ y: -0.04, w: 0.09, h: 0.11, d: 0.1, color: C.gloves || C.skin })
    ], handKids);
    hand.anchor = true;
    return t3dNode(`arm${side}`, [sgn * 0.27, 0.52, 0], [
      ...(C.armor ? [t3dPrism({ n: 6, y0: -0.12, y1: 0.08, r0: 0.12, r1: 0.06, color: C.armor, cx: sgn * 0.02 })] : []),
      t3dPrism({ n: 6, y0: -0.34, y1: 0.03, r0: 0.07, r1: 0.08, color: C.top })
    ], [
      t3dNode(`fore${side}`, [0, -0.33, 0], [
        t3dPrism({ n: 6, y0: -0.3, y1: 0.02, r0: sleeveR, r1: 0.075, color: C.sleeveColor || C.top }),
        ...(C.bracers ? [t3dPrism({ n: 6, y0: -0.28, y1: -0.12, r0: 0.07, r1: 0.075, color: C.bracers })] : [])
      ], [hand])
    ]);
  };

  // ----- cabeça
  const head = [];
  const hr = 0.14 * hs;
  head.push(t3dPrism({ n: 5, y0: -0.02, y1: 0.06, r0: 0.06, r1: 0.06, color: C.skin }));
  head.push(t3dPrism({ n: 6, y0: 0.05, y1: 0.05 + hr * 2.1, r0: hr * 0.8, r1: hr * 0.95, sz: 0.95, twist: Math.PI / 6, color: C.skin }));
  head.push(t3dPrism({ n: 6, y0: 0.05 + hr * 2.1, y1: 0.05 + hr * 2.45, r0: hr * 0.95, r1: hr * 0.5, sz: 0.95, twist: Math.PI / 6, color: C.hairStyle === 'bald' || !C.hair ? C.skin : C.hair }));
  const eyeY = 0.05 + hr * 1.25;
  if (!C.faceShadow) {
    head.push(t3dBox({ x: 0.055 * hs, y: eyeY, z: hr * 0.86, w: 0.035, h: 0.022, d: 0.02, color: '#111827' }));
    head.push(t3dBox({ x: -0.055 * hs, y: eyeY, z: hr * 0.86, w: 0.035, h: 0.022, d: 0.02, color: '#111827' }));
    head.push(t3dBox({ y: eyeY + 0.04, z: hr * 0.84, w: 0.15 * hs, h: 0.018, d: 0.02, color: C.brow || C.hair || '#3f2a17' }));
  }
  if (C.ears === 'elf') {
    for (const s of [1, -1]) head.push(t3dPrism({ n: 4, y0: 0, y1: 0.16, r0: 0.03, r1: 0, cx: s * hr * 0.95, color: C.skin, off: [s * 0.1, -0.03] }).map(f => ({ ...f, v: f.v.map(v => [v[0], v[1] + eyeY - 0.02, v[2]]) })));
  }
  if (C.hairStyle === 'long' || C.hairStyle === 'short' || C.hairStyle === 'pony') {
    const len = C.hairStyle === 'long' ? 0.42 : 0.18;
    // cabelo atrás e dos lados (o rosto fica livre)
    head.push(t3dPrism({ n: 7, y0: 0.05 + hr * 2.3 - len, y1: 0.05 + hr * 2.45, r0: hr * 1.08, r1: hr * 1.0, cz: -hr * 0.32, sz: 0.78, color: C.hair, jag: 0.08 }));
    // franja curta no alto da testa, puxada para um lado
    head.push(t3dBox({ x: hr * 0.15, y: 0.05 + hr * 2.3, z: hr * 0.7, w: hr * 1.4, h: hr * 0.2, d: hr * 0.4, color: C.hair, taper: 0.8 }));
  }
  if (C.beard) {
    const blen = C.beard === 'long' ? 0.42 : 0.16;
    head.push(t3dPrism({ n: 6, y0: eyeY - 0.05, y1: eyeY - 0.05 - blen, r0: hr * 0.85, r1: 0.02, cz: hr * 0.35, sz: 0.7, color: C.beardColor || C.hair, off: [0, 0.06] }));
    head.push(t3dBox({ y: eyeY - 0.04, z: hr * 0.9, w: hr * 1.3, h: 0.05, d: 0.04, color: C.beardColor || C.hair }));
  }
  if (C.hat === 'wizard') {
    const base = 0.05 + hr * 2.3;
    head.push(t3dPrism({ n: 10, y0: base + 0.02, y1: base + 0.05, r0: hr * 1.95, r1: hr * 1.85, color: C.hatColor }));
    if (C.hatBand) head.push(t3dPrism({ n: 8, y0: base + 0.02, y1: base + 0.09, r0: hr * 1.08, r1: hr * 1.04, color: C.hatBand }));
    head.push(t3dPrism({ n: 8, y0: base + 0.02, y1: base + 0.62, r0: hr * 1.05, r1: 0, off: [0, -0.22], color: C.hatColor }));
  }
  if (C.hat === 'hood') {
    head.push(t3dPrism({ n: 7, y0: 0.0, y1: 0.05 + hr * 2.5, r0: hr * 1.42, r1: hr * 1.18, cz: -0.03, color: C.hatColor }));
    head.push(t3dPrism({ n: 7, y0: 0.05 + hr * 2.5, y1: 0.05 + hr * 3.2, r0: hr * 1.18, r1: 0, off: [0, -0.1], cz: -0.03, color: C.hatColor }));
    // abertura do rosto
    head.push(t3dBox({ y: eyeY - 0.01, z: hr * 1.02, w: hr * 1.2, h: hr * 1.3, d: 0.03, color: C.faceShadow ? '#1f1a17' : C.skin }));
    if (!C.faceShadow) {
      head.push(t3dBox({ x: 0.05 * hs, y: eyeY, z: hr * 1.05, w: 0.035, h: 0.022, d: 0.02, color: C.eyes || '#111827' }));
      head.push(t3dBox({ x: -0.05 * hs, y: eyeY, z: hr * 1.05, w: 0.035, h: 0.022, d: 0.02, color: C.eyes || '#111827' }));
    }
  }

  // ----- tronco
  const torsoParts = [
    t3dPrism({ n: 6, y0: 0, y1: 0.62, r0: 0.19, r1: 0.25, sx: 1.15, sz: 0.75, twist: Math.PI / 6, color: C.top })
  ];
  if (C.vest) torsoParts.push(t3dPrism({ n: 6, y0: 0.05, y1: 0.5, r0: 0.205, r1: 0.255, sx: 1.12, sz: 0.76, twist: Math.PI / 6, color: C.vest }));
  if (C.straps) {
    torsoParts.push(t3dBox({ y: 0.32, z: 0.165, w: 0.06, h: 0.6, d: 0.03, color: C.straps }).map(f => ({ ...f, v: f.v.map(v => { const a = 0.6; return [v[0] * Math.cos(a) - (v[1] - 0.32) * Math.sin(a), (v[0]) * Math.sin(a) + (v[1] - 0.32) * Math.cos(a) + 0.32, v[2]]; }) })));
  }
  if (C.scarf) torsoParts.push(t3dPrism({ n: 7, y0: 0.5, y1: 0.68, r0: 0.25, r1: 0.16, sx: 1.1, sz: 0.85, color: C.scarf }));
  if (C.cross) {
    torsoParts.push(t3dBox({ y: 0.36, z: 0.17, w: 0.035, h: 0.18, d: 0.02, color: C.cross }));
    torsoParts.push(t3dBox({ y: 0.4, z: 0.17, w: 0.12, h: 0.035, d: 0.02, color: C.cross }));
  }
  if (C.cape) torsoParts.push(t3dPrism({ n: 6, y0: -0.75, y1: 0.6, r0: 0.34, r1: 0.22, sz: 0.5, cz: -0.08, color: C.cape, jag: 0.06, bottom: false }).filter((f, i) => i < 2 || i === 5));
  const backKids = (C.back || []).map((b, i) => t3dItemNode(`back${i}`, b.kind, C, b.pos, b.rot));
  if (C.quiver) {
    backKids.push(t3dNode('quiver', [0.08, 0.35, -0.2], [
      t3dPrism({ n: 6, y0: -0.3, y1: 0.25, r0: 0.07, r1: 0.08, color: C.quiver }),
      ...[-0.03, 0.02, 0.05].map((x, i) => t3dBox({ x, y: 0.32 + i * 0.02, z: (i - 1) * 0.02, w: 0.025, h: 0.12, d: 0.04, color: '#111827' }))
    ], [], [0, 0, -0.35]));
  }

  // ----- quadril e saia
  const hipParts = [
    t3dBox({ y: 0, w: 0.36, h: 0.2, d: 0.24, color: C.robe || C.pants || '#374151' })
  ];
  if (C.robe) {
    const len = C.robeLen || 0.78;
    hipParts.push(t3dPrism({ n: 8, y0: -len, y1: 0.06, r0: C.robeFlare || 0.34, r1: 0.2, sz: 0.85, color: C.robe, jag: C.robeJag ?? 0.05 }));
    if (C.robe2) hipParts.push(t3dPrism({ n: 4, y0: -len * 0.92, y1: 0.04, r0: 0.16, r1: 0.11, cz: 0.17, sz: 0.4, twist: Math.PI / 4, color: C.robe2 }));
  }
  if (C.belt) hipParts.push(t3dPrism({ n: 8, y0: 0.03, y1: 0.12, r0: 0.215, r1: 0.215, sx: 1.08, sz: 0.85, color: C.belt }));
  if (C.buckle) hipParts.push(t3dBox({ y: 0.075, z: 0.19, w: 0.08, h: 0.07, d: 0.02, color: C.buckle }));
  if (C.sash) hipParts.push(t3dBox({ x: 0.06, y: -0.15, z: 0.19, w: 0.07, h: 0.32, d: 0.02, color: C.sash }));
  if (C.bag) hipParts.push(t3dBox({ x: -0.24, y: -0.05, z: 0.04, w: 0.08, h: 0.17, d: 0.2, color: C.bag }));
  if (C.books) hipParts.push(t3dBox({ x: 0.2, y: -0.04, z: 0.12, w: 0.1, h: 0.14, d: 0.12, color: C.books }));

  const root = t3dNode('root', [0, 0, 0], [], [
    t3dNode('hips', [0, 0.86, 0], hipParts, [
      leg('L'), leg('R'),
      t3dNode('torso', [0, 0.06, 0], torsoParts, [
        t3dNode('head', [0, 0.6, 0], head),
        arm('L'), arm('R'),
        ...backKids
      ])
    ])
  ]);
  return { root, style: C.attack || 'sword', name: C.name };
}

/* ---------- poses ---------- */

const T3D_ANIMS = ['idle', 'walk', 'attack', 'cast', 'item'];
const t3dSmooth = (k) => k * k * (3 - 2 * k);
const t3dSeg = (k, a, b) => Math.max(0, Math.min(1, (k - a) / (b - a)));

/**
 * Pose de um boneco: anim, t (s desde o início), style (sword|bow|staff|fist|dagger|katana).
 * Devolve { pose, rootOffset, flags }.
 */
function t3dPose(anim, t, style) {
  if (style === 'proto') return t3dProtoPose(anim, t);
  const P = {};
  const flags = [];
  let ro = [0, 0, 0];
  const br = Math.sin(t * 2.2);
  // base parado
  P.torso = [br * 0.02, 0, 0];
  P.head = [0, Math.sin(t * 0.7) * 0.12, 0];
  P.armL = [0.05, 0, 0.1 + br * 0.03];
  P.armR = [0.05, 0, -0.1 - br * 0.03];
  P.foreL = [-0.25, 0, 0];
  P.foreR = [-0.25, 0, 0];
  if (style === 'bow') P.armL = [-0.35, 0, 0.12];
  if (style === 'staff') { P.armR = [-0.35, 0, -0.15]; P.foreR = [-0.6, 0, 0]; }
  ro = [0, br * 0.008, 0];

  if (anim === 'walk') {
    const ph = t * 7.5;
    const s = Math.sin(ph);
    P.legL = [s * 0.55, 0, 0];
    P.legR = [-s * 0.55, 0, 0];
    P.shinL = [Math.max(0, -Math.cos(ph)) * 0.8, 0, 0];
    P.shinR = [Math.max(0, Math.cos(ph)) * 0.8, 0, 0];
    if (style !== 'bow') P.armL = [-s * 0.45, 0, 0.1];
    if (style !== 'staff') P.armR = [s * 0.45, 0, -0.1];
    P.torso = [0.1, s * 0.08, 0];
    ro = [0, Math.abs(Math.cos(ph)) * 0.05, 0];
  }

  if (anim === 'attack') {
    const T = 1.1, k = (t % T) / T;
    if (style === 'bow') {
      // de lado para o alvo: braço esquerdo esticado com o arco, mão direita puxa a corda até o queixo
      const draw = t3dSmooth(t3dSeg(k, 0.08, 0.5)) * (1 - t3dSmooth(t3dSeg(k, 0.62, 0.7)));
      const aim = t3dSmooth(t3dSeg(k, 0, 0.15)) * (1 - t3dSmooth(t3dSeg(k, 0.85, 1)));
      P.torso = [0, -1.25 * aim, 0];
      P.head = [0, 1.15 * aim, 0];
      P.armL = [0, 0, 0.1 + 1.45 * aim];
      P.foreL = [0, 0, 0];
      P.itemL = [0, 0, -Math.PI / 2 * aim];
      P.armR = [-0.15 * aim, 0, (1.5 - 0.95 * draw) * aim];
      P.foreR = [-2.1 * draw * aim, 0, 0];
    } else if (style === 'fist') {
      const punch = t3dSmooth(t3dSeg(k, 0.25, 0.4)) * (1 - t3dSmooth(t3dSeg(k, 0.55, 0.85)));
      P.torso = [0.1, -0.5 * punch + 0.2 * (1 - punch), 0];
      P.armR = [-1.55 * punch - 0.6 * (1 - punch), 0, -0.1];
      P.foreR = [-1.4 * (1 - punch), 0, 0];
      P.armL = [-0.8, 0, 0.2]; P.foreL = [-1.5, 0, 0];
      ro = [0, 0, 0.12 * punch];
    } else if (style === 'dagger') {
      const stab = t3dSmooth(t3dSeg(k, 0.3, 0.42)) * (1 - t3dSmooth(t3dSeg(k, 0.55, 0.85)));
      P.torso = [0.15 * stab, -0.4 * stab, 0];
      P.armR = [-0.5 - 1.1 * stab, 0, -0.15];
      P.foreR = [-1.0 * (1 - stab), 0, 0];
      ro = [0, 0, 0.1 * stab];
    } else {
      // espada/katana/cajado: ergue e desce
      const up = t3dSmooth(t3dSeg(k, 0.0, 0.38));
      const down = t3dSmooth(t3dSeg(k, 0.4, 0.55));
      const back = t3dSmooth(t3dSeg(k, 0.7, 1));
      const raise = (-2.7 * up + 2.0 * down) * (1 - back);
      P.armR = [raise + (style === 'staff' ? -0.35 : 0) * back, 0, -0.15];
      P.foreR = [-0.4 * up * (1 - down), 0, 0];
      P.torso = [0.25 * down * (1 - back), (0.35 * up - 0.7 * down) * (1 - back), 0];
      P.armL = [-0.4 * down * (1 - back), 0, 0.3];
      ro = [0, 0, 0.12 * down * (1 - back)];
      if (style === 'staff') { P.armL = [-0.3, 0, 0.2]; }
    }
  }

  if (anim === 'cast') {
    const T = 1.4, k = (t % T) / T;
    const up = t3dSmooth(t3dSeg(k, 0, 0.35));
    const push = t3dSmooth(t3dSeg(k, 0.45, 0.6)) * (1 - t3dSmooth(t3dSeg(k, 0.8, 1)));
    P.armL = [-1.2 * up - 0.5 * push, 0, 0.35 - 0.25 * push];
    P.armR = [-1.2 * up - 0.5 * push, 0, -0.35 + 0.25 * push];
    if (style === 'staff') { P.armR = [-2.4 * up, 0, -0.1]; P.foreR = [-0.2, 0, 0]; }
    P.foreL = [-0.6 * (1 - push), 0, 0];
    if (style !== 'staff') P.foreR = [-0.6 * (1 - push), 0, 0];
    P.torso = [-0.12 * up + 0.15 * push, 0, 0];
    P.head = [-0.15 * up, 0, 0];
    ro = [0, 0.06 * up * (1 - push), 0];
    flags.push('cast');
  }

  if (anim === 'item') {
    const T = 1.4, k = (t % T) / T;
    const lift = t3dSmooth(t3dSeg(k, 0.05, 0.35)) * (1 - t3dSmooth(t3dSeg(k, 0.8, 1)));
    const tilt = t3dSmooth(t3dSeg(k, 0.35, 0.5)) * (1 - t3dSmooth(t3dSeg(k, 0.7, 0.85)));
    P.armR = [-1.0 * lift, 0, 0.35 * lift - 0.1];
    P.foreR = [-1.9 * lift, 0, 0];
    P.head = [-0.35 * tilt, 0, 0];
    P.torso = [-0.08 * tilt, 0, 0];
    flags.push('item');
  }
  return { pose: P, rootOffset: ro, flags };
}
