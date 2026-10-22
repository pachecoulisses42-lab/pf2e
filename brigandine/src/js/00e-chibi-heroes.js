/* ============================================================================
   1e. TOKENS CHIBI — HERÓIS
   ============================================================================ */
const { INK: CI, blob: cb, ell: ce, circ: cc, cap: ccap, shine: csh, legs: clegs, torso: ctorso, arm: carm, head: chead } = CB;
const SKIN = '#f3c29b';

CHIBI_SVGS.guerreiro = () => CB.frame('c_guerreiro', {
  faction: 'hero', accent: '#4fa3e0',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'angry', eyeColor: '#3f78a8', mouth: 'open', browTilt: 1, blush: false });
    return { body: `
      ${cb('M90 146 Q70 192 84 216 L172 216 Q186 192 166 146Z', '#c0392b')}
      ${clegs({ pants: '#59606c', boot: '#6b5a4a', stance: 3 })}
      ${ctorso({ fill: '#9aa5b4' })}
      ${cb('M112 150 L144 150 L148 198 Q128 206 108 198Z', '#3f72b0')}
      ${csh('M106 148 L106 176')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#6b4a2a')}${cc(128, 184, 5.5, '#f0c84a', 3)}
      ${cb('M176 134 L188 134 L188 56 L182 42 L176 56Z', '#e6ebf2')}${csh('M180 60 L180 128', 0.8)}
      ${cb('M166 134 L198 134 L198 143 L166 143Z', '#f0c84a')}
      ${carm(1, 182, 146, '#9aa5b4', SKIN)}
      ${carm(-1, 84, 176, '#9aa5b4', SKIN)}
      ${cc(68, 178, 30, '#7d8898', 4.5)}${cc(68, 178, 22, '#3f72b0', 3.5)}${cc(68, 178, 8, '#f0c84a', 3)}${csh('M48 160 Q54 152 64 150', 0.7)}
      ${h.back}${h.head}
      ${cb('M80 88 C78 48 100 36 128 36 C156 36 178 48 176 88 L170 90 C160 70 96 70 86 90Z', '#aab4c2')}
      ${cb('M80 86 Q128 62 176 86 L176 94 Q128 72 80 94Z', '#7d8898')}
      ${cb('M123 66 L133 66 L132 100 Q128 104 124 100Z', '#7d8898', 4)}
      ${cb('M128 36 C116 8 152 6 170 20 C158 28 152 38 144 44Z', '#d94a3a')}
      ${csh('M96 56 Q108 44 126 42', 0.7)}` };
  }
});

CHIBI_SVGS.paladino = () => CB.frame('c_paladino', {
  faction: 'hero', accent: '#f4d36a',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'round', eyeColor: '#3a78d0', mouth: 'smile', brow: '#5a3a1e' });
    return { body: `
      ${cb('M90 146 Q70 194 84 216 L172 216 Q186 194 166 146Z', '#f4f0e0')}
      ${clegs({ pants: '#4a5f8a', boot: '#7a6a58' })}
      ${ctorso({ fill: '#5f82c0' })}
      ${cb('M104 148 L152 148 L150 176 Q128 184 106 176Z', '#d9e2f5')}${cc(128, 164, 8, '#f0c84a', 3)}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#f0c84a')}
      ${cap_spear()}
      ${carm(-1, 70, 170, '#5f82c0', SKIN)}
      ${cb('M172 150 L212 150 L212 190 Q212 214 192 224 Q172 214 172 190Z', '#d9e2f5')}${cb('M178 156 L206 156 L206 190 Q206 208 192 216 Q178 208 178 190Z', '#4a6fb0', 3.5)}${cb('M190 164 L194 164 L194 176 L202 176 L202 180 L194 180 L194 196 L190 196 L190 180 L182 180 L182 176 L190 176Z', '#f0c84a', 2.5)}
      ${carm(1, 176, 178, '#5f82c0', SKIN)}
      ${cb('M92 146 Q78 150 76 176 L92 168Z M164 146 Q178 150 180 176 L164 168Z', '#f0c84a', 3.5)}
      ${h.back}${h.head}
      ${cb('M78 96 C70 56 92 38 124 40 C150 42 176 50 178 96 C170 76 156 64 140 60 C148 70 134 78 120 72 C108 66 92 74 78 96Z', '#7a4a26')}
      ${cb('M104 52 L96 28 L116 46Z M124 46 L124 22 L140 44Z M144 50 L156 28 L160 54Z', '#7a4a26', 4)}
      ${csh('M92 66 Q104 52 120 50', 0.6)}` };
    function cap_spear() { return `${ccap(54, 220, 54, 40, 7, '#8a6038')}${cb('M54 12 L63 42 L54 50 L45 42Z', '#e6ebf2')}${cb('M44 46 L64 46 L60 52 L48 52Z', '#f0c84a', 3.5)}`; }
  }
});

