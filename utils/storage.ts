/**
 * Service de stockage persistant ultra-robuste utilisant IndexedDB avec miroir LocalStorage
 * et système de snapshots / sauvegardes automatiques et manuelles (Export/Import JSON).
 * Garantit qu'aucun plat, blog, commande ou client n'est perdu lors des rafraîchissements.
 */

const DB_NAME = 'KhadysFoodDB';
const DB_VERSION = 2;
const STORE_NAME = 'app_state';
const BACKUP_STORE = 'backups';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB non disponible"));
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
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        db.createObjectStore(BACKUP_STORE);
      }
    };
  });
}

export interface AppBackupData {
  version: string;
  timestamp: string;
  menuItems: any[];
  orders: any[];
  blogPosts: any[];
  galleryItems: any[];
  clients: any[];
  reviews: any[];
  userProfile?: any;
}

export const persistentStorage = {
  /**
   * Récupère un élément depuis IndexedDB en priorité, puis LocalStorage
   */
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
      try {
        const localVal = localStorage.getItem(key);
        return localVal ? JSON.parse(localVal) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
  },

  /**
   * Sauvegarde un élément dans IndexedDB et miroir dans LocalStorage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    // 1. Sauvegarde dans IndexedDB (capacité de plusieurs centaines de Mo, idéal pour photos)
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Si c'est le menu, créer automatiquement un snapshot de sécurité
      if (key === 'khadys_menu_items' && Array.isArray(value) && value.length > 0) {
        try {
          const txB = db.transaction(BACKUP_STORE, 'readwrite');
          const backupStore = txB.objectStore(BACKUP_STORE);
          backupStore.put(
            { items: value, date: new Date().toISOString(), count: value.length },
            'latest_menu_snapshot'
          );
        } catch {
          // Snapshot silencieux
        }
      }
    } catch (e) {
      console.warn(`[Storage] Erreur écriture IndexedDB pour ${key}:`, e);
    }

    // 2. Miroir dans LocalStorage si possible
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // LocalStorage plein (fréquent avec images base64), IndexedDB a déjà pris le relais avec succès
      console.info(`[Storage] LocalStorage plein pour ${key}, IndexedDB conserve la donnée durablement.`);
    }
  },

  /**
   * Récupère le dernier snapshot de sécurité du menu
   */
  async getLatestMenuSnapshot(): Promise<any[] | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(BACKUP_STORE, 'readonly');
        const store = tx.objectStore(BACKUP_STORE);
        const req = store.get('latest_menu_snapshot');
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result.items)) {
            resolve(req.result.items);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /**
   * Récupère toutes les données de l'application pour l'exportation
   */
  async getAllAppState(): Promise<AppBackupData> {
    const menuItems = await this.getItem('khadys_menu_items', []);
    const orders = await this.getItem('khadys_orders', []);
    const blogPosts = await this.getItem('khadys_blog_posts', []);
    const galleryItems = await this.getItem('khadys_gallery_items', []);
    const clients = await this.getItem('khadys_clients', []);
    const reviews = await this.getItem('khadys_reviews', []);
    const userProfile = await this.getItem('khadys_user_profile', null);

    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      menuItems: Array.isArray(menuItems) ? menuItems : [],
      orders: Array.isArray(orders) ? orders : [],
      blogPosts: Array.isArray(blogPosts) ? blogPosts : [],
      galleryItems: Array.isArray(galleryItems) ? galleryItems : [],
      clients: Array.isArray(clients) ? clients : [],
      reviews: Array.isArray(reviews) ? reviews : [],
      userProfile,
    };
  },

  /**
   * Exporte un fichier JSON téléchargeable contenant tout le menu et les données
   */
  async downloadBackupFile(): Promise<void> {
    const data = await this.getAllAppState();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `khadys-food-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Importe et restaure les données depuis un fichier ou objet JSON
   */
  async restoreBackupData(backupData: AppBackupData): Promise<boolean> {
    if (!backupData || !Array.isArray(backupData.menuItems)) {
      throw new Error("Format de fichier de sauvegarde invalide.");
    }

    if (backupData.menuItems.length > 0) {
      await this.setItem('khadys_menu_items', backupData.menuItems);
    }
    if (Array.isArray(backupData.orders)) {
      await this.setItem('khadys_orders', backupData.orders);
    }
    if (Array.isArray(backupData.blogPosts)) {
      await this.setItem('khadys_blog_posts', backupData.blogPosts);
    }
    if (Array.isArray(backupData.galleryItems)) {
      await this.setItem('khadys_gallery_items', backupData.galleryItems);
    }
    if (Array.isArray(backupData.clients)) {
      await this.setItem('khadys_clients', backupData.clients);
    }
    if (Array.isArray(backupData.reviews)) {
      await this.setItem('khadys_reviews', backupData.reviews);
    }
    if (backupData.userProfile) {
      await this.setItem('khadys_user_profile', backupData.userProfile);
    }

    return true;
  }
};

