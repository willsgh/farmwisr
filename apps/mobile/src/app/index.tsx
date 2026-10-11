import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Heading, Screen, colors } from '../components/ui';
import { useFarmData } from '../lib/data';
import { supabase } from '../lib/supabase';

export default function Home() {
  const data = useFarmData();

  if (!data.loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const { farm } = data;
  if (!farm && !data.hasSynced) {
    // First sign-in on this device: wait for the farm to download rather than offer to create a duplicate.
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
        <Body>Loading your farm. The first time you sign in on a device, this needs an internet connection.</Body>
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

  const sites = data.sitesOf(farm.id);
  return (
    <Screen>
      <Heading>{farm.name}</Heading>

      <Text style={styles.section}>Sites</Text>
      {sites.length === 0 && <Body>Add each piece of land you farm as a site, then add its fields.</Body>}
      {sites.map((site) => {
        const fieldCount = data.fieldsOf(site.id).length;
        return (
          <Link key={site.id} href={{ pathname: '/sites/[id]', params: { id: site.id } }} asChild>
            <Pressable style={styles.item} accessibilityRole="button">
              <Text style={styles.itemText}>{site.name}</Text>
              <Text style={styles.itemMeta}>
                {[site.community, `${fieldCount} ${fieldCount === 1 ? 'field' : 'fields'}`].filter(Boolean).join(' · ')}
              </Text>
            </Pressable>
          </Link>
        );
      })}
      <Button
        title="Add a site"
        variant="secondary"
        onPress={() => router.push({ pathname: '/sites/new', params: { farmId: farm.id } })}
      />

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
