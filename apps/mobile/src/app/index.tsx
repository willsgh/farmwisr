import { SEASON_STAGES, STAGE_LABELS } from '@farmwisr/core';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Log a farm activity</Text>
      <Text style={styles.body}>Pick the stage of the season the work belongs to.</Text>
      <View style={styles.list}>
        {SEASON_STAGES.map((stage) => (
          <Link key={stage} href={{ pathname: '/log/[stage]', params: { stage } }} asChild>
            <Pressable style={styles.item} accessibilityRole="button">
              <Text style={styles.itemText}>{STAGE_LABELS[stage]}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
  heading: { fontSize: 22, fontWeight: '600' },
  body: { fontSize: 16, color: '#444' },
  list: { gap: 8, marginTop: 8 },
  item: { padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#cfd8cf', backgroundColor: '#f6faf6' },
  itemText: { fontSize: 17 },
});
