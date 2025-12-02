import { useMemo } from 'react'
import opening_hours from 'opening_hours'
import type { OpeningHoursScheduleProps } from './types'
import '../styles.css'
import { startOfDay } from '../utils/date'

interface DayRange {
  start: string
  end: string
  comment?: string
}

interface DaySchedule {
  day: number
  label: string
  ranges: DayRange[]
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

function dayLabel(date: Date, locale: string, style: 'short' | 'long', timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone }).format(date)
}

function nextDateForDay(base: Date, targetDay: number, timeZone?: string): Date {
  const dayDiff = (targetDay - base.getDay() + 7) % 7
  const result = new Date(base.getTime() + dayDiff * 24 * 60 * 60 * 1000)
  if (!timeZone) return result

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

function rotateDays(days: DaySchedule[], startOfWeek: number): DaySchedule[] {
  if (startOfWeek === 0) return days
  const idx = days.findIndex((d) => d.day === startOfWeek)
  if (idx === -1) return days
  return [...days.slice(idx), ...days.slice(0, idx)]
}

function buildSchedule(
  openingHours: opening_hours,
  now: Date,
  opts: {
    locale: string
    timeZone?: string
    dayLabelStyle: 'short' | 'long'
    hourCycle: '12h' | '24h'
    lookaheadDays: number
    startOfWeek: number
  },
): DaySchedule[] {
  const windowStart = startOfDay(now, opts.timeZone)
  const end = new Date(windowStart.getTime() + opts.lookaheadDays * 24 * 60 * 60 * 1000)
  const intervals = openingHours.getOpenIntervals(windowStart, end)

  const schedule = new Map<number, DaySchedule>()

  for (const interval of intervals) {
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
        const label = dayLabel(dayStart, opts.locale, opts.dayLabelStyle, opts.timeZone)
        const range: DayRange = {
          start: formatTime(rangeStart, opts.locale, opts.timeZone, opts.hourCycle),
          end: formatTime(rangeEnd, opts.locale, opts.timeZone, opts.hourCycle),
          comment: comment || undefined,
        }

        const entry = schedule.get(day) ?? { day, label, ranges: [] }
        entry.ranges.push(range)
        schedule.set(day, entry)
      }

      if (dayEnd.getTime() === cursor.getTime()) break
      cursor = dayEnd
    }
  }

  for (let day = 0; day < 7; day++) {
    if (!schedule.has(day)) {
      const dateForLabel = nextDateForDay(now, day, opts.timeZone)
      schedule.set(day, {
        day,
        label: dayLabel(dateForLabel, opts.locale, opts.dayLabelStyle, opts.timeZone),
        ranges: [],
      })
    }
  }

  const ordered = Array.from(schedule.values()).sort((a, b) => a.day - b.day)
  return rotateDays(ordered, opts.startOfWeek)
}

function resolveLocale(locale: string): string {
  try {
    new Intl.DateTimeFormat(locale)
    return locale
  } catch {
    return 'en'
  }
}

function inferHourCycle(locale: string): '12h' | '24h' {
  try {
    const resolved = new Intl.DateTimeFormat(locale, { hour: 'numeric' })
      .resolvedOptions() as Intl.ResolvedDateTimeFormatOptions & { hourCycle?: string }
    if (resolved.hourCycle === 'h11' || resolved.hourCycle === 'h12') return '12h'
    return '24h'
  } catch {
    return '24h'
  }
}

export function OpeningHoursSchedule({
  openingHours,
  locale = 'en',
  dayLabelStyle = 'short',
  timeZone,
  hourCycle,
  now,
  firstDayOfWeek: startOfWeek = 1,
  className = '',
}: OpeningHoursScheduleProps) {
  const currentTime = now ?? new Date()
  const safeLocale = useMemo(() => resolveLocale(locale), [locale])
  const effectiveHourCycle = hourCycle ?? inferHourCycle(safeLocale)

  const intervals = useMemo(() => {
    if (!openingHours) return []
    try {
      return buildSchedule(openingHours, currentTime, {
        locale: safeLocale,
        timeZone,
        dayLabelStyle,
        hourCycle: effectiveHourCycle,
        lookaheadDays: 7,
        startOfWeek,
      })
    } catch {
      return []
    }
  }, [openingHours, currentTime, safeLocale, timeZone, dayLabelStyle, effectiveHourCycle, startOfWeek])

  const today = currentTime.getDay()

  return (
    <div className={`opening-hours-schedule ${className}`.trim()}>
      {intervals.map((day) => {
        const isToday = day.day === today
        const ranges = day.ranges.length > 0 ? day.ranges.map((r) => `${r.start}–${r.end}`).join(', ') : 'Closed'

        return (
          <div key={day.day} className={`opening-hours-schedule-row ${isToday ? 'today' : ''}`.trim()}>
            <span>{day.label}</span>
            <span>{ranges}</span>
          </div>
        )
      })}
    </div>
  )
}
