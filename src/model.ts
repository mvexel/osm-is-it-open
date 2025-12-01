import opening_hours from 'opening_hours'
import type { OpeningHoursDay, OpeningHoursModel, OpeningHoursRange } from './components/openingHoursTypes'

// Use a fixed anchor week (Mon Jan 1, 2024 UTC) to make parsing deterministic and
// include overnight spillovers at the end of the week.
const PARSE_ANCHOR = new Date(2024, 0, 1, 0, 0, 0, 0)
const PARSE_LOOKAHEAD_DAYS = 8 // capture the full week plus spill into next Monday
const MS_IN_DAY = 24 * 60 * 60 * 1000
const PARSE_CONTEXT = { address: { country_code: 'us' } }

export const DAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0] // Mo-Su

export const DAY_OSM_LABELS: Record<number, string> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
}

const DAY_LABEL_TO_NUMBER: Record<string, number> = {
  Su: 0,
  Sun: 0,
  Mo: 1,
  Mon: 1,
  Tu: 2,
  Tue: 2,
  We: 3,
  Wed: 3,
  Th: 4,
  Thu: 4,
  Fr: 5,
  Fri: 5,
  Sa: 6,
  Sat: 6,
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function normalizeTimeInput(value: string): string {
  const trimmed = value.trim()
  const match = trimmed.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i)
  if (!match) return ''

  let hour = Number(match[1])
  const minute = match[2]
  const suffix = match[3]?.toLowerCase()

  if (suffix === 'pm' && hour < 12) hour += 12
  if (suffix === 'am' && hour === 12) hour = 0
  if (!suffix && hour === 24 && minute === '00') return '24:00'
  hour = Math.min(Math.max(hour, 0), 23)

  return `${pad(hour)}:${minute}`
}

export function toMinutes(value: string): number | null {
  const [h, m] = value.split(':').map((n) => Number(n))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function normalizeRange(
  range: OpeningHoursRange,
): { normalized: OpeningHoursRange; startMinutes: number; sortEndMinutes: number } | null {
  const start = normalizeTimeInput(range.start)
  const end = normalizeTimeInput(range.end)
  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)

  if (!start || !end || startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return null
  }

  const spansMidnight = endMinutes < startMinutes
  const endLabel = spansMidnight && endMinutes === 0 ? '24:00' : end

  return {
    normalized: { start, end: endLabel },
    startMinutes,
    sortEndMinutes: spansMidnight ? endMinutes + 24 * 60 : endMinutes,
  }
}

