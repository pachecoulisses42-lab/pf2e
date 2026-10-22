/* ============================================================================
   1f. TOKENS CHIBI — VILÕES
   ============================================================================ */
CHIBI_SVGS.goblin = () => CB.frame('c_goblin', {
  faction: 'villain', accent: '#d8402e',
  art: (id) => {
    const skin = '#7fb04a';
    const h = chead(id, { skin, eyes: 'glare', eyeColor: '#ffd23a', mouth: 'grin', brow: '#1d2a0e', ears: 'big', blush: false, browTilt: 1, nose: false });
    return { body: `
      ${clegs({ pants: '#7a5a3a', boot: '#4a3426', stance: 5 })}
      ${ctorso({ fill: '#8a5a3a' })}
      ${cb('M104 150 L152 150 L148 190 Q128 198 108 190Z', '#6a4430')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#3a2a22')}${cc(128, 184, 5, '#b8a060', 3)}
      <path d="M112 156 l6 8 l6 -8 M132 156 l6 8 l6 -8" stroke="#f3ead2" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${cb('M52 214 C40 176 60 140 92 128 C94 142 90 156 80 168 C86 184 80 204 68 218Z', '#b9c2cf')}${csh('M62 190 C60 170 68 150 84 136', 0.7)}
      ${carm(-1, 74, 196, '#8a5a3a', skin)}
      ${cb('M172 130 L180 168 L170 172 L162 134Z', '#8a93a2')}${cb('M158 168 L186 160 L188 170 L160 178Z', '#6a4430', 3.5)}
      ${carm(1, 174, 172, '#8a5a3a', skin)}
      ${h.back}${h.head}
      ${cb('M80 90 C78 54 100 38 128 38 C156 38 178 54 176 90 C164 76 96 76 84 90Z', '#a8683a')}
      ${cb('M80 86 Q128 62 176 86 L176 94 Q128 72 80 94Z', '#7a4a2a')}
      <circle cx="102" cy="66" r="3.6" fill="#4a2e1e" stroke="${CI}" stroke-width="1.6"/><circle cx="154" cy="66" r="3.6" fill="#4a2e1e" stroke="${CI}" stroke-width="1.6"/>
      ${cb('M98 50 q14 -8 30 -8', 'none', 3).replace('stroke="#2b1b17"', 'stroke="#d8a070"')}` };
  }
});

CHIBI_SVGS.lobo = () => CB.frame('c_lobo', {
  faction: 'villain', accent: '#f0a020',
  art: (id) => {
    const fur = '#8e97a6', furD = '#5a6272', furL = '#e4e8ee';
    return { body: `
      ${cb('M176 206 C214 200 226 170 206 150 C216 170 200 190 172 190Z', furD)}
      ${ce(128, 190, 52, 38, fur, 4.8)}
      ${ce(128, 202, 28, 24, furL, 3.5)}
      ${ce(88, 220, 17, 12, furD, 4.2)}${ce(168, 220, 17, 12, furD, 4.2)}${ce(110, 226, 14, 10, fur, 4)}${ce(146, 226, 14, 10, fur, 4)}
      <path d="M82 222 l0 6 M90 222 l0 6 M164 222 l0 6 M172 222 l0 6" stroke="#f3ead2" stroke-width="2.4" stroke-linecap="round"/>
      ${cb('M70 100 L56 34 L102 62Z', fur)}${cb('M186 100 L200 34 L154 62Z', fur)}
      ${cb('M72 92 L64 52 L94 68Z M184 92 L192 52 L162 68Z', '#c46a7a', 3)}
      ${cb('M70 96 C66 58 96 46 128 46 C160 46 190 58 186 96 C196 112 190 134 172 146 C160 156 146 160 128 160 C110 160 96 156 84 146 C66 134 60 112 70 96Z', fur, 4.8)}
      ${cb('M64 118 l-14 6 l12 4 l-10 8 l16 0 M192 118 l14 6 l-12 4 l10 8 l-16 0', fur, 3.4)}
      ${cb('M100 124 C100 106 156 106 156 124 L160 144 C154 164 102 164 96 144Z', furL, 4)}
      <path d="M96 76 L120 88 M160 76 L136 88" stroke="${CI}" stroke-width="7" stroke-linecap="round"/>
      ${cb('M90 90 L120 98 L116 112 Q102 112 92 104Z', '#ffd23a', 4)}${cb('M166 90 L136 98 L140 112 Q154 112 164 104Z', '#ffd23a', 4)}
      <ellipse cx="106" cy="102" rx="3" ry="6" fill="#14100e" transform="rotate(-12 106 102)"/><ellipse cx="150" cy="102" rx="3" ry="6" fill="#14100e" transform="rotate(12 150 102)"/>
      <circle cx="103" cy="99" r="2" fill="#fff"/><circle cx="147" cy="99" r="2" fill="#fff"/>
      ${cb('M116 118 Q128 112 140 118 Q138 130 128 134 Q118 130 116 118Z', '#241a1c', 3.5)}${csh('M120 118 Q125 115 131 116', 0.7)}
      ${cb('M104 142 Q128 162 152 142 Q128 150 104 142Z', '#7a1f2a', 3.5)}
      ${cb('M106 143 L110 156 L117 146Z M150 143 L146 156 L139 146Z', '#fff', 2.6)}
      ${cb('M92 156 Q128 178 164 156 L166 172 Q128 194 90 172Z', '#6a4430', 4)}
      ${[0, 1, 2, 3, 4].map(i => { const x = 98 + i * 15; const y = 168 + Math.sin(i / 4 * Math.PI) * 8; return `<path d="M${x - 4} ${y} L${x + 4} ${y} L${x} ${y - 10}Z" fill="#c9d4e4" stroke="${CI}" stroke-width="2" stroke-linejoin="round"/>`; }).join('')}
      <path d="M148 56 L156 86" stroke="#d9707a" stroke-width="3.4" stroke-linecap="round"/><path d="M151 66 l6 -1 M153 76 l6 -1" stroke="#f6c8c8" stroke-width="1.8" stroke-linecap="round"/>` };
  }
});

