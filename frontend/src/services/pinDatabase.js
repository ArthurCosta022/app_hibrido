import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

import { persistPhoto, removePhoto } from './photoStorage';

const {
  ADD_PHOTO_COLUMN_SQL,
  PIN_QUERIES,
  PIN_SCHEMA_SQL,
  TABLE_INFO_SQL,
  needsPhotoColumn,
  rowToPin,
  validatePin,
} = require('./pinModel');
const { planPhotoChange } = require('./photoFlow');

const DATABASE_NAME = 'mappin.db';
const LEGACY_STORAGE_KEY = '@mappin/offline-state/v1';
const LEGACY_MIGRATION_KEY = 'legacy_async_storage_imported';

let databasePromise;

function makePinId() {
  return `pin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function migrateLegacyPins(database) {
  const completed = await database.getFirstAsync(
    'SELECT value FROM app_metadata WHERE key = ?',
    LEGACY_MIGRATION_KEY,
  );
  if (completed) return;

  try {
    const serializedState = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    const legacyState = serializedState ? JSON.parse(serializedState) : null;
    const legacyPins = Array.isArray(legacyState?.pins) ? legacyState.pins : [];

    for (const legacyPin of legacyPins) {
      try {
        const pin = validatePin(legacyPin);
        const timestamp = new Date().toISOString();
        await database.runAsync(
          PIN_QUERIES.insertOrIgnore,
          typeof legacyPin._id === 'string' && legacyPin._id ? legacyPin._id : makePinId(),
          pin.name,
          pin.description,
          pin.latitude,
          pin.longitude,
          null,
          legacyPin.createdAt || timestamp,
          legacyPin.updatedAt || timestamp,
        );
      } catch (_error) {
        // Um registro antigo inválido não impede a abertura do banco local.
      }
    }

    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (_error) {
    // Dados ausentes ou corrompidos são ignorados; o SQLite começa vazio.
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
    LEGACY_MIGRATION_KEY,
    new Date().toISOString(),
  );
}

async function initializeDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(PIN_SCHEMA_SQL);
  const columns = await database.getAllAsync(TABLE_INFO_SQL);
  if (needsPhotoColumn(columns)) await database.execAsync(ADD_PHOTO_COLUMN_SQL);
  await migrateLegacyPins(database);
  return database;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function listPins() {
  const database = await getDatabase();
  const rows = await database.getAllAsync(PIN_QUERIES.list);
  return rows.map(rowToPin);
}

export async function createPin(fields) {
  const database = await getDatabase();
  const pin = validatePin(fields);
  const id = makePinId();
  const timestamp = new Date().toISOString();
  const photoUri = pin.photoUri ? await persistPhoto(id, pin.photoUri) : null;

  try {
    await database.runAsync(
      PIN_QUERIES.insert,
      id,
      pin.name,
      pin.description,
      pin.latitude,
      pin.longitude,
      photoUri,
      timestamp,
      timestamp,
    );
  } catch (error) {
    removePhoto(photoUri);
    throw error;
  }

  return { _id: id, ...pin, photoUri, createdAt: timestamp, updatedAt: timestamp };
}

export async function updatePin(id, fields) {
  if (typeof id !== 'string' || !id) throw new Error('Lugar não encontrado.');
  const database = await getDatabase();
  const existing = await database.getFirstAsync(PIN_QUERIES.byId, id);
  if (!existing) throw new Error('Lugar não encontrado.');

  const pin = validatePin(fields);
  // Se o chamador não informa photoUri, a foto atual é mantida.
  const requestedPhotoUri = fields?.photoUri === undefined ? existing.photo_uri : pin.photoUri;
  const change = planPhotoChange(existing.photo_uri, requestedPhotoUri);

  let nextPhotoUri = existing.photo_uri ?? null;
  let newlyStoredUri = null;
  if (change.action === 'add' || change.action === 'replace') {
    newlyStoredUri = await persistPhoto(id, requestedPhotoUri);
    nextPhotoUri = newlyStoredUri;
  } else if (change.action === 'remove') {
    nextPhotoUri = null;
  }

  const timestamp = new Date().toISOString();
  let result;
  try {
    result = await database.runAsync(
      PIN_QUERIES.update,
      pin.name,
      pin.description,
      pin.latitude,
      pin.longitude,
      nextPhotoUri,
      timestamp,
      id,
    );
  } catch (error) {
    removePhoto(newlyStoredUri);
    throw error;
  }

  if (result.changes === 0) {
    removePhoto(newlyStoredUri);
    throw new Error('Lugar não encontrado.');
  }
  // A foto antiga só é apagada depois que o banco já aponta para a nova.
  if (change.action === 'replace' || change.action === 'remove') removePhoto(existing.photo_uri);

  const row = await database.getFirstAsync(PIN_QUERIES.byId, id);
  return rowToPin(row);
}

export async function deletePin(id) {
  if (typeof id !== 'string' || !id) throw new Error('Lugar não encontrado.');
  const database = await getDatabase();
  const existing = await database.getFirstAsync(PIN_QUERIES.byId, id);
  const result = await database.runAsync(PIN_QUERIES.delete, id);
  if (result.changes === 0) throw new Error('Lugar não encontrado.');
  removePhoto(existing?.photo_uri);
}
