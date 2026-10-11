import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, ErrorText, Field, Screen } from '../../components/ui';
import { createSite } from '../../lib/data';

export default function NewSite() {
  const { farmId } = useLocalSearchParams<{ farmId: string }>();
  const [name, setName] = useState('');
  const [community, setCommunity] = useState('');
  const [region, setRegion] = useState('');
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError('Give the site a name.');
      return;
    }
    // Saved on the device straight away; it syncs to the server when there is signal.
    createSite(farmId, {
      name: name.trim(),
      community: community.trim() || null,
      region: region.trim() || null,
    });
    router.back();
  }

  return (
    <Screen>
      <Field label="Site name" value={name} onChangeText={setName} placeholder="e.g. Ejura site" autoFocus />
      <Field label="Community or town (optional)" value={community} onChangeText={setCommunity} placeholder="e.g. Ejura" />
      <Field label="Region (optional)" value={region} onChangeText={setRegion} placeholder="e.g. Ashanti" />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save site" onPress={save} />
    </Screen>
  );
}
