import type { nominatim_object } from 'opening_hours'
import opening_hours from 'opening_hours'
import type { OpeningHoursDay, OpeningHoursModel, OpeningHoursRange } from './components/openingHoursTypes'
import { daySpan } from './utils/date'


/**
 * Deterministic anchor week used for library interval queries.
 *
 * Parsing/open-interval queries use this fixed week so parsing is stable in tests
 * and to capture ranges that spill into the following Monday.
 */
const PARSE_ANCHOR = new Date(2024, 0, 1, 0, 0, 0, 0)
const PARSE_LOOKAHEAD_DAYS = 8 // capture the full week plus spill into next Monday
const MS_IN_DAY = 24 * 60 * 60 * 1000
const PARSE_CONTEXT: nominatim_object = {
  lat: 0,
  lon: 0,
  address: { country_code: 'us', state: '' },
}

/**
 * Order of days for display and processing (Monday first, Sunday last).
 * Maps to JavaScript Date.getDay() values: Mo (1) to Su (0).
 */
export const DAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0] // Mo-Su

/** Maps day number (0-6) to OSM two-letter day abbreviation. */
export const DAY_OSM_LABELS: Record<number, string> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
}

/** Maps day label (short or long form) to day number (0-6). */
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

/**
 * Normalize a time input string into "HH:MM" 24-hour format.
 *
 * - Accepts various user input formats (e.g., "9", "9am", "09:30", "14:5", "2:30 pm").
 * - Clamps hours to 0-23 and minutes to 0-59.
 * - Interprets "12am" as "00:00" and "12pm" as "12:00".
 * - Returns "24:00" only for exact midnight input without am/pm.
 * - Returns empty string for unparseable inputs.
 *
 * @param value user input time string
 * @returns normalized "HH:MM" string or empty string if invalid
 */
export function normalizeTimeInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const suffixMatch = trimmed.match(/\s*(am|pm)$/i)
  const suffix = suffixMatch ? suffixMatch[1].toLowerCase() : null
  const numericPart = suffixMatch ? trimmed.slice(0, suffixMatch.index).trim() : trimmed
  if (!numericPart) return ''

  let hourDigits: string
  let minuteDigits: string

  if (numericPart.includes(':')) {
    const [hourRaw, minuteRaw = ''] = numericPart.split(':')
    hourDigits = hourRaw.replace(/\D/g, '').slice(0, 2)
    minuteDigits = minuteRaw.replace(/\D/g, '').slice(0, 2)
    if (!hourDigits) return ''
    if (minuteDigits.length === 1) minuteDigits = `${minuteDigits}0`
    if (minuteDigits.length === 0) minuteDigits = '00'
  } else {
    let digits = numericPart.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (digits.length > 4) digits = digits.slice(0, 4)
    if (digits.length <= 2) {
      hourDigits = digits
      minuteDigits = '00'
    } else {
      hourDigits = digits.slice(0, digits.length - 2)
      minuteDigits = digits.slice(-2)
    }
  }

  let hour = Number(hourDigits)
  if (Number.isNaN(hour)) return ''

  let minute = Number(minuteDigits)
  if (Number.isNaN(minute)) minute = 0
  minute = Math.min(Math.max(minute, 0), 59)

  if (suffix === 'pm' && hour < 12) hour += 12
  if (suffix === 'am' && hour === 12) hour = 0

  if (!suffix && hour === 24 && minute === 0) {
    return '24:00'
  }

  hour = Math.min(Math.max(hour, 0), 23)

  return `${pad(hour)}:${pad(minute)}`
}

/**
 * Convert a "HH:MM" time string to total minutes.
 * 
 * @param value "HH:MM" formatted time string
 * @returns number of minutes since midnight, or null if invalid
 */
