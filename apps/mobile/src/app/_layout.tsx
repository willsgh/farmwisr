import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { Body, Heading, Screen, colors } from '../components/ui';
import { AuthProvider, useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

function RootStack() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const signedIn = session !== null;
  return (
    <Stack screenOptions={{ headerTintColor: colors.primary }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="index" options={{ title: 'FarmWisr' }} />
        <Stack.Screen name="farm/new" options={{ title: 'Set up your farm' }} />
        <Stack.Screen name="sites/new" options={{ title: 'Add a site' }} />
        <Stack.Screen name="sites/[id]" options={{ title: 'Site' }} />
        <Stack.Screen name="fields/new" options={{ title: 'Add a field' }} />
        <Stack.Screen name="log/[stage]" options={{ title: 'Log activity' }} />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  if (!supabase) {
    return (
      <Screen>
        <Heading>FarmWisr is not connected to a server</Heading>
        <Body>Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env.local (see .env.example).</Body>
      </Screen>
    );
  }

  return (
    <AuthProvider>
      <RootStack />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
