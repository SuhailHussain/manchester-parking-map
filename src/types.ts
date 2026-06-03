export type ZoneId = 1 | 2 | 3 | 4

export interface TariffStep {
  maxMinutes: number
  cost: number
}

export interface ZoneTariff {
  zoneId: ZoneId
  name: string
  maxStayMinutes: number
  operatingStart: number  // 8 (hours)
  operatingEnd: number    // 20 (hours)
  weekendFlatRate?: number // Zone 4 only
  steps: TariffStep[]
}

export interface ParkingFilter {
  datetime: Date
  maxCost: number | null  // null = no limit
  durationMinutes: number
}

export type ZoneColor = '#22c55e' | '#f59e0b' | '#9ca3af'

export interface ZoneStatus {
  zoneId: ZoneId
  isFree: boolean
  costForDuration: number | null  // null = free
  exceedsMaxStay: boolean
  color: ZoneColor
  label: string
}
