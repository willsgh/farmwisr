import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import type { CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { BOUNDARY_SOURCE, boundaryFeatures, boundaryLayers, mapStyle } from '../lib/map';
import type { BoundaryMapProps } from '../lib/map';

/** Satellite map showing a field boundary (Android and iOS, MapLibre Native). */
export function BoundaryMap({ points, position, view, onPress }: BoundaryMapProps) {
  const camera = useRef<CameraRef>(null);

  useEffect(() => {
    if ('bounds' in view) camera.current?.fitBounds(view.bounds, { padding: { top: 40, right: 40, bottom: 40, left: 40 } });
    else camera.current?.jumpTo({ center: view.center, zoom: view.zoom });
  }, [view]);

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={mapStyle}
      logo={false}
      onPress={(event) => {
        const [lng, lat] = event.nativeEvent.lngLat;
        onPress?.({ lng, lat });
      }}
    >
      <Camera ref={camera} initialViewState={'bounds' in view ? { bounds: view.bounds } : view} />
      <GeoJSONSource id={BOUNDARY_SOURCE} data={boundaryFeatures(points, position)}>
        {boundaryLayers.map(({ source: _source, ...layer }) => (
          <Layer key={layer.id} {...layer} />
        ))}
      </GeoJSONSource>
    </Map>
  );
}
