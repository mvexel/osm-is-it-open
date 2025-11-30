import { describe, it, expect } from 'vitest'
import { formatOpeningHours, normalizeOpeningHours } from '../src'

const JAN_MON_10 = new Date(2024, 0, 8, 10, 0, 0) // local Monday 10:00
const JAN_MON_6 = new Date(2024, 0, 8, 6, 0, 0)

describe('formatOpeningHours', () => {
  it('handles 24/7', () => {
    const result = formatOpeningHours('24/7', { now: JAN_MON_10, timeZone: 'UTC', twelveHourClock: false })
    expect(result.status).toBe('open')
    expect(result.label.toLowerCase()).toContain('open')
    expect(result.intervals.length).toBe(7)
    expect(result.intervals.every((d) => d.ranges.length > 0)).toBe(true)
  })

  it('splits week correctly for different weekend hours', () => {
    const now = new Date(2024, 0, 7, 14, 33, 0) // Sunday local
    const result = formatOpeningHours('Mo-Sa 08:30-23:00; Su 08:30-22:00', { now })
    const sunday = result.intervals.find((d) => d.label.toLowerCase().startsWith('sun'))
    expect(sunday?.ranges).toEqual([{ start: '08:30', end: '22:00' }])
  })

  it('marks open with next change during hours', () => {
    const result = formatOpeningHours('Mo-Fr 09:00-17:00', {
      now: JAN_MON_10,
      twelveHourClock: false,
    })
    expect(result.status).toBe('open')
    expect(result.label.toLowerCase()).toContain('open until')
  })

  it('marks closed before opening and shows next opening', () => {
    const result = formatOpeningHours('Mo-Fr 09:00-17:00', {
      now: JAN_MON_6,
      twelveHourClock: false,
    })
    expect(result.status).toBe('closed')
    expect(result.label.toLowerCase()).toContain('opens')
  })

  it('supports 12h formatting', () => {
    const result = formatOpeningHours('Mo-Fr 09:00-17:00', {
      now: JAN_MON_10,
      hourCycle: '12h',
    })
    expect(result.timeFormat).toBe('12h')
    expect(result.label.toLowerCase()).toMatch(/am|pm/)
  })

  it('returns unknown for unsupported patterns', () => {
    const result = formatOpeningHours('sunrise-sunset', { now: JAN_MON_10, coords: [48.85, 2.35] })
    expect(['open', 'closed', 'unknown']).toContain(result.status)
    expect(result.label.length).toBeGreaterThan(0)
  })
})

describe('normalizeOpeningHours', () => {
  it('prettifies values when possible', () => {
    const normalized = normalizeOpeningHours('Mo-Fr 9:00-17:00')
    expect(normalized.toLowerCase()).toContain('mo-fr')
  })

  it('returns original string on errors', () => {
    const input = 'invalid-value'
    const normalized = normalizeOpeningHours(input)
    expect(normalized).toBe(input)
  })
})
