import { describe, expect, it } from 'vitest'
import { buildOpeningHoursString, normalizeOpeningHours, parseOpeningHoursModel } from '../src'

type TestDay = { day: number; ranges: { start: string; end: string }[] }

describe('buildOpeningHoursString', () => {
  it('groups consecutive days with the same ranges', () => {
    const days: TestDay[] = [
      { day: 1, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 2, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 3, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 4, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 5, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 6, ranges: [{ start: '10:00', end: '14:00' }] },
    ]

    expect(buildOpeningHoursString(days)).toBe('Mo-Fr 09:00-17:00; Sa 10:00-14:00; Su off')
  })

  it('returns 24/7 when every day is fully open', () => {
    const days: TestDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      ranges: [{ start: '00:00', end: '23:59' }],
    }))

    expect(buildOpeningHoursString(days)).toBe('24/7')
  })

  it('marks everything closed when no days are provided', () => {
    expect(buildOpeningHoursString([])).toBe('Mo-Su off')
  })

  it('parses a string back into the model', () => {
    const model = parseOpeningHoursModel('Mo-Fr 09:00-17:00; Sa 10:00-14:00')
    const monday = model.find((d) => d.day === 1)
    const sunday = model.find((d) => d.day === 0)

    expect(monday?.ranges[0]).toEqual({ start: '09:00', end: '17:00' })
    expect(sunday).toBeUndefined()
  })

  it('handles overnight ranges (OSM node 2333368648)', () => {
    const value = 'Mo-Tu off; We 17:00-24:00; Th-Sa 17:00-26:00; Su 11:00-25:00'
    const model = parseOpeningHoursModel(value)
    const pretty = normalizeOpeningHours(value)

    expect(model.length).toBeGreaterThan(0)
    expect(pretty).toContain('Th-Sa')
    expect(pretty).toContain('17:00')
  })
})
