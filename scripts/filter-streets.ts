/**
 * Filters public/data/zone-streets.geojson to only include the streets
 * officially listed in Manchester Council's on-street parking bay directories.
 *
 * Run with: npx tsx scripts/filter-streets.ts
 * (Also called automatically at the end of bake-osm-data.ts)
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { FeatureCollection, Feature, LineString } from 'geojson'

// ── Official street lists from Manchester City Council ────────────────────────
// Source: https://www.manchester.gov.uk/online-directories/parking-directories/
//         city-centre-parking-directories/on-street-parking-bays/zone-[1-4]
export const OFFICIAL_STREETS: Record<number, string[]> = {
  1: [
    'Booth Street', 'Bootle Street', 'Brown Street', 'Central Street',
    'Chancery Lane', 'Chapel Walks', 'Cheapside', 'Clarence Street',
    'Fountain Street', 'Jacksons Row', 'John Dalton Street', 'Kennedy Street',
    'King Street', 'King Street West', 'Lloyd Street', 'Marble Street',
    'Marsden Street', 'Mount Street', 'Parsonage', 'Peter Street',
    'Phoenix Street', 'Queen Street', 'Ridgefield', 'South King Street',
    'Southgate', 'Spring Gardens', "St James's Square", "St Mary's Parsonage",
    'Tib Lane', 'West Mosley Street', 'York Street',
  ],
  2: [
    'Abingdon Street', 'Atherton Street', 'Auburn Street', 'Aytoun Street',
    'Back Acton Street', 'Birchin Lane', 'Bloom Street', 'Bombay Street',
    'Brewer Street', 'Byrom Street', 'Cameron Street', 'Chancery Place',
    'Charlotte Street', 'Chatham Street', 'Chepstow Street North',
    'Chepstow Street South', 'Chorlton Street', 'Cobourg Street',
    'Corporation Street', 'Dale Street', 'Dantzic Street', 'Deansgate',
    'Dickinson Street', 'Dolefield', 'Ducie Street', 'Ebden Street',
    'Faulkner Street', 'George Street', 'Gore Street', 'Granby Row',
    'Great Bridgewater Street', 'Great John Street', 'Harter Street',
    'Hilton Street', 'Lena Street', 'Little John Street', 'Liverpool Road',
    'Long Millgate', 'Lower Byrom Street', 'Major Street', 'Minshull Street',
    'Minshull Street South', 'Museum Street', 'Nicholas Street', 'Oxford Street',
    'Paton Street', 'Port Street', 'Portland Street', 'Princess Street',
    'Quay Street', 'Red Lion Street', 'Richmond Street', 'Roby Street',
    'Rowendale Street', 'Sackville Street', 'Samuel Ogden Street', 'Silver Street',
    'South Pump Street', 'Southmill Street', 'Spear Street', 'St John Street',
    'Tariff Street', 'Thomas Street', 'Tib Street', 'Todd Street',
    'Tonman Street', 'Turner Street', 'Victoria Station Approach',
    "Walker's Croft", 'Water Street', 'Waterloo Street', 'Whitworth Street',
    'Whitworth Street West',
  ],
  3: [
    'Beaufort Street', 'Blantyre Street', 'Brancaster Road', 'Bridgewater Street',
    'Brook Street', 'Cambridge Street', 'Castle Street', 'Chester Street',
    'Collier Street', 'Duke Place', 'Duke Street', 'Great Marlborough Street',
    'Hulme Street', 'Lower Ormond Street', 'New Wakefield Street',
    'Princess Street', 'Rice Street', 'Slate Wharf', 'Wakefield Street',
    'York Street',
  ],
  4: [
    'Baird Street', 'Betley Street', 'Chapeltown Street', 'Chester Street',
    'City Road East', 'Commercial Street', 'Crown Street', 'Deansgate',
    'Fair Street', 'Fairfield Street', 'Garwood Street', 'Great Jackson Street',
    'Heyrod Street', 'Hulme Street', 'Little Peter Street', 'Longacre Street',
    'Melbourne Street', 'Newcastle Street', 'River Street', 'Sheffield Street',
    'Silvercroft Street', 'Sparkle Street', 'Store Street', 'Travis Street',
    'Wilmott Street',
  ],
}

// ── Name normalisation ────────────────────────────────────────────────────────
// Strips parenthetical suffixes, apostrophes, dots, and lowercases
// so "St James's Square" ≈ "st james square" ≈ "St. James's Square"

function norm(s: string): string {
  return s
    .replace(/\s*\(.*?\)\s*/g, ' ')   // "(Cul De Sac)" etc → space
    .replace(/['.]/g, '')              // apostrophes + dots
    .replace(/\bst\b/gi, 'saint')      // st → saint for consistent matching
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Pre-build a Map<zoneId, Set<normalisedName>>
const officialSets: Record<number, Set<string>> = {}
for (const [zoneId, streets] of Object.entries(OFFICIAL_STREETS)) {
  officialSets[Number(zoneId)] = new Set(streets.map(norm))
}

// ── Filter ────────────────────────────────────────────────────────────────────

export function filterToOfficialStreets(fc: FeatureCollection): FeatureCollection {
  const filtered = (fc.features as Feature<LineString>[]).filter(f => {
    const zoneId  = f.properties?.zoneId as number
    const rawName = (f.properties?.name  as string) ?? ''
    return officialSets[zoneId]?.has(norm(rawName)) ?? false
  })

  return { type: 'FeatureCollection', features: filtered }
}

// ── Run standalone ────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = resolve('public/data/zone-streets.geojson')
  const before = JSON.parse(readFileSync(path, 'utf8')) as FeatureCollection
  const after  = filterToOfficialStreets(before)

  const counts: Record<number, number> = {}
  for (const f of after.features) {
    const z = (f.properties as { zoneId: number }).zoneId
    counts[z] = (counts[z] ?? 0) + 1
  }

  writeFileSync(path, JSON.stringify(after))
  console.log(`Filtered ${before.features.length} → ${after.features.length} roads`)
  console.log('  Zone 1:', counts[1] ?? 0)
  console.log('  Zone 2:', counts[2] ?? 0)
  console.log('  Zone 3:', counts[3] ?? 0)
  console.log('  Zone 4:', counts[4] ?? 0)

  // Report any official streets not found in OSM data
  const foundByZone: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }
  for (const f of after.features) {
    const z = (f.properties as { zoneId: number; name: string }).zoneId
    foundByZone[z].add(norm(f.properties!.name))
  }
  for (const [zoneId, streets] of Object.entries(OFFICIAL_STREETS)) {
    const missing = streets.filter(s => !foundByZone[Number(zoneId)].has(norm(s)))
    if (missing.length) console.log(`  Zone ${zoneId} missing from OSM:`, missing.join(', '))
  }
}
