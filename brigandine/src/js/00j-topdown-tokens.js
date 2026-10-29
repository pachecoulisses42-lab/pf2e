/* ============================================================================
   1k. TOKENS VISTOS DE CIMA — os 22 personagens
   Ordem das camadas em cada arte: capa/costas → pernas → arma atrás → tronco
   → ombros → braços e armas → cabeça.
   ============================================================================ */
(() => {
  const T = TDK;
  const SK = '#e2b490', SK2 = '#c98e64', SK3 = '#8a5a3c';
  const art = (key, fn) => { TOPDOWN_SVGS[key] = () => T.frame(`t_${key}`, fn); };

  /* ------------------------------ HERÓIS ------------------------------ */

  art('guerreiro', (p) =>
    T.cape(p, '#2f4f86', { sway: -12 }) +
    T.feet(p, { pants: '#4a4a52', boot: '#3a2a20', stride: 10 }) +
    T.torso(p, '#8a929e') +
    T.pauldrons(p, '#a4adb8') +
    T.sword(p, [176, 168], [204, 232]) +
    T.arm(p, 1, [176, 166], '#7a828e', SK) +
    T.arm(p, -1, [90, 156], '#7a828e', SK) +
    T.shield(p, 80, 156, 32, { c1: '#b8382e', c2: '#e8d8b0', pattern: 'quarters' }) +
    T.head(p, { skin: SK, style: 'helmet', helm: '#a8b0ba', plume: '#c23a2e' }));

  art('paladino', (p) =>
    T.cape(p, '#e8e2d2', { sway: 10, width: 62 }) +
    T.feet(p, { pants: '#6a6a72', boot: '#5a4632', stride: 6 }) +
    T.torso(p, '#c8ccd2') +
    T.pauldrons(p, '#d8c27a') +
    T.mace(p, [178, 168], [196, 214]) +
    T.arm(p, 1, [178, 166], '#b8bcc4', SK) +
    T.arm(p, -1, [92, 158], '#b8bcc4', SK) +
    T.kite(p, 84, 158, 1.05, { face: '#f2ecdc', c1: '#c9a24a', rim: '#c9a24a' }) +
    T.head(p, { skin: SK, style: 'helmet', helm: '#d8dce2', plume: '#f2ecdc' }));

  art('barbaro', (p) =>
    T.feet(p, { pants: '#6a4a30', boot: '#4a3020', stride: 12, spread: 18 }) +
    T.axe(p, [92, 172], [190, 206], { double: true, size: 1.15 }) +
    T.torso(p, SK2, { rx: 54, ry: 32 }) +
    T.fur(p, '#8a6a48', { r: 38 }) +
    T.arm(p, -1, [96, 170], SK2, SK2, { w: 16 }) +
    T.arm(p, 1, [150, 182], SK2, SK2, { w: 16 }) +
    T.head(p, { skin: SK2, style: 'long', hair: '#b8452a', beard: '#b8452a' }));

  art('clerigo', (p) =>
    T.cape(p, '#e8dcb8', { sway: -6, width: 58 }) +
    T.feet(p, { pants: '#d8ccaa', boot: '#6a4a30', stride: 4 }) +
    T.staff(p, [60, 214], [184, 64], { ornament: 'sun' }) +
    T.torso(p, '#f0e6c8') +
    `<path d="M108 106 L148 106 L144 150 L112 150Z" fill="#c9a24a" opacity="0.85"/>` +
    T.arm(p, 1, [154, 96], '#e8dcb8', SK) +
    T.arm(p, -1, [96, 162], '#e8dcb8', SK) +
    T.mace(p, [96, 162], [104, 204], { head: '#c9a24a' }) +
    T.head(p, { skin: SK, style: 'hood', hair: '#efe4c4' }));

  art('bardo', (p) =>
    T.cape(p, '#9a2a3a', { sway: 14, len: 84 }) +
    T.feet(p, { pants: '#3a3a5a', boot: '#5a3a22', stride: -8 }) +
    T.torso(p, '#4a6a9a') +
    `<path d="M100 120 Q128 132 156 120" stroke="#e8c04a" stroke-width="3" fill="none"/>` +
    T.lute(p, [196, 132], [150, 178]) +
    T.arm(p, 1, [190, 136], '#4a6a9a', SK) +
    T.arm(p, -1, [140, 176], '#4a6a9a', SK) +
    T.head(p, { skin: SK, style: 'wide-hat', hat: '#7a2a3a', trim: '#e8c04a', plume: '#f2ecdc' }));

  art('feiticeiro', (p) =>
    T.cape(p, '#7a2a1e', { sway: -8, len: 100, width: 58 }) +
    T.feet(p, { pants: '#4a2a22', boot: '#3a2018', stride: 6 }) +
    T.torso(p, '#b84a2a') +
    `<path d="M128 100 L128 154" stroke="#e8a040" stroke-width="3.4"/>` +
    T.arm(p, -1, [78, 174], '#b84a2a', SK) +
    T.arm(p, 1, [180, 172], '#b84a2a', SK) +
    T.flame(p, [74, 182], '#ff8a2a', 1.05) +
    T.flame(p, [184, 180], '#ff8a2a', 0.9) +
    T.head(p, { skin: SK, style: 'short', hair: '#e0e0e8' }));

  art('mago', (p) =>
    T.cape(p, '#2a3a7a', { sway: 8, len: 104, width: 60 }) +
    T.feet(p, { pants: '#2a3a6a', boot: '#3a2a22', stride: 4 }) +
    T.staff(p, [190, 214], [174, 56], { ornament: 'orb', color: '#7fd8ff' }) +
    T.torso(p, '#34489a') +
    T.arm(p, 1, [178, 140], '#34489a', SK) +
    T.arm(p, -1, [96, 168], '#34489a', SK) +
    T.book(p, [92, 180], '#6a2a2a', -12) +
    T.head(p, { skin: SK, style: 'pointed-hat', hat: '#2e3e8a', trim: '#e8c04a', beard: '#e8e4dc' }));

  art('ranger', (p) =>
    T.cape(p, '#3e5a32', { sway: -14, len: 90 }) +
    T.quiver(p, [150, 76], [170, 40]) +
    T.feet(p, { pants: '#5a4a32', boot: '#4a3220', stride: 14, spread: 18 }) +
    T.torso(p, '#5a7a3e') +
    T.bow(p, [92, 186], [0, 1], { drawHand: [100, 140] }) +
    T.arm(p, -1, [92, 186], '#4a6a32', SK) +
    T.arm(p, 1, [100, 140], '#4a6a32', SK, { shoulder: [166, 124] }) +
    T.head(p, { skin: SK, style: 'hood', hair: '#3e5a32' }));

  art('rogue', (p) =>
    T.cape(p, '#2a2a32', { sway: 12, len: 80, width: 54 }) +
    T.feet(p, { pants: '#2a2a30', boot: '#1e1a18', stride: 12, spread: 20 }) +
    T.torso(p, '#3a3a44') +
    `<path d="M88 140 Q128 152 168 140" stroke="#6a4a2a" stroke-width="5" fill="none"/>` +
    T.dagger(p, [80, 168], [62, 206]) +
    T.dagger(p, [178, 166], [198, 204]) +
    T.arm(p, -1, [80, 166], '#3a3a44', SK) +
    T.arm(p, 1, [178, 164], '#3a3a44', SK) +
    T.head(p, { skin: SK, style: 'hood', hair: '#26262e' }));

  art('druida', (p) =>
    T.cape(p, '#3f6a3a', { sway: -10, len: 96 }) +
    T.feet(p, { pants: '#5a4a32', boot: '#4a3426', stride: 6 }) +
    T.staff(p, [70, 214], [80, 58], { ornament: 'leaves', wood: '#6a4a2a' }) +
    T.torso(p, '#5f8e4a') +
    T.fur(p, '#8a7050', { r: 34 }) +
    T.arm(p, -1, [80, 120], '#5f8e4a', SK) +
    T.arm(p, 1, [178, 170], '#5f8e4a', SK) +
    T.orb(p, [184, 178], '#8fe07a', 8) +
    T.head(p, { skin: SK, style: 'long', hair: '#8a5a2a', ears: 'pointed' }) +
    T.shape('M108 96 L94 70 L112 88Z M148 96 L162 70 L144 88Z', '#c9a86a'));

  art('monge', (p) =>
    T.feet(p, { pants: '#d88a2a', boot: '#8a5a32', stride: 14, spread: 20 }) +
    T.staff(p, [54, 194], [204, 160], { ornament: 'none', wood: '#8a6038' }) +
    T.torso(p, '#e09a2a', { rx: 46 }) +
    `<path d="M104 104 Q118 128 116 152" stroke="#b8502a" stroke-width="7" fill="none" stroke-linecap="round"/>` +
    T.arm(p, -1, [82, 182], '#e09a2a', SK2) +
    T.arm(p, 1, [176, 164], '#e09a2a', SK2) +
    T.head(p, { skin: SK2, style: 'bald' }) +
    `<circle cx="128" cy="96" r="3" fill="#8a3a2a"/><circle cx="120" cy="100" r="3" fill="#8a3a2a"/><circle cx="136" cy="100" r="3" fill="#8a3a2a"/>`);

  art('alquimista', (p) =>
    T.pack(p, '#7a5232', { cy: 92, w: 48, h: 30 }) +
    T.flask(p, [104, 84], '#6ad0a0') + T.flask(p, [150, 84], '#e05a8a') +
    T.feet(p, { pants: '#5a4a3a', boot: '#3a2a20', stride: 8 }) +
    T.torso(p, '#8a6a4a') +
    `<path d="M92 132 Q128 146 164 132" stroke="#5a3a22" stroke-width="6" fill="none"/>` +
    T.flask(p, [104, 140], '#e8c040') + T.flask(p, [128, 144], '#7ab8e8') + T.flask(p, [152, 140], '#e8603a') +
    T.arm(p, -1, [80, 170], '#9a7a5a', SK) +
    T.arm(p, 1, [178, 170], '#9a7a5a', SK) +
    T.flask(p, [80, 178], '#8ae05a') + T.flask(p, [180, 178], '#e05a3a') +
    T.head(p, { skin: SK, style: 'short', hair: '#c8a040' }) +
    `<path d="M101 116 Q128 108 155 116" stroke="#4a3022" stroke-width="5" fill="none"/>` +
    T.ellipse(114, 118, 7, 6, '#9ad8e0', 0, 1.6) + T.ellipse(142, 118, 7, 6, '#9ad8e0', 0, 1.6));

  art('bruxa', (p) =>
    T.cape(p, '#3a2a4a', { sway: 16, len: 100, width: 60 }) +
    T.feet(p, { pants: '#2a2230', boot: '#1e1a20', stride: 6 }) +
    T.staff(p, [190, 212], [180, 62], { ornament: 'moon', wood: '#4a3a2a' }) +
    T.torso(p, '#4a3a5a') +
    T.arm(p, 1, [182, 142], '#4a3a5a', '#d8c4a8') +
    T.arm(p, -1, [86, 172], '#4a3a5a', '#d8c4a8') +
    T.flask(p, [84, 180], '#7ae05a') +
    T.head(p, { skin: '#d8c4a8', style: 'pointed-hat', hat: '#2a2236', trim: '#7a5aa8' }));

  art('espadachim', (p) =>
    T.cape(p, '#a82a2a', { sway: -18, len: 72, width: 46 }) +
    T.feet(p, { pants: '#2a2a3a', boot: '#3a2418', stride: 18, spread: 16 }) +
    T.torso(p, '#e8e2d2', { rx: 46 }) +
    `<path d="M112 104 L144 104 L142 152 L114 152Z" fill="#2a2a3a"/>` +
    T.sword(p, [186, 158], [228, 214], { w: 2.4, guard: '#c9a24a', blade: '#d8dee6' }) +
    T.arm(p, 1, [186, 156], '#e8e2d2', SK) +
    T.dagger(p, [84, 150], [70, 120]) +
    T.arm(p, -1, [84, 150], '#e8e2d2', SK) +
    T.head(p, { skin: SK, style: 'wide-hat', hat: '#2a2a3a', trim: '#c9a24a', plume: '#c23a3a' }));

  /* ------------------------------ VILÕES ------------------------------ */

  const GOB = '#7aa04a';
  art('goblin', (p) =>
    T.feet(p, { pants: '#5a4a30', boot: '#3a2a1a', stride: 10, spread: 14 }) +
    T.torso(p, '#6a5a3a', { rx: 40, ry: 26, cy: 128 }) +
    T.dagger(p, [168, 160], [188, 196], { blade: '#a0a49a' }) +
    T.arm(p, 1, [168, 158], '#6a5a3a', GOB, { w: 11, shoulder: [160, 126] }) +
    T.arm(p, -1, [94, 154], '#6a5a3a', GOB, { w: 11, shoulder: [96, 126] }) +
    T.shield(p, 88, 156, 22, { wood: '#6a4a2a', c1: '#5a2a1e', c2: null, rim: '#6a6258', pattern: 'cross' }) +
    T.head(p, { skin: GOB, style: 'bald', r: 26, cy: 114, ears: 'pointed' }) +
    `<path d="M112 128 Q120 134 126 130 M130 130 Q136 134 144 128" stroke="#2a2a14" stroke-width="2" fill="none"/>`);

  art('lobo', (p) => {
    const fur = '#6a6670', dark = '#3a363e', belly = '#a8a2a8';
    return T.shape('M120 80 C104 62 100 40 112 18 C118 30 130 26 132 16 C144 36 142 60 136 80Z', p.paint(fur, { fy: 0.6 }), 1.6) + `<path d="M114 26 Q120 22 126 26" stroke="#d8d2d8" stroke-width="5" stroke-linecap="round" fill="none"/>` +
      T.ellipse(104, 186, 10, 16, p.paint(dark), 14) + T.ellipse(152, 186, 10, 16, p.paint(dark), -14) +
      T.ellipse(100, 82, 10, 15, p.paint(dark), -20) + T.ellipse(156, 82, 10, 15, p.paint(dark), 20) +
      T.ellipse(128, 128, 38, 64, p.paint(fur, { fy: 0.3 })) +
      `<path d="M128 70 L128 180" stroke="${dark}" stroke-width="10" opacity="0.45" stroke-linecap="round"/>` +
      `<path d="M104 104 Q116 110 112 124 M152 104 Q140 110 144 124 M102 140 Q114 146 110 160 M154 140 Q142 146 146 160" stroke="${belly}" stroke-width="2" fill="none" opacity="0.6"/>` +
      T.ellipse(128, 190, 28, 26, p.paint(fur, { fy: 0.25 })) +
      T.shape('M106 176 L98 154 L116 170Z M150 176 L158 154 L140 170Z', p.paint(dark)) +
      T.shape('M114 200 Q128 236 142 200 Q128 208 114 200Z', p.paint(belly)) +
      T.ellipse(128, 216, 5, 4, '#1a1414', 0, 1) +
      `<path d="M114 196 L120 200 M142 196 L136 200" stroke="#ffd04a" stroke-width="3.2" stroke-linecap="round"/>`;
  });

  art('bandido', (p) =>
    T.cape(p, '#5a4632', { sway: -10, len: 70, width: 50 }) +
    T.feet(p, { pants: '#4a3a2a', boot: '#2a1e16', stride: 10 }) +
    T.torso(p, '#6a5238') +
    `<path d="M88 116 L168 146" stroke="#3a2a1e" stroke-width="7"/>` +
    T.axe(p, [178, 166], [194, 214], { size: 0.9 }) +
    T.arm(p, 1, [178, 164], '#6a5238', SK) +
    T.dagger(p, [82, 166], [70, 200]) +
    T.arm(p, -1, [82, 164], '#6a5238', SK) +
    T.head(p, { skin: SK, style: 'hood', hair: '#4a3a2a' }) +
    T.shape('M108 126 Q128 140 148 126 L146 136 Q128 148 110 136Z', '#7a2a22', 1.2));

  art('esqueleto', (p) => {
    const bone = '#e2d8be';
    return T.feet(p, { pants: '#c8bea4', boot: '#a89e84', stride: 8, spread: 14 }) +
      T.torso(p, '#5a5248', { rx: 44, ry: 26 }) +
      [-14, -5, 5, 14].map(y => `<path d="M104 ${126 + y} Q128 ${134 + y} 152 ${126 + y}" stroke="${bone}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('') +
      T.sword(p, [176, 164], [200, 222], { blade: '#9a8a6a', guard: '#6a5a3a' }) +
      T.arm(p, 1, [176, 162], bone, bone, { w: 7 }) +
      T.arm(p, -1, [90, 156], bone, bone, { w: 7 }) +
      T.shield(p, 84, 158, 26, { wood: '#5a4232', c1: '#4a3a2a', c2: null, rim: '#7a5a3a', pattern: 'rings' }) +
      T.head(p, { skin: bone, style: 'skull', ears: 'none' });
  });

  const ORC = '#6a8a4a';
  art('orc', (p) =>
    T.cape(p, '#4a3a2a', { sway: 8, len: 76, width: 60 }) +
    T.feet(p, { pants: '#4a3a2a', boot: '#2a2018', stride: 12, spread: 20 }) +
    T.torso(p, '#5a4a3a', { rx: 58, ry: 34 }) +
    T.pauldrons(p, '#6a6a6a', { rx: 24, dx: 46 }) +
    T.axe(p, [184, 170], [206, 224], { size: 1.25, blade: '#8a8e90' }) +
    T.arm(p, 1, [184, 168], ORC, ORC, { w: 18, shoulder: [174, 124] }) +
    T.arm(p, -1, [80, 172], ORC, ORC, { w: 18, shoulder: [82, 124] }) +
    T.head(p, { skin: ORC, style: 'mohawk', hair: '#2a2218', r: 31 }) +
    T.shape('M114 140 L111 128 L118 136Z M142 140 L145 128 L138 136Z', '#f0e8d0', 1.2));

  art('cultista', (p) =>
    T.cape(p, '#6a1a1e', { sway: 6, len: 104, width: 62 }) +
    T.feet(p, { pants: '#3a1a1e', boot: '#1a1214', stride: 4 }) +
    T.torso(p, '#7a1e22') +
    `<path d="M128 100 L128 156 M116 122 L140 122" stroke="#d8b04a" stroke-width="3"/>` +
    T.dagger(p, [176, 166], [190, 200], { blade: '#b0a090', guard: '#3a2a2a' }) +
    T.arm(p, 1, [176, 164], '#7a1e22', '#c8b8a8') +
    T.arm(p, -1, [80, 170], '#7a1e22', '#c8b8a8') +
    T.flame(p, [76, 178], '#b04ae0', 0.95) +
    T.head(p, { skin: '#c8b8a8', style: 'hood', hair: '#5a1418' }));

  const ZB = '#9aaa82';
  art('zumbi', (p) =>
    T.feet(p, { pants: '#4a4a5a', boot: '#3a3430', stride: -14, spread: 14 }) +
    T.torso(p, '#6a6a5a', { rx: 46 }) +
    T.shape('M100 140 L108 150 L114 140 L120 152 L128 142 L134 152 L142 140 L150 150 L156 138 L156 130 L100 132Z', '#6a6a5a', 1) +
    T.arm(p, -1, [102, 210], '#6a6a5a', ZB, { w: 13 }) +
    T.arm(p, 1, [156, 214], '#6a6a5a', ZB, { w: 13 }) +
    T.head(p, { skin: ZB, style: 'short', hair: '#3a3a2a', cx: 124, cy: 114 }) +
    `<path d="M108 98 L120 106 M138 92 L130 104" stroke="#7a2a22" stroke-width="2.4"/>`);

  art('kobold', (p) => {
    const sc = '#c2602e';
    return T.shape('M120 112 C112 80 96 54 82 30 C106 44 124 68 138 108Z', p.paint(sc, { fy: 0.6 }), 1.6) +
      T.feet(p, { pants: '#6a4a2a', boot: '#7a3a1e', stride: 10, spread: 14 }) +
      T.spear(p, [168, 74], [178, 226]) +
      T.torso(p, '#7a5a3a', { rx: 38, ry: 24, cy: 126 }) +
      T.arm(p, 1, [170, 158], sc, sc, { w: 10, shoulder: [158, 124] }) +
      T.arm(p, -1, [96, 156], sc, sc, { w: 10, shoulder: [98, 124] }) +
      T.shape('M98 110 L84 84 L110 100Z M158 110 L172 84 L146 100Z', p.paint('#e8dcc0')) +
      T.ellipse(128, 110, 24, 24, p.paint(sc, { fy: 0.25 })) +
      T.ellipse(128, 138, 13, 17, p.paint(sc, { hi: 0.4 })) +
      `<circle cx="123" cy="150" r="1.8" fill="#2a1410"/><circle cx="133" cy="150" r="1.8" fill="#2a1410"/>` +
      `<path d="M114 122 L120 126 M142 122 L136 126" stroke="#ffd84a" stroke-width="3" stroke-linecap="round"/>`;
  });
})();