CHIBI_SVGS.bandido = () => CB.frame('c_bandido', {
  faction: 'villain', accent: '#d8283e',
  art: (id) => {
    const h = chead(id, { skin: '#d4a07a', eyes: 'angry', eyeColor: '#d8a050', mouth: 'none', brow: '#120a06', browTilt: 1, blush: false, nose: false });
    return { body: `
      ${cb('M90 146 Q68 196 82 216 L174 216 Q188 196 166 146Z', '#2a1a1c')}
      ${clegs({ pants: '#3a2a2a', boot: '#1c1412', stance: 4 })}
      ${ctorso({ fill: '#5a3a30' })}
      ${cb('M104 142 L152 142 L150 190 Q128 198 106 190Z', '#3a2420')}
      ${ccap(92, 150, 162, 194, 6.5, '#8a5a30')}${ccap(164, 150, 94, 194, 6.5, '#8a5a30')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#2a1a14')}${cc(128, 184, 6, '#c9a850', 3)}
      ${cb('M184 128 L198 30 L212 36 L196 132Z', '#dfe5ec')}${csh('M200 44 L192 122', 0.8)}
      ${cb('M172 130 L212 134 L210 144 L170 142Z', '#c9a850', 3.5)}
      ${carm(1, 190, 148, '#5a3a30', '#d4a07a')}
      ${cb('M30 202 L78 190 L82 206 L36 222Z', '#7a4a28', 4)}${cb('M30 194 C28 176 56 168 82 182', 'none', 5).replace('stroke="#2b1b17"', 'stroke="#d8dee6"')}
      ${carm(-1, 70, 196, '#5a3a30', '#d4a07a')}
      ${h.back}${h.head}
      ${cb('M72 108 C66 56 96 30 128 30 C160 30 190 56 184 108 L176 122 C182 82 160 54 128 54 C96 54 74 82 80 122Z', '#4a1a22')}
      ${cb('M90 112 C104 106 152 106 166 112 L164 134 C154 154 102 154 92 134Z', '#e23a4a', 4.2)}
      <path d="M98 122 Q128 114 158 122 M100 136 Q128 146 156 136" stroke="#8a1020" stroke-width="2.4" fill="none" opacity="0.8"/>
      ${cb('M88 118 L64 134 L82 132 L62 150 L92 134Z', '#e23a4a', 3.6)}
      <path d="M108 78 L122 118" stroke="#8a3a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M112 88 l6 -2 M115 98 l6 -2" stroke="#f0c0b8" stroke-width="1.8" stroke-linecap="round"/>
      ${csh('M94 50 Q106 38 126 34', 0.5)}` };
  }
});
