import { Link, Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorText, Screen, colors } from '../../components/ui';
import { getMyFarm, getSite, listFields } from '../../lib/farms';
import { formatArea } from '../../lib/format';
import { useFocusLoad } from '../../lib/useFocusLoad';

export default function SiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useFocusLoad(async () => {
    const [farm, site, fields] = await Promise.all([getMyFarm(), getSite(id), listFields(id)]);
    return { farm, site, fields };
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

  const { farm, site, fields } = data;
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
