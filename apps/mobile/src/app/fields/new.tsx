import { toHectares } from '@farmwisr/core';
import type { AreaUnit } from '@farmwisr/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Choice, ErrorText, Field, Screen } from '../../components/ui';
import { createField } from '../../lib/farms';

export default function NewField() {
  const { farmId, unit: farmUnit } = useLocalSearchParams<{ farmId: string; unit?: AreaUnit }>();
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState<AreaUnit>(farmUnit === 'hectare' ? 'hectare' : 'acre');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('Give the field a name.');
      return;
    }
    const areaValue = area.trim() === '' ? null : Number(area.replace(',', '.'));
    if (areaValue !== null && (!Number.isFinite(areaValue) || areaValue < 0)) {
      setError('Enter the area as a number, for example 2.5.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createField(farmId, name.trim(), areaValue === null ? null : toHectares(areaValue, unit));
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the field.');
      setBusy(false);
    }
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
      <Body>You can map the field boundary later.</Body>
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save field" onPress={save} busy={busy} />
    </Screen>
  );
}
