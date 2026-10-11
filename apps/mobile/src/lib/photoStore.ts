import { Directory, File, Paths } from 'expo-file-system';

/**
 * Photos are kept in the app's documents folder (Android and iOS), so they survive restarts while
 * waiting to upload, and can still be viewed offline afterwards.
 */
const folder = () => new Directory(Paths.document, 'photos');
const fileFor = (path: string) => new File(folder(), path.replace('/', '_'));

/** Keeps a prepared photo on the device under its storage path. */
export async function keepPhoto(path: string, uri: string): Promise<void> {
  const dir = folder();
  if (!dir.exists) dir.create({ intermediates: true });
  new File(uri).copy(fileFor(path));
}

export async function localPhotoUri(path: string): Promise<string | null> {
  const file = fileFor(path);
  return file.exists ? file.uri : null;
}

export async function readPhoto(path: string): Promise<ArrayBuffer | null> {
  const file = fileFor(path);
  return file.exists ? file.arrayBuffer() : null;
}

/** Called once the server has the photo. The device copy is kept for viewing offline. */
export async function photoUploaded(_path: string): Promise<void> {}
