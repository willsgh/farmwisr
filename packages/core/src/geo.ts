/**
 * Field boundaries. A boundary is the list of corners a farmer marked, in order around the field;
 * the ring is closed automatically. Fields are small, so area is worked out on a flat plane fitted to
 * the WGS84 ellipsoid at the field's centre, which agrees with PostGIS geography ST_Area to well
 * under 0.1% at field sizes.
 */

export interface LngLat {
  lng: number;
  lat: number;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

const WGS84_A = 6378137;
const WGS84_F = 1 / 298.257223563;
const WGS84_E2 = WGS84_F * (2 - WGS84_F);
const RAD = Math.PI / 180;

type XY = [number, number];

/** Projects points to metres east/north of their centre (local tangent plane). */
function toLocalMetres(points: LngLat[]): XY[] {
  const lat0 = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng0 = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  const sin = Math.sin(lat0 * RAD);
  const w = Math.sqrt(1 - WGS84_E2 * sin * sin);
  const primeVertical = WGS84_A / w;
  const meridional = (WGS84_A * (1 - WGS84_E2)) / (w * w * w);
  const metresPerDegLng = primeVertical * Math.cos(lat0 * RAD) * RAD;
  const metresPerDegLat = meridional * RAD;
  return points.map((p) => [(p.lng - lng0) * metresPerDegLng, (p.lat - lat0) * metresPerDegLat]);
}

/** Area enclosed by the boundary in hectares; 0 for fewer than three corners. */
export function boundaryAreaHectares(points: LngLat[]): number {
  if (points.length < 3) return 0;
  const xy = toLocalMetres(points);
  let twiceArea = 0;
  for (let i = 0; i < xy.length; i++) {
    const [x1, y1] = xy[i];
    const [x2, y2] = xy[(i + 1) % xy.length];
    twiceArea += x1 * y2 - x2 * y1;
  }
  return Math.abs(twiceArea) / 2 / 10000;
}

/** Distance in metres between two nearby points. */
export function distanceMetres(a: LngLat, b: LngLat): number {
  const [p, q] = toLocalMetres([a, b]);
  return Math.hypot(q[0] - p[0], q[1] - p[1]);
}

const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function segmentsCross(a: XY, b: XY, c: XY, d: XY): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** True when two edges of the closed boundary cross, e.g. corners marked out of order. */
export function boundaryCrossesItself(points: LngLat[]): boolean {
  if (points.length < 4) return false;
  const xy = toLocalMetres(points);
  const n = xy.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // these two edges share the first corner
      if (segmentsCross(xy[i], xy[(i + 1) % n], xy[j], xy[(j + 1) % n])) return true;
    }
  }
  return false;
}

/** Why a boundary can't be saved yet, or null when it can. */
export function boundaryProblem(points: LngLat[]): string | null {
  if (points.length < 3) return 'Mark at least three corners.';
  if (boundaryCrossesItself(points)) return 'The boundary lines cross. Undo and mark the corners in order around the field.';
  if (boundaryAreaHectares(points) < 0.001) return 'The boundary is too small. Check the corners are in the right places.';
  return null;
}

const round7 = (n: number) => Math.round(n * 1e7) / 1e7; // about 1 cm

/** GeoJSON polygon with a closed ring, as stored in fields.boundary_geojson. */
export function boundaryToGeoJson(points: LngLat[]): GeoJsonPolygon {
  const ring = points.map((p): [number, number] => [round7(p.lng), round7(p.lat)]);
  return { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
}

/** Corners from a stored GeoJSON polygon, or an empty list if there is none or it isn't a polygon. */
export function boundaryFromGeoJson(value: unknown): LngLat[] {
  const geo = typeof value === 'string' ? safeParse(value) : value;
  if (!geo || typeof geo !== 'object') return [];
  const { type, coordinates } = geo as { type?: unknown; coordinates?: unknown };
  if (type !== 'Polygon' || !Array.isArray(coordinates) || !Array.isArray(coordinates[0])) return [];
  const ring = (coordinates[0] as unknown[]).filter(
    (c): c is [number, number] => Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number',
  );
  const open = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  return (open ? ring.slice(0, -1) : ring).map(([lng, lat]) => ({ lng, lat }));
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
