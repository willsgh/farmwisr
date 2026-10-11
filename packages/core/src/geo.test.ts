import { describe, expect, it } from 'vitest';
import {
  boundaryAreaHectares,
  boundaryCrossesItself,
  boundaryFromGeoJson,
  boundaryProblem,
  boundaryToGeoJson,
  distanceMetres,
} from './geo';

// A small plot near Kumasi. PostGIS geography ST_Area gives 1.14327207649 ha for this ring.
const kumasiPlot = [
  { lng: -1.6244, lat: 6.6885 },
  { lng: -1.6235, lat: 6.6885 },
  { lng: -1.6233, lat: 6.6893 },
  { lng: -1.6246, lat: 6.6894 },
];

describe('boundaryAreaHectares', () => {
  it('matches PostGIS geography area for a small field', () => {
    expect(boundaryAreaHectares(kumasiPlot)).toBeCloseTo(1.14327, 3);
  });

  it('matches PostGIS for a large block near Tamale (121.48 ha)', () => {
    const block = [
      { lng: -0.85, lat: 9.4 },
      { lng: -0.84, lat: 9.4 },
      { lng: -0.84, lat: 9.41 },
      { lng: -0.85, lat: 9.41 },
    ];
    expect(boundaryAreaHectares(block) / 121.47955).toBeCloseTo(1, 3);
  });

  it('does not depend on the direction the corners were walked', () => {
    expect(boundaryAreaHectares([...kumasiPlot].reverse())).toBeCloseTo(boundaryAreaHectares(kumasiPlot), 10);
  });

  it('is 0 for fewer than three corners', () => {
    expect(boundaryAreaHectares(kumasiPlot.slice(0, 2))).toBe(0);
  });
});

describe('distanceMetres', () => {
  it('measures about 99.4 m along the bottom edge of the plot', () => {
    expect(distanceMetres(kumasiPlot[0], kumasiPlot[1])).toBeCloseTo(99.4, 0);
  });
});

describe('boundary checks', () => {
  it('spots corners marked out of order', () => {
    const bowtie = [kumasiPlot[0], kumasiPlot[2], kumasiPlot[1], kumasiPlot[3]];
    expect(boundaryCrossesItself(bowtie)).toBe(true);
    expect(boundaryProblem(bowtie)).toMatch(/cross/);
    expect(boundaryCrossesItself(kumasiPlot)).toBe(false);
  });

  it('needs three corners and a real area', () => {
    expect(boundaryProblem(kumasiPlot.slice(0, 2))).toMatch(/three corners/);
    const tiny = [
      { lng: 0, lat: 6 },
      { lng: 0.000001, lat: 6 },
      { lng: 0, lat: 6.000001 },
    ];
    expect(boundaryProblem(tiny)).toMatch(/too small/);
    expect(boundaryProblem(kumasiPlot)).toBeNull();
  });
});

describe('GeoJSON', () => {
  it('closes the ring and reads it back', () => {
    const geo = boundaryToGeoJson(kumasiPlot);
    expect(geo.coordinates[0]).toHaveLength(5);
    expect(geo.coordinates[0][4]).toEqual(geo.coordinates[0][0]);
    expect(boundaryFromGeoJson(geo)).toEqual(kumasiPlot);
    expect(boundaryFromGeoJson(JSON.stringify(geo))).toEqual(kumasiPlot);
  });

  it('ignores anything that is not a polygon', () => {
    expect(boundaryFromGeoJson(null)).toEqual([]);
    expect(boundaryFromGeoJson('not json')).toEqual([]);
    expect(boundaryFromGeoJson({ type: 'Point', coordinates: [0, 0] })).toEqual([]);
  });
});
