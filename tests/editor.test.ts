import { describe, expect, it } from 'vitest'
import { opening_hours } from '../src'
import { buildOpeningHoursString, parseOpeningHoursModel } from '../src/model'
import type { OpeningHoursDay } from '../src/components/openingHoursTypes'

describe('buildOpeningHoursString', () => {
  it('groups consecutive days with the same ranges', () => {
    const days: OpeningHoursDay[] = [
      { day: 1, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 2, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 3, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 4, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 5, ranges: [{ start: '09:00', end: '17:00' }] },
      { day: 6, ranges: [{ start: '10:00', end: '14:00' }] },
    ]

    expect(buildOpeningHoursString({ days, modifiers: [] })).toBe('Mo-Fr 09:00-17:00; Sa 10:00-14:00; Su off')
  })

  it('returns 24/7 when every day is fully open', () => {
    const days: OpeningHoursDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      ranges: [{ start: '00:00', end: '23:59' }],
    }))

    expect(buildOpeningHoursString({ days, modifiers: [] })).toBe('24/7')
  })

  it('marks everything closed when no days are provided', () => {
    expect(buildOpeningHoursString({ days: [], modifiers: [] })).toBe('Mo-Su off')
  })

  it('parses a string back into the model', () => {
    const model = parseOpeningHoursModel('Mo-Fr 09:00-17:00; Sa 10:00-14:00')
    const monday = model.days.find((d) => d.day === 1)
    const sunday = model.days.find((d) => d.day === 0)

    expect(monday?.ranges[0]).toEqual({ start: '09:00', end: '17:00' })
    expect(sunday).toBeUndefined()
  })

  it('handles overnight ranges (OSM node 2333368648)', () => {
    const value = 'Mo-Tu off; We 17:00-24:00; Th-Sa 17:00-02:00; Su 11:00-01:00'
    const model = parseOpeningHoursModel(value)
    const pretty = new opening_hours(value).prettifyValue()

    expect(model.days.length).toBeGreaterThan(0)
    expect(pretty).toContain('Th-Sa')
    expect(pretty).toContain('17:00-02:00')
  })

  it('keeps overnight spans together across days in a week', () => {
    const value = 'Mo-Th 10:00-24:00; Fr-Sa 10:00-01:00; Su 10:00-24:00'
    const model = parseOpeningHoursModel(value)

    const friday = model.days.find((d) => d.day === 5)
    const saturday = model.days.find((d) => d.day === 6)
    const sunday = model.days.find((d) => d.day === 0)

    expect(friday?.ranges).toEqual([{ start: '10:00', end: '01:00' }])
    expect(saturday?.ranges).toEqual([{ start: '10:00', end: '01:00' }])
    expect(sunday?.ranges).toEqual([{ start: '10:00', end: '24:00' }])
  })

  it('captures spillover past Sunday night into Monday with extra lookahead', () => {
    const value = 'Su 18:00-02:00'
    const model = parseOpeningHoursModel(value)
    const sunday = model.days.find((d) => d.day === 0)

    expect(sunday?.ranges).toEqual([{ start: '18:00', end: '02:00' }])
  })

  it('handles holidays in the opening hours string', () => {
    const value = 'Mo-Fr 09:00-17:00; PH off'
    const model = parseOpeningHoursModel(value)
    const stringified = buildOpeningHoursString(model)
    const normalized = new opening_hours(value, { address: { country_code: 'us' } }).prettifyValue()

    const monday = model.days.find((d) => d.day === 1)
    expect(monday?.ranges).toEqual([{ start: '09:00', end: '17:00' }])
    expect(model.modifiers).toEqual(['PH off'])

    // The model-to-string function should now include the PH rule.
    expect(stringified).toContain('PH off')
    expect(stringified).toContain('Mo-Fr 09:00-17:00')

    // The normalizer should also preserve it.
    expect(normalized).toContain('PH off')
  })
})
