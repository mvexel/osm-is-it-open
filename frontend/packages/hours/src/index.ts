import opening_hours, {
  type nominatim_object,
  type opening_hours as OpeningHoursLib,
} from 'opening_hours'
export { OpeningHoursBadge, OpeningHoursEditor } from './components/OpeningHoursBadge'
export { OpeningHoursSchedule } from './components/OpeningHoursSchedule'
export {
  buildOpeningHoursString,
  parseOpeningHoursModel,
  type OpeningHoursDay,
  type OpeningHoursModel,
  type OpeningHoursRange,
} from './components/OpeningHoursBadge'

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
  hourCycle?: '12h' | '24h'
  coords?: [number, number]
  countryCode?: string
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
  timeFormat?: '12h' | '24h'
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
  const countryCode = opts.countryCode?.toLowerCase()
  const hourCycle: '12h' | '24h' = opts.hourCycle
    ? opts.hourCycle
    : opts.twelveHourClock
      ? '12h'
      : '24h'

  const nominatim = buildNominatim(opts.coords, countryCode)

  try {
    const oh = new opening_hours(openingHours, nominatim ?? undefined)
    const isUnknown = oh.getUnknown(now)
    const isOpen = oh.getState(now)
    const status: OpeningStatus = isUnknown ? 'unknown' : isOpen ? 'open' : 'closed'
    const nextChange = oh.getNextChange(now)
    const label = buildLabel(status, nextChange, {
      locale,
      timeZone: opts.timeZone,
      hourCycle,
      baseDate: now,
    })

    const intervals = buildSchedule(oh, now, {
      locale,
      timeZone: opts.timeZone,
      hourCycle,
      lookaheadDays,
      maxIntervals,
      startOfWeek,
    })

    const normalizedIntervals =
      status === 'open' && isAlwaysOpen(oh, now) && intervals.every((d) => d.ranges.length === 0)
        ? buildAlwaysOpenSchedule(now, { locale, timeZone: opts.timeZone, hourCycle, startOfWeek })
        : intervals

    const normalized = safePrettify(oh)
    const warnings = oh.getWarnings ? oh.getWarnings() : undefined

    return {
      status,
      label,
      nextChange: nextChange ?? undefined,
      intervals: normalizedIntervals,
      normalized,
      warnings,
      timeFormat: hourCycle,
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

function buildNominatim(coords?: [number, number], countryCode?: string): nominatim_object | null {
  if (!coords) return null
  const [lat, lon] = coords
  return {
    lat,
    lon,
    address: {
      country_code: countryCode ?? '',
      state: '',
    },
  }
}

function formatTime(
  date: Date,
  locale: string,
  timeZone?: string,
  hourCycle: '12h' | '24h' = '24h',
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: hourCycle === '12h',
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
    hourCycle: '12h' | '24h'
    lookaheadDays: number
    maxIntervals: number
    startOfWeek: number
  },
): DaySchedule[] {
  const windowStart = startOfDay(now, opts.timeZone)
  const end = new Date(windowStart.getTime() + opts.lookaheadDays * 24 * 60 * 60 * 1000)
  const intervals = oh.getOpenIntervals(windowStart, end)
  const trimmed = intervals.slice(0, opts.maxIntervals)

  const schedule = new Map<number, DaySchedule>()

  for (const interval of trimmed) {
    const [startRaw, endRaw, , comment] = interval
    let cursor = startRaw
    const endDate = endRaw
    while (cursor < endDate) {
      const dayStart = new Date(cursor)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const rangeStart = cursor
      const rangeEnd = endDate < dayEnd ? endDate : dayEnd

      if (rangeStart < rangeEnd) {
        const day = dayStart.getDay()
        const label = dayLabel(dayStart, opts.locale, opts.timeZone)
        const range: DayRange = {
          start: formatTime(rangeStart, opts.locale, opts.timeZone, opts.hourCycle),
          end: formatTime(rangeEnd, opts.locale, opts.timeZone, opts.hourCycle),
          comment: comment || undefined,
        }

        const entry = schedule.get(day) ?? { day, label, ranges: [] }
        entry.ranges.push(range)
        schedule.set(day, entry)
      }

      // move to next day boundary
      if (dayEnd.getTime() === cursor.getTime()) break
      cursor = dayEnd
    }
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
  opts: { locale: string; timeZone?: string; hourCycle: '12h' | '24h'; baseDate: Date },
): string {
  const nextLabel = nextChange ? formatTime(nextChange, opts.locale, opts.timeZone, opts.hourCycle) : null
  const needsDay =
    nextChange &&
    nextChange.toLocaleDateString('en-CA', { timeZone: opts.timeZone }) !==
      opts.baseDate.toLocaleDateString('en-CA', { timeZone: opts.timeZone })
  const dayLabel = nextChange
    ? new Intl.DateTimeFormat(opts.locale, { weekday: 'short', timeZone: opts.timeZone }).format(nextChange)
    : null
  const withDay = needsDay && nextLabel ? `${dayLabel} ${nextLabel}` : nextLabel

  if (status === 'open') {
    return withDay ? `Open until ${withDay}` : 'Open now'
  }
  if (status === 'closed') {
    return withDay ? `Closed • opens ${withDay}` : 'Closed'
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

function isAlwaysOpen(oh: opening_hours, now: Date): boolean {
  try {
    const state = oh.getState(now)
    const next = oh.getNextChange(now)
    return state === true && !next
  } catch {
    return false
  }
}

function buildAlwaysOpenSchedule(
  now: Date,
  opts: { locale: string; timeZone?: string; hourCycle: '12h' | '24h'; startOfWeek: number },
): DaySchedule[] {
  const schedule: DaySchedule[] = []
  for (let day = 0; day < 7; day++) {
    const dateForLabel = nextDateForDay(now, day, opts.timeZone)
    const start = new Date(dateForLabel)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    schedule.push({
      day,
      label: dayLabel(dateForLabel, opts.locale, opts.timeZone),
      ranges: [
        {
          start: formatTime(start, opts.locale, opts.timeZone, opts.hourCycle),
          end: formatTime(end, opts.locale, opts.timeZone, opts.hourCycle),
        },
      ],
    })
  }
  return rotateDays(schedule, opts.startOfWeek)
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

function startOfDay(date: Date, timeZone?: string): Date {
  if (!timeZone) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}
