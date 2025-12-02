import { useEffect, useMemo, useRef, useState } from 'react'
import opening_hours from 'opening_hours'
import type { OpeningHoursEditorProps } from './types'
import { DayRow } from './DayRow'
import { getLocaleStrings } from '../locales'
import {
  buildOpeningHoursString,
  normalizeRange,
  parseOpeningHoursModel,
  DAY_ORDER,
} from '../model'
import type { OpeningHoursModel, OpeningHoursRange } from './openingHoursTypes'
import '../styles.css'

function getOpeningHoursString(oh: opening_hours): string {
  try {
    return oh.prettifyValue() || ''
  } catch {
    return ''
  }
}

type OpeningStatus = 'open' | 'closed' | 'unknown'

type TranslationVars = { time?: string }

function getTranslator(locale: string): (key: string, defaults?: string, vars?: TranslationVars) => string {
  const base = locale?.split('-')[0]?.toLowerCase() ?? 'en'
  const messages = getLocaleStrings(base)

  return (key: string, defaults?: string, vars?: TranslationVars) => {
    const template = messages?.[key.replace('opening_hours.', '') as keyof typeof messages]
    if (!template) return defaults ?? key
    if (vars?.time && template.includes('{time}')) {
      return template.replace('{time}', vars.time)
    }
    return template
  }
}

function formatTime(
  date: Date,
  locale: string,
  timeZone?: string,
  hourCycle?: '12h' | '24h',
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...(hourCycle ? { hour12: hourCycle === '12h' } : {}),
    timeZone,
  })
  return formatter.format(date)
}

