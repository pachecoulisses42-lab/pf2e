/* ============================================================================
   1n. TOKENS 3D — Guerreiro de miniatura (protótipo "Pathfinder 3D Heroes")
   Porte do guerreiro procedural do protótipo (Three.js) para o motor do app:
   mesmas peças, cores, base de miniatura e animações (parado, andar, ataque,
   magia, atingido, morte, vitória), sem dependências e funcionando offline.
   As medidas do original são reduzidas por T3D_PROTO_S para a escala dos bonecos.
   ============================================================================ */

const T3D_PROTO_S = 0.74;
const T3D_PROTO_COLORS = {
  steel: '#abb5b9', dark: '#344759', blue: '#245277', gold: '#c79a49', skin: '#c28e65', wood: '#63452e', black: '#292827'
};

function t3dProtoFighter() {
  const S = T3D_PROTO_S;
  const K = T3D_PROTO_COLORS;
  // CylinderGeometry(raioTopo, raioBase, altura, lados) centrada em y
  const cyl = (rTop, rBot, h, color, y = 0, n = 10, x = 0, z = 0) =>
    t3dPrism({ n, y0: (y - h / 2) * S, y1: (y + h / 2) * S, r0: rBot * S, r1: rTop * S, cx: x * S, cz: z * S, color });
  const box = (w, h, d, color, x = 0, y = 0, z = 0) => t3dBox({ x: x * S, y: y * S, z: z * S, w: w * S, h: h * S, d: d * S, color });
  const sphere = (r, color, x = 0, y = 0, z = 0) => {
    const R = r * S, cy = y * S, ring = (yy, rr) => ({ y: cy + yy * R, r: rr * R });
    const a = ring(-1, 0.35), b = ring(-0.45, 0.92), c = ring(0.45, 0.92), d = ring(1, 0.35);
    return [
      t3dPrism({ n: 8, y0: a.y, y1: b.y, r0: a.r, r1: b.r, cx: x * S, cz: z * S, color, top: false }),
      t3dPrism({ n: 8, y0: b.y, y1: c.y, r0: b.r, r1: c.r, cx: x * S, cz: z * S, color, top: false, bottom: false }),
      t3dPrism({ n: 8, y0: c.y, y1: d.y, r0: c.r, r1: d.r, cx: x * S, cz: z * S, color, bottom: false })
    ].flat();
  };
  // disco de frente (eixo do cilindro em z), como o escudo sextavado do original
  const faceDisk = (r, depth, color, z = 0, n = 6) =>
    t3dPrism({ n, y0: -depth / 2 * S, y1: depth / 2 * S, r0: r * S, r1: r * S, color, twist: Math.PI / 6 })
      .map(f => ({ ...f, v: f.v.map(v => [v[0], -v[2], v[1] + z * S]) }));
  const at = (x, y, z) => [x * S, y * S, z * S];

  const leg = (name, s) => t3dNode(name, at(s * 0.23, -0.13, 0), [
    cyl(0.15, 0.13, 0.58, K.blue, -0.28),
    cyl(0.17, 0.12, 0.15, K.steel, -0.55),
    box(0.25, 0.18, 0.43, K.black, 0, -0.72, 0.09)
  ]);

  // braço do original: grupo no ombro, pendurado em -y; o item fica num subgrupo
  const arm = (name, s, held) => {
    const hand = t3dNode(name === 'armShield' ? 'handL' : 'handR', at(0, -0.67, 0), [sphere(0.12, K.skin)], held ? [held] : []);
    hand.anchor = true;
    return t3dNode(name, at(s * 0.42, 0.55, 0), [
      sphere(0.2, K.steel),
      cyl(0.12, 0.11, 0.48, K.blue, -0.28),
      cyl(0.14, 0.12, 0.23, K.steel, -0.52)
    ], [hand]);
  };
  // escudo e espada como no original (posições relativas ao ombro, convertidas para a mão)
  const shield = t3dNode('shield', at(-0.05, 0.12, 0.28), [
    faceDisk(0.34, 0.065, K.steel, 0),
    faceDisk(0.28, 0.07, K.blue, 0.045),
    sphere(0.09, K.gold, 0, 0, 0.095)
  ], [], [0, -0.18, 0]);
  const sword = t3dNode('sword', at(0, -0.03, 0.1), [
    cyl(0.045, 0.045, 0.35, K.wood, -0.08, 6),
    box(0.36, 0.055, 0.09, K.gold, 0, 0.1, 0),
    box(0.095, 0.75, 0.055, K.steel, 0, 0.49, 0),
    t3dPrism({ n: 4, y0: 0.87 * S, y1: 1.07 * S, r0: 0.067 * S, r1: 0, twist: Math.PI / 4, color: K.steel })
  ]);

  const torso = t3dNode('torso', at(0, 0.38, 0), [
    cyl(0.36, 0.29, 0.7, K.steel, 0.27, 8),
    box(0.2, 0.43, 0.055, K.blue, 0, 0.27, 0.34),
    box(0.12, 0.14, 0.08, K.gold, 0, 0.27, 0.39)
  ], [
    t3dNode('head', [0, 0, 0], [
      cyl(0.12, 0.12, 0.18, K.skin, 0.72),
      sphere(0.22, K.skin, 0, 0.91, 0),
      t3dBox({ x: 0.075 * S, y: 0.93 * S, z: 0.205 * S, w: 0.05 * S, h: 0.04 * S, d: 0.02 * S, color: '#1f2937' }).map(f => ({ ...f, detail: true })),
      t3dBox({ x: -0.075 * S, y: 0.93 * S, z: 0.205 * S, w: 0.05 * S, h: 0.04 * S, d: 0.02 * S, color: '#1f2937' }).map(f => ({ ...f, detail: true })),
      cyl(0.245, 0.2, 0.2, K.steel, 1.07, 10),
      box(0.07, 0.14, 0.05, K.gold, 0, 1.17, 0.22)
    ]),
    arm('armShield', -1, shield),
    arm('armSword', 1, sword)
  ]);

  const hips = t3dNode('hips', at(0, 1.15, 0), [
    box(0.68, 0.36, 0.39, K.dark),
    box(0.67, 0.12, 0.45, K.gold, 0, 0.1, 0)
  ], [leg('legR', -1), leg('legL', 1), torso]);

  const root = t3dNode('root', [0, 0, 0], [
    // base da miniatura
    cyl(0.77, 0.82, 0.16, K.dark, 0.08, 24),
    cyl(0.72, 0.76, 0.035, K.gold, 0.18, 24)
  ], [t3dNode('figure', [0, 0, 0], [], [hips])]);
  return { root, style: 'proto', name: 'Guerreiro de Miniatura' };
}

