import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerTintColor: '#2f6b2f' }}>
        <Stack.Screen name="index" options={{ title: 'FarmWisr' }} />
        <Stack.Screen name="log/[stage]" options={{ title: 'Log activity' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
