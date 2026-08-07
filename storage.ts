/**
 * Service de stockage persistant utilisant IndexedDB avec secours sur LocalStorage.
 * Permet de conserver durablement le menu, les plats, les blogs et les commandes.
 */

const DB_NAME = 'KhadysFoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB non supporté"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const persistentStorage = {
  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result !== undefined && req.result !== null) {
            resolve(req.result as T);
          } else {
            // Tente de lire depuis localStorage
            try {
              const localVal = localStorage.getItem(key);
              resolve(localVal ? JSON.parse(localVal) : defaultValue);
            } catch {
              resolve(defaultValue);
            }
          }
        };
        req.onerror = () => {
          try {
            const localVal = localStorage.getItem(key);
            resolve(localVal ? JSON.parse(localVal) : defaultValue);
          } catch {
            resolve(defaultValue);
          }
        };
      });
    } catch {
      // Fallback sur LocalStorage si IndexedDB échoue
      try {
        const localVal = localStorage.getItem(key);
        return localVal ? JSON.parse(localVal) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    // Toujours sauvegarder dans LocalStorage pour la compatibilité immédiate (si la taille le permet)
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Storage] LocalStorage plein pour ${key}, IndexedDB prend le relais.`, e);
    }

    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error(`[Storage] Erreur écriture IndexedDB pour ${key}:`, e);
    }
  }
};