export function sanitizeRanges(ranges: OpeningHoursRange[]): OpeningHoursRange[] {
  const normalized = ranges
    .map(normalizeRange)
    .filter(
      (range): range is { normalized: OpeningHoursRange; startMinutes: number; sortEndMinutes: number } => !!range,
    )
    .sort((a, b) => a.startMinutes - b.startMinutes || a.sortEndMinutes - b.sortEndMinutes)
    .map((range) => range.normalized)

  const deduped: OpeningHoursRange[] = []
  for (const range of normalized) {
    const last = deduped[deduped.length - 1]
    if (!last || last.start !== range.start || last.end !== range.end) {
      deduped.push(range)
    }
  }
  return deduped
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daySpan(start: Date, end: Date): number {
  return Math.floor((startOfDay(end).getTime() - startOfDay(start).getTime()) / MS_IN_DAY)
}

function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function buildRangeFromInterval(start: Date, end: Date): OpeningHoursRange {
  const span = daySpan(start, end)
  const startLabel = formatClock(start)
  const endLabel =
    span === 1 && end.getHours() === 0 && end.getMinutes() === 0 ? '24:00' : formatClock(end)

  return {
    start: startLabel,
    end: endLabel,
  }
}

function expandDays(expr: string): number[] {
  const days: number[] = []
  const parts = expr.split(',').map((p) => p.trim())
  for (const part of parts) {
    if (!part) continue
    if (part.includes('-')) {
      const [startLabel, endLabel] = part.split('-').map((p) => p.trim())
      const startDay = DAY_LABEL_TO_NUMBER[startLabel]
      const endDay = DAY_LABEL_TO_NUMBER[endLabel]
      if (startDay === undefined || endDay === undefined) continue
      let current = startDay
      while (true) {
        days.push(current)
        if (current === endDay) break
        current = (current + 1) % 7
      }
    } else {
      const day = DAY_LABEL_TO_NUMBER[part]
      if (day !== undefined) days.push(day)
    }
  }
  return days
}

function parseNormalizedString(normalized: string): OpeningHoursModel {
  const entries = new Map<number, OpeningHoursRange[]>()
  const modifiers: string[] = []
  const segments = normalized.split(';').map((s) => s.trim()).filter(Boolean)

  for (const segment of segments) {
    const [dayExpr, ...timesExprParts] = segment.split(/\s+/)
    const timesExprRaw = timesExprParts.join(' ')
    if (!dayExpr) continue

    const days = expandDays(dayExpr)
    if (days.length === 0) {
      modifiers.push(segment)
      continue
    }

    if (!timesExprRaw) {
      modifiers.push(segment)
      continue
    }

    const timesExpr = timesExprRaw.trim()
    if (/^off$/i.test(timesExpr)) {
      days.forEach((day) => entries.set(day, entries.get(day) ?? []))
      continue
    }

    const timeRanges = timesExpr.split(',').map((r) => r.trim()).filter(Boolean)
    for (const rangeExpr of timeRanges) {
      const [startRaw, endRaw] = rangeExpr.split('-').map((v) => v?.trim() ?? '')
      const start = normalizeTimeInput(startRaw)
      const end = normalizeTimeInput(endRaw)
      if (!start || !end) continue
      for (const day of days) {
        const list = entries.get(day) ?? []
        list.push({ start, end })
        entries.set(day, list)
      }
    }
  }

  const dayModel = DAY_ORDER.filter((day) => entries.has(day)).map((day) => ({
    day,
    ranges: sanitizeRanges(entries.get(day) ?? []),
  }))

  return {
    days: sortDays(dayModel),
    modifiers,
  }
}

function rangesEqual(a: OpeningHoursRange[], b: OpeningHoursRange[]): boolean {
  if (a.length !== b.length) return false
  return a.every((range, idx) => range.start === b[idx].start && range.end === b[idx].end)
}

function sortDays(days: OpeningHoursDay[]): OpeningHoursDay[] {
  const order = new Map(DAY_ORDER.map((day, idx) => [day, idx]))
  return [...days].sort((a, b) => (order.get(a.day)! - order.get(b.day)!))
}

function buildDayRangeLabel(startIdx: number, endIdx: number): string {
  const startDay = DAY_OSM_LABELS[DAY_ORDER[startIdx]]
  const endDay = DAY_OSM_LABELS[DAY_ORDER[endIdx]]
  return startIdx === endIdx ? startDay : `${startDay}-${endDay}`
}

export function buildOpeningHoursString(model: OpeningHoursModel): string {
  const days = sortDays(model.days)
  const cleaned = days.map((day) => ({
    day: day.day,
    ranges: sanitizeRanges(day.ranges),
  }))
  const map = new Map<number, OpeningHoursRange[]>()
  cleaned.forEach((day) => {
    if (day.ranges.length > 0) map.set(day.day, day.ranges)
  })

  const fullWeek = DAY_ORDER.map((day) => ({
    day,
    ranges: map.get(day) ?? [],
  }))

  const allOpen = fullWeek.every(
    (day) => day.ranges.length === 1 && day.ranges[0].start === '00:00' && day.ranges[0].end === '23:59',
  )
  if (allOpen && model.modifiers.length === 0) return '24/7'

  const segments: string[] = []
  let idx = 0
  while (idx < fullWeek.length) {
    const startIdx = idx
    let endIdx = idx
    while (endIdx + 1 < fullWeek.length && rangesEqual(fullWeek[startIdx].ranges, fullWeek[endIdx + 1].ranges)) {
      endIdx++
    }
    const hours =
      fullWeek[startIdx].ranges.length === 0
        ? 'off'
        : fullWeek[startIdx].ranges.map((range) => `${range.start}-${range.end}`).join(', ')
    segments.push(`${buildDayRangeLabel(startIdx, endIdx)} ${hours}`)
    idx = endIdx + 1
  }

  const daySegments = segments.join('; ')
  const modifierSegments = model.modifiers.join('; ')

  return [daySegments, modifierSegments].filter(Boolean).join('; ')
}

export function parseOpeningHoursModel(value?: string | null): OpeningHoursModel {
  const emptyModel = { days: [], modifiers: [] }
  if (!value) return emptyModel

  try {
    const oh = new opening_hours(value, PARSE_CONTEXT)
    const normalized = (() => {
      try {
        return oh.prettifyValue() || value
      } catch {
        return value
      }
    })().trim()

    if (normalized === '24/7') {
      return {
        days: DAY_ORDER.map((day) => ({
          day,
          ranges: [{ start: '00:00', end: '23:59' }],
        })),
        modifiers: [],
      }
    }

    const fromNormalized = parseNormalizedString(normalized)
    if (fromNormalized.days.length > 0 || fromNormalized.modifiers.length > 0) {
      return fromNormalized
    }

    // Fallback to library intervals if manual parsing fails.
    const entries = new Map<number, OpeningHoursRange[]>()
    const windowStart = PARSE_ANCHOR
    const windowEnd = new Date(windowStart.getTime() + PARSE_LOOKAHEAD_DAYS * MS_IN_DAY)

    for (const [start, end] of oh.getOpenIntervals(windowStart, windowEnd)) {
      const day = start.getDay()
      const range = buildRangeFromInterval(start, end)
      const existing = entries.get(day) ?? []
      existing.push(range)
      entries.set(day, existing)
    }

    const dayModel = DAY_ORDER.filter((day) => entries.has(day)).map((day) => ({
      day,
      ranges: sanitizeRanges(entries.get(day) ?? []),
    }))

    return {
      days: sortDays(dayModel),
      modifiers: [], // Fallback doesn't support modifiers.
    }
  } catch {
    return emptyModel
  }
}
