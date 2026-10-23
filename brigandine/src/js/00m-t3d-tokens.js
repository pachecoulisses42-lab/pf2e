/* ============================================================================
   1m. TOKENS 3D — os 9 personagens e utilidades (miniatura, modelo em cache)
   Chaves t3_<nome>. Cada personagem é uma configuração do boneco base (00l).
   ============================================================================ */
const T3D_TOKENS = {
  t3_elfo_chama: { name: 'Elfo da Chama', attack: 'sword',
    skin: '#e8b48a', hair: '#d9a441', hairStyle: 'long', ears: 'elf', brow: '#8a5a1e',
    top: '#2b3a5c', armor: '#8a8f98', vest: '#2b3a5c', straps: '#7c4a1e',
    robe: '#c2410c', robeLen: 0.6, robe2: '#2b3a5c', robeJag: 0.12, pants: '#1f2937', boots: '#2d2d33', wraps: '#7c4a1e',
    belt: '#7c4a1e', buckle: '#9ca3af', gloves: '#3b3f47', bracers: '#8a8f98',
    right: { kind: 'sword' }, blade: '#f97316', glowBlade: true, guard: '#6b7280',
    flameHand: 'always',
    back: [{ kind: 'greatsword', pos: [0, 0.3, -0.2], rot: [0, 0, 2.4] }] },
  t3_ladina: { name: 'Ladina Encapuzada', attack: 'dagger',
    skin: '#c98b62', hat: 'hood', hatColor: '#4b5563', faceShadow: true, scarf: '#4b5563',
    top: '#e7e1d3', sleeveColor: '#e7e1d3', vest: '#6b2f2a', armor: '#6b2f2a', straps: '#5a2a22',
    robe: '#4b5563', robeLen: 0.75, robe2: '#8b8f99', robeJag: 0.1,
    pants: '#3b2a26', boots: '#5a2a22', gloves: '#5a2a22', bracers: '#5a2a22', belt: '#5a2a22', buckle: '#9ca3af', bag: '#6b2f2a',
    right: { kind: 'dagger' }, left: { kind: 'dagger' } },
  t3_monge_laranja: { name: 'Monge do Manto Laranja', attack: 'fist',
    skin: '#e0a676', hairStyle: 'bald', brow: '#5b3a1e',
    top: '#d97706', sleeve: 'wide', scarf: '#f5f0e1',
    robe: '#c2650a', robeLen: 0.72, robe2: '#e9d9b8', robeFlare: 0.36,
    belt: '#6b5a3a', sash: '#6b5a3a', pants: '#1f1f1f', boots: '#5a3a1e', wraps: '#e9e1cf', gloves: '#6b4a2b', bracers: '#e9e1cf' },
  t3_sacerdote: { name: 'Sacerdote', attack: 'sword',
    skin: '#d9a07a', hair: '#2b1d14', hairStyle: 'long', beard: 'short', brow: '#2b1d14',
    top: '#efe6d6', sleeve: 'wide', scarf: '#efe6d6', armor: '#e6dcc8', cross: '#a33a1e',
    robe: '#efe6d6', robeLen: 0.8, robe2: '#8b4a2b', robeFlare: 0.37,
    belt: '#4a2f1e', buckle: '#9ca3af', boots: '#3b2a20', gloves: '#4a2f1e', bracers: '#4a2f1e', bag: '#7a3b20',
    right: { kind: 'mace' } },
  t3_mago_branco: { name: 'Mago Branco', attack: 'staff',
    skin: '#d9a07a', hair: '#f1f5f9', hairStyle: 'long', beard: 'long', beardColor: '#f8fafc', brow: '#f1f5f9',
    hat: 'wizard', hatColor: '#e5e2da', hatBand: '#bdb8ad',
    top: '#e5e2da', sleeve: 'wide', robe: '#e5e2da', robeLen: 0.8, robe2: '#9ca3af', robeFlare: 0.37, robeJag: 0.12,
    belt: '#7c4a1e', buckle: '#d1d5db', bag: '#a0602c', books: '#a0602c', boots: '#6b3f1f', gloves: '#d9a07a', pants: '#6b3f1f',
    right: { kind: 'staff', rot: [0, 0, 0], pos: [0, -0.05, 0.02] }, staffTop: 'star', wood: '#5b3a1e' },
  t3_monge_espada: { name: 'Monge Espadachim', attack: 'sword',
    skin: '#e0a676', hairStyle: 'bald', brow: '#3b2a1e',
    top: '#e9e4d6', sleeve: 'wide', vest: '#6b4a2b', straps: '#5c3b22',
    robe: '#6b4a2b', robeLen: 0.5, robe2: '#e9e4d6',
    pants: '#4b5563', belt: '#5c3b22', sash: '#5c3b22', boots: '#4a2f1e', wraps: '#4a2f1e', gloves: '#4a2f1e', bag: '#5c3b22',
    right: { kind: 'katana' } },
  t3_monge_aprendiz: { name: 'Monge Aprendiz', attack: 'fist', headScale: 1.38,
    skin: '#e8b07a', hairStyle: 'bald', brow: '#5b3a1e',
    top: '#8b5a3c', sleeve: 'wide', vest: '#6b3f26', straps: '#5a341e',
    robe: '#8b5a3c', robeLen: 0.45, robe2: '#c9a27a',
    pants: '#7a4a2c', boots: '#5a341e', wraps: '#6b3f26', belt: '#5a341e', sash: '#5a341e', gloves: '#3b2416' },
  t3_arqueira: { name: 'Arqueira Élfica', attack: 'bow',
    skin: '#f0c49a', hair: '#e8d9a8', hairStyle: 'short', ears: 'elf', eyes: '#16a34a',
    hat: 'hood', hatColor: '#3f5f3a', scarf: '#3f5f3a',
    top: '#4a5d3a', armor: '#c8b79a', vest: '#6b4a2b',
    robe: '#6b4a2b', robeLen: 0.45, robe2: '#3f5f3a', cape: '#3f5f3a',
    pants: '#3d2b1f', boots: '#5c3b22', wraps: '#c8b79a', belt: '#5c3b22', buckle: '#d6d3d1', gloves: '#2f2a24',
    quiver: '#8b5a2b', left: { kind: 'bow', rot: [0, 0, Math.PI / 2], pos: [0, -0.06, 0.02] }, wood: '#b0713a' },
  t3_mago_cinza: { name: 'Mago Cinzento', attack: 'dagger',
    skin: '#e8b48a', hair: '#e5e7eb', hairStyle: 'long', beard: 'long', beardColor: '#f1f5f9', ears: 'elf', brow: '#e5e7eb',
    hat: 'wizard', hatColor: '#5b6b80', hatBand: '#b45348',
    top: '#5b6b80', sleeve: 'wide', scarf: '#b45348',
    robe: '#5b6b80', robeLen: 0.8, robe2: '#8b3a3a', robeFlare: 0.38,
    pants: '#3f2a1e', boots: '#6b3f1f', belt: '#7c4a1e', buckle: '#d4a017', books: '#6d4c2a', bag: '#7c4a1e', gloves: '#e8b48a',
    right: { kind: 'dagger' } }
};

const T3D_MODEL_CACHE = {};
const T3D_THUMB_CACHE = {};

function is3DToken(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(T3D_TOKENS, key);
}

function t3dModel(key) {
  if (!T3D_MODEL_CACHE[key]) T3D_MODEL_CACHE[key] = t3dHumanoid(T3D_TOKENS[key]);
  return T3D_MODEL_CACHE[key];
}

/** Miniatura (PNG) do boneco parado, de frente, para galerias e seletores. */
function t3dThumbnail(key) {
  if (T3D_THUMB_CACHE[key]) return T3D_THUMB_CACHE[key];
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0, 0, 0, 0.22)';
  g.beginPath(); g.ellipse(80, 140, 44, 16, 0, 0, Math.PI * 2); g.fill();
  const { pose, rootOffset, flags } = t3dPose('idle', 0.4, t3dModel(key).style);
  t3dDraw(g, t3dModel(key), { x: 80, y: 140, scale: 58, yaw: -0.45, pose, rootOffset, flags });
  T3D_THUMB_CACHE[key] = c.toDataURL('image/png');
  return T3D_THUMB_CACHE[key];
}