export function OpeningHoursEditor({
  openingHours,
  locale = 'en',
  timeZone,
  hourCycle,
  now,
  className = '',
  editable = true,
  onChange,
  originalOpeningHours,
  osmId,
  showAdditionalRules = false,
  rawOsm = false,
  osmReadWrite = false,
}: OpeningHoursEditorProps) {
  const currentTime = now ?? new Date()
  const translate = useMemo(() => getTranslator(locale), [locale])

  // Editor state
  const editingSource = useMemo(() => (openingHours ? getOpeningHoursString(openingHours) : ''), [openingHours])
  const baselineSource = useMemo(
    () => (originalOpeningHours ? getOpeningHoursString(originalOpeningHours) : editingSource),
    [originalOpeningHours, editingSource],
  )
  const baselineModel = useMemo(() => parseOpeningHoursModel(baselineSource), [baselineSource])
  const baseline = useMemo(() => buildOpeningHoursString(baselineModel), [baselineModel])

  const [model, setModel] = useState<OpeningHoursModel>(() => parseOpeningHoursModel(editingSource))
  const [editingRange, setEditingRange] = useState<{ day: number; idx: number } | null>(null)
  const [showInvalidAlert, setShowInvalidAlert] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showChangedAlert, setShowChangedAlert] = useState(false)
  const formatted = useMemo(() => buildOpeningHoursString(model), [model])
  const lastSyncedSourceRef = useRef<string | null>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const isChanged = formatted !== baseline

  useEffect(() => {
    if (editingSource === lastSyncedSourceRef.current || editingSource === lastEmittedValueRef.current) return
    setModel(parseOpeningHoursModel(editingSource))
    setEditingRange(null)
    setShowChangedAlert(false)
    lastSyncedSourceRef.current = editingSource
  }, [editingSource])

  useEffect(() => {
    if (!editable) return
    if (lastEmittedValueRef.current === formatted) return

    // Don't emit if we started with null/empty opening hours
    // This prevents emitting "Mo-Su off" for POIs without hours
    if (!openingHours && formatted === 'Mo-Su off') return

    // Only emit if validation passes
    try {
      const newOh = new opening_hours(formatted)
      lastEmittedValueRef.current = formatted
      onChange?.(newOh)
    } catch {
      // Invalid opening hours string, don't emit
      // Keep lastEmittedValueRef unchanged so we retry on next change
    }
  }, [formatted, onChange, openingHours, editable])

  useEffect(() => {
    if (!editable) {
      setShowInvalidAlert(false)
      setValidationError(null)
      return undefined
    }

    // Check for invalid time ranges first
    const hasInvalidRange = model.days.some((entry) => entry.ranges.some((range) => !normalizeRange(range)))

    // Try to validate with opening_hours.js
    let libraryError: string | null = null
    if (!hasInvalidRange && formatted) {
      try {
        new opening_hours(formatted)
      } catch (error) {
        libraryError = error instanceof Error ? error.message : 'Invalid opening hours format'
      }
    }

    const hasError = hasInvalidRange || libraryError !== null

    if (hasError) {
      // Delay showing the error to avoid flash during typing
      const timeout = setTimeout(() => {
        setShowInvalidAlert(true)
        setValidationError(hasInvalidRange ? 'Invalid time range (end must be after start)' : libraryError)
      }, 500)
      return () => clearTimeout(timeout)
    }
    // Hide immediately when valid
    setShowInvalidAlert(false)
    setValidationError(null)
    return undefined
  }, [model, formatted, editable])

  useEffect(() => {
    if (!editable) {
      setShowChangedAlert(false)
      return undefined
    }

    if (isChanged) {
      // Delay showing the changed alert to avoid flash during typing
      const timeout = setTimeout(() => setShowChangedAlert(true), 300)
      return () => clearTimeout(timeout)
    }
    // Hide immediately when not changed
    setShowChangedAlert(false)
    return undefined
  }, [isChanged, editable])

  useEffect(() => {
    if (!editable) return
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
  }, [model, editable])

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
    setShowChangedAlert(false)
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

  const status = useMemo(() => {
    if (!openingHours) {
      console.log('[OpeningHours] No opening hours provided')
      return 'unknown' as OpeningStatus
    }
    try {
      const isUnknown = openingHours.getUnknown(currentTime)
      const isOpen = openingHours.getState(currentTime)
      return (isUnknown ? 'unknown' : isOpen ? 'open' : 'closed') as OpeningStatus
    } catch (error) {
      console.error('[OpeningHours] Error computing status:', error)
      return 'unknown' as OpeningStatus
    }
  }, [openingHours, currentTime])

  if (editable) {
    // Get localized day names
    const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const getDayLabel = (dayNumber: number): string => {
      // Create a date for a known week (Jan 1-7, 2024 starts on Monday)
      const date = new Date(2024, 0, dayNumber === 0 ? 7 : dayNumber)
      return dayFormatter.format(date)
    }

    return (
      <div
        className={`opening-hours-editor ${className} ${showInvalidAlert ? 'has-error' : showChangedAlert ? 'has-changes' : ''
          }`}
        title={
          showInvalidAlert && validationError
            ? validationError
            : showChangedAlert
              ? 'Click Reset to restore original values'
              : undefined
        }
      >
        <div className="header">
          Opening Hours
          {showChangedAlert && (
            <button type="button" onClick={resetToBaseline} className="reset-button">
              Reset to OSM
            </button>
          )}
        </div>

        {DAY_ORDER.map((dayNumber) => {
          const entry = model.days.find((d) => d.day === dayNumber)
          const ranges = entry?.ranges ?? []
          const baselineRanges = baselineModel.days.find((d) => d.day === dayNumber)?.ranges ?? []
          return (
            <DayRow
              key={dayNumber}
              dayLabel={getDayLabel(dayNumber)}
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

        {showAdditionalRules && (
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
        )}

        {rawOsm && (
          <div className="output-code-container">
            {osmReadWrite ? (
              <textarea
                value={formatted || ''}
                onChange={(e) => {
                  const newValue = e.target.value
                  try {
                    const newOh = new opening_hours(newValue)
                    setModel(parseOpeningHoursModel(newValue))
                    onChange?.(newOh)
                  } catch {
                    // Invalid format, don't update
                  }
                }}
                rows={3}
                className="osm-raw-input"
                placeholder="Mo-Fr 09:00-17:00"
              />
            ) : (
              <code className="output-code">{formatted || '—'}</code>
            )}
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

  // Badge display mode (non-editable)
  const statusClassName = `opening-hours-badge-${status}`
  const primary = status === 'open'
    ? translate('opening_hours.open_now', 'Open').split(' ')[0] // Extract just "Open"
    : status === 'closed'
      ? translate('opening_hours.closed', 'Closed')
      : translate('opening_hours.unknown', 'Unknown')

  // Extract secondary text based on status and next change
  let secondary = ''
  if (status === 'open' || status === 'closed') {
    const nextChange = openingHours?.getNextChange(currentTime)
    if (nextChange) {
      const nextTime = formatTime(nextChange, locale, timeZone, hourCycle)
      const needsDay = nextChange.toLocaleDateString('en-CA', { timeZone }) !== currentTime.toLocaleDateString('en-CA', { timeZone })
      const dayLabel = needsDay
        ? new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone }).format(nextChange)
        : null
      const timeWithDay = needsDay && dayLabel ? `${dayLabel} ${nextTime}` : nextTime

      secondary = status === 'open'
        ? translate('opening_hours.until', 'until {time}', { time: timeWithDay })
        : translate('opening_hours.opens_at', 'opens {time}', { time: timeWithDay })
    } else {
      secondary = 'now'
    }
  }

  return (
    <span className={`opening-hours-badge ${statusClassName} ${className}`}>
      <span className="primary">{primary}</span>
      {secondary && (
        <>
          <br />
          <span className="secondary">{secondary}</span>
        </>
      )}
    </span>
  )
}