CHIBI_SVGS.barbaro = () => CB.frame('c_barbaro', {
  faction: 'hero', accent: '#e0703a',
  art: (id) => {
    const h = chead(id, { skin: '#e6b08a', eyes: 'angry', eyeColor: '#5a3a20', mouth: 'none', brow: '#241612', browTilt: 1, blush: false, browW: 5.5 });
    return { body: `
      ${clegs({ pants: '#6a4a30', boot: '#3a2a22', stance: 4 })}
      ${ctorso({ fill: '#e6b08a' })}
      ${cb('M96 144 Q128 160 160 144 L164 184 Q128 194 92 184Z', '#d8873c')}
      ${cb('M92 140 Q100 130 112 140 Q120 130 128 140 Q136 130 144 140 Q156 130 164 140 L164 156 Q128 168 92 156Z', '#8a5a34')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#4a3020')}${cc(128, 184, 5, '#c9a850', 3)}
      <path d="M118 168 l6 6 l6 -6 M134 168 l4 6 l6 -6" stroke="${CI}" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${ccap(206, 226, 188, 60, 9, '#8a5a34')}${cb('M184 70 C160 50 148 78 160 108 C172 100 180 96 190 98Z', '#b9c2cf')}${cb('M184 70 C210 50 224 78 214 110 C202 102 196 98 190 98Z', '#b9c2cf')}${csh('M162 76 C162 88 166 96 172 100', 0.7)}
      ${carm(1, 194, 150, '#e6b08a', '#e6b08a')}
      ${carm(-1, 88, 172, '#e6b08a', '#e6b08a')}
      ${h.back}${h.head}
      ${cb('M82 112 C74 150 100 190 128 194 C156 190 182 150 174 112 C164 128 150 132 128 132 C106 132 92 128 82 112Z', '#2f2220')}
      ${cb('M104 124 Q116 116 128 124 Q140 116 152 124 Q140 134 128 130 Q116 134 104 124Z', '#3a2a26', 3.5)}
      ${cb('M78 86 C76 48 98 34 128 34 C158 34 180 48 178 86 L170 90 C160 74 96 74 86 90Z', '#b9c2cf')}
      ${cb('M78 82 Q128 62 178 82 L178 90 Q128 70 78 90Z', '#8a93a2')}
      ${cb('M84 74 C60 66 56 34 76 22 C70 40 80 56 94 62Z', '#f1e6c8')}${cb('M172 74 C196 66 200 34 180 22 C186 40 176 56 162 62Z', '#f1e6c8')}
      ${csh('M100 52 Q112 42 128 40', 0.6)}` };
  }
});

CHIBI_SVGS.clerigo = () => CB.frame('c_clerigo', {
  faction: 'hero', accent: '#f0c64a',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'round', eyeColor: '#6a4a28', mouth: 'smile', brow: '#5a3a1e' });
    return { body: `
      ${cb('M84 144 Q66 196 80 218 L176 218 Q190 196 172 144Z', '#8a6a3a')}
      ${clegs({ pants: '#e8dcb8', boot: '#6a4a30' })}
      ${ctorso({ fill: '#f4ecd0' })}
      ${cb('M104 140 L152 140 L156 200 Q128 210 100 200Z', '#f4ecd0')}
      ${cb('M120 140 L136 140 L138 204 Q128 208 118 204Z', '#f0c84a', 3.5)}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#f0c84a')}${cc(128, 164, 8, '#f0c84a', 3)}<path d="M128 158 V170 M122 164 H134" stroke="${CI}" stroke-width="2.6"/>
      ${carm(-1, 74, 160, '#f4ecd0', SKIN)}
      ${ccap(58, 222, 58, 62, 8, '#8a6038')}${cc(58, 50, 16, '#f0c84a', 4)}${cc(58, 50, 7, '#fff6c8', 3)}${[0, 60, 120, 180, 240, 300].map(a => `<path d="M58 28 l-4 -9 h8z" transform="rotate(${a} 58 50)" fill="#f0c84a" stroke="${CI}" stroke-width="2.4" stroke-linejoin="round"/>`).join('')}
      ${carm(1, 176, 176, '#f4ecd0', SKIN)}
      ${h.back}${h.head}
      <path fill-rule="evenodd" d="M72 104 C64 50 96 28 128 28 C160 28 192 50 184 104 L178 150 Q150 130 128 128 Q106 130 78 150Z M92 104 C90 64 108 54 128 54 C148 54 166 64 164 104 C164 124 148 140 128 142 C108 140 92 124 92 104Z" fill="#f4e2a0" stroke="${CI}" stroke-width="4.5" stroke-linejoin="round"/>
      ${cb('M92 96 C96 62 112 52 128 52 C144 52 160 62 164 96 C150 78 140 70 128 70 C116 70 106 78 92 96Z', '#8a5a34')}
      <path d="M104 40 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1z" fill="#fff6c8" stroke="${CI}" stroke-width="2"/>
      <path d="M212 120 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3z" fill="#fff6c8" stroke="${CI}" stroke-width="2"/>` };
  }
});

