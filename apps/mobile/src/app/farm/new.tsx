import type { AreaUnit } from '@farmwisr/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Choice, ErrorText, Field, Screen } from '../../components/ui';
import { createFarm } from '../../lib/data';

export default function NewFarm() {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<AreaUnit>('acre');
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError('Give your farm a name.');
      return;
    }
    // Saved on the device straight away; it syncs to the server when there is signal.
    createFarm(name.trim(), unit);
    router.back();
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
      <Button title="Save farm" onPress={save} />
    </Screen>
  );
}