export function toMinutes(value: string): number | null {
  const [h, m] = value.split(':').map((n) => Number(n))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/**
 * Normalize and validate a single opening hours range.
 *
 * - Normalizes start and end times using normalizeTimeInput.
 * - Validates that start < end after normalization.
 *
 * @param range raw opening hours range with start and end times
 * @returns normalized range with minute values, or null if invalid
 */
export function normalizeRange(
  range: OpeningHoursRange,
): { normalized: OpeningHoursRange; startMinutes: number; sortEndMinutes: number } | null {
  const start = normalizeTimeInput(range.start)
  const end = normalizeTimeInput(range.end)
  const startMinutes = toMinutes(start)
  const endMinutes = toMinutes(end)

  if (!start || !end || startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    return null
  }

  return {
    normalized: { start, end },
    startMinutes,
    sortEndMinutes: endMinutes,
  }
}
/**
 * Normalize a set of ranges:
 * - Removes invalid ranges.
 * - Sorts by start then end time.
 * - Deduplicates adjacent identical ranges.
 *
 * Returns an array of valid, normalized "HH:MM" ranges (end may be "24:00").
 */
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

/** Formats a Date as "HH:MM" string. */
function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Build a day range object from two Date intervals.
 *
 * - Formats start as "HH:MM".
 * - Converts end-of-day exact-midnight spans (end is next day at 00:00) to "24:00".
 */
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

/**
 * Expand OSM weekday expressions like "Mo-Fr,Su" or "Mon-Wed" into numeric day indexes.
 *
 * Accepts both short and long labels (Su|Sun, Mo|Mon, ...).
 *
 * @param expr comma-separated day expression (e.g., "Mo-Fr,Su")
 * @returns array of day numbers (0-6) in numerical order
 */
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

/**
 * Parse a normalized "prettified" opening_hours string into the internal model.
 *
 * - Splits segments by `;`.
 * - Extracts day ranges, time ranges and collects unmatched segments as modifiers.
 *
 * @param normalized prettified opening_hours string
 * @returns OpeningHoursModel with days and modifiers
 */
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

  const dayModel = DAY_ORDER.filter((day) => entries.has(day))
    .map((day) => ({
      day,
      ranges: sanitizeRanges(entries.get(day) ?? []),
    }))
    .filter((day) => day.ranges.length > 0)

  return {
    days: sortDays(dayModel),
    modifiers,
  }
}

/** Tests if two range arrays are structurally equal. */
function rangesEqual(a: OpeningHoursRange[], b: OpeningHoursRange[]): boolean {
  if (a.length !== b.length) return false
  return a.every((range, idx) => range.start === b[idx].start && range.end === b[idx].end)
}

/** Sorts days according to DAY_ORDER (Monday-first). */
function sortDays(days: OpeningHoursDay[]): OpeningHoursDay[] {
  const order = new Map(DAY_ORDER.map((day, idx) => [day, idx]))
  return [...days].sort((a, b) => (order.get(a.day)! - order.get(b.day)!))
}

/** Formats day range label for OSM (e.g., "Mo", "Mo-Fr"). */
function buildDayRangeLabel(startIdx: number, endIdx: number): string {
  const startDay = DAY_OSM_LABELS[DAY_ORDER[startIdx]]
  const endDay = DAY_OSM_LABELS[DAY_ORDER[endIdx]]
  return startIdx === endIdx ? startDay : `${startDay}-${endDay}`
}

/**
 * Build a prettified opening_hours string from the internal model.
 * 
 * - Groups consecutive days with identical hours.
 * - Represents full-week 24/7 openings as '24/7'.
 * - Omits days with no opening hours.
 * - Appends any modifiers at the end.
 *
 * @param model internal OpeningHoursModel
 * @returns prettified opening_hours string
 */
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

/**
 * Parse an opening_hours source string into the editor's internal model.
 *
 * - Returns an OpeningHoursModel suitable for the UI.
 * - Normalizes end-time '00:00' to '24:00' for internal representation.
 * - Recovers gracefully from empty/invalid input (no throw).
 *
 * @param source prettified opening_hours string (may be empty)
 * @returns OpeningHoursModel ready for editing
 */
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

    const dayModel = DAY_ORDER.filter((day) => entries.has(day))
      .map((day) => ({
        day,
        ranges: sanitizeRanges(entries.get(day) ?? []),
      }))
      .filter((day) => day.ranges.length > 0)

    return {
      days: sortDays(dayModel),
      modifiers: [], // Fallback doesn't support modifiers.
    }
  } catch {
    return emptyModel
  }
}
