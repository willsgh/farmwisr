import { useEffect } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { closeStore, openStore, sync, useOffline } from '../lib/offline';
import { colors } from './ui';

const RETRY_MS = 30_000;

/** Opens the signed-in user's device store and keeps trying to sync: on a timer, on app focus, and when back online. */
export function useSyncLifecycle() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) {
      closeStore();
      return;
    }
    void openStore(userId);

    const timer = setInterval(() => void sync(), RETRY_MS);
    const appState = AppState.addEventListener('change', (s) => s === 'active' && void sync());
    const onOnline = () => void sync();
    if (Platform.OS === 'web') window.addEventListener('online', onOnline);
    return () => {
      clearInterval(timer);
      appState.remove();
      if (Platform.OS === 'web') window.removeEventListener('online', onOnline);
    };
  }, [userId]);
}

/** A slim bar telling the farmer that changes are saved on the device and waiting to sync. */
export function SyncStatus() {
  const { outbox, error, loaded } = useOffline();
  if (!loaded || (outbox.length === 0 && !error)) return null;

  const waiting = outbox.length;
  const text = error
    ? `Could not sync: ${error}`
    : `Saved on this device. ${waiting} ${waiting === 1 ? 'change' : 'changes'} will sync when you're online.`;
  return (
    <View style={[styles.bar, error ? styles.error : null]} accessibilityLiveRegion="polite">
      <Text style={[styles.text, error ? styles.errorText : null]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderColor: colors.border },
  error: { backgroundColor: '#fdecea' },
  text: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  errorText: { color: colors.error },
});
