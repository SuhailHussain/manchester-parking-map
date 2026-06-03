import maplibregl, { GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import type { ZoneStatus } from './types'

const MANCHESTER_CENTER: [number, number] = [-2.2453, 53.4790]

const CPZ_BOUNDS: maplibregl.LngLatBoundsLike = [
  [-2.268, 53.469],
  [-2.219, 53.491],
]

let map: maplibregl.Map
let rawZones: FeatureCollection

// Returns only after fetch AND style load are both done — no race condition
export async function initMap(
  onZoneClick: (status: ZoneStatus, lngLat: maplibregl.LngLat) => void
): Promise<maplibregl.Map> {
  const res = await fetch('./data/zone-boundaries.geojson')
  rawZones = await res.json() as FeatureCollection

  map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: MANCHESTER_CENTER,
    zoom: 14,
    maxZoom: 18,
    minZoom: 12,
    maxBounds: CPZ_BOUNDS,
  })

  // Wait for style to fully load before resolving
  await new Promise<void>(resolve => map.once('load', resolve))

  map.addSource('zones', {
    type: 'geojson',
    data: rawZones,
  })

  map.addLayer({
    id: 'zone-fill',
    type: 'fill',
    source: 'zones',
    paint: {
      'fill-color': ['coalesce', ['get', 'color'], '#9ca3af'],
      'fill-opacity': 0.45,
    },
  })

  map.addLayer({
    id: 'zone-outline',
    type: 'line',
    source: 'zones',
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#6b7280'],
      'line-width': 2.5,
      'line-opacity': 1,
    },
  })

  map.on('click', 'zone-fill', (e) => {
    if (!e.features?.[0]) return
    onZoneClick(e.features[0].properties as ZoneStatus, e.lngLat)
  })

  map.on('mouseenter', 'zone-fill', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'zone-fill', () => { map.getCanvas().style.cursor = '' })

  return map
}

export function updateZoneColors(statuses: ZoneStatus[]): void {
  const byId = new globalThis.Map(statuses.map(s => [s.zoneId, s]))

  const updated: FeatureCollection = {
    type: 'FeatureCollection',
    features: rawZones.features.map(f => {
      const zoneId = f.properties?.zoneId as number
      const s = byId.get(zoneId as 1 | 2 | 3 | 4)
      return {
        ...f,
        properties: {
          zoneId,
          name: f.properties?.name ?? '',
          color: s?.color ?? '#9ca3af',
          label: s?.label ?? '',
          isFree: s?.isFree ?? false,
          // avoid null — MapLibre expression engine rejects null for typed properties
          costForDuration: s?.costForDuration ?? -1,
          exceedsMaxStay: s?.exceedsMaxStay ?? false,
        },
      }
    }),
  }

  const source = map.getSource('zones') as GeoJSONSource
  source?.setData(updated)
}

export function flyToUser(lng: number, lat: number): void {
  map.flyTo({ center: [lng, lat], zoom: 15 })
  new maplibregl.Marker({ color: '#3b82f6' }).setLngLat([lng, lat]).addTo(map)
}
