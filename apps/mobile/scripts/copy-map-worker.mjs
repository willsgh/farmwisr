// MapLibre GL JS runs its tile work in a web worker loaded from a separate file, which Metro does not
// bundle. Copy it into public/ so the web app serves it (see components/BoundaryMap.web.tsx).
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve('maplibre-gl/package.json')), 'dist', 'maplibre-gl-worker.mjs');
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'maplibre-gl-worker.mjs');
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
