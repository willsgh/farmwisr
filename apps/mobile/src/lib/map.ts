import type { LngLat } from '@farmwisr/core';
import type { LayerProps, MapProps } from '@maplibre/maplibre-react-native';

type StyleSpecification = Exclude<MapProps['mapStyle'], string>;
/** A style layer drawn from the boundary source; the same objects are used on native and web. */
type BoundaryLayer = LayerProps & { id: string; source: string };

/**
 * Satellite imagery for mapping fields. Defaults to Esri World Imagery for development; set
 * EXPO_PUBLIC_MAP_TILES_URL (an XYZ raster URL) and EXPO_PUBLIC_MAP_ATTRIBUTION for the provider used in production.
 */
const tilesUrl =
  process.env.EXPO_PUBLIC_MAP_TILES_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const attribution =
  process.env.EXPO_PUBLIC_MAP_ATTRIBUTION || 'Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community';

export const mapStyle: StyleSpecification = {
  version: 8,
  sources: {
    imagery: { type: 'raster', tiles: [tilesUrl], tileSize: 256, maxzoom: 19, attribution },
  },
  layers: [{ id: 'imagery', type: 'raster', source: 'imagery' }],
};

/** Where the camera should be: a point and zoom, or a box to fit ([west, south, east, north]). */
export type MapView = { center: [number, number]; zoom: number } | { bounds: [number, number, number, number] };

export const GHANA_VIEW: MapView = { center: [-1.02, 7.95], zoom: 6 };

export function viewOf(points: LngLat[]): MapView {
  const lngs = points.map((p) => p.lng);
  const lats = points.map((p) => p.lat);
  return { bounds: [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)] };
}

export const BOUNDARY_SOURCE = 'boundary';

/** The boundary drawn so far, its corners, and the phone's GPS position, as one GeoJSON collection. */
export function boundaryFeatures(points: LngLat[], position: LngLat | null): GeoJSON.FeatureCollection {
  const coords = points.map((p) => [p.lng, p.lat]);
  const features: GeoJSON.Feature[] = [];
  if (coords.length >= 3) {
    features.push({ type: 'Feature', properties: { kind: 'area' }, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } });
  }
  if (coords.length >= 2) {
    const line = coords.length >= 3 ? [...coords, coords[0]] : coords;
    features.push({ type: 'Feature', properties: { kind: 'edge' }, geometry: { type: 'LineString', coordinates: line } });
  }
  coords.forEach((c) => features.push({ type: 'Feature', properties: { kind: 'corner' }, geometry: { type: 'Point', coordinates: c } }));
  if (position) {
    features.push({ type: 'Feature', properties: { kind: 'me' }, geometry: { type: 'Point', coordinates: [position.lng, position.lat] } });
  }
  return { type: 'FeatureCollection', features };
}

export const boundaryLayers: BoundaryLayer[] = [
  {
    id: 'boundary-fill',
    type: 'fill',
    source: BOUNDARY_SOURCE,
    filter: ['==', ['get', 'kind'], 'area'],
    paint: { 'fill-color': '#f5d90a', 'fill-opacity': 0.25 },
  },
  {
    id: 'boundary-edge',
    type: 'line',
    source: BOUNDARY_SOURCE,
    filter: ['==', ['get', 'kind'], 'edge'],
    paint: { 'line-color': '#f5d90a', 'line-width': 3 },
  },
  {
    id: 'boundary-corner',
    type: 'circle',
    source: BOUNDARY_SOURCE,
    filter: ['==', ['get', 'kind'], 'corner'],
    paint: { 'circle-radius': 6, 'circle-color': '#ffffff', 'circle-stroke-color': '#2f6b2f', 'circle-stroke-width': 2 },
  },
  {
    id: 'boundary-me',
    type: 'circle',
    source: BOUNDARY_SOURCE,
    filter: ['==', ['get', 'kind'], 'me'],
    paint: { 'circle-radius': 8, 'circle-color': '#1a73e8', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 },
  },
];

export interface BoundaryMapProps {
  points: LngLat[];
  position: LngLat | null;
  /** The camera moves whenever this object changes. */
  view: MapView;
  onPress?: (point: LngLat) => void;
}
