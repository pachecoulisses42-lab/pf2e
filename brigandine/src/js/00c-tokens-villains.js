/* ============================================================================
   1b. TOKENS — VILÕES
   ============================================================================ */
SCULPT_SVGS.goblin = () => T.frame('goblin', {
  faction: 'villain', accent: '#e24b3a', bg: ['#4a2a1c', '#0e0806'],
  art: (id) => {
    const skin = '#7fae4c';
    const f = T.face(id, { skin, eye: '#ffd23a', brow: '#1d2a0e', browW: 1.5, smile: 1, squint: 0.45, tilt: 0.7, ears: 'pointed', nose: 1.9, w: 34, h: 36, chin: 0.3, eyeGlow: true });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'rag', '#8a5a3a', '#2e1a10')}${T.cloth(id, 'rust', '#c98a5a', '#5a2e18')}`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#rag_${id})" stroke="#140a06" stroke-width="3"/>
        <path d="M60 256 L100 190 M196 256 L152 190 M92 218 L128 204 L164 218" stroke="#140a06" stroke-width="2.6" fill="none" opacity="0.6"/>
        <path d="M96 182 L160 182 L150 206 L128 214 L106 206Z" fill="url(#leather_${id})" stroke="#140a06" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M112 196 l5 6 l5 -6 M134 196 l5 6 l5 -6" stroke="#fffaf0" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M50 214 L74 168 L96 198 L82 232Z" fill="url(#rust_${id})" stroke="#140a06" stroke-width="3" stroke-linejoin="round"/>
        <path d="M74 168 L70 140 L84 172Z" fill="url(#steel_${id})" stroke="#140a06" stroke-width="2"/>
        <circle cx="76" cy="206" r="3" fill="#2e1a10"/><circle cx="62" cy="214" r="2.600" fill="#2e1a10"/>
        ${f.head}
        <!-- nariz verrugoso, dentes irregulares -->
        <circle cx="122" cy="118" r="2" fill="#4a6a2a" opacity="0.6"/><circle cx="136" cy="112" r="1.800" fill="#4a6a2a" opacity="0.6"/>
        <path d="M108 124 Q128 154 148 124 Q128 136 108 124Z" fill="#2a0e0e" stroke="#1d2a0e" stroke-width="2" stroke-linejoin="round"/>
        <path d="M112 126 l4 8 l4 -7 l4 9 l4 -8 l4 9 l4 -8 l4 8 l4 -7" fill="#fffaf0" stroke="#7a6a3a" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M130 100 l-2 8 M142 98 l8 10" stroke="#4a6a2a" stroke-width="1.600" stroke-linecap="round" opacity="0.6"/>
        <!-- capacete de panela enferrujado -->
        <path d="M92 82 C90 46 108 34 128 34 C148 34 166 46 164 82 C150 64 106 64 92 82Z" fill="url(#rust_${id})" stroke="#140a06" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M94 74 Q128 56 162 74" stroke="#140a06" stroke-width="3" fill="none"/>
        <circle cx="106" cy="60" r="3.400" fill="#3a1e10" stroke="#140a06" stroke-width="1.200"/><circle cx="150" cy="60" r="3.400" fill="#3a1e10" stroke="#140a06" stroke-width="1.200"/>
        <path d="M106 80 L116 66 L132 70" stroke="#3a1e10" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M104 46 Q118 38 134 38" stroke="#ffd9b0" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>
        <path d="M128 34 L128 14 L140 22 L128 26" fill="url(#rust_${id})" stroke="#140a06" stroke-width="2.4" stroke-linejoin="round"/>`,
      over: `
        <g>
          <path d="M200 244 C176 220 168 176 188 128 C192 118 204 112 214 118 C224 126 212 140 210 150 C204 178 214 210 232 232Z" fill="url(#steel_${id})" stroke="#140a06" stroke-width="3" stroke-linejoin="round"/>
          <path d="M200 140 C190 170 196 206 216 232" fill="none" stroke="#8a4a22" stroke-width="3" opacity="0.7" stroke-linecap="round"/>
          <path d="M196 140 C202 130 210 126 214 126" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity="0.8"/>
          <rect x="196" y="232" width="34" height="9" rx="3" transform="rotate(-25 213 236)" fill="url(#leather_${id})" stroke="#140a06" stroke-width="2"/>
          <circle cx="226" cy="246" r="11" fill="url(#skin_${id})" stroke="#1d2a0e" stroke-width="2.4"/>
        </g>`
    };
  }
});