/**
 * Animações do protótipo. Nomes do app: idle, walk, attack, cast, item, hit, dead, victory
 * (item usa o parado; o original não tem poção).
 */
function t3dProtoPose(anim, t) {
  const S = T3D_PROTO_S;
  const P = { armShield: [0, 0, -0.18], armSword: [0, 0, 0.18] };
  const offsets = {};
  const flags = [];
  if (anim === 'idle' || anim === 'item') {
    P.torso = [0, 0, Math.sin(t * 1.8) * 0.018];
    P.armSword = [0, 0, 0.14 + Math.sin(t * 1.8) * 0.03];
  }
  if (anim === 'walk' || anim === 'run') {
    const speed = anim === 'run' ? 12 : 7;
    const a = Math.sin(t * speed) * (anim === 'run' ? 0.65 : 0.4);
    P.legR = [a, 0, 0];
    P.legL = [-a, 0, 0];
    P.armShield = [-a * 0.6, 0, -0.18];
    P.armSword = [a * 0.6, 0, 0.18];
    offsets.figure = [0, Math.abs(Math.sin(t * speed)) * 0.055 * S, 0];
  }
  if (anim === 'attack') {
    const phase = (t % 1.1) / 1.1;
    const sw = Math.sin(phase * Math.PI);
    P.armSword = [-sw * 0.9, 0, -0.4 - sw * 1.7];
    P.torso = [0, sw * 0.35, 0];
  }
  if (anim === 'cast') {
    P.armShield = [0, 0, -1.6];
    P.armSword = [0, 0, 1.6];
    offsets.figure = [0, (0.04 + Math.sin(t * 4) * 0.035) * S, 0];
    flags.push('cast');
  }
  if (anim === 'hit') {
    P.torso = [-0.22 + Math.sin(t * 13) * 0.08, 0, 0];
    offsets.figure = [0, 0, -0.1 * S];
  }
  if (anim === 'dead') {
    const k = Math.min(t / 1.1, 1);
    // no original a figura afunda 0,45 e o piso 3D esconde o resto; aqui não há piso, então ela
    // tomba e fica deitada na altura da base
    P.figure = [0, 0, -k * Math.PI * 0.46];
    offsets.figure = [-k * 0.35 * S, k * 0.28 * S, 0];
  }
  if (anim === 'victory') {
    P.armSword = [0, 0, -2.8];
    P.armShield = [0, 0, 1];
    offsets.figure = [0, Math.abs(Math.sin(t * 4)) * 0.045 * S, 0];
  }
  return { pose: P, rootOffset: [0, 0, 0], flags, offsets };
}
