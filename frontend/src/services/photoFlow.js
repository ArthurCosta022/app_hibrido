// Lógica pura do fluxo "foto do lugar". Não depende de React nem de módulos
// nativos, para poder ser testada com `node --test`.
//
// Estados: idle → capturing → preview → idle
//   idle       formulário normal; photoUri é a foto já associada (ou null)
//   capturing  permissão sendo pedida / câmera aberta
//   preview    foto capturada aguardando "Usar esta foto" ou "Refazer"
//
// Somente CONFIRM move draftUri para photoUri. Cancelar, falhar, recusar a
// permissão ou descartar nunca alteram a foto já associada.

const PHOTO_STATUS = Object.freeze({
  IDLE: 'idle',
  CAPTURING: 'capturing',
  PREVIEW: 'preview',
});

const DEFAULT_FAILURE_MESSAGE =
  'Não foi possível tirar a foto. Tente novamente ou salve o lugar sem foto.';

function createInitialPhotoState(photoUri = null) {
  return {
    status: PHOTO_STATUS.IDLE,
    photoUri: typeof photoUri === 'string' && photoUri ? photoUri : null,
    draftUri: null,
    message: '',
    canOpenSettings: false,
  };
}

function photoFlowReducer(state, event) {
  switch (event?.type) {
    case 'RESET':
      return createInitialPhotoState(event.photoUri);

    case 'REQUEST_CAPTURE':
      if (state.status !== PHOTO_STATUS.IDLE) return state;
      return { ...state, status: PHOTO_STATUS.CAPTURING, message: '', canOpenSettings: false };

    case 'RETAKE':
      if (state.status !== PHOTO_STATUS.PREVIEW) return state;
      // A foto rejeitada é descartada; a foto associada continua intacta.
      return {
        ...state,
        status: PHOTO_STATUS.CAPTURING,
        draftUri: null,
        message: '',
        canOpenSettings: false,
      };

    case 'PERMISSION_DENIED':
      if (state.status !== PHOTO_STATUS.CAPTURING) return state;
      return {
        ...state,
        status: PHOTO_STATUS.IDLE,
        message: event.message || DEFAULT_FAILURE_MESSAGE,
        canOpenSettings: event.canOpenSettings === true,
      };

    case 'CAPTURE_SUCCEEDED':
      if (state.status !== PHOTO_STATUS.CAPTURING) return state;
      if (typeof event.uri !== 'string' || !event.uri) return state;
      return { ...state, status: PHOTO_STATUS.PREVIEW, draftUri: event.uri };

    case 'CAPTURE_CANCELLED':
      if (state.status !== PHOTO_STATUS.CAPTURING) return state;
      return { ...state, status: PHOTO_STATUS.IDLE, draftUri: null, message: '' };

    case 'CAPTURE_FAILED':
      if (state.status !== PHOTO_STATUS.CAPTURING) return state;
      return {
        ...state,
        status: PHOTO_STATUS.IDLE,
        draftUri: null,
        message: event.message || DEFAULT_FAILURE_MESSAGE,
      };

    case 'CONFIRM':
      if (state.status !== PHOTO_STATUS.PREVIEW || !state.draftUri) return state;
      return { ...state, status: PHOTO_STATUS.IDLE, photoUri: state.draftUri, draftUri: null };

    case 'DISCARD':
      if (state.status !== PHOTO_STATUS.PREVIEW) return state;
      return { ...state, status: PHOTO_STATUS.IDLE, draftUri: null };

    case 'REMOVE':
      if (state.status !== PHOTO_STATUS.IDLE) return state;
      return { ...state, photoUri: null, message: '' };

    default:
      return state;
  }
}

// Converte o retorno de ImagePicker.launchCameraAsync em um resultado simples.
function interpretCaptureResult(result) {
  if (result && result.canceled === true) return { type: 'cancelled' };
  const uri = result?.assets?.[0]?.uri;
  if (typeof uri === 'string' && uri) return { type: 'captured', uri };
  return { type: 'failed' };
}

// Converte a resposta de requestCameraPermissionsAsync em mensagem e ação.
function describeCameraPermission(permission) {
  if (permission?.granted === true) {
    return { granted: true, canOpenSettings: false, message: '' };
  }
  const canAskAgain = permission?.canAskAgain !== false;
  return {
    granted: false,
    canOpenSettings: !canAskAgain,
    message: canAskAgain
      ? 'Permissão da câmera negada. Você pode salvar o lugar sem foto ou tentar novamente.'
      : 'A câmera está bloqueada para o MapPin. Ative a permissão nas configurações do sistema para tirar fotos.',
  };
}

// Decide o que fazer com o arquivo ao gravar o lugar.
//   none    foto inalterada
//   add     lugar sem foto passa a ter uma
//   replace foto trocada (a antiga deve ser apagada após gravar)
//   remove  foto removida (a antiga deve ser apagada após gravar)
function planPhotoChange(currentUri, nextUri) {
  const current = currentUri || null;
  const next = nextUri || null;
  if (current === next) return { action: 'none' };
  if (!current && next) return { action: 'add' };
  if (current && next) return { action: 'replace' };
  return { action: 'remove' };
}

module.exports = {
  DEFAULT_FAILURE_MESSAGE,
  PHOTO_STATUS,
  createInitialPhotoState,
  describeCameraPermission,
  interpretCaptureResult,
  photoFlowReducer,
  planPhotoChange,
};
