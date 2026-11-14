/* ============================================================================
   15e. CENAS — repositório
   Mesma interface assíncrona sobre IndexedDB (principal), localStorage (reserva)
   ou memória (último recurso). Metadados e tabuleiros ficam separados para a
   lista abrir rápido.
   ============================================================================ */

const SCENE_DB_NAME = 'brigandine';
const SCENE_DB_VERSION = 1;

function idbRequest(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeIdbBackend(db) {
  const tx = (stores, mode) => db.transaction(stores, mode);
  const done = (t) => new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('transação abortada'));
  });
  return {
    kind: 'indexeddb',
    listMeta: () => idbRequest(tx(['sceneMeta'], 'readonly').objectStore('sceneMeta').getAll()),
    async get(id) {
      const t = tx(['sceneMeta', 'sceneBody'], 'readonly');
      const [meta, body] = await Promise.all([idbRequest(t.objectStore('sceneMeta').get(id)), idbRequest(t.objectStore('sceneBody').get(id))]);
      return meta ? joinScene(meta, body) : null;
    },
    async put(scene) {
      const { meta, body } = splitScene(scene);
      const t = tx(['sceneMeta', 'sceneBody'], 'readwrite');
      t.objectStore('sceneMeta').put(meta);
      t.objectStore('sceneBody').put(body);
      await done(t);
    },
    async putMetas(metas) {
      const t = tx(['sceneMeta'], 'readwrite');
      for (const m of metas) t.objectStore('sceneMeta').put(m);
      await done(t);
    },
    async remove(id) {
      const t = tx(['sceneMeta', 'sceneBody'], 'readwrite');
      t.objectStore('sceneMeta').delete(id);
      t.objectStore('sceneBody').delete(id);
      await done(t);
    },
    async getKV(key) {
      const row = await idbRequest(tx(['kv'], 'readonly').objectStore('kv').get(key));
      return row ? row.value : null;
    },
    async setKV(key, value) {
      const t = tx(['kv'], 'readwrite');
      t.objectStore('kv').put({ key, value });
      await done(t);
    }
  };
}

function openSceneDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('sem IndexedDB')); return; }
    const req = indexedDB.open(SCENE_DB_NAME, SCENE_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sceneMeta')) db.createObjectStore('sceneMeta', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sceneBody')) db.createObjectStore('sceneBody', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('banco bloqueado por outra aba'));
  });
}

/** Reserva/memória: `storage` é localStorage ou um Map com a mesma cara. */
function makeKeyValueBackend(storage, kind) {
  const META = 'brigandine_scene_meta_v1';
  const read = (k) => { const v = storage.getItem(k); return v ? JSON.parse(v) : null; };
  const write = (k, v) => storage.setItem(k, JSON.stringify(v));
  const metas = () => read(META) || [];
  return {
    kind,
    listMeta: async () => metas(),
    async get(id) {
      const meta = metas().find(m => m.id === id);
      return meta ? joinScene(meta, read(`brigandine_scene_${id}`)) : null;
    },
    async put(scene) {
      const { meta, body } = splitScene(scene);
      write(`brigandine_scene_${scene.id}`, body); // corpo primeiro: se faltar espaço, a lista não aponta para nada
      write(META, [...metas().filter(m => m.id !== scene.id), meta]);
    },
    async putMetas(list) {
      const byId = new Map(metas().map(m => [m.id, m]));
      for (const m of list) byId.set(m.id, m);
      write(META, [...byId.values()]);
    },
    async remove(id) {
      storage.removeItem(`brigandine_scene_${id}`);
      write(META, metas().filter(m => m.id !== id));
    },
    getKV: async (key) => read(`brigandine_kv_${key}`),
    setKV: async (key, value) => write(`brigandine_kv_${key}`, value)
  };
}

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

/** Escolhe o melhor armazenamento disponível. Nunca rejeita: no pior caso, memória. */
async function openSceneStore() {
  try {
    return makeIdbBackend(await openSceneDb());
  } catch (e) {
    try {
      const probe = '__brigandine_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return makeKeyValueBackend(localStorage, 'localstorage');
    } catch (e2) {
      return makeKeyValueBackend(memoryStorage(), 'memory');
    }
  }
}
