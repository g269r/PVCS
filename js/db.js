/* ============================================================
   IndexedDB Database Layer – PVCS DMS
   ============================================================ */

const DB_NAME = 'PVCS_DMS';
const DB_VERSION = 1;

const STORES = {
  LETTERS: 'letters',
  BYLAWS_PAGES: 'bylaws_pages',
  COUNTERS: 'counters',
  SETTINGS: 'settings',
  RECIPIENTS: 'recipients',
};

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const d = e.target.result;

      // Letters store
      if (!d.objectStoreNames.contains(STORES.LETTERS)) {
        const ls = d.createObjectStore(STORES.LETTERS, { keyPath: 'did' });
        ls.createIndex('refNumber', 'refNumber', { unique: true });
        ls.createIndex('date', 'date', { unique: false });
        ls.createIndex('sender', 'sender', { unique: false });
        ls.createIndex('recipient', 'recipient', { unique: false });
        ls.createIndex('letterType', 'letterType', { unique: false });
        ls.createIndex('priority', 'priority', { unique: false });
        ls.createIndex('yearMonth', 'yearMonth', { unique: false });
      }

      // Bylaws pages store
      if (!d.objectStoreNames.contains(STORES.BYLAWS_PAGES)) {
        const bs = d.createObjectStore(STORES.BYLAWS_PAGES, { keyPath: 'page' });
        bs.createIndex('text', 'text', { unique: false });
      }

      // Counters store
      if (!d.objectStoreNames.contains(STORES.COUNTERS)) {
        d.createObjectStore(STORES.COUNTERS, { keyPath: 'id' });
      }

      // Settings store
      if (!d.objectStoreNames.contains(STORES.SETTINGS)) {
        d.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // Recipients store
      if (!d.objectStoreNames.contains(STORES.RECIPIENTS)) {
        d.createObjectStore(STORES.RECIPIENTS, { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

// Generic helpers
function txStore(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function dbGet(store, key) {
  return new Promise((res, rej) => {
    const req = txStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function dbPut(store, data) {
  return new Promise((res, rej) => {
    const req = txStore(store, 'readwrite').put(data);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function dbDelete(store, key) {
  return new Promise((res, rej) => {
    const req = txStore(store, 'readwrite').delete(key);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function dbGetAll(store) {
  return new Promise((res, rej) => {
    const req = txStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function dbClear(store) {
  return new Promise((res, rej) => {
    const req = txStore(store, 'readwrite').clear();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

// ---- Letter CRUD ----

const Letters = {
  async save(letter) {
    await openDB();
    return dbPut(STORES.LETTERS, letter);
  },

  async get(did) {
    await openDB();
    return dbGet(STORES.LETTERS, did);
  },

  async getAll() {
    await openDB();
    return dbGetAll(STORES.LETTERS);
  },

  async delete(did) {
    await openDB();
    return dbDelete(STORES.LETTERS, did);
  },

  async search(query) {
    const all = await this.getAll();
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(l =>
      (l.subject && l.subject.toLowerCase().includes(q)) ||
      (l.refNumber && l.refNumber.toLowerCase().includes(q)) ||
      (l.did && l.did.toLowerCase().includes(q)) ||
      (l.recipient && l.recipient.toLowerCase().includes(q)) ||
      (l.sender && l.sender.toLowerCase().includes(q)) ||
      (l.letterType && l.letterType.toLowerCase().includes(q)) ||
      (l.draftEn && l.draftEn.toLowerCase().includes(q)) ||
      (l.draftHi && l.draftHi.toLowerCase().includes(q))
    );
  },

  async countAll() {
    const all = await this.getAll();
    return all.length;
  },

  async countThisMonth() {
    const all = await this.getAll();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return all.filter(l => l.yearMonth === ym).length;
  },

  async countThisYear() {
    const all = await this.getAll();
    const year = String(new Date().getFullYear());
    return all.filter(l => l.did && l.did.includes(year)).length;
  },

  async getRecent(n = 5) {
    const all = await this.getAll();
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, n);
  },
};

// ---- Counters ----

const Counters = {
  async getDIDSeq() {
    await openDB();
    const rec = await dbGet(STORES.COUNTERS, 'did_seq');
    return rec ? rec.value : 0;
  },

  async incDIDSeq() {
    await openDB();
    const current = await this.getDIDSeq();
    const next = current + 1;
    await dbPut(STORES.COUNTERS, { id: 'did_seq', value: next });
    return next;
  },

  async getDailySeq(dateKey) {
    await openDB();
    const id = `daily_${dateKey}`;
    const rec = await dbGet(STORES.COUNTERS, id);
    return rec ? rec.value : 0;
  },

  async incDailySeq(dateKey) {
    await openDB();
    const id = `daily_${dateKey}`;
    const current = await this.getDailySeq(dateKey);
    const next = current + 1;
    await dbPut(STORES.COUNTERS, { id, value: next });
    return next;
  },
};

// ---- Settings ----

const Settings = {
  async get(key) {
    await openDB();
    const rec = await dbGet(STORES.SETTINGS, key);
    return rec ? rec.value : null;
  },

  async set(key, value) {
    await openDB();
    return dbPut(STORES.SETTINGS, { key, value });
  },
};

// ---- Bylaws ----

const Bylaws = {
  async savePages(pages) {
    await openDB();
    await dbClear(STORES.BYLAWS_PAGES);
    for (const p of pages) {
      await dbPut(STORES.BYLAWS_PAGES, p);
    }
  },

  async getAll() {
    await openDB();
    return dbGetAll(STORES.BYLAWS_PAGES);
  },

  async count() {
    const all = await this.getAll();
    return all.length;
  },
};

// ---- Recipients ----

const Recipients = {
  defaults: [
    'DCO Patna', 'BCO Patna', 'Registrar Cooperative Societies',
    'District Magistrate, Patna', 'SDO Patna', 'CEO Patna',
    'Housing Union', 'Bihar Government', 'Central Government',
    'Block Development Officer', 'Circle Officer', 'Sub Divisional Magistrate',
    'Agriculture Department Bihar', 'Cooperative Department Bihar',
    'Revenue Department Bihar', 'Land Reform Commissioner',
  ],

  async getAll() {
    await openDB();
    const saved = await dbGetAll(STORES.RECIPIENTS);
    const savedNames = saved.map(r => r.name);
    const allNames = [...new Set([...this.defaults, ...savedNames])];
    return allNames.sort();
  },

  async add(name) {
    await openDB();
    const all = await this.getAll();
    if (!all.includes(name)) {
      await dbPut(STORES.RECIPIENTS, { name });
    }
  },
};

// ---- Full Backup / Restore ----

const Backup = {
  async exportAll() {
    await openDB();
    const letters = await Letters.getAll();
    const bylawsPages = await Bylaws.getAll();
    const counters = await dbGetAll(STORES.COUNTERS);
    const settings = await dbGetAll(STORES.SETTINGS);
    const recipients = await dbGetAll(STORES.RECIPIENTS);
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      society: 'PVCS-PS',
      letters,
      bylawsPages,
      counters,
      settings,
      recipients,
    };
  },

  async importAll(data) {
    await openDB();
    if (data.letters) {
      await dbClear(STORES.LETTERS);
      for (const l of data.letters) await dbPut(STORES.LETTERS, l);
    }
    if (data.bylawsPages) {
      await dbClear(STORES.BYLAWS_PAGES);
      for (const p of data.bylawsPages) await dbPut(STORES.BYLAWS_PAGES, p);
    }
    if (data.counters) {
      await dbClear(STORES.COUNTERS);
      for (const c of data.counters) await dbPut(STORES.COUNTERS, c);
    }
    if (data.settings) {
      await dbClear(STORES.SETTINGS);
      for (const s of data.settings) await dbPut(STORES.SETTINGS, s);
    }
    if (data.recipients) {
      await dbClear(STORES.RECIPIENTS);
      for (const r of data.recipients) await dbPut(STORES.RECIPIENTS, r);
    }
    // Reset in-memory db
    db = null;
  },
};
