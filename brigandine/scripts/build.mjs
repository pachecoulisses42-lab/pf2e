#!/usr/bin/env node
/**
 * Build sem dependências: junta CSS, JS e ícones em um único HTML autossuficiente.
 *   node scripts/build.mjs
 * Saídas (dist/):
 *   brigandine_pf2e_tatico_v5.html  – app completo, abre direto no navegador
 *   brigandine-ds.css               – design system (tokens + componentes) para reuso
 *   design-system.html              – documentação visual do design system
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (...p) => readFileSync(join(root, ...p), 'utf8');

const CSS_ORDER = ['tokens', 'base', 'components', 'layout', 'theme-parchment'];
const css = CSS_ORDER.map((n) => `/* --- ${n}.css --- */\n${read('src/styles', `${n}.css`)}`).join('\n');

const jsFiles = readdirSync(join(root, 'src/js')).filter((f) => f.endsWith('.js')).sort();
// tokens extras (src/tokens-extra): imagens embutidas como data URL antes dos módulos
const extraManifest = JSON.parse(read('src/tokens-extra/manifest.json'));
const extraGroups = extraManifest.groups.map((g) => ({
  ...g,
  items: g.items.map(({ file, ...it }) => ({ ...it, src: `data:image/webp;base64,${readFileSync(join(root, 'src/tokens-extra', file)).toString('base64')}` }))
}));
const extraJs = `/* ===== tokens-extra (gerado no build) ===== */\nconst EXTRA_TOKEN_GROUPS = ${JSON.stringify(extraGroups)};\n`;
const js = extraJs + jsFiles.map((f) => `/* ===== ${f} ===== */\n${read('src/js', f)}`).join('\n');

const icons = read('src/icons.svg');

const html = read('src/index.html')
  .replace('/*@css*/', () => css)
  .replace('<!--@icons-->', () => icons)
  .replace('/*@js*/', () => js);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/brigandine_pf2e_tatico_v5.html'), html);
writeFileSync(join(root, 'dist/brigandine-ds.css'), css);
// --- página do design system (renderiza os tokens dos dois estilos em tempo de build) ---
const tokenCtx = vm.createContext({});
for (const f of jsFiles.filter((n) => /^00[a-z]/.test(n))) vm.runInContext(read('src/js', f), tokenCtx, { filename: f });
const NAMES = {
  guerreiro: 'Guerreiro', paladino: 'Paladino', barbaro: 'Bárbaro', clerigo: 'Clérigo', bardo: 'Bardo', feiticeiro: 'Feiticeiro',
  mago: 'Mago', ranger: 'Ranger', rogue: 'Rogue', goblin: 'Goblin', lobo: 'Lobo Atroz', bandido: 'Bandido',
  druida: 'Druida', monge: 'Monge', alquimista: 'Alquimista', bruxa: 'Bruxa', espadachim: 'Espadachim',
  esqueleto: 'Esqueleto', orc: 'Orc', cultista: 'Cultista', zumbi: 'Zumbi', kobold: 'Kobold'
};
const gallery = (style) => vm.runInContext(`Object.keys(TOKEN_STYLES['${style}'].svgs).map(k => [k, TOKEN_STYLES['${style}'].svgs[k]()])`, tokenCtx)
  .map(([k, svg]) => `<div class="tok">${svg}<b>${NAMES[k] ?? k}</b><span>${vm.runInContext(`VILLAIN_SCULPTS.has('${k}')`, tokenCtx) ? 'vilão' : 'herói'}</span></div>`)
  .join('');
const tokens = gallery('chibi');
const tokensTopdown = gallery('topo');
const docHtml = read('docs/design-system.src.html')
  .replace('/*@css*/', () => css)
  .replace('<!--@tokens-->', () => tokens)
  .replace('<!--@tokens-topdown-->', () => tokensTopdown)
  .replace('<!--@icons-->', () => icons)
  .replace('/*@icons-js*/', '');
writeFileSync(join(root, 'dist/design-system.html'), docHtml);

console.log(`ok  dist/brigandine_pf2e_tatico_v5.html (${(html.length / 1024).toFixed(0)} KB, ${jsFiles.length} módulos JS)\nok  dist/design-system.html, dist/brigandine-ds.css`);
