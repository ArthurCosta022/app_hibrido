const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  DEFAULT_FAILURE_MESSAGE,
  PHOTO_STATUS,
  createInitialPhotoState,
  describeCameraPermission,
  interpretCaptureResult,
  photoFlowReducer,
  planPhotoChange,
} = require('../src/services/photoFlow');

function run(state, ...events) {
  return events.reduce(photoFlowReducer, state);
}

const EXISTING = 'file:///documentos/pin-photos/antiga.jpg';
const DRAFT = 'file:///cache/ImagePicker/nova.jpg';

test('caminho principal: abrir câmera, capturar e confirmar associa a foto', () => {
  const state = run(
    createInitialPhotoState(null),
    { type: 'REQUEST_CAPTURE' },
    { type: 'CAPTURE_SUCCEEDED', uri: DRAFT },
  );
  assert.equal(state.status, PHOTO_STATUS.PREVIEW);
  assert.equal(state.photoUri, null, 'a prévia ainda não associa a foto');

  const confirmed = photoFlowReducer(state, { type: 'CONFIRM' });
  assert.equal(confirmed.status, PHOTO_STATUS.IDLE);
  assert.equal(confirmed.photoUri, DRAFT);
  assert.equal(confirmed.draftUri, null);
});

test('cancelar a câmera preserva a foto existente', () => {
  const state = run(
    createInitialPhotoState(EXISTING),
    { type: 'REQUEST_CAPTURE' },
    { type: 'CAPTURE_CANCELLED' },
  );
  assert.equal(state.status, PHOTO_STATUS.IDLE);
  assert.equal(state.photoUri, EXISTING);
  assert.equal(state.draftUri, null);
});

test('refazer descarta a foto rejeitada e volta à captura', () => {
  const state = run(
    createInitialPhotoState(EXISTING),
    { type: 'REQUEST_CAPTURE' },
    { type: 'CAPTURE_SUCCEEDED', uri: DRAFT },
    { type: 'RETAKE' },
  );
  assert.equal(state.status, PHOTO_STATUS.CAPTURING);
  assert.equal(state.draftUri, null);
  assert.equal(state.photoUri, EXISTING);
});

test('cancelar depois de refazer não deixa a foto rejeitada associada', () => {
  const state = run(
    createInitialPhotoState(null),
    { type: 'REQUEST_CAPTURE' },
    { type: 'CAPTURE_SUCCEEDED', uri: DRAFT },
    { type: 'RETAKE' },
    { type: 'CAPTURE_CANCELLED' },
  );
  assert.equal(state.status, PHOTO_STATUS.IDLE);
  assert.equal(state.photoUri, null);
});

test('descartar a prévia mantém a foto anterior', () => {
  const state = run(
    createInitialPhotoState(EXISTING),
    { type: 'REQUEST_CAPTURE' },
    { type: 'CAPTURE_SUCCEEDED', uri: DRAFT },
    { type: 'DISCARD' },
  );
  assert.equal(state.status, PHOTO_STATUS.IDLE);
  assert.equal(state.photoUri, EXISTING);
});

test('permissão negada volta ao formulário com mensagem e sem alterar a foto', () => {
  const state = run(
    createInitialPhotoState(EXISTING),
    { type: 'REQUEST_CAPTURE' },
    { type: 'PERMISSION_DENIED', message: 'Negada', canOpenSettings: true },
  );
  assert.equal(state.status, PHOTO_STATUS.IDLE);
  assert.equal(state.message, 'Negada');
  assert.equal(state.canOpenSettings, true);
  assert.equal(state.photoUri, EXISTING);
});

test('falha da câmera informa o usuário e permite nova tentativa', () => {
  const failed = run(createInitialPhotoState(null), { type: 'REQUEST_CAPTURE' }, { type: 'CAPTURE_FAILED' });
  assert.equal(failed.status, PHOTO_STATUS.IDLE);
  assert.equal(failed.message, DEFAULT_FAILURE_MESSAGE);

  const retry = photoFlowReducer(failed, { type: 'REQUEST_CAPTURE' });
  assert.equal(retry.status, PHOTO_STATUS.CAPTURING);
  assert.equal(retry.message, '', 'a mensagem antiga é limpa ao tentar de novo');
});

test('transições inválidas são ignoradas', () => {
  const idle = createInitialPhotoState(EXISTING);
  assert.equal(photoFlowReducer(idle, { type: 'CONFIRM' }), idle);
  assert.equal(photoFlowReducer(idle, { type: 'CAPTURE_SUCCEEDED', uri: DRAFT }), idle);
  assert.equal(photoFlowReducer(idle, { type: 'RETAKE' }), idle);

  const capturing = photoFlowReducer(idle, { type: 'REQUEST_CAPTURE' });
  assert.equal(photoFlowReducer(capturing, { type: 'REQUEST_CAPTURE' }), capturing);
  assert.equal(photoFlowReducer(capturing, { type: 'CONFIRM' }), capturing);
  assert.equal(photoFlowReducer(capturing, { type: 'REMOVE' }), capturing);
  assert.equal(photoFlowReducer(capturing, { type: 'CAPTURE_SUCCEEDED', uri: '' }), capturing);
});

test('remover foto só funciona fora do fluxo de captura', () => {
  const removed = photoFlowReducer(createInitialPhotoState(EXISTING), { type: 'REMOVE' });
  assert.equal(removed.photoUri, null);
});

test('interpreta o retorno da câmera', () => {
  assert.deepEqual(interpretCaptureResult({ canceled: true, assets: null }), { type: 'cancelled' });
  assert.deepEqual(interpretCaptureResult({ canceled: false, assets: [{ uri: DRAFT }] }), {
    type: 'captured',
    uri: DRAFT,
  });
  assert.deepEqual(interpretCaptureResult({ canceled: false, assets: [] }), { type: 'failed' });
  assert.deepEqual(interpretCaptureResult(undefined), { type: 'failed' });
});

test('diferencia permissão negada de bloqueada permanentemente', () => {
  assert.equal(describeCameraPermission({ granted: true }).granted, true);

  const denied = describeCameraPermission({ granted: false, canAskAgain: true });
  assert.equal(denied.granted, false);
  assert.equal(denied.canOpenSettings, false);

  const blocked = describeCameraPermission({ granted: false, canAskAgain: false });
  assert.equal(blocked.canOpenSettings, true);
  assert.match(blocked.message, /configurações/);
});

test('planeja o que fazer com o arquivo ao salvar', () => {
  assert.equal(planPhotoChange(null, null).action, 'none');
  assert.equal(planPhotoChange(EXISTING, EXISTING).action, 'none');
  assert.equal(planPhotoChange(null, DRAFT).action, 'add');
  assert.equal(planPhotoChange(EXISTING, DRAFT).action, 'replace');
  assert.equal(planPhotoChange(EXISTING, null).action, 'remove');
});
