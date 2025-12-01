import { useEffect, useMemo, useRef, useState } from 'react'
import { formatOpeningHours, type FormatOptions, type OpeningStatus } from '../index'
import { DayRow } from './DayRow'
import type { OpeningHoursDay, OpeningHoursModel, OpeningHoursRange } from './openingHoursTypes'

export type { OpeningHoursRange, OpeningHoursDay, OpeningHoursModel } from './openingHoursTypes'

type BadgeProps = {
  openingHours?: string | null
  coords?: [number, number]
  className?: string
} & Pick<
  FormatOptions,
  'locale' | 'timeZone' | 'twelveHourClock' | 'hourCycle' | 'now' | 'lookaheadDays' | 'startOfWeek' | 'countryCode'
>

type EditorProps = {
  value?: string | null
  onChange?: (value: string) => void
  className?: string
  originalValue?: string | null
  hourCycle?: '12h' | '24h'
}

const statusStyles: Record<OpeningStatus, { bg: string; text: string }> = {
  open: { bg: '#dcfce7', text: '#166534' },
  closed: { bg: '#fee2e2', text: '#991b1b' },
  unknown: { bg: '#e5e7eb', text: '#374151' },
}

const DAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0] // Mo-Su
const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

const DAY_OSM_LABELS: Record<number, string> = {
  0: 'Su',
  1: 'Mo',
  2: 'Tu',
  3: 'We',
  4: 'Th',
  5: 'Fr',
  6: 'Sa',
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

function normalizeTimeInput(value: string): string {
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

function toMinutes(value: string): number | null {
  const [h, m] = value.split(':').map((n) => Number(n))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function normalizeRange(
  range: OpeningHoursRange,
): { normalized: OpeningHoursRange; startMinutes: number; endMinutes: number } | null {
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
    endMinutes,
  }
}

function sanitizeRanges(ranges: OpeningHoursRange[]): OpeningHoursRange[] {
  return ranges
    .map(normalizeRange)
    .filter((range): range is { normalized: OpeningHoursRange; startMinutes: number; endMinutes: number } => !!range)
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .map((range) => range.normalized)
}

function rangesEqual(a: OpeningHoursRange[], b: OpeningHoursRange[]): boolean {
  if (a.length !== b.length) return false
  return a.every((range, idx) => range.start === b[idx].start && range.end === b[idx].end)
}

function sortDays(days: OpeningHoursModel): OpeningHoursModel {
  const order = new Map(DAY_ORDER.map((day, idx) => [day, idx]))
  return [...days].sort((a, b) => (order.get(a.day)! - order.get(b.day)!))
}

function buildDayRangeLabel(startIdx: number, endIdx: number): string {
  const startDay = DAY_OSM_LABELS[DAY_ORDER[startIdx]]
  const endDay = DAY_OSM_LABELS[DAY_ORDER[endIdx]]
  return startIdx === endIdx ? startDay : `${startDay}-${endDay}`
}

export function buildOpeningHoursString(model: OpeningHoursModel): string {
  const days = sortDays(model)
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
  if (allOpen) return '24/7'

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

  return segments.join('; ')
}

export function parseOpeningHoursModel(value?: string | null): OpeningHoursModel {
  if (!value) return []
  try {
    const info = formatOpeningHours(value, { hourCycle: '24h', lookaheadDays: 7, startOfWeek: 1 })
    const normalized = (info.normalized ?? value).trim()
    if (normalized === '24/7') {
      return DAY_ORDER.map((day) => ({
        day,
        ranges: [{ start: '00:00', end: '23:59' }],
      }))
    }

    const entries = new Map<number, OpeningHoursRange[]>()
    for (const day of info.intervals ?? []) {
      const ranges = sanitizeRanges(
        day.ranges.map((range) => ({
          start: normalizeTimeInput(range.start),
          end: normalizeTimeInput(range.end),
        })),
      )
      if (ranges.length > 0) {
        entries.set(day.day, ranges)
      }
    }

    return sortDays(
      DAY_ORDER.filter((day) => entries.has(day)).map((day) => ({
        day,
        ranges: entries.get(day) ?? [],
      })),
    )
  } catch {
    return []
  }
}

export function OpeningHoursBadge({
  openingHours,
  coords,
  className = '',
  ...opts
}: BadgeProps) {
  const info =
    (() => {
      try {
        return formatOpeningHours(openingHours, { coords, ...opts })
      } catch {
        return { status: 'unknown' as OpeningStatus, label: 'Hours unavailable', intervals: [] }
      }
    })() ?? { status: 'unknown' as OpeningStatus, label: 'Hours unavailable', intervals: [] }
  const styles = statusStyles[info.status] ?? statusStyles.unknown
  const labelParts = info.label.match(/^(Open until|Closed • opens)\s*(.*)$/i)
  const primary = info.status === 'open' ? 'Open' : info.status === 'closed' ? 'Closed' : 'Unknown'
  const secondary = labelParts ? `${labelParts[1]} ${labelParts[2]}` : info.label

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        padding: '8px 12px',
        borderRadius: '6px',
        background: styles.bg,
        color: styles.text,
        minWidth: '140px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{primary}</span>
      <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, lineHeight: 1.2 }}>
        {secondary}
      </span>
    </span>
  )
}

