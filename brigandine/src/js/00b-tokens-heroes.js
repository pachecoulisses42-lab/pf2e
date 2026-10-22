/* ============================================================================
   1a. TOKENS — HERÓIS
   ============================================================================ */
const T = TK;

MEDALLION_SVGS.guerreiro = () => T.frame('guerreiro', {
  faction: 'hero', accent: '#4fa3e0', bg: ['#2b4a68', '#0d1a28'],
  art: (id) => {
    const f = T.face(id, { skin: '#e3b48c', eye: '#3f78a8', brow: '#3a2615', smile: 0.2, h: 36, chin: 0.5, tilt: 0.45, stubble: true, browW: 1.25 });
    return {
      defs: `${T.skinDefs(id, '#e3b48c')}${T.cloth(id, 'tabard', '#5da3dc', '#1c4468')}${T.cloth(id, 'cape', '#2f6a9c', '#0e2539')}${T.cloth(id, 'plume', '#e5483d', '#7f1612')}`,
      back: `<path d="M44 256 C40 196 66 164 104 156 L152 156 C190 164 216 196 212 256Z" fill="url(#cape_${id})" stroke="#0a1622" stroke-width="3"/>
             <path d="M70 256 C70 214 84 190 104 176 M186 256 C186 214 172 190 152 176" stroke="#000" stroke-width="2" opacity="0.25" fill="none"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#steel_${id})" stroke="#101722" stroke-width="3"/>
        <path d="M100 182 L156 182 L164 256 L92 256Z" fill="url(#tabard_${id})" stroke="#0a1622" stroke-width="2.5"/>
        <path d="M128 186 L128 256" stroke="#fff3b8" stroke-width="2.5" opacity="0.8"/>
        <path d="M112 206 L128 196 L144 206 L144 226 Q128 238 112 226Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M128 202 L128 228 M118 213 L138 213" stroke="#5a3f0e" stroke-width="3" stroke-linecap="round"/>
        <path d="M104 172 Q128 190 152 172 L150 190 Q128 202 106 190Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="2.5" stroke-linejoin="round"/>
        ${T.pauldron(id, -1)}${T.pauldron(id, 1)}
        ${f.head}
        <!-- elmo aberto com nasal e crista -->
        <path d="M128 42 C150 42 166 58 165 92 L158 96 C152 80 104 80 98 96 L91 92 C90 58 106 42 128 42Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>
        <path d="M93 86 Q128 66 163 86 L163 96 Q128 78 93 96Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <path d="M124 80 L132 80 L131 108 Q128 111 125 108Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="2"/>
        <path d="M91 96 L97 128 L110 120 L108 94Z M165 96 L159 128 L146 120 L148 94Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M102 62 Q116 50 134 49" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.7"/>
        ${T.gl(110, 58, 1.1, 20)}${T.gl(68, 190, 0.9, 0)}`,
      over: `
        <path d="M128 46 C112 22 140 6 172 16 C162 28 156 40 146 50Z" fill="url(#plume_${id})" stroke="#4a0c09" stroke-width="2.4"/>
        <g>
          <path d="M219 22 L227 44 L226 178 L212 178 L211 44Z" fill="url(#steelv_${id})" stroke="#101722" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M219 40 L219 176" stroke="#5b6b82" stroke-width="2.4"/>
          <path d="M196 178 Q219 170 242 178 L242 188 Q219 182 196 188Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.4" stroke-linejoin="round"/>
          <rect x="213.5" y="188" width="11" height="26" rx="3" fill="url(#leather_${id})" stroke="#1a0e06" stroke-width="2"/>
          <path d="M214 194 H224 M214 200 H224 M214 206 H224" stroke="#1a0e06" stroke-width="1.5" opacity="0.7"/>
          <circle cx="219" cy="220" r="8" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2"/>
          ${T.gl(219, 52, 1.5, 0)}${T.gl(217, 120, 0.9, 0)}
        </g>
        <g>
          <circle cx="62" cy="206" r="38" fill="url(#steel_${id})" stroke="#101722" stroke-width="3.5"/>
          <circle cx="62" cy="206" r="31" fill="url(#tabard_${id})" stroke="#0a1622" stroke-width="2.5"/>
          <path d="M62 178 L62 234 M34 206 L90 206" stroke="#fff3b8" stroke-width="5" opacity="0.9"/>
          <circle cx="62" cy="206" r="9" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.4"/>
          <path d="M38 190 Q50 178 66 176" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.6"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.paladino = () => T.frame('paladino', {
  faction: 'hero', accent: '#f4d36a', bg: ['#6b5a2a', '#1c1608'],
  art: (id) => {
    const f = T.face(id, { skin: '#efc7a2', eye: '#5aa0d8', brow: '#b58a3a', smile: 0.7, h: 36, chin: 0.3, tilt: -0.05, lashes: true });
    return {
      defs: `${T.skinDefs(id, '#efc7a2')}${T.cloth(id, 'tabard', '#ffffff', '#cfc7b0')}${T.cloth(id, 'hair', '#ffe48a', '#b3822a')}${T.cloth(id, 'cape', '#fff6d6', '#b9a66a')}${T.rad(`halo_${id}`, [[0.55, '#ffe9a0', 0.9], [0.8, '#ffd45a', 0.35], [1, '#ffd45a', 0]], [0.5, 0.5, 0.5])}`,
      glow: `<circle cx="128" cy="96" r="78" fill="url(#halo_${id})"/>
             <circle cx="128" cy="96" r="54" fill="none" stroke="url(#gold_${id})" stroke-width="3" opacity="0.9"/>`,
      back: `<path d="M44 256 C40 196 66 164 104 156 L152 156 C190 164 216 196 212 256Z" fill="url(#cape_${id})" stroke="#6b5a2a" stroke-width="3"/>
             <path d="M88 82 C74 124 80 172 98 196 L158 196 C176 172 182 124 168 82 C150 54 106 54 88 82Z" fill="url(#hair_${id})" stroke="#7a5518" stroke-width="2.4"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#steel_${id})" stroke="#101722" stroke-width="3"/>
        <path d="M100 182 L156 182 L164 256 L92 256Z" fill="url(#tabard_${id})" stroke="#8a7a45" stroke-width="2.5"/>
        <circle cx="128" cy="216" r="20" fill="none" stroke="url(#gold_${id})" stroke-width="3"/>
        <circle cx="128" cy="216" r="9" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <path d="M128 190 V198 M128 234 V242 M102 216 H110 M146 216 H154 M110 198 L116 204 M146 198 L140 204 M110 234 L116 228 M146 234 L140 228" stroke="url(#gold_${id})" stroke-width="3" stroke-linecap="round"/>
        <path d="M104 172 Q128 190 152 172 L150 190 Q128 202 106 190Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.5" stroke-linejoin="round"/>
        ${T.pauldron(id, -1, { fill: `url(#gold_${id})`, trim: `url(#steel_${id})`, plates: 2 })}${T.pauldron(id, 1, { fill: `url(#gold_${id})`, trim: `url(#steel_${id})`, plates: 2 })}
        ${f.head}
        <path d="M92 90 C92 62 110 52 128 52 C146 52 164 62 164 90 C152 74 140 70 128 70 C116 70 104 74 92 90Z" fill="url(#hair_${id})" stroke="#7a5518" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M94 86 Q128 62 162 86" fill="none" stroke="url(#gold_${id})" stroke-width="6" stroke-linecap="round"/>
        <path d="M94 86 Q128 62 162 86" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
        <path d="M95 84 L62 64 L72 82 L56 88 L82 98Z M161 84 L194 64 L184 82 L200 88 L174 98Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2" stroke-linejoin="round"/>
        <path d="M128 66 L134 76 L128 86 L122 76Z" fill="#7fd3ff" stroke="#fff" stroke-width="1.5"/>
        ${T.gl(128, 74, 1.1, 0)}${T.gl(104, 70, 0.8, 0)}${T.gl(160, 70, 0.8, 0)}`,
      over: `
        <g>
          <path d="M37 18 L45 40 L44 176 L30 176 L29 40Z" fill="url(#steelv_${id})" stroke="#101722" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M37 34 L37 174" stroke="#ffe9a0" stroke-width="3" opacity="0.9"/>
          <path d="M37 18 L45 40 L44 176 L30 176 L29 40Z" fill="#ffe9a0" opacity="0.25"/>
          <path d="M14 178 Q37 168 60 178 L60 190 Q37 183 14 190Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.4" stroke-linejoin="round"/>
          <rect x="31.500" y="190" width="11" height="26" rx="3" fill="url(#leather_${id})" stroke="#1a0e06" stroke-width="2"/>
          <circle cx="37" cy="222" r="8" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2"/>
          <path d="M37 6 V18 M20 14 L28 26 M54 14 L46 26" stroke="#ffe9a0" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          ${T.gl(37, 16, 1.7, 0)}${T.gl(37, 110, 1, 0)}
        </g>
        <g>
          <path d="M184 168 H252 V214 C252 236 224 246 218 250 C212 246 184 236 184 214Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M191 175 H245 V213 C245 230 226 238 218 242 C210 238 191 230 191 213Z" fill="url(#tabard_${id})" stroke="#8a7a45" stroke-width="2"/>
          <path d="M218 178 V240 M191 202 H245" stroke="url(#gold_${id})" stroke-width="5"/>
          <circle cx="218" cy="202" r="9" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.barbaro = () => T.frame('barbaro', {
  faction: 'hero', accent: '#e0703a', bg: ['#6a3a22', '#1a0d07'],
  art: (id) => {
    const skin = '#86a066';
    const f = T.face(id, { skin, eye: '#e3a73c', brow: '#1c1a10', smile: 0.9, squint: 0.6, browW: 1.7, tilt: 0.85, w: 36, h: 38, chin: 0.62, teeth: 'snarl', ears: 'pointed', nose: 1.4 });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'fur', '#d9bc8a', '#6b4a28')}${T.cloth(id, 'mohawk', '#e5522a', '#6e1608')}`,
      body: `
        ${f.neck}
        <path d="M34 256 C38 214 62 192 100 180 L156 180 C194 192 218 214 222 256Z" fill="url(#skin_${id})" stroke="#2a3418" stroke-width="3"/>
        <path d="M112 196 Q128 204 144 196 M104 214 Q128 226 152 214 M128 204 V240" fill="none" stroke="#2a3418" stroke-width="2.4" opacity="0.5" stroke-linecap="round"/>
        <path d="M70 222 q8 -10 16 0 M174 224 q8 -10 16 0 M96 240 l10 -8 l10 8" fill="none" stroke="#7a1d12" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
        <!-- colar de presas -->
        <path d="M98 178 Q128 214 158 178" fill="none" stroke="url(#leather_${id})" stroke-width="4"/>
        ${[0, 1, 2, 3, 4].map(i => { const x = 108 + i * 10; const yy = 192 + Math.sin(i / 4 * Math.PI) * 12; return `<path d="M${x - 4} ${yy} L${x + 4} ${yy} L${x} ${yy + 14}Z" fill="url(#bone_${id})" stroke="#6b5a3c" stroke-width="1.5" stroke-linejoin="round"/>`; }).join('')}
        <!-- manto de pele -->
        <path d="M30 236 C26 196 46 170 90 172 L100 200 C84 196 70 204 64 222 C56 214 42 218 30 236Z" fill="url(#fur_${id})" stroke="#2b1a0c" stroke-width="3" stroke-linejoin="round"/>
        <path d="M226 236 C230 196 210 170 166 172 L156 200 C172 196 186 204 192 222 C200 214 214 218 226 236Z" fill="url(#fur_${id})" stroke="#2b1a0c" stroke-width="3" stroke-linejoin="round"/>
        <path d="M44 214 l6 12 M58 204 l4 14 M214 212 l-6 12 M198 204 l-4 14 M72 190 l2 12 M184 190 l-2 12" stroke="#2b1a0c" stroke-width="2" stroke-linecap="round" opacity="0.55"/>
        ${f.head}
        <!-- pintura de guerra e cicatriz -->
        <path d="M100 112 L116 108 M101 120 L117 116 M156 112 L140 108 M155 120 L139 116" stroke="#c4301e" stroke-width="3.4" stroke-linecap="round"/>
        <path d="M150 78 L164 124" stroke="#4b2a22" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M153 90 l6 -1 M156 100 l6 -1 M159 110 l6 -1" stroke="#e8b0a0" stroke-width="1.6" stroke-linecap="round"/>
        <!-- presas -->
        <path d="M112 128 Q108 114 114 104 Q118 114 118 128Z M144 128 Q148 114 142 104 Q138 114 138 128Z" fill="url(#bone_${id})" stroke="#6b5a3c" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M108 60 C112 40 124 34 128 34 C132 34 144 40 148 60 C140 52 116 52 108 60Z" fill="url(#mohawk_${id})" stroke="#3a0b04" stroke-width="2.4"/>`,
      over: `
        <path d="M110 66 C106 38 118 14 128 10 C138 14 150 38 146 66 C140 54 116 54 110 66Z" fill="url(#mohawk_${id})" stroke="#3a0b04" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M128 12 V60" stroke="#ffb27a" stroke-width="2.4" opacity="0.6"/>
        <g>
          <rect x="213" y="36" width="12" height="210" rx="5" fill="url(#wood_${id})" stroke="#1d1006" stroke-width="2.6"/>
          <path d="M213 190 H225 M213 198 H225 M213 206 H225" stroke="#1d1006" stroke-width="2" opacity="0.7"/>
          <path d="M219 52 C192 38 176 66 184 100 C198 90 210 88 219 92Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>
          <path d="M219 52 C246 38 254 66 250 100 C238 90 228 88 219 92Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>
          <path d="M190 66 C192 80 196 88 206 92" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
          ${T.gl(196, 70, 1.2, 0)}${T.gl(240, 74, 1, 0)}
          <path d="M219 48 L219 30" stroke="url(#steel_${id})" stroke-width="7" stroke-linecap="round"/>
          <circle cx="219" cy="214" r="13" fill="url(#skin_${id})" stroke="#2a3418" stroke-width="2.6"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.clerigo = () => T.frame('clerigo', {
  faction: 'hero', accent: '#f0c64a', bg: ['#6a5a30', '#17120a'],
  art: (id) => {
    const skin = '#dc9f7a';
    const f = T.face(id, { skin, eye: '#4a6f8a', brow: '#9a4f20', browW: 1.8, smile: 0.35, w: 35, h: 36, chin: 0.5, tilt: 0.1, nose: 1.5 });
    const braid = (x, y0) => [0, 1, 2, 3].map(i => `<ellipse cx="${x}" cy="${y0 + i * 9}" rx="5" ry="5.5" fill="url(#beard_${id})" stroke="#5a2a0c" stroke-width="1.6"/>`).join('') + `<circle cx="${x}" cy="${y0 + 38}" r="3.4" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.2"/>`;
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'beard', '#d9782f', '#7a3512')}${T.cloth(id, 'robe', '#fff4cc', '#c9a85a')}${T.cloth(id, 'mail', '#9aa7b8', '#3b4656')}`,
      back: `<path d="M44 256 C40 198 66 166 104 158 L152 158 C190 166 216 198 212 256Z" fill="url(#robe_${id})" stroke="#6b5a2a" stroke-width="3"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#mail_${id})" stroke="#101722" stroke-width="3"/>
        <path d="M46 214 Q70 206 100 204 M56 232 Q78 224 104 222 M210 214 Q186 206 156 204 M200 232 Q178 224 152 222" stroke="#101722" stroke-width="1.6" stroke-dasharray="3 4" opacity="0.5" fill="none"/>
        <path d="M96 182 L160 182 L168 256 L88 256Z" fill="url(#robe_${id})" stroke="#8a7a45" stroke-width="2.5"/>
        <path d="M128 184 V256" stroke="url(#gold_${id})" stroke-width="5"/>
        <circle cx="128" cy="222" r="18" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.6"/>
        <path d="M128 200 V206 M128 238 V244 M106 222 H112 M144 222 H150 M113 207 L117 211 M143 207 L139 211 M113 237 L117 233 M143 237 L139 233" stroke="url(#gold_${id})" stroke-width="3" stroke-linecap="round"/>
        <circle cx="128" cy="222" r="8" fill="#fff4cc" stroke="#5a3f0e" stroke-width="1.8"/>
        ${T.pauldron(id, -1, { fill: `url(#mail_${id})`, trim: `url(#gold_${id})`, plates: 2 })}${T.pauldron(id, 1, { fill: `url(#mail_${id})`, trim: `url(#gold_${id})`, plates: 2 })}
        ${f.head}
        <!-- elmo de calota com sol -->
        <path d="M91 92 C90 52 108 40 128 40 C148 40 166 52 165 92 C154 72 102 72 91 92Z" fill="url(#steel_${id})" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>
        <path d="M92 82 Q128 62 164 82 L164 90 Q128 70 92 90Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <circle cx="128" cy="62" r="9" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <path d="M128 50 V54 M128 70 V74 M116 62 H120 M136 62 H140 M120 54 L122 56 M136 54 L134 56" stroke="#fff4cc" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M100 56 Q112 46 128 45" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity="0.6"/>
        <!-- barba trançada e bigode -->
        <path d="M91 108 C88 150 106 188 128 196 C150 188 168 150 165 108 C154 126 142 132 128 132 C114 132 102 126 91 108Z" fill="url(#beard_${id})" stroke="#5a2a0c" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M104 124 Q116 112 128 124 Q140 112 152 124 Q140 134 128 130 Q116 134 104 124Z" fill="url(#beard_${id})" stroke="#5a2a0c" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M108 142 Q128 154 148 142 M112 158 Q128 168 144 158" stroke="#5a2a0c" stroke-width="1.8" fill="none" opacity="0.55" stroke-linecap="round"/>
        ${braid(112, 146)}${braid(144, 146)}`,
      over: `
        <g>
          <rect x="31" y="70" width="12" height="150" rx="5" fill="url(#wood_${id})" stroke="#1d1006" stroke-width="2.6"/>
          <circle cx="37" cy="58" r="24" fill="url(#steel_${id})" stroke="#101722" stroke-width="3"/>
          <circle cx="37" cy="58" r="15" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.4"/>
          ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M37 ${58 - 24} l-4 -8 l8 0z" transform="rotate(${a} 37 58)" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.6"/>`).join('')}
          <circle cx="37" cy="58" r="6" fill="#fff4cc" stroke="#5a3f0e" stroke-width="1.6"/>
          <path d="M20 46 Q26 38 36 36" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.65"/>
          ${T.gl(26, 44, 1.2, 0)}
          <circle cx="37" cy="226" r="12" fill="url(#skin_${id})" stroke="#5a2a0c" stroke-width="2.6"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.bardo = () => T.frame('bardo', {
  faction: 'hero', accent: '#d85fb0', bg: ['#5a2a56', '#140a16'],
  art: (id) => {
    const skin = '#eab793';
    const f = T.face(id, { skin, eye: '#5e9a4a', brow: '#2a1810', smile: 1, lashes: true, h: 36, w: 32, chin: 0.28, tilt: -0.3, teeth: 'grin', wink: true });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'coat', '#b9418e', '#47123a')}${T.cloth(id, 'hat', '#8a2f78', '#36103a')}${T.cloth(id, 'feather', '#ffffff', '#d4c5e6')}${T.cloth(id, 'hair', '#6b3a22', '#241008')}`,
      back: `<path d="M84 90 C70 124 78 156 92 176 L164 176 C178 156 186 124 172 90Z" fill="url(#hair_${id})" stroke="#1c0c06" stroke-width="2.4"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#coat_${id})" stroke="#1c0a18" stroke-width="3"/>
        <path d="M100 180 L128 256 M156 180 L128 256" stroke="#1c0a18" stroke-width="2.4" opacity="0.5"/>
        <path d="M62 256 L196 188" stroke="url(#leather_${id})" stroke-width="9"/>
        <rect x="124" y="212" width="12" height="14" rx="2" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.8" transform="rotate(-30 130 219)"/>
        ${[0, 1, 2].map(i => `<circle cx="${112 + i * 3}" cy="${204 + i * 17}" r="4.2" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.3"/>`).join('')}
        <path d="M70 196 q10 -10 22 -4 M164 192 q12 -6 22 4" stroke="url(#gold_${id})" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- gola de babados -->
        <path d="M96 176 Q104 164 112 176 Q120 164 128 176 Q136 164 144 176 Q152 164 160 176 Q156 196 128 200 Q100 196 96 176Z" fill="#fff" stroke="#b8a8cc" stroke-width="2" stroke-linejoin="round"/>
        <path d="M108 182 Q128 192 148 182" stroke="#b8a8cc" stroke-width="1.6" fill="none"/>
        ${f.head}
        <!-- bigode e cavanhaque -->
        <path d="M110 124 Q120 118 128 124 Q136 118 146 124 Q136 128 128 126 Q120 128 110 124Z" fill="#241008"/>
        <path d="M122 138 Q128 152 134 138 Q128 142 122 138Z" fill="#241008"/>
        <!-- cabelo e chapéu -->
        <path d="M94 84 C94 60 110 54 128 54 C148 54 162 62 162 84 C152 72 138 66 126 68 C112 70 102 76 94 84Z" fill="url(#hair_${id})" stroke="#1c0c06" stroke-width="2.2"/>
        <ellipse cx="124" cy="68" rx="56" ry="13" transform="rotate(-9 124 68)" fill="url(#hat_${id})" stroke="#1c0a18" stroke-width="3"/>
        <path d="M92 66 C94 34 120 24 142 30 C158 36 164 50 160 64 C140 56 112 58 92 66Z" fill="url(#hat_${id})" stroke="#1c0a18" stroke-width="3" stroke-linejoin="round"/>
        <path d="M94 62 Q126 52 160 62" stroke="url(#gold_${id})" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="158" cy="60" r="6" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.8"/>`,
      over: `
        <path d="M156 50 C190 20 226 24 232 46 C214 40 196 48 182 66 C176 56 166 52 156 50Z" fill="url(#feather_${id})" stroke="#8a76a6" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M160 52 C186 36 210 34 226 44" stroke="#8a76a6" stroke-width="1.6" fill="none"/>
        <g transform="rotate(-24 62 200)">
          <rect x="52" y="82" width="14" height="86" rx="4" fill="url(#wood_${id})" stroke="#1d1006" stroke-width="2.4"/>
          <path d="M52 74 H66 L70 88 H48Z" fill="url(#wood_${id})" stroke="#1d1006" stroke-width="2.4"/>
          <circle cx="50" cy="78" r="3.2" fill="url(#gold_${id})"/><circle cx="68" cy="78" r="3.2" fill="url(#gold_${id})"/>
          <ellipse cx="59" cy="206" rx="40" ry="46" fill="url(#wood_${id})" stroke="#1d1006" stroke-width="3"/>
          <ellipse cx="59" cy="206" rx="31" ry="37" fill="none" stroke="#e6c27a" stroke-width="2" opacity="0.7"/>
          <circle cx="59" cy="200" r="10" fill="#1d0e04" stroke="#e6c27a" stroke-width="3"/>
          <path d="M54 166 V240 M59 166 V240 M64 166 V240" stroke="#f3ead2" stroke-width="1.2" opacity="0.9"/>
          <rect x="44" y="230" width="30" height="5" rx="2" fill="#2b1608"/>
        </g>
        <path d="M206 120 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.4"/>
        <path d="M222 150 l2.500 -6 l2.500 6 l6 2.500 l-6 2.500 l-2.500 6 l-2.500 -6 l-6 -2.500z" fill="#ffe9a0" opacity="0.9"/>`
    };
  }
});

MEDALLION_SVGS.feiticeiro = () => T.frame('feiticeiro', {
  faction: 'hero', accent: '#f0587f', bg: ['#6a1f3c', '#180610'],
  art: (id) => {
    const skin = '#eebfa8';
    const f = T.face(id, { skin, eye: '#ffb07a', brow: '#6a1a10', smile: 0.7, eyeGlow: true, lashes: true, h: 36, w: 31, squint: 0.3, tilt: 0.35, chin: 0.26 });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'coat', '#c9406a', '#3e0f26')}${T.cloth(id, 'flame', '#ffd25a', '#d8261e')}${T.rad(`aura_${id}`, [[0, '#ff7aa8', 0.55], [1, '#ff7aa8', 0]], [0.5, 0.5, 0.5])}${T.lin(`crystal_${id}`, [[0, '#ffe6f1'], [0.5, '#ff8fbc'], [1, '#a31650']], [0, 0, 1, 1])}`,
      glow: `<circle cx="128" cy="108" r="96" fill="url(#aura_${id})"/>`,
      back: `<path d="M82 100 C60 60 86 28 110 4 C108 34 122 40 128 14 C134 40 148 34 146 4 C170 28 196 60 174 100 C166 118 158 130 156 150 L100 150 C98 130 90 118 82 100Z" fill="url(#flame_${id})" stroke="#5a0f0a" stroke-width="2.4" stroke-linejoin="round"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#coat_${id})" stroke="#1c0610" stroke-width="3"/>
        <path d="M100 180 L128 256 L156 180" fill="#12040a" stroke="#1c0610" stroke-width="2.4" opacity="0.8"/>
        <path d="M92 176 L82 148 L106 168Z M164 176 L174 148 L150 168Z" fill="url(#coat_${id})" stroke="#1c0610" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M84 150 L100 182 M172 150 L156 182" stroke="url(#gold_${id})" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M70 226 H110 M146 226 H186 M84 242 H112 M144 242 H172" stroke="url(#gold_${id})" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
        <path d="M128 192 V256 M118 204 L128 214 L138 204" stroke="#ff9fbf" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.85"/>
        ${f.head}
        <!-- marcas arcanas -->
        <path d="M110 84 Q114 96 108 108 M146 84 Q142 96 148 108" stroke="#ff6a8e" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <path d="M112 112 l3 6 M144 112 l-3 6" stroke="#ff6a8e" stroke-width="2" stroke-linecap="round"/>
        <path d="M90 82 C92 54 108 44 128 44 C148 44 164 54 166 82 C158 66 148 60 138 62 C146 74 132 84 120 74 C112 66 100 70 90 82Z" fill="url(#flame_${id})" stroke="#5a0f0a" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M110 52 Q122 44 136 46" stroke="#fff6c8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`,
      over: `
        <g>
          <circle cx="212" cy="86" r="30" fill="url(#aura_${id})"/>
          <path d="M212 54 L232 78 L224 118 L200 118 L192 78Z" fill="url(#crystal_${id})" stroke="#4a0c28" stroke-width="3" stroke-linejoin="round"/>
          <path d="M212 54 L212 118 M192 78 L232 78 M200 118 L212 78 L224 118" stroke="#fff" stroke-width="1.5" opacity="0.55" fill="none"/>
          <path d="M200 66 L210 60" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
          ${T.gl(203, 66, 1.3, 0)}${T.gl(226, 108, 0.8, 0)}
        </g>
        <g>
          <path d="M54 170 C28 176 26 214 46 232 C40 214 56 206 58 190 C66 200 72 212 64 232 C84 218 84 184 54 170Z" fill="url(#flame_${id})" stroke="#5a0f0a" stroke-width="2.6" stroke-linejoin="round"/>
          <path d="M54 192 C46 200 46 214 54 220 C60 212 60 202 54 192Z" fill="#fff6c8" opacity="0.9"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.mago = () => T.frame('mago', {
  faction: 'hero', accent: '#8d76e8', bg: ['#2f2a66', '#0b0a20'],
  art: (id) => {
    const skin = '#e6c2a0';
    const f = T.face(id, { skin, eye: '#58a0e0', brow: '#d8dce6', browW: 1.7, smile: 0.4, w: 31, h: 35, chin: 0.3, tilt: -0.2, nose: 1.4 });
    const stars = [[76, 232], [92, 214], [112, 244], [150, 238], [168, 214], [184, 236], [64, 208], [196, 210]]
      .map(([x, y]) => `<path d="M${x} ${y - 5} l1.6 3.4 l3.6 .6 l-2.6 2.6 l.6 3.6 l-3.2 -1.8 l-3.2 1.8 l.6 -3.6 l-2.6 -2.6 l3.6 -.6z" fill="#ffe9a0" opacity="0.9"/>`).join('');
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'robe', '#8d76e8', '#231a56')}${T.cloth(id, 'hat', '#7a64d8', '#1c1446')}${T.cloth(id, 'beard', '#ffffff', '#b4b8c8')}${T.rad(`orb_${id}`, [[0, '#ffffff'], [0.4, '#a6f3ff'], [1, '#3aa0d8']], [0.4, 0.35, 0.7])}${T.rad(`aura_${id}`, [[0, '#9ae9ff', 0.6], [1, '#9ae9ff', 0]], [0.5, 0.5, 0.5])}`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#robe_${id})" stroke="#0e0a28" stroke-width="3"/>
        <path d="M100 180 L128 256 L156 180" fill="#0e0a28" opacity="0.35"/>
        ${stars}
        <path d="M44 232 Q70 214 100 214 M212 232 Q186 214 156 214" stroke="url(#gold_${id})" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <path d="M70 196 Q100 180 128 200 Q156 180 186 196 L180 214 Q156 200 128 218 Q100 200 76 214Z" fill="url(#robe_${id})" stroke="#0e0a28" stroke-width="2.6" stroke-linejoin="round" opacity="0.95"/>
        <circle cx="128" cy="204" r="9" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2"/>
        <circle cx="128" cy="204" r="4" fill="url(#orb_${id})"/>
        ${f.head}
        <!-- óculos -->
        <circle cx="113.500" cy="105" r="11" fill="#9ae9ff" fill-opacity="0.15" stroke="url(#gold_${id})" stroke-width="2.4"/>
        <circle cx="142.500" cy="105" r="11" fill="#9ae9ff" fill-opacity="0.15" stroke="url(#gold_${id})" stroke-width="2.4"/>
        <path d="M124.500 104 Q128 101 131.500 104" stroke="url(#gold_${id})" stroke-width="2.2" fill="none"/>
        <!-- barba e bigode -->
        <path d="M94 110 C90 158 106 206 128 224 C150 206 166 158 162 110 C152 130 142 134 128 134 C114 134 104 130 94 110Z" fill="url(#beard_${id})" stroke="#8a90a8" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M102 128 Q116 114 128 126 Q140 114 154 128 Q140 138 128 132 Q116 138 102 128Z" fill="url(#beard_${id})" stroke="#8a90a8" stroke-width="2"/>
        <path d="M108 150 Q128 168 148 150 M112 172 Q128 188 144 172 M118 194 Q128 204 138 194" stroke="#8a90a8" stroke-width="1.8" fill="none" opacity="0.6" stroke-linecap="round"/>
        <!-- aba do chapéu -->
        <ellipse cx="128" cy="70" rx="64" ry="14" fill="url(#hat_${id})" stroke="#0e0a28" stroke-width="3"/>
        <path d="M80 68 Q128 82 176 68" stroke="url(#gold_${id})" stroke-width="4.500" fill="none" stroke-linecap="round"/>`,
      over: `
        <path d="M92 66 C96 38 112 14 150 -2 C146 20 154 36 164 66 C140 58 116 58 92 66Z" fill="url(#hat_${id})" stroke="#0e0a28" stroke-width="3" stroke-linejoin="round"/>
        <path d="M94 62 Q128 52 162 62 L162 68 Q128 58 94 68Z" fill="#ffe9a0" stroke="#5a3f0e" stroke-width="1.6"/>
        <rect x="120" y="55" width="16" height="12" rx="2" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.8"/>
        <path d="M126 28 l2 4 l4.400 .6 l-3.200 3 l.8 4.400 l-4 -2.200 l-4 2.200 l.8 -4.400 l-3.200 -3 l4.400 -.6z" fill="#ffe9a0"/>
        <g>
          <circle cx="219" cy="66" r="34" fill="url(#aura_${id})"/>
          <path d="M219 38 L238 58 L228 90 L210 90 L200 58Z" fill="url(#orb_${id})" stroke="#173a5a" stroke-width="2.8" stroke-linejoin="round" transform="rotate(8 219 64)"/>
          <path d="M214 46 L206 58" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
          ${T.gl(212, 50, 1.3, 0)}
          <path d="M221 88 C212 120 224 180 216 250" fill="none" stroke="url(#wood_${id})" stroke-width="10" stroke-linecap="round"/>
          <path d="M221 88 C212 120 224 180 216 250" fill="none" stroke="#1d1006" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2 12"/>
          <path d="M206 100 Q219 108 232 100" stroke="url(#gold_${id})" stroke-width="4" fill="none" stroke-linecap="round"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.ranger = () => T.frame('ranger', {
  faction: 'hero', accent: '#6fc45a', bg: ['#25472c', '#07140a'],
  art: (id) => {
    const skin = '#d4a47c';
    const f = T.face(id, { skin, eye: '#8fd86a', brow: '#2a1a10', smile: 0, squint: 0.5, eyeGlow: true, h: 35, w: 31, chin: 0.36, tilt: 0.4, stubble: true });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'hood', '#5f9a4a', '#143018')}${T.cloth(id, 'cloak', '#4c8240', '#10271a')}${T.lin(`shade_${id}`, [[0, '#000', 0.65], [0.55, '#000', 0.1], [1, '#000', 0]], [0, 0, 0, 1])}`,
      back: `<g>
          <rect x="164" y="104" width="22" height="86" rx="5" transform="rotate(14 175 150)" fill="url(#leather_${id})" stroke="#1a0e06" stroke-width="2.4"/>
          ${[0, 1, 2].map(i => `<g transform="rotate(${14 + (i - 1) * 6} 175 150)"><path d="M${168 + i * 7} 104 V70" stroke="#e8dcc0" stroke-width="2.6"/><path d="M${168 + i * 7} 70 l-4 10 h8z" fill="#c43a2a" stroke="#4a0e08" stroke-width="1.2"/></g>`).join('')}
        </g>
        <path d="M44 256 C40 196 66 164 104 156 L152 156 C190 164 216 196 212 256Z" fill="url(#cloak_${id})" stroke="#07140a" stroke-width="3"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#cloak_${id})" stroke="#07140a" stroke-width="3"/>
        <path d="M96 184 L160 184 L168 256 L88 256Z" fill="url(#leather_${id})" stroke="#1a0e06" stroke-width="2.4"/>
        <path d="M70 240 L186 190" stroke="#1a0e06" stroke-width="7"/><path d="M70 240 L186 190" stroke="url(#leather_${id})" stroke-width="4.5"/>
        <rect x="120" y="206" width="14" height="14" rx="2" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="1.8" transform="rotate(-23 127 213)"/>
        <path d="M96 176 Q128 198 160 176" fill="none" stroke="#10271a" stroke-width="5"/>
        <path d="M118 188 C112 200 120 208 128 206 C136 208 144 200 138 188 C134 196 122 196 118 188Z" fill="url(#gold_${id})" stroke="#2d5a1c" stroke-width="2"/>
        ${f.head}
        <path d="M104 106 L118 112 M152 106 L138 112" stroke="#4aa83a" stroke-width="3.6" stroke-linecap="round"/>
        <!-- capuz -->
        <path d="M128 28 C88 34 70 70 78 120 C80 138 88 152 98 160 L100 124 C94 96 100 72 114 62 C120 58 136 58 142 62 C156 72 162 96 156 124 L158 160 C168 152 176 138 178 120 C186 70 168 34 128 28Z" fill="url(#hood_${id})" stroke="#07140a" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M100 124 C94 96 100 72 114 62 C120 58 136 58 142 62 C156 72 162 96 156 124 C146 100 110 100 100 124Z" fill="url(#shade_${id})"/>
        <path d="M100 124 C94 96 100 72 114 62 C120 58 136 58 142 62 C156 72 162 96 156 124 C146 100 110 100 100 124Z" fill="url(#hatch_${id})" opacity="0.4"/>
        <path d="M96 60 Q108 40 128 36" stroke="#d6ffb8" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.5"/>`,
      over: `
        <g>
          <path d="M20 34 C-2 100 -2 160 20 226" fill="none" stroke="#1d1006" stroke-width="13" stroke-linecap="round"/>
          <path d="M20 34 C-2 100 -2 160 20 226" fill="none" stroke="url(#wood_${id})" stroke-width="9" stroke-linecap="round"/>
          <path d="M18 56 C6 104 6 152 18 204" fill="none" stroke="#e8c27a" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          <path d="M20 34 L36 130 L20 226" fill="none" stroke="#f1f5f9" stroke-width="2"/>
          <rect x="12" y="116" width="20" height="28" rx="4" fill="url(#leather_${id})" stroke="#1a0e06" stroke-width="2.4"/>
          <path d="M36 130 H92" stroke="#e8dcc0" stroke-width="3.2"/><path d="M92 130 l-9 -6 v12z" fill="#c9d4e4" stroke="#101722" stroke-width="1.6" stroke-linejoin="round"/>
        </g>`
    };
  }
});

MEDALLION_SVGS.rogue = () => T.frame('rogue', {
  faction: 'hero', accent: '#5fd0b4', bg: ['#1f3c3a', '#060f10'],
  art: (id) => {
    const skin = '#c9a384';
    const f = T.face(id, { skin, eye: '#d8fff0', brow: '#1a1210', smile: 0, squint: 0.75, eyeGlow: true, h: 34, w: 30, chin: 0.3, tilt: 0.55 });
    return {
      defs: `${T.skinDefs(id, skin)}${T.cloth(id, 'hood', '#3b5a58', '#0a1616')}${T.cloth(id, 'leatherd', '#3a4a48', '#0c1514')}${T.lin(`shade_${id}`, [[0, '#000', 0.7], [0.5, '#000', 0.15], [1, '#000', 0]], [0, 0, 0, 1])}`,
      back: `<path d="M44 256 C40 196 66 164 104 156 L152 156 C190 164 216 196 212 256Z" fill="url(#hood_${id})" stroke="#050c0c" stroke-width="3"/>`,
      body: `
        ${f.neck}
        <path d="${T.TORSO}" fill="url(#leatherd_${id})" stroke="#050c0c" stroke-width="3"/>
        <path d="M64 256 L172 184 M192 256 L84 184" stroke="#050c0c" stroke-width="8"/>
        <path d="M64 256 L172 184 M192 256 L84 184" stroke="url(#leather_${id})" stroke-width="5" opacity="0.9"/>
        ${[0, 1, 2, 3].map(i => `<g transform="translate(${96 + i * 14} ${204 + i * 4}) rotate(-34)"><path d="M0 0 L3 -12 L6 0Z" fill="url(#steel_${id})" stroke="#050c0c" stroke-width="1.2"/><rect x="0" y="0" width="6" height="7" fill="url(#leather_${id})" stroke="#050c0c" stroke-width="1"/></g>`).join('')}
        <rect x="122" y="210" width="12" height="14" rx="2" fill="url(#steel_${id})" stroke="#050c0c" stroke-width="1.6"/>
        <path d="M96 126 L160 126 L170 184 Q128 200 86 184Z" fill="url(#hood_${id})" stroke="#050c0c" stroke-width="3" stroke-linejoin="round"/>
        <path d="M100 150 Q128 160 156 150 M98 166 Q128 178 158 166" stroke="#6fa09a" stroke-width="1.6" fill="none" opacity="0.4"/>
        ${f.head}
        <!-- máscara cobrindo o rosto -->
        <path d="M94 114 C100 108 156 108 162 114 L160 136 C150 152 106 152 96 136Z" fill="url(#hood_${id})" stroke="#050c0c" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M100 124 Q128 118 156 124" stroke="#6fa09a" stroke-width="1.6" fill="none" opacity="0.5"/>
        <!-- capuz profundo -->
        <path d="M128 26 C84 30 66 68 74 122 C76 142 86 158 98 166 L100 118 C94 94 102 74 116 66 C122 62 134 62 140 66 C154 74 162 94 156 118 L158 166 C170 158 180 142 182 122 C190 68 172 30 128 26Z" fill="url(#hood_${id})" stroke="#050c0c" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M102 100 C96 82 104 70 118 64 C124 62 132 62 138 64 C152 70 160 82 154 100 C146 90 110 90 102 100Z" fill="url(#shade_${id})"/>
        <path d="M102 100 C96 82 104 70 118 64 C124 62 132 62 138 64 C152 70 160 82 154 100 C146 90 110 90 102 100Z" fill="url(#hatch_${id})" opacity="0.5"/>
        <path d="M94 56 Q106 40 128 34" stroke="#9fe8d6" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.45"/>`,
      over: `
        <g>
          <path d="M28 244 L62 168 L74 178 L52 250Z" fill="url(#steel_${id})" stroke="#050c0c" stroke-width="2.8" stroke-linejoin="round"/>
          <path d="M62 170 L72 178" stroke="#fff" stroke-width="2.6"/>
          <path d="M48 238 L84 232 L82 244 L46 250Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2" stroke-linejoin="round"/>
        </g>
        <g>
          <path d="M228 244 L194 168 L182 178 L204 250Z" fill="url(#steel_${id})" stroke="#050c0c" stroke-width="2.8" stroke-linejoin="round"/>
          <path d="M194 170 L184 178" stroke="#fff" stroke-width="2.6"/>
          <path d="M208 238 L172 232 L174 244 L210 250Z" fill="url(#gold_${id})" stroke="#5a3f0e" stroke-width="2.2" stroke-linejoin="round"/>
        </g>`
    };
  }
});
