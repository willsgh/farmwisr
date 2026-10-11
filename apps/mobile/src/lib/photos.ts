import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { localPhotoUri } from './photoStore';
import { supabase } from './supabase';

export const PHOTO_BUCKET = 'activity-photos';
const MAX_WIDTH = 1280;

/**
 * Lets the farmer take or choose a photo, scaled down to at most 1280 px wide as a JPEG so it uploads
 * quickly on a weak signal. Returns a local URI, or null if they cancelled.
 */
export async function pickPhoto(source: 'camera' | 'library'): Promise<string | null> {
  if (source === 'camera') {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) throw new Error('Allow camera access to take photos.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];

  const context = ImageManipulator.manipulate(asset.uri);
  if (asset.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await context.renderAsync();
  const web = Platform.OS === 'web';
  const saved = await image.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: web });
  return web && saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri;
}

/** A photo to show: the device's copy if there is one, otherwise a short-lived link from the server. */
export function usePhotoUri(path: string): { uri: string | null; loading: boolean } {
  const [state, setState] = useState<{ path: string; uri: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let uri = await localPhotoUri(path);
      if (!uri && supabase) {
        const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 60 * 60);
        uri = data?.signedUrl ?? null;
      }
      if (!cancelled) setState({ path, uri });
    })().catch(() => !cancelled && setState({ path, uri: null }));
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state?.path === path ? { uri: state.uri, loading: false } : { uri: null, loading: true };
}
