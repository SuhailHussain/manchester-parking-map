import './style.css'
import { initMap, updateZoneColors } from './map'
import { initFilterPanel } from './ui/filterPanel'
import { initGeolocation } from './ui/geolocation'
import { showZonePopup } from './ui/infoPopup'
import { getAllZoneStatuses } from './zones/zones'
import type { ParkingFilter, ZoneStatus } from './types'
import type maplibregl from 'maplibre-gl'

let currentMap: maplibregl.Map

function applyFilters(filter: ParkingFilter): void {
  updateZoneColors(getAllZoneStatuses(filter))
}

function handleZoneClick(status: ZoneStatus, lngLat: maplibregl.LngLat, streetName?: string): void {
  showZonePopup(status, lngLat, currentMap, streetName)
}

async function main() {
  currentMap = await initMap(handleZoneClick)
  initFilterPanel(applyFilters)
  initGeolocation()
}

main()
