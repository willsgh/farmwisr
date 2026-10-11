import { COMMON_CROPS, isIsoDate, todayIso } from '@farmwisr/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Button, Chips, ErrorText, Field, Screen, Section } from '../../components/ui';
import { createSeason } from '../../lib/seasons';

export default function NewSeason() {
  const { fieldId } = useLocalSearchParams<{ fieldId: string }>();
  const [pickedCrop, setPickedCrop] = useState<string | null>(null);
  const [otherCrop, setOtherCrop] = useState('');
  const [variety, setVariety] = useState('');
  const [startDate, setStartDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const crop = pickedCrop ?? otherCrop.trim();
    if (!crop) {
      setError('Pick or type the crop.');
      return;
    }
    if (!isIsoDate(startDate)) {
      setError('Enter the start date as YYYY-MM-DD, for example 2026-04-01.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const season = await createSeason({ fieldId, crop, variety: variety.trim() || null, startDate });
      router.replace({ pathname: '/seasons/[id]', params: { id: season.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the season.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Section>Crop</Section>
      <Chips
        options={COMMON_CROPS}
        value={pickedCrop}
        onChange={(crop) => {
          setPickedCrop(crop);
          if (crop) setOtherCrop('');
        }}
      />
      {!pickedCrop && <Field label="Other crop" value={otherCrop} onChangeText={setOtherCrop} placeholder="e.g. Okra" />}
      <Field label="Variety (optional)" value={variety} onChangeText={setVariety} placeholder="e.g. Obatanpa" />
      <Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
      {error && <ErrorText>{error}</ErrorText>}
      <Button title="Start season" onPress={save} busy={busy} />
    </Screen>
  );
}
