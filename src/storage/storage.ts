/**
 * Browser storage for Siftly: IndexedDB first, localStorage fallback, and an
 * in-memory store as a last resort (private browsing modes that block both).
 * All values are strings — zustand's persist layer handles JSON.
 *
 * Every accessor awaits `initStorage()` first, so stores created at module
 * load never hydrate from (or write to) the wrong backend.
 */

const DB_NAME = 'siftly';
const DB_VERSION = 1;
const STORE = 'kv';
const PROBE_KEY = '__siftly_probe';

export type StorageMode = 'idb' | 'local' | 'memory';

let mode: StorageMode = 'memory';
const memory = new Map<string, string>();
let dbPromise: Promise<IDBDatabase | null> | null = null;
let initPromise: Promise<StorageMode> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        if (typeof indexedDB === 'undefined') {
          resolve(null);
          return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function idbGet(db: IDBDatabase, name: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(name);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db: IDBDatabase, name: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbDel(db: IDBDatabase, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(name);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Detect the best available store. Idempotent and awaited by every accessor.
 */
export function initStorage(): Promise<StorageMode> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await openDb();
      if (db) {
        try {
          await idbSet(db, PROBE_KEY, '1');
          await idbDel(db, PROBE_KEY);
          mode = 'idb';
          return mode;
        } catch {
          /* try localStorage */
        }
      }
      try {
        localStorage.setItem(PROBE_KEY, '1');
        localStorage.removeItem(PROBE_KEY);
        mode = 'local';
        return mode;
      } catch {
        mode = 'memory';
        return mode;
      }
    })();
  }
  return initPromise;
}

export function storageMode(): StorageMode {
  return mode;
}

export const appStorage = {
  async getItem(name: string): Promise<string | null> {
    await initStorage();
    if (mode === 'idb') {
      const db = await openDb();
      if (db) {
        try {
          return await idbGet(db, name);
        } catch {
          /* fall through */
        }
      }
    }
    if (mode === 'local') {
      try {
        return localStorage.getItem(name);
      } catch {
        /* fall through */
      }
    }
    return memory.get(name) ?? null;
  },

  async setItem(name: string, value: string): Promise<void> {
    await initStorage();
    if (mode === 'idb') {
      const db = await openDb();
      if (db) {
        try {
          await idbSet(db, name, value);
          return;
        } catch {
          /* fall through */
        }
      }
    }
    if (mode === 'local') {
      try {
        localStorage.setItem(name, value);
        return;
      } catch {
        /* fall through */
      }
    }
    memory.set(name, value);
  },

  async removeItem(name: string): Promise<void> {
    await initStorage();
    if (mode === 'idb') {
      const db = await openDb();
      if (db) {
        try {
          await idbDel(db, name);
          return;
        } catch {
          /* fall through */
        }
      }
    }
    if (mode === 'local') {
      try {
        localStorage.removeItem(name);
        return;
      } catch {
        /* fall through */
      }
    }
    memory.delete(name);
  },
};
