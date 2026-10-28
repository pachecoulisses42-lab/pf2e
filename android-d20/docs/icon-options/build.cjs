const { chromium } = require('playwright');
const fs = require('fs');
const FONT = fs.readFileSync('poppins_extrabold.ttf').toString('base64');
const INK = '#141109', CREAM = '#F0EADF', SW = 30, SH = 34;
const hexPts = (cx, cy, R, rot = -90) => [...Array(6)].map((_, k) => { const a = (rot + 60 * k) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
const poly = (pts) => pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ');
// Shape drawn twice: hard offset shadow, then fill + outline.
const solid = (el, fill, extra = '') => `<g>${el.replace('/>', ` fill="${INK}" transform="translate(${SH} ${SH})"/>`)}${el.replace('/>', ` fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" ${extra}/>`)}</g>`;
function die(cx, cy, R, fill, label, labelFill = INK, sw = SW) {
  const h = hexPts(cx, cy, R), t = [-30, 90, 210].map(a => [cx + R * .62 * Math.cos(a * Math.PI / 180), cy + R * .62 * Math.sin(a * Math.PI / 180)]);
  const hexIdx = { 0: [0, 1, 5].map(i => i), };
  // triangle vertex i (angle -30/90/210) is at hex index 1/3/5; connect to itself and its two neighbours
  const links = [[1, 0, 2], [3, 2, 4], [5, 4, 0]];
  let lines = ''; t.forEach((p, i) => { const [hi, n1, n2] = links[i]; [hi, n1, n2].forEach(j => lines += `<line x1="${p[0]}" y1="${p[1]}" x2="${h[j][0]}" y2="${h[j][1]}"/>`); });
  return `<g>
    <polygon points="${poly(h)}" fill="${INK}" transform="translate(${SH} ${SH})"/>
    <polygon points="${poly(h)}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
    <g stroke="${INK}" stroke-width="${sw * .66}" stroke-linecap="round" fill="none">${lines}<polygon points="${poly(t)}" stroke-linejoin="round"/></g>
    ${label ? `<text x="${cx}" y="${cy + R * .02}" font-family="PopX" font-weight="800" font-size="${R * .33}" text-anchor="middle" fill="${labelFill}" dominant-baseline="middle" style="letter-spacing:-1px">${label}</text>` : ''}
  </g>`;
}
const icons = [
  { name: '1-dado-mostarda', title: 'Dado Mostarda', bg: CREAM, art: () => die(500, 500, 300, '#E8B53F', '20') },
  { name: '2-critico', title: 'Crítico', bg: '#F4705F', art: () => {
      let rays = ''; for (let k = 0; k < 16; k++) { const a = k * 22.5 * Math.PI / 180; rays += `<line x1="${512 + 360 * Math.cos(a)}" y1="${512 + 360 * Math.sin(a)}" x2="${512 + 440 * Math.cos(a)}" y2="${512 + 440 * Math.sin(a)}"/>`; }
      return `<g stroke="${INK}" stroke-width="${SW * .8}" stroke-linecap="round">${rays}</g>` + die(490, 490, 270, CREAM, '20'); } },
  { name: '3-escudo-e-dado', title: 'Escudo & Dado', bg: '#4A93F5', art: () => {
      const s = `<path d="M512 170 L760 250 V500 C760 650 650 760 512 830 C374 760 264 650 264 500 V250 Z"/>`;
      return solid(s, CREAM) + die(512, 480, 130, '#E8B53F', '', INK, 22); } },
  { name: '4-grimorio', title: 'Grimório', bg: '#9A7BD9', art: () => {
      const b = `<rect x="262" y="190" width="440" height="600" rx="34"/>`;
      return solid(b, '#1FAE83') + `<rect x="262" y="190" width="96" height="600" rx="34" fill="${INK}"/><rect x="332" y="190" width="26" height="600" fill="${INK}"/>` + die(540, 490, 120, '#E8B53F', '', INK, 22); } },
  { name: '5-vinte', title: 'Vinte', bg: '#1FAE83', art: () => {
      const t = (dx, dy, fill, stroke) => `<text x="${512 + dx}" y="${560 + dy}" font-family="PopX" font-weight="800" font-size="470" text-anchor="middle" dominant-baseline="middle" fill="${fill}" ${stroke ? `stroke="${INK}" stroke-width="${SW * 2}" stroke-linejoin="round"` : ''} style="letter-spacing:-14px">20</text>`;
      return t(SH, SH, INK, true) + t(0, 0, '#E8B53F', true) + t(0, 0, '#E8B53F', false); } },
];
const svg = (ic, full = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs><style>@font-face{font-family:PopX;font-weight:800;src:url(data:font/ttf;base64,${FONT})}</style></defs><rect width="1024" height="1024" fill="${ic.bg}"/>${ic.art()}</svg>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const ic of icons) {
    fs.writeFileSync(`${ic.name}.svg`, svg(ic));
    await p.goto('file://' + process.cwd() + `/${ic.name}.svg`); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `${ic.name}.png` });
  }
  const cell = (ic) => `<div class="c"><div class="big"><img src="${ic.name}.svg"></div>
    <div class="row"><div class="m" style="border-radius:50%"><img src="${ic.name}.svg"></div><div class="m" style="border-radius:30%"><img src="${ic.name}.svg"></div><div class="m" style="border-radius:14%"><img src="${ic.name}.svg"></div></div>
    <div class="t">${ic.title}</div></div>`;
  const html = `<style>@font-face{font-family:Pop;font-weight:800;src:url(poppins_extrabold.ttf)}body{margin:0;background:${CREAM};font-family:Pop}
  .h{padding:46px 56px 0;font-size:34px;font-weight:800;color:${INK}}.s{padding:4px 56px 0;font-size:15px;color:#6a6253;font-family:Pop}
  .g{display:grid;grid-template-columns:repeat(5,1fr);gap:28px;padding:34px 56px}.c{display:flex;flex-direction:column;gap:18px;align-items:center}
  .big{width:100%;aspect-ratio:1;border:4px solid ${INK};border-radius:22px;overflow:hidden;box-shadow:8px 8px 0 ${INK}}img{width:100%;height:100%;display:block}
  .row{display:flex;gap:16px;align-items:center}.m{width:64px;height:64px;overflow:hidden;border:2px solid ${INK}}.t{font-size:18px;font-weight:800;color:${INK}}</style>
  <div class="h">D20 Companion — 5 opções de ícone</div><div class="s">Visão cheia · máscaras de launcher: círculo · squircle · quadrado arredondado</div><div class="g">${icons.map(cell).join('')}</div>`;
  fs.writeFileSync('sheet.html', html);
  const q = await b.newPage({ viewport: { width: 1900, height: 620 } });
  await q.goto('file://' + process.cwd() + '/sheet.html'); await q.evaluate(() => document.fonts.ready); await q.waitForTimeout(500);
  await q.screenshot({ path: 'comparativo.png', fullPage: true });
  await b.close();
})();
