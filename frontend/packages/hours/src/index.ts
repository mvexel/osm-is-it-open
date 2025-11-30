import opening_hours, {
  type nominatim_object,
  type opening_hours as OpeningHoursLib,
} from 'opening_hours'
export { OpeningHoursBadge } from './components/OpeningHoursBadge'
export { OpeningHoursSchedule } from './components/OpeningHoursSchedule'

export type OpeningStatus = 'open' | 'closed' | 'unknown'

export interface DayRange {
  start: string
  end: string
  comment?: string
}

export interface DaySchedule {
  day: number // 0 = Sunday
  label: string
  ranges: DayRange[]
}

export interface FormatOptions {
  now?: Date
  locale?: string
  timeZone?: string
  twelveHourClock?: boolean
  coords?: [number, number]
  lookaheadDays?: number
  maxIntervals?: number
  startOfWeek?: number // 0 = Sunday
}

export interface FormattedOpeningHours {
  status: OpeningStatus
  label: string
  nextChange?: Date
  intervals: DaySchedule[]
  normalized?: string
  warnings?: string[]
}

const DEFAULT_LOOKAHEAD_DAYS = 7
const DEFAULT_MAX_INTERVALS = 50

export function formatOpeningHours(
  openingHours?: string | null,
  opts: FormatOptions = {},
): FormattedOpeningHours {
  if (!openingHours) {
    return {
      status: 'unknown',
      label: 'Hours unavailable',
      intervals: [],
    }
  }

  const now = opts.now ?? new Date()
  const locale = opts.locale ?? 'en'
  const lookaheadDays = opts.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS
  const maxIntervals = opts.maxIntervals ?? DEFAULT_MAX_INTERVALS
  const startOfWeek = normalizeStartOfWeek(opts.startOfWeek)

  const nominatim = buildNominatim(opts.coords)

  try {
    const oh = new opening_hours(openingHours, nominatim ?? undefined)
    const isUnknown = oh.getUnknown(now)
    const isOpen = oh.getState(now)
    const status: OpeningStatus = isUnknown ? 'unknown' : isOpen ? 'open' : 'closed'
    const nextChange = oh.getNextChange(now)
    const label = buildLabel(status, nextChange, { locale, timeZone: opts.timeZone, twelveHourClock: opts.twelveHourClock })

    const intervals = buildSchedule(oh, now, {
      locale,
      timeZone: opts.timeZone,
      twelveHourClock: opts.twelveHourClock,
      lookaheadDays,
      maxIntervals,
      startOfWeek,
    })

    const normalized = safePrettify(oh)
    const warnings = oh.getWarnings ? oh.getWarnings() : undefined

    return {
      status,
      label,
      nextChange: nextChange ?? undefined,
      intervals,
      normalized,
      warnings,
    }
  } catch (error) {
    return {
      status: 'unknown',
      label: 'Hours unavailable',
      intervals: [],
    }
  }
}

export function normalizeOpeningHours(openingHours?: string | null): string {
  if (!openingHours) return ''
  try {
    const oh = new opening_hours(openingHours)
    return safePrettify(oh) ?? openingHours.trim()
  } catch {
    return openingHours.trim()
  }
}

function buildNominatim(coords?: [number, number]): nominatim_object | null {
  if (!coords) return null
  const [lat, lon] = coords
  return {
    lat,
    lon,
    address: {
      country_code: '',
      state: '',
    },
  }
}

function formatTime(date: Date, locale: string, timeZone?: string, twelveHourClock?: boolean): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: twelveHourClock,
    timeZone,
  })
  return formatter.format(date)
}

function dayLabel(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone }).format(date)
}

function buildSchedule(
  oh: OpeningHoursLib,
  now: Date,
  opts: {
    locale: string
    timeZone?: string
    twelveHourClock?: boolean
    lookaheadDays: number
    maxIntervals: number
    startOfWeek: number
  },
): DaySchedule[] {
  const end = new Date(now.getTime() + opts.lookaheadDays * 24 * 60 * 60 * 1000)
  const intervals = oh.getOpenIntervals(now, end)
  const trimmed = intervals.slice(0, opts.maxIntervals)

  const schedule = new Map<number, DaySchedule>()

  for (const interval of trimmed) {
    const [start, endDate, , comment] = interval
    const day = start.getDay()
    const label = dayLabel(start, opts.locale, opts.timeZone)
    const range: DayRange = {
      start: formatTime(start, opts.locale, opts.timeZone, opts.twelveHourClock),
      end: formatTime(endDate, opts.locale, opts.timeZone, opts.twelveHourClock),
      comment: comment || undefined,
    }

    const entry = schedule.get(day) ?? { day, label, ranges: [] }
    entry.ranges.push(range)
    schedule.set(day, entry)
  }

  // Ensure all days appear, even when fully closed.
  for (let day = 0; day < 7; day++) {
    if (!schedule.has(day)) {
      const dateForLabel = nextDateForDay(now, day, opts.timeZone)
      schedule.set(day, {
        day,
        label: dayLabel(dateForLabel, opts.locale, opts.timeZone),
        ranges: [],
      })
    }
  }

  const ordered = Array.from(schedule.values()).sort((a, b) => a.day - b.day)
  return rotateDays(ordered, opts.startOfWeek)
}

function buildLabel(
  status: OpeningStatus,
  nextChange: Date | undefined,
  opts: { locale: string; timeZone?: string; twelveHourClock?: boolean },
): string {
  const nextLabel = nextChange
    ? formatTime(nextChange, opts.locale, opts.timeZone, opts.twelveHourClock)
    : null

  if (status === 'open') {
    return nextLabel ? `Open until ${nextLabel}` : 'Open now'
  }
  if (status === 'closed') {
    return nextLabel ? `Closed • opens ${nextLabel}` : 'Closed'
  }
  return 'Hours unavailable'
}

function safePrettify(oh: opening_hours): string | undefined {
  try {
    return oh.prettifyValue()
  } catch {
    return undefined
  }
}

function rotateDays(days: DaySchedule[], startOfWeek: number): DaySchedule[] {
  if (startOfWeek === 0) return days
  const idx = days.findIndex((d) => d.day === startOfWeek)
  if (idx === -1) return days
  return [...days.slice(idx), ...days.slice(0, idx)]
}

function nextDateForDay(base: Date, targetDay: number, timeZone?: string): Date {
  // Create date in target timezone if provided by adjusting via formatter
  const dayDiff = (targetDay - base.getDay() + 7) % 7
  const result = new Date(base.getTime() + dayDiff * 24 * 60 * 60 * 1000)
  if (!timeZone) return result

  // Adjust by formatting to the desired zone and parsing back
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(result)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return new Date(Date.UTC(year, month - 1, day, result.getUTCHours(), result.getUTCMinutes()))
}

function normalizeStartOfWeek(value?: number): number {
  if (value === undefined) return 1 // default Monday
  if (value < 0 || value > 6) return 1
  return Math.floor(value)
}
