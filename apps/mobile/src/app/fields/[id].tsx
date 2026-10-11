import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen, Section, colors } from '../../components/ui';
import { useFarmData } from '../../lib/data';
import { formatArea } from '../../lib/format';

export default function FieldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFarmData();
  const { farm } = data;
  const field = data.field(id);

  if (!data.loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!farm || !field) {
    return (
      <Screen>
        <Body>This field is not on this device.</Body>
      </Screen>
    );
  }
  const seasons = data.seasonsOf(field.id);
  return (
    <Screen>
      <Stack.Screen options={{ title: field.name }} />
      <Body>{formatArea(field.area_hectares, farm.area_unit)}</Body>

      <Section>Crop seasons</Section>
      {seasons.length === 0 && <Body>Start a season when you begin working this field for a crop.</Body>}
      {seasons.map((season) => (
        <Link key={season.id} href={{ pathname: '/seasons/[id]', params: { id: season.id } }} asChild>
          <Pressable style={styles.item} accessibilityRole="button">
            <Text style={styles.itemText}>{[season.crop, season.variety].filter(Boolean).join(', ')}</Text>
            <Text style={styles.itemMeta}>
              Started {season.start_date}
              {season.end_date ? ` · ended ${season.end_date}` : ''}
            </Text>
          </Pressable>
        </Link>
      ))}
      <Button
        title="Start a season"
        variant="secondary"
        onPress={() => router.push({ pathname: '/seasons/new', params: { fieldId: field.id } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  itemText: { fontSize: 17, color: colors.text },
  itemMeta: { fontSize: 14, color: colors.muted, marginTop: 4 },
});
