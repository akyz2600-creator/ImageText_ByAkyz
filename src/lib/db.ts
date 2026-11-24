// Acceso mínimo a IndexedDB para guardar las fuentes importadas (sin dependencias).

import type { StoredFont } from './fonts';

const DB_NAME = 'imagetext-byakyz';
const DB_VERSION = 1;
const FONT_STORE = 'fonts';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FONT_STORE)) {
        db.createObjectStore(FONT_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('No se pudo abrir IndexedDB'));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(FONT_STORE, mode);
      const req = run(tx.objectStore(FONT_STORE));
      tx.oncomplete = () => resolve(req ? (req.result as T) : undefined);
      tx.onerror = () => reject(tx.error ?? new Error('Error en la transacción'));
      tx.onabort = () => reject(tx.error ?? new Error('Transacción cancelada'));
    });
  } finally {
    db.close();
  }
}

export async function putFont(font: StoredFont): Promise<void> {
  await withStore('readwrite', (s) => s.put(font));
}

export async function getAllFonts(): Promise<StoredFont[]> {
  return ((await withStore<StoredFont[]>('readonly', (s) => s.getAll())) ?? []) as StoredFont[];
}

export async function deleteFonts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await withStore('readwrite', (s) => {
    for (const id of ids) s.delete(id);
  });
}
