import type { ZoneTariff } from '../types'

// England & Wales bank holidays 2025–2027
export const BANK_HOLIDAYS = new Set([
  '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-05',
  '2025-05-26', '2025-08-25', '2025-12-25', '2025-12-26',
  '2026-01-01', '2026-04-03', '2026-04-06', '2026-05-04',
  '2026-05-25', '2026-08-31', '2026-12-25', '2026-12-28',
  '2027-01-01', '2027-03-26', '2027-03-29', '2027-05-03',
  '2027-05-31', '2027-08-30', '2027-12-27', '2027-12-28',
])

// All zones: Mon–Sun 08:00–20:00. Free outside these hours and on bank holidays.
// Source: https://www.manchester.gov.uk/parking/city-centre-parking/pay-and-display-parking-bays
export const ZONE_TARIFFS: Record<number, ZoneTariff> = {
  1: {
    zoneId: 1,
    name: 'Zone 1',
    maxStayMinutes: 120,
    operatingStart: 8,
    operatingEnd: 20,
    steps: [
      { maxMinutes: 30,  cost: 2.00 },
      { maxMinutes: 60,  cost: 4.00 },
      { maxMinutes: 90,  cost: 5.50 },
      { maxMinutes: 120, cost: 7.00 },
    ],
  },
  2: {
    zoneId: 2,
    name: 'Zone 2',
    maxStayMinutes: 120,
    operatingStart: 8,
    operatingEnd: 20,
    steps: [
      { maxMinutes: 30,  cost: 2.00 },
      { maxMinutes: 60,  cost: 4.00 },
      { maxMinutes: 90,  cost: 5.50 },
      { maxMinutes: 120, cost: 7.00 },
    ],
  },
  3: {
    zoneId: 3,
    name: 'Zone 3',
    maxStayMinutes: 180,
    operatingStart: 8,
    operatingEnd: 20,
    steps: [
      { maxMinutes: 30,  cost: 1.00 },
      { maxMinutes: 60,  cost: 2.00 },
      { maxMinutes: 90,  cost: 3.00 },
      { maxMinutes: 120, cost: 3.50 },
      { maxMinutes: 150, cost: 4.00 },
      { maxMinutes: 180, cost: 5.00 },
    ],
  },
  4: {
    zoneId: 4,
    name: 'Zone 4',
    maxStayMinutes: 600,
    operatingStart: 8,
    operatingEnd: 20,
    weekendFlatRate: 10.00,
    steps: [
      { maxMinutes: 30,  cost: 1.00 },
      { maxMinutes: 60,  cost: 2.00 },
      { maxMinutes: 180, cost: 4.00 },
      { maxMinutes: 360, cost: 6.50 },
      { maxMinutes: 600, cost: 9.00 },
    ],
  },
}
