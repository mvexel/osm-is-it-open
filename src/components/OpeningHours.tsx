import { useMemo } from 'react'
import type { OpeningHoursProps } from './types'
import { OpeningHoursEditor } from './OpeningHoursEditor'
import '../styles.css'

type OpeningStatus = 'open' | 'closed' | 'unknown'

function getTranslator(): (key: string, defaults?: string) => string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const i18next = require('i18next')
    if (i18next?.t) {
      return (key: string, defaults?: string) => i18next.t(key, { defaultValue: defaults ?? key })
    }
  } catch {
    // i18next not available, fall back to defaults
  }
  return (_key: string, defaults?: string) => defaults ?? ''
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

function buildLabel(
  status: OpeningStatus,
  nextChange: Date | undefined,
  opts: { locale: string; timeZone?: string; hourCycle: '12h' | '24h'; baseDate: Date },
  translate: (key: string, defaults?: string) => string,
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
    return withDay
      ? translate('opening_hours.open_until', `Open until ${withDay}`)
      : translate('opening_hours.open_now', 'Open now')
  }
  if (status === 'closed') {
    return withDay
      ? translate('opening_hours.closed_opens', `Closed • opens ${withDay}`)
      : translate('opening_hours.closed', 'Closed')
  }
  return translate('opening_hours.unknown', 'Hours unavailable')
}

export function OpeningHours({
  openingHours,
  locale = 'en',
  timeZone,
  hourCycle = '24h',
  now,
  className = '',
  editable = false,
  onChange,
}: OpeningHoursProps) {
  const currentTime = now ?? new Date()
  const translate = useMemo(() => getTranslator(), [])

  const { status, label } = useMemo(() => {
    try {
      const isUnknown = openingHours.getUnknown(currentTime)
      const isOpen = openingHours.getState(currentTime)
      const status: OpeningStatus = isUnknown ? 'unknown' : isOpen ? 'open' : 'closed'
      const nextChange = openingHours.getNextChange(currentTime) ?? undefined
      const label = buildLabel(
        status,
        nextChange,
        {
          locale,
          timeZone,
          hourCycle,
          baseDate: currentTime,
        },
        translate,
      )
      return { status, label }
    } catch {
      return {
        status: 'unknown' as OpeningStatus,
        label: 'Hours unavailable',
      }
    }
  }, [openingHours, currentTime, locale, timeZone, hourCycle, translate])

  if (editable) {
    return (
      <OpeningHoursEditor
        openingHours={openingHours}
        onChange={onChange}
        hourCycle={hourCycle}
        className={className}
      />
    )
  }

  const statusClassName = `opening-hours-badge-${status}`
  const safeLabel = typeof label === 'string' ? label : 'Hours unavailable'
  const labelParts = safeLabel.match(/^(Open until|Closed • opens)\s*(.*)$/i)
  const primary = status === 'open' ? 'Open' : status === 'closed' ? 'Closed' : 'Unknown'
  const secondary = labelParts ? `${labelParts[1]} ${labelParts[2]}` : safeLabel

  return (
    <span className={`opening-hours-badge ${statusClassName} ${className}`}>
      <span className="primary">{primary}</span>
      <span className="secondary">{secondary}</span>
    </span>
  )
}
