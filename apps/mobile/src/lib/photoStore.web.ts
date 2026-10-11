import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In the browser, photos waiting to upload are kept as data URIs in local storage, and removed once
 * uploaded (browser storage is small); after that they are viewed from the server.
 */
const key = (path: string) => `farmwisr:photo:${path}`;

export async function keepPhoto(path: string, uri: string): Promise<void> {
  const dataUri = uri.startsWith('data:') ? uri : await toDataUri(uri);
  await AsyncStorage.setItem(key(path), dataUri);
}

export async function localPhotoUri(path: string): Promise<string | null> {
  return AsyncStorage.getItem(key(path));
}

export async function readPhoto(path: string): Promise<ArrayBuffer | null> {
  const dataUri = await AsyncStorage.getItem(key(path));
  return dataUri ? (await fetch(dataUri)).arrayBuffer() : null;
}

export async function photoUploaded(path: string): Promise<void> {
  await AsyncStorage.removeItem(key(path));
}

async function toDataUri(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