CHIBI_SVGS.bardo = () => CB.frame('c_bardo', {
  faction: 'hero', accent: '#d85fb0',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'happy', mouth: 'open', brow: '#8a6a3a' });
    return { body: `
      ${cb('M92 146 Q74 190 88 212 L168 212 Q182 190 164 146Z', '#4f8a5a')}
      ${clegs({ pants: '#7a5a3a', boot: '#5a3a22', stance: 2 })}
      ${ctorso({ fill: '#e8d9a8' })}
      ${cb('M108 148 L148 148 L146 196 Q128 204 110 196Z', '#a8d08a')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#6a4a2a')}${cc(128, 184, 5, '#f0c84a', 3)}
      ${carm(1, 172, 178, '#e8d9a8', SKIN)}
      ${ccap(70, 200, 112, 146, 8, '#8a5a30')}${ce(60, 196, 26, 20, '#c8843c', 4.5, -28)}${cc(56, 194, 7, '#3a2418', 3)}<path d="M40 210 L70 182" stroke="#f3ead2" stroke-width="1.6" fill="none"/>${ccap(72, 192, 40, 150, 6, '#8a5a30')}
      ${carm(-1, 90, 166, '#e8d9a8', SKIN)}
      ${h.back}
      ${cb('M80 92 C70 130 84 160 100 168 L100 120Z M176 92 C186 130 172 160 156 168 L156 120Z', '#f3e6a8')}
      ${h.head}
      ${cb('M82 90 C82 62 102 50 128 50 C154 50 174 62 174 90 C160 74 142 66 128 70 C114 66 96 74 82 90Z', '#f3e6a8')}
      <path d="M96 70 q6 -10 14 -2 q-4 10 -14 2z" fill="#a8e0d8" stroke="${CI}" stroke-width="2.4"/>
      ${cb('M56 66 Q128 56 200 66 Q196 80 128 76 Q60 80 56 66Z', '#8a5a30')}
      ${cb('M84 64 C84 34 106 22 134 24 C156 26 170 40 168 62 C148 56 106 56 84 64Z', '#a8683a')}
      ${cb('M84 62 Q128 52 168 60 L168 66 Q128 56 84 68Z', '#e8c860', 3)}
      ${cb('M156 40 C186 6 226 10 232 30 C208 24 190 36 176 56Z', '#f6f2e6')}${csh('M162 38 C186 22 208 20 224 28', 0.8)}` };
  }
});

