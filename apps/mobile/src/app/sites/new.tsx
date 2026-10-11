import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Field, Screen } from '../../components/ui';
import { createSite } from '../../lib/farms';

export default function NewSite() {
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('');
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('Give the site a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createSite(farmId, {
        name: name.trim(),
        community: community.trim() || null,
        region: region.trim() || null,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the site.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Field label="Site name" value={name} onChangeText={setName} placeholder="e.g. Ejura site" autoFocus />
      <Field label="Community or town (optional)" value={community} onChangeText={setCommunity} placeholder="e.g. Ejura" />
      <Field label="Region (optional)" value={region} onChangeText={setRegion} placeholder="e.g. Ashanti" />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save site" onPress={save} busy={busy} />
    </Screen>
  );
}
