import type { ZoneId, ZoneStatus, ParkingFilter } from '../types'
import { ZONE_TARIFFS, BANK_HOLIDAYS } from './zoneDefinitions'

function isBankHoliday(dt: Date): boolean {
  const iso = dt.toISOString().slice(0, 10)
  return BANK_HOLIDAYS.has(iso)
}

export function isRestricted(zoneId: ZoneId, dt: Date): boolean {
  if (isBankHoliday(dt)) return false
  const tariff = ZONE_TARIFFS[zoneId]
  const hours = dt.getHours() + dt.getMinutes() / 60
  return hours >= tariff.operatingStart && hours < tariff.operatingEnd
}

// Returns null if free, a cost in £ if restricted, or Infinity if duration exceeds max stay.
export function getCost(zoneId: ZoneId, durationMinutes: number, dt: Date): number | null {
  if (!isRestricted(zoneId, dt)) return null

  const tariff = ZONE_TARIFFS[zoneId]

  if (durationMinutes > tariff.maxStayMinutes) return Infinity

  // Zone 4 weekend flat rate
  const dayOfWeek = dt.getDay() // 0=Sun, 6=Sat
  if (tariff.weekendFlatRate !== undefined && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return tariff.weekendFlatRate
  }

  const step = tariff.steps.find(s => durationMinutes <= s.maxMinutes)
  return step ? step.cost : Infinity
}

export function getZoneStatus(zoneId: ZoneId, filter: ParkingFilter): ZoneStatus {
  const cost = getCost(zoneId, filter.durationMinutes, filter.datetime)
  const tariff = ZONE_TARIFFS[zoneId]

  const isFree = cost === null
  const exceedsMaxStay = cost === Infinity

  const overBudget = !isFree && !exceedsMaxStay && filter.maxCost !== null && cost! > filter.maxCost

  let color: ZoneStatus['color']
  let label: string

  if (isFree) {
    color = '#22c55e'
    const hours = filter.datetime.getHours()
    if (hours < tariff.operatingStart) {
      label = `Free — paid parking starts at ${tariff.operatingStart}:00`
    } else {
      label = `Free — paid parking ended at ${tariff.operatingEnd}:00`
    }
  } else if (exceedsMaxStay) {
    color = '#9ca3af'
    label = `Max stay ${tariff.maxStayMinutes / 60}hr — duration too long`
  } else if (overBudget) {
    color = '#9ca3af'
    label = `£${cost!.toFixed(2)} — over your budget`
  } else {
    color = '#f59e0b'
    const costStr = `£${cost!.toFixed(2)}`
    const durStr = filter.durationMinutes >= 60
      ? `${filter.durationMinutes / 60}hr`
      : `${filter.durationMinutes}min`
    label = `${costStr} for ${durStr} — free after ${tariff.operatingEnd}:00`
  }

  return {
    zoneId,
    isFree,
    costForDuration: isFree ? null : exceedsMaxStay ? null : cost!,
    exceedsMaxStay,
    color,
    label,
  }
}

export function getAllZoneStatuses(filter: ParkingFilter): ZoneStatus[] {
  return ([1, 2, 3, 4] as ZoneId[]).map(id => getZoneStatus(id, filter))
}
