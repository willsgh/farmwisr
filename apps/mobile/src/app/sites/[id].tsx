import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Screen, colors } from '../../components/ui';
import { useFarmData } from '../../lib/data';
import { formatArea } from '../../lib/format';

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFarmData();
  const { farm } = data;
  const site = data.site(id);

  if (!data.loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!farm || !site) {
    return (
      <Screen>
        <Body>This site is not on this device.</Body>
      </Screen>
    );
  }
  const fields = data.fieldsOf(site.id);
  return (
    <Screen>
      <Stack.Screen options={{ title: site.name }} />
      {(site.community || site.region) && <Body>{[site.community, site.region].filter(Boolean).join(', ')}</Body>}

      <Text style={styles.section}>Fields</Text>
      {fields.length === 0 && <Body>No fields yet. Add the fields on this site.</Body>}
      {fields.map((field) => (
        <Link key={field.id} href={{ pathname: '/fields/[id]', params: { id: field.id } }} asChild>
          <Pressable style={styles.item} accessibilityRole="button">
            <Text style={styles.itemText}>{field.name}</Text>
            <Text style={styles.itemMeta}>{formatArea(field.area_hectares, farm.area_unit)}</Text>
          </Pressable>
        </Link>
      ))}
      <Button
        title="Add a field"
        variant="secondary"
        onPress={() => router.push({ pathname: '/fields/new', params: { siteId: site.id, unit: farm.area_unit } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 18, fontWeight: '600', marginTop: 12, color: colors.text },
  item: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  itemText: { fontSize: 17, color: colors.text },
  itemMeta: { fontSize: 14, color: colors.muted, marginTop: 4 },
});