export function OpeningHoursEditor({ value, onChange, className = '', originalValue, hourCycle = '24h' }: EditorProps) {
  const editingSource = useMemo(() => value ?? originalValue ?? '', [value, originalValue])
  const baselineSource = useMemo(() => originalValue ?? editingSource, [originalValue, editingSource])
  const baselineModel = useMemo(() => parseOpeningHoursModel(baselineSource), [baselineSource])
  const baseline = useMemo(() => buildOpeningHoursString(baselineModel), [baselineModel])

  const [days, setDays] = useState<OpeningHoursModel>(() => parseOpeningHoursModel(editingSource))
  const [editingRange, setEditingRange] = useState<{ day: number; idx: number } | null>(null)
  const [showOutput, setShowOutput] = useState(false)
  const formatted = useMemo(() => buildOpeningHoursString(days), [days])
  const lastSyncedSourceRef = useRef<string | null>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const isChanged = formatted !== baseline
  const hasInvalidRanges = useMemo(
    () => days.some((entry) => entry.ranges.some((range) => !normalizeRange(range))),
    [days],
  )

  useEffect(() => {
    if (editingSource === lastSyncedSourceRef.current || editingSource === lastEmittedValueRef.current) return
    setDays(parseOpeningHoursModel(editingSource))
    setEditingRange(null)
    lastSyncedSourceRef.current = editingSource
  }, [editingSource])

  useEffect(() => {
    lastEmittedValueRef.current = formatted
    onChange?.(formatted)
  }, [formatted, onChange])

  const updateDays = (updater: (prev: OpeningHoursModel) => OpeningHoursModel): OpeningHoursModel => {
    let nextModel: OpeningHoursModel = days
    setDays((prev) => {
      const next = sortDays(updater(prev))
      nextModel = next
      return next
    })
    return nextModel
  }

  const resetToBaseline = () => {
    setDays(baselineModel)
    setEditingRange(null)
    lastSyncedSourceRef.current = baselineSource
  }

  const updateRange = (day: number, rangeIdx: number, field: 'start' | 'end', value: string) => {
    updateDays((prev) =>
      prev.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.map((range, idx) => (idx === rangeIdx ? { ...range, [field]: value } : range)),
          }
          : entry,
      ),
    )
  }

  const addRange = (day: number, insertAfter: number | null = null) => {
    const next = updateDays((prev) => {
      const existing = prev.find((entry) => entry.day === day)
      const nextRange: OpeningHoursRange = { start: '09:00', end: '17:00' }
      if (existing) {
        const insertPos =
          insertAfter === null
            ? existing.ranges.length
            : Math.max(0, Math.min(existing.ranges.length, insertAfter + 1))
        const updatedRanges = [...existing.ranges]
        updatedRanges.splice(insertPos, 0, nextRange)
        return prev.map((entry) => (entry.day === day ? { ...entry, ranges: updatedRanges } : entry))
      }
      return [...prev, { day, ranges: [{ ...nextRange }] }]
    })
    const entry = next.find((d) => d.day === day)
    if (entry) {
      const insertPos =
        insertAfter === null ? entry.ranges.length - 1 : Math.max(0, Math.min(entry.ranges.length - 1, insertAfter + 1))
      setEditingRange({ day, idx: insertPos })
    }
  }

  const removeRange = (day: number, rangeIdx: number) => {
    updateDays((prev) =>
      prev.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.filter((_, idx) => idx !== rangeIdx),
          }
          : entry,
      ),
    )
    setEditingRange((prev) => (prev && prev.day === day && prev.idx === rangeIdx ? null : prev))
  }
  return (
    <div
      className={className}
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '8px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: '100%',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', padding: '4px 6px 8px' }}>
        Opening hours (click times to edit)
      </div>
      {isChanged && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fef9c3',
            border: '1px solid #fde68a',
            color: '#92400e',
            borderRadius: 8,
            padding: '6px 8px',
            fontSize: 12,
          }}
        >
          <span>Changed</span>
          <button
            type="button"
            onClick={resetToBaseline}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#92400e',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset to OSM
          </button>
        </div>
      )}
      {hasInvalidRanges && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: 8,
            padding: '6px 8px',
            fontSize: 12,
          }}
        >
          Some time ranges are invalid (end must be after start); they are ignored in the output.
        </div>
      )}

      {DAY_ORDER.map((dayNumber) => {
        const entry = days.find((d) => d.day === dayNumber)
        const ranges = entry?.ranges ?? []
        return (
          <DayRow
            key={dayNumber}
            dayLabel={DAY_LABELS[dayNumber]}
            ranges={ranges}
            baselineRanges={baselineModel.find((d) => d.day === dayNumber)?.ranges ?? []}
            isEditingRange={(idx) => editingRange?.day === dayNumber && editingRange.idx === idx}
            onStartEdit={(idx) => setEditingRange({ day: dayNumber, idx })}
            onChangeStart={(idx, value) => updateRange(dayNumber, idx, 'start', value)}
            onChangeEnd={(idx, value) => updateRange(dayNumber, idx, 'end', value)}
            onRemoveRange={(idx) => removeRange(dayNumber, idx)}
            onAddRange={(insertAfter) => addRange(dayNumber, insertAfter)}
            onDone={() => setEditingRange(null)}
            hourCycle={hourCycle}
          />
        )
      })}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <span style={{ fontSize: 11, color: '#475569' }}>OSM output</span>
        <button
          type="button"
          onClick={() => setShowOutput((prev) => !prev)}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#0f172a',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          {showOutput ? 'Hide' : 'Show'}
        </button>
      </div>

      {showOutput && (
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '8px 10px',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minHeight: 44,
          }}
        >
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: '#0f172a',
              wordBreak: 'break-word',
            }}
          >
            {formatted || '—'}
          </code>
        </div>
      )}
    </div>
  )
}
