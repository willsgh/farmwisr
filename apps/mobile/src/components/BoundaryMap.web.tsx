import { Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import type { GeoJSONSource, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import { BOUNDARY_SOURCE, boundaryFeatures, boundaryLayers, mapStyle } from '../lib/map';
import type { BoundaryMapProps, MapView } from '../lib/map';

// Copied into public/ on install by scripts/copy-map-worker.mjs.
setWorkerUrl('/maplibre-gl-worker.mjs');

function moveTo(map: MapLibreMap, view: MapView) {
  if ('bounds' in view) map.fitBounds(view.bounds, { padding: 40, maxZoom: 19, duration: 0 });
  else map.jumpTo({ center: view.center, zoom: view.zoom });
}

/** Satellite map showing a field boundary (web, MapLibre GL JS). */
export function BoundaryMap({ points, position, view, onPress }: BoundaryMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const latest = useRef({ points, position, view, onPress });
  useEffect(() => {
    latest.current = { points, position, view, onPress };
  });

  useEffect(() => {
    const map = new MapLibreMap({
      container: container.current!,
      // The native and web libraries ship their own copies of the style spec types; the shapes are the same.
      style: mapStyle as StyleSpecification,
      center: [-1.02, 7.95],
      zoom: 6,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }));
    map.on('load', () => {
      map.addSource(BOUNDARY_SOURCE, { type: 'geojson', data: boundaryFeatures(latest.current.points, latest.current.position) });
      boundaryLayers.forEach((layer) => map.addLayer(layer as LayerSpecification));
      mapRef.current = map;
      moveTo(map, latest.current.view);
    });
    map.on('click', (event) => latest.current.onPress?.({ lng: event.lngLat.lng, lat: event.lngLat.lat }));
    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource<GeoJSONSource>(BOUNDARY_SOURCE);
    source?.setData(boundaryFeatures(points, position));
  }, [points, position]);

  useEffect(() => {
    if (mapRef.current) moveTo(mapRef.current, view);
  }, [view]);

  return <div ref={container} data-testid="boundary-map" style={{ position: 'absolute', inset: 0 }} />;
}
