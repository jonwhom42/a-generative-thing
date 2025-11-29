
import { Campaign } from "../types";

const DB_NAME = 'Mind2Matter';
const DB_VERSION = 1;
const STORE_NAME = 'campaigns';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
        reject(new Error("IndexedDB not supported"));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveCampaignToIndexedDB = async (campaign: Campaign): Promise<void> => {
  try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(campaign);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
  } catch (e) {
      console.error("Error saving to IndexedDB", e);
      throw e;
  }
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const res = request.result as Campaign[];
            // Sort by updatedAt desc
            res.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            resolve(res);
        };
      });
  } catch (e) {
      console.error("Error loading from IndexedDB", e);
      return [];
  }
};

export const deleteCampaignFromDB = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

// Helper to convert Blob URL to Base64 for persistence
export const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to convert blob to base64", e);
        return blobUrl; // Return original if fail
    }
};