SCULPT_SVGS.lobo = () => T.frame('lobo', {
  faction: 'villain', accent: '#f0a020', bg: ['#3a3f4a', '#0a0c10'],
  art: (id) => ({
    defs: `${T.cloth(id, 'fur', '#aeb6c4', '#3a4252')}${T.cloth(id, 'furl', '#eef1f6', '#9aa4b4')}${T.cloth(id, 'furd', '#5a6272', '#1c212c')}${T.rad(`eye_${id}`, [[0, '#fff3a0'], [0.5, '#ffb81c'], [1, '#c25a08']], [0.4, 0.4, 0.7])}`,
    back: `<path d="M26 256 C22 196 54 158 98 150 L158 150 C202 158 234 196 230 256Z" fill="url(#furd_${id})" stroke="#0a0c10" stroke-width="3"/>
           <path d="M36 220 l12 -22 l8 20 l10 -24 l8 22 l12 -22 M220 220 l-12 -22 l-8 20 l-10 -24 l-8 22 l-12 -22" fill="none" stroke="#0a0c10" stroke-width="2.4" stroke-linejoin="round" opacity="0.6"/>`,
    body: `
      <!-- orelhas -->
      <path d="M88 80 L72 18 L122 52Z" fill="url(#fur_${id})" stroke="#0a0c10" stroke-width="3" stroke-linejoin="round"/>
      <path d="M168 80 L184 18 L134 52Z" fill="url(#fur_${id})" stroke="#0a0c10" stroke-width="3" stroke-linejoin="round"/>
      <path d="M90 66 L80 34 L110 54Z M166 66 L176 34 L146 54Z" fill="#3a1e24" opacity="0.9"/>
      <!-- cabeça -->
      <path d="M84 84 C80 56 100 44 128 44 C156 44 176 56 172 84 C182 104 178 128 164 146 C156 160 146 170 128 176 C110 170 100 160 92 146 C78 128 74 104 84 84Z" fill="url(#fur_${id})" stroke="#0a0c10" stroke-width="3.200" stroke-linejoin="round"/>
      <path d="M84 100 l-14 6 l10 6 l-12 8 l14 4 M172 100 l14 6 l-10 6 l12 8 l-14 4" fill="url(#fur_${id})" stroke="#0a0c10" stroke-width="2.600" stroke-linejoin="round"/>
      <path d="M100 60 L108 80 M156 60 L148 80 M118 52 L122 72 M138 52 L134 72" stroke="#3a4252" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <!-- focinho -->
      <path d="M104 110 C104 92 152 92 152 110 L158 140 C152 166 104 166 98 140Z" fill="url(#furl_${id})" stroke="#0a0c10" stroke-width="2.800" stroke-linejoin="round"/>
      <path d="M116 100 L114 124 M140 100 L142 124" stroke="#9aa4b4" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <path d="M116 106 Q128 100 140 106 Q138 120 128 124 Q118 120 116 106Z" fill="#0a0c10" stroke="#0a0c10" stroke-width="2" stroke-linejoin="round"/>
      <path d="M121 108 Q126 105 131 107" stroke="#fff" stroke-width="2.600" fill="none" stroke-linecap="round" opacity="0.6"/>
      <!-- boca aberta -->
      <path d="M108 136 Q128 160 148 136 Q128 148 108 136Z" fill="#5a1018" stroke="#0a0c10" stroke-width="2.200" stroke-linejoin="round"/>
      <path d="M112 136 Q128 154 144 136" fill="#8a1e28" opacity="0.9"/>
      <path d="M110 136 L114 150 L120 138Z M146 136 L142 150 L136 138Z M122 144 L125 152 L128 144Z M134 144 L131 152 L128 144Z" fill="#fffaf0" stroke="#6a5a4a" stroke-width="1.400" stroke-linejoin="round"/>
      <!-- olhos -->
      <path d="M92 84 L120 94 L116 106 Q104 108 94 98Z" fill="#0a0c10" stroke="#0a0c10" stroke-width="2.200" stroke-linejoin="round"/>
      <path d="M164 84 L136 94 L140 106 Q152 108 162 98Z" fill="#0a0c10" stroke="#0a0c10" stroke-width="2.200" stroke-linejoin="round"/>
      <path d="M97 90 L116 96 Q112 104 104 104 Q98 100 97 90Z" fill="url(#eye_${id})"/>
      <path d="M159 90 L140 96 Q144 104 152 104 Q158 100 159 90Z" fill="url(#eye_${id})"/>
      <path d="M105 94 L109 102 M151 94 L147 102" stroke="#0a0c10" stroke-width="3" stroke-linecap="round"/>
      <circle cx="102" cy="94" r="1.800" fill="#fff"/><circle cx="154" cy="94" r="1.800" fill="#fff"/>
      <path d="M90 74 L124 90 M166 74 L132 90" stroke="#1c212c" stroke-width="5" stroke-linecap="round"/>
      <!-- cicatrizes -->
      <path d="M150 60 L164 112" stroke="#c9707a" stroke-width="2.800" stroke-linecap="round"/>
      <path d="M153 72 l6 -1 M156 84 l6 -1 M159 96 l6 -1" stroke="#f0c0c0" stroke-width="1.600" stroke-linecap="round"/>
      <!-- coleira de espinhos -->
      <path d="M84 176 Q128 206 172 176 L174 196 Q128 226 82 196Z" fill="url(#leather_${id})" stroke="#0a0c10" stroke-width="3" stroke-linejoin="round"/>
      ${[0, 1, 2, 3, 4, 5, 6].map(i => { const t = i / 6; const x = 90 + t * 76; const y = 186 + Math.sin(t * Math.PI) * 18; return `<path d="M${(x - 5).toFixed(1)} ${y.toFixed(1)} L${(x + 5).toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y - 14).toFixed(1)}Z" fill="url(#steel_${id})" stroke="#0a0c10" stroke-width="1.600" stroke-linejoin="round"/>`; }).join('')}`,
    over: `
      <path d="M14 96 L40 170 M26 90 L52 164 M38 84 L62 158" stroke="#fffaf0" stroke-width="5.500" stroke-linecap="round"/>
      <path d="M14 96 L40 170 M26 90 L52 164 M38 84 L62 158" stroke="#c9b89a" stroke-width="1.600" stroke-linecap="round"/>
      <path d="M242 96 L216 170 M230 90 L204 164 M218 84 L194 158" stroke="#fffaf0" stroke-width="5.500" stroke-linecap="round"/>
      <path d="M242 96 L216 170 M230 90 L204 164 M218 84 L194 158" stroke="#c9b89a" stroke-width="1.600" stroke-linecap="round"/>`
  })
});

