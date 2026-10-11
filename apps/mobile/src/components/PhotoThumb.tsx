import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePhotoUri } from '../lib/photos';
import { colors } from './ui';

const SIZE = 88;

/** A square photo preview. Takes a storage path (saved photo) or a local URI (photo not saved yet). */
export function PhotoThumb({ path, uri, onRemove }: { path?: string; uri?: string; onRemove?: () => void }) {
  return (
    <View style={styles.box}>
      {uri ? <Image source={{ uri }} style={styles.image} accessibilityLabel="Photo" /> : <SavedPhoto path={path!} />}
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.remove} accessibilityRole="button" accessibilityLabel="Remove photo">
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

function SavedPhoto({ path }: { path: string }) {
  const { uri, loading } = usePhotoUri(path);
  if (loading) return <ActivityIndicator color={colors.primary} />;
  if (!uri) return <Text style={styles.missing}>Photo shows when online</Text>;
  return <Image source={{ uri }} style={styles.image} accessibilityLabel="Photo" />;
}

const styles = StyleSheet.create({
  box: {
    width: SIZE,
    height: SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: SIZE, height: SIZE },
  missing: { fontSize: 11, color: colors.muted, textAlign: 'center', padding: 4 },
  remove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 18, lineHeight: 20 },
});
