import { boundaryAreaHectares, boundaryProblem, distanceMetres } from '@farmwisr/core';
import type { AreaUnit, LngLat } from '@farmwisr/core';
import * as Location from 'expo-location';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { BoundaryMap } from '../../components/BoundaryMap';
import { Body, Button, Choice, ErrorText, Screen, colors } from '../../components/ui';
import { saveFieldBoundary, useFarmData } from '../../lib/data';
import type { Field } from '../../lib/data';
import { formatArea } from '../../lib/format';
import { GHANA_VIEW, viewOf } from '../../lib/map';
import type { MapView } from '../../lib/map';

type Mode = 'walk' | 'draw';

/** GPS fixes worse than this are flagged; phones usually reach 3 to 10 m in the open. */
const GOOD_ACCURACY_M = 10;

export default function MapField() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useFarmData();
  const field = data.field(id);

  if (!data.loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!field) {
    return (
      <Screen>
        <Body>This field is not on this device.</Body>
      </Screen>
    );
  }
  return <BoundaryEditor field={field} unit={data.farm?.area_unit ?? 'acre'} />;
}

function BoundaryEditor({ field, unit }: { field: Field; unit: AreaUnit }) {
  // Walking needs the phone's GPS; on a computer, drawing on the map is the practical option.
  const [mode, setMode] = useState<Mode>(Platform.OS === 'web' ? 'draw' : 'walk');
  const [corners, setCorners] = useState<LngLat[]>(field.boundary);
  const [view, setView] = useState<MapView>(() => (field.boundary.length > 0 ? viewOf(field.boundary) : GHANA_VIEW));
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Follow the phone's position while this screen is open. The first fix centres the map on the
  // farmer, unless there is already a boundary to show.
  const cornerCount = useRef(corners.length);
  useEffect(() => {
    cornerCount.current = corners.length;
  }, [corners]);
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    let centred = false;
    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (!granted) {
        setLocationDenied(true);
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
        (fix) => {
          setPosition(fix);
          if (!centred && cornerCount.current === 0) setView({ center: [fix.coords.longitude, fix.coords.latitude], zoom: 17 });
          centred = true;
        },
      );
      if (cancelled) subscription.remove();
    })().catch(() => setLocationDenied(true));
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const here = useMemo(
    () => (position ? { lng: position.coords.longitude, lat: position.coords.latitude } : null),
    [position],
  );
  const accuracy = position?.coords.accuracy ?? null;
  const problem = boundaryProblem(corners);

  function addCorner(point: LngLat) {
    const last = corners[corners.length - 1];
    if (last && distanceMetres(last, point) < 2) {
      setMessage('That is the same spot as the last corner. Walk to the next corner first.');
      return;
    }
    setMessage(null);
    setCorners([...corners, point]);
  }

  function markHere() {
    if (!here) {
      setMessage(locationDenied ? 'Allow location access to walk the boundary.' : 'Waiting for GPS. Stand in the open for a moment.');
      return;
    }
    addCorner(here);
  }

  function save() {
    if (problem) {
      setMessage(problem);
      return;
    }
    // Saved on the device straight away; it syncs to the server when there is signal.
    saveFieldBoundary(field.id, corners);
    router.back();
  }

  const area = boundaryAreaHectares(corners);
  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: `Map ${field.name}` }} />
      <View style={styles.map}>
        <BoundaryMap points={corners} position={here} view={view} onPress={mode === 'draw' ? addCorner : undefined} />
      </View>
      <View style={styles.panel}>
        <Choice
          options={[
            { value: 'walk', label: 'Walk the boundary' },
            { value: 'draw', label: 'Draw on the map' },
          ]}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setMessage(null);
          }}
        />
        <Text style={styles.hint}>
          {mode === 'walk'
            ? 'Stand at a corner of the field and tap "Mark corner". Walk to each corner in turn, all the way round.'
            : 'Tap each corner of the field on the map, in order, all the way round.'}
        </Text>
        {mode === 'walk' && (
          <Text style={[styles.hint, accuracy !== null && accuracy > GOOD_ACCURACY_M && styles.warn]}>
            {locationDenied
              ? 'Location access is off, so walking is not available. You can draw on the map instead.'
              : accuracy === null
                ? 'Waiting for GPS…'
                : accuracy > GOOD_ACCURACY_M
                  ? `GPS accuracy ±${Math.round(accuracy)} m. Wait in the open until it is ${GOOD_ACCURACY_M} m or better.`
                  : `GPS accuracy ±${Math.round(accuracy)} m`}
          </Text>
        )}
        <Text style={styles.area} accessibilityLiveRegion="polite">
          {corners.length} {corners.length === 1 ? 'corner' : 'corners'}
          {area > 0 ? ` · ${formatArea(area, unit)}` : ''}
        </Text>
        {message && <ErrorText>{message}</ErrorText>}
        {mode === 'walk' && <Button title="Mark corner here" onPress={markHere} />}
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Button title="Undo" variant="secondary" onPress={() => setCorners(corners.slice(0, -1))} />
          </View>
          <View style={styles.rowItem}>
            <Button title="Start again" variant="secondary" onPress={() => setCorners([])} />
          </View>
        </View>
        <Button title="Save boundary" variant={mode === 'walk' ? 'secondary' : 'primary'} onPress={save} />
        <Text style={styles.note}>Saving sets the field&apos;s area to the mapped area.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1, minHeight: 240 },
  panel: { padding: 16, gap: 10, borderTopWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  hint: { fontSize: 15, color: colors.muted },
  warn: { color: colors.error },
  area: { fontSize: 20, fontWeight: '600', color: colors.text },
  note: { fontSize: 13, color: colors.muted },
});
