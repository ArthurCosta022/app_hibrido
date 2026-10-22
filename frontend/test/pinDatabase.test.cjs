const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { afterEach, beforeEach, test } = require('node:test');
const { DatabaseSync } = require('node:sqlite');
const {
  ADD_PHOTO_COLUMN_SQL,
  PIN_QUERIES,
  PIN_SCHEMA_SQL,
  TABLE_INFO_SQL,
  needsPhotoColumn,
  rowToPin,
  validatePin,
} = require('../src/services/pinModel');

let database;
let temporaryDirectory;
let databasePath;

function openDatabase() {
  database = new DatabaseSync(databasePath);
  database.exec(PIN_SCHEMA_SQL);
  return database;
}

function closeDatabase() {
  database?.close();
  database = null;
}

function insertPin(id, fields, timestamp) {
  const pin = validatePin(fields);
  database.prepare(PIN_QUERIES.insert).run(
    id,
    pin.name,
    pin.description,
    pin.latitude,
    pin.longitude,
    pin.photoUri,
    timestamp,
    timestamp,
  );
}

beforeEach(() => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'mappin-sqlite-test-'));
  databasePath = join(temporaryDirectory, 'mappin.db');
  openDatabase();
});

afterEach(() => {
  closeDatabase();
  rmSync(temporaryDirectory, { force: true, recursive: true });
});

test('cadastra e consulta lugares depois de fechar e reabrir o banco', () => {
  insertPin(
    'pin-1',
    { name: 'Praia', description: 'Lugar para caminhar', latitude: -22.9, longitude: -43.1 },
    '2026-09-15T10:00:00.000Z',
  );
  insertPin(
    'pin-2',
    { name: 'Parque', description: 'Área verde', latitude: -22.8, longitude: -43.2 },
    '2026-09-15T11:00:00.000Z',
  );

  closeDatabase();
  openDatabase();

  const pins = database.prepare(PIN_QUERIES.list).all().map(rowToPin);
  assert.equal(pins.length, 2);
  assert.equal(pins[0]._id, 'pin-2');
  assert.equal(pins[1].name, 'Praia');
});

test('mantém edição e exclusão depois de novas reaberturas', () => {
  insertPin(
    'pin-1',
    { name: 'Praça', description: 'Descrição inicial', latitude: -23, longitude: -43 },
    '2026-09-15T10:00:00.000Z',
  );

  closeDatabase();
  openDatabase();
  const updated = validatePin({
    name: 'Praça Central',
    description: 'Descrição atualizada offline',
    latitude: -23,
    longitude: -43,
  });
  database.prepare(PIN_QUERIES.update).run(
    updated.name,
    updated.description,
    updated.latitude,
    updated.longitude,
    updated.photoUri,
    '2026-09-15T12:00:00.000Z',
    'pin-1',
  );

  closeDatabase();
  openDatabase();
  const editedPin = rowToPin(database.prepare(PIN_QUERIES.byId).get('pin-1'));
  assert.equal(editedPin.name, 'Praça Central');
  assert.equal(editedPin.description, 'Descrição atualizada offline');

  database.prepare(PIN_QUERIES.delete).run('pin-1');
  closeDatabase();
  openDatabase();
  assert.equal(database.prepare(PIN_QUERIES.byId).get('pin-1'), undefined);
});

test('rejeita dados inválidos antes de gravar no SQLite', () => {
  assert.throws(
    () => validatePin({ name: '', description: 'Teste', latitude: 0, longitude: 0 }),
    /nome/,
  );
  assert.throws(
    () => validatePin({ name: 'Teste', description: 'Teste', latitude: 91, longitude: 0 }),
    /latitude/,
  );
});

test('mantém a foto associada depois de fechar e reabrir o banco', () => {
  insertPin(
    'pin-foto',
    {
      name: 'Mirante',
      description: 'Vista da cidade',
      latitude: -22.9,
      longitude: -43.2,
      photoUri: 'file:///documentos/pin-photos/pin-foto.jpg',
    },
    '2026-10-22T10:00:00.000Z',
  );
  insertPin(
    'pin-sem-foto',
    { name: 'Padaria', description: 'Pão quente', latitude: -22.8, longitude: -43.1 },
    '2026-10-22T09:00:00.000Z',
  );

  closeDatabase();
  openDatabase();

  const withPhoto = rowToPin(database.prepare(PIN_QUERIES.byId).get('pin-foto'));
  const withoutPhoto = rowToPin(database.prepare(PIN_QUERIES.byId).get('pin-sem-foto'));
  assert.equal(withPhoto.photoUri, 'file:///documentos/pin-photos/pin-foto.jpg');
  assert.equal(withoutPhoto.photoUri, null);
});

test('remover a foto na edição limpa a coluna sem apagar o lugar', () => {
  insertPin(
    'pin-1',
    {
      name: 'Praça',
      description: 'Com foto',
      latitude: -23,
      longitude: -43,
      photoUri: 'file:///documentos/pin-photos/pin-1.jpg',
    },
    '2026-10-22T10:00:00.000Z',
  );
  const edited = validatePin({ name: 'Praça', description: 'Sem foto', latitude: -23, longitude: -43, photoUri: null });
  database.prepare(PIN_QUERIES.update).run(
    edited.name,
    edited.description,
    edited.latitude,
    edited.longitude,
    edited.photoUri,
    '2026-10-22T11:00:00.000Z',
    'pin-1',
  );

  closeDatabase();
  openDatabase();
  const pin = rowToPin(database.prepare(PIN_QUERIES.byId).get('pin-1'));
  assert.equal(pin.photoUri, null);
  assert.equal(pin.description, 'Sem foto');
});

test('valida o campo da foto', () => {
  assert.equal(validatePin({ name: 'A', description: 'B', latitude: 0, longitude: 0 }).photoUri, null);
  assert.equal(validatePin({ name: 'A', description: 'B', latitude: 0, longitude: 0, photoUri: null }).photoUri, null);
  assert.throws(
    () => validatePin({ name: 'A', description: 'B', latitude: 0, longitude: 0, photoUri: '   ' }),
    /foto/,
  );
  assert.throws(
    () => validatePin({ name: 'A', description: 'B', latitude: 0, longitude: 0, photoUri: 42 }),
    /foto/,
  );
  assert.throws(
    () => validatePin({ name: 'A', description: 'B', latitude: 0, longitude: 0, photoUri: 'x'.repeat(1001) }),
    /foto/,
  );
});

test('migra um banco da versão anterior (sem photo_uri) preservando os lugares', () => {
  closeDatabase();
  const legacy = new DatabaseSync(join(temporaryDirectory, 'legacy.db'));
  legacy.exec(`
    CREATE TABLE pins (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  legacy
    .prepare('INSERT INTO pins VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run('antigo', 'Casa', 'Cadastrado na v1', -22.9, -43.1, '2026-09-01T10:00:00.000Z', '2026-09-01T10:00:00.000Z');

  assert.equal(needsPhotoColumn(legacy.prepare(TABLE_INFO_SQL).all()), true);
  legacy.exec(ADD_PHOTO_COLUMN_SQL);
  assert.equal(needsPhotoColumn(legacy.prepare(TABLE_INFO_SQL).all()), false);

  const migrated = rowToPin(legacy.prepare(PIN_QUERIES.byId).get('antigo'));
  assert.equal(migrated.name, 'Casa');
  assert.equal(migrated.photoUri, null);
  legacy.close();
});