SCULPT_SVGS.bandido = () => T.frame('bandido', {
  faction: 'villain', accent: '#d8283e', bg: ['#4a1620', '#0d0507'],
  art: (id) => {
    const skin = '#c79a74';
    const f = T.face(id, { skin, eye: '#e0b060', brow: '#120a06', browW: 1.4, smile: 0.3, squint: 0.75, tilt: 0.6, h: 35, w: 31, chin: 0.5 });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'hood', '#5a1a24', '#12070a')}${T.cloth(id, 'mask', '#e23a4a', '#7a1020')}${T.cloth(id, 'vest', '#4a3a34', '#150e0c')}${T.lin(`shade_${id}`, [[0, '#000', 0.65], [0.6, '#000', 0.1], [1, '#000', 0]], [0, 0, 0, 1])}`,
      back: `<path d="M44 256 C40 196 66 164 104 156 L152 156 C190 164 216 196 212 256Z" fill="url(#hood_${id})" stroke="#0a0406" stroke-width="3"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#vest_${id})" stroke="#0a0406" stroke-width="3"/>
        <path d="M96 184 L128 256 L160 184" fill="#1c0e0c" stroke="#0a0406" stroke-width="2.4"/>
        <path d="M58 256 L180 188" stroke="#0a0406" stroke-width="9"/><path d="M58 256 L180 188" stroke="url(#leather_${id})" stroke-width="6"/>
        <path d="M198 256 L76 188" stroke="#0a0406" stroke-width="9"/><path d="M198 256 L76 188" stroke="url(#leather_${id})" stroke-width="6"/>
        <rect x="118" y="214" width="20" height="18" rx="3" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <rect x="124" y="219" width="8" height="8" rx="1.500" fill="#1c0e0c"/>
        <path d="M60 206 l8 -8 l8 8 l-8 8z M180 206 l8 -8 l8 8 l-8 8z" fill="url(#steel_${id})" stroke="#0a0406" stroke-width="2"/>
        <path d="M96 128 L160 128 L168 186 Q128 202 88 186Z" fill="url(#mask_${id})" stroke="#3a0810" stroke-width="3" stroke-linejoin="round"/>
        <path d="M100 150 Q128 160 156 150" stroke="#ff8a96" stroke-width="1.8" fill="none" opacity="0.5"/>
        ${f.head}
        <!-- cicatriz sobre o olho -->
        <path d="M110 80 L124 122" stroke="#7a2a30" stroke-width="3" stroke-linecap="round"/>
        <path d="M112 88 l6 -2 M115 98 l6 -2 M118 108 l6 -2" stroke="#e8b8b0" stroke-width="1.500" stroke-linecap="round"/>
        <!-- bandana de máscara -->
        <path d="M94 116 C108 108 148 108 162 116 L160 140 C150 158 106 158 96 140Z" fill="url(#mask_${id})" stroke="#3a0810" stroke-width="2.800" stroke-linejoin="round"/>
        <path d="M100 122 Q128 114 156 122" stroke="#ff8a96" stroke-width="2" fill="none" opacity="0.7"/>
        <path d="M100 134 Q128 146 156 134" stroke="#3a0810" stroke-width="2" fill="none" opacity="0.45"/>
        <path d="M94 124 L74 140 L90 138 L72 154 L96 140Z" fill="url(#mask_${id})" stroke="#3a0810" stroke-width="2.400" stroke-linejoin="round"/>
        <circle cx="94" cy="118" r="4" fill="none" stroke="url(#gold_${id})" stroke-width="2.600"/>
        <!-- capuz -->
        <path d="M128 28 C86 32 68 70 76 124 C78 142 88 156 98 164 L100 120 C94 96 102 74 116 66 C122 62 134 62 140 66 C154 74 162 96 156 120 L158 164 C168 156 178 142 180 124 C188 70 170 32 128 28Z" fill="url(#hood_${id})" stroke="#0a0406" stroke-width="3.200" stroke-linejoin="round"/>
        <path d="M102 100 C96 82 104 70 118 64 C124 62 132 62 138 64 C152 70 160 82 154 100 C146 90 110 90 102 100Z" fill="url(#shade_${id})"/>
        <path d="M102 100 C96 82 104 70 118 64 C124 62 132 62 138 64 C152 70 160 82 154 100 C146 90 110 90 102 100Z" fill="url(#hatch_${id})" opacity="0.5"/>
        <path d="M94 58 Q106 42 128 36" stroke="#ff8a96" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.4"/>`,
      over: `
        <g>
          <path d="M224 18 L236 36 L206 176 L192 170Z" fill="url(#steel_${id})" stroke="#0a0406" stroke-width="3" stroke-linejoin="round"/>
          <path d="M226 28 L202 168" stroke="#fff" stroke-width="2.200" opacity="0.7"/>
          <path d="M172 176 L218 186 L214 198 L170 188Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.400" stroke-linejoin="round"/>
          <path d="M190 192 L200 198 C204 208 198 222 188 228 C190 216 186 204 182 196Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
          <rect x="190" y="190" width="12" height="30" rx="3" transform="rotate(-16 196 205)" fill="url(#leather_${id})" stroke="#0a0406" stroke-width="2"/>
          <circle cx="192" cy="226" r="7" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        </g>
        <g>
          <path d="M14 214 L70 200 L74 214 L22 238Z" fill="url(#wood_${id})" stroke="#0a0406" stroke-width="3" stroke-linejoin="round"/>
          <path d="M16 206 C14 190 40 182 66 192" fill="none" stroke="url(#steel_${id})" stroke-width="5" stroke-linecap="round"/>
          <path d="M16 206 C14 190 40 182 66 192" fill="none" stroke="#0a0406" stroke-width="1.200"/>
          <path d="M20 200 L70 202" stroke="#e8dcc0" stroke-width="1.800"/>
          <path d="M20 200 L4 198 l8 -5z" fill="#c9d4e4" stroke="#0a0406" stroke-width="1.600" stroke-linejoin="round"/>
        </g>`
    };
  }
});
