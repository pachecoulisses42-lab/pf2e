/* ============================================================================
   1i. TOKENS CHIBI — VILÕES (2ª leva): esqueleto, orc, cultista, zumbi, kobold
   ============================================================================ */
CHIBI_SVGS.esqueleto = () => CB.frame('c_esqueleto', {
  faction: 'villain', accent: '#9a9a7a',
  art: (id) => {
    const bone = '#efe7d0', boneD = '#cfc4a4';
    const rib = [0, 1, 2, 3].map(i => `<path d="M104 ${150 + i * 9} Q128 ${158 + i * 9} 152 ${150 + i * 9}" stroke="${CI}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join('');
    return { body: `
      ${clegs({ pants: bone, boot: boneD, stance: 3 })}
      ${ctorso({ fill: bone })}
      ${rib}<path d="M128 142 V186" stroke="${CI}" stroke-width="4" stroke-linecap="round"/>
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#7a5a3a')}
      ${cb('M184 128 L196 44 L208 50 L198 132Z', '#a8a090')}${cb('M176 128 L212 134 L210 144 L174 142Z', '#7a5a3a', 3.5)}${csh('M198 56 L190 124', 0.6)}
      ${carm(1, 190, 148, bone, boneD)}
      ${cc(66, 184, 26, '#8a6a42', 4.5)}${cc(66, 184, 17, '#a8804e', 3)}${cb('M52 168 L64 184 L58 202', 'none', 3.4)}
      ${carm(-1, 78, 182, bone, boneD)}
      ${ce(128, 96, 48, 43, bone, 4.8)}
      ${cb('M92 126 Q96 150 128 154 Q160 150 164 126 Q148 134 128 134 Q108 134 92 126Z', boneD, 4.5)}
      <path d="M104 134 V148 M114 136 V152 M124 137 V153 M134 137 V153 M144 136 V152 M152 134 V148" stroke="${CI}" stroke-width="3" stroke-linecap="round"/>
      ${ce(106, 96, 15, 17, '#1a1214', 4, -8)}${ce(150, 96, 15, 17, '#1a1214', 4, 8)}
      ${cc(108, 98, 4, '#ff4a3a', 0)}${cc(148, 98, 4, '#ff4a3a', 0)}<circle cx="106" cy="96" r="1.6" fill="#fff"/><circle cx="146" cy="96" r="1.6" fill="#fff"/>
      ${cb('M122 114 L134 114 L128 126Z', '#1a1214', 3)}
      <path d="M96 66 L112 78 M140 62 L132 74" stroke="${CI}" stroke-width="3" stroke-linecap="round"/>
      ${cb('M80 88 C78 54 100 40 128 40 C156 40 178 54 176 88 C164 70 96 70 84 90Z', '#8a8272')}${cb('M80 86 Q128 64 176 86 L176 92 Q128 72 80 92Z', '#6a6254', 3.6)}
      <circle cx="102" cy="62" r="3" fill="#4a4438" stroke="${CI}" stroke-width="1.6"/><circle cx="154" cy="62" r="3" fill="#4a4438" stroke="${CI}" stroke-width="1.6"/>
      ${csh('M98 54 Q110 44 126 42', 0.5)}` };
  }
});

CHIBI_SVGS.orc = () => CB.frame('c_orc', {
  faction: 'villain', accent: '#c85a2a',
  art: (id) => {
    const skin = '#86a066';
    const h = chead(id, { skin, eyes: 'angry', eyeColor: '#e8b83a', mouth: 'snarl', brow: '#1c1a10', browTilt: 1, blush: false, ears: 'pointed', browW: 6, rx: 52, ry: 46 });
    return { body: `
      ${clegs({ pants: '#5a4a38', boot: '#3a2a22', stance: 6 })}
      ${ctorso({ fill: '#8a5a38', w: 64 })}
      ${cb('M100 142 L156 142 L152 176 Q128 184 104 176Z', '#6a4430')}
      ${[0, 1, 2].map(i => cb(`M${106 + i * 18} 150 l6 -10 l6 10z`, '#c9d4e4', 2.8)).join('')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#3a2a22')}${cc(128, 184, 6, '#b8a060', 3)}
      ${ccap(206, 232, 188, 56, 9, '#6a4430')}
      ${cb('M184 66 C158 44 146 78 160 112 C174 102 182 98 192 100Z', '#9aa4b2')}${cb('M184 66 C212 44 226 78 214 114 C202 104 196 100 190 100Z', '#9aa4b2')}${csh('M162 74 C162 88 168 98 176 102', 0.7)}
      ${carm(1, 194, 150, '#86a066', skin, 19)}
      ${cb('M62 150 L84 136 L92 160 L70 170Z', '#9aa4b2', 4)}${cb('M70 146 l-8 -14 l14 6z M82 142 l-4 -16 l12 8z', '#c9d4e4', 3)}
      ${carm(-1, 80, 176, '#86a066', skin, 19)}
      ${h.back}${h.head}
      ${cb('M114 118 Q108 104 114 96 Q119 106 119 118Z M142 118 Q148 104 142 96 Q137 106 137 118Z', '#f3ead2', 3.4)}
      <path d="M96 112 L112 108 M96 120 L112 116 M160 112 L144 108 M160 120 L144 116" stroke="#c4301e" stroke-width="3.6" stroke-linecap="round"/>
      ${cb('M110 52 C116 24 124 18 128 18 C132 18 140 24 146 52 C138 46 118 46 110 52Z', '#1c1a1a')}${cb('M100 60 L96 40 L110 54Z M156 60 L160 40 L146 54Z', '#1c1a1a', 3.4)}` };
  }
});

CHIBI_SVGS.cultista = () => CB.frame('c_cultista', {
  faction: 'villain', accent: '#8a2a4a',
  art: (id) => {
    const h = chead(id, { skin: '#d8c4c0', eyes: 'narrow', eyeColor: '#ff4a4a', mouth: 'cat', brow: '#1c1218', browTilt: 1, blush: false, nose: false });
    return { body: `
      ${cb('M78 146 Q56 196 72 224 L184 224 Q200 196 178 146Z', '#5a1a2e')}
      ${ce(106, 226, 16, 9, '#2a1a1c', 4.2)}${ce(150, 226, 16, 9, '#2a1a1c', 4.2)}
      ${ctorso({ fill: '#7a2a40', w: 64 })}
      ${cb('M104 148 L152 148 L156 214 Q128 224 100 214Z', '#6a2036')}
      ${cb('M114 156 L142 156 L128 184Z', 'none', 4).replace('stroke="#2b1b17"', 'stroke="#f0c84a"')}${cc(128, 164, 4.2, '#ff4a4a', 2.4)}
      ${cb('M100 190 Q128 200 156 190 L156 199 Q128 209 100 199Z', '#2a1a1c')}
      ${carm(-1, 70, 160, '#7a2a40', '#d8c4c0')}${cc(66, 142, 17, '#ff5a4a', 4)}${cc(66, 142, 10, '#ffc4a8', 2.4)}${csh('M58 134 Q62 128 68 128', 0.9)}
      ${cb('M184 128 L192 156 L184 160 L176 132Z', '#c9d4e4', 3.6)}${cb('M176 156 L196 150 L198 158 L178 164Z', '#3a2a2c', 3.4)}
      ${carm(1, 182, 164, '#7a2a40', '#d8c4c0')}
      ${h.back}${h.head}
      <path fill-rule="evenodd" d="M70 108 C62 52 96 26 128 26 C160 26 194 52 186 108 L184 156 Q150 138 128 136 Q106 138 72 156Z M90 100 C88 66 106 54 128 54 C150 54 168 66 166 100 C166 124 150 140 128 142 C106 140 90 124 90 100Z" fill="#7a2a40" stroke="${CI}" stroke-width="4.5" stroke-linejoin="round"/>
      ${cb('M104 58 Q128 48 152 58', 'none', 4).replace('stroke="#2b1b17"', 'stroke="#f0c84a"')}
      ${csh('M92 48 Q106 36 124 32', 0.5)}` };
  }
});

CHIBI_SVGS.zumbi = () => CB.frame('c_zumbi', {
  faction: 'villain', accent: '#7a9a5a',
  art: (id) => {
    const skin = '#9ab58a';
    const h = chead(id, { skin, eyes: 'sleepy', eyeColor: '#d8d070', mouth: 'open', brow: '#3a4a2a', browTilt: -0.6, blush: false, nose: false });
    return { body: `
      ${clegs({ pants: '#5a5a6a', boot: '#4a3a30', stance: 2 })}
      <path d="M104 190 l-4 18 M150 188 l4 20" stroke="${CI}" stroke-width="3" stroke-linecap="round"/>
      ${ctorso({ fill: '#4a6a9a' })}
      ${cb('M100 160 l8 10 l6 -8 l8 12 l8 -10 l8 12 l8 -10 l6 8 L152 186 Q128 194 104 186Z', skin, 3.4)}
      <path d="M112 150 l10 8 M138 150 l-10 8" stroke="${CI}" stroke-width="3" stroke-linecap="round"/>
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#3a3a4a')}
      ${carm(-1, 66, 134, '#4a6a9a', skin)}${carm(1, 190, 136, '#4a6a9a', skin)}
      ${cb('M52 138 l-8 -6 M56 128 l-10 -2 M200 140 l8 -6 M196 130 l10 -2', 'none', 3)}
      ${h.back}${h.head}
      <path d="M100 118 l14 8 M114 118 l-14 8 M146 84 l12 6 M158 84 l-12 6" stroke="${CI}" stroke-width="3" stroke-linecap="round"/>
      ${cb('M150 58 C168 58 176 70 172 84 L148 76Z', '#e8e2c4', 3.6)}
      <path d="M156 66 l10 4 M156 74 l12 4" stroke="${CI}" stroke-width="2.4" stroke-linecap="round"/>
      ${cb('M84 80 C84 58 98 50 112 52 L106 66 L96 62 L92 74Z M126 52 L136 60 L130 66Z', '#4a5a2a', 3.4)}
      ${cb('M128 128 q-2 14 2 18', 'none', 3).replace('stroke="#2b1b17"', 'stroke="#9ad08a"')}` };
  }
});

CHIBI_SVGS.kobold = () => CB.frame('c_kobold', {
  faction: 'villain', accent: '#d8742a',
  art: (id) => {
    const skin = '#d8663a';
    const h = chead(id, { skin, eyes: 'glare', eyeColor: '#ffd23a', mouth: 'grin', brow: '#4a1a0a', browTilt: 1, blush: false, nose: false, ears: 'pointed', rx: 46, ry: 42, cy: 100 });
    return { body: `
      ${cb('M168 214 C214 214 232 186 214 160 C220 184 206 198 172 200Z', skin, 4.5)}
      ${clegs({ pants: '#7a4a2a', boot: skin, stance: 3 })}
      ${ctorso({ fill: '#8a5a30', w: 54, y: 142 })}
      ${cb('M108 150 L148 150 L146 184 Q128 192 110 184Z', '#6a4426')}
      ${cb('M100 180 Q128 190 156 180 L156 189 Q128 199 100 189Z', '#3a2a1a')}${cc(128, 188, 5, '#b8a060', 3)}
      ${ccap(206, 232, 206, 30, 6, '#8a6038')}${cb('M206 8 L216 38 L206 44 L196 38Z', '#c9d4e4', 3.6)}${csh('M204 16 L200 34', 0.7)}
      ${carm(1, 206, 150, '#8a5a30', skin)}
      ${cc(64, 180, 22, '#8a6a42', 4.5)}${cc(64, 180, 13, '#a8804e', 3)}
      ${carm(-1, 80, 178, '#8a5a30', skin)}
      ${h.back}${h.head}
      ${cb('M100 118 Q128 108 156 118 Q158 136 128 140 Q98 136 100 118Z', '#e08a58', 3.6)}
      ${cc(118, 124, 2.4, '#4a1a0a', 0)}${cc(138, 124, 2.4, '#4a1a0a', 0)}
      ${cb('M104 60 L112 36 L122 58Z M122 58 L128 28 L136 58Z M136 58 L146 36 L152 62Z', '#b8481e', 3.6)}
      ${cb('M92 76 Q128 60 164 76', 'none', 3.4).replace('stroke="#2b1b17"', 'stroke="#f0a060"')}` };
  }
});
