/* Exemplo de token novo (Druida). Cole em src/js/00e-chibi-heroes.js (heróis) ou 00f-chibi-villains.js (vilões). */
CHIBI_SVGS.druida = () => CB.frame('c_druida', {
  faction: 'hero', accent: '#5fae6a',
  art: (id) => {
    const h = chead(id, { skin: SKIN, eyes: 'round', eyeColor: '#4a9a50', mouth: 'smile', brow: '#5a3a1e', ears: 'pointed' });
    return { body: `
      ${cb('M90 146 Q70 194 84 216 L172 216 Q186 194 166 146Z', '#3f7a46')}
      ${clegs({ pants: '#6a4a30', boot: '#4a3426' })}
      ${ctorso({ fill: '#5fae6a' })}
      ${cb('M108 148 L148 148 L146 196 Q128 204 110 196Z', '#8bcf86')}
      ${cb('M100 176 Q128 187 156 176 L156 185 Q128 196 100 185Z', '#6a4a2a')}${cc(128, 184, 5, '#f0c84a', 3)}
      ${ccap(206, 224, 206, 52, 8, '#8a6038')}${cb('M206 28 C190 30 186 52 206 62 C226 52 222 30 206 28Z', '#7fd070')}${csh('M198 38 C198 46 202 52 206 55', 0.7)}
      ${carm(1, 206, 152, '#5fae6a', SKIN)}
      ${carm(-1, 84, 176, '#5fae6a', SKIN)}
      ${h.back}${h.head}
      ${cb('M80 92 C76 50 100 34 128 34 C156 34 180 50 176 92 C166 76 150 66 128 66 C106 66 90 76 80 92Z', '#3f7a46')}
      ${cb('M104 44 L92 14 L112 34Z M152 44 L164 14 L144 34Z', '#c9a86a', 4)}
      ${cb('M84 80 Q128 66 172 80 L172 88 Q128 74 84 88Z', '#f0c84a', 3.5)}
      ${csh('M96 54 Q108 44 126 42', 0.6)}` };
  }
});
