/* ============================================================================
   11c. DESENHO DO AMBIENTE — texturas de terreno e clima, objetos, perigos,
   escuridão e luz. Texturas são ladrilhos desenhados uma vez (canvas fora da
   tela) e repetidos acompanhando a câmera; cada camada respeita a transparência
   do seu menu.
   ============================================================================ */

const ENV_TILE = 64;
const ENV_PATTERN_CACHE = {};

/** Gerador pseudoaleatório com semente: a textura é sempre a mesma. */
function seededRandom(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** Desenha um ladrilho 64×64 de cada textura. Fundo transparente nos efeitos de clima. */
const ENV_TILE_PAINTERS = {
  chao(g, rnd) {
    g.fillStyle = '#a39d90'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(60, 52, 42, 0.55)'; g.lineWidth = 2;
    for (const [y, off] of [[0, 0], [21, 16], [42, 0]]) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke();
      for (let x = off; x < 64 + 32; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 21); g.stroke(); }
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.08 + rnd() * 0.1})`; g.fillRect(rnd() * 64, rnd() * 64, 2, 2); }
  },
  terra(g, rnd) {
    g.fillStyle = '#8c6a43'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(60, 40, 20, 0.45)' : 'rgba(200, 160, 110, 0.35)';
      g.beginPath(); g.arc(rnd() * 64, rnd() * 64, 1 + rnd() * 2.2, 0, Math.PI * 2); g.fill();
    }
  },
  lama(g, rnd) {
    g.fillStyle = '#5b4630'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 7; i++) {
      const x = rnd() * 64, y = rnd() * 64, rx = 6 + rnd() * 10;
      g.fillStyle = 'rgba(35, 25, 15, 0.55)'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.55, rnd() * 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(190, 160, 120, 0.35)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x - 2, y - 2, rx * 0.5, rx * 0.25, 0, Math.PI, Math.PI * 1.7); g.stroke();
    }
  },
  neve(g, rnd) {
    g.fillStyle = '#eef3f8'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(150, 175, 205, 0.25)'; g.beginPath(); g.ellipse(rnd() * 64, rnd() * 64, 10, 4, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(120, 150, 190, 0.7)'; g.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const x = rnd() * 64, y = rnd() * 64;
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(a) * 3, y - Math.sin(a) * 3); g.lineTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); g.stroke(); }
    }
  },
  agua(g) {
    g.fillStyle = '#3d7cb3'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(210, 235, 255, 0.6)'; g.lineWidth = 2; g.lineCap = 'round';
    for (const [y, off] of [[12, 0], [32, 16], [52, 6]]) {
      g.beginPath();
      for (let x = -16 + off; x < 80; x += 16) { g.moveTo(x, y); g.quadraticCurveTo(x + 4, y - 4, x + 8, y); }
      g.stroke();
    }
  },
  abismo(g, rnd) {
    const grd = g.createRadialGradient(32, 32, 4, 32, 32, 46);
    grd.addColorStop(0, '#000000'); grd.addColorStop(1, '#1d1626');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(140, 110, 170, 0.45)'; g.lineWidth = 1.4;
    for (let i = 0; i < 3; i++) { let x = rnd() * 64, y = rnd() * 64; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 18; y += (rnd() - 0.5) * 18; g.lineTo(x, y); } g.stroke(); }
  },
  difficult(g, rnd) {
    g.fillStyle = '#9a7b4c'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 9; i++) {
      const x = rnd() * 64, y = rnd() * 64, r = 3 + rnd() * 4;
      g.fillStyle = '#6f6a62'; g.strokeStyle = 'rgba(30,25,20,0.6)'; g.lineWidth = 1;
      g.beginPath(); for (let k = 0; k < 5; k++) { const a = k * 1.25 + rnd() * 0.4; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
    }
    g.strokeStyle = 'rgba(70, 110, 40, 0.8)'; g.lineWidth = 1.4;
    for (let i = 0; i < 6; i++) { const x = rnd() * 64, y = rnd() * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 6); g.moveTo(x, y); g.lineTo(x + 2, y - 7); g.stroke(); }
  },
  wall(g) {
    g.fillStyle = '#4b4a52'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(15, 14, 20, 0.8)'; g.lineWidth = 2.5;
    for (const [y, off] of [[0, 0], [16, 16], [32, 0], [48, 16]]) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke();
      for (let x = off; x < 80; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); }
    }
    g.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 2; y < 64; y += 16) g.fillRect(0, y, 64, 3);
  },
  hazard(g) {
    g.fillStyle = '#7a1f18'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(240, 190, 60, 0.55)'; g.lineWidth = 7;
    for (let x = -64; x < 128; x += 22) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x + 64, 0); g.stroke(); }
  },
  /* ---- clima (fundo transparente) ---- */
  nevoa(g, rnd) {
    for (let i = 0; i < 6; i++) {
      const x = rnd() * 64, y = rnd() * 64, r = 14 + rnd() * 14;
      for (const [dx, dy] of [[0, 0], [64, 0], [-64, 0], [0, 64], [0, -64]]) {
        const grd = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        grd.addColorStop(0, 'rgba(235, 238, 242, 0.75)'); grd.addColorStop(1, 'rgba(235, 238, 242, 0)');
        g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      }
    }
  },
  chuva(g, rnd) {
    g.fillStyle = 'rgba(70, 110, 160, 0.25)'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(190, 220, 255, 0.85)'; g.lineWidth = 1.3; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const x = rnd() * 64, y = rnd() * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 10); g.stroke(); }
  },
  nevasca(g, rnd) {
    g.fillStyle = 'rgba(220, 232, 245, 0.3)'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255, 255, 255, 0.85)'; g.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) { const x = rnd() * 64, y = rnd() * 64; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y + 4); g.stroke(); }
    g.fillStyle = '#ffffff';
    for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(rnd() * 64, rnd() * 64, 1 + rnd() * 1.6, 0, Math.PI * 2); g.fill(); }
  },
  fumaca(g, rnd) {
    g.strokeStyle = 'rgba(70, 70, 76, 0.7)'; g.lineWidth = 5; g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const x = rnd() * 64, y = rnd() * 64;
      g.beginPath(); g.arc(x, y, 7 + rnd() * 6, rnd() * 3, rnd() * 3 + 3.6); g.stroke();
    }
    g.fillStyle = 'rgba(90, 90, 96, 0.3)'; g.fillRect(0, 0, 64, 64);
  }
};

/** Padrão de uma textura (criado uma vez), ancorado na câmera para não "escorregar" ao mover. */
function envPattern(type) {
  if (!ENV_TILE_PAINTERS[type]) return null;
  if (!ENV_PATTERN_CACHE[type]) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = ENV_TILE;
    ENV_TILE_PAINTERS[type](tile.getContext('2d'), seededRandom(type.length * 7919 + type.charCodeAt(0)));
    ENV_PATTERN_CACHE[type] = ctx.createPattern(tile, 'repeat');
  }
  const p = ENV_PATTERN_CACHE[type];
  const k = (STATE.camera.basePx * STATE.camera.zoom) / ENV_TILE;
  if (p && p.setTransform) p.setTransform(new DOMMatrix([k, 0, 0, k, STATE.camera.x, STATE.camera.y]));
  return p;
}

const layerOpacity = (layer) => opacityFromTransparency(STATE.layers ? STATE.layers[layer] : 50);

/** Preenche a célula (caminho já traçado) com a textura do terreno. */
function drawTerrainFill(type) {
  const p = envPattern(type);
  if (!p) return;
  ctx.save();
  ctx.globalAlpha = layerOpacity('terrain');
  ctx.fillStyle = p;
  ctx.fill();
  ctx.restore();
}

/* ---------------- Objetos e perigos (desenho vetorial, centro x,y, célula s) ---------------- */

function envFlame(g, x, y, r) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r * 1.6);
  grd.addColorStop(0, 'rgba(255, 210, 120, 0.55)'); grd.addColorStop(1, 'rgba(255, 150, 60, 0)');
  g.fillStyle = grd; g.beginPath(); g.arc(x, y, r * 1.6, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ff8a2a';
  g.beginPath(); g.moveTo(x, y + r * 0.6); g.quadraticCurveTo(x - r * 0.8, y, x - r * 0.1, y - r); g.quadraticCurveTo(x + r * 0.2, y - r * 0.4, x + r * 0.4, y - r * 0.8); g.quadraticCurveTo(x + r * 0.9, y, x, y + r * 0.6); g.fill();
  g.fillStyle = '#ffe9a8'; g.beginPath(); g.ellipse(x, y + r * 0.15, r * 0.25, r * 0.4, 0, 0, Math.PI * 2); g.fill();
}

function envOutline(g, w = 1.6) { g.strokeStyle = 'rgba(25, 18, 12, 0.85)'; g.lineWidth = w; }

const ENV_OBJECT_PAINTERS = {
  pedra(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(x + s * 0.06, y + s * 0.1, s * 0.34, s * 0.24, 0, 0, Math.PI * 2); g.fill();
    const grd = g.createLinearGradient(x - s * 0.3, y - s * 0.3, x + s * 0.3, y + s * 0.3);
    grd.addColorStop(0, '#b9b5ae'); grd.addColorStop(1, '#5d5a55');
    g.fillStyle = grd; envOutline(g);
    g.beginPath(); g.moveTo(x - s * 0.34, y + s * 0.05); g.lineTo(x - s * 0.2, y - s * 0.26); g.lineTo(x + s * 0.12, y - s * 0.3); g.lineTo(x + s * 0.34, y - s * 0.04); g.lineTo(x + s * 0.22, y + s * 0.24); g.lineTo(x - s * 0.18, y + s * 0.26); g.closePath(); g.fill(); g.stroke();
  },
  cadeira(g, x, y, s) {
    envOutline(g); g.fillStyle = '#8a5a30';
    g.fillRect(x - s * 0.18, y - s * 0.12, s * 0.36, s * 0.32); g.strokeRect(x - s * 0.18, y - s * 0.12, s * 0.36, s * 0.32);
    g.fillStyle = '#6a4224'; g.fillRect(x - s * 0.2, y - s * 0.24, s * 0.4, s * 0.1); g.strokeRect(x - s * 0.2, y - s * 0.24, s * 0.4, s * 0.1);
  },
  mesa(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x - s * 0.36, y - s * 0.22, s * 0.76, s * 0.5);
    envOutline(g); g.fillStyle = '#9a6a3a';
    g.fillRect(x - s * 0.4, y - s * 0.26, s * 0.8, s * 0.5); g.strokeRect(x - s * 0.4, y - s * 0.26, s * 0.8, s * 0.5);
    g.strokeStyle = 'rgba(60,35,15,0.6)'; g.lineWidth = 1;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - s * 0.4, y - s * 0.26 + i * s * 0.125); g.lineTo(x + s * 0.4, y - s * 0.26 + i * s * 0.125); g.stroke(); }
  },
  barril(g, x, y, s) {
    envOutline(g); g.fillStyle = '#8a5a2e'; g.beginPath(); g.arc(x, y, s * 0.3, 0, Math.PI * 2); g.fill(); g.stroke();
    g.strokeStyle = '#4a4a50'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, s * 0.24, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(x, y, s * 0.12, 0, Math.PI * 2); g.stroke();
  },
  bau(g, x, y, s) {
    envOutline(g); g.fillStyle = '#7a4a24';
    g.fillRect(x - s * 0.32, y - s * 0.2, s * 0.64, s * 0.4); g.strokeRect(x - s * 0.32, y - s * 0.2, s * 0.64, s * 0.4);
    g.fillStyle = '#d6a740'; g.fillRect(x - s * 0.32, y - s * 0.04, s * 0.64, s * 0.08);
    g.fillRect(x - s * 0.05, y - s * 0.08, s * 0.1, s * 0.16);
  },
  arvore(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x + s * 0.08, y + s * 0.1, s * 0.42, s * 0.36, 0, 0, Math.PI * 2); g.fill();
    envOutline(g);
    for (const [dx, dy, r, c] of [[-0.14, 0.06, 0.24, '#2f6a2a'], [0.14, 0.04, 0.24, '#2f6a2a'], [0, -0.14, 0.26, '#3e8434'], [0, 0.02, 0.2, '#4f9a3e']]) {
      g.fillStyle = c; g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  },
  muro(g, x, y, s) {
    const p = envPattern('wall');
    g.fillStyle = p || '#4b4a52'; envOutline(g, 2);
    g.fillRect(x - s * 0.45, y - s * 0.45, s * 0.9, s * 0.9); g.strokeRect(x - s * 0.45, y - s * 0.45, s * 0.9, s * 0.9);
  },
  tocha_parede(g, x, y, s) {
    envOutline(g); g.fillStyle = '#5a3a1e';
    g.fillRect(x - s * 0.04, y - s * 0.02, s * 0.08, s * 0.3); g.strokeRect(x - s * 0.04, y - s * 0.02, s * 0.08, s * 0.3);
    envFlame(g, x, y - s * 0.1, s * 0.16);
  },
  braseiro(g, x, y, s) {
    envOutline(g); g.fillStyle = '#2e2a28'; g.beginPath(); g.arc(x, y, s * 0.28, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#c4401c'; g.beginPath(); g.arc(x, y, s * 0.2, 0, Math.PI * 2); g.fill();
    envFlame(g, x - s * 0.06, y - s * 0.02, s * 0.14); envFlame(g, x + s * 0.08, y + s * 0.02, s * 0.12);
  },
  lampiao(g, x, y, s) {
    const grd = g.createRadialGradient(x, y, 0, x, y, s * 0.45);
    grd.addColorStop(0, 'rgba(255, 220, 140, 0.6)'); grd.addColorStop(1, 'rgba(255, 220, 140, 0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, s * 0.45, 0, Math.PI * 2); g.fill();
    envOutline(g); g.fillStyle = '#2e2a28'; g.fillRect(x - s * 0.13, y - s * 0.13, s * 0.26, s * 0.26); g.strokeRect(x - s * 0.13, y - s * 0.13, s * 0.26, s * 0.26);
    g.fillStyle = '#ffd36b'; g.fillRect(x - s * 0.08, y - s * 0.08, s * 0.16, s * 0.16);
  },
  cristal_luz(g, x, y, s) {
    const grd = g.createRadialGradient(x, y, 0, x, y, s * 0.45);
    grd.addColorStop(0, 'rgba(150, 220, 255, 0.6)'); grd.addColorStop(1, 'rgba(150, 220, 255, 0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, s * 0.45, 0, Math.PI * 2); g.fill();
    envOutline(g); g.fillStyle = '#8fd8ff';
    g.beginPath(); g.moveTo(x, y - s * 0.28); g.lineTo(x + s * 0.14, y); g.lineTo(x, y + s * 0.24); g.lineTo(x - s * 0.14, y); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - s * 0.04, y - s * 0.18); g.lineTo(x - s * 0.08, y); g.stroke();
  },
  /* ---- perigos ---- */
  espinhos(g, x, y, s) {
    g.fillStyle = 'rgba(60, 40, 30, 0.55)'; g.beginPath(); g.arc(x, y, s * 0.36, 0, Math.PI * 2); g.fill();
    envOutline(g, 1.2); g.fillStyle = '#b8b4ac';
    for (const [dx, dy] of [[-0.18, -0.12], [0.12, -0.18], [0.2, 0.1], [-0.08, 0.16], [0, -0.01], [-0.24, 0.08]]) {
      const px = x + dx * s, py = y + dy * s;
      g.beginPath(); g.moveTo(px, py - s * 0.12); g.lineTo(px + s * 0.06, py + s * 0.05); g.lineTo(px - s * 0.06, py + s * 0.05); g.closePath(); g.fill(); g.stroke();
    }
  },
  fogueira(g, x, y, s) {
    envOutline(g, 1.2);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillStyle = '#7a7670'; g.beginPath(); g.arc(x + Math.cos(a) * s * 0.28, y + Math.sin(a) * s * 0.28, s * 0.07, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.strokeStyle = '#5a3a1e'; g.lineWidth = s * 0.07; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - s * 0.18, y + s * 0.12); g.lineTo(x + s * 0.18, y - s * 0.1); g.moveTo(x - s * 0.18, y - s * 0.1); g.lineTo(x + s * 0.18, y + s * 0.12); g.stroke();
    envFlame(g, x, y, s * 0.2);
  },
  acido(g, x, y, s) {
    g.fillStyle = 'rgba(110, 200, 60, 0.75)'; envOutline(g, 1.2);
    g.beginPath(); g.ellipse(x, y, s * 0.36, s * 0.26, 0.3, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = 'rgba(220, 255, 170, 0.85)';
    for (const [dx, dy, r] of [[-0.12, -0.04, 0.05], [0.1, 0.06, 0.04], [0.02, -0.1, 0.03]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
  },
  armadilha_urso(g, x, y, s) {
    envOutline(g, 1.2); g.strokeStyle = '#4a4a50'; g.lineWidth = s * 0.05;
    g.beginPath(); g.arc(x, y, s * 0.26, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#c9c6c0';
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const px = x + Math.cos(a) * s * 0.24, py = y + Math.sin(a) * s * 0.24; g.beginPath(); g.moveTo(px, py); g.lineTo(x + Math.cos(a + 0.18) * s * 0.12, y + Math.sin(a + 0.18) * s * 0.12); g.lineTo(x + Math.cos(a - 0.18) * s * 0.12, y + Math.sin(a - 0.18) * s * 0.12); g.closePath(); g.fill(); }
    g.fillStyle = '#6a6a70'; g.beginPath(); g.arc(x, y, s * 0.06, 0, Math.PI * 2); g.fill();
  },
  runa_explosiva(g, x, y, s) {
    const grd = g.createRadialGradient(x, y, 0, x, y, s * 0.42);
    grd.addColorStop(0, 'rgba(255, 140, 40, 0.5)'); grd.addColorStop(1, 'rgba(255, 140, 40, 0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, s * 0.42, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ff9a3a'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, s * 0.28, 0, Math.PI * 2); g.stroke();
    g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const px = x + Math.cos(a) * s * 0.24, py = y + Math.sin(a) * s * 0.24; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); g.stroke();
  }
};

function drawEnvObject(g, type, x, y, s) {
  const painter = ENV_OBJECT_PAINTERS[type];
  if (!painter) return;
  g.save();
  painter(g, x, y, s);
  g.restore();
}

/* ---------------- Camada completa ---------------- */

/**
 * Perigos → objetos → clima → escuridão → brilho das luzes → prévia da forma.
 * Fica abaixo das áreas de movimento/alcance e dos tokens, para não esconder o jogo.
 */
function drawEnvironmentLayer() {
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const objs = STATE.objects || [];
  const terrainA = layerOpacity('terrain');
  for (const o of objs) {
    if (!HAZARD_TYPES[o.type]) continue;
    const p = getCellPixelCenter(o.col, o.row);
    ctx.save(); ctx.globalAlpha = terrainA; drawEnvObject(ctx, o.type, p.x, p.y, s); ctx.restore();
  }
  for (const o of objs) {
    if (!OBJECT_TYPES[o.type]) continue;
    const p = getCellPixelCenter(o.col, o.row);
    drawEnvObject(ctx, o.type, p.x, p.y, s);
  }

  const effA = layerOpacity('effects');
  for (const type of Object.keys(EFFECT_TYPES)) {
    if (EFFECT_TYPES[type].darkness) continue;
    const cells = effectCellSet(type);
    if (!cells.size) continue;
    const pat = envPattern(type);
    ctx.save(); ctx.globalAlpha = effA; ctx.fillStyle = pat;
    for (const k of cells) { const [c, r] = k.split(',').map(Number); drawPolygonCell(c, r); ctx.fill(); }
    ctx.restore();
  }

  const lightMap = computeLightMap();
  const dark = computeDarknessMap(lightMap);
  const darkAlpha = Math.min(0.95, effA * 1.5);
  if (Object.keys(dark).length) {
    ctx.save();
    for (const [k, level] of Object.entries(dark)) {
      const [c, r] = k.split(',').map(Number);
      drawPolygonCell(c, r);
      ctx.fillStyle = `rgba(6, 8, 20, ${(darkAlpha * level).toFixed(3)})`;
      ctx.fill();
    }
    ctx.restore();
  }
  // onde a luz vence a escuridão: tom quente discreto (fora da escuridão a luz não precisa aparecer)
  ctx.save();
  for (const k of effectCellSet('escuridao')) {
    const lv = lightMap[k];
    if (!lv) continue;
    const [c, r] = k.split(',').map(Number);
    drawPolygonCell(c, r);
    ctx.fillStyle = lv >= 2 ? 'rgba(255, 196, 110, 0.16)' : 'rgba(255, 180, 90, 0.08)';
    ctx.fill();
  }
  ctx.restore();

  // prévia da forma sendo pintada
  const prev = STATE.paint && STATE.paint.preview;
  if (prev && prev.length) {
    ctx.save();
    ctx.setLineDash([4, 3]);
    for (const c of prev) {
      drawPolygonCell(c.col, c.row);
      ctx.fillStyle = 'rgba(230, 185, 95, 0.22)'; ctx.fill();
      ctx.strokeStyle = 'rgba(230, 185, 95, 0.9)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }
}

/** Miniatura de um tipo (terreno, objeto, perigo ou clima) para as paletas da caixa de ferramentas. */
function environmentSwatchURL(type, size = 44) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (ENV_TILE_PAINTERS[type]) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = ENV_TILE;
    ENV_TILE_PAINTERS[type](tile.getContext('2d'), seededRandom(type.length * 7919 + type.charCodeAt(0)));
    if (EFFECT_TYPES[type]) { g.fillStyle = '#8f7a5a'; g.fillRect(0, 0, size, size); }
    g.drawImage(tile, 0, 0, size, size);
  } else if (type === 'escuridao') {
    g.fillStyle = '#0a0c18'; g.fillRect(0, 0, size, size);
    g.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x, y] of [[8, 9], [30, 14], [20, 32], [36, 36]]) g.fillRect(x, y, 1.5, 1.5);
  } else {
    g.fillStyle = 'rgba(160, 140, 110, 0.25)'; g.fillRect(0, 0, size, size);
    drawEnvObject(g, type, size / 2, size / 2, size * 0.95);
  }
  return c.toDataURL();
}