CHIBI_SVGS.feiticeiro = () => CB.frame('c_feiticeiro', {
  faction: 'hero', accent: '#f0587f',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'round', eyeColor: '#d8503a', mouth: 'cat', brow: '#1c2a44', browTilt: 0.4 });
    const flame = (x, y, c1, c2) => `${cb(`M${x} ${y} C${x - 26} ${y - 6} ${x - 24} ${y - 40} ${x - 4} ${y - 62} C${x - 2} ${y - 44} ${x + 8} ${y - 40} ${x + 8} ${y - 62} C${x + 28} ${y - 40} ${x + 28} ${y - 6} ${x} ${y}Z`, c1, 4)}${cb(`M${x} ${y - 4} C${x - 12} ${y - 8} ${x - 10} ${y - 26} ${x} ${y - 36} C${x + 10} ${y - 26} ${x + 12} ${y - 8} ${x} ${y - 4}Z`, c2, 3)}`;
    return { body: `
      ${cb('M90 146 Q70 194 84 216 L172 216 Q186 194 166 146Z', '#2a3f7a')}
      ${clegs({ pants: '#2a3350', boot: '#5a3a30' })}
      ${ctorso({ fill: '#3a56a0' })}
      ${cb('M108 140 L148 140 L152 200 Q128 210 104 200Z', '#4f7ad0')}
      ${cb('M120 140 L136 140 L138 204 Q128 208 118 204Z', '#f0c84a', 3.5)}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#f0c84a')}
      ${carm(-1, 62, 150, '#3a56a0', SKIN)}${flame(54, 140, '#ff6a2a', '#ffd24a')}
      ${carm(1, 194, 150, '#3a56a0', SKIN)}${flame(202, 140, '#2fc4c8', '#c8fff6')}
      ${h.back}
      ${cb('M84 96 C70 124 74 150 90 160 L94 120Z M172 96 C186 124 182 150 166 160 L162 120Z', '#1c2a44')}
      ${h.head}
      ${cb('M82 90 C84 62 102 52 128 52 C154 52 172 62 174 90 C160 76 148 66 134 70 C126 82 112 82 104 72 C96 74 88 80 82 90Z', '#1c2a44')}
      ${cb('M54 78 Q128 62 202 78 Q196 92 128 88 Q60 92 54 78Z', '#3a56a0')}
      ${cb('M82 74 C80 46 108 20 150 6 C146 28 158 50 172 74 C146 66 106 66 82 74Z', '#4f7ad0')}
      ${cb('M82 72 Q128 62 172 72 L172 80 Q128 70 82 80Z', '#f0c84a', 3.5)}
      <path d="M118 44 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1z" fill="#fff6c8" stroke="${CI}" stroke-width="2"/>` };
  }
});

CHIBI_SVGS.mago = () => CB.frame('c_mago', {
  faction: 'hero', accent: '#8d76e8',
  art: (id) => {
    const h = chead(id, { skin: '#f0c9a4', eyes: 'round', eyeColor: '#3a78d0', mouth: 'none', brow: '#dfe6f2', browW: 6, blush: true });
    return { body: `
      ${clegs({ pants: '#2a3f7a', boot: '#4a3a30' })}
      ${cb('M92 140 Q70 196 84 218 L172 218 Q186 196 164 140Z', '#3a62b0')}
      ${cb('M104 142 L152 142 L156 206 Q128 216 100 206Z', '#4f7ad0')}
      ${cb('M100 178 Q128 189 156 178 L156 187 Q128 198 100 187Z', '#7a4a26')}${cc(128, 186, 5.5, '#f0c84a', 3)}
      <path d="M96 204 l4 8 l4 -8 M146 200 l4 8 l4 -8" stroke="#f0c84a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${carm(1, 196, 168, '#3a62b0', '#f0c9a4')}${cc(198, 144, 22, '#cfe9ff', 4.5)}${cc(198, 144, 15, '#9fd0f5', 2.4)}${csh('M186 134 Q190 128 198 126', 0.9)}
      ${carm(-1, 80, 172, '#3a62b0', '#f0c9a4')}
      ${h.back}${h.head}
      ${cb('M82 104 C66 150 90 196 128 204 C166 196 190 150 174 104 C164 124 150 130 128 130 C106 130 92 124 82 104Z', '#4f7ad0')}
      ${cb('M104 122 Q116 114 128 122 Q140 114 152 122 Q140 132 128 128 Q116 132 104 122Z', '#6a96e0', 3.5)}
      ${cb('M50 74 Q128 58 206 74 Q198 90 128 86 Q58 90 50 74Z', '#3a62b0')}
      ${cb('M80 72 C82 44 104 26 128 22 C152 18 176 34 180 40 C186 46 192 58 198 72 C160 62 112 62 80 72Z', '#3a62b0')}
      ${cb('M80 72 Q128 60 180 72 L180 80 Q128 68 80 80Z', '#f0c84a', 3.5)}
      <path d="M128 38 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1z" fill="#fff6c8" stroke="${CI}" stroke-width="2"/>` };
  }
});

