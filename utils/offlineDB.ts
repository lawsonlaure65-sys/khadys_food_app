import { MenuItem, CartItem, Order } from '../types';

const DB_NAME = 'KhadysFoodDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB non supporté par ce navigateur.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('menu')) {
        db.createObjectStore('menu', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('pendingOrders')) {
        db.createObjectStore('pendingOrders', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.warn('Avertissement IndexedDB:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

// --- MENU STORAGE ---
export const saveMenuToIDB = async (items: MenuItem[]): Promise<void> => {
  if (!items || !Array.isArray(items) || items.length === 0) return;
  try {
    const db = await initDB();
    return new Promise<void>((resolve) => {
      const tx = db.transaction('menu', 'readwrite');
      const store = tx.objectStore('menu');
      store.clear();
      for (const item of items) {
        if (item && item.id) {
          try {
            store.put(item);
          } catch (putErr) {
            console.warn('Erreur put item dans IDB:', item.id, putErr);
          }
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn('Erreur transaction IndexedDB:', tx.error);
        resolve(); // Continue gracefully without crashing
      };
      tx.onabort = () => {
        console.warn('Transaction IndexedDB annulée');
        resolve();
      };
    });
  } catch (err) {
    console.warn('Erreur sauvegarde menu IndexedDB:', err);
  }
};

export const getMenuFromIDB = async (): Promise<MenuItem[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const tx = db.transaction('menu', 'readonly');
      const store = tx.objectStore('menu');
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as MenuItem[]) || []);
      request.onerror = () => {
        console.warn('Erreur lecture store menu:', request.error);
        resolve([]);
      };
      tx.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Erreur lecture menu IndexedDB:', err);
    return [];
  }
};

// --- CART STORAGE ---
export const saveCartToIDB = async (cart: CartItem[]): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');
    await store.clear();
    for (const item of cart) {
      store.put(item);
    }
  } catch (err) {
    console.warn('Erreur sauvegarde panier IndexedDB:', err);
  }
};

export const getCartFromIDB = async (): Promise<CartItem[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction('cart', 'readonly');
    const store = tx.objectStore('cart');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as CartItem[] || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Erreur lecture panier IndexedDB:', err);
    return [];
  }
};

// --- PENDING ORDERS (Offline Orders) ---
export const savePendingOrderToIDB = async (order: Order): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction('pendingOrders', 'readwrite');
    const store = tx.objectStore('pendingOrders');
    store.put(order);
  } catch (err) {
    console.warn('Erreur sauvegarde commande hors-ligne IndexedDB:', err);
  }
};

export const getPendingOrdersFromIDB = async (): Promise<Order[]> => {
  try {
    const db = await initDB();
    const tx = db.transaction('pendingOrders', 'readonly');
    const store = tx.objectStore('pendingOrders');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as Order[] || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Erreur lecture commandes hors-ligne IndexedDB:', err);
    return [];
  }
};

export const clearPendingOrdersFromIDB = async (): Promise<void> => {
  try {
    const db = await initDB();
    const tx = db.transaction('pendingOrders', 'readwrite');
    const store = tx.objectStore('pendingOrders');
    await store.clear();
  } catch (err) {
    console.warn('Erreur vidage commandes hors-ligne IndexedDB:', err);
  }
};
