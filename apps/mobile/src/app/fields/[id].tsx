import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorText, Screen, Section, colors } from '../../components/ui';
import { getMyFarm } from '../../lib/farms';
import { formatArea } from '../../lib/format';
import { getField, listSeasons } from '../../lib/seasons';
import { useFocusLoad } from '../../lib/useFocusLoad';

export default function FieldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useFocusLoad(async () => {
    const [farm, field, seasons] = await Promise.all([getMyFarm(), getField(id), listSeasons(id)]);
    return { farm, field, seasons };
  }, id);

  if (error) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
      </Screen>
    );
  }
  if (!data || !data.farm) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const { farm, field, seasons } = data;
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
