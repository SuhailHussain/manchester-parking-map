/**
 * Fetches all driveable roads within each Manchester parking zone polygon
 * using the Overpass poly: filter, tags each road with its zoneId, and
 * writes the result to public/data/zone-streets.geojson.
 *
 * Run with: npm run bake-osm
 */

import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'
import type { FeatureCollection, Feature, LineString, Polygon, MultiPolygon, Position } from 'geojson'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OsmNode { lat: number; lon: number }
interface OsmWay { id: number; tags: Record<string, string>; geometry: OsmNode[] }
interface OverpassResponse { elements: OsmWay[] }

interface ZoneFeature {
  type: 'Feature'
  properties: { zoneId: number; name: string }
  geometry: Polygon | MultiPolygon
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// GeoJSON coords are [lon, lat]; Overpass poly: expects "lat lon lat lon ..."
function toOverpassPoly(ring: Position[]): string {
  return ring
    .slice(0, -1) // drop closing duplicate
    .map(([lon, lat]) => `${lat} ${lon}`)
    .join(' ')
}

async function queryRoadsInPolygon(polyStr: string, attempt = 1): Promise<OsmWay[]> {
  const query = `
[out:json][timeout:90];
way[highway~"^(primary|secondary|tertiary|unclassified|residential|service|living_street|road)$"]
  (poly:"${polyStr}");
out geom;
`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'manchester-parking-map/1.0 (open source project)',
    },
  })

  if (!res.ok) {
    if (attempt < 4) {
      const wait = attempt * 8000
      console.log(`  ⚠ ${res.status} — retrying in ${wait / 1000}s (attempt ${attempt}/3)…`)
      await new Promise(r => setTimeout(r, wait))
      return queryRoadsInPolygon(polyStr, attempt + 1)
    }
    throw new Error(`Overpass error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json() as OverpassResponse
  return data.elements.filter(e => e.geometry?.length > 1)
}

function wayToFeature(way: OsmWay, zoneId: number): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {
      osmId:  way.id,
      zoneId,
      name:    way.tags.name    ?? '',
      highway: way.tags.highway ?? '',
      color:  '#9ca3af', // placeholder — overwritten at runtime
    },
    geometry: {
      type: 'LineString',
      coordinates: way.geometry.map(n => [n.lon, n.lat]),
    },
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const zonesPath = resolve('public/data/zone-boundaries.geojson')
  const zones = JSON.parse(readFileSync(zonesPath, 'utf8')) as FeatureCollection

  // Collect all features keyed by OSM ID; lower zoneId wins on duplicates
  const byOsmId = new globalThis.Map<number, Feature<LineString>>()

  for (const feature of zones.features as ZoneFeature[]) {
    const { zoneId } = feature.properties
    const geom = feature.geometry

    // Gather the outer rings to query (one per polygon part)
    const rings: Position[][] =
      geom.type === 'Polygon'
        ? [geom.coordinates[0]]
        : geom.coordinates.map(poly => poly[0])

    for (const ring of rings) {
      const polyStr = toOverpassPoly(ring)
      console.log(`  Querying Zone ${zoneId} polygon (${ring.length - 1} vertices)…`)

      const ways = await queryRoadsInPolygon(polyStr)
      console.log(`  → ${ways.length} roads found`)

      for (const way of ways) {
        // Keep the feature from the lowest-numbered zone if there's a duplicate
        const existing = byOsmId.get(way.id)
        if (!existing || existing.properties!.zoneId > zoneId) {
          byOsmId.set(way.id, wayToFeature(way, zoneId))
        }
      }

      // Pause between requests to avoid hammering the server
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  const geojson: FeatureCollection = {
    type: 'FeatureCollection',
    features: Array.from(byOsmId.values()),
  }

  const outPath = resolve('public/data/zone-streets.geojson')
  writeFileSync(outPath, JSON.stringify(geojson))

  const counts: Record<number, number> = {}
  for (const f of geojson.features) {
    const z = (f.properties as { zoneId: number }).zoneId
    counts[z] = (counts[z] ?? 0) + 1
  }
  console.log(`\n✓ Wrote ${geojson.features.length} roads to ${outPath}`)
  console.log('  Zone 1:', counts[1] ?? 0, 'roads')
  console.log('  Zone 2:', counts[2] ?? 0, 'roads')
  console.log('  Zone 3:', counts[3] ?? 0, 'roads')
  console.log('  Zone 4:', counts[4] ?? 0, 'roads')
}

main().catch(err => { console.error(err); process.exit(1) })
