import { SEASON_STAGES, STAGE_LABELS, formatMoney, summariseSeason, toHectares } from '@farmwisr/core';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoThumb } from '../../components/PhotoThumb';
import { Body, Card, Screen, Section, colors } from '../../components/ui';
import { useFarmData } from '../../lib/data';

export default function SeasonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFarmData();
  const { farm } = data;
  const season = data.season(id);
  const field = season ? data.field(season.field_id) : null;

  if (!data.loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!farm || !season || !field) {
    return (
      <Screen>
        <Body>This season is not on this device.</Body>
      </Screen>
    );
  }
  const activities = data.activitiesOf(season.id);
  const summary = summariseSeason(
    activities,
    field.area_hectares ? { value: field.area_hectares, unit: 'hectare' } : undefined,
  );
  const money = (minor: number) => formatMoney(minor, farm.currency);
  const unitLabel = farm.area_unit === 'acre' ? 'acre' : 'hectare';
  const costPerUnit =
    summary.costPerHectareMinor === null
      ? null
      : Math.round(summary.costPerHectareMinor * toHectares(1, farm.area_unit));
  const harvest = Object.entries(summary.harvestByUnit).map(([unit, qty]) => `${qty} ${unit}`);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${season.crop} · ${field.name}` }} />
      <Body>
        {[season.variety, `started ${season.start_date}`].filter(Boolean).join(', ')}
      </Body>

      <Card>
        <Text style={styles.big}>{money(summary.totalCostMinor)}</Text>
        <Text style={styles.meta}>Total cost so far</Text>
        {costPerUnit !== null && (
          <Text style={styles.meta}>
            {money(costPerUnit)} per {unitLabel}
          </Text>
        )}
        {harvest.length > 0 && <Text style={styles.meta}>Harvested: {harvest.join(', ')}</Text>}
      </Card>

      <Section>Log an activity</Section>
      <View style={styles.stages}>
        {SEASON_STAGES.map((stage) => (
          <Pressable
            key={stage}
            style={styles.stage}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/seasons/log', params: { seasonId: season.id, stage, currency: farm.currency } })}
          >
            <Text style={styles.stageText}>{STAGE_LABELS[stage]}</Text>
          </Pressable>
        ))}
      </View>

      <Section>Activities</Section>
      {activities.length === 0 && <Body>Nothing logged yet.</Body>}
      {activities.map((a) => {
        const cost = a.costs.reduce((sum, c) => sum + c.amountMinor, 0);
        return (
          <Card key={a.id}>
            <Text style={styles.itemText}>{a.type}</Text>
            <Text style={styles.meta}>
              {[STAGE_LABELS[a.stage], a.date, cost > 0 ? money(cost) : null].filter(Boolean).join(' · ')}
            </Text>
            {a.harvestQuantity !== undefined && (
              <Text style={styles.meta}>
                Harvested {a.harvestQuantity} {a.harvestUnit}
              </Text>
            )}
            {a.notes && <Text style={styles.meta}>{a.notes}</Text>}
            {a.location && (
              <Text style={styles.meta}>
                Logged at {a.location.lat.toFixed(5)}, {a.location.lng.toFixed(5)}
                {a.location.accuracyM !== undefined ? ` (±${Math.round(a.location.accuracyM)} m)` : ''}
              </Text>
            )}
            {a.photos && a.photos.length > 0 && (
              <View style={styles.photos}>
                {a.photos.map((path) => (
                  <PhotoThumb key={path} path={path} />
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 26, fontWeight: '700', color: colors.text },
  meta: { fontSize: 14, color: colors.muted },
  itemText: { fontSize: 17, color: colors.text },
  stages: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  stage: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  stageText: { fontSize: 16, fontWeight: '600', color: colors.primary },
});
