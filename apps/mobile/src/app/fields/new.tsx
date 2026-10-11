import { toHectares } from '@farmwisr/core';
import type { AreaUnit } from '@farmwisr/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Choice, ErrorText, Field, Screen } from '../../components/ui';
import { createField } from '../../lib/data';

export default function NewField() {
  const { siteId, unit: farmUnit } = useLocalSearchParams<{ siteId: string; unit?: AreaUnit }>();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState<AreaUnit>(farmUnit === 'hectare' ? 'hectare' : 'acre');
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!name.trim()) {
      setError('Give the field a name.');
      return;
    }
    const areaValue = area.trim() === '' ? null : Number(area.replace(',', '.'));
    if (areaValue !== null && (!Number.isFinite(areaValue) || areaValue < 0)) {
      setError('Enter the area as a number, for example 2.5.');
      return;
    }
    // Saved on the device straight away; it syncs to the server when there is signal.
    createField(siteId, name.trim(), areaValue === null ? null : toHectares(areaValue, unit));
    router.back();
  }

  return (
    <Screen>
      <Field label="Field name" value={name} onChangeText={setName} placeholder="e.g. North plot" autoFocus />
      <Field label="Area (optional)" value={area} onChangeText={setArea} placeholder="2.5" keyboardType="decimal-pad" />
      <Choice
        options={[
          { value: 'acre', label: 'Acres' },
          { value: 'hectare', label: 'Hectares' },
        ]}
        value={unit}
        onChange={setUnit}
      />
      <Body>You can map the field boundary later, by walking it or drawing it on a map. That sets the area for you.</Body>
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save field" onPress={save} />
    </Screen>
  );
}
