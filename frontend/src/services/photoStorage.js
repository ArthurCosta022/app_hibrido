import { Directory, File, Paths } from 'expo-file-system';

// As fotos ficam no diretório de documentos do app (não é limpo pelo sistema,
// ao contrário do cache onde a câmera grava o arquivo temporário).
const PHOTO_DIRECTORY_NAME = 'pin-photos';

function getPhotoDirectory() {
  const directory = new Directory(Paths.document, PHOTO_DIRECTORY_NAME);
  directory.create({ intermediates: true, idempotent: true });
  return directory;
}

export function isManagedPhotoUri(uri) {
  if (typeof uri !== 'string' || !uri) return false;
  try {
    const base = new Directory(Paths.document, PHOTO_DIRECTORY_NAME).uri;
    return uri.startsWith(base.endsWith('/') ? base : `${base}/`);
  } catch (_error) {
    return false;
  }
}

// Copia a foto temporária da câmera para o armazenamento permanente.
export async function persistPhoto(pinId, sourceUri) {
  try {
    const target = new File(getPhotoDirectory(), `${pinId}-${Date.now().toString(36)}.jpg`);
    await new File(sourceUri).copy(target);
    return target.uri;
  } catch (_error) {
    throw new Error('Não foi possível salvar a foto neste dispositivo. O lugar não foi alterado.');
  }
}

// Remove somente arquivos que o próprio app criou; nunca falha o fluxo principal.
export function removePhoto(uri) {
  if (!isManagedPhotoUri(uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (_error) {
    // Um arquivo órfão não deve impedir a operação do usuário.
  }
}
