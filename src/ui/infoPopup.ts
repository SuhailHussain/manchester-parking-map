import maplibregl from 'maplibre-gl'
import type { ZoneStatus } from '../types'
import { ZONE_TARIFFS } from '../zones/zoneDefinitions'

let currentPopup: maplibregl.Popup | null = null

export function showZonePopup(status: ZoneStatus, lngLat: maplibregl.LngLat, map: maplibregl.Map): void {
  if (currentPopup) currentPopup.remove()

  const tariff = ZONE_TARIFFS[status.zoneId]
  const stepsHtml = status.isFree
    ? ''
    : tariff.steps.map(s => {
        const dur = s.maxMinutes >= 60 ? `${s.maxMinutes / 60}hr` : `${s.maxMinutes}min`
        return `<tr><td>${dur}</td><td>£${s.cost.toFixed(2)}</td></tr>`
      }).join('')

  const tariffsTable = status.isFree
    ? ''
    : `<table class="popup-table"><thead><tr><th>Stay</th><th>Cost</th></tr></thead><tbody>${stepsHtml}</tbody></table>`

  const cost = (status.costForDuration as unknown as number) > 0 ? status.costForDuration : null
  const statusBadge = `<span class="popup-badge" style="background:${status.color}">${status.isFree ? 'FREE' : status.exceedsMaxStay ? 'TOO LONG' : cost != null ? `£${cost.toFixed(2)}` : 'PAID'}</span>`

  const html = `
    <div class="popup-inner">
      <div class="popup-header">
        ${statusBadge}
        <strong>${tariff.name}</strong>
      </div>
      <p class="popup-label">${status.label}</p>
      ${tariffsTable}
      <p class="popup-hint">Max stay: ${tariff.maxStayMinutes / 60}hr &middot; Mon–Sun 08:00–20:00</p>
    </div>
  `

  currentPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
    .setLngLat(lngLat)
    .setHTML(html)
    .addTo(map)
}
