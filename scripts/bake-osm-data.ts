/**
 * Fetches on-street parking data from Overpass API for Manchester city centre
 * and writes it as GeoJSON to src/data/osm-parking.geojson.
 *
 * Run with: npm run bake-osm
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import type { FeatureCollection, Feature, LineString } from 'geojson'

// Manchester city centre bounding box: south,west,north,east
const BBOX = '53.4650,-2.2750,53.4960,-2.2130'

const QUERY = `
[out:json][timeout:60][bbox:${BBOX}];
(
  way[highway]["parking:left"~"lane|street_side|shoulder"];
  way[highway]["parking:right"~"lane|street_side|shoulder"];
  way[highway]["parking:both"~"lane|street_side|shoulder"];
  way[highway]["parking:lane:left"~"parallel|diagonal|perpendicular"];
  way[highway]["parking:lane:right"~"parallel|diagonal|perpendicular"];
);
out geom;
`

interface OsmNode { lat: number; lon: number }
interface OsmWay {
  id: number
  tags: Record<string, string>
  geometry: OsmNode[]
}
interface OverpassResponse { elements: OsmWay[] }

async function main() {
  console.log('Fetching parking data from Overpass API…')

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(QUERY)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'manchester-parking-map/1.0 (open source project)',
    },
  })

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`)

  const data = await res.json() as OverpassResponse
  const ways = data.elements.filter((e): e is OsmWay => e.geometry?.length > 1)

  const features: Feature<LineString>[] = ways.map(way => ({
    type: 'Feature',
    properties: {
      osmId: way.id,
      name: way.tags.name ?? '',
      parkingLeft: way.tags['parking:left'] ?? way.tags['parking:lane:left'] ?? null,
      parkingRight: way.tags['parking:right'] ?? way.tags['parking:lane:right'] ?? null,
      parkingBoth: way.tags['parking:both'] ?? null,
      highway: way.tags.highway,
    },
    geometry: {
      type: 'LineString',
      coordinates: way.geometry.map(n => [n.lon, n.lat]),
    },
  }))

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features,
  }

  const outPath = resolve('src/data/osm-parking.geojson')
  writeFileSync(outPath, JSON.stringify(geojson, null, 2))
  console.log(`✓ Wrote ${features.length} ways to ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })
