/* ============================================================================
   1n. TOKENS 3D — quadrúpede (lobos)
   Corpo, cabeça com mandíbula, 4 patas de dois segmentos e cauda. Poses: parado,
   andar, morder (ataque), uivar (no lugar de magia), ser atingido. Poção e
   pergaminho não se aplicam (fica parado).
   ============================================================================ */

/**
 * cfg: { name, fur, belly, muzzle, eyes, eyeGlow, scar, armor, armorTrim, mane, glow (espectral) }
 */
function t3dQuadruped(cfg) {
  const C = cfg;
  const fur = C.fur || '#6b7280';
  const glowy = (faces) => (C.glow ? faces.flat().map(f => ({ ...f, glow: true })) : faces);

  const leg = (name, x, z) => t3dNode(name, [x, -0.04, z], glowy([
    t3dPrism({ n: 6, y0: -0.32, y1: 0.04, r0: 0.06, r1: 0.085, color: fur })
  ]), [
    t3dNode(name.replace('leg', 'shin'), [0, -0.3, 0], glowy([
      t3dPrism({ n: 6, y0: -0.27, y1: 0.02, r0: 0.045, r1: 0.06, color: fur }),
      t3dBox({ y: -0.27, z: 0.04, w: 0.1, h: 0.05, d: 0.14, color: C.paws || fur })
    ]))
  ]);

  const headParts = [
    t3dPrism({ n: 6, y0: -0.12, y1: 0.14, r0: 0.14, r1: 0.13, sx: 1.05, twist: Math.PI / 6, color: fur }),
    // focinho (ao longo de z)
    t3dAxisZ(t3dPrism({ n: 6, y0: 0.08, y1: 0.36, r0: 0.09, r1: 0.055, sz: 0.8, cz: 0.02, color: C.muzzle || fur })),
    t3dBox({ y: 0.02, z: 0.37, w: 0.06, h: 0.05, d: 0.04, color: '#111827' }).map(f => ({ ...f, detail: true })),
    ...[1, -1].map(s => t3dPrism({ n: 4, y0: 0.1, y1: 0.3, r0: 0.055, r1: 0, cx: s * 0.08, cz: -0.02, off: [s * 0.02, -0.02], color: fur })),
    ...[1, -1].map(s => t3dBox({ x: s * 0.07, y: 0.06, z: 0.12, w: 0.04, h: 0.025, d: 0.02, color: C.eyeGlow || C.eyes || '#facc15' }).map(f => ({ ...f, detail: true, glow: !!C.eyeGlow })))
  ];
  if (C.scar) headParts.push(t3dBox({ x: 0.04, y: 0.08, z: 0.135, w: 0.02, h: 0.14, d: 0.01, color: C.scar }).map(f => ({ ...f, detail: true })));
  if (C.armor) headParts.push(t3dPrism({ n: 6, y0: 0.06, y1: 0.16, r0: 0.15, r1: 0.12, color: C.armor }));

  const bodyParts = [
    t3dAxisZ(t3dPrism({ n: 7, y0: -0.48, y1: 0.42, r0: 0.17, r1: 0.21, sx: 0.85, sz: 1.05, twist: Math.PI / 7, color: fur })),
    t3dBox({ y: -0.13, z: -0.02, w: 0.2, h: 0.08, d: 0.6, color: C.belly || fur })
  ];
  if (C.mane) bodyParts.push(t3dAxisZ(t3dPrism({ n: 7, y0: 0.18, y1: 0.48, r0: 0.25, r1: 0.18, sx: 0.95, sz: 1.1, jag: 0.15, color: C.mane })));
  if (C.armor) {
    bodyParts.push(t3dBox({ y: 0.17, z: 0.05, w: 0.3, h: 0.08, d: 0.55, color: C.armor }));
    if (C.armorTrim) bodyParts.push(t3dBox({ y: 0.22, z: 0.05, w: 0.06, h: 0.04, d: 0.5, color: C.armorTrim }));
  }

  const root = t3dNode('root', [0, 0, 0], [], [
    t3dNode('body', [0, 0.62, 0], glowy(bodyParts), [
      t3dNode('head', [0, 0.16, 0.5], glowy(headParts), [
        t3dNode('jaw', [0, -0.06, 0.12], glowy([t3dBox({ y: -0.03, z: 0.13, w: 0.11, h: 0.04, d: 0.24, color: C.muzzle || fur, taper: 0.8 })]))
      ]),
      leg('legFL', 0.12, 0.33), leg('legFR', -0.12, 0.33), leg('legBL', 0.12, -0.36), leg('legBR', -0.12, -0.36),
      t3dNode('tail', [0, 0.08, -0.5], glowy([t3dPrism({ n: 6, y0: 0, y1: 0.48, r0: 0.07, r1: 0.025, color: C.tail || fur, jag: 0.1 })]), [], [-2.3, 0, 0])
    ])
  ]);
  const hand = (n) => t3dFind(root, n);
  hand('head').anchor = true;
  return { root, style: 'bite', name: C.name, kind: 'quad' };
}

