import { SEASON_STAGES, STAGE_LABELS, fromHectares } from '@farmwisr/core';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, ErrorText, Heading, Screen, colors } from '../components/ui';
import { getMyFarm, listFields } from '../lib/farms';
import type { Farm, Field } from '../lib/farms';
import { supabase } from '../lib/supabase';

function formatArea(hectares: number | null, farm: Farm): string {
  if (hectares === null) return 'Area not set';
  const value = fromHectares(hectares, farm.area_unit);
  return `${value.toFixed(2)} ${farm.area_unit === 'acre' ? 'acres' : 'ha'}`;
}

export default function Home() {
  const [farm, setFarm] = useState<Farm | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const myFarm = await getMyFarm();
          const myFields = myFarm ? await listFields(myFarm.id) : [];
          if (!active) return;
          setFarm(myFarm);
          setFields(myFields);
          setError(null);
        } catch (e) {
          if (active) setError(e instanceof Error ? e.message : 'Could not load your farm.');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorText>{error}</ErrorText>
      </Screen>
    );
  }

  if (!farm) {
    return (
      <Screen>
        <Heading>Welcome to FarmWisr</Heading>
        <Body>Start by setting up your farm.</Body>
        <Button title="Set up your farm" onPress={() => router.push('/farm/new')} />
        <Button title="Sign out" variant="secondary" onPress={() => supabase!.auth.signOut()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Heading>{farm.name}</Heading>

      <Text style={styles.section}>Fields</Text>
      {fields.length === 0 && <Body>No fields yet. Add the fields you farm.</Body>}
      {fields.map((field) => (
        <View key={field.id} style={styles.item}>
          <Text style={styles.itemText}>{field.name}</Text>
          <Text style={styles.itemMeta}>{formatArea(field.area_hectares, farm)}</Text>
        </View>
      ))}
      <Button
        title="Add a field"
        variant="secondary"
        onPress={() => router.push({ pathname: '/fields/new', params: { farmId: farm.id, unit: farm.area_unit } })}
      />

      <Text style={styles.section}>Log a farm activity</Text>
      {SEASON_STAGES.map((stage) => (
        <Link key={stage} href={{ pathname: '/log/[stage]', params: { stage } }} asChild>
          <Pressable style={styles.item} accessibilityRole="button">
            <Text style={styles.itemText}>{STAGE_LABELS[stage]}</Text>
          </Pressable>
        </Link>
      ))}

      <Button title="Sign out" variant="secondary" onPress={() => supabase!.auth.signOut()} />
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