CHIBI_SVGS.ranger = () => CB.frame('c_ranger', {
  faction: 'hero', accent: '#6fc45a',
  art: (id) => {
    const h = chead(id, { skin: '#f3d0b0', eyes: 'round', eyeColor: '#4a9a50', mouth: 'smile', brow: '#cfd6dc', ears: 'pointed', browTilt: 0.4 });
    return { body: `
      ${ccap(168, 130, 190, 188, 17, '#7a4a28')}${[0, 1, 2].map(i => `<path d="M${176 + i * 7} 134 l-4 -22 l5 3 l5 -2z" fill="#f6f2e6" stroke="${CI}" stroke-width="2.2" stroke-linejoin="round"/>`).join('')}
      ${cb('M88 146 Q66 196 80 218 L176 218 Q190 196 168 146Z', '#efe8d4')}
      ${clegs({ pants: '#8a6a3a', boot: '#5a3a22', bootStyle: 'tall' })}
      ${ctorso({ fill: '#8a9a58' })}
      ${cb('M106 146 L150 146 L148 196 Q128 204 108 196Z', '#6a7a40')}
      ${ccap(96, 150, 170, 196, 6, '#5a3a22')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#5a3a22')}${cc(128, 184, 5, '#c9a850', 3)}
      ${carm(1, 176, 168, '#8a9a58', '#f3d0b0')}
      <path d="M32 40 C-4 100 -4 170 32 226" fill="none" stroke="${CI}" stroke-width="14" stroke-linecap="round"/><path d="M32 40 C-4 100 -4 170 32 226" fill="none" stroke="#9a6a3a" stroke-width="8" stroke-linecap="round"/><path d="M32 40 L40 134 L32 226" fill="none" stroke="#f3ead2" stroke-width="2"/>
      ${carm(-1, 40, 134, '#8a9a58', '#f3d0b0')}
      ${h.back}
      ${cb('M72 96 C60 52 98 30 128 30 C158 30 196 52 184 96 C178 70 156 56 128 56 C100 56 78 70 72 96Z M70 90 C58 124 70 150 84 158Z M186 90 C198 124 186 150 172 158Z', '#f4f1ea')}
      ${h.head}
      ${cb('M80 96 C80 70 98 54 128 54 C158 54 176 70 176 96 C164 76 148 68 134 72 C126 86 112 84 106 72 C96 74 88 82 80 96Z', '#f4f1ea')}
      ${cb('M104 70 C112 56 144 56 152 70', 'none', 4)}
      ${cb('M92 70 q-10 -14 -2 -24 q12 4 12 20z', '#4a9a50', 3.5)}` };
  }
});

CHIBI_SVGS.rogue = () => CB.frame('c_rogue', {
  faction: 'hero', accent: '#5fd0b4',
  art: (id) => {
    const h = chead(id, { skin: '#e8bf9a', eyes: 'narrow', eyeColor: '#c8f0e0', mouth: 'none', brow: '#2a1a18', browTilt: 1, blush: false, nose: false });
    return { body: `
      ${cb('M90 146 Q68 196 82 216 L174 216 Q188 196 166 146Z', '#2e3a44')}
      ${clegs({ pants: '#3a3f4a', boot: '#241c1a', stance: 4 })}
      ${ctorso({ fill: '#4a5560' })}
      ${ccap(96, 150, 160, 190, 6, '#8a5a30')}${ccap(160, 150, 96, 190, 6, '#8a5a30')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#8a5a30')}${cc(128, 184, 5, '#c9a850', 3)}
      ${cb('M56 186 L44 128 L54 124 L76 178Z', '#e6ebf2')}${cb('M200 186 L212 128 L202 124 L180 178Z', '#e6ebf2')}
      ${cb('M52 184 L78 172 L82 182 L58 196Z', '#8a5a30', 3.5)}${cb('M204 184 L178 172 L174 182 L198 196Z', '#8a5a30', 3.5)}
      ${carm(-1, 66, 184, '#4a5560', '#e8bf9a')}${carm(1, 190, 184, '#4a5560', '#e8bf9a')}
      ${h.back}${h.head}
      ${cb('M84 104 C86 74 104 62 128 62 C152 62 170 74 172 104 L170 120 Q128 156 86 120Z', '#3a3f4a', 4.5).replace('<path', '<path opacity="1"')}
      <path d="M104 118 Q128 126 152 118" stroke="${CI}" stroke-width="2.4" fill="none" opacity="0.6"/>
      ${ce(112, 106, 11, 8, '#fff', 3.4)}${ce(144, 106, 11, 8, '#fff', 3.4)}
      <path d="M100 98 L122 106 M156 98 L134 106" stroke="${CI}" stroke-width="5.5" stroke-linecap="round"/>
      ${cc(113, 108, 4.4, '#7fe0c8', 1.6)}${cc(143, 108, 4.4, '#7fe0c8', 1.6)}${cc(113, 108, 2.2, '#10100e', 0)}${cc(143, 108, 2.2, '#10100e', 0)}
      ${cb('M72 108 C66 56 96 28 128 28 C160 28 190 56 184 108 L176 120 C182 80 160 52 128 52 C96 52 74 80 80 120Z', '#3a3f4a')}
      ${cb('M92 76 C100 64 156 64 164 76 C150 70 106 70 92 76Z', '#c44a3a', 3.5)}
      ${csh('M92 50 Q106 38 126 34', 0.6)}` };
  }
});
