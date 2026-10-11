import {
  ACTIVITY_TYPES,
  HARVEST_UNITS,
  STAGE_LABELS,
  isIsoDate,
  parseMoneyToMinor,
  todayIso,
} from '@farmwisr/core';
import type { ActivityCost, CostCategory, SeasonStage } from '@farmwisr/core';
import * as Location from 'expo-location';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { PhotoThumb } from '../../components/PhotoThumb';
import { Body, Button, Chips, ErrorText, Field, Screen, Section } from '../../components/ui';
import { createActivity } from '../../lib/data';
import { pickPhoto } from '../../lib/photos';

const MAX_PHOTOS = 5;
type Place = { lat: number; lng: number; accuracyM: number | null };

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
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [busy, setBusy] = useState<'photo' | 'location' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!STAGE_LABELS[stage]) {
    return (
      <Screen>
        <ErrorText>Unknown season stage.</ErrorText>
      </Screen>
    );
  }

  async function addPhoto(source: 'camera' | 'library') {
    setError(null);
    setBusy('photo');
    try {
      const uri = await pickPhoto(source);
      if (uri) setPhotoUris((uris) => [...uris, uri]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the photo.');
    } finally {
      setBusy(null);
    }
  }

  async function addLocation() {
    setError(null);
    setBusy('location');
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setError('Allow location access to add where this was done.');
        return;
      }
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPlace({ lat: fix.coords.latitude, lng: fix.coords.longitude, accuracyM: fix.coords.accuracy ?? null });
    } catch {
      setError('Could not get your location. Try again in the open.');
    } finally {
      setBusy(null);
    }
  }

  async function save() {
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
    setBusy('save');
    try {
      await createActivity({
        seasonId,
        stage,
        type,
        date,
        notes: notes.trim() || null,
        costs: parsedCosts,
        harvestQuantity,
        harvestUnit: harvestQuantity === null ? null : harvestUnit,
        location: place,
        photoUris,
      });
    } catch {
      setError('Could not save the photos on this device. Check there is free space and try again.');
      setBusy(null);
      return;
    }
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

      <Section>Photos and location (optional)</Section>
      {photoUris.length > 0 && (
        <View style={styles.photos}>
          {photoUris.map((uri, i) => (
            <PhotoThumb key={uri} uri={uri} onRemove={() => setPhotoUris((uris) => uris.filter((_, j) => j !== i))} />
          ))}
        </View>
      )}
      {photoUris.length < MAX_PHOTOS && (
        <View style={styles.row}>
          {Platform.OS !== 'web' && (
            <View style={styles.rowItem}>
              <Button title="Take photo" variant="secondary" busy={busy === 'photo'} onPress={() => addPhoto('camera')} />
            </View>
          )}
          <View style={styles.rowItem}>
            <Button title="Choose photo" variant="secondary" busy={busy === 'photo'} onPress={() => addPhoto('library')} />
          </View>
        </View>
      )}
      {place ? (
        <>
          <Body>
            Location added{place.accuracyM !== null ? ` (±${Math.round(place.accuracyM)} m)` : ''}: {place.lat.toFixed(5)},{' '}
            {place.lng.toFixed(5)}
          </Body>
          <Button title="Remove location" variant="secondary" onPress={() => setPlace(null)} />
        </>
      ) : (
        <>
          <Body>Add your location if you are where the work was done.</Body>
          <Button title="Add my location" variant="secondary" busy={busy === 'location'} onPress={addLocation} />
        </>
      )}

      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Save activity" busy={busy === 'save'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
});
