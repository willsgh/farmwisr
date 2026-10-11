import type { AreaUnit } from '@farmwisr/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Choice, ErrorText, Field, Screen } from '../../components/ui';
import { createFarm } from '../../lib/farms';

export default function NewFarm() {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<AreaUnit>('acre');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('Give your farm a name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createFarm(name.trim(), unit);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the farm.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Field label="Farm name" value={name} onChangeText={setName} placeholder="e.g. Asante Family Farm" autoFocus />
      <Body>Measure land in</Body>
      <Choice
        options={[
          { value: 'acre', label: 'Acres' },
          { value: 'hectare', label: 'Hectares' },
        ]}
        value={unit}
        onChange={setUnit}
      />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save farm" onPress={save} busy={busy} />
    </Screen>
  );
}
