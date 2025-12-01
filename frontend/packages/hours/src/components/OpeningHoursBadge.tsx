import { useEffect, useMemo, useRef, useState } from 'react'
import { formatOpeningHours, type FormatOptions, type OpeningStatus } from '../index'
import { DayRow } from './DayRow'
import {
  buildOpeningHoursString,
  normalizeRange,
  parseOpeningHoursModel,
  DAY_ORDER,
} from '../model'
import type { OpeningHoursDay, OpeningHoursModel, OpeningHoursRange } from './openingHoursTypes'
import {
  additionalRulesLabelStyle,
  additionalRulesStyle,
  additionalRulesTextStyle,
  badgeStyle,
  changedStyle,
  editorStyle,
  invalidStyle,
  outputCodeContainerStyle,
  outputCodeStyle,
  outputContainerStyle,
  outputToggleStyle,
  statusStyles,
} from './styles'

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

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
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
      style={badgeStyle(styles)}
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
    lastEmittedValueRef.current = formatted
    onChange?.(formatted)
  }, [formatted, onChange])

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
      days: prev.days.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ranges: entry.ranges.filter((_, idx) => idx !== rangeIdx),
          }
          : entry
      ).filter(entry => entry.ranges.length > 0)
    }))
    setEditingRange((prev) => (prev && prev.day === day && prev.idx === rangeIdx ? null : prev))
  }

  return (
    <div
      className={className}
      style={editorStyle}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', padding: '4px 6px 8px' }}>
        Opening Hours
      </div>
      {isChanged && (
        <div
          style={changedStyle}
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
          style={invalidStyle}
        >
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

      <div style={additionalRulesStyle}>
        <label style={additionalRulesLabelStyle}>
            <span style={{ fontSize: 13, color: '#475569' }}>Additional rules (e.g. PH off)</span>
            <textarea
              value={model.modifiers.join('; ')}
              onChange={(e) => {
                const newModifiers = e.target.value.split(';').map(s => s.trim()).filter(Boolean);
                updateModel(prev => ({ ...prev, modifiers: newModifiers }));
              }}
              rows={2}
              style={additionalRulesTextStyle}
              placeholder="PH off; SH 10:00-12:00"
            />
        </label>
      </div>

      <div style={outputContainerStyle}>
        <span style={{ fontSize: 11, color: '#475569' }}>OSM output</span>
        <button
          type="button"
          onClick={() => setShowOutput((prev) => !prev)}
          style={outputToggleStyle}
        >
          {showOutput ? 'Hide' : 'Show'}
        </button>
      </div>

      {showOutput && (
        <div
          style={outputCodeContainerStyle}
        >
          <code
            style={outputCodeStyle}
          >
            {formatted || '—'}
          </code>
        </div>
      )}
    </div>
  )
}
