import { useEffect, useMemo, useRef, useState } from 'react'
import opening_hours from 'opening_hours'
import type { OpeningHoursEditorProps } from './types'
import { DayRow } from './DayRow'
import {
  buildOpeningHoursString,
  normalizeRange,
  parseOpeningHoursModel,
  DAY_ORDER,
} from '../model'
import type { OpeningHoursModel, OpeningHoursRange } from './openingHoursTypes'
import '../styles.css'

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

function getOpeningHoursString(oh: opening_hours): string {
  try {
    return oh.prettifyValue() || ''
  } catch {
    return ''
  }
}

export function OpeningHoursEditor({
  openingHours,
  onChange,
  className = '',
  originalOpeningHours,
  hourCycle = '24h',
  osmId,
}: OpeningHoursEditorProps) {
  const editingSource = useMemo(() => (openingHours ? getOpeningHoursString(openingHours) : ''), [openingHours])
  const baselineSource = useMemo(
    () => (originalOpeningHours ? getOpeningHoursString(originalOpeningHours) : editingSource),
    [originalOpeningHours, editingSource],
  )
  const baselineModel = useMemo(() => parseOpeningHoursModel(baselineSource), [baselineSource])
  const baseline = useMemo(() => buildOpeningHoursString(baselineModel), [baselineModel])

  const [model, setModel] = useState<OpeningHoursModel>(() => parseOpeningHoursModel(editingSource))
  const [editingRange, setEditingRange] = useState<{ day: number; idx: number } | null>(null)
  const [showOutput, setShowOutput] = useState(false)
  const formatted = useMemo(() => buildOpeningHoursString(model), [model])
  const lastSyncedSourceRef = useRef<string | null>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const isChanged = formatted !== baseline
  const hasInvalidRanges = useMemo(
    () => model.days.some((entry) => entry.ranges.some((range) => !normalizeRange(range))),
    [model],
  )

  useEffect(() => {
    if (editingSource === lastSyncedSourceRef.current || editingSource === lastEmittedValueRef.current) return
    setModel(parseOpeningHoursModel(editingSource))
    setEditingRange(null)
    lastSyncedSourceRef.current = editingSource
  }, [editingSource])

  useEffect(() => {
    if (lastEmittedValueRef.current === formatted) return
    lastEmittedValueRef.current = formatted

    // Don't emit if we started with null/empty opening hours
    // This prevents emitting "Mo-Su off" for POIs without hours
    if (!openingHours && formatted === 'Mo-Su off') return

    try {
      const newOh = new opening_hours(formatted)
      onChange?.(newOh)
    } catch {
      // Invalid opening hours string, don't emit
    }
  }, [formatted, onChange, openingHours])

  useEffect(() => {
    const hasEntering = model.days.some((d) => d.ranges.some((r) => r.status === 'entering'))
    if (hasEntering) {
      setTimeout(() => {
        updateModel((prev) => ({
          ...prev,
          days: prev.days.map((d) => ({
            ...d,
            ranges: d.ranges.map((r) => {
              if (r.status === 'entering') {
                const { status, ...rest } = r
                return rest
              }
              return r
            }),
          })),
        }))
      }, 100)
    }
  }, [model])

  const updateModel = (updater: (prev: OpeningHoursModel) => OpeningHoursModel): OpeningHoursModel => {
    let nextModel: OpeningHoursModel = model
    setModel((prev) => {
      const next = updater(prev)
      next.days = next.days.sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
      nextModel = next
      return next
    })
    return nextModel
  }

  const resetToBaseline = () => {
    setModel(baselineModel)
    setEditingRange(null)
    lastSyncedSourceRef.current = baselineSource
  }

  const updateRange = (day: number, rangeIdx: number, field: 'start' | 'end', value: string) => {
    updateModel((prev) => ({
      ...prev,
      days: prev.days.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.map((range, idx) => (idx === rangeIdx ? { ...range, [field]: value } : range)),
          }
          : entry,
      ),
    }))
  }

  const addRange = (day: number, insertAfter: number | null = null) => {
    const next = updateModel((prev) => {
      const existing = prev.days.find((entry) => entry.day === day)
      const nextRange: OpeningHoursRange = { start: '09:00', end: '17:00', status: 'entering' }
      if (existing) {
        const insertPos =
          insertAfter === null
            ? existing.ranges.length
            : Math.max(0, Math.min(existing.ranges.length, insertAfter + 1))
        const updatedRanges = [...existing.ranges]
        updatedRanges.splice(insertPos, 0, nextRange)
        return {
          ...prev,
          days: prev.days.map((entry) => (entry.day === day ? { ...entry, ranges: updatedRanges } : entry)),
        }
      }
      return {
        ...prev,
        days: [...prev.days, { day, ranges: [{ ...nextRange }] }],
      }
    })
    const entry = next.days.find((d) => d.day === day)
    if (entry) {
      const insertPos =
        insertAfter === null ? entry.ranges.length - 1 : Math.max(0, Math.min(entry.ranges.length - 1, insertAfter + 1))
      setEditingRange({ day, idx: insertPos })
    }
  }

  const setRangeExiting = (day: number, rangeIdx: number) => {
    updateModel((prev) => ({
      ...prev,
      days: prev.days.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.map((range, idx) => (idx === rangeIdx ? { ...range, status: 'exiting' } : range)),
          }
          : entry,
      ),
    }))
  }

  const removeRange = (day: number, rangeIdx: number) => {
    updateModel((prev) => ({
      ...prev,
      days: prev.days
        .map((entry) =>
          entry.day === day
            ? {
              ...entry,
              ranges: entry.ranges.filter((_, idx) => idx !== rangeIdx),
            }
            : entry,
        )
        .filter((entry) => entry.ranges.length > 0),
    }))
    setEditingRange((prev) => (prev && prev.day === day && prev.idx === rangeIdx ? null : prev))
  }

  return (
    <div className={`opening-hours-editor ${className}`}>
      <div className="header">Opening Hours</div>
      {isChanged && (
        <div className="changed-alert">
          <span>Changed</span>
          <button type="button" onClick={resetToBaseline}>
            Reset to OSM
          </button>
        </div>
      )}
      {hasInvalidRanges && (
        <div className="invalid-alert">
          Some time ranges are invalid (end must be after start); they are ignored in the output.
        </div>
      )}

      {DAY_ORDER.map((dayNumber) => {
        const entry = model.days.find((d) => d.day === dayNumber)
        const ranges = entry?.ranges ?? []
        const baselineRanges = baselineModel.days.find((d) => d.day === dayNumber)?.ranges ?? []
        return (
          <DayRow
            key={dayNumber}
            dayLabel={DAY_LABELS[dayNumber]}
            ranges={ranges}
            baselineRanges={baselineRanges}
            isEditingRange={(idx) => editingRange?.day === dayNumber && editingRange.idx === idx}
            onStartEdit={(idx) => setEditingRange({ day: dayNumber, idx })}
            onChangeStart={(idx, value) => updateRange(dayNumber, idx, 'start', value)}
            onChangeEnd={(idx, value) => updateRange(dayNumber, idx, 'end', value)}
            onSetExiting={(idx: number) => setRangeExiting(dayNumber, idx)}
            onExited={(idx: number) => removeRange(dayNumber, idx)}
            onAddRange={(insertAfter) => addRange(dayNumber, insertAfter)}
            onDone={() => setEditingRange(null)}
            hourCycle={hourCycle}
          />
        )
      })}

      <div className="additional-rules">
        <label>
          <span>Additional rules (e.g. PH off)</span>
          <textarea
            value={model.modifiers.join('; ')}
            onChange={(e) => {
              const newModifiers = e.target.value
                .split(';')
                .map((s) => s.trim())
                .filter(Boolean)
              updateModel((prev) => ({ ...prev, modifiers: newModifiers }))
            }}
            rows={2}
            placeholder="PH off; SH 10:00-12:00"
          />
        </label>
      </div>

      <div className="output-container">
        <span>OSM</span>
        <button type="button" onClick={() => setShowOutput((prev) => !prev)}>
          {showOutput ? 'Hide' : 'Show'}
        </button>
      </div>

      {showOutput && (
        <div className="output-code-container">
          <code className="output-code">{formatted || '—'}</code>
          {osmId && (
            <div className="osm-link">
              <a href={`https://www.openstreetmap.org/${osmId}`} target="_blank" rel="noopener noreferrer">
                View on OpenStreetMap ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
