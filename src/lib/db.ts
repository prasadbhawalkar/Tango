/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'tango_db';
const DB_VERSION = 1;

export interface TangoDB {
  files: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      name: string;
      type: string;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<TangoDB>>;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<TangoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      },
    });
  }
  return dbPromise;
};

export const saveFile = async (file: File): Promise<string> => {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.put('files', {
    id,
    blob: file,
    name: file.name,
    type: file.type,
  });
  return id;
};

export const getFile = async (id: string) => {
  const db = await getDB();
  return db.get('files', id);
};

export const deleteFile = async (id: string) => {
  const db = await getDB();
  await db.delete('files', id);
};

export const saveMetadata = async (key: string, value: any) => {
  const db = await getDB();
  await db.put('metadata', value, key);
};

export const getMetadata = async (key: string) => {
  const db = await getDB();
  return db.get('metadata', key);
};
