import { useEffect, useMemo, useRef, useState } from 'react'
import opening_hours from 'opening_hours'
import type { OpeningHoursEditorProps } from './types'
import { DAY_ORDER, buildOpeningHoursString, parseOpeningHoursModel, normalizeRange, normalizeTimeInput, toMinutes } from '../model'
import type { OpeningHoursModel, OpeningHoursRange } from './openingHoursTypes'
import '../styles.css'

function getOpeningHoursString(oh: opening_hours): string {
  try {
    return oh.prettifyValue() || ''
  } catch {
    return ''
  }
}

type RangeValidation = {
  startInvalid: boolean
  endInvalid: boolean
  orderInvalid: boolean
  overlapInvalid: boolean
}

function getRangeValidation(range: OpeningHoursRange, siblings: OpeningHoursRange[], idx: number): RangeValidation {
  const normalizedStart = normalizeTimeInput(range.start)
  const normalizedEnd = normalizeTimeInput(range.end)
  const startInvalid = !normalizedStart
  const endInvalid = !normalizedEnd
  const startMinutes = normalizedStart ? toMinutes(normalizedStart) : null
  const endMinutes = normalizedEnd ? toMinutes(normalizedEnd) : null

  let orderInvalid = false
  let overlapInvalid = false

  if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
    if (!startInvalid && !endInvalid) {
      orderInvalid = true
    }
  } else {
    siblings.forEach((other, otherIdx) => {
      if (otherIdx === idx) return
      const otherStart = normalizeTimeInput(other.start)
      const otherEnd = normalizeTimeInput(other.end)
      if (!otherStart || !otherEnd) return
      const otherStartMinutes = toMinutes(otherStart)
      const otherEndMinutes = toMinutes(otherEnd)
      if (
        otherStartMinutes !== null &&
        otherEndMinutes !== null &&
        otherStartMinutes < otherEndMinutes &&
        Math.max(startMinutes, otherStartMinutes) < Math.min(endMinutes, otherEndMinutes)
      ) {
        overlapInvalid = true
      }
    })
  }

  return { startInvalid, endInvalid, orderInvalid, overlapInvalid }
}

function modelHasInvalidRange(model: OpeningHoursModel): boolean {
  return model.days.some((day) =>
    day.ranges.some((range, idx) => {
      if (!normalizeRange(range)) return true
      const validation = getRangeValidation(range, day.ranges, idx)
      return validation.startInvalid || validation.endInvalid || validation.orderInvalid || validation.overlapInvalid
    }),
  )
}

function resolveLocale(locale: string): string {
  try {
    new Intl.DateTimeFormat(locale)
    return locale
  } catch {
    return 'en'
  }
}

export function OpeningHoursEditor({
  openingHours,
  onChange,
  locale = 'en',
  dayLabelStyle = 'short',
  className = '',
}: OpeningHoursEditorProps) {
  const initialSource = openingHours ? getOpeningHoursString(openingHours) : ''
  const [model, setModel] = useState<OpeningHoursModel>(() => parseOpeningHoursModel(initialSource))
  const emittedValueRef = useRef<string | null>(initialSource || null)
  const lastSourceRef = useRef(initialSource)

  useEffect(() => {
    const nextSource = openingHours ? getOpeningHoursString(openingHours) : ''
    if (nextSource === lastSourceRef.current) return
    setModel(parseOpeningHoursModel(nextSource))
    lastSourceRef.current = nextSource
    emittedValueRef.current = nextSource || null
  }, [openingHours])

  const safeLocale = useMemo(() => resolveLocale(locale), [locale])
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(safeLocale, { weekday: dayLabelStyle }), [safeLocale, dayLabelStyle])

  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!onChange) return
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    if (modelHasInvalidRange(model)) return
    try {
      const nextFormatted = buildOpeningHoursString(model)
      if (!nextFormatted || nextFormatted === emittedValueRef.current) return
      const next = new opening_hours(nextFormatted)
      emittedValueRef.current = nextFormatted
      onChange(next)
    } catch {
      // ignore until user fixes input
    }
  }, [model, onChange])

  const updateRange = (day: number, idx: number, field: 'start' | 'end', value: string) => {
    // Convert 00:00 to 24:00 for end times (midnight at end of day)
    const actualValue = field === 'end' && value === '00:00' ? '24:00' : value

    setModel((prev) => ({
      ...prev,
      days: prev.days.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.map((range, rangeIdx) =>
              rangeIdx === idx ? { ...range, [field]: actualValue } : range,
            ),
          }
          : entry,
      ),
    }))
  }

  const addRange = (day: number) => {
    setModel((prev) => {
      const entry = prev.days.find((d) => d.day === day)
      const nextRange = { start: '', end: '' }
      const next: OpeningHoursModel = entry
        ? {
          ...prev,
          days: prev.days.map((d) =>
            d.day === day ? { ...d, ranges: [...d.ranges, nextRange] } : d,
          ),
        }
        : {
          ...prev,
          days: [...prev.days, { day, ranges: [nextRange] }],
        }
      return next
    })
  }

  const removeRange = (day: number, idx: number) => {
    setModel((prev) => {
      const next: OpeningHoursModel = {
        ...prev,
        days: prev.days
          .map((entry) =>
            entry.day === day
              ? { ...entry, ranges: entry.ranges.filter((_, rangeIdx) => rangeIdx !== idx) }
              : entry,
          )
          .filter((entry) => entry.ranges.length > 0),
      }
      return next
    })
  }

  return (
    <div className={`opening-hours-editor ${className}`.trim()}>
      {DAY_ORDER.map((dayNumber) => {
        const entry = model.days.find((d) => d.day === dayNumber)
        const ranges = entry?.ranges ?? []
        const dayLabel = dayFormatter.format(new Date(2024, 0, dayNumber === 0 ? 7 : dayNumber))

        return (
          <div key={dayNumber} className="opening-hours-editor-day">
            <span className="opening-hours-editor-label">{dayLabel}</span>
            <div className="opening-hours-editor-day-ranges">
              {ranges.map((range, idx) => {
                const validation = getRangeValidation(range, ranges, idx)
                const startInvalid = validation.startInvalid || validation.orderInvalid
                const endInvalid = validation.endInvalid || validation.orderInvalid
                const overlapInvalid = validation.overlapInvalid

                // Convert 24:00 to 00:00 for display in HTML time input
                const displayEndValue = range.end === '24:00' ? '00:00' : range.end

                return (
                  <div key={`${dayNumber}-${idx}`} className="opening-hours-editor-range">
                    <input
                      type="time"
                      value={range.start}
                      onChange={(e) => updateRange(dayNumber, idx, 'start', e.target.value)}
                      aria-invalid={startInvalid ? 'true' : undefined}
                    />
                    <span className="separator">to</span>
                    <input
                      type="time"
                      value={displayEndValue}
                      onChange={(e) => updateRange(dayNumber, idx, 'end', e.target.value)}
                      aria-invalid={endInvalid ? 'true' : undefined}
                    />
                    <button type="button" className="pill muted" onClick={() => removeRange(dayNumber, idx)}>
                      Remove
                    </button>
                    {overlapInvalid && (
                      <span className="opening-hours-editor-hint">Ranges overlap</span>
                    )}
                  </div>
                )
              })}
              <button type="button" className="pill" onClick={() => addRange(dayNumber)}>
                {ranges.length === 0 ? 'Add hours' : 'Add range'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