/** Poses do quadrúpede. 'cast' vira uivo; 'item' e 'scroll' ficam parados. */
function t3dQuadPose(anim, t) {
  const P = {};
  const flags = [];
  let ro = [0, 0, 0];
  const br = Math.sin(t * 2.2);
  P.body = [br * 0.015, 0, 0];
  P.head = [0.05 + br * 0.03, Math.sin(t * 0.8) * 0.15, 0];
  P.tail = [0, Math.sin(t * 3) * 0.35, 0];

  if (anim === 'walk') {
    const ph = t * 7.5, s = Math.sin(ph);
    P.legFL = [s * 0.55, 0, 0]; P.legBR = [s * 0.55, 0, 0];
    P.legFR = [-s * 0.55, 0, 0]; P.legBL = [-s * 0.55, 0, 0];
    P.shinFL = [Math.max(0, Math.cos(ph)) * 0.7, 0, 0]; P.shinBR = [-Math.max(0, Math.cos(ph)) * 0.6, 0, 0];
    P.shinFR = [Math.max(0, -Math.cos(ph)) * 0.7, 0, 0]; P.shinBL = [-Math.max(0, -Math.cos(ph)) * 0.6, 0, 0];
    P.head = [0.12 + Math.cos(ph * 2) * 0.05, 0, 0];
    P.tail = [0.3, Math.sin(ph) * 0.3, 0];
    ro = [0, Math.abs(Math.cos(ph)) * 0.04, 0];
  }
  if (anim === 'attack') {
    // agacha, salta para a frente e morde
    const T = 1.1, k = (t % T) / T;
    const crouch = t3dSmooth(t3dSeg(k, 0, 0.3)) * (1 - t3dSmooth(t3dSeg(k, 0.3, 0.42)));
    const lunge = t3dSmooth(t3dSeg(k, 0.32, 0.45)) * (1 - t3dSmooth(t3dSeg(k, 0.6, 0.95)));
    const bite = t3dSmooth(t3dSeg(k, 0.4, 0.46)) * (1 - t3dSmooth(t3dSeg(k, 0.46, 0.52)));
    P.body = [0.15 * crouch - 0.12 * lunge, 0, 0];
    P.head = [0.25 * crouch - 0.2 * lunge, 0, 0];
    P.jaw = [0.7 * (lunge - bite * 0.9), 0, 0];
    P.legFL = [-0.6 * lunge, 0, 0]; P.legFR = [-0.6 * lunge, 0, 0];
    P.legBL = [0.5 * lunge - 0.3 * crouch, 0, 0]; P.legBR = [0.5 * lunge - 0.3 * crouch, 0, 0];
    P.shinBL = [-0.5 * crouch, 0, 0]; P.shinBR = [-0.5 * crouch, 0, 0];
    P.tail = [0.6 * lunge, 0, 0];
    ro = [0, -0.1 * crouch + 0.12 * lunge, 0.32 * lunge];
  }
  if (anim === 'cast') {
    // uivo: senta nas patas de trás e ergue a cabeça
    const T = 1.4, k = (t % T) / T;
    const up = t3dSmooth(t3dSeg(k, 0, 0.3)) * (1 - t3dSmooth(t3dSeg(k, 0.85, 1)));
    P.body = [-0.45 * up, 0, 0];
    P.head = [-0.9 * up, 0, 0];
    P.jaw = [0.55 * up, 0, 0];
    P.legBL = [0.9 * up, 0, 0]; P.legBR = [0.9 * up, 0, 0];
    P.shinBL = [-1.2 * up, 0, 0]; P.shinBR = [-1.2 * up, 0, 0];
    P.legFL = [0.45 * up, 0, 0]; P.legFR = [0.45 * up, 0, 0];
    P.tail = [0.5 * up, 0, 0];
    ro = [0, -0.12 * up, 0];
    flags.push('cast');
  }
  if (anim === 'hit') {
    const T = 0.8, k = (t % T) / T;
    const jolt = t3dSmooth(t3dSeg(k, 0, 0.12)) * (1 - t3dSmooth(t3dSeg(k, 0.3, 1)));
    P.body = [-0.2 * jolt, 0.2 * jolt, 0.1 * jolt];
    P.head = [-0.35 * jolt, -0.3 * jolt, 0];
    P.jaw = [0.3 * jolt, 0, 0];
    P.tail = [-0.4 * jolt, 0, 0];
    ro = [0, 0, -0.2 * jolt];
    if (k < 0.18) flags.push('hitFlash');
  }
  return { pose: P, rootOffset: ro, flags };
}
