// IndexedDB Helper for persisting FileSystemDirectoryHandle

const DB_NAME = 'branding-app-storage';
const DB_VERSION = 1;
const HANDLES_STORE = 'handles';

interface StoredHandleRecord {
  id: string;
  handle: FileSystemDirectoryHandle;
  lastAccessed: number;
  folderName: string;
}

let dbInstance: IDBDatabase | null = null;

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(HANDLES_STORE)) {
        db.createObjectStore(HANDLES_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveDirectoryHandle = async (
  handle: FileSystemDirectoryHandle
): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLES_STORE, 'readwrite');
    const store = transaction.objectStore(HANDLES_STORE);

    const record: StoredHandleRecord = {
      id: 'root-directory',
      handle,
      lastAccessed: Date.now(),
      folderName: handle.name,
    };

    const request = store.put(record);

    request.onerror = () => {
      reject(new Error('Failed to save directory handle'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(HANDLES_STORE, 'readonly');
      const store = transaction.objectStore(HANDLES_STORE);
      const request = store.get('root-directory');

      request.onerror = () => {
        reject(new Error('Failed to get directory handle'));
      };

      request.onsuccess = () => {
        const record = request.result as StoredHandleRecord | undefined;
        resolve(record?.handle || null);
      };
    });
  } catch {
    return null;
  }
};

export const clearDirectoryHandle = async (): Promise<void> => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(HANDLES_STORE, 'readwrite');
    const store = transaction.objectStore(HANDLES_STORE);
    const request = store.delete('root-directory');

    request.onerror = () => {
      reject(new Error('Failed to clear directory handle'));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
};

export const updateLastAccessed = async (): Promise<void> => {
  const handle = await getDirectoryHandle();
  if (handle) {
    await saveDirectoryHandle(handle);
  }
};
