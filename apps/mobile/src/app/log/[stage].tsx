import { SEASON_STAGES, STAGE_LABELS } from '@farmwisr/core';
import type { SeasonStage } from '@farmwisr/core';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

function isStage(value: unknown): value is SeasonStage {
  return typeof value === 'string' && (SEASON_STAGES as readonly string[]).includes(value);
}

export default function LogActivity() {
  const { stage } = useLocalSearchParams<{ stage: string }>();

  if (!isStage(stage)) {
    return (
      <View style={styles.container}>
        <Text style={styles.body}>Unknown season stage.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: STAGE_LABELS[stage] }} />
      <Text style={styles.body}>The quick-entry form for {STAGE_LABELS[stage].toLowerCase()} goes here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  body: { fontSize: 16 },
});
