import {
  ACTIVITY_TYPES,
  HARVEST_UNITS,
  STAGE_LABELS,
  isIsoDate,
  parseMoneyToMinor,
  todayIso,
} from '@farmwisr/core';
import type { ActivityCost, CostCategory, SeasonStage } from '@farmwisr/core';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Body, Button, Chips, ErrorText, Field, Screen, Section } from '../../components/ui';
import { createActivity } from '../../lib/data';

const COST_FIELDS: { category: CostCategory; label: string; placeholder: string }[] = [
  { category: 'inputs', label: 'Inputs (seed, fertiliser, chemicals)', placeholder: '0.00' },
  { category: 'labour', label: 'Labour', placeholder: '0.00' },
  { category: 'equipment', label: 'Equipment and fuel', placeholder: '0.00' },
  { category: 'other', label: 'Other', placeholder: '0.00' },
];

export default function LogActivity() {
  const { seasonId, stage, currency = 'GHS' } = useLocalSearchParams<{ seasonId: string; stage: SeasonStage; currency?: string }>();
  const types = ACTIVITY_TYPES[stage] ?? [];
  const isHarvest = stage === 'harvest';

  const [pickedType, setPickedType] = useState<string | null>(types.length === 1 ? types[0] : null);
  const [otherType, setOtherType] = useState('');
  const [date, setDate] = useState(todayIso());
  const [costs, setCosts] = useState<Record<CostCategory, string>>({ inputs: '', labour: '', equipment: '', other: '' });
  const [quantity, setQuantity] = useState('');
  const [harvestUnit, setHarvestUnit] = useState<string | null>('bag');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!STAGE_LABELS[stage]) {
    return (
      <Screen>
        <ErrorText>Unknown season stage.</ErrorText>
      </Screen>
    );
  }

  function save() {
    const type = pickedType ?? otherType.trim();
    if (!type) {
      setError('Pick or type what was done.');
      return;
    }
    if (!isIsoDate(date)) {
      setError('Enter the date as YYYY-MM-DD, for example 2026-04-01.');
      return;
    }

    const parsedCosts: ActivityCost[] = [];
    for (const { category, label } of COST_FIELDS) {
      const text = costs[category].trim();
      if (!text) continue;
      const amountMinor = parseMoneyToMinor(text);
      if (amountMinor === null) {
        setError(`${label}: enter an amount such as 150 or 150.50.`);
        return;
      }
      if (amountMinor > 0) parsedCosts.push({ category, amountMinor });
    }

    let harvestQuantity: number | null = null;
    if (isHarvest && quantity.trim()) {
      harvestQuantity = Number(quantity.replace(',', '.'));
      if (!Number.isFinite(harvestQuantity) || harvestQuantity < 0) {
        setError('Enter the quantity harvested as a number.');
        return;
      }
      if (!harvestUnit) {
        setError('Pick the unit for the quantity harvested.');
        return;
      }
    }

    // Saved on the device straight away; it syncs to the server when there is signal.
    createActivity({
      seasonId,
      stage,
      type,
      date,
      notes: notes.trim() || null,
      costs: parsedCosts,
      harvestQuantity,
      harvestUnit: harvestQuantity === null ? null : harvestUnit,
    });
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: STAGE_LABELS[stage] }} />
      <Section>What was done?</Section>
      <Chips
        options={types}
        value={pickedType}
        onChange={(type) => {
          setPickedType(type);
          if (type) setOtherType('');
        }}
      />
      {!pickedType && <Field label="Something else" value={otherType} onChangeText={setOtherType} placeholder="Describe the work" />}
      <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

      {isHarvest && (
        <>
          <Field label="Quantity harvested" value={quantity} onChangeText={setQuantity} placeholder="e.g. 20" keyboardType="decimal-pad" />
          <Chips options={HARVEST_UNITS} value={harvestUnit} onChange={setHarvestUnit} />
        </>
      )}

      <Section>Costs ({currency})</Section>
      <Body>Leave blank if there was no cost.</Body>
      {COST_FIELDS.map(({ category, label, placeholder }) => (
        <Field
          key={category}
          label={label}
          value={costs[category]}
          onChangeText={(text) => setCosts((c) => ({ ...c, [category]: text }))}
          placeholder={placeholder}
          keyboardType="decimal-pad"
        />
      ))}

      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save activity" onPress={save} />
    </Screen>
  );
}
