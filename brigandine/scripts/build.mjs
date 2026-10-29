#!/usr/bin/env node
/**
 * Build sem dependências: junta CSS, JS e ícones em um único HTML autossuficiente.
 *   node scripts/build.mjs
 * Saídas (dist/):
 *   brigandine_pf2e_tatico_v5.html  – app completo, abre direto no navegador
 *   brigandine-ds.css               – design system (tokens + componentes) para reuso
 *   design-system.html              – documentação visual do design system
 * `node scripts/build.mjs --local` (npm run build:local) acrescenta os pacotes de src/tokens-local/
 * (licença sem redistribuição, fora do git) e grava só dist-local/brigandine_pf2e_tatico_v5.html.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
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
const LOCAL = process.argv.includes('--local');
const localManifestPath = join(root, 'src/tokens-local/manifest.json');
if (LOCAL && !existsSync(localManifestPath)) {
  console.error('Nenhum pacote local: rode scripts/importar-tokens-locais.py antes de npm run build:local.');
  process.exit(1);
}
const localManifest = LOCAL ? JSON.parse(readFileSync(localManifestPath, 'utf8')) : null;
if (localManifest) {
  for (const g of localManifest.groups) {
    extraGroups.push({ ...g, items: g.items.map(({ file, ...it }) => ({ ...it, src: `data:image/webp;base64,${readFileSync(join(root, 'src/tokens-local', file)).toString('base64')}` })) });
  }
}
const extraJs = `/* ===== tokens-extra (gerado no build) ===== */\nconst EXTRA_TOKEN_GROUPS = ${JSON.stringify(extraGroups)};\n` +
  (localManifest ? `const LOCAL_PIECES = ${JSON.stringify(localManifest.pieces)};\n` : '');
const js = extraJs + jsFiles.map((f) => `/* ===== ${f} ===== */\n${read('src/js', f)}`).join('\n');

const icons = read('src/icons.svg');

const html = read('src/index.html')
  .replace('/*@css*/', () => css)
  .replace('<!--@icons-->', () => icons)
  .replace('/*@js*/', () => js);

if (LOCAL) {
  // cópia pessoal: nunca vai para o repositório (dist-local/ está no .gitignore)
  mkdirSync(join(root, 'dist-local'), { recursive: true });
  writeFileSync(join(root, 'dist-local/brigandine_pf2e_tatico_v5.html'), html);
  console.log('dist-local/brigandine_pf2e_tatico_v5.html (com tokens locais)');
  process.exit(0);
}
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
