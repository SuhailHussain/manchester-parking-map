import { describe, it, expect } from 'vitest'
import { isRestricted, getCost, getZoneStatus } from './zones'

const d = (iso: string) => new Date(iso)

describe('isRestricted', () => {
  it('is free before 8am on a weekday', () => {
    expect(isRestricted(1, d('2026-05-26T07:59:00'))).toBe(false)
  })
  it('is restricted at 8am on a weekday', () => {
    expect(isRestricted(1, d('2026-05-26T08:00:00'))).toBe(true)
  })
  it('is restricted at 19:59 on a weekday', () => {
    expect(isRestricted(1, d('2026-05-26T19:59:00'))).toBe(true)
  })
  it('is free at exactly 20:00', () => {
    expect(isRestricted(1, d('2026-05-26T20:00:00'))).toBe(false)
  })
  it('is free on a bank holiday during operating hours', () => {
    // 2026-12-25 = Christmas Day
    expect(isRestricted(1, d('2026-12-25T10:00:00'))).toBe(false)
  })
})

describe('getCost', () => {
  it('returns null outside operating hours', () => {
    expect(getCost(1, 60, d('2026-05-26T07:00:00'))).toBeNull()
  })
  it('Zone 1: 30min = £2', () => {
    expect(getCost(1, 30, d('2026-05-26T10:00:00'))).toBe(2)
  })
  it('Zone 1: 31min rounds up to 1hr step = £4', () => {
    expect(getCost(1, 31, d('2026-05-26T10:00:00'))).toBe(4)
  })
  it('Zone 1: 120min = £7', () => {
    expect(getCost(1, 120, d('2026-05-26T10:00:00'))).toBe(7)
  })
  it('Zone 1: 121min exceeds max stay = Infinity', () => {
    expect(getCost(1, 121, d('2026-05-26T10:00:00'))).toBe(Infinity)
  })
  it('Zone 3: 180min = £5', () => {
    expect(getCost(3, 180, d('2026-05-26T10:00:00'))).toBe(5)
  })
  it('Zone 4: weekday 10hr = £9', () => {
    expect(getCost(4, 600, d('2026-05-26T10:00:00'))).toBe(9)  // Tuesday
  })
  it('Zone 4: weekend flat rate = £10', () => {
    expect(getCost(4, 30, d('2026-05-23T10:00:00'))).toBe(10)  // Saturday
  })
  it('Zone 4: Sunday flat rate = £10', () => {
    expect(getCost(4, 30, d('2026-05-24T10:00:00'))).toBe(10)  // Sunday
  })
})

describe('getZoneStatus', () => {
  it('is green and free outside operating hours', () => {
    const status = getZoneStatus(1, { datetime: d('2026-05-26T07:00:00'), maxCost: null, durationMinutes: 60 })
    expect(status.isFree).toBe(true)
    expect(status.color).toBe('#22c55e')
  })
  it('is amber when within budget', () => {
    const status = getZoneStatus(1, { datetime: d('2026-05-26T10:00:00'), maxCost: 5, durationMinutes: 60 })
    expect(status.color).toBe('#f59e0b')
    expect(status.costForDuration).toBe(4)
  })
  it('is grey when over budget', () => {
    const status = getZoneStatus(1, { datetime: d('2026-05-26T10:00:00'), maxCost: 2, durationMinutes: 60 })
    expect(status.color).toBe('#9ca3af')
  })
  it('is grey when duration exceeds max stay', () => {
    const status = getZoneStatus(1, { datetime: d('2026-05-26T10:00:00'), maxCost: null, durationMinutes: 180 })
    expect(status.exceedsMaxStay).toBe(true)
    expect(status.color).toBe('#9ca3af')
  })
})
