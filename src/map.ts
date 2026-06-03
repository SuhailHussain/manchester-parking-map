import maplibregl, { GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import type { ZoneStatus } from './types'

const MANCHESTER_CENTER: [number, number] = [-2.2453, 53.4790]

const CPZ_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-2.268, 53.469],
  [-2.219, 53.491],
]

// Identity colors per zone — matches Manchester Council's own zone map
const ZONE_OUTLINE_COLOR = [
  'match', ['get', 'zoneId'],
  1, '#dc2626',   // red    — Zone 1
  2, '#7c3aed',   // purple — Zone 2
  3, '#2563eb',   // blue   — Zone 3
  4, '#d97706',   // amber  — Zone 4
  '#94a3b8',      // fallback
] as maplibregl.ExpressionSpecification

let map: maplibregl.Map
let rawZones: FeatureCollection
let rawStreets: FeatureCollection

export async function initMap(
  onZoneClick: (status: ZoneStatus, lngLat: maplibregl.LngLat, streetName?: string) => void
): Promise<maplibregl.Map> {
  const [zonesRes, streetsRes] = await Promise.all([
    fetch('./data/zone-boundaries.geojson'),
    fetch('./data/zone-streets.geojson'),
  ])
  rawZones   = await zonesRes.json()   as FeatureCollection
  rawStreets = await streetsRes.json() as FeatureCollection

  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: MANCHESTER_CENTER,
    zoom: 14,
    maxZoom: 18,
    minZoom: 12,
    maxBounds: CPZ_BOUNDS,
  })

  await new Promise<void>(resolve => map.once('load', resolve))

  // Find the first symbol (label) layer in the basemap so we can insert
  // our road lines underneath it — street names stay readable on top.
  const firstLabelId = map.getStyle().layers.find(l => l.type === 'symbol')?.id

  // ── Zone boundary source (polygons) ──────────────────────
  map.addSource('zones', { type: 'geojson', data: rawZones })

  // Subtle zone-identity tint — no outline, just a light fill per zone
  map.addLayer({
    id: 'zone-area',
    type: 'fill',
    source: 'zones',
    paint: {
      'fill-color': ZONE_OUTLINE_COLOR,
      'fill-opacity': 0.07,
    },
  }, firstLabelId)

  // ── Street source (roads per zone) ───────────────────────
  map.addSource('zone-streets', { type: 'geojson', data: rawStreets })

  // Coloured road lines — inserted below label layers so street names show through
  map.addLayer({
    id: 'zone-roads',
    type: 'line',
    source: 'zone-streets',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#9ca3af'],
      'line-opacity': 0.9,
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        12, 2,
        14, 4,
        17, 7,
      ],
    },
  }, firstLabelId)

  // Invisible fill on top — keeps the whole zone area clickable
  map.addLayer({
    id: 'zone-fill',
    type: 'fill',
    source: 'zones',
    paint: { 'fill-color': '#000000', 'fill-opacity': 0 },
  })

  // ── Interactions ──────────────────────────────────────────
  map.on('click', 'zone-fill', (e) => {
    if (!e.features?.[0]) return
    const status = e.features[0].properties as ZoneStatus

    // Look for a named street segment near the click point
    const streetFeatures = map.queryRenderedFeatures(e.point, { layers: ['zone-roads'] })
    const streetName = streetFeatures.find(f => f.properties?.name)?.properties?.name as string | undefined

    onZoneClick(status, e.lngLat, streetName)
  })

  map.on('mouseenter', 'zone-fill', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'zone-fill', () => { map.getCanvas().style.cursor = '' })

  return map
}

export function updateZoneColors(statuses: ZoneStatus[]): void {
  const byId = new globalThis.Map(statuses.map(s => [s.zoneId, s]))

  const updatedZones: FeatureCollection = {
    type: 'FeatureCollection',
    features: rawZones.features.map(f => {
      const zoneId = f.properties?.zoneId as number
      const s = byId.get(zoneId as 1 | 2 | 3 | 4)
      return {
        ...f,
        properties: {
          zoneId,
          name:            f.properties?.name ?? '',
          color:           s?.color ?? '#9ca3af',
          label:           s?.label ?? '',
          isFree:          s?.isFree ?? false,
          costForDuration: s?.costForDuration ?? -1,
          exceedsMaxStay:  s?.exceedsMaxStay ?? false,
        },
      }
    }),
  }

  const updatedStreets: FeatureCollection = {
    type: 'FeatureCollection',
    features: rawStreets.features.map(f => {
      const zoneId = f.properties?.zoneId as number
      const s = byId.get(zoneId as 1 | 2 | 3 | 4)
      return {
        ...f,
        properties: { ...f.properties, color: s?.color ?? '#9ca3af' },
      }
    }),
  }

  ;(map.getSource('zones')        as GeoJSONSource)?.setData(updatedZones)
  ;(map.getSource('zone-streets') as GeoJSONSource)?.setData(updatedStreets)
}

export function flyToUser(lng: number, lat: number): void {
  map.flyTo({ center: [lng, lat], zoom: 15 })
  new maplibregl.Marker({ color: '#3b82f6' }).setLngLat([lng, lat]).addTo(map)
}
